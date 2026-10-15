import { AgendaDoDia } from '../../components/Agenda/AgendaDoDia';
import { estaPendente } from '../../components/Agenda/agenda';
import type { ConfiguracaoDia } from '../../components/Agenda/agenda';
import { useAgendaDia } from '../../hooks/useAgendaDia';
import { useConsulta } from '../../hooks/useConsulta';
import { CONTROLE_VAZIO, consultarControle } from '../../services/controleService';
import { hojeIso } from '../../utils/datas';
import { moeda } from '../../utils/formatacao';

/** Resumo do dia da barbearia e a grade de horários de hoje. */
export function VisaoGeral({horarios ,alterado}: { horarios: ConfiguracaoDia[]; alterado: () => void })
{
  const hoje = hojeIso();
  const agenda = useAgendaDia(hoje);
  const controle = useConsulta(`controle-${hoje}`, () => consultarControle(hoje, hoje), CONTROLE_VAZIO);

  const confirmados = agenda.agendamentos.filter(item => estaPendente(item.st_agendamento)).length;

  function atualizar()
  {
    void controle.atualizar();
    alterado();
  }

  return ( <>
             <section className="admin-resumo">
               <article>
                 <span>Confirmados hoje</span>
                 <strong>{confirmados}</strong>
                 <small>agendados para hoje</small>
               </article>
               <article>
                 <span>Faturamento do dia</span>
                 <strong>{moeda(controle.dados?.resumo.vl_recebido ?? 0)}</strong>
                 <small>valor efetivamente recebido hoje</small>
               </article>
             </section>

             <section className="admin-bloco">
               <div className="admin-bloco-titulo">
                 <h2>Próximos Atendimentos</h2>
               </div>
               <AgendaDoDia data={hoje} agenda={agenda} horarios={horarios} alterado={atualizar} />
             </section>
           </>
  );
}
