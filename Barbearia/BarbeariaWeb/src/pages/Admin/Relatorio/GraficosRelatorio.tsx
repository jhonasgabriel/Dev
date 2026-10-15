import type { CSSProperties } from 'react';
import type { Agendamento } from '../../../services/agendaService';
import type { Controle } from '../../../services/controleService';
import { dataBr, dataLocal, paraIso } from '../../../utils/datas';
import { moeda } from '../../../utils/formatacao';

const CORES = ['#12c4aa', '#80d7e8', '#6e8791', '#ffcf33', '#f27d72', '#5e7ce2', '#55c76a'];

interface GraficosRelatorioProps {
  inicio: string;
  fim: string;
  agendamentos: Agendamento[];
  servicos: Controle['servicos'];
}

interface Categoria {
  nome: string;
  valor: number;
  cor: string;
}

/** Movimento por dia, vendas por serviço (rosca) e onde a barbearia mais lucra. */
export function GraficosRelatorio({inicio ,fim ,agendamentos ,servicos}: GraficosRelatorioProps)
{
  const categorias: Categoria[] = servicos
    .map((item, indice) => ({
      nome: item.nm_servico,
      valor: item.vl_total,
      cor: CORES[indice % CORES.length]
    }))
    .filter(item => item.valor > 0);

  return ( <>
             <div className="graficos-relatorio">
               <MovimentoPeriodo inicio={inicio} fim={fim} agendamentos={agendamentos} />
               <VendasPorServico categorias={categorias} />
             </div>
             <OndeLucraMais categorias={categorias} />
           </>
  );
}

function MovimentoPeriodo({inicio ,fim ,agendamentos}: Omit<GraficosRelatorioProps, 'servicos'>)
{
  const dias: string[] = [];
  for (const atual = dataLocal(inicio), ultimo = dataLocal(fim); atual <= ultimo; atual.setDate(atual.getDate() + 1))
  {
    dias.push(paraIso(atual));
  }

  const movimento = dias.map(data => ({
    dia: Number(data.slice(8, 10)),
    quantidade: agendamentos.filter(item => item.dt_agendamento.slice(0, 10) === data).length
  }));
  const maior = Math.max(1, ...movimento.map(item => item.quantidade));

  return ( <article className="grafico-card grafico-movimento">
             <header>
               <h3>Movimento do período</h3>
               <span>
                 {dataBr(inicio)} a {dataBr(fim)}
               </span>
             </header>

             <div className="barras-mes"
                  style={{ '--dias-mes': dias.length } as CSSProperties}
                  aria-label="Serviços agendados por dia">
               {movimento.map(item => (
                 <div className="barra-dia" key={item.dia}>
                   <i style={{ height: `${Math.max(6, (item.quantidade / maior) * 100)}%` }}
                      title={`${item.dia}: ${item.quantidade} agendamento(s)`}/>
                   <span>{dias.length <= 10 || item.dia % 5 === 0 ? item.dia : ''}</span>
                 </div>
               ))}
             </div>
           </article>
  );
}

function VendasPorServico({categorias}: { categorias: Categoria[] })
{
  const total = categorias.reduce((soma, item) => soma + item.valor, 0);

  // Cada serviço ocupa uma fatia proporcional da rosca (conic-gradient).
  let acumulado = 0;
  const fatias = categorias.map(item =>
  {
    const inicio = acumulado;
    acumulado += (item.valor / Math.max(total, 1)) * 100;
    return `${item.cor} ${inicio}% ${acumulado}%`;
  });

  return ( <article className="grafico-card grafico-lucro">
             <header>
               <h3>Vendas por serviço</h3>
               <span>{moeda(total)}</span>
             </header>

             {categorias.length ? (
               <div className="donut-area">
                 <div className="donut"
                      style={{ background: `conic-gradient(${fatias.join(', ')})` }}
                      aria-label="Distribuição de vendas por serviço"/>
                 <ul>
                   {categorias.map(item => (
                     <li key={item.nome}>
                       <i style={{ background: item.cor }} />
                       <span>{item.nome}</span>
                       <strong>{Math.round((item.valor / total) * 100)}%</strong>
                     </li>
                   ))}
                 </ul>
               </div>
             ) : (
               <p className="admin-vazio">Sem serviços finalizados no período.</p>
             )}
           </article>
  );
}

function OndeLucraMais({categorias}: { categorias: Categoria[] })
{
  const maiores = [...categorias].sort((a, b) => b.valor - a.valor).slice(0, 3);

  return ( <section className="grafico-card onde-lucra">
             <header>
               <div>
                 <span className="relatorio-kicker">RENDIMENTO</span>
                 <h3>Onde lucra mais?</h3>
               </div>
               <span>{maiores.length ? moeda(maiores[0].valor) : '—'}</span>
             </header>

             {maiores.length ? (
               <div className="lucros-lista">
                 {maiores.map(item => (
                   <div className="lucro-linha" key={item.nome}>
                     <div>
                       <strong>{item.nome}</strong>
                       <small>{moeda(item.valor)} no mês</small>
                     </div>
                     <i>
                       <b style={{
                            width: `${Math.max(8, (item.valor / maiores[0].valor) * 100)}%`,
                            background: item.cor
                          }}/>
                     </i>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="admin-vazio">Sem dados de lucro para este mês.</p>
             )}
           </section>
  );
}
