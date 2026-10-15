import { useState } from 'react';
import type { AgendaDia } from '../../hooks/useAgendaDia';
import type { Agendamento } from '../../services/agendaService';
import { Mensagem } from '../Mensagem/Mensagem';
import { configuracaoDaData } from './agenda';
import type { ConfiguracaoDia } from './agenda';
import { AgendarClienteModal } from './AgendarClienteModal';
import { FinalizarAgendamentoModal } from './FinalizarAgendamentoModal';
import { GradeHorarios } from './GradeHorarios';

interface AgendaDoDiaProps {
  data: string;
  agenda: AgendaDia;
  horarios: ConfiguracaoDia[];
  /** Permite agendar pelos horários livres (desligado para datas passadas). */
  permitirAgendar?: boolean;
  /** Painel do barbeiro: agenda individual e agendamentos sempre para ele. */
  idBarbeiro?: number;
  /** Chamado depois de finalizar ou agendar (para atualizar resumos da tela). */
  alterado?: () => void;
}

/** Grade de horários de um dia com as ações de finalizar e agendar. */
export function AgendaDoDia(props: AgendaDoDiaProps)
{
  const { data, agenda, horarios, permitirAgendar = true, idBarbeiro, alterado } = props;
  const [finalizando, setFinalizando] = useState<Agendamento | null>(null);
  const [horaAgendamento, setHoraAgendamento] = useState<string | null>(null);

  function concluir()
  {
    setFinalizando(null);
    setHoraAgendamento(null);
    void agenda.recarregar();
    alterado?.();
  }

  if (agenda.carregando) return <p role="status">Carregando agenda...</p>;

  return ( <>
             <Mensagem erro={agenda.erro} />
             <GradeHorarios configuracao={configuracaoDaData(horarios, data)}
                            agendamentos={agenda.agendamentos}
                            bloqueios={agenda.bloqueios}
                            finalizar={setFinalizando}
                            agendar={permitirAgendar ? setHoraAgendamento : undefined}
                            individual={!!idBarbeiro}/>

             {finalizando && (
               <FinalizarAgendamentoModal item={finalizando} fechar={() => setFinalizando(null)} concluido={concluir} />
             )}

             {horaAgendamento && (
               <AgendarClienteModal data={data}
                                    hora={horaAgendamento}
                                    idBarbeiroFixo={idBarbeiro}
                                    fechar={() => setHoraAgendamento(null)}
                                    concluido={concluir}/>
             )}
           </>
  );
}
