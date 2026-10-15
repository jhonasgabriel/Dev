CREATE OR ALTER PROCEDURE dbo.st_BarbeariaHorarioAddUpd @ID_Barbeiro      Integer      = NULL  -- NULL para o horario global da barbearia
                                                       ,@Dia_Semana       Integer
                                                       ,@HR_Abertura      Time
                                                       ,@HR_Fechamento    Time
                                                       ,@HR_Inicio_Almoco Time         = NULL
                                                       ,@HR_Fim_Almoco    Time         = NULL
                                                       ,@SN_Ativo         Char(1)      = 'S'
                                                       ,@Return_Code      Integer      = 0     OUTPUT
                                                       ,@ErrMsg           VarChar(255) = ''    OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  BEGIN TRY
    DECLARE @NO_Tran Integer;

    SELECT @Return_Code = 0
          ,@ErrMsg      = '';

    IF(@Dia_Semana    IS NULL) SET @ErrMsg += CHAR(13) + 'Dia_Semana';
    IF(@HR_Abertura   IS NULL) SET @ErrMsg += CHAR(13) + 'HR_Abertura';
    IF(@HR_Fechamento IS NULL) SET @ErrMsg += CHAR(13) + 'HR_Fechamento';

    IF (@ErrMsg <> '')
    BEGIN
      SET @ErrMsg = 'st_BarbeariaHorarioAddUpd. Parametros: ' + CHAR(13) + @ErrMsg;
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@ID_Barbeiro IS NOT NULL
       AND NOT EXISTS(SELECT 1
                      FROM dbo.BRBUSU WITH (NOLOCK)
                           INNER JOIN dbo.BRBPES WITH (NOLOCK)
                           ON BRBPES.ID_Pessoa = BRBUSU.ID_Pessoa
                      WHERE BRBUSU.ID_Usuario = @ID_Barbeiro
                        AND BRBPES.SN_Ativo   = 'S'))
    BEGIN
      SELECT @Return_Code = 2
            ,@ErrMsg      = 'Barbeiro não encontrado ou inativo.';
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@Dia_Semana NOT BETWEEN 0 AND 6
       OR @HR_Abertura >= @HR_Fechamento
       OR ISNULL(@SN_Ativo, '') NOT IN ('S', 'N')
       OR (@HR_Inicio_Almoco IS NULL AND @HR_Fim_Almoco IS NOT NULL)
       OR (@HR_Inicio_Almoco IS NOT NULL AND @HR_Fim_Almoco IS NULL)
       OR (@HR_Inicio_Almoco IS NOT NULL AND (@HR_Inicio_Almoco >= @HR_Fim_Almoco
                                              OR @HR_Inicio_Almoco < @HR_Abertura
                                              OR @HR_Fim_Almoco > @HR_Fechamento)))
    BEGIN
      SELECT @Return_Code = 2
            ,@ErrMsg      = 'Configuração de horários inválida.';
      RAISERROR (@ErrMsg, 18, 1);
    END

    SELECT @NO_Tran = @@TRANCOUNT;
    IF(@NO_Tran = 0) BEGIN TRAN;

    SET @ErrMsg = 'Erro ao atualizar a tabela BRBHOR.';
    UPDATE dbo.BRBHOR WITH (HOLDLOCK)
       SET HR_Abertura      = @HR_Abertura
          ,HR_Fechamento    = @HR_Fechamento
          ,HR_Inicio_Almoco = @HR_Inicio_Almoco
          ,HR_Fim_Almoco    = @HR_Fim_Almoco
          ,SN_Ativo         = @SN_Ativo
          ,DH_Alteracao     = GETDATE()
    WHERE ((@ID_Barbeiro IS NULL AND ID_Barbeiro IS NULL) OR ID_Barbeiro = @ID_Barbeiro)
      AND Dia_Semana = @Dia_Semana;

    IF(@@ROWCOUNT = 0)
    BEGIN
      SET @ErrMsg = 'Erro ao incluir na tabela BRBHOR.';
      INSERT INTO dbo.BRBHOR (ID_Barbeiro, Dia_Semana, HR_Abertura, HR_Fechamento, HR_Inicio_Almoco, HR_Fim_Almoco, SN_Ativo)
      VALUES (@ID_Barbeiro, @Dia_Semana, @HR_Abertura, @HR_Fechamento, @HR_Inicio_Almoco, @HR_Fim_Almoco, @SN_Ativo);
    END

    IF(@NO_Tran = 0) AND (@@TRANCOUNT > 0) COMMIT TRAN;

    SELECT ID_Horario
          ,ID_Barbeiro
          ,Dia_Semana
          ,HR_Abertura
          ,HR_Fechamento
          ,HR_Inicio_Almoco
          ,HR_Fim_Almoco
          ,SN_Ativo
          ,CAST(CASE WHEN ID_Barbeiro IS NULL THEN 0 ELSE 1 END AS Bit) AS SN_Personalizado
    FROM dbo.BRBHOR WITH (NOLOCK)
    WHERE ((@ID_Barbeiro IS NULL AND ID_Barbeiro IS NULL) OR ID_Barbeiro = @ID_Barbeiro)
      AND Dia_Semana = @Dia_Semana;

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
