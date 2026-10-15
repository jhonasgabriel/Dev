CREATE OR ALTER FUNCTION dbo.fn_BarbeariaExpediente (@Dia_Semana Integer)
RETURNS TABLE
AS
  -- Expediente de cada profissional ativo no dia (em segundos desde 00:00): o horario personalizado
  -- do profissional (BRBHOR.ID_Barbeiro) ou, sem personalizacao, o horario global da barbearia.
  -- Dia fechado na barbearia (global inativo) ou folga do profissional nao retornam linha.
  RETURN
  SELECT Profissional.ID_Usuario
        ,DATEDIFF(SECOND, CAST('00:00' AS Time), ISNULL(Pessoal.HR_Abertura, Global.HR_Abertura))     AS SG_Abertura
        ,DATEDIFF(SECOND, CAST('00:00' AS Time), ISNULL(Pessoal.HR_Fechamento, Global.HR_Fechamento)) AS SG_Fechamento
        ,DATEDIFF(SECOND, CAST('00:00' AS Time), CASE
                                                   WHEN Pessoal.ID_Horario IS NULL THEN Global.HR_Inicio_Almoco
                                                   ELSE Pessoal.HR_Inicio_Almoco
                                                 END)                                                 AS SG_Inicio_Almoco
        ,DATEDIFF(SECOND, CAST('00:00' AS Time), CASE
                                                   WHEN Pessoal.ID_Horario IS NULL THEN Global.HR_Fim_Almoco
                                                   ELSE Pessoal.HR_Fim_Almoco
                                                 END)                                                 AS SG_Fim_Almoco
  FROM dbo.vw_BarbeariaUsuarioAtivo Profissional
       INNER JOIN dbo.BRBHOR Global
       ON Global.ID_Barbeiro IS NULL
      AND Global.Dia_Semana  = @Dia_Semana
      AND Global.SN_Ativo    = 'S'
       LEFT JOIN dbo.BRBHOR Pessoal
       ON Pessoal.ID_Barbeiro = Profissional.ID_Usuario
      AND Pessoal.Dia_Semana  = @Dia_Semana
  WHERE ISNULL(Pessoal.SN_Ativo, 'S') = 'S';
