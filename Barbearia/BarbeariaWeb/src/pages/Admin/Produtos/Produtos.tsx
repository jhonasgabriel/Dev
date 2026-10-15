import { useEffect, useState } from 'react';
import { Mensagem } from '../../../components/Mensagem/Mensagem';
import { urlImagem } from '../../../services/http';
import { listarProdutos } from '../../../services/produtoService';
import type { Produto } from '../../../services/produtoService';
import { mensagemErro, moeda } from '../../../utils/formatacao';
import { ProdutoModal } from './ProdutoModal';

type Edicao = { produto?: Produto } | null;

/** Produtos vendidos na barbearia (exibidos também na página inicial). */
export function Produtos()
{
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [edicao, setEdicao] = useState<Edicao>(null);

  async function carregar()
  {
    setErro('');
    setCarregando(true);
    try
    {
      setProdutos(await listarProdutos(true));
    }
    catch (e)
    {
      setProdutos([]);
      setErro(mensagemErro(e, 'Não foi possível carregar os produtos.'));
    }
    finally
    {
      setCarregando(false);
    }
  }

  useEffect(() =>
  {
    void carregar();
  }, []);

  const ativos = produtos.filter(item => item.sn_ativo === 'S');

  return ( <section className="operacoes">
             <header>
               <h2>Seus Produtos</h2>
               <button className="op-primary" onClick={() => setEdicao({})}>
                 + Cadastrar Produto
               </button>
             </header>

             <Mensagem erro={erro} />
             {erro && <button onClick={carregar}>Tentar novamente</button>}

             {carregando ? (
               <p role="status">Carregando produtos...</p>
             ) : (
               <div className="op-list produtos-admin-lista">
                 {ativos.map(produto => (
                   <CartaoProduto key={produto.id_produto} produto={produto} editar={() => setEdicao({ produto })} />
                 ))}
                 {!ativos.length && !erro && <p>Nenhum produto cadastrado.</p>}
               </div>
             )}

             {edicao && (
               <ProdutoModal produto={edicao.produto}
                             produtos={produtos}
                             fechar={() => setEdicao(null)}
                             salvo={() =>
                             {
                               setEdicao(null);
                               void carregar();
                             }}/>
             )}
           </section>
  );
}

function CartaoProduto({produto ,editar}: { produto: Produto; editar: () => void })
{
  return ( <article className="produto-admin-card">
             {produto.ds_imagem ? (
               <img src={urlImagem(produto.ds_imagem)} alt={produto.nm_produto} />
             ) : (
               <div className="produto-sem-imagem" aria-hidden="true">
                 ◇
               </div>
             )}
             <div>
               <strong>{produto.nm_produto}</strong>
               <p>
                 {produto.nm_marca || 'Sem marca'} · {produto.ds_produto}
               </p>
               <b>{moeda(produto.vl_produto)}</b>
             </div>
             <div className="op-actions">
               <button onClick={editar}>Editar</button>
             </div>
           </article>
  );
}
