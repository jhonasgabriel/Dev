CREATE OR ALTER VIEW dbo.vw_BarbeariaUsuarioAtivo
AS
  -- Equipe com acesso ativo: Admin ('A') ou Barbeiro ('B'), com senha definida e pessoa ativa.
  -- Unica regra de "quem pode logar" e "quem atende na agenda". O nome de login e o NM_Pessoa.
  -- Uma view e um unico SELECT (sem BEGIN/variaveis): validacoes e tratamento de erro ficam nas procedures.
  SELECT BRBUSU.ID_Usuario
        ,BRBUSU.ID_Pessoa
        ,BRBUSU.DS_SenhaHash
        ,BRBUSU.DS_Imagem
        ,BRBPES.NM_Pessoa
        ,BRBPES.NO_Telefone
        ,BRBPES.TP_Pessoa
        ,CASE BRBPES.TP_Pessoa WHEN 'A' THEN 'Admin' ELSE 'Barbeiro' END AS NM_Perfil
  FROM dbo.BRBUSU
       INNER JOIN dbo.BRBPES
       ON BRBPES.ID_Pessoa = BRBUSU.ID_Pessoa
  WHERE BRBPES.TP_Pessoa IN ('A', 'B')
    AND BRBPES.SN_Ativo     = 'S'
    AND BRBUSU.DS_SenhaHash IS NOT NULL;
