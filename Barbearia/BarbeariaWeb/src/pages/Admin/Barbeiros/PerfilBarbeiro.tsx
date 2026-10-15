import { useEffect, useState } from 'react';
import { Mensagem } from '../../../components/Mensagem/Mensagem';
import { Avatar } from '../../../components/Profissional/Avatar';
import { FotoProfissional } from '../../../components/Profissional/FotoProfissional';
import { ServicosRealizados } from '../../../components/Profissional/ServicosRealizados';
import SeletorData from '../../../components/SeletorData/SeletorData';
import { consultarAgendamentos } from '../../../services/agendaService';
import type { Agendamento } from '../../../services/agendaService';
import { consultarClientesBarbeiro } from '../../../services/barbeiroService';
import type { ClienteBarbeiro } from '../../../services/barbeiroService';
import type { UsuarioBarbeiro } from '../../../services/usuarioService';
import { dataBr, hojeIso } from '../../../utils/datas';
import { formatarTelefone, mensagemErro, moeda } from '../../../utils/formatacao';
import { Relatorio } from '../Relatorio/Relatorio';

type Aba = 'agenda' | 'clientes' | 'servicos' | 'relatorio';

const ABAS: [Aba, string][] = [['agenda', 'Agenda']
                              ,['clientes', 'Clientes']
                              ,['servicos', 'Serviços']
                              ,['relatorio', 'Relatório']];

interface PerfilBarbeiroProps {
  barbeiro: UsuarioBarbeiro;
  voltar: () => void;
  fotoAlterada: (caminho: string) => void;
}

/** Perfil do barbeiro visto pelo Admin: agenda, clientes, serviços e relatório dele. */
export function PerfilBarbeiro({barbeiro ,voltar ,fotoAlterada}: PerfilBarbeiroProps)
{
  const [aba, setAba] = useState<Aba>('agenda');

  return ( <section className="admin-bloco barbeiros-painel">
             <div className="admin-bloco-titulo clientes-titulo">
               <div className="barbeiro-perfil-cabecalho">
                 <Avatar nome={barbeiro.nm_usuario} imagem={barbeiro.ds_imagem} tamanho={52} />
                 <div>
                   <span>Perfil do barbeiro</span>
                   <h2>{barbeiro.nm_usuario}</h2>
                 </div>
               </div>
               <button className="cadastrar-cliente" onClick={voltar}>
                 Voltar
               </button>
             </div>

             <p className="barbeiros-orientacao">
               {formatarTelefone(barbeiro.no_telefone)} · {barbeiro.sn_ativo === 'S' ? 'Ativo' : 'Inativo'}
             </p>

             <div className="barbeiro-perfil-acoes">
               {ABAS.map(([chave, nome]) => (
                 <button key={chave} className={aba === chave ? 'ativo' : ''} onClick={() => setAba(chave)}>
                   {nome}
                 </button>
               ))}
             </div>

             {aba === 'agenda' && <AgendaBarbeiro idBarbeiro={barbeiro.id_usuario} />}
             {aba === 'clientes' && <ClientesBarbeiro idBarbeiro={barbeiro.id_usuario} />}
             {aba === 'servicos' && (
               <div className="barbeiro-perfil-servicos">
                 <FotoProfissional id={barbeiro.id_usuario}
                                   nome={barbeiro.nm_usuario}
                                   imagem={barbeiro.ds_imagem}
                                   alterada={fotoAlterada}/>
                 <ServicosRealizados id={barbeiro.id_usuario} />
               </div>
             )}
             {aba === 'relatorio' && <Relatorio idBarbeiro={barbeiro.id_usuario} />}
           </section>
  );
}

function AgendaBarbeiro({idBarbeiro}: { idBarbeiro: number })
{
  const [data, setData] = useState(hojeIso());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() =>
  {
    setErro('');
    consultarAgendamentos(data, data, idBarbeiro)
      .then(setAgendamentos)
      .catch(e => setErro(mensagemErro(e, 'Não foi possível carregar a agenda.')));
  }, [data, idBarbeiro]);

  return ( <>
             <div className="filtros-agenda">
               <label>
                 Data de referência
                 <SeletorData id="perfil-barbeiro-data"
                              name="data"
                              value={data}
                              min="2020-01-01"
                              max="2100-12-31"
                              somenteCalendario
                              ariaLabel="Data do perfil"
                              onChange={setData}/>
               </label>
             </div>
             <Mensagem erro={erro} />
             <TabelaAgenda agendamentos={agendamentos} />
           </>
  );
}

/** Agenda em tabela; no celular cada linha vira um cartão. */
function TabelaAgenda({agendamentos}: { agendamentos: Agendamento[] })
{
  if (!agendamentos.length) return <p className="admin-vazio">Nenhum agendamento nesta data.</p>;

  return ( <div className="barbeiro-tabela">
             <table>
               <thead>
                 <tr>
                   <th>Hora</th>
                   <th>Cliente</th>
                   <th>Serviços</th>
                   <th>Valor</th>
                   <th>Status</th>
                 </tr>
               </thead>
               <tbody>
                 {agendamentos.map(item => (
                   <tr key={item.id_agendamento}>
                     <td data-rotulo="Hora">{item.hr_agendamento.slice(0, 5)}</td>
                     <td data-rotulo="Cliente">{item.nm_usuario}</td>
                     <td data-rotulo="Serviços">{item.ds_servicos}</td>
                     <td data-rotulo="Valor">{moeda(item.vl_total)}</td>
                     <td data-rotulo="Status">{item.st_agendamento}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
  );
}

function ClientesBarbeiro({idBarbeiro}: { idBarbeiro: number })
{
  const [clientes, setClientes] = useState<ClienteBarbeiro[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() =>
  {
    consultarClientesBarbeiro(idBarbeiro)
      .then(setClientes)
      .catch(e => setErro(mensagemErro(e, 'Não foi possível carregar os clientes.')));
  }, [idBarbeiro]);

  return ( <>
             <Mensagem erro={erro} />
             <div className="clientes-lista">
               {clientes.map(cliente => (
                 <article key={cliente.id_pessoa}>
                   <div className="cliente-avatar">{cliente.nm_usuario[0]}</div>
                   <div>
                     <strong>{cliente.nm_usuario}</strong>
                     <span>
                       {formatarTelefone(cliente.no_telefone)} · {cliente.qt_atendimentos} atendimentos
                     </span>
                     <small>
                       Último: {cliente.dt_ultimo_atendimento ? dataBr(cliente.dt_ultimo_atendimento) : 'Sem atendimento'}
                       {' · '}Gasto: {moeda(cliente.vl_total_gasto)} · Pendente: {moeda(cliente.vl_pendente)}
                     </small>
                   </div>
                 </article>
               ))}
               {!clientes.length && !erro && <p className="admin-vazio">Nenhum cliente vinculado.</p>}
             </div>
           </>
  );
}
