CREATE OR ALTER PROCEDURE dbo.st_BarbeariaPessoaConsultar @NM_Usuario   VarChar(50)  = NULL
                                                         ,@NO_Telefone VarChar(20)  = NULL
                                                         ,@SN_Ativo    Char(1)      = NULL
                                                         ,@ID_Barbeiro Integer      = NULL  -- Clientes atendidos/agendados pelo profissional
                                                         ,@ID_Pessoa   Integer      = NULL
                                                         ,@Return_Code Integer      = 0     OUTPUT
                                                         ,@ErrMsg      VarChar(255) = ''    OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    SELECT @Return_Code = 0
          ,@ErrMsg      = '';

    SELECT @NM_Usuario  = NULLIF(LTRIM(RTRIM(@NM_Usuario)), '')
          ,@NO_Telefone = NULLIF(LTRIM(RTRIM(@NO_Telefone)), '');

    ;WITH CTE_Atendimentos
    AS (SELECT BRBATD.ID_Pessoa
              ,SUM(BRBATD.VL_Pendente) AS VL_Pendente
              ,COUNT(1)                AS QT_Atendimentos
              ,MAX(BRBATD.DT_Servico)  AS DT_Ultimo_Atendimento
        FROM dbo.BRBATD WITH (NOLOCK)
        WHERE BRBATD.ST_Atendimento = 'Finalizado'
        GROUP BY BRBATD.ID_Pessoa)

    SELECT BRBPES.ID_Pessoa
          ,BRBPES.NM_Pessoa AS NM_Usuario
          ,BRBPES.NO_Telefone
          ,BRBPES.DT_Nascimento
          ,'Cliente'        AS TP_Usuario
          ,BRBPES.SN_Ativo
          ,ISNULL(CTE_Atendimentos.VL_Pendente, 0)     AS VL_Pendente
          ,ISNULL(CTE_Atendimentos.QT_Atendimentos, 0) AS QT_Atendimentos
          ,CTE_Atendimentos.DT_Ultimo_Atendimento
          ,(SELECT STRING_AGG(Barbeiros.NM_Pessoa, ', ') WITHIN GROUP (ORDER BY Barbeiros.NM_Pessoa)
            FROM (SELECT DISTINCT Barbeiro.NM_Pessoa
                  FROM dbo.BRBAGE WITH (NOLOCK)
                       INNER JOIN dbo.BRBUSU WITH (NOLOCK)
                       ON BRBUSU.ID_Usuario = BRBAGE.ID_Barbeiro
                       INNER JOIN dbo.BRBPES Barbeiro WITH (NOLOCK)
                       ON Barbeiro.ID_Pessoa = BRBUSU.ID_Pessoa
                  WHERE BRBAGE.ID_Pessoa = BRBPES.ID_Pessoa) Barbeiros) AS NM_Barbeiros
    FROM dbo.BRBPES WITH (NOLOCK)
         LEFT JOIN CTE_Atendimentos
         ON CTE_Atendimentos.ID_Pessoa = BRBPES.ID_Pessoa
    WHERE BRBPES.TP_Pessoa = 'C'
      AND (@ID_Pessoa   IS NULL OR BRBPES.ID_Pessoa = @ID_Pessoa)
      AND (@NM_Usuario  IS NULL OR BRBPES.NM_Pessoa LIKE '%' + @NM_Usuario + '%')
      AND (@NO_Telefone IS NULL OR BRBPES.NO_Telefone = @NO_Telefone)
      AND (@SN_Ativo    IS NULL OR BRBPES.SN_Ativo = @SN_Ativo)
      AND (@ID_Barbeiro IS NULL
           OR EXISTS(SELECT 1
                     FROM dbo.BRBAGE WITH (NOLOCK)
                     WHERE BRBAGE.ID_Pessoa   = BRBPES.ID_Pessoa
                       AND BRBAGE.ID_Barbeiro = @ID_Barbeiro)
           OR EXISTS(SELECT 1
                     FROM dbo.BRBATD WITH (NOLOCK)
                     WHERE BRBATD.ID_Pessoa   = BRBPES.ID_Pessoa
                       AND BRBATD.ID_Barbeiro = @ID_Barbeiro))
    ORDER BY BRBPES.NM_Pessoa;

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
