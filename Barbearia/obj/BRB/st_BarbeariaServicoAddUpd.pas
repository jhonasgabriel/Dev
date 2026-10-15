CREATE OR ALTER PROCEDURE dbo.st_BarbeariaServicoAddUpd @ST_Operacao  Char(1)                    -- { 'I'NSERT, 'U'PDATE, 'S'TATUS }
                                                       ,@ID_Servico  Integer       = 0    OUTPUT
                                                       ,@NM_Servico  VarChar(80)   = NULL
                                                       ,@VL_Servico  Numeric(18,2) = NULL
                                                       ,@QT_Minutos  Integer       = NULL
                                                       ,@DS_Servico  VarChar(255)  = NULL
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

    IF(ISNULL(@ST_Operacao, '') NOT IN ('I', 'U', 'S')) SET @ErrMsg += CHAR(13) + 'ST_Operacao';
    IF(@ST_Operacao IN ('U', 'S') AND ISNULL(@ID_Servico, 0) <= 0) SET @ErrMsg += CHAR(13) + 'ID_Servico';
    IF(@ST_Operacao = 'S' AND ISNULL(@SN_Ativo, '') NOT IN ('S', 'N')) SET @ErrMsg += CHAR(13) + 'SN_Ativo';

    IF (@ErrMsg <> '')
    BEGIN
      SET @ErrMsg = 'st_BarbeariaServicoAddUpd. Parametros: ' + CHAR(13) + @ErrMsg;
      RAISERROR (@ErrMsg, 18, 1);
    END

    SELECT @NM_Servico = LTRIM(RTRIM(@NM_Servico))
          ,@DS_Servico = NULLIF(LTRIM(RTRIM(@DS_Servico)), '');

    IF(@ST_Operacao IN ('I', 'U') AND (ISNULL(@NM_Servico, '') = '' OR ISNULL(@VL_Servico, 0) <= 0 OR ISNULL(@QT_Minutos, 0) <= 0))
    BEGIN
      SELECT @Return_Code = 2
            ,@ErrMsg      = 'Dados do serviço inválidos.';
      RAISERROR (@ErrMsg, 18, 1);
    END

    SELECT @NO_Tran = @@TRANCOUNT;
    IF(@NO_Tran = 0) BEGIN TRAN;

    IF(@ST_Operacao IN ('U', 'S')
       AND NOT EXISTS(SELECT 1
                      FROM dbo.BRBSER WITH (UPDLOCK, HOLDLOCK)
                      WHERE ID_Servico = @ID_Servico))
    BEGIN
      SELECT @Return_Code = 2
            ,@ErrMsg      = 'Serviço não encontrado.';
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@ST_Operacao IN ('I', 'U')
       AND EXISTS(SELECT 1
                  FROM dbo.BRBSER WITH (UPDLOCK, HOLDLOCK)
                  WHERE LTRIM(RTRIM(NM_Servico)) = @NM_Servico
                    AND ID_Servico              <> ISNULL(@ID_Servico, 0)))
    BEGIN
      SELECT @Return_Code = 2
            ,@ErrMsg      = 'Nome já cadastrado.';
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@ST_Operacao = 'I')
    BEGIN
      SET @ErrMsg = 'Erro ao incluir na tabela BRBSER.';
      INSERT INTO dbo.BRBSER (NM_Servico, VL_Servico, QT_Minutos, DS_Servico)
      VALUES (@NM_Servico, @VL_Servico, @QT_Minutos, @DS_Servico);

      SET @ID_Servico = SCOPE_IDENTITY();
    END

    IF(@ST_Operacao = 'U')
    BEGIN
      SET @ErrMsg = 'Erro ao atualizar a tabela BRBSER.';
      UPDATE dbo.BRBSER
         SET NM_Servico   = @NM_Servico
            ,VL_Servico   = @VL_Servico
            ,QT_Minutos   = @QT_Minutos
            ,DS_Servico   = @DS_Servico
            ,DH_Alteracao = GETDATE()
      WHERE ID_Servico = @ID_Servico;
    END

    IF(@ST_Operacao = 'S')
    BEGIN
      SET @ErrMsg = 'Erro ao atualizar a tabela BRBSER.';
      UPDATE dbo.BRBSER
         SET SN_Ativo     = @SN_Ativo
            ,DH_Alteracao = GETDATE()
      WHERE ID_Servico = @ID_Servico;
    END

    IF(@NO_Tran = 0) AND (@@TRANCOUNT > 0) COMMIT TRAN;

    IF(@ST_Operacao = 'I')
    BEGIN
      SELECT ID_Servico
            ,NM_Servico
            ,VL_Servico
            ,QT_Minutos
            ,DS_Servico
            ,SN_Ativo
      FROM dbo.BRBSER WITH (NOLOCK)
      WHERE ID_Servico = @ID_Servico;
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
