CREATE OR ALTER PROCEDURE dbo.st_BarbeariaAtendimentoAddUpd @ST_Operacao     Char(1)                    -- { 'I'NICIAR, 'F'INALIZAR atendimento aberto, concluir 'A'GENDAMENTO }
                                                           ,@ID_Atendimento  Integer       = 0    OUTPUT
                                                           ,@ID_Agendamento  Integer       = NULL
                                                           ,@ID_Pessoa       Integer       = NULL
                                                           ,@DT_Atendimento  DateTime      = NULL
                                                           ,@ServicosJson    VarChar(MAX)  = NULL  -- JSON: [{"ID_Servico": 4}]
                                                           ,@ProdutosJson    VarChar(MAX)  = NULL  -- JSON: [{"ID_Produto": 11, "QT_Produto": 2}]
                                                           ,@Forma_Pagamento VarChar(30)   = NULL
                                                           ,@VL_Recebido     Numeric(18,2) = NULL
                                                           ,@SN_Retorno      Char(1)       = 'S'   -- 'N' quando chamada por outra procedure
                                                           ,@Return_Code     Integer       = 0    OUTPUT
                                                           ,@ErrMsg          VarChar(255)  = ''   OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  BEGIN TRY
    DECLARE @NO_Tran           Integer
           ,@ID_PessoaAgendada Integer
           ,@ID_Barbeiro       Integer
           ,@VL_Total          Numeric(18,2)
           ,@VL_Registrado     Numeric(18,2)
           ,@VL_Troco          Numeric(18,2) = 0;

    DECLARE @tbServico TABLE (ID_Servico Integer);
    DECLARE @tbProduto TABLE (ID_Produto Integer
                             ,QT_Produto Integer);

    SELECT @Return_Code = 0
          ,@ErrMsg      = '';

    IF(ISNULL(@ST_Operacao, '') NOT IN ('I', 'F', 'A')) SET @ErrMsg += CHAR(13) + 'ST_Operacao';
    IF(@ST_Operacao = 'F' AND ISNULL(@ID_Atendimento, 0) <= 0) SET @ErrMsg += CHAR(13) + 'ID_Atendimento';
    IF(@ST_Operacao = 'A' AND ISNULL(@ID_Agendamento, 0) <= 0) SET @ErrMsg += CHAR(13) + 'ID_Agendamento';
    IF(@ST_Operacao IN ('I', 'A') AND @DT_Atendimento IS NULL) SET @ErrMsg += CHAR(13) + 'DT_Atendimento';

    IF (@ErrMsg <> '')
    BEGIN
      SET @ErrMsg = 'st_BarbeariaAtendimentoAddUpd. Parametros: ' + CHAR(13) + @ErrMsg;
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@ST_Operacao IN ('F', 'A')
       AND (@VL_Recebido IS NULL
            OR @VL_Recebido < 0
            OR ISNULL(@Forma_Pagamento, '') NOT IN ('PIX', 'CREDITO', 'DEBITO', 'ESPECIE')))
    BEGIN
      SELECT @Return_Code = 2
            ,@ErrMsg      = 'Dados de pagamento inválidos.';
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@ST_Operacao = 'F')
    BEGIN
      SELECT @ServicosJson = ISNULL(NULLIF(LTRIM(RTRIM(@ServicosJson)), ''), '[]')
            ,@ProdutosJson = ISNULL(NULLIF(LTRIM(RTRIM(@ProdutosJson)), ''), '[]');

      IF(ISJSON(@ServicosJson) = 0 OR LEFT(@ServicosJson, 1) <> '['
         OR ISJSON(@ProdutosJson) = 0 OR LEFT(@ProdutosJson, 1) <> '[')
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Dados do atendimento inválidos.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      -- Somente IDs e quantidades vem da requisicao; nomes e precos sempre vem do catalogo.
      INSERT INTO @tbServico (ID_Servico)
      SELECT TRY_CONVERT(Integer, JSON_VALUE([value], '$.ID_Servico'))
      FROM OPENJSON(@ServicosJson);

      INSERT INTO @tbProduto (ID_Produto, QT_Produto)
      SELECT TRY_CONVERT(Integer, JSON_VALUE([value], '$.ID_Produto'))
            ,TRY_CONVERT(Integer, JSON_VALUE([value], '$.QT_Produto'))
      FROM OPENJSON(@ProdutosJson);
    END

    SELECT @NO_Tran = @@TRANCOUNT;
    IF(@NO_Tran = 0) BEGIN TRAN;

    IF(@ST_Operacao = 'I')
    BEGIN
      IF(@ID_Agendamento IS NOT NULL)
      BEGIN
        SELECT @ID_PessoaAgendada = ID_Pessoa
              ,@ID_Barbeiro       = ID_Barbeiro
        FROM dbo.BRBAGE WITH (UPDLOCK, HOLDLOCK)
        WHERE ID_Agendamento = @ID_Agendamento
          AND ST_Agendamento IN ('Confirmado', 'Agendado');

        IF(@ID_PessoaAgendada IS NULL OR @ID_PessoaAgendada <> ISNULL(@ID_Pessoa, @ID_PessoaAgendada))
        BEGIN
          SELECT @Return_Code = 2
                ,@ErrMsg      = 'Agendamento inexistente, encerrado ou de outra pessoa.';
          RAISERROR (@ErrMsg, 18, 1);
        END

        IF(EXISTS(SELECT 1
                  FROM dbo.BRBATD
                  WHERE ID_Agendamento = @ID_Agendamento))
        BEGIN
          SELECT @Return_Code = 2
                ,@ErrMsg      = 'Já existe atendimento para este agendamento.';
          RAISERROR (@ErrMsg, 18, 1);
        END

        SET @ID_Pessoa = @ID_PessoaAgendada;
      END
      ELSE IF(NOT EXISTS(SELECT 1
                         FROM dbo.BRBPES
                         WHERE ID_Pessoa = @ID_Pessoa
                           AND SN_Ativo  = 'S'))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Pessoa inexistente ou inativa.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      SET @ErrMsg = 'Erro ao incluir na tabela BRBATD.';
      INSERT INTO dbo.BRBATD (ID_Agendamento, ID_Pessoa, ID_Barbeiro, DT_Servico)
      VALUES (@ID_Agendamento, @ID_Pessoa, @ID_Barbeiro, @DT_Atendimento);

      SET @ID_Atendimento = SCOPE_IDENTITY();
    END

    IF(@ST_Operacao = 'A')
    BEGIN
      -- Concluir agendamento = iniciar o atendimento + finalizar com os servicos e precos reservados.
      SET @ErrMsg = 'Erro ao executar a procedure st_BarbeariaAtendimentoAddUpd.';
      EXEC dbo.st_BarbeariaAtendimentoAddUpd @ST_Operacao    = 'I'
                                            ,@ID_Atendimento = @ID_Atendimento OUTPUT
                                            ,@ID_Agendamento = @ID_Agendamento
                                            ,@DT_Atendimento = @DT_Atendimento
                                            ,@SN_Retorno     = 'N'
                                            ,@Return_Code    = @Return_Code    OUTPUT
                                            ,@ErrMsg         = @ErrMsg         OUTPUT;

      IF (@Return_Code > 0)
      BEGIN
        RAISERROR (@ErrMsg, 18, 1);
      END

      SET @ErrMsg = 'Erro ao incluir na tabela BRBATS.';
      INSERT INTO dbo.BRBATS (ID_Atendimento, ID_Servico, NM_Servico, VL_Servico, QT_Minutos)
      SELECT @ID_Atendimento
            ,BRBSER.ID_Servico
            ,BRBSER.NM_Servico
            ,BRBAGS.VL_Servico
            ,BRBAGS.QT_Minutos
      FROM dbo.BRBAGS
           INNER JOIN dbo.BRBSER
           ON BRBSER.ID_Servico = BRBAGS.ID_Servico
      WHERE BRBAGS.ID_Agendamento = @ID_Agendamento;
    END

    IF(@ST_Operacao = 'F')
    BEGIN
      SELECT @ID_Pessoa      = ID_Pessoa
            ,@ID_Agendamento = ID_Agendamento
      FROM dbo.BRBATD WITH (UPDLOCK, HOLDLOCK)
      WHERE ID_Atendimento = @ID_Atendimento
        AND ST_Atendimento = 'Aberto';

      IF(@ID_Pessoa IS NULL)
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Atendimento não encontrado ou já finalizado.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      IF(EXISTS(SELECT 1
                FROM @tbServico Servico
                     LEFT JOIN dbo.BRBSER
                     ON BRBSER.ID_Servico = Servico.ID_Servico
                    AND BRBSER.SN_Ativo   = 'S'
                WHERE BRBSER.ID_Servico IS NULL)
         OR EXISTS(SELECT 1
                   FROM @tbProduto Produto
                        LEFT JOIN dbo.BRBPRO
                        ON BRBPRO.ID_Produto = Produto.ID_Produto
                       AND BRBPRO.SN_Ativo   = 'S'
                   WHERE BRBPRO.ID_Produto IS NULL
                      OR ISNULL(Produto.QT_Produto, 0) <= 0))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Serviço, produto ou quantidade inválida.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      SET @ErrMsg = 'Erro ao excluir itens das tabelas BRBATS/BRBATP.';
      DELETE FROM dbo.BRBATS WHERE ID_Atendimento = @ID_Atendimento;
      DELETE FROM dbo.BRBATP WHERE ID_Atendimento = @ID_Atendimento;

      SET @ErrMsg = 'Erro ao incluir na tabela BRBATS.';
      INSERT INTO dbo.BRBATS (ID_Atendimento, ID_Servico, NM_Servico, VL_Servico, QT_Minutos)
      SELECT @ID_Atendimento
            ,BRBSER.ID_Servico
            ,BRBSER.NM_Servico
            ,BRBSER.VL_Servico
            ,BRBSER.QT_Minutos
      FROM dbo.BRBSER
      WHERE BRBSER.ID_Servico IN (SELECT ID_Servico FROM @tbServico);

      SET @ErrMsg = 'Erro ao incluir na tabela BRBATP.';
      INSERT INTO dbo.BRBATP (ID_Atendimento, ID_Produto, NM_Produto, QT_Produto, VL_Produto)
      SELECT @ID_Atendimento
            ,BRBPRO.ID_Produto
            ,BRBPRO.NM_Produto
            ,SUM(Produto.QT_Produto)
            ,BRBPRO.VL_Produto
      FROM @tbProduto Produto
           INNER JOIN dbo.BRBPRO
           ON BRBPRO.ID_Produto = Produto.ID_Produto
      GROUP BY BRBPRO.ID_Produto, BRBPRO.NM_Produto, BRBPRO.VL_Produto;
    END

    IF(@ST_Operacao IN ('F', 'A'))
    BEGIN
      SELECT @VL_Total = ISNULL((SELECT SUM(VL_Servico) FROM dbo.BRBATS WHERE ID_Atendimento = @ID_Atendimento), 0)
                       + ISNULL((SELECT SUM(VL_Produto * QT_Produto) FROM dbo.BRBATP WHERE ID_Atendimento = @ID_Atendimento), 0);

      IF(@VL_Total <= 0 OR (@Forma_Pagamento <> 'ESPECIE' AND @VL_Recebido > @VL_Total))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Total inválido ou recebido superior ao total.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      -- Troco em especie nao entra como receita.
      SELECT @VL_Registrado = CASE WHEN @VL_Recebido > @VL_Total THEN @VL_Total ELSE @VL_Recebido END
            ,@VL_Troco      = CASE WHEN @VL_Recebido > @VL_Total THEN @VL_Recebido - @VL_Total ELSE 0 END;

      SET @ErrMsg = 'Erro ao atualizar a tabela BRBATD.';
      UPDATE dbo.BRBATD
         SET VL_Total        = @VL_Total
            ,VL_Recebido     = 0
            ,VL_Pendente     = @VL_Total
            ,Forma_Pagamento = @Forma_Pagamento
            ,ST_Atendimento  = 'Finalizado'
            ,DH_Finalizacao  = GETDATE()
            ,DH_Alteracao    = GETDATE()
      WHERE ID_Atendimento = @ID_Atendimento;

      IF(@VL_Registrado > 0)
      BEGIN
        SET @ErrMsg = 'Erro ao executar a procedure st_BarbeariaPagamentoAdd.';
        EXEC dbo.st_BarbeariaPagamentoAdd @ID_Atendimento  = @ID_Atendimento
                                         ,@VL_Pagamento    = @VL_Registrado
                                         ,@Forma_Pagamento = @Forma_Pagamento
                                         ,@SN_Retorno      = 'N'
                                         ,@Return_Code     = @Return_Code OUTPUT
                                         ,@ErrMsg          = @ErrMsg      OUTPUT;

        IF (@Return_Code > 0)
        BEGIN
          RAISERROR (@ErrMsg, 18, 1);
        END
      END

      IF(@ID_Agendamento IS NOT NULL)
      BEGIN
        SET @ErrMsg = 'Erro ao atualizar a tabela BRBAGE.';
        UPDATE dbo.BRBAGE
           SET ST_Agendamento = 'Finalizado'
              ,DH_Alteracao   = GETDATE()
        WHERE ID_Agendamento = @ID_Agendamento;
      END
    END

    IF(@NO_Tran = 0) AND (@@TRANCOUNT > 0) COMMIT TRAN;

    IF(@SN_Retorno = 'S')
    BEGIN
      SELECT ID_Atendimento
            ,ID_Pessoa
            ,ID_Agendamento
            ,DT_Servico     AS DT_Atendimento
            ,VL_Total
            ,VL_Recebido
            ,VL_Pendente
            ,Forma_Pagamento
            ,@VL_Troco      AS VL_Troco
            ,ST_Atendimento
      FROM dbo.BRBATD WITH (NOLOCK)
      WHERE ID_Atendimento = @ID_Atendimento;
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
