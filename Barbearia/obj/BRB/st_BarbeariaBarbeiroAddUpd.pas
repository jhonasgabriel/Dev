CREATE OR ALTER PROCEDURE dbo.st_BarbeariaBarbeiroAddUpd @ST_Operacao           Char(1)                    -- { 'I'NSERT, definir 'P'ASSWORD, 'F'OTO, 'S'ERVICOS realizados }
                                                        ,@ID_Usuario            Integer      = 0    OUTPUT
                                                        ,@NM_Usuario            VarChar(50)  = NULL  -- Nome da pessoa, usado tambem no login
                                                        ,@CD_Inscricao_Nacional Char(11)     = NULL  -- CPF somente numeros
                                                        ,@DT_Nascimento         DateTime     = NULL
                                                        ,@NO_Telefone           VarChar(20)  = NULL
                                                        ,@DS_SenhaHash          VarChar(255) = NULL  -- Somente o hash PBKDF2 gerado pela API
                                                        ,@DS_Imagem             VarChar(300) = NULL
                                                        ,@ID_Servico            VarChar(MAX) = NULL  -- JSON: [4, 5] (lista completa dos servicos realizados)
                                                        ,@Return_Code           Integer      = 0    OUTPUT
                                                        ,@ErrMsg                VarChar(255) = ''   OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  BEGIN TRY
    DECLARE @NO_Tran       Integer
           ,@ID_Pessoa     Integer
           ,@QT_Atualizado Integer = 0;

    DECLARE @tbServico TABLE (ID_Servico Integer PRIMARY KEY);

    SELECT @Return_Code = 0
          ,@ErrMsg      = '';

    IF(ISNULL(@ST_Operacao, '') NOT IN ('I', 'P', 'F', 'S')) SET @ErrMsg += CHAR(13) + 'ST_Operacao';
    IF(@ST_Operacao IN ('P', 'F', 'S') AND ISNULL(@ID_Usuario, 0) <= 0) SET @ErrMsg += CHAR(13) + 'ID_Usuario';
    IF(@ST_Operacao = 'F' AND ISNULL(@DS_Imagem, '') = '') SET @ErrMsg += CHAR(13) + 'DS_Imagem';

    IF (@ErrMsg <> '')
    BEGIN
      SET @ErrMsg = 'st_BarbeariaBarbeiroAddUpd. Parametros: ' + CHAR(13) + @ErrMsg;
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@ST_Operacao IN ('I', 'P') AND LEN(ISNULL(@DS_SenhaHash, '')) < 50)
    BEGIN
      SELECT @Return_Code = 2
            ,@ErrMsg      = 'Informe uma senha válida.';
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@ST_Operacao = 'I' AND (ISNULL(@CD_Inscricao_Nacional, '') = '' OR @DT_Nascimento IS NULL))
    BEGIN
      SELECT @Return_Code = 2
            ,@ErrMsg      = 'Informe CPF e data de nascimento do barbeiro.';
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@ST_Operacao = 'S')
    BEGIN
      IF(ISJSON(ISNULL(@ID_Servico, '')) = 0
         OR LEFT(LTRIM(@ID_Servico), 1) <> '['
         OR EXISTS(SELECT 1
                   FROM OPENJSON(@ID_Servico)
                   WHERE [type] <> 2
                      OR TRY_CONVERT(Integer, [value]) IS NULL))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Lista de serviços inválida.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      INSERT INTO @tbServico (ID_Servico)
      SELECT DISTINCT CONVERT(Integer, [value])
      FROM OPENJSON(@ID_Servico);

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
    END

    SELECT @NO_Tran = @@TRANCOUNT;
    IF(@NO_Tran = 0) BEGIN TRAN;

    IF(@ST_Operacao IN ('F', 'S')
       AND NOT EXISTS(SELECT 1
                      FROM dbo.BRBUSU WITH (UPDLOCK, HOLDLOCK)
                      WHERE ID_Usuario = @ID_Usuario))
    BEGIN
      SELECT @Return_Code = 2
            ,@ErrMsg      = 'Profissional não encontrado.';
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@ST_Operacao = 'I')
    BEGIN
      -- Perfil sempre Barbeiro ('B'); nome, CPF e telefone sao validados pela procedure de pessoas.
      SET @ErrMsg = 'Erro ao executar a procedure st_BarbeariaPessoaAddUpd.';
      EXEC dbo.st_BarbeariaPessoaAddUpd @ST_Operacao           = 'I'
                                       ,@ID_Pessoa             = @ID_Pessoa   OUTPUT
                                       ,@NM_Pessoa             = @NM_Usuario
                                       ,@CD_Inscricao_Nacional = @CD_Inscricao_Nacional
                                       ,@NO_Telefone           = @NO_Telefone
                                       ,@DT_Nascimento         = @DT_Nascimento
                                       ,@TP_Pessoa             = 'B'
                                       ,@SN_Retorno            = 'N'
                                       ,@Return_Code           = @Return_Code OUTPUT
                                       ,@ErrMsg                = @ErrMsg      OUTPUT;

      IF (@Return_Code > 0)
      BEGIN
        RAISERROR (@ErrMsg, 18, 1);
      END

      SET @ErrMsg = 'Erro ao incluir na tabela BRBUSU.';
      INSERT INTO dbo.BRBUSU (ID_Pessoa, DS_SenhaHash, DS_Imagem)
      VALUES (@ID_Pessoa, @DS_SenhaHash, NULLIF(@DS_Imagem, ''));

      SELECT @ID_Usuario    = SCOPE_IDENTITY()
            ,@QT_Atualizado = 1;
    END

    IF(@ST_Operacao = 'P')
    BEGIN
      -- Trocar o hash invalida os tokens emitidos com a senha anterior (a API assina o token com o hash vigente).
      SET @ErrMsg = 'Erro ao atualizar a tabela BRBUSU.';
      UPDATE BRBUSU
         SET DS_SenhaHash = @DS_SenhaHash
            ,DH_Alteracao = GETDATE()
      FROM dbo.BRBUSU
           INNER JOIN dbo.BRBPES
           ON BRBPES.ID_Pessoa = BRBUSU.ID_Pessoa
      WHERE BRBUSU.ID_Usuario = @ID_Usuario
        AND BRBPES.TP_Pessoa  = 'B';

      SET @QT_Atualizado = @@ROWCOUNT;
    END

    IF(@ST_Operacao = 'F')
    BEGIN
      SET @ErrMsg = 'Erro ao atualizar a tabela BRBUSU.';
      UPDATE dbo.BRBUSU
         SET DS_Imagem    = @DS_Imagem
            ,DH_Alteracao = GETDATE()
      WHERE ID_Usuario = @ID_Usuario;

      SET @QT_Atualizado = @@ROWCOUNT;
    END

    IF(@ST_Operacao = 'S')
    BEGIN
      SET @ErrMsg = 'Erro ao atualizar a tabela BRBUSS.';
      DELETE FROM dbo.BRBUSS
      WHERE ID_Usuario = @ID_Usuario
        AND ID_Servico NOT IN (SELECT ID_Servico FROM @tbServico);

      INSERT INTO dbo.BRBUSS (ID_Usuario, ID_Servico)
      SELECT @ID_Usuario, Servico.ID_Servico
      FROM @tbServico Servico
      WHERE NOT EXISTS(SELECT 1
                       FROM dbo.BRBUSS
                       WHERE BRBUSS.ID_Usuario = @ID_Usuario
                         AND BRBUSS.ID_Servico = Servico.ID_Servico);

      SET @QT_Atualizado = 1;
    END

    IF(@NO_Tran = 0) AND (@@TRANCOUNT > 0) COMMIT TRAN;

    IF(@ST_Operacao = 'I')
    BEGIN
      SELECT BRBUSU.ID_Usuario
            ,BRBUSU.ID_Pessoa
            ,BRBPES.NM_Pessoa  AS NM_Usuario
            ,BRBPES.NO_Telefone
            ,'Barbeiro'        AS TP_Usuario
            ,BRBPES.SN_Ativo
            ,BRBUSU.DS_Imagem
            ,CAST(CASE WHEN BRBUSU.DS_SenhaHash IS NOT NULL THEN 1 ELSE 0 END AS Bit) AS SN_SenhaDefinida
      FROM dbo.BRBUSU WITH (NOLOCK)
           INNER JOIN dbo.BRBPES WITH (NOLOCK)
           ON BRBPES.ID_Pessoa = BRBUSU.ID_Pessoa
      WHERE BRBUSU.ID_Usuario = @ID_Usuario;
    END
    ELSE
    BEGIN
      SELECT CAST(CASE WHEN @QT_Atualizado > 0 THEN 1 ELSE 0 END AS Bit) AS SN_Atualizado;
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
