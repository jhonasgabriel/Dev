import type { ReactNode } from 'react';
import type { Servico } from '../../services/servicoService';
import { dataLocal, paraIso } from '../../utils/datas';
import { moeda } from '../../utils/formatacao';

export interface HorarioLivre {
  hora: string;
  disponivel: boolean;
}

/** Título numerado de cada etapa do agendamento. */
export function TituloEtapa({numero ,titulo ,children}: { numero: number; titulo: string; children: ReactNode })
{
  return ( <div className="secao-titulo">
             <span>{numero}</span>
             <div>
               <h2>{titulo}</h2>
               <p>{children}</p>
             </div>
           </div>
  );
}

interface EscolhaServicosProps {
  servicos: Servico[];
  selecionados: number[];
  alternar: (id: number) => void;
}

export function EscolhaServicos({servicos ,selecionados ,alternar}: EscolhaServicosProps)
{
  return ( <div className="servicos-lista">
             {servicos.map(servico => (
               <button key={servico.id_servico}
                       type="button"
                       aria-pressed={selecionados.includes(servico.id_servico)}
                       className={selecionados.includes(servico.id_servico) ? 'servico ativo' : 'servico'}
                       onClick={() => alternar(servico.id_servico)}>
                 <span>
                   <strong>{servico.nm_servico}</strong>
                   <small>
                     {servico.ds_servico ? `${servico.ds_servico} · ` : ''}
                     {servico.qt_minutos} min
                   </small>
                 </span>
                 <b>{moeda(servico.vl_servico)}</b>
               </button>
             ))}
             {!servicos.length && <p className="estado-vazio">Não foi possível carregar os serviços agora.</p>}
           </div>
  );
}

const DIA_SEMANA = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });

/** Hoje e os próximos 6 dias. */
export function proximosDias()
{
  return Array.from({ length: 7 }, (_, i) =>
  {
    const data = new Date();
    data.setDate(data.getDate() + i);
    return paraIso(data);
  });
}

export function EscolhaData({dias ,valor ,mudar}: { dias: string[]; valor: string; mudar: (data: string) => void })
{
  return ( <div className="datas-lista">
             {dias.map(dia => (
               <button key={dia}
                       type="button"
                       className={valor === dia ? 'data ativa' : 'data'}
                       onClick={() => mudar(dia)}>
                 <small>{DIA_SEMANA.format(dataLocal(dia)).replace('.', '')}</small>
                 <strong>{Number(dia.slice(8, 10))}</strong>
               </button>
             ))}
           </div>
  );
}

interface EscolhaHorarioProps {
  horarios: HorarioLivre[];
  valor: string;
  mudar: (hora: string) => void;
  semServicos: boolean;
}

export function EscolhaHorario({horarios ,valor ,mudar ,semServicos}: EscolhaHorarioProps)
{
  return ( <div className="horarios-tabela" role="table" aria-label="Horários e disponibilidade">
             <div className="horarios-cabecalho" role="row">
               <span role="columnheader">Horário</span>
               <span role="columnheader">Disponibilidade</span>
             </div>

             {horarios.map(item => (
               <button key={item.hora}
                       type="button"
                       role="row"
                       className={valor === item.hora ? 'horario-linha ativo' : 'horario-linha'}
                       disabled={!item.disponivel}
                       onClick={() => mudar(item.hora)}>
                 <time role="cell">{item.hora}</time>
                 <span role="cell">{item.disponivel ? 'Disponível' : 'Indisponível'}</span>
               </button>
             ))}

             {semServicos ? (
               <p className="sem-horarios">Selecione um serviço para consultar os horários.</p>
             ) : (
               !horarios.length && <p className="sem-horarios">Nenhum horário disponível para esta data.</p>
             )}
           </div>
  );
}
