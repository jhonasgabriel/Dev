CREATE OR ALTER PROCEDURE dbo.st_BarbeariaLogin @ST_Operacao Char(1)      = 'L'  -- 'L'OGIN: credencial pelo nome digitado na tela (NM_Pessoa);
                                                                          -- 'V'ALIDAR: credencial atual do token (ID_Usuario);
                                               ,@NM_Pessoa   VarChar(50)  = NULL
                                               ,@ID_Usuario  Integer      = NULL
                                               ,@Return_Code Integer      = 0     OUTPUT
                                               ,@ErrMsg      VarChar(255) = ''    OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  -- Somente Admin ('A') e Barbeiro ('B') com senha definida e pessoa ativa (dbo.vw_BarbeariaUsuarioAtivo).
  -- Nome e senha precisam pertencer a mesma pessoa: a credencial e localizada pelo nome exato digitado e a API
  -- confere a senha somente contra o hash DESSA pessoa (PasswordHasher/PBKDF2). Nome inexistente nao retorna linha
  -- e a API responde "Nome ou senha invalidos", sem revelar qual dos dois esta incorreto.
  BEGIN TRY
    SELECT @Return_Code = 0
          ,@ErrMsg      = '';

    IF(ISNULL(@ST_Operacao, '') NOT IN ('L', 'V')) SET @ErrMsg += CHAR(13) + 'ST_Operacao';
    IF(@ST_Operacao = 'L' AND ISNULL(LTRIM(RTRIM(@NM_Pessoa)), '') = '') SET @ErrMsg += CHAR(13) + 'NM_Pessoa';
    IF(@ST_Operacao = 'V' AND ISNULL(@ID_Usuario, 0) <= 0) SET @ErrMsg += CHAR(13) + 'ID_Usuario';

    IF (@ErrMsg <> '')
    BEGIN
      SET @ErrMsg = 'st_BarbeariaLogin. Parametros: ' + CHAR(13) + @ErrMsg;
      RAISERROR (@ErrMsg, 18, 1);
    END

    SELECT ID_Usuario
          ,ID_Pessoa
          ,NM_Pessoa AS NM_Usuario
          ,NM_Perfil AS TP_Usuario
          ,DS_SenhaHash
    FROM dbo.vw_BarbeariaUsuarioAtivo
    WHERE (@ST_Operacao = 'L' AND NM_Pessoa = LTRIM(RTRIM(@NM_Pessoa)))
       OR (@ST_Operacao = 'V' AND ID_Usuario = @ID_Usuario);

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
