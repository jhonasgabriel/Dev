import { useState } from 'react';
import type { FormEvent } from 'react';
import { Mensagem } from '../../../components/Mensagem/Mensagem';
import { BotoesImagem } from '../../../components/Profissional/BotoesImagem';
import { urlImagem } from '../../../services/http';
import {
  ativarProduto,
  atualizarProduto,
  cadastrarProduto,
  enviarImagemProduto,
  removerProduto
} from '../../../services/produtoService';
import type { Produto } from '../../../services/produtoService';
import { mensagemErro } from '../../../utils/formatacao';
import { validarImagem } from '../../../utils/imagem';

interface ProdutoModalProps {
  produto?: Produto;
  /** Todos os produtos, inclusive removidos (para recuperar um removido com o mesmo nome). */
  produtos: Produto[];
  fechar: () => void;
  salvo: () => void;
}

const paraFormulario = (produto?: Produto) => ({
  nm_produto: produto?.nm_produto ?? '',
  nm_marca: produto?.nm_marca ?? '',
  vl_produto: produto ? String(produto.vl_produto) : '',
  ds_produto: produto?.ds_produto ?? ''
});

const normalizar = (nome: string) => nome.trim().toLocaleLowerCase('pt-BR');

/** Cadastro, edição, restauração e remoção de produto, com foto da galeria ou da câmera. */
export function ProdutoModal({produto ,produtos ,fechar ,salvo}: ProdutoModalProps)
{
  const [form, setForm] = useState(paraFormulario(produto));
  const [idEdicao, setIdEdicao] = useState(produto?.id_produto ?? null);
  const [restaurando, setRestaurando] = useState(false);
  const [imagem, setImagem] = useState<File | null>(null);
  const [previa, setPrevia] = useState(urlImagem(produto?.ds_imagem));
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const editando = !!idEdicao && !restaurando;

  function escolherImagem(arquivo?: File)
  {
    if (!arquivo) return;
    const invalida = validarImagem(arquivo);
    if (invalida)
    {
      setErro(invalida);
      return;
    }
    if (previa.startsWith('blob:')) URL.revokeObjectURL(previa);
    setImagem(arquivo);
    setPrevia(URL.createObjectURL(arquivo));
    setErro('');
  }

  /** Ao digitar o nome de um produto removido, recupera os dados anteriores. */
  function recuperarRemovido()
  {
    if (idEdicao) return;
    const anterior = produtos.find(
      item => item.sn_ativo !== 'S' && normalizar(item.nm_produto) === normalizar(form.nm_produto)
    );
    if (!anterior) return;

    setIdEdicao(anterior.id_produto);
    setRestaurando(true);
    setForm(paraFormulario(anterior));
    setImagem(null);
    setPrevia(urlImagem(anterior.ds_imagem));
    setAviso('Produto removido encontrado. Os dados anteriores foram recuperados.');
  }

  async function salvar(evento: FormEvent)
  {
    evento.preventDefault();
    setOcupado(true);
    setErro('');
    try
    {
      const dados = { ...form, vl_produto: Number(form.vl_produto) };
      let id = idEdicao;

      if (id)
      {
        if (restaurando) await ativarProduto(id);
        await atualizarProduto(id, dados);
      }
      else
      {
        id = (await cadastrarProduto(dados)).id_produto;
      }

      if (imagem && id) await enviarImagemProduto(id, imagem);
      salvo();
    }
    catch (e)
    {
      setErro(mensagemErro(e));
    }
    finally
    {
      setOcupado(false);
    }
  }

  async function remover()
  {
    if (!idEdicao || !window.confirm(`Remover o produto ${form.nm_produto}?`)) return;
    setOcupado(true);
    setErro('');
    try
    {
      await removerProduto(idEdicao);
      salvo();
    }
    catch (e)
    {
      setErro(mensagemErro(e));
    }
    finally
    {
      setOcupado(false);
    }
  }

  return ( <div className="op-overlay">
             <section className="op-dialog" role="dialog" aria-modal="true" aria-label="Produto">
               <header>
                 <h2>{restaurando ? 'Restaurar produto' : editando ? 'Editar produto' : 'Cadastrar produto'}</h2>
                 <button type="button" disabled={ocupado} onClick={fechar}>
                   Fechar
                 </button>
               </header>

               <Mensagem erro={erro} sucesso={aviso} />

               <form onSubmit={salvar}>
                 <div className="produto-imagem-editor op-wide">
                   {previa ? (
                     <img src={previa} alt="Prévia do produto" />
                   ) : (
                     <div className="produto-imagem-vazia">Nenhuma imagem selecionada</div>
                   )}
                   <BotoesImagem classeBotao="produto-imagem-botao" camera="environment" escolher={escolherImagem} />
                   <small>JPEG, PNG ou WebP · máximo de 5 MB</small>
                 </div>

                 <label>
                   Nome
                   <input autoFocus
                          required
                          value={form.nm_produto}
                          onBlur={recuperarRemovido}
                          onChange={e => setForm({ ...form, nm_produto: e.target.value })}/>
                 </label>
                 <label>
                   Marca
                   <input value={form.nm_marca} onChange={e => setForm({ ...form, nm_marca: e.target.value })} />
                 </label>
                 <label>
                   Preço (R$)
                   <input required
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={form.vl_produto}
                          onChange={e => setForm({ ...form, vl_produto: e.target.value })}/>
                 </label>
                 <label>
                   Descrição
                   <input value={form.ds_produto} onChange={e => setForm({ ...form, ds_produto: e.target.value })} />
                 </label>

                 <button className="op-primary op-wide" disabled={ocupado}>
                   {ocupado ? 'Salvando...' : restaurando ? 'Restaurar Produto' : 'Salvar Produto'}
                 </button>
                 {editando && (
                   <button className="op-danger op-wide" type="button" disabled={ocupado} onClick={remover}>
                     Remover
                   </button>
                 )}
               </form>
             </section>
           </div>
  );
}
