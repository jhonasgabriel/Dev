import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { cadastrarAgendamento } from '../../services/agendaService';
import { listarServicos } from '../../services/servicoService';
import type { Servico } from '../../services/servicoService';
import { servicosProfissional } from '../../services/usuarioService';
import { dataBr } from '../../utils/datas';
import { formatarTelefone, mensagemErro, moeda, somenteNumeros } from '../../utils/formatacao';
import { Mensagem } from '../Mensagem/Mensagem';
import { Modal } from '../Modal/Modal';
import { SeletorProfissional } from '../Profissional/SeletorProfissional';

interface AgendarClienteModalProps {
  data: string;
  hora: string;
  fechar: () => void;
  concluido: () => void;
  /** Painel do barbeiro: o agendamento é sempre dele e só aparecem os serviços que ele realiza. */
  idBarbeiroFixo?: number;
}

/** Agendamento feito pela equipe para um cliente (nome e telefone). */
export function AgendarClienteModal(props: AgendarClienteModalProps)
{
  const { data, hora, fechar, concluido, idBarbeiroFixo } = props;

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [idsServico, setIdsServico] = useState<number[]>([]);
  const [barbeiro, setBarbeiro] = useState<number | undefined>(idBarbeiroFixo);
  const [horario, setHorario] = useState(hora);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() =>
  {
    carregarServicos(idBarbeiroFixo)
      .then(setServicos)
      .catch(() => setErro('Não foi possível carregar os serviços.'));
  }, [idBarbeiroFixo]);

  const selecionados = servicos.filter(item => idsServico.includes(item.id_servico));
  const total = selecionados.reduce((soma, item) => soma + item.vl_servico, 0);
  const duracao = selecionados.reduce((soma, item) => soma + item.qt_minutos, 0);

  function alternarServico(id: number, marcado: boolean)
  {
    setIdsServico(atuais => (marcado ? [...atuais, id] : atuais.filter(item => item !== id)));
  }

  async function salvar(evento: FormEvent)
  {
    evento.preventDefault();
    if (!idsServico.length)
    {
      setErro('Selecione ao menos um serviço.');
      return;
    }
    if (telefone.length < 10)
    {
      setErro('Informe um telefone válido com DDD.');
      return;
    }

    setOcupado(true);
    setErro('');
    try
    {
      await cadastrarAgendamento({
        nm_cliente: nome.trim(),
        no_telefone: telefone,
        dt_agendamento: data,
        hr_agendamento: horario,
        id_servico: idsServico,
        id_barbeiro: idBarbeiroFixo ?? barbeiro
      });
      concluido();
    }
    catch (e)
    {
      setErro(mensagemErro(e, 'Não foi possível agendar.'));
    }
    finally
    {
      setOcupado(false);
    }
  }

  return ( <Modal
             titulo="Agendar para cliente"
             subtitulo={`Novo agendamento · ${dataBr(data)}`}
             className="agendamento-admin-modal"
             fechar={fechar}
             ocupado={ocupado}>
             <form onSubmit={salvar}>
               <label>
                 Nome do cliente
                 <input autoFocus
                        required
                        minLength={3}
                        maxLength={50}
                        value={nome}
                        onChange={e => setNome(e.target.value)}/>
               </label>

               <label>
                 Telefone
                 <input required
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={15}
                        placeholder="(00) 00000-0000"
                        value={formatarTelefone(telefone)}
                        onChange={e => setTelefone(somenteNumeros(e.target.value, 11))}/>
               </label>

               <label>
                 Horário
                 <input required type="time" step={1800} value={horario} onChange={e => setHorario(e.target.value)} />
               </label>

               <fieldset>
                 <legend>Serviços</legend>
                 <div className="agendamento-admin-servicos">
                   {servicos.map(servico =>
                   {
                     const marcado = idsServico.includes(servico.id_servico);
                     return ( <label key={servico.id_servico} className={marcado ? 'selecionado' : ''}>
                                <input type="checkbox"
                                       checked={marcado}
                                       onChange={e => alternarServico(servico.id_servico, e.target.checked)}/>
                                <span>
                                  <strong>{servico.nm_servico}</strong>
                                  <small>{servico.qt_minutos} min</small>
                                </span>
                                <b>{moeda(servico.vl_servico)}</b>
                              </label>
                     );
                   })}
                 </div>
               </fieldset>

               {!idBarbeiroFixo && (
                 <fieldset>
                   <legend>Profissional</legend>
                   <SeletorProfissional servicos={idsServico} valor={barbeiro} mudar={setBarbeiro} />
                 </fieldset>
               )}

               <div className="agendamento-admin-resumo">
                 <span>{duracao} min</span>
                 <strong>{moeda(total)}</strong>
               </div>

               <Mensagem erro={erro} />
               <button className="salvar-cliente" disabled={ocupado}>
                 {ocupado ? 'Agendando...' : 'Confirmar agendamento'}
               </button>
             </form>
           </Modal>
  );
}

/** Com profissional fixo, somente os serviços do catálogo que ele realiza. */
async function carregarServicos(idBarbeiro?: number)
{
  if (!idBarbeiro) return listarServicos();

  const [catalogo, doProfissional] = await Promise.all([listarServicos(), servicosProfissional(idBarbeiro)]);
  return catalogo.filter(servico =>
    doProfissional.some(item => item.sn_realiza && item.id_servico === servico.id_servico)
  );
}
