import { useEffect, useState } from 'react';
import { Mensagem } from '../../../components/Mensagem/Mensagem';
import { FotoProfissional } from '../../../components/Profissional/FotoProfissional';
import { ServicosRealizados } from '../../../components/Profissional/ServicosRealizados';
import { listarServicos } from '../../../services/servicoService';
import type { Servico } from '../../../services/servicoService';
import { usuarioLogado } from '../../../services/usuarioService';
import { moeda } from '../../../utils/formatacao';
import { ServicoModal } from './ServicoModal';

type Edicao = { servico?: Servico } | null;

/** Catálogo de serviços (Admin) e os serviços que o próprio Admin realiza. */
export function Servicos()
{
  const eu = usuarioLogado();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [edicao, setEdicao] = useState<Edicao>(null);
  const [mensagem, setMensagem] = useState('');
  const [versao, setVersao] = useState(0);

  useEffect(() =>
  {
    listarServicos(true)
      .then(setServicos)
      .catch(() => setServicos([]));
  }, [versao]);

  const ativos = servicos.filter(item => item.sn_ativo === 'S');

  function salvo(texto: string)
  {
    setEdicao(null);
    setMensagem(texto);
    setVersao(atual => atual + 1);
  }

  return ( <>
             <section className="admin-bloco">
               <div className="admin-bloco-titulo servicos-titulo">
                 <h2>Seus Serviços</h2>
                 <button className="cadastrar-servico" type="button" onClick={() => setEdicao({})}>
                   + Cadastrar Serviço
                 </button>
               </div>

               <Mensagem sucesso={mensagem} />

               <div className="servicos-admin">
                 {ativos.map(servico => (
                   <article key={servico.id_servico}>
                     <div>
                       <strong>{servico.nm_servico}</strong>
                       <span>
                         {servico.ds_servico || 'Sem descrição'} · {servico.qt_minutos} min
                       </span>
                     </div>
                     <b>{moeda(servico.vl_servico)}</b>
                     <div className="servico-acoes">
                       <button className="editar" type="button" onClick={() => setEdicao({ servico })}>
                         Editar
                       </button>
                     </div>
                   </article>
                 ))}
                 {!ativos.length && <p className="admin-vazio">Nenhum serviço cadastrado.</p>}
               </div>
             </section>

             <section className="admin-bloco servicos-proprios">
               <div className="admin-bloco-titulo">
                 <div>
                   <span>Você também atende</span>
                   <h2>Serviços que você realiza</h2>
                 </div>
               </div>
               <p className="barbeiros-orientacao">
                 Marque os serviços que você executa. No agendamento, o cliente só encontra você nos serviços marcados.
               </p>
               <FotoProfissional id={eu.id_usuario} nome={eu.nm_usuario} />
               <ServicosRealizados key={versao} id={eu.id_usuario} />
             </section>

             {edicao && (
               <ServicoModal servico={edicao.servico}
                             servicos={servicos}
                             fechar={() => setEdicao(null)}
                             salvo={salvo}/>
             )}
           </>
  );
}
