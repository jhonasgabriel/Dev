CREATE OR ALTER PROCEDURE dbo.st_BarbeariaBarbeiroConsultar @ST_Consulta  Char(1)            -- 'L' lista de barbeiros cadastrados (gestao de acessos);
                                                                                             -- 'P' profissionais para agendamento (publico), opcionalmente que realizam todos os ID_Servico;
                                                                                             -- 'S' servicos ativos com indicacao dos que o profissional realiza (ID_Barbeiro);
                                                                                             -- 'C' clientes do profissional (ID_Barbeiro);
                                                                                             -- 'R' resumo do profissional no periodo (ID_Barbeiro, DT_Inicial, DT_Final);
                                                           ,@ID_Barbeiro  Integer      = NULL
                                                           ,@ID_Servico   VarChar(MAX) = NULL  -- JSON: [4, 5]
                                                           ,@DT_Inicial   DateTime     = NULL
                                                           ,@DT_Final     DateTime     = NULL
                                                           ,@Return_Code  Integer      = 0     OUTPUT
                                                           ,@ErrMsg       VarChar(255) = ''    OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    DECLARE @DT_Inicio Date
           ,@DT_Fim    Date;

    DECLARE @tbServico TABLE (ID_Servico Integer PRIMARY KEY);

    SELECT @Return_Code = 0
          ,@ErrMsg      = '';

    IF(ISNULL(@ST_Consulta, '') NOT IN ('L', 'P', 'S', 'C', 'R')) SET @ErrMsg += CHAR(13) + 'ST_Consulta';
    IF(@ST_Consulta IN ('S', 'C', 'R') AND ISNULL(@ID_Barbeiro, 0) <= 0) SET @ErrMsg += CHAR(13) + 'ID_Barbeiro';
    IF(@ST_Consulta = 'R' AND @DT_Inicial IS NULL) SET @ErrMsg += CHAR(13) + 'DT_Inicial';
    IF(@ST_Consulta = 'R' AND @DT_Final   IS NULL) SET @ErrMsg += CHAR(13) + 'DT_Final';
    IF(@ST_Consulta = 'P' AND ISNULL(@ID_Servico, '') <> '' AND ISJSON(@ID_Servico) = 0) SET @ErrMsg += CHAR(13) + 'ID_Servico';

    IF (@ErrMsg <> '')
    BEGIN
      SET @ErrMsg = 'st_BarbeariaBarbeiroConsultar. Parametros: ' + CHAR(13) + @ErrMsg;
      RAISERROR (@ErrMsg, 18, 1);
    END

    IF(@ST_Consulta IN ('S', 'C', 'R')
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

    IF(@ST_Consulta = 'L')
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
      WHERE BRBPES.TP_Pessoa = 'B'
      ORDER BY BRBPES.NM_Pessoa;
    END

    IF(@ST_Consulta = 'P')
    BEGIN
      INSERT INTO @tbServico (ID_Servico)
      SELECT DISTINCT TRY_CONVERT(Integer, [value])
      FROM OPENJSON(ISNULL(NULLIF(@ID_Servico, ''), '[]'))
      WHERE TRY_CONVERT(Integer, [value]) IS NOT NULL;

      -- Somente ID, nome e foto: dados expostos na pagina publica de agendamento.
      SELECT Profissional.ID_Usuario
            ,Profissional.NM_Pessoa AS NM_Usuario
            ,Profissional.DS_Imagem
      FROM dbo.vw_BarbeariaUsuarioAtivo Profissional WITH (NOLOCK)
      WHERE NOT EXISTS(SELECT 1
                       FROM @tbServico Servico
                       WHERE NOT EXISTS(SELECT 1
                                        FROM dbo.BRBUSS WITH (NOLOCK)
                                        WHERE BRBUSS.ID_Usuario = Profissional.ID_Usuario
                                          AND BRBUSS.ID_Servico = Servico.ID_Servico))
      ORDER BY Profissional.NM_Pessoa;
    END

    IF(@ST_Consulta = 'S')
    BEGIN
      SELECT BRBSER.ID_Servico
            ,BRBSER.NM_Servico
            ,BRBSER.VL_Servico
            ,BRBSER.QT_Minutos
            ,BRBSER.DS_Servico
            ,CAST(CASE WHEN BRBUSS.ID_Servico IS NOT NULL THEN 1 ELSE 0 END AS Bit) AS SN_Realiza
      FROM dbo.BRBSER WITH (NOLOCK)
           LEFT JOIN dbo.BRBUSS WITH (NOLOCK)
           ON BRBUSS.ID_Servico = BRBSER.ID_Servico
          AND BRBUSS.ID_Usuario = @ID_Barbeiro
      WHERE BRBSER.SN_Ativo = 'S'
      ORDER BY BRBSER.NM_Servico;
    END
    IF(@ST_Consulta = 'C')
    BEGIN
      -- Agregacoes separadas evitam a multiplicacao de valores entre agendamentos e atendimentos.
      ;WITH CTE_Agendamentos
      AS (SELECT BRBAGE.ID_Pessoa
                ,COUNT(1) AS QT_Agendamentos
          FROM dbo.BRBAGE WITH (NOLOCK)
          WHERE BRBAGE.ID_Barbeiro = @ID_Barbeiro
          GROUP BY BRBAGE.ID_Pessoa),

      CTE_Atendimentos
      AS (SELECT BRBATD.ID_Pessoa
                ,SUM(CASE WHEN BRBATD.ST_Atendimento = 'Finalizado' THEN 1 ELSE 0 END)                  AS QT_Atendimentos
                ,MAX(BRBATD.DT_Servico)                                                                AS DT_Ultimo_Atendimento
                ,SUM(CASE WHEN BRBATD.ST_Atendimento = 'Finalizado' THEN BRBATD.VL_Total ELSE 0 END)    AS VL_Total_Gasto
                ,SUM(CASE WHEN BRBATD.ST_Atendimento = 'Finalizado' THEN BRBATD.VL_Pendente ELSE 0 END) AS VL_Pendente
          FROM dbo.BRBATD WITH (NOLOCK)
          WHERE BRBATD.ID_Barbeiro = @ID_Barbeiro
          GROUP BY BRBATD.ID_Pessoa)

      SELECT BRBPES.ID_Pessoa
            ,BRBPES.NM_Pessoa AS NM_Usuario
            ,BRBPES.NO_Telefone
            ,BRBPES.SN_Ativo
            ,ISNULL(CTE_Agendamentos.QT_Agendamentos, 0) AS QT_Agendamentos
            ,ISNULL(CTE_Atendimentos.QT_Atendimentos, 0) AS QT_Atendimentos
            ,CTE_Atendimentos.DT_Ultimo_Atendimento
            ,ISNULL(CTE_Atendimentos.VL_Total_Gasto, 0)  AS VL_Total_Gasto
            ,ISNULL(CTE_Atendimentos.VL_Pendente, 0)     AS VL_Pendente
      FROM dbo.BRBPES WITH (NOLOCK)
           LEFT JOIN CTE_Agendamentos
           ON CTE_Agendamentos.ID_Pessoa = BRBPES.ID_Pessoa
           LEFT JOIN CTE_Atendimentos
           ON CTE_Atendimentos.ID_Pessoa = BRBPES.ID_Pessoa
      WHERE BRBPES.TP_Pessoa = 'C'
        AND (CTE_Agendamentos.ID_Pessoa IS NOT NULL OR CTE_Atendimentos.ID_Pessoa IS NOT NULL)
      ORDER BY BRBPES.NM_Pessoa;
    END

    IF(@ST_Consulta = 'R')
    BEGIN
      IF(CONVERT(Date, @DT_Final) < CONVERT(Date, @DT_Inicial))
      BEGIN
        SELECT @Return_Code = 2
              ,@ErrMsg      = 'Período inválido.';
        RAISERROR (@ErrMsg, 18, 1);
      END

      SELECT @DT_Inicio = CONVERT(Date, @DT_Inicial)
            ,@DT_Fim    = DATEADD(DAY, 1, CONVERT(Date, @DT_Final));

      SELECT COUNT(1)                                                                                         AS QT_Agendamentos
            ,ISNULL(SUM(CASE WHEN BRBAGE.ST_Agendamento IN ('Confirmado', 'Agendado') THEN 1 ELSE 0 END), 0) AS QT_Confirmados
            ,ISNULL(SUM(CASE WHEN BRBAGE.ST_Agendamento = 'Cancelado' THEN 1 ELSE 0 END), 0)                 AS QT_Cancelados
            ,COUNT(DISTINCT BRBAGE.ID_Pessoa)                                                                 AS QT_Clientes
            ,(SELECT ISNULL(SUM(BRBATD.VL_Total), 0)
              FROM dbo.BRBATD WITH (NOLOCK)
              WHERE BRBATD.ID_Barbeiro    = @ID_Barbeiro
                AND BRBATD.ST_Atendimento = 'Finalizado'
                AND BRBATD.DT_Servico    >= @DT_Inicio
                AND BRBATD.DT_Servico     < @DT_Fim) AS VL_Faturado
            ,(SELECT ISNULL(SUM(BRBPAG.VL_Pagamento), 0)
              FROM dbo.BRBPAG WITH (NOLOCK)
                   INNER JOIN dbo.BRBATD WITH (NOLOCK)
                   ON BRBATD.ID_Atendimento = BRBPAG.ID_Atendimento
              WHERE BRBATD.ID_Barbeiro  = @ID_Barbeiro
                AND BRBPAG.DT_Pagamento >= @DT_Inicio
                AND BRBPAG.DT_Pagamento  < @DT_Fim) AS VL_Recebido
            ,(SELECT ISNULL(SUM(BRBATD.VL_Pendente), 0)
              FROM dbo.BRBATD WITH (NOLOCK)
              WHERE BRBATD.ID_Barbeiro    = @ID_Barbeiro
                AND BRBATD.ST_Atendimento = 'Finalizado'
                AND BRBATD.DT_Servico    >= @DT_Inicio
                AND BRBATD.DT_Servico     < @DT_Fim) AS VL_Pendente
      FROM dbo.BRBAGE WITH (NOLOCK)
      WHERE BRBAGE.ID_Barbeiro     = @ID_Barbeiro
        AND BRBAGE.DT_Agendamento >= @DT_Inicio
        AND BRBAGE.DT_Agendamento  < @DT_Fim;

      SELECT BRBATS.NM_Servico
            ,COUNT(1)               AS QT_Servicos
            ,SUM(BRBATS.VL_Servico) AS VL_Total
      FROM dbo.BRBATS WITH (NOLOCK)
           INNER JOIN dbo.BRBATD WITH (NOLOCK)
           ON BRBATD.ID_Atendimento = BRBATS.ID_Atendimento
      WHERE BRBATD.ID_Barbeiro    = @ID_Barbeiro
        AND BRBATD.ST_Atendimento = 'Finalizado'
        AND BRBATD.DT_Servico    >= @DT_Inicio
        AND BRBATD.DT_Servico     < @DT_Fim
      GROUP BY BRBATS.NM_Servico
      ORDER BY QT_Servicos DESC, BRBATS.NM_Servico;

      SELECT BRBPAG.Forma_Pagamento
            ,COUNT(1)                 AS QT_Pagamentos
            ,SUM(BRBPAG.VL_Pagamento) AS VL_Total
      FROM dbo.BRBPAG WITH (NOLOCK)
           INNER JOIN dbo.BRBATD WITH (NOLOCK)
           ON BRBATD.ID_Atendimento = BRBPAG.ID_Atendimento
      WHERE BRBATD.ID_Barbeiro  = @ID_Barbeiro
        AND BRBPAG.DT_Pagamento >= @DT_Inicio
        AND BRBPAG.DT_Pagamento  < @DT_Fim
      GROUP BY BRBPAG.Forma_Pagamento
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
