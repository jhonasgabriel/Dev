CREATE OR ALTER PROCEDURE dbo.st_BarbeariaControleConsultar @ST_Consulta  Char(1)      = 'C'   -- 'C' controle financeiro completo (6 resultados);
                                                                                             -- 'D' dashboard (resumo do periodo);
                                                                                             -- 'M' relatorio mensal (mes de DT_Inicial, 2 resultados);
                                                           ,@DT_Inicial   DateTime
                                                           ,@DT_Final     DateTime     = NULL
                                                           ,@ID_Pessoa    Integer      = NULL
                                                           ,@Return_Code  Integer      = 0     OUTPUT
                                                           ,@ErrMsg       VarChar(255) = ''    OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    DECLARE @DT_Inicio Date
           ,@DT_Fim    Date;

    SELECT @Return_Code = 0
          ,@ErrMsg      = '';

    IF(ISNULL(@ST_Consulta, '') NOT IN ('C', 'D', 'M')) SET @ErrMsg += CHAR(13) + 'ST_Consulta';
    IF(@DT_Inicial IS NULL) SET @ErrMsg += CHAR(13) + 'DT_Inicial';
    IF(@ST_Consulta IN ('C', 'D') AND @DT_Final IS NULL) SET @ErrMsg += CHAR(13) + 'DT_Final';

    IF (@ErrMsg <> '')
    BEGIN
      SET @ErrMsg = 'st_BarbeariaControleConsultar. Parametros: ' + CHAR(13) + @ErrMsg;
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@ST_Consulta IN ('C', 'D') AND CONVERT(Date, @DT_Final) < CONVERT(Date, @DT_Inicial))
    BEGIN
      SELECT @Return_Code = 2
            ,@ErrMsg      = 'Período inválido.';
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@ST_Consulta = 'M')
      SELECT @DT_Inicio = DATEFROMPARTS(YEAR(@DT_Inicial), MONTH(@DT_Inicial), 1)
            ,@DT_Fim    = DATEADD(DAY, 1, EOMONTH(@DT_Inicial));
    ELSE
      SELECT @DT_Inicio = CONVERT(Date, @DT_Inicial)
            ,@DT_Fim    = DATEADD(DAY, 1, CONVERT(Date, @DT_Final));

    IF(@ST_Consulta IN ('C', 'D'))
    BEGIN
      -- Resumo: faturamento pela data do atendimento; recebido e formas de pagamento pela data do pagamento.
      ;WITH CTE_Atendimentos
      AS (SELECT BRBATD.ID_Atendimento
                ,BRBATD.VL_Total
                ,BRBATD.VL_Pendente
          FROM dbo.BRBATD WITH (NOLOCK)
          WHERE BRBATD.DT_Servico    >= @DT_Inicio
            AND BRBATD.DT_Servico     < @DT_Fim
            AND BRBATD.ST_Atendimento = 'Finalizado'
            AND (@ID_Pessoa IS NULL OR BRBATD.ID_Pessoa = @ID_Pessoa)),

      CTE_Pagamentos
      AS (SELECT BRBPAG.VL_Pagamento
                ,BRBPAG.Forma_Pagamento
          FROM dbo.BRBPAG WITH (NOLOCK)
          WHERE BRBPAG.DT_Pagamento >= @DT_Inicio
            AND BRBPAG.DT_Pagamento  < @DT_Fim
            AND (@ID_Pessoa IS NULL OR BRBPAG.ID_Pessoa = @ID_Pessoa))

      SELECT (SELECT COUNT(1) FROM CTE_Atendimentos)                                                         AS QT_Atendimentos
            ,(SELECT COUNT(1)
              FROM dbo.BRBATS WITH (NOLOCK)
                   INNER JOIN CTE_Atendimentos
                   ON CTE_Atendimentos.ID_Atendimento = BRBATS.ID_Atendimento)                               AS QT_Servicos
            ,(SELECT ISNULL(SUM(BRBATP.QT_Produto), 0)
              FROM dbo.BRBATP WITH (NOLOCK)
                   INNER JOIN CTE_Atendimentos
                   ON CTE_Atendimentos.ID_Atendimento = BRBATP.ID_Atendimento)                               AS QT_Produtos
            ,(SELECT ISNULL(SUM(VL_Total), 0) FROM CTE_Atendimentos)                                         AS VL_Faturado
            ,(SELECT ISNULL(SUM(VL_Pendente), 0) FROM CTE_Atendimentos)                                      AS VL_Pendente
            ,(SELECT ISNULL(SUM(VL_Pagamento), 0) FROM CTE_Pagamentos)                                       AS VL_Recebido
            ,(SELECT ISNULL(SUM(VL_Pagamento), 0) FROM CTE_Pagamentos WHERE Forma_Pagamento = 'PIX')         AS VL_Pix
            ,(SELECT ISNULL(SUM(VL_Pagamento), 0) FROM CTE_Pagamentos WHERE Forma_Pagamento = 'CREDITO')     AS VL_Credito
            ,(SELECT ISNULL(SUM(VL_Pagamento), 0) FROM CTE_Pagamentos WHERE Forma_Pagamento = 'DEBITO')      AS VL_Debito
            ,(SELECT ISNULL(SUM(VL_Pagamento), 0) FROM CTE_Pagamentos WHERE Forma_Pagamento = 'ESPECIE')     AS VL_Especie;
    END

    IF(@ST_Consulta = 'C')
    BEGIN
      -- Debitos em aberto (independente do periodo).
      SELECT BRBATD.ID_Atendimento
            ,BRBATD.ID_Agendamento
            ,BRBATD.ID_Pessoa
            ,BRBPES.NM_Pessoa AS NM_Usuario
            ,(SELECT STRING_AGG(BRBATS.NM_Servico, ', ') WITHIN GROUP (ORDER BY BRBATS.NM_Servico)
              FROM dbo.BRBATS WITH (NOLOCK)
              WHERE BRBATS.ID_Atendimento = BRBATD.ID_Atendimento) AS DS_Servicos
            ,BRBATD.DT_Servico                                    AS DT_Atendimento
            ,BRBATD.VL_Total
            ,BRBATD.VL_Recebido
            ,BRBATD.VL_Pendente
      FROM dbo.BRBATD WITH (NOLOCK)
           INNER JOIN dbo.BRBPES WITH (NOLOCK)
           ON BRBPES.ID_Pessoa = BRBATD.ID_Pessoa
      WHERE BRBATD.VL_Pendente    > 0
        AND BRBATD.ST_Atendimento = 'Finalizado'
        AND (@ID_Pessoa IS NULL OR BRBATD.ID_Pessoa = @ID_Pessoa)
      ORDER BY BRBATD.DT_Servico, BRBATD.ID_Atendimento;

      -- Agendamentos finalizados no periodo.
      SELECT BRBATD.ID_Agendamento
      FROM dbo.BRBATD WITH (NOLOCK)
      WHERE BRBATD.ID_Agendamento IS NOT NULL
        AND BRBATD.ST_Atendimento = 'Finalizado'
        AND BRBATD.DT_Servico    >= @DT_Inicio
        AND BRBATD.DT_Servico     < @DT_Fim
        AND (@ID_Pessoa IS NULL OR BRBATD.ID_Pessoa = @ID_Pessoa);

      -- Servicos realizados.
      SELECT BRBATS.NM_Servico
            ,BRBATS.VL_Servico      AS VL_Unitario
            ,COUNT(1)               AS QT_Servicos
            ,SUM(BRBATS.VL_Servico) AS VL_Total
      FROM dbo.BRBATS WITH (NOLOCK)
           INNER JOIN dbo.BRBATD WITH (NOLOCK)
           ON BRBATD.ID_Atendimento = BRBATS.ID_Atendimento
      WHERE BRBATD.DT_Servico    >= @DT_Inicio
        AND BRBATD.DT_Servico     < @DT_Fim
        AND BRBATD.ST_Atendimento = 'Finalizado'
        AND (@ID_Pessoa IS NULL OR BRBATD.ID_Pessoa = @ID_Pessoa)
      GROUP BY BRBATS.NM_Servico, BRBATS.VL_Servico
      ORDER BY BRBATS.NM_Servico, BRBATS.VL_Servico;

      -- Formas de pagamento.
      SELECT BRBPAG.Forma_Pagamento
            ,COUNT(1)                 AS QT_Pagamentos
            ,SUM(BRBPAG.VL_Pagamento) AS VL_Total
      FROM dbo.BRBPAG WITH (NOLOCK)
      WHERE BRBPAG.DT_Pagamento >= @DT_Inicio
        AND BRBPAG.DT_Pagamento  < @DT_Fim
        AND (@ID_Pessoa IS NULL OR BRBPAG.ID_Pessoa = @ID_Pessoa)
      GROUP BY BRBPAG.Forma_Pagamento
      ORDER BY BRBPAG.Forma_Pagamento;

      -- Detalhamento por profissional e registros historicos ainda sem profissional.
      ;WITH CTE_Profissionais
      AS (SELECT Profissional.ID_Usuario
                ,Profissional.NM_Pessoa AS NM_Usuario
                ,Profissional.NM_Perfil AS TP_Usuario
                ,(SELECT COUNT(1)
                  FROM dbo.BRBATD WITH (NOLOCK)
                  WHERE BRBATD.ID_Barbeiro    = Profissional.ID_Usuario
                    AND BRBATD.ST_Atendimento = 'Finalizado'
                    AND BRBATD.DT_Servico    >= @DT_Inicio
                    AND BRBATD.DT_Servico     < @DT_Fim) AS QT_Atendimentos
                ,(SELECT ISNULL(SUM(BRBATD.VL_Total), 0)
                  FROM dbo.BRBATD WITH (NOLOCK)
                  WHERE BRBATD.ID_Barbeiro    = Profissional.ID_Usuario
                    AND BRBATD.ST_Atendimento = 'Finalizado'
                    AND BRBATD.DT_Servico    >= @DT_Inicio
                    AND BRBATD.DT_Servico     < @DT_Fim) AS VL_Faturado
                ,(SELECT ISNULL(SUM(BRBPAG.VL_Pagamento), 0)
                  FROM dbo.BRBPAG WITH (NOLOCK)
                       INNER JOIN dbo.BRBATD WITH (NOLOCK)
                       ON BRBATD.ID_Atendimento = BRBPAG.ID_Atendimento
                  WHERE BRBATD.ID_Barbeiro  = Profissional.ID_Usuario
                    AND BRBPAG.DT_Pagamento >= @DT_Inicio
                    AND BRBPAG.DT_Pagamento  < @DT_Fim) AS VL_Recebido
                ,(SELECT ISNULL(SUM(BRBATD.VL_Pendente), 0)
                  FROM dbo.BRBATD WITH (NOLOCK)
                  WHERE BRBATD.ID_Barbeiro    = Profissional.ID_Usuario
                    AND BRBATD.ST_Atendimento = 'Finalizado'
                    AND BRBATD.DT_Servico    >= @DT_Inicio
                    AND BRBATD.DT_Servico     < @DT_Fim) AS VL_Pendente
          FROM dbo.vw_BarbeariaUsuarioAtivo Profissional WITH (NOLOCK)


          UNION ALL

          SELECT 0                  AS ID_Usuario
                ,'Sem profissional' AS NM_Usuario
                ,'Historico'        AS TP_Usuario
                ,COUNT(1)           AS QT_Atendimentos
                ,ISNULL(SUM(BRBATD.VL_Total), 0) AS VL_Faturado
                ,(SELECT ISNULL(SUM(BRBPAG.VL_Pagamento), 0)
                  FROM dbo.BRBPAG WITH (NOLOCK)
                       INNER JOIN dbo.BRBATD Atendimento WITH (NOLOCK)
                       ON Atendimento.ID_Atendimento = BRBPAG.ID_Atendimento
                  WHERE Atendimento.ID_Barbeiro IS NULL
                    AND BRBPAG.DT_Pagamento     >= @DT_Inicio
                    AND BRBPAG.DT_Pagamento      < @DT_Fim) AS VL_Recebido
                ,ISNULL(SUM(BRBATD.VL_Pendente), 0) AS VL_Pendente
          FROM dbo.BRBATD WITH (NOLOCK)
          WHERE BRBATD.ID_Barbeiro IS NULL
            AND BRBATD.ST_Atendimento = 'Finalizado'
            AND BRBATD.DT_Servico    >= @DT_Inicio
            AND BRBATD.DT_Servico     < @DT_Fim
          HAVING COUNT(1) > 0)

      SELECT ID_Usuario
            ,NM_Usuario
            ,TP_Usuario
            ,QT_Atendimentos
            ,VL_Faturado
            ,VL_Recebido
            ,VL_Pendente
      FROM CTE_Profissionais
      ORDER BY CASE
                 WHEN TP_Usuario = 'Admin'    THEN 0
                 WHEN TP_Usuario = 'Barbeiro' THEN 1
                 ELSE 2
               END
              ,NM_Usuario;
    END

    IF(@ST_Consulta = 'M')
    BEGIN
      SELECT DAY(BRBATD.DT_Servico) AS NR_Dia
            ,COUNT(1)               AS QT_Atendimentos
      FROM dbo.BRBATD WITH (NOLOCK)
      WHERE BRBATD.DT_Servico    >= @DT_Inicio
        AND BRBATD.DT_Servico     < @DT_Fim
        AND BRBATD.ST_Atendimento = 'Finalizado'
      GROUP BY DAY(BRBATD.DT_Servico)
      ORDER BY NR_Dia;

      ;WITH CTE_Itens
      AS (SELECT BRBATS.NM_Servico AS NM_Categoria
                ,BRBATS.VL_Servico AS VL_Item
          FROM dbo.BRBATS WITH (NOLOCK)
               INNER JOIN dbo.BRBATD WITH (NOLOCK)
               ON BRBATD.ID_Atendimento = BRBATS.ID_Atendimento
          WHERE BRBATD.DT_Servico    >= @DT_Inicio
            AND BRBATD.DT_Servico     < @DT_Fim
            AND BRBATD.ST_Atendimento = 'Finalizado'

          UNION ALL

          SELECT 'Produtos'                            AS NM_Categoria
                ,BRBATP.VL_Produto * BRBATP.QT_Produto AS VL_Item
          FROM dbo.BRBATP WITH (NOLOCK)
               INNER JOIN dbo.BRBATD WITH (NOLOCK)
               ON BRBATD.ID_Atendimento = BRBATP.ID_Atendimento
          WHERE BRBATD.DT_Servico    >= @DT_Inicio
            AND BRBATD.DT_Servico     < @DT_Fim
            AND BRBATD.ST_Atendimento = 'Finalizado')

      SELECT NM_Categoria
            ,SUM(VL_Item) AS VL_Total
      FROM CTE_Itens
      GROUP BY NM_Categoria
      ORDER BY VL_Total DESC;
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
