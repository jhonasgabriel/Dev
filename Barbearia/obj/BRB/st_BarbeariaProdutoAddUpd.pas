CREATE OR ALTER PROCEDURE dbo.st_BarbeariaProdutoAddUpd @ST_Operacao  Char(1)                    -- { 'I'NSERT, 'U'PDATE, 'S'TATUS, i'M'AGEM }
                                                       ,@ID_Produto  Integer       = 0    OUTPUT
                                                       ,@NM_Produto  VarChar(80)   = NULL
                                                       ,@VL_Produto  Numeric(18,2) = NULL
                                                       ,@NM_Marca    VarChar(80)   = NULL
                                                       ,@DS_Produto  VarChar(255)  = NULL
                                                       ,@DS_Imagem   VarChar(300)  = NULL
                                                       ,@SN_Ativo    Char(1)       = NULL
                                                       ,@Return_Code Integer       = 0    OUTPUT
                                                       ,@ErrMsg      VarChar(255)  = ''   OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  BEGIN TRY
    DECLARE @NO_Tran Integer;

    SELECT @Return_Code = 0
          ,@ErrMsg      = '';

    IF(ISNULL(@ST_Operacao, '') NOT IN ('I', 'U', 'S', 'M')) SET @ErrMsg += CHAR(13) + 'ST_Operacao';
    IF(@ST_Operacao IN ('U', 'S', 'M') AND ISNULL(@ID_Produto, 0) <= 0) SET @ErrMsg += CHAR(13) + 'ID_Produto';
    IF(@ST_Operacao = 'S' AND ISNULL(@SN_Ativo, '') NOT IN ('S', 'N')) SET @ErrMsg += CHAR(13) + 'SN_Ativo';
    IF(@ST_Operacao = 'M' AND ISNULL(@DS_Imagem, '') = '') SET @ErrMsg += CHAR(13) + 'DS_Imagem';

    IF (@ErrMsg <> '')
    BEGIN
      SET @ErrMsg = 'st_BarbeariaProdutoAddUpd. Parametros: ' + CHAR(13) + @ErrMsg;
      RAISERROR (@ErrMsg, 18, 1);
    END

    SELECT @NM_Produto = LTRIM(RTRIM(@NM_Produto))
          ,@NM_Marca   = NULLIF(LTRIM(RTRIM(@NM_Marca)), '')
          ,@DS_Produto = NULLIF(LTRIM(RTRIM(@DS_Produto)), '');

    IF(@ST_Operacao IN ('I', 'U') AND (ISNULL(@NM_Produto, '') = '' OR ISNULL(@VL_Produto, 0) <= 0))
    BEGIN
      SELECT @Return_Code = 2
            ,@ErrMsg      = 'Dados do produto inválidos.';
      RAISERROR (@ErrMsg, 18, 1);
    END

    SELECT @NO_Tran = @@TRANCOUNT;
    IF(@NO_Tran = 0) BEGIN TRAN;

    IF(@ST_Operacao IN ('U', 'S', 'M')
       AND NOT EXISTS(SELECT 1
                      FROM dbo.BRBPRO WITH (UPDLOCK, HOLDLOCK)
                      WHERE ID_Produto = @ID_Produto))
    BEGIN
      SELECT @Return_Code = 2
            ,@ErrMsg      = 'Produto não encontrado.';
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@ST_Operacao IN ('I', 'U')
       AND EXISTS(SELECT 1
                  FROM dbo.BRBPRO WITH (UPDLOCK, HOLDLOCK)
                  WHERE LTRIM(RTRIM(NM_Produto)) = @NM_Produto
                    AND ID_Produto              <> ISNULL(@ID_Produto, 0)))
    BEGIN
      SELECT @Return_Code = 2
            ,@ErrMsg      = 'Nome já cadastrado.';
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@ST_Operacao = 'I')
    BEGIN
      SET @ErrMsg = 'Erro ao incluir na tabela BRBPRO.';
      INSERT INTO dbo.BRBPRO (NM_Produto, VL_Produto, NM_Marca, DS_Produto)
      VALUES (@NM_Produto, @VL_Produto, @NM_Marca, @DS_Produto);

      SET @ID_Produto = SCOPE_IDENTITY();
    END

    IF(@ST_Operacao = 'U')
    BEGIN
      SET @ErrMsg = 'Erro ao atualizar a tabela BRBPRO.';
      UPDATE dbo.BRBPRO
         SET NM_Produto   = @NM_Produto
            ,VL_Produto   = @VL_Produto
            ,NM_Marca     = @NM_Marca
            ,DS_Produto   = @DS_Produto
            ,DH_Alteracao = GETDATE()
      WHERE ID_Produto = @ID_Produto;
    END

    IF(@ST_Operacao = 'S')
    BEGIN
      SET @ErrMsg = 'Erro ao atualizar a tabela BRBPRO.';
      UPDATE dbo.BRBPRO
         SET SN_Ativo     = @SN_Ativo
            ,DH_Alteracao = GETDATE()
      WHERE ID_Produto = @ID_Produto;
    END

    IF(@ST_Operacao = 'M')
    BEGIN
      SET @ErrMsg = 'Erro ao atualizar a tabela BRBPRO.';
      UPDATE dbo.BRBPRO
         SET DS_Imagem    = @DS_Imagem
            ,DH_Alteracao = GETDATE()
      WHERE ID_Produto = @ID_Produto;
    END

    IF(@NO_Tran = 0) AND (@@TRANCOUNT > 0) COMMIT TRAN;

    IF(@ST_Operacao = 'I')
    BEGIN
      SELECT ID_Produto
            ,NM_Produto
            ,VL_Produto
            ,NM_Marca
            ,DS_Produto
            ,DS_Imagem
            ,SN_Ativo
      FROM dbo.BRBPRO WITH (NOLOCK)
      WHERE ID_Produto = @ID_Produto;
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
