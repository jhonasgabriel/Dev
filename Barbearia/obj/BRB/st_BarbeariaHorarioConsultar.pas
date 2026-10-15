CREATE OR ALTER PROCEDURE dbo.st_BarbeariaHorarioConsultar @ID_Barbeiro  Integer      = NULL  -- NULL para o horario global; informado, usa o global onde nao houver personalizacao
                                                          ,@Return_Code Integer      = 0     OUTPUT
                                                          ,@ErrMsg      VarChar(255) = ''    OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    SELECT @Return_Code = 0
          ,@ErrMsg      = '';

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

    SELECT ISNULL(Barbeiro.ID_Horario, Global.ID_Horario)          AS ID_Horario
          ,@ID_Barbeiro                                            AS ID_Barbeiro
          ,Global.Dia_Semana
          ,ISNULL(Barbeiro.HR_Abertura, Global.HR_Abertura)       AS HR_Abertura
          ,ISNULL(Barbeiro.HR_Fechamento, Global.HR_Fechamento)   AS HR_Fechamento
          ,CASE
             WHEN Barbeiro.ID_Horario IS NOT NULL THEN Barbeiro.HR_Inicio_Almoco ELSE Global.HR_Inicio_Almoco
           END                                                     AS HR_Inicio_Almoco
          ,CASE
             WHEN Barbeiro.ID_Horario IS NOT NULL THEN Barbeiro.HR_Fim_Almoco ELSE Global.HR_Fim_Almoco
           END                                                     AS HR_Fim_Almoco
          ,ISNULL(Barbeiro.SN_Ativo, Global.SN_Ativo)             AS SN_Ativo
          ,CAST(CASE WHEN Barbeiro.ID_Horario IS NOT NULL THEN 1 ELSE 0 END AS Bit) AS SN_Personalizado
    FROM dbo.BRBHOR Global WITH (NOLOCK)
         LEFT JOIN dbo.BRBHOR Barbeiro WITH (NOLOCK)
         ON Barbeiro.ID_Barbeiro = @ID_Barbeiro
        AND Barbeiro.Dia_Semana  = Global.Dia_Semana
    WHERE Global.ID_Barbeiro IS NULL
    ORDER BY Global.Dia_Semana;

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
