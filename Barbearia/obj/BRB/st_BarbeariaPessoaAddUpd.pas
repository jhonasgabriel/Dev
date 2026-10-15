CREATE OR ALTER PROCEDURE dbo.st_BarbeariaPessoaAddUpd @ST_Operacao           Char(1)                    -- { 'I'NSERT, 'U'PDATE, 'S'TATUS }
                                                      ,@ID_Pessoa             Integer      = 0    OUTPUT
                                                      ,@NM_Pessoa             VarChar(50)  = NULL
                                                      ,@CD_Inscricao_Nacional Char(11)     = NULL  -- CPF somente numeros
                                                      ,@NO_Telefone           VarChar(20)  = NULL
                                                      ,@DT_Nascimento         DateTime     = NULL
                                                      ,@TP_Pessoa             Char(1)      = 'C'   -- 'A' Admin, 'B' Barbeiro, 'C' Cliente
                                                      ,@SN_Ativo              Char(1)      = NULL
                                                      ,@SN_Retorno            Char(1)      = 'S'   -- 'N' quando chamada por outra procedure
                                                      ,@Return_Code           Integer      = 0    OUTPUT
                                                      ,@ErrMsg                VarChar(255) = ''   OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  BEGIN TRY
    DECLARE @NO_Tran        Integer
           ,@TP_PessoaAtual Char(1);

    SELECT @Return_Code = 0
          ,@ErrMsg      = '';

    IF(ISNULL(@ST_Operacao, '') NOT IN ('I', 'U', 'S')) SET @ErrMsg += CHAR(13) + 'ST_Operacao';
    IF(@ST_Operacao IN ('U', 'S') AND ISNULL(@ID_Pessoa, 0) <= 0) SET @ErrMsg += CHAR(13) + 'ID_Pessoa';
    IF(@ST_Operacao = 'S' AND ISNULL(@SN_Ativo, '') NOT IN ('S', 'N')) SET @ErrMsg += CHAR(13) + 'SN_Ativo';

    IF (@ErrMsg <> '')
    BEGIN
      SET @ErrMsg = 'st_BarbeariaPessoaAddUpd. Parametros: ' + CHAR(13) + @ErrMsg;
      RAISERROR (@ErrMsg, 18, 1);
    END

    SELECT @NM_Pessoa             = LTRIM(RTRIM(@NM_Pessoa))
          ,@NO_Telefone           = LTRIM(RTRIM(@NO_Telefone))
          ,@CD_Inscricao_Nacional = NULLIF(LTRIM(RTRIM(@CD_Inscricao_Nacional)), '')
          ,@TP_Pessoa             = ISNULL(NULLIF(LTRIM(RTRIM(@TP_Pessoa)), ''), 'C');

    IF(@ST_Operacao IN ('I', 'U')
       AND (LEN(ISNULL(@NM_Pessoa, '')) < 3
            OR LEN(ISNULL(@NO_Telefone, '')) NOT BETWEEN 10 AND 11
            OR @NO_Telefone LIKE '%[^0-9]%'
            OR (@CD_Inscricao_Nacional IS NOT NULL AND (LEN(@CD_Inscricao_Nacional) <> 11 OR @CD_Inscricao_Nacional LIKE '%[^0-9]%'))
            OR CONVERT(Date, @DT_Nascimento) > CONVERT(Date, GETDATE())
            OR @TP_Pessoa NOT IN ('A', 'B', 'C')))
    BEGIN
      SELECT @Return_Code = 2
            ,@ErrMsg      = 'Dados da pessoa inválidos.';
      RAISERROR (@ErrMsg, 18, 1);
    END

    SELECT @NO_Tran = @@TRANCOUNT;
    IF(@NO_Tran = 0) BEGIN TRAN;

    IF(@ST_Operacao IN ('U', 'S'))
    BEGIN
      SELECT @TP_PessoaAtual = TP_Pessoa
      FROM dbo.BRBPES WITH (UPDLOCK, HOLDLOCK)
      WHERE ID_Pessoa = @ID_Pessoa;

      IF(@TP_PessoaAtual IS NULL)
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Pessoa não encontrada.';
        RAISERROR (@ErrMsg, 18, 1);
      END
    END

    IF(@ST_Operacao IN ('I', 'U'))
    BEGIN
      IF(@ST_Operacao = 'U') SET @TP_Pessoa = @TP_PessoaAtual;

      -- Telefone identifica a pessoa (o cliente agenda informando nome e telefone).
      IF(EXISTS(SELECT 1
                FROM dbo.BRBPES WITH (UPDLOCK, HOLDLOCK)
                WHERE NO_Telefone = @NO_Telefone
                  AND ID_Pessoa  <> ISNULL(@ID_Pessoa, 0)))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Telefone já cadastrado.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      IF(@CD_Inscricao_Nacional IS NOT NULL
         AND EXISTS(SELECT 1
                    FROM dbo.BRBPES WITH (UPDLOCK, HOLDLOCK)
                    WHERE CD_Inscricao_Nacional = @CD_Inscricao_Nacional
                      AND ID_Pessoa            <> ISNULL(@ID_Pessoa, 0)))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'CPF já cadastrado.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      -- Na equipe o nome e o login: nao pode repetir entre Admin/Barbeiro (sem distincao de caixa).
      IF(@TP_Pessoa IN ('A', 'B')
         AND EXISTS(SELECT 1
                    FROM dbo.BRBPES WITH (UPDLOCK, HOLDLOCK)
                    WHERE NM_Pessoa  = @NM_Pessoa
                      AND TP_Pessoa IN ('A', 'B')
                      AND ID_Pessoa <> ISNULL(@ID_Pessoa, 0)))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Já existe um profissional com este nome.';
        RAISERROR (@ErrMsg, 18, 1);
      END
    END

    IF(@ST_Operacao = 'I')
    BEGIN
      SET @ErrMsg = 'Erro ao incluir na tabela BRBPES.';
      INSERT INTO dbo.BRBPES (NM_Pessoa, CD_Inscricao_Nacional, NO_Telefone, DT_Nascimento, TP_Pessoa)
      VALUES (@NM_Pessoa, @CD_Inscricao_Nacional, @NO_Telefone, CONVERT(Date, @DT_Nascimento), @TP_Pessoa);

      SET @ID_Pessoa = SCOPE_IDENTITY();
    END

    IF(@ST_Operacao = 'U')
    BEGIN
      SET @ErrMsg = 'Erro ao atualizar a tabela BRBPES.';
      UPDATE dbo.BRBPES
         SET NM_Pessoa             = @NM_Pessoa
            ,CD_Inscricao_Nacional = ISNULL(@CD_Inscricao_Nacional, CD_Inscricao_Nacional)
            ,NO_Telefone           = @NO_Telefone
            ,DT_Nascimento         = CONVERT(Date, @DT_Nascimento)
            ,DH_Alteracao          = GETDATE()
      WHERE ID_Pessoa = @ID_Pessoa;
    END

    IF(@ST_Operacao = 'S')
    BEGIN
      -- Mantem ao menos um Admin com acesso ativo. Pessoa inativa perde o acesso (view de usuarios ativos).
      IF(@SN_Ativo = 'N'
         AND @TP_PessoaAtual = 'A'
         AND NOT EXISTS(SELECT 1
                        FROM dbo.vw_BarbeariaUsuarioAtivo
                        WHERE TP_Pessoa  = 'A'
                          AND ID_Pessoa <> @ID_Pessoa))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Não é possível inativar o último Admin.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      SET @ErrMsg = 'Erro ao atualizar a tabela BRBPES.';
      UPDATE dbo.BRBPES
         SET SN_Ativo     = @SN_Ativo
            ,DH_Alteracao = GETDATE()
      WHERE ID_Pessoa = @ID_Pessoa;
    END

    IF(@NO_Tran = 0) AND (@@TRANCOUNT > 0) COMMIT TRAN;

    IF(@ST_Operacao = 'I' AND @SN_Retorno = 'S')
    BEGIN
      SELECT ID_Pessoa
            ,NM_Pessoa AS NM_Usuario
            ,NO_Telefone
            ,DT_Nascimento
            ,CASE TP_Pessoa WHEN 'A' THEN 'Admin' WHEN 'B' THEN 'Barbeiro' ELSE 'Cliente' END AS TP_Usuario
            ,SN_Ativo
      FROM dbo.BRBPES WITH (NOLOCK)
      WHERE ID_Pessoa = @ID_Pessoa;
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
