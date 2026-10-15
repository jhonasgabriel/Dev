CREATE OR ALTER PROCEDURE dbo.st_BarbeariaBloqueioAddUpd @ST_Operacao Char(1)                     -- { 'I'NSERT (bloquear), 'D'ESBLOQUEAR }
                                                        ,@DT_Bloqueio DateTime
                                                        ,@HR_Inicio   Time
                                                        ,@HR_Fim      Time
                                                        ,@DS_Motivo   VarChar(255) = NULL
                                                        ,@ID_Barbeiro Integer      = NULL  -- NULL: bloqueio geral da barbearia; informado: somente do profissional
                                                        ,@Return_Code Integer      = 0     OUTPUT
                                                        ,@ErrMsg      VarChar(255) = ''    OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  BEGIN TRY
    DECLARE @NO_Tran       Integer
           ,@DT_Data       Date
           ,@ID_Horario    Integer
           ,@SG_Inicio     Integer
           ,@SG_Fim        Integer
           ,@QT_Atualizado Integer = 0
           ,@Zero          Time    = '00:00';

    SELECT @Return_Code = 0
          ,@ErrMsg      = '';

    IF(ISNULL(@ST_Operacao, '') NOT IN ('I', 'D')) SET @ErrMsg += CHAR(13) + 'ST_Operacao';
    IF(@DT_Bloqueio IS NULL) SET @ErrMsg += CHAR(13) + 'DT_Bloqueio';
    IF(@HR_Inicio   IS NULL) SET @ErrMsg += CHAR(13) + 'HR_Inicio';
    IF(@HR_Fim      IS NULL) SET @ErrMsg += CHAR(13) + 'HR_Fim';

    IF (@ErrMsg <> '')
    BEGIN
      SET @ErrMsg = 'st_BarbeariaBloqueioAddUpd. Parametros: ' + CHAR(13) + @ErrMsg;
      RAISERROR (@ErrMsg, 18, 1);
    END

    SELECT @DT_Data   = CONVERT(Date, @DT_Bloqueio)
          ,@SG_Inicio = DATEDIFF(SECOND, @Zero, @HR_Inicio)
          ,@SG_Fim    = DATEDIFF(SECOND, @Zero, @HR_Fim);

    IF(@ST_Operacao = 'I' AND (@DT_Data < CONVERT(Date, GETDATE()) OR @HR_Inicio >= @HR_Fim))
    BEGIN
      SELECT @Return_Code = 2
            ,@ErrMsg      = 'Intervalo de bloqueio inválido.';
      RAISERROR (@ErrMsg, 18, 1);
    END

    SELECT @NO_Tran = @@TRANCOUNT;
    IF(@NO_Tran = 0) BEGIN TRAN;

    IF(@ST_Operacao = 'I')
    BEGIN
      -- Mesmo bloqueio usado pelo agendamento: impede reservar e bloquear o mesmo dia ao mesmo tempo.
      SELECT @ID_Horario = ID_Horario
      FROM dbo.BRBHOR WITH (UPDLOCK, HOLDLOCK)
      WHERE ID_Barbeiro IS NULL
        AND Dia_Semana  = DATEDIFF(DAY, '19000107', @DT_Data) % 7;

      IF(EXISTS(SELECT 1
                FROM dbo.BRBAGE
                WHERE DT_Agendamento  = @DT_Data
                  AND ST_Agendamento <> 'Cancelado'
                  AND (@ID_Barbeiro IS NULL OR ID_Barbeiro = @ID_Barbeiro OR ID_Barbeiro IS NULL)
                  AND @SG_Inicio      < DATEDIFF(SECOND, @Zero, HR_Agendamento) + (QT_Tempo * 60)
                  AND @SG_Fim         > DATEDIFF(SECOND, @Zero, HR_Agendamento)))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Existem agendamentos no intervalo. Cancele ou escolha outro período.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      IF(NOT EXISTS(SELECT 1
                    FROM dbo.BRBBLO WITH (UPDLOCK, HOLDLOCK)
                    WHERE DT_Bloqueio = @DT_Data
                      AND HR_Inicio   = @HR_Inicio
                      AND HR_Fim      = @HR_Fim
                      AND ((@ID_Barbeiro IS NULL AND ID_Barbeiro IS NULL) OR ID_Barbeiro = @ID_Barbeiro)
                      AND SN_Ativo    = 'S'))
      BEGIN
        SET @ErrMsg = 'Erro ao incluir na tabela BRBBLO.';
        INSERT INTO dbo.BRBBLO (ID_Barbeiro, DT_Bloqueio, HR_Inicio, HR_Fim, DS_Motivo)
        VALUES (@ID_Barbeiro, @DT_Data, @HR_Inicio, @HR_Fim, NULLIF(LTRIM(RTRIM(@DS_Motivo)), ''));
      END

      SET @QT_Atualizado = 1;
    END

    IF(@ST_Operacao = 'D')
    BEGIN
      SET @ErrMsg = 'Erro ao atualizar a tabela BRBBLO.';
      UPDATE dbo.BRBBLO
         SET SN_Ativo     = 'N'
            ,DH_Alteracao = GETDATE()
      WHERE DT_Bloqueio = @DT_Data
        AND HR_Inicio   = @HR_Inicio
        AND HR_Fim      = @HR_Fim
        AND ((@ID_Barbeiro IS NULL AND ID_Barbeiro IS NULL) OR ID_Barbeiro = @ID_Barbeiro)
        AND SN_Ativo    = 'S';

      SET @QT_Atualizado = @@ROWCOUNT;
    END

    IF(@NO_Tran = 0) AND (@@TRANCOUNT > 0) COMMIT TRAN;

    SELECT CAST(CASE WHEN @QT_Atualizado > 0 THEN 1 ELSE 0 END AS Bit) AS SN_Atualizado;

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
