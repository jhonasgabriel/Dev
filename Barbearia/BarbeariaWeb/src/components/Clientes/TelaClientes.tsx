import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { OutPessoa } from '../../models/OutPessoa';
import { consultarPessoas } from '../../services/pessoaService';
import { listarProfissionais } from '../../services/usuarioService';
import type { Profissional } from '../../services/usuarioService';
import { dataBr } from '../../utils/datas';
import { formatarTelefone, mensagemErro, moeda, somenteNumeros } from '../../utils/formatacao';
import { Mensagem } from '../Mensagem/Mensagem';
import { CadastroClienteModal } from './CadastroClienteModal';
import { FichaCliente } from './FichaCliente';

interface TelaClientesProps {
  titulo: string;
  /** Admin: filtra por profissional e pode inativar/excluir clientes. */
  admin?: boolean;
}

/**
 * Tela "Clientes". Para o barbeiro, a API devolve somente clientes agendados ou atendidos por ele.
 */
export function TelaClientes({titulo ,admin = false}: TelaClientesProps)
{
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [idBarbeiro, setIdBarbeiro] = useState<number | undefined>();
  const [clientes, setClientes] = useState<OutPessoa[]>([]);
  const [erro, setErro] = useState('');
  const [ficha, setFicha] = useState<OutPessoa | null>(null);
  const [cadastro, setCadastro] = useState(false);

  async function buscar()
  {
    setErro('');
    try
    {
      setClientes(await consultarPessoas(nome.trim(), telefone, idBarbeiro));
    }
    catch (e)
    {
      setClientes([]);
      setErro(mensagemErro(e, 'Não foi possível consultar os clientes.'));
    }
  }

  // Busca ao abrir a tela e ao trocar o profissional; nome e telefone, ao enviar o formulário.
  useEffect(() =>
  {
    void buscar();
  }, [idBarbeiro]);

  function enviar(evento: FormEvent)
  {
    evento.preventDefault();
    void buscar();
  }

  return ( <section className="admin-bloco">
             <div className="admin-bloco-titulo clientes-titulo">
               <h2>{titulo}</h2>
               <button className="cadastrar-cliente" type="button" onClick={() => setCadastro(true)}>
                 + Cadastrar
               </button>
             </div>

             <form className="consulta-clientes clientes-filtros" onSubmit={enviar}>
               <label>
                 Nome
                 <input value={nome} placeholder="Nome ou apelido" onChange={e => setNome(e.target.value)} />
               </label>
               <label>
                 Telefone
                 <input inputMode="numeric"
                        maxLength={15}
                        placeholder="(00) 00000-0000"
                        value={formatarTelefone(telefone)}
                        onChange={e => setTelefone(somenteNumeros(e.target.value, 11))}/>
               </label>
               {admin && <FiltroProfissional valor={idBarbeiro} mudar={setIdBarbeiro} />}
               <button type="submit">Buscar cliente</button>
             </form>

             <Mensagem erro={erro} />

             <div className="clientes-lista">
               {clientes.map(cliente => (
                 <CartaoCliente key={cliente.id_pessoa}
                                cliente={cliente}
                                mostrarProfissionais={admin}
                                abrir={() => setFicha(cliente)}/>
               ))}
             </div>
             {!clientes.length && !erro && <p className="admin-vazio">Nenhum cliente encontrado.</p>}

             {ficha && (
               <FichaCliente key={ficha.id_pessoa}
                             pessoa={ficha}
                             gerenciar={admin}
                             fechar={() =>
                             {
                               setFicha(null);
                               void buscar();
                             }}/>
             )}

             {cadastro && <CadastroClienteModal fechar={() => setCadastro(false)} cadastrado={() => void buscar()} />}
           </section>
  );
}

interface CartaoClienteProps {
  cliente: OutPessoa;
  mostrarProfissionais: boolean;
  abrir: () => void;
}

function CartaoCliente({cliente ,mostrarProfissionais ,abrir}: CartaoClienteProps)
{
  const ultimo = cliente.dt_ultimo_atendimento ? dataBr(cliente.dt_ultimo_atendimento) : 'Sem atendimento';

  return ( <article>
             <div className="cliente-avatar">{cliente.nm_usuario.charAt(0).toUpperCase()}</div>
             <div>
               <strong>{cliente.nm_usuario}</strong>
               <span>
                 {formatarTelefone(cliente.no_telefone)} · {cliente.sn_ativo === 'S' ? 'Ativo' : 'Inativo'}
               </span>
               {mostrarProfissionais && <small>Profissionais: {cliente.nm_barbeiros || 'Sem profissional vinculado'}</small>}
               <small>
                 Atendimentos: {cliente.qt_atendimentos ?? 0} · Último: {ultimo}
               </small>
               <b>Pendente: {moeda(cliente.vl_pendente ?? 0)}</b>
             </div>
             <button className="cliente-historico" type="button" onClick={abrir}>
               Cadastro e histórico
             </button>
           </article>
  );
}

function FiltroProfissional({valor ,mudar}: { valor?: number; mudar: (id?: number) => void })
{
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);

  useEffect(() =>
  {
    listarProfissionais()
      .then(setProfissionais)
      .catch(() => setProfissionais([]));
  }, []);

  return ( <label>
             Profissional
             <select value={valor ?? ''} onChange={e => mudar(e.target.value ? Number(e.target.value) : undefined)}>
               <option value="">Clientes gerais</option>
               {profissionais.map(profissional => (
                 <option key={profissional.id_usuario} value={profissional.id_usuario}>
                   {profissional.nm_usuario}
                 </option>
               ))}
             </select>
           </label>
  );
}
