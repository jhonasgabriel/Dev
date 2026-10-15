CREATE OR ALTER PROCEDURE dbo.st_BarbeariaPagamentoAdd @ID_Atendimento  Integer          = NULL  -- Nulo: debito mais antigo do cliente (ID_Pessoa)
                                                      ,@ID_Pessoa       Integer          = NULL
                                                      ,@VL_Pagamento    Numeric(18,2)
                                                      ,@Forma_Pagamento VarChar(30)
                                                      ,@CD_Chave        UniqueIdentifier = NULL  -- Chave de idempotencia: reenvio nao duplica o pagamento
                                                      ,@SN_Retorno      Char(1)          = 'S'   -- 'N' quando chamada por outra procedure
                                                      ,@ID_Pagamento    Integer          = 0     OUTPUT
                                                      ,@Return_Code     Integer          = 0     OUTPUT
                                                      ,@ErrMsg          VarChar(255)     = ''    OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  BEGIN TRY
    DECLARE @NO_Tran           Integer
           ,@ID_PessoaPagadora Integer
           ,@VL_Saldo          Numeric(18,2);

    SELECT @Return_Code  = 0
          ,@ErrMsg       = ''
          ,@ID_Pagamento = NULL;

    IF(@ID_Atendimento IS NULL AND ISNULL(@ID_Pessoa, 0) <= 0) SET @ErrMsg += CHAR(13) + 'ID_Atendimento/ID_Pessoa';

    IF (@ErrMsg <> '')
    BEGIN
      SET @ErrMsg = 'st_BarbeariaPagamentoAdd. Parametros: ' + CHAR(13) + @ErrMsg;
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(ISNULL(@VL_Pagamento, 0) <= 0
       OR ISNULL(@Forma_Pagamento, '') NOT IN ('PIX', 'CREDITO', 'DEBITO', 'ESPECIE')
       OR @CD_Chave = '00000000-0000-0000-0000-000000000000')
    BEGIN
      SELECT @Return_Code = 2
            ,@ErrMsg      = 'Valor, forma de pagamento ou chave da operação inválida.';
      RAISERROR (@ErrMsg, 18, 1);
    END

    SELECT @NO_Tran = @@TRANCOUNT;
    IF(@NO_Tran = 0) BEGIN TRAN;

    IF(@ID_Atendimento IS NULL)
    BEGIN
      -- Recebimento avulso quita o debito mais antigo do cliente.
      SELECT TOP 1
             @ID_Atendimento    = ID_Atendimento
            ,@ID_PessoaPagadora = ID_Pessoa
            ,@VL_Saldo          = VL_Pendente
      FROM dbo.BRBATD WITH (UPDLOCK, HOLDLOCK)
      WHERE ID_Pessoa      = @ID_Pessoa
        AND ST_Atendimento = 'Finalizado'
        AND VL_Pendente    > 0
      ORDER BY DT_Servico, ID_Atendimento;

      IF(@ID_Atendimento IS NULL)
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Cliente sem débito pendente.';
        RAISERROR (@ErrMsg, 18, 1);
      END
    END
    ELSE
    BEGIN
      SELECT @ID_PessoaPagadora = ID_Pessoa
            ,@VL_Saldo          = VL_Pendente
      FROM dbo.BRBATD WITH (UPDLOCK, HOLDLOCK)
      WHERE ID_Atendimento = @ID_Atendimento
        AND ST_Atendimento = 'Finalizado'
        AND (@ID_Pessoa IS NULL OR ID_Pessoa = @ID_Pessoa);

      IF(@ID_PessoaPagadora IS NULL)
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Atendimento não encontrado.';
        RAISERROR (@ErrMsg, 18, 1);
      END
    END

    IF(@CD_Chave IS NOT NULL)
    BEGIN
      SELECT @ID_Pagamento = ID_Pagamento
      FROM dbo.BRBPAG WITH (UPDLOCK, HOLDLOCK)
      WHERE CD_Chave = @CD_Chave;

      IF(@ID_Pagamento IS NOT NULL
         AND NOT EXISTS(SELECT 1
                        FROM dbo.BRBPAG
                        WHERE ID_Pagamento    = @ID_Pagamento
                          AND ID_Atendimento  = @ID_Atendimento
                          AND VL_Pagamento    = @VL_Pagamento
                          AND Forma_Pagamento = @Forma_Pagamento))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Chave já utilizada com outros dados.';
        RAISERROR (@ErrMsg, 18, 1);
      END
    END

    -- Mesma chave e mesmos dados: operacao ja registrada, nada a gravar.
    IF(@ID_Pagamento IS NULL)
    BEGIN
      IF(@VL_Pagamento > @VL_Saldo)
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Pagamento superior ao saldo pendente.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      SET @ErrMsg = 'Erro ao incluir na tabela BRBPAG.';
      INSERT INTO dbo.BRBPAG (ID_Atendimento, ID_Pessoa, VL_Pagamento, Forma_Pagamento, CD_Chave)
      VALUES (@ID_Atendimento, @ID_PessoaPagadora, @VL_Pagamento, @Forma_Pagamento, @CD_Chave);

      SET @ID_Pagamento = SCOPE_IDENTITY();

      SET @ErrMsg = 'Erro ao atualizar a tabela BRBATD.';
      UPDATE dbo.BRBATD
         SET VL_Pendente  = @VL_Saldo - @VL_Pagamento
            ,VL_Recebido  = VL_Recebido + @VL_Pagamento
            ,DH_Alteracao = GETDATE()
      WHERE ID_Atendimento = @ID_Atendimento;
    END

    IF(@NO_Tran = 0) AND (@@TRANCOUNT > 0) COMMIT TRAN;

    IF(@SN_Retorno = 'S')
    BEGIN
      SELECT ID_Pagamento
            ,ID_Atendimento
            ,ID_Pessoa
            ,VL_Pagamento
            ,Forma_Pagamento
            ,DT_Pagamento
      FROM dbo.BRBPAG WITH (NOLOCK)
      WHERE ID_Pagamento = @ID_Pagamento;
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
