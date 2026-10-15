import type { Agendamento, BloqueioHorario } from '../../services/agendaService';
import { minutos } from '../../utils/datas';
import { moeda } from '../../utils/formatacao';
import { estaCancelado, estaFinalizado, gerarHorarios } from './agenda';
import type { ConfiguracaoDia } from './agenda';

interface GradeHorariosProps {
  configuracao?: ConfiguracaoDia;
  agendamentos: Agendamento[];
  bloqueios: BloqueioHorario[];
  finalizar: (item: Agendamento) => void;
  /** Sem esta função, a grade não oferece o botão "Agendar". */
  agendar?: (hora: string) => void;
  /**
   * Agenda de um único profissional: horário "em atendimento" não aceita outro agendamento.
   * Na agenda geral (Admin) continua liberado, pois outro barbeiro pode estar livre.
   */
  individual?: boolean;
}

/** Grade de horários do dia. No desktop é uma tabela; no celular cada horário vira um cartão. */
export function GradeHorarios(props: GradeHorariosProps)
{
  const ativos = props.agendamentos.filter(item => !estaCancelado(item.st_agendamento));
  const horarios = [
    ...new Set([...gerarHorarios(props.configuracao), ...ativos.map(item => item.hr_agendamento.slice(0, 5))])
  ].sort();

  if (!horarios.length)
  {
    return <p className="admin-vazio">Sem horários de funcionamento nesta data.</p>;
  }

  return ( <div className="grade-horarios" role="table" aria-label="Horários e disponibilidade">
             <div className="grade-horarios-cabecalho" role="row">
               <span role="columnheader">Horários</span>
               <span role="columnheader">Situação</span>
               <span role="columnheader">Cliente / profissional</span>
               <span role="columnheader">Serviço</span>
               <span role="columnheader">Preço</span>
               <span role="columnheader">Ação</span>
             </div>

             {horarios.flatMap(hora =>
             {
               const doHorario = ativos.filter(item => item.hr_agendamento.slice(0, 5) === hora);
               const registros: (Agendamento | undefined)[] = doHorario.length ? doHorario : [undefined];

               return registros.map(item => (
                 <LinhaHorario key={item ? item.id_agendamento : hora}
                               hora={hora}
                               item={item}
                               bloqueado={estaBloqueado(hora, props.bloqueios)}
                               emAtendimento={estaEmAtendimento(hora, ativos)}
                               finalizar={props.finalizar}
                               agendar={props.agendar}
                               individual={props.individual}/>
               ));
             })}
           </div>
  );
}

interface LinhaHorarioProps {
  hora: string;
  item?: Agendamento;
  bloqueado: boolean;
  emAtendimento: boolean;
  finalizar: (item: Agendamento) => void;
  agendar?: (hora: string) => void;
  individual?: boolean;
}

function LinhaHorario(props: LinhaHorarioProps)
{
  const { hora, item, bloqueado, emAtendimento, individual } = props;
  const situacao = item
    ? item.st_agendamento
    : bloqueado
      ? 'Bloqueado'
      : emAtendimento
        ? 'Em atendimento'
        : 'Disponível';

  return ( <article className={item || bloqueado ? 'slot ocupado' : 'slot disponivel'} role="row">
             <time role="cell" data-rotulo="Horário">
               {hora}
             </time>
             <span role="cell" data-rotulo="Situação" className="slot-status">
               {situacao}
             </span>
             <span role="cell" data-rotulo="Cliente">
               {item?.nm_usuario || '—'}
               {item?.nm_barbeiro && <small className="slot-profissional">{item.nm_barbeiro}</small>}
             </span>
             <span role="cell" data-rotulo="Serviço">
               {item?.ds_servicos || '—'}
             </span>
             <span role="cell" data-rotulo="Preço">
               {item ? moeda(item.vl_total) : '—'}
             </span>
             <span role="cell" data-rotulo="Ação">
               <AcaoHorario hora={hora}
                            item={item}
                            livre={!bloqueado && !(individual && emAtendimento)}
                            finalizar={props.finalizar}
                            agendar={props.agendar}/>
             </span>
           </article>
  );
}

interface AcaoHorarioProps {
  hora: string;
  item?: Agendamento;
  livre: boolean;
  finalizar: (item: Agendamento) => void;
  agendar?: (hora: string) => void;
}

function AcaoHorario({hora ,item ,livre ,finalizar ,agendar}: AcaoHorarioProps)
{
  if (item && estaFinalizado(item.st_agendamento))
  {
    return ( <span className="slot-concluido" aria-label="Serviço finalizado">
               ✓
             </span>
    );
  }
  if (item) return <button onClick={() => finalizar(item)}>Finalizar</button>;
  if (agendar && livre)
  {
    return ( <button className="agendar-cliente" onClick={() => agendar(hora)}>
               Agendar
             </button>
    );
  }
  return <>—</>;
}

function estaBloqueado(hora: string, bloqueios: BloqueioHorario[])
{
  const atual = minutos(hora);
  return bloqueios.some(b => atual >= minutos(b.hr_inicio) && atual < minutos(b.hr_fim));
}

/** O horário cai dentro da duração de um atendimento que começou antes. */
function estaEmAtendimento(hora: string, agendamentos: Agendamento[])
{
  const atual = minutos(hora);
  return agendamentos.some(item =>
  {
    const inicio = minutos(item.hr_agendamento);
    const duracao = item.qt_minutos_total ?? item.qt_tempo ?? 30;
    return atual > inicio && atual < inicio + duracao;
  });
}
