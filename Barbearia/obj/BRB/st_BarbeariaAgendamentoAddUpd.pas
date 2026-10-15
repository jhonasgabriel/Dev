CREATE OR ALTER PROCEDURE dbo.st_BarbeariaAgendamentoAddUpd @ST_Operacao    Char(1)                    -- { 'I'NSERT, 'C'ANCELAR }
                                                           ,@ID_Agendamento Integer      = 0    OUTPUT
                                                           ,@DT_Agendamento DateTime     = NULL
                                                           ,@HR_Agendamento Time         = NULL
                                                           ,@ID_Servico     VarChar(MAX) = NULL  -- JSON: [4, 5]
                                                           ,@ID_Pessoa      Integer      = NULL  -- Nulo: localiza/cadastra o cliente pelo telefone
                                                           ,@ID_Barbeiro    Integer      = NULL  -- Nulo: profissional disponivel sorteado
                                                           ,@NM_Cliente     VarChar(50)  = NULL
                                                           ,@NO_Telefone    VarChar(20)  = NULL
                                                           ,@ID_Usuario     Integer      = NULL  -- Usuario que cancela
                                                           ,@Return_Code    Integer      = 0    OUTPUT
                                                           ,@ErrMsg         VarChar(255) = ''   OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  BEGIN TRY
    DECLARE @NO_Tran           Integer
           ,@ID_BarbeiroAgenda Integer
           ,@ID_Horario        Integer
           ,@QT_Tempo          Integer
           ,@VL_Total          Numeric(18,2)
           ,@DT_Data           Date
           ,@Dia_Semana        Integer
           ,@Zero              Time = '00:00'
           ,@SG_Inicio         Integer
           ,@SG_Fim            Integer;

    DECLARE @tbServico TABLE (ID_Servico Integer PRIMARY KEY);

    SELECT @Return_Code = 0
          ,@ErrMsg      = '';

    IF(ISNULL(@ST_Operacao, '') NOT IN ('I', 'C')) SET @ErrMsg += CHAR(13) + 'ST_Operacao';
    IF(@ST_Operacao = 'C' AND ISNULL(@ID_Agendamento, 0) <= 0) SET @ErrMsg += CHAR(13) + 'ID_Agendamento';
    IF(@ST_Operacao = 'C' AND ISNULL(@ID_Usuario, 0) <= 0) SET @ErrMsg += CHAR(13) + 'ID_Usuario';

    IF (@ErrMsg <> '')
    BEGIN
      SET @ErrMsg = 'st_BarbeariaAgendamentoAddUpd. Parametros: ' + CHAR(13) + @ErrMsg;
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@ST_Operacao = 'I')
    BEGIN
      IF(@DT_Agendamento IS NULL
         OR @HR_Agendamento IS NULL
         OR ISJSON(ISNULL(@ID_Servico, '')) = 0
         OR LEFT(LTRIM(@ID_Servico), 1) <> '['
         OR EXISTS(SELECT 1
                   FROM OPENJSON(@ID_Servico)
                   WHERE [type] <> 2
                      OR TRY_CONVERT(Integer, [value]) IS NULL))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Informe data, horário e ao menos um serviço válido.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      INSERT INTO @tbServico (ID_Servico)
      SELECT DISTINCT CONVERT(Integer, [value])
      FROM OPENJSON(@ID_Servico);

      IF(@@ROWCOUNT = 0)
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Informe data, horário e ao menos um serviço válido.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      SELECT @DT_Data    = CONVERT(Date, @DT_Agendamento)
            ,@Dia_Semana = DATEDIFF(DAY, '19000107', CONVERT(Date, @DT_Agendamento)) % 7
            ,@SG_Inicio  = DATEDIFF(SECOND, @Zero, @HR_Agendamento);
    END

    SELECT @NO_Tran = @@TRANCOUNT;
    IF(@NO_Tran = 0) BEGIN TRAN;

    IF(@ST_Operacao = 'I')
    BEGIN
      -- O bloqueio do horario global do dia serializa reservas e bloqueios antes da verificacao de conflitos.
      SELECT @ID_Horario = ID_Horario
      FROM dbo.BRBHOR WITH (UPDLOCK, HOLDLOCK)
      WHERE ID_Barbeiro IS NULL
        AND Dia_Semana  = @Dia_Semana;

      IF(EXISTS(SELECT 1
                FROM @tbServico Servico
                     LEFT JOIN dbo.BRBSER
                     ON BRBSER.ID_Servico = Servico.ID_Servico
                    AND BRBSER.SN_Ativo   = 'S'
                WHERE BRBSER.ID_Servico IS NULL))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Serviço inexistente ou inativo.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      SELECT @QT_Tempo = SUM(BRBSER.QT_Minutos)
            ,@VL_Total = SUM(BRBSER.VL_Servico)
      FROM dbo.BRBSER
           INNER JOIN @tbServico Servico
           ON Servico.ID_Servico = BRBSER.ID_Servico;

      SET @SG_Fim = @SG_Inicio + (@QT_Tempo * 60);

      IF(DATEADD(SECOND, @SG_Inicio, CONVERT(DateTime, @DT_Data)) <= GETDATE())
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Horário já passou. Escolha outro horário.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      IF(@ID_Barbeiro IS NOT NULL
         AND EXISTS(SELECT 1
                    FROM @tbServico Servico
                    WHERE NOT EXISTS(SELECT 1
                                     FROM dbo.BRBUSS
                                     WHERE BRBUSS.ID_Usuario = @ID_Barbeiro
                                       AND BRBUSS.ID_Servico = Servico.ID_Servico)))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'O profissional escolhido não realiza todos os serviços selecionados.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      -- Profissional no proprio expediente, que realiza todos os servicos, sem reserva nem bloqueio no intervalo.
      -- Agendamentos antigos sem profissional continuam bloqueando o horario de todos.
      SELECT TOP 1
             @ID_BarbeiroAgenda = Expediente.ID_Usuario
      FROM dbo.fn_BarbeariaExpediente(@Dia_Semana) Expediente
      WHERE (@ID_Barbeiro IS NULL OR Expediente.ID_Usuario = @ID_Barbeiro)
        AND @SG_Inicio >= Expediente.SG_Abertura
        AND @SG_Fim    <= Expediente.SG_Fechamento
        AND (@SG_Inicio - Expediente.SG_Abertura) % 1800 = 0
        AND NOT (Expediente.SG_Inicio_Almoco IS NOT NULL
                 AND @SG_Inicio < Expediente.SG_Fim_Almoco
                 AND @SG_Fim    > Expediente.SG_Inicio_Almoco)
        AND NOT EXISTS(SELECT 1
                       FROM @tbServico Servico
                       WHERE NOT EXISTS(SELECT 1
                                        FROM dbo.BRBUSS
                                        WHERE BRBUSS.ID_Usuario = Expediente.ID_Usuario
                                          AND BRBUSS.ID_Servico = Servico.ID_Servico))
        AND NOT EXISTS(SELECT 1
                       FROM dbo.BRBAGE
                       WHERE BRBAGE.DT_Agendamento  = @DT_Data
                         AND BRBAGE.ST_Agendamento <> 'Cancelado'
                         AND (BRBAGE.ID_Barbeiro = Expediente.ID_Usuario OR BRBAGE.ID_Barbeiro IS NULL)
                         AND @SG_Inicio < DATEDIFF(SECOND, @Zero, BRBAGE.HR_Agendamento) + (BRBAGE.QT_Tempo * 60)
                         AND @SG_Fim    > DATEDIFF(SECOND, @Zero, BRBAGE.HR_Agendamento))
        AND NOT EXISTS(SELECT 1
                       FROM dbo.BRBBLO
                       WHERE BRBBLO.DT_Bloqueio = @DT_Data
                         AND BRBBLO.SN_Ativo    = 'S'
                         AND (BRBBLO.ID_Barbeiro IS NULL OR BRBBLO.ID_Barbeiro = Expediente.ID_Usuario)
                         AND @SG_Inicio < DATEDIFF(SECOND, @Zero, BRBBLO.HR_Fim)
                         AND @SG_Fim    > DATEDIFF(SECOND, @Zero, BRBBLO.HR_Inicio))
      ORDER BY NEWID();

      IF(@ID_BarbeiroAgenda IS NULL)
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Nenhum profissional disponível para este horário.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      IF(@ID_Pessoa IS NULL)
      BEGIN
        -- Telefone e a identidade do cliente: reutiliza o cadastro existente ou cadastra.
        SELECT @NO_Telefone = LTRIM(RTRIM(@NO_Telefone));

        SELECT @ID_Pessoa = ID_Pessoa
        FROM dbo.BRBPES WITH (UPDLOCK, HOLDLOCK)
        WHERE NO_Telefone = @NO_Telefone;

        IF(@ID_Pessoa IS NULL)
        BEGIN
          SET @ErrMsg = 'Erro ao executar a procedure st_BarbeariaPessoaAddUpd.';
          EXEC dbo.st_BarbeariaPessoaAddUpd @ST_Operacao = 'I'
                                           ,@ID_Pessoa   = @ID_Pessoa   OUTPUT
                                           ,@NM_Pessoa   = @NM_Cliente
                                           ,@NO_Telefone = @NO_Telefone
                                           ,@TP_Pessoa   = 'C'
                                           ,@SN_Retorno  = 'N'
                                           ,@Return_Code = @Return_Code OUTPUT
                                           ,@ErrMsg      = @ErrMsg      OUTPUT;

          IF (@Return_Code > 0)
          BEGIN
            RAISERROR (@ErrMsg, 18, 1);
          END
        END
      END

      IF(NOT EXISTS(SELECT 1
                    FROM dbo.BRBPES
                    WHERE ID_Pessoa = @ID_Pessoa
                      AND SN_Ativo  = 'S'))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Pessoa inexistente ou inativa.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      SET @ErrMsg = 'Erro ao incluir na tabela BRBAGE.';
      INSERT INTO dbo.BRBAGE (ID_Pessoa, ID_Barbeiro, DT_Agendamento, HR_Agendamento, VL_Total, QT_Tempo, Forma_Pagamento)
      VALUES (@ID_Pessoa, @ID_BarbeiroAgenda, @DT_Data, @HR_Agendamento, @VL_Total, @QT_Tempo, 'NAO_INFORMADO');

      SET @ID_Agendamento = SCOPE_IDENTITY();

      SET @ErrMsg = 'Erro ao incluir na tabela BRBAGS.';
      INSERT INTO dbo.BRBAGS (ID_Agendamento, ID_Servico, VL_Servico, QT_Minutos)
      SELECT @ID_Agendamento
            ,BRBSER.ID_Servico
            ,BRBSER.VL_Servico
            ,BRBSER.QT_Minutos
      FROM dbo.BRBSER
           INNER JOIN @tbServico Servico
           ON Servico.ID_Servico = BRBSER.ID_Servico;
    END

    IF(@ST_Operacao = 'C')
    BEGIN
      -- Admin cancela qualquer agendamento; os demais usuarios somente os proprios.
      IF(NOT EXISTS(SELECT 1
                    FROM dbo.BRBAGE WITH (UPDLOCK, HOLDLOCK)
                    WHERE BRBAGE.ID_Agendamento = @ID_Agendamento
                      AND BRBAGE.ST_Agendamento IN ('Confirmado', 'Agendado')
                      AND EXISTS(SELECT 1
                                 FROM dbo.vw_BarbeariaUsuarioAtivo Usuario
                                 WHERE Usuario.ID_Usuario = @ID_Usuario
                                   AND (Usuario.TP_Pessoa = 'A' OR BRBAGE.ID_Barbeiro = Usuario.ID_Usuario)))
         OR EXISTS(SELECT 1
                   FROM dbo.BRBATD
                   WHERE ID_Agendamento = @ID_Agendamento))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Agendamento não encontrado, sem permissão ou com atendimento iniciado.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      SET @ErrMsg = 'Erro ao atualizar a tabela BRBAGE.';
      UPDATE dbo.BRBAGE
         SET ST_Agendamento = 'Cancelado'
            ,DH_Alteracao   = GETDATE()
      WHERE ID_Agendamento = @ID_Agendamento;
    END

    IF(@NO_Tran = 0) AND (@@TRANCOUNT > 0) COMMIT TRAN;

    IF(@ST_Operacao = 'I')
    BEGIN
      SELECT ID_Agendamento
            ,ID_Pessoa
            ,ID_Barbeiro
            ,DT_Agendamento
            ,HR_Agendamento
            ,VL_Total
            ,QT_Tempo
            ,Forma_Pagamento
            ,ST_Agendamento
      FROM dbo.BRBAGE WITH (NOLOCK)
      WHERE ID_Agendamento = @ID_Agendamento;
    END

    SELECT @Return_Code = 0
          ,@ErrMsg      = '';
  END TRY
  BEGIN CATCH
    IF(@NO_Tran = 0) AND (@@TRANCOUNT > 0) ROLLBACK TRAN;

    SELECT @Return_Code = CASE
                            WHEN @Return_Code = 0 THEN 1 ELSE @Return_Code
                          END
          ,@ErrMsg      = dbo.fn_ErrMsg(@ErrMsg);
  END CATCH

  RETURN;
END
