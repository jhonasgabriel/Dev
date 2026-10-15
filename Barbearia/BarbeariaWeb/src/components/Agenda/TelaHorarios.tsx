import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { DadosHorario } from '../../services/agendaService';
import { mensagemErro } from '../../utils/formatacao';
import { Mensagem } from '../Mensagem/Mensagem';
import type { ConfiguracaoDia } from './agenda';
import { BloqueiosModal } from './BloqueiosModal';

interface TelaHorariosProps {
  horarios: ConfiguracaoDia[];
  /** Grava um dia; Admin grava o horário global e o barbeiro, o próprio. */
  salvarDia: (horario: DadosHorario) => Promise<unknown>;
  /** Chamado após salvar a semana, para recarregar os horários. */
  salvos: () => void;
  subtituloBloqueio?: string;
}

type Campo = keyof Omit<ConfiguracaoDia, 'dia_semana' | 'nome'>;

/** Tela "Horários": expediente da semana e acesso ao bloqueio de horários. */
export function TelaHorarios({horarios ,salvarDia ,salvos ,subtituloBloqueio}: TelaHorariosProps)
{
  const [semana, setSemana] = useState(horarios);
  const [bloqueios, setBloqueios] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Os horários chegam da API depois da primeira renderização.
  useEffect(() => setSemana(horarios), [horarios]);

  function alterar(dia: number, campo: Campo, valor: string | boolean)
  {
    setSemana(atuais => atuais.map(item => (item.dia_semana === dia ? { ...item, [campo]: valor } : item)));
  }

  async function salvar(evento: FormEvent)
  {
    evento.preventDefault();
    setOcupado(true);
    setErro('');
    setSucesso('');
    try
    {
      await Promise.all(semana.map(item => salvarDia(paraApi(item))));
      setSucesso('Horários da semana salvos com sucesso.');
      salvos();
    }
    catch (e)
    {
      setErro(mensagemErro(e, 'Não foi possível salvar os horários.'));
    }
    finally
    {
      setOcupado(false);
    }
  }

  return ( <section className="admin-bloco">
             <div className="admin-bloco-titulo horarios-titulo">
               <h2>Configurar Horários da Semana</h2>
               <button className="bloqueio-horarios" type="button" onClick={() => setBloqueios(true)}>
                 Bloqueio de Horários
               </button>
             </div>

             <form className="semana-form" onSubmit={salvar}>
               <div className="semana-cabecalho">
                 <span>Dia</span>
                 <span>Abertura</span>
                 <span>Início do almoço</span>
                 <span>Fim do almoço</span>
                 <span>Fechamento</span>
               </div>

               {semana.map(dia => (
                 <LinhaDia key={dia.dia_semana} dia={dia} alterar={alterar} />
               ))}

               <Mensagem erro={erro} sucesso={sucesso} />
               <button className="salvar-horario" type="submit" disabled={ocupado}>
                 {ocupado ? 'Salvando...' : 'Salvar semana'}
               </button>
             </form>

             {bloqueios && <BloqueiosModal subtitulo={subtituloBloqueio} fechar={() => setBloqueios(false)} />}
           </section>
  );
}

interface LinhaDiaProps {
  dia: ConfiguracaoDia;
  alterar: (dia: number, campo: Campo, valor: string | boolean) => void;
}

function LinhaDia({dia ,alterar}: LinhaDiaProps)
{
  const campoHora = (rotulo: string, campo: Campo) => (
    <label>
      <span>{rotulo}</span>
      <input type="time"
             disabled={!dia.ativo}
             value={dia[campo] as string}
             onChange={e => alterar(dia.dia_semana, campo, e.target.value)}/>
    </label>
  );

  return ( <div className={dia.ativo ? 'dia-config' : 'dia-config fechado'}>
             <label className="dia-ativo">
               <input type="checkbox"
                      checked={dia.ativo}
                      onChange={e => alterar(dia.dia_semana, 'ativo', e.target.checked)}/>
               <strong>{dia.nome}</strong>
             </label>
             {campoHora('Abertura', 'hr_abertura')}
             {campoHora('Início do almoço', 'hr_inicio_almoco')}
             {campoHora('Fim do almoço', 'hr_fim_almoco')}
             {campoHora('Fechamento', 'hr_fechamento')}
           </div>
  );
}

const paraApi = (dia: ConfiguracaoDia): DadosHorario => ({
  dia_semana: dia.dia_semana,
  hr_abertura: dia.hr_abertura,
  hr_fechamento: dia.hr_fechamento,
  hr_inicio_almoco: dia.hr_inicio_almoco || null,
  hr_fim_almoco: dia.hr_fim_almoco || null,
  sn_ativo: dia.ativo ? 'S' : 'N'
});
