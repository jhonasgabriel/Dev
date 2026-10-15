CREATE OR ALTER PROCEDURE dbo.st_BarbeariaServicoConsultar @ID_Servico  Integer      = NULL
                                                          ,@NM_Servico  VarChar(80)  = NULL
                                                          ,@SN_Ativo    Char(1)      = NULL  -- NULL para todos os status
                                                          ,@Return_Code Integer      = 0     OUTPUT
                                                          ,@ErrMsg      VarChar(255) = ''    OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    SELECT @Return_Code = 0
          ,@ErrMsg      = '';

    SELECT @NM_Servico = NULLIF(LTRIM(RTRIM(@NM_Servico)), '');

    -- Por nome: ativo primeiro e, entre inativos, o mais recente.
    SELECT ID_Servico
          ,NM_Servico
          ,VL_Servico
          ,QT_Minutos
          ,DS_Servico
          ,SN_Ativo
    FROM dbo.BRBSER WITH (NOLOCK)
    WHERE (@ID_Servico IS NULL OR ID_Servico = @ID_Servico)
      AND (@NM_Servico IS NULL OR LTRIM(RTRIM(NM_Servico)) = @NM_Servico)
      AND (@SN_Ativo   IS NULL OR SN_Ativo = @SN_Ativo)
    ORDER BY NM_Servico
            ,CASE WHEN SN_Ativo = 'S' THEN 0 ELSE 1 END
            ,ID_Servico DESC;

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
