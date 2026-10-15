import { AgendaDoDia } from '../../components/Agenda/AgendaDoDia';
import { estaPendente } from '../../components/Agenda/agenda';
import type { ConfiguracaoDia } from '../../components/Agenda/agenda';
import { useAgendaDia } from '../../hooks/useAgendaDia';
import { useConsulta } from '../../hooks/useConsulta';
import { consultarResumoBarbeiro } from '../../services/barbeiroService';
import { hojeIso } from '../../utils/datas';
import { moeda } from '../../utils/formatacao';

interface VisaoGeralBarbeiroProps {
  idBarbeiro: number;
  horarios: ConfiguracaoDia[];
}

/** Resumo do dia do barbeiro e a grade de horários dele hoje (mesmo formato da Visão geral do Admin). */
export function VisaoGeralBarbeiro({idBarbeiro ,horarios}: VisaoGeralBarbeiroProps)
{
  const hoje = hojeIso();
  const agenda = useAgendaDia(hoje);
  const resumo = useConsulta(`resumo-${idBarbeiro}-${hoje}`, () => consultarResumoBarbeiro(idBarbeiro, hoje, hoje));

  const confirmados = agenda.agendamentos.filter(item => estaPendente(item.st_agendamento)).length;

  return ( <>
             <section className="admin-resumo">
               <article>
                 <span>Confirmados hoje</span>
                 <strong>{confirmados}</strong>
                 <small>agendados para hoje</small>
               </article>
               <article>
                 <span>Faturamento do dia</span>
                 <strong>{moeda(resumo.dados?.resumo.vl_recebido ?? 0)}</strong>
                 <small>valor efetivamente recebido hoje</small>
               </article>
             </section>

             <section className="admin-bloco">
               <div className="admin-bloco-titulo">
                 <h2>Próximos Atendimentos</h2>
               </div>
               <AgendaDoDia data={hoje}
                            agenda={agenda}
                            horarios={horarios}
                            idBarbeiro={idBarbeiro}
                            alterado={() => void resumo.atualizar()}/>
             </section>
           </>
  );
}
