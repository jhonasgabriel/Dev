import { useState } from 'react';
import { Mensagem } from '../../../components/Mensagem/Mensagem';
import { Avatar } from '../../../components/Profissional/Avatar';
import { useConsulta } from '../../../hooks/useConsulta';
import { listarBarbeiros } from '../../../services/usuarioService';
import type { UsuarioBarbeiro } from '../../../services/usuarioService';
import { formatarTelefone } from '../../../utils/formatacao';
import { CadastroBarbeiroModal } from './CadastroBarbeiroModal';
import { PerfilBarbeiro } from './PerfilBarbeiro';
import '../Barbeiros.css';

/** Equipe: lista de barbeiros, cadastro e perfil individual. */
export function Barbeiros()
{
  const consulta = useConsulta('barbeiros', listarBarbeiros, []);
  const [perfil, setPerfil] = useState<UsuarioBarbeiro | null>(null);
  const [cadastro, setCadastro] = useState(false);
  const [mensagem, setMensagem] = useState('');

  if (perfil)
  {
    return ( <PerfilBarbeiro
               barbeiro={perfil}
               voltar={() =>
               {
                 setPerfil(null);
                 void consulta.atualizar();
               }}
               fotoAlterada={caminho => setPerfil({ ...perfil, ds_imagem: caminho })}/>
    );
  }

  const barbeiros = consulta.dados ?? [];

  return ( <section className="admin-bloco barbeiros-painel">
             <div className="admin-bloco-titulo clientes-titulo">
               <h2>Barbeiros</h2>
               <button className="cadastrar-cliente" type="button" onClick={() => setCadastro(true)}>
                 + Cadastrar
               </button>
             </div>
             <p className="barbeiros-orientacao">Gerencie a equipe e consulte o desempenho individual.</p>

             <Mensagem erro={consulta.erro} sucesso={mensagem} />

             <div className="clientes-lista">
               {barbeiros.map(barbeiro => (
                 <article key={barbeiro.id_usuario}>
                   <Avatar nome={barbeiro.nm_usuario} imagem={barbeiro.ds_imagem} tamanho={42} />
                   <div>
                     <strong>{barbeiro.nm_usuario}</strong>
                     <span>
                       {formatarTelefone(barbeiro.no_telefone)} · {barbeiro.sn_ativo === 'S' ? 'Ativo' : 'Inativo'}
                     </span>
                     {!barbeiro.sn_senha_definida && <small>Senha pendente</small>}
                   </div>
                   <button className="cliente-historico"
                           onClick={() =>
                           {
                             setMensagem('');
                             setPerfil(barbeiro);
                           }}>
                     Ver perfil
                   </button>
                 </article>
               ))}
             </div>
             {!barbeiros.length && !consulta.carregando && <p className="admin-vazio">Nenhum barbeiro cadastrado.</p>}

             {cadastro && (
               <CadastroBarbeiroModal fechar={() => setCadastro(false)}
                                      cadastrado={texto =>
                                      {
                                        setCadastro(false);
                                        setMensagem(texto);
                                        void consulta.atualizar();
                                      }}/>
             )}
           </section>
  );
}
