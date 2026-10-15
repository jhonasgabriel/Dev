import type { ReactNode } from 'react';
import type { Controle } from '../../../services/controleService';
import { moeda } from '../../../utils/formatacao';

/** Tabelas do relatório. No celular, cada linha vira um cartão com os rótulos das colunas. */
export function TabelasRelatorio({dados ,comProfissionais}: { dados: Controle; comProfissionais: boolean })
{
  return ( <>
             <Tabela titulo="Financeiro"
                     colunas={['Indicador', 'Valor']}
                     linhas={[
                       ['Vendido', moeda(dados.resumo.vl_faturado)],
                       ['Recebido', moeda(dados.resumo.vl_recebido)],
                       ['Pendente', moeda(dados.resumo.vl_pendente)]
                     ]}/>

             <Tabela titulo="Formas de Recebimento"
                     className="formas-recebimento"
                     colunas={['Forma', 'Quantidade', 'Total recebido']}
                     linhas={dados.formas_pagamento.map(item => [item.forma_pagamento, item.qt_pagamentos, moeda(item.vl_total)])}/>

             <Tabela titulo="Detalhamento por serviço"
                     colunas={['Serviço', 'Quantidade × unitário', 'Total']}
                     linhas={dados.servicos.map(item => [
                       item.nm_servico,
                       `${item.qt_servicos} × ${moeda(item.vl_unitario)}`,
                       moeda(item.vl_total)
                     ])}/>

             {comProfissionais && (
               <Tabela titulo="Resultado por profissional"
                       colunas={['Profissional', 'Perfil', 'Atendimentos', 'Vendido', 'Recebido', 'Pendente']}
                       linhas={dados.profissionais.map(item => [item.nm_usuario
                                                               ,item.tp_usuario
                                                               ,item.qt_atendimentos
                                                               ,moeda(item.vl_faturado)
                                                               ,moeda(item.vl_recebido)
                                                               ,moeda(item.vl_pendente)])}/>
             )}
           </>
  );
}

interface TabelaProps {
  titulo: string;
  colunas: string[];
  linhas: ReactNode[][];
  className?: string;
}

function Tabela({titulo ,colunas ,linhas ,className = ''}: TabelaProps)
{
  return ( <section className={`relatorio-tabela ${className}`.trim()}>
             <h3>{titulo}</h3>
             <table>
               <thead>
                 <tr>
                   {colunas.map(coluna => (
                     <th key={coluna}>{coluna}</th>
                   ))}
                 </tr>
               </thead>
               <tbody>
                 {linhas.map((linha, indice) => (
                   <tr key={indice}>
                     {linha.map((valor, coluna) => (
                       <td key={colunas[coluna]} data-rotulo={colunas[coluna]}>
                         {valor}
                       </td>
                     ))}
                   </tr>
                 ))}
               </tbody>
             </table>
           </section>
  );
}
