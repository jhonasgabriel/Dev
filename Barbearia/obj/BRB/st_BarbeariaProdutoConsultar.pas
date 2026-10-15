CREATE OR ALTER PROCEDURE dbo.st_BarbeariaProdutoConsultar @ID_Produto  Integer      = NULL
                                                          ,@NM_Produto  VarChar(80)  = NULL
                                                          ,@SN_Ativo    Char(1)      = NULL  -- NULL para todos os status
                                                          ,@Return_Code Integer      = 0     OUTPUT
                                                          ,@ErrMsg      VarChar(255) = ''    OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    SELECT @Return_Code = 0
          ,@ErrMsg      = '';

    SELECT @NM_Produto = NULLIF(LTRIM(RTRIM(@NM_Produto)), '');

    -- Por nome: ativo primeiro e, entre inativos, o mais recente.
    SELECT ID_Produto
          ,NM_Produto
          ,VL_Produto
          ,NM_Marca
          ,DS_Produto
          ,DS_Imagem
          ,SN_Ativo
    FROM dbo.BRBPRO WITH (NOLOCK)
    WHERE (@ID_Produto IS NULL OR ID_Produto = @ID_Produto)
      AND (@NM_Produto IS NULL OR LTRIM(RTRIM(NM_Produto)) = @NM_Produto)
      AND (@SN_Ativo   IS NULL OR SN_Ativo = @SN_Ativo)
    ORDER BY NM_Produto
            ,CASE WHEN SN_Ativo = 'S' THEN 0 ELSE 1 END
            ,ID_Produto DESC;

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
