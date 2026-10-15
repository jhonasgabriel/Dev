CREATE OR ALTER PROCEDURE dbo.st_BarbeariaAgendaConsultar @ST_Consulta  Char(1)            -- 'D' disponibilidade do dia (DT_Inicial, ID_Servico, ID_Barbeiro);
                                                                                           -- 'A' agendamentos do periodo (DT_Inicial, DT_Final, ID_Barbeiro);
                                                                                           -- 'B' bloqueios ativos do dia (DT_Inicial): gerais e, com ID_Barbeiro, os dele;
                                                         ,@DT_Inicial  DateTime
                                                         ,@DT_Final    DateTime     = NULL
                                                         ,@ID_Servico  VarChar(MAX) = NULL  -- JSON: [4, 5]
                                                         ,@ID_Barbeiro Integer      = NULL
                                                         ,@Return_Code Integer      = 0     OUTPUT
                                                         ,@ErrMsg      VarChar(255) = ''    OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    DECLARE @DT_Data          Date
           ,@Dia_Semana       Integer
           ,@Zero             Time = '00:00'
           ,@QT_Segundos      Integer
           ,@SG_Hora          Integer
           ,@SG_Abertura      Integer
           ,@SG_Fechamento    Integer;

    DECLARE @tbServico    TABLE (ID_Servico Integer PRIMARY KEY);
    DECLARE @tbHorarios   TABLE (SG_Hora Integer PRIMARY KEY);
    DECLARE @tbExpediente TABLE (ID_Usuario       Integer PRIMARY KEY
                                ,SG_Abertura      Integer
                                ,SG_Fechamento    Integer
                                ,SG_Inicio_Almoco Integer
                                ,SG_Fim_Almoco    Integer);

    SELECT @Return_Code = 0
          ,@ErrMsg      = '';

    IF(ISNULL(@ST_Consulta, '') NOT IN ('D', 'A', 'B')) SET @ErrMsg += CHAR(13) + 'ST_Consulta';
    IF(@DT_Inicial IS NULL) SET @ErrMsg += CHAR(13) + 'DT_Inicial';
    IF(@ST_Consulta = 'A' AND @DT_Final IS NULL) SET @ErrMsg += CHAR(13) + 'DT_Final';

    IF (@ErrMsg <> '')
    BEGIN
      SET @ErrMsg = 'st_BarbeariaAgendaConsultar. Parametros: ' + CHAR(13) + @ErrMsg;
      RAISERROR (@ErrMsg, 18, 1);
    END

    SELECT @DT_Data    = CONVERT(Date, @DT_Inicial)
          ,@Dia_Semana = DATEDIFF(DAY, '19000107', CONVERT(Date, @DT_Inicial)) % 7;

    IF(@ST_Consulta = 'D')
    BEGIN
      IF(ISJSON(ISNULL(@ID_Servico, '')) = 0
         OR LEFT(LTRIM(@ID_Servico), 1) <> '['
         OR EXISTS(SELECT 1
                   FROM OPENJSON(@ID_Servico)
                   WHERE [type] <> 2
                      OR TRY_CONVERT(Integer, [value]) IS NULL))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Informe data e ao menos um serviço válido.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      INSERT INTO @tbServico (ID_Servico)
      SELECT DISTINCT CONVERT(Integer, [value])
      FROM OPENJSON(@ID_Servico);

      IF(@@ROWCOUNT = 0
         OR EXISTS(SELECT 1
                   FROM @tbServico Servico
                        LEFT JOIN dbo.BRBSER WITH (NOLOCK)
                        ON BRBSER.ID_Servico = Servico.ID_Servico
                       AND BRBSER.SN_Ativo   = 'S'
                   WHERE BRBSER.ID_Servico IS NULL))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Serviço inexistente ou inativo.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      SELECT @QT_Segundos = SUM(BRBSER.QT_Minutos) * 60
      FROM dbo.BRBSER WITH (NOLOCK)
           INNER JOIN @tbServico Servico
           ON Servico.ID_Servico = BRBSER.ID_Servico;

      -- Profissionais elegiveis: no expediente do dia (personalizado ou global) e que realizam todos os servicos.
      INSERT INTO @tbExpediente (ID_Usuario, SG_Abertura, SG_Fechamento, SG_Inicio_Almoco, SG_Fim_Almoco)
      SELECT Expediente.ID_Usuario
            ,Expediente.SG_Abertura
            ,Expediente.SG_Fechamento
            ,Expediente.SG_Inicio_Almoco
            ,Expediente.SG_Fim_Almoco
      FROM dbo.fn_BarbeariaExpediente(@Dia_Semana) Expediente
      WHERE (@ID_Barbeiro IS NULL OR Expediente.ID_Usuario = @ID_Barbeiro)
        AND NOT EXISTS(SELECT 1
                       FROM @tbServico Servico
                       WHERE NOT EXISTS(SELECT 1
                                        FROM dbo.BRBUSS WITH (NOLOCK)
                                        WHERE BRBUSS.ID_Usuario = Expediente.ID_Usuario
                                          AND BRBUSS.ID_Servico = Servico.ID_Servico));

      -- Grade de 30 minutos entre a primeira abertura e o ultimo fechamento; sem profissional elegivel nao retorna linhas.
      SELECT @SG_Abertura   = MIN(SG_Abertura)
            ,@SG_Fechamento = MAX(SG_Fechamento)
      FROM @tbExpediente;

      SET @SG_Hora = @SG_Abertura;

      WHILE(@SG_Hora < @SG_Fechamento)
      BEGIN
        INSERT INTO @tbHorarios (SG_Hora) VALUES (@SG_Hora);
        SET @SG_Hora = @SG_Hora + 1800;
      END

      SELECT @DT_Inicial                AS DT_Agendamento
            ,CHOOSE(@Dia_Semana + 1, 'Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado') AS NM_Dia_Semana
            ,MONTH(@DT_Inicial)         AS NR_Mes
            ,YEAR(@DT_Inicial)          AS NR_Ano
            ,DATEADD(SECOND, Horario.SG_Hora, @Zero) AS HR_Agendamento
            ,CASE
               WHEN EXISTS(SELECT 1
                           FROM @tbExpediente Expediente
                           WHERE Horario.SG_Hora >= Expediente.SG_Abertura
                             AND Horario.SG_Hora + @QT_Segundos <= Expediente.SG_Fechamento
                             AND (Horario.SG_Hora - Expediente.SG_Abertura) % 1800 = 0
                             AND NOT (Expediente.SG_Inicio_Almoco IS NOT NULL
                                      AND Horario.SG_Hora < Expediente.SG_Fim_Almoco
                                      AND Horario.SG_Hora + @QT_Segundos > Expediente.SG_Inicio_Almoco)
                             AND NOT EXISTS(SELECT 1
                                            FROM dbo.BRBAGE WITH (NOLOCK)
                                            WHERE BRBAGE.DT_Agendamento  = @DT_Data
                                              AND BRBAGE.ST_Agendamento <> 'Cancelado'
                                              AND (BRBAGE.ID_Barbeiro = Expediente.ID_Usuario OR BRBAGE.ID_Barbeiro IS NULL)
                                              AND Horario.SG_Hora < DATEDIFF(SECOND, @Zero, BRBAGE.HR_Agendamento) + (BRBAGE.QT_Tempo * 60)
                                              AND Horario.SG_Hora + @QT_Segundos > DATEDIFF(SECOND, @Zero, BRBAGE.HR_Agendamento))
                             AND NOT EXISTS(SELECT 1
                                            FROM dbo.BRBBLO WITH (NOLOCK)
                                            WHERE BRBBLO.DT_Bloqueio = @DT_Data
                                              AND BRBBLO.SN_Ativo    = 'S'
                                              AND (BRBBLO.ID_Barbeiro IS NULL OR BRBBLO.ID_Barbeiro = Expediente.ID_Usuario)
                                              AND Horario.SG_Hora < DATEDIFF(SECOND, @Zero, BRBBLO.HR_Fim)
                                              AND Horario.SG_Hora + @QT_Segundos > DATEDIFF(SECOND, @Zero, BRBBLO.HR_Inicio))) THEN 'DISPONIVEL'
               ELSE 'INDISPONIVEL'
             END AS ST_Disponibilidade
      FROM @tbHorarios Horario
      ORDER BY Horario.SG_Hora;
    END
    IF(@ST_Consulta = 'A')
    BEGIN
      IF(CONVERT(Date, @DT_Final) < @DT_Data)
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Período inválido.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      SELECT BRBAGE.ID_Agendamento
            ,BRBAGE.ID_Pessoa
            ,BRBAGE.ID_Barbeiro
            ,BRBPES.NM_Pessoa       AS NM_Usuario
            ,Barbeiro.NM_Pessoa     AS NM_Barbeiro
            ,BRBAGE.DT_Agendamento
            ,BRBAGE.HR_Agendamento
            ,BRBAGE.VL_Total
            ,BRBAGE.QT_Tempo        AS QT_Minutos_Total
            ,BRBAGE.Forma_Pagamento
            ,CASE
               WHEN EXISTS(SELECT 1
                           FROM dbo.BRBATD WITH (NOLOCK)
                           WHERE BRBATD.ID_Agendamento = BRBAGE.ID_Agendamento
                             AND BRBATD.ST_Atendimento = 'Finalizado') THEN 'Finalizado'
               ELSE BRBAGE.ST_Agendamento
             END AS ST_Agendamento
            ,(SELECT STRING_AGG(BRBSER.NM_Servico, ', ') WITHIN GROUP (ORDER BY BRBSER.NM_Servico)
              FROM dbo.BRBAGS WITH (NOLOCK)
                   INNER JOIN dbo.BRBSER WITH (NOLOCK)
                   ON BRBSER.ID_Servico = BRBAGS.ID_Servico
              WHERE BRBAGS.ID_Agendamento = BRBAGE.ID_Agendamento) AS DS_Servicos
      FROM dbo.BRBAGE WITH (NOLOCK)
           INNER JOIN dbo.BRBPES WITH (NOLOCK)
           ON BRBPES.ID_Pessoa = BRBAGE.ID_Pessoa
           LEFT JOIN dbo.BRBUSU WITH (NOLOCK)
           ON BRBUSU.ID_Usuario = BRBAGE.ID_Barbeiro
           LEFT JOIN dbo.BRBPES Barbeiro WITH (NOLOCK)
           ON Barbeiro.ID_Pessoa = BRBUSU.ID_Pessoa
      WHERE BRBAGE.DT_Agendamento BETWEEN @DT_Data AND CONVERT(Date, @DT_Final)
        AND (@ID_Barbeiro IS NULL OR BRBAGE.ID_Barbeiro = @ID_Barbeiro)
      ORDER BY BRBAGE.DT_Agendamento, BRBAGE.HR_Agendamento, BRBAGE.ID_Agendamento;
    END

    IF(@ST_Consulta = 'B')
    BEGIN
      SELECT ID_BloqueioHorario
            ,DT_Bloqueio
            ,HR_Inicio
            ,HR_Fim
            ,DS_Motivo
            ,ID_Barbeiro
      FROM dbo.BRBBLO WITH (NOLOCK)
      WHERE DT_Bloqueio = @DT_Data
        AND SN_Ativo    = 'S'
        AND (ID_Barbeiro IS NULL OR ID_Barbeiro = @ID_Barbeiro)
      ORDER BY HR_Inicio;
    END

    SELECT @Return_Code = 0
          ,@ErrMsg      = '';
  END TRY
  BEGIN CATCH
    SELECT @Return_Code = CASE
                            WHEN @Return_Code = 0 THEN 1 ELSE @Return_Code
                          END
          ,@ErrMsg      = dbo.fn_ErrMsg(@ErrMsg);
  END CATCH

  RETURN;
END
