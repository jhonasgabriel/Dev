import { useState } from 'react';
import type { FormEvent } from 'react';
import { Mensagem } from '../../../components/Mensagem/Mensagem';
import { Modal } from '../../../components/Modal/Modal';
import {
  alterarStatusServico,
  atualizarServico,
  cadastrarServico,
  excluirServico
} from '../../../services/servicoService';
import type { Servico } from '../../../services/servicoService';
import { mensagemErro } from '../../../utils/formatacao';

interface ServicoModalProps {
  /** Serviço em edição; sem ele, é um cadastro novo. */
  servico?: Servico;
  /** Todos os serviços, inclusive removidos (para recuperar um removido com o mesmo nome). */
  servicos: Servico[];
  fechar: () => void;
  salvo: (mensagem: string) => void;
}

const paraFormulario = (servico?: Servico) => ({
  nome: servico?.nm_servico ?? '',
  descricao: servico?.ds_servico ?? '',
  valor: servico ? String(servico.vl_servico) : '',
  minutos: servico ? String(servico.qt_minutos) : ''
});

const normalizar = (nome: string) => nome.trim().toLocaleLowerCase('pt-BR');

/** Cadastro, edição, restauração e remoção de um serviço do catálogo. */
export function ServicoModal({servico ,servicos ,fechar ,salvo}: ServicoModalProps)
{
  const [form, setForm] = useState(paraFormulario(servico));
  const [idEdicao, setIdEdicao] = useState(servico?.id_servico ?? null);
  const [restaurando, setRestaurando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const editando = !!idEdicao && !restaurando;
  const titulo = restaurando ? 'Restaurar Serviço' : editando ? 'Editar Serviço' : 'Cadastrar Serviço';

  /** Ao digitar o nome de um serviço removido, recupera os dados anteriores. */
  function recuperarRemovido()
  {
    if (idEdicao) return;
    const anterior = servicos.find(
      item => item.sn_ativo !== 'S' && normalizar(item.nm_servico) === normalizar(form.nome)
    );
    if (!anterior) return;

    setForm(paraFormulario(anterior));
    setIdEdicao(anterior.id_servico);
    setRestaurando(true);
    setAviso('Serviço removido encontrado. Os dados anteriores foram recuperados.');
  }

  async function executar(acao: () => Promise<void>, mensagem: string)
  {
    setOcupado(true);
    setErro('');
    try
    {
      await acao();
      salvo(mensagem);
    }
    catch (e)
    {
      setErro(mensagemErro(e, 'Não foi possível salvar o serviço.'));
    }
    finally
    {
      setOcupado(false);
    }
  }

  function salvar(evento: FormEvent)
  {
    evento.preventDefault();
    const dados = {
      nm_servico: form.nome.trim(),
      ds_servico: form.descricao.trim(),
      vl_servico: Number(form.valor),
      qt_minutos: Number(form.minutos)
    };

    if (!idEdicao)
    {
      void executar(async () => void (await cadastrarServico(dados)), 'Serviço cadastrado com sucesso.');
      return;
    }

    void executar(
      async () =>
      {
        if (restaurando) await alterarStatusServico(idEdicao, true);
        await atualizarServico(idEdicao, dados);
      },
      restaurando ? 'Serviço restaurado com sucesso.' : 'Serviço atualizado com sucesso.'
    );
  }

  function remover()
  {
    if (!idEdicao || !window.confirm(`Remover o serviço ${form.nome}?`)) return;
    void executar(() => excluirServico(idEdicao), 'Serviço removido com sucesso.');
  }

  return ( <Modal
             titulo={titulo}
             subtitulo={restaurando ? 'Restaurar serviço' : editando ? 'Editar serviço' : 'Novo serviço'}
             fechar={fechar}
             ocupado={ocupado}>
             <form onSubmit={salvar}>
               <label>
                 Nome
                 <input autoFocus
                        required
                        value={form.nome}
                        onBlur={recuperarRemovido}
                        onChange={e => setForm({ ...form, nome: e.target.value })}/>
               </label>
               <label>
                 Descrição
                 <input maxLength={255}
                        value={form.descricao}
                        onChange={e => setForm({ ...form, descricao: e.target.value })}/>
               </label>
               <label>
                 Valor
                 <input required
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={form.valor}
                        onChange={e => setForm({ ...form, valor: e.target.value })}/>
               </label>
               <label>
                 Duração em minutos
                 <input required
                        type="number"
                        min="1"
                        value={form.minutos}
                        onChange={e => setForm({ ...form, minutos: e.target.value })}/>
               </label>

               <Mensagem erro={erro} sucesso={aviso} />

               <div className={editando ? 'modal-acoes' : ''}>
                 <button className="salvar-cliente" type="submit" disabled={ocupado}>
                   {restaurando ? 'Restaurar Serviço' : editando ? 'Salvar alterações' : 'Cadastrar Serviço'}
                 </button>
                 {editando && (
                   <button className="remover-modal" type="button" disabled={ocupado} onClick={remover}>
                     Remover
                   </button>
                 )}
               </div>
             </form>
           </Modal>
  );
}
