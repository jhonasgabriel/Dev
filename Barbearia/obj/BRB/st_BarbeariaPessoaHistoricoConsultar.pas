CREATE OR ALTER PROCEDURE dbo.st_BarbeariaPessoaHistoricoConsultar @ST_Consulta  Char(1)            -- 'H' historico de atendimentos da pessoa;
                                                                                                    -- 'F' frequencia (totais dos atendimentos finalizados);
                                                                                                    -- 'P' pendencias financeiras (todas, quando ID_Pessoa nulo);
                                                                  ,@ID_Pessoa   Integer      = NULL
                                                                  ,@Return_Code Integer      = 0   OUTPUT
                                                                  ,@ErrMsg      VarChar(255) = ''  OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    SELECT @Return_Code = 0
          ,@ErrMsg      = '';

    IF(ISNULL(@ST_Consulta, '') NOT IN ('H', 'F', 'P')) SET @ErrMsg += CHAR(13) + 'ST_Consulta';
    IF(@ST_Consulta IN ('H', 'F') AND ISNULL(@ID_Pessoa, 0) <= 0) SET @ErrMsg += CHAR(13) + 'ID_Pessoa';

    IF (@ErrMsg <> '')
    BEGIN
      SET @ErrMsg = 'st_BarbeariaPessoaHistoricoConsultar. Parametros: ' + CHAR(13) + @ErrMsg;
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@ST_Consulta = 'H')
    BEGIN
      SELECT BRBATD.ID_Atendimento AS ID_Historico
            ,BRBATD.ID_Pessoa
            ,BRBATD.DT_Servico     AS DT_Atendimento
            ,BRBATD.VL_Total
            ,BRBATD.VL_Recebido
            ,BRBATD.VL_Pendente
            ,BRBATD.Forma_Pagamento
            ,BRBATD.ST_Atendimento
            ,(SELECT STRING_AGG(BRBATS.NM_Servico, ', ') WITHIN GROUP (ORDER BY BRBATS.NM_Servico)
              FROM dbo.BRBATS WITH (NOLOCK)
              WHERE BRBATS.ID_Atendimento = BRBATD.ID_Atendimento) AS DS_Servicos
      FROM dbo.BRBATD WITH (NOLOCK)
      WHERE BRBATD.ID_Pessoa = @ID_Pessoa
      ORDER BY BRBATD.DT_Servico DESC, BRBATD.ID_Atendimento DESC;
    END

    IF(@ST_Consulta = 'F')
    BEGIN
      SELECT @ID_Pessoa                     AS ID_Pessoa
            ,COUNT(1)                       AS QT_Atendimentos
            ,MAX(BRBATD.DT_Servico)         AS DT_Ultimo_Atendimento
            ,ISNULL(SUM(BRBATD.VL_Total), 0)    AS VL_Total_Gasto
            ,ISNULL(SUM(BRBATD.VL_Pendente), 0) AS VL_Total_Pendente
      FROM dbo.BRBATD WITH (NOLOCK)
      WHERE BRBATD.ID_Pessoa      = @ID_Pessoa
        AND BRBATD.ST_Atendimento = 'Finalizado';
    END

    IF(@ST_Consulta = 'P')
    BEGIN
      SELECT BRBATD.ID_Atendimento AS ID_Pendencia
            ,BRBATD.ID_Atendimento
            ,BRBATD.ID_Pessoa
            ,BRBATD.DT_Servico     AS DT_Atendimento
            ,BRBATD.VL_Total       AS VL_Original
            ,BRBATD.VL_Recebido
            ,BRBATD.VL_Pendente
      FROM dbo.BRBATD WITH (NOLOCK)
      WHERE BRBATD.VL_Pendente    > 0
        AND BRBATD.ST_Atendimento = 'Finalizado'
        AND (@ID_Pessoa IS NULL OR BRBATD.ID_Pessoa = @ID_Pessoa)
      ORDER BY BRBATD.DT_Servico, BRBATD.ID_Atendimento;
    END

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
