import { useEffect, useMemo, useState } from 'react';
import { Marca } from '../../components/Marca/Marca';
import { SeletorProfissional } from '../../components/Profissional/SeletorProfissional';
import { Rodape } from '../../components/Rodape/Rodape';
import { cadastrarAgendamento, consultarDisponibilidade } from '../../services/agendaService';
import { listarServicos } from '../../services/servicoService';
import type { Servico } from '../../services/servicoService';
import { dataLocal } from '../../utils/datas';
import { mensagemErro, moeda } from '../../utils/formatacao';
import { DadosClienteModal } from './DadosClienteModal';
import { EscolhaData, EscolhaHorario, EscolhaServicos, proximosDias, TituloEtapa } from './Etapas';
import type { HorarioLivre } from './Etapas';
import './Cliente.css';

const DATA_CURTA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});
const formatarData = (data: string) => DATA_CURTA.format(dataLocal(data));

/** Agendamento online: serviços → profissional → dia → horário → dados do cliente. */
function Cliente()
{
  const dias = useMemo(proximosDias, []);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [idsServico, setIdsServico] = useState<number[]>([]);
  const [idBarbeiro, setIdBarbeiro] = useState<number | undefined>();
  const [data, setData] = useState(dias[0]);
  const [horario, setHorario] = useState('');
  const [horarios, setHorarios] = useState<HorarioLivre[]>([]);
  const [dadosAbertos, setDadosAbertos] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() =>
  {
    listarServicos()
      .then(lista => setServicos(lista.filter(item => item.sn_ativo === 'S')))
      .catch(() => setServicos([]));
  }, []);

  useEffect(() =>
  {
    let ativo = true;
    if (!idsServico.length) return;

    buscarHorarios()
      .then(lista => ativo && setHorarios(lista))
      .catch(() =>
      {
        if (!ativo) return;
        setHorarios([]);
        setErro('Não foi possível consultar a agenda. Tente novamente.');
      });

    return () =>
    {
      ativo = false;
    };
  }, [data, idsServico, idBarbeiro]);

  async function buscarHorarios(): Promise<HorarioLivre[]>
  {
    const lista = await consultarDisponibilidade(data, idsServico, idBarbeiro);
    return lista.map(item => ({
      hora: item.hr_agendamento.slice(0, 5),
      disponivel: item.st_disponibilidade === 'DISPONIVEL'
    }));
  }

  /** Qualquer mudança de serviço, profissional ou dia invalida o horário escolhido. */
  function limparHorario()
  {
    setHorario('');
    setHorarios([]);
  }

  function alternarServico(id: number)
  {
    limparHorario();
    setIdsServico(atuais => (atuais.includes(id) ? atuais.filter(item => item !== id) : [...atuais, id]));
  }

  function abrirDados()
  {
    if (!horario || !idsServico.length)
    {
      setErro('Escolha ao menos um serviço e um horário para continuar.');
      return;
    }
    setErro('');
    setSucesso('');
    setDadosAbertos(true);
  }

  async function agendar(nome: string, telefone: string)
  {
    setOcupado(true);
    setErro('');
    try
    {
      await cadastrarAgendamento({
        nm_cliente: nome,
        no_telefone: telefone,
        dt_agendamento: data,
        hr_agendamento: horario,
        id_servico: idsServico,
        id_barbeiro: idBarbeiro
      });
      setSucesso(`Horário agendado com sucesso, ${nome.split(' ')[0]}! Esperamos por você.`);
      setHorario('');
      setDadosAbertos(false);
      buscarHorarios()
        .then(setHorarios)
        .catch(() => setHorarios([]));
    }
    catch (e)
    {
      setErro(mensagemErro(e, 'Não foi possível confirmar o agendamento.'));
    }
    finally
    {
      setOcupado(false);
    }
  }

  const selecionados = servicos.filter(item => idsServico.includes(item.id_servico));
  const duracao = selecionados.reduce((total, item) => total + item.qt_minutos, 0);
  const total = selecionados.reduce((soma, item) => soma + item.vl_servico, 0);

  return ( <main className="cliente-page">
             <header className="agendamento-header">
               <Marca className="agendamento-marca" />
               <a className="voltar-home" href="/">
                 ← Voltar ao início
               </a>
               <span aria-hidden="true" />
             </header>

             <section className="agendamento-apresentacao">
               <span>Reserve seu momento</span>
               <h1>Agende seu horário</h1>
               <p>Escolha os serviços, o melhor dia e o horário. O pagamento é definido somente no atendimento.</p>
             </section>

             <section className="agendamento-layout">
               <div className="agendamento-conteudo">
                 <TituloEtapa numero={1} titulo="Escolha os serviços">
                   Você pode selecionar mais de uma opção
                 </TituloEtapa>
                 <EscolhaServicos servicos={servicos} selecionados={idsServico} alternar={alternarServico} />

                 <TituloEtapa numero={2} titulo="Escolha o profissional">
                   Sem preferência, o sistema escolhe quem estiver livre no horário
                 </TituloEtapa>
                 <SeletorProfissional servicos={idsServico}
                                      valor={idBarbeiro}
                                      mudar={id =>
                                      {
                                        if (id === idBarbeiro) return;
                                        setIdBarbeiro(id);
                                        limparHorario();
                                      }}/>

                 <TituloEtapa numero={3} titulo="Escolha o dia">
                   Hoje ou um dos próximos 6 dias
                 </TituloEtapa>
                 <EscolhaData dias={dias}
                              valor={data}
                              mudar={dia =>
                              {
                                limparHorario();
                                setData(dia);
                              }}/>

                 <TituloEtapa numero={4} titulo="Escolha o horário">
                   Disponibilidade para {formatarData(data)}
                 </TituloEtapa>
                 <EscolhaHorario horarios={horarios}
                                 valor={horario}
                                 mudar={setHorario}
                                 semServicos={!idsServico.length}/>
               </div>

               <aside className="resumo-agendamento">
                 <span>Resumo</span>
                 <h2>Seu agendamento</h2>
                 <dl>
                   <ItemResumo rotulo="Serviços"
                               valor={selecionados.map(item => item.nm_servico).join(', ') || 'Selecione'}/>
                   <ItemResumo rotulo="Data" valor={formatarData(data)} />
                   <ItemResumo rotulo="Horário" valor={horario || 'Selecione'} />
                   <ItemResumo rotulo="Duração" valor={`${duracao} min`} />
                 </dl>

                 <div className="resumo-total">
                   <span>Total estimado</span>
                   <strong>{moeda(total)}</strong>
                 </div>

                 {erro && !dadosAbertos && (
                   <p className="mensagem erro" role="alert">
                     {erro}
                   </p>
                 )}
                 {sucesso && (
                   <p className="mensagem sucesso" role="status">
                     {sucesso}
                   </p>
                 )}

                 <button className="confirmar" type="button" disabled={ocupado} onClick={abrirDados}>
                   {ocupado ? 'Confirmando...' : 'Confirmar agendamento'}
                 </button>
               </aside>
             </section>

             <Rodape />

             {dadosAbertos && (
               <DadosClienteModal ocupado={ocupado}
                                  erro={erro}
                                  fechar={() => setDadosAbertos(false)}
                                  confirmar={agendar}/>
             )}
           </main>
  );
}

function ItemResumo({rotulo ,valor}: { rotulo: string; valor: string })
{
  return ( <div>
             <dt>{rotulo}</dt>
             <dd>{valor}</dd>
           </div>
  );
}

export default Cliente;
