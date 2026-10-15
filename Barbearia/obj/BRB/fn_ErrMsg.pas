CREATE OR ALTER FUNCTION dbo.fn_ErrMsg (@ErrMsg VarChar(255))
RETURNS VarChar(255)
AS
BEGIN
  -- Usada no BEGIN CATCH das procedures:
  --   regra de negocio (RAISERROR com @ErrMsg) -> devolve a propria mensagem;
  --   erro do SQL Server -> devolve o contexto (@ErrMsg) seguido da mensagem original.
  RETURN LEFT(CASE
                WHEN ERROR_NUMBER() = 50000 OR ISNULL(@ErrMsg, '') = '' THEN ISNULL(ERROR_MESSAGE(), @ErrMsg)
                WHEN ERROR_MESSAGE() IS NULL THEN @ErrMsg
                ELSE @ErrMsg + ' ' + ERROR_MESSAGE()
              END, 255);
END
