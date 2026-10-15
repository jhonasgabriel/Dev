import { useState } from 'react';
import { useAgendaDia } from '../../hooks/useAgendaDia';
import { hojeIso } from '../../utils/datas';
import SeletorData from '../SeletorData/SeletorData';
import type { ConfiguracaoDia } from './agenda';
import { AgendaDoDia } from './AgendaDoDia';

interface TelaAgendaProps {
  titulo: string;
  horarios: ConfiguracaoDia[];
  idBarbeiro?: number;
  dataMinima?: string;
  alterado?: () => void;
}

/** Tela "Agenda": escolha da data e grade de horários do dia escolhido. */
export function TelaAgenda({titulo ,horarios ,idBarbeiro ,dataMinima = '2020-01-01' ,alterado}: TelaAgendaProps)
{
  const hoje = hojeIso();
  const [data, setData] = useState(hoje);
  const agenda = useAgendaDia(data);

  return ( <section className="admin-bloco">
             <div className="admin-bloco-titulo">
               <h2>{titulo}</h2>
             </div>

             <div className="filtros-agenda">
               <label>
                 Data da agenda
                 <SeletorData id="data-agenda"
                              name="dataAgenda"
                              value={data}
                              min={dataMinima}
                              max="2100-12-31"
                              somenteCalendario
                              ariaLabel="Selecionar data da agenda"
                              onChange={setData}/>
               </label>
               <p>Use o calendário para escolher o mês e o dia da agenda.</p>
             </div>

             <AgendaDoDia data={data}
                          agenda={agenda}
                          horarios={horarios}
                          permitirAgendar={data >= hoje}
                          idBarbeiro={idBarbeiro}
                          alterado={alterado}/>
           </section>
  );
}
