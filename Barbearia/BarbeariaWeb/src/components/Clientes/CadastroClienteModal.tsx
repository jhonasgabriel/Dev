import { useState } from 'react';
import type { FormEvent } from 'react';
import { cadastrarPessoa } from '../../services/pessoaService';
import { hojeIso } from '../../utils/datas';
import { formatarTelefone, mensagemErro, somenteNumeros } from '../../utils/formatacao';
import { Mensagem } from '../Mensagem/Mensagem';
import { Modal } from '../Modal/Modal';

const VAZIO = { nome: '', telefone: '', nascimento: '' };

/** Cadastro de cliente pela equipe (nome, telefone e nascimento opcional). */
export function CadastroClienteModal({fechar ,cadastrado}: { fechar: () => void; cadastrado: () => void })
{
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function salvar(evento: FormEvent)
  {
    evento.preventDefault();
    setErro('');
    setSucesso('');
    if (form.telefone.length < 10)
    {
      setErro('Informe um telefone válido com DDD.');
      return;
    }

    setOcupado(true);
    try
    {
      await cadastrarPessoa({
        nm_usuario: form.nome.trim(),
        no_telefone: form.telefone,
        dt_nascimento: form.nascimento || null
      });
      setSucesso('Cliente cadastrado com sucesso.');
      setForm(VAZIO);
      cadastrado();
    }
    catch (e)
    {
      setErro(mensagemErro(e, 'Não foi possível cadastrar o cliente.'));
    }
    finally
    {
      setOcupado(false);
    }
  }

  return ( <Modal titulo="Cadastrar cliente" subtitulo="Novo cadastro" fechar={fechar} ocupado={ocupado}>
             <form onSubmit={salvar}>
               <label>
                 Nome
                 <input autoFocus
                        required
                        minLength={3}
                        maxLength={50}
                        value={form.nome}
                        onChange={e => setForm({ ...form, nome: e.target.value })}/>
               </label>

               <label>
                 Telefone
                 <input required
                        inputMode="numeric"
                        maxLength={15}
                        placeholder="(00) 00000-0000"
                        value={formatarTelefone(form.telefone)}
                        onChange={e => setForm({ ...form, telefone: somenteNumeros(e.target.value, 11) })}/>
               </label>

               <label>
                 Data de nascimento (opcional)
                 <input type="date"
                        max={hojeIso()}
                        value={form.nascimento}
                        onChange={e => setForm({ ...form, nascimento: e.target.value })}/>
               </label>

               <Mensagem erro={erro} sucesso={sucesso} />
               <button className="salvar-cliente" type="submit" disabled={ocupado}>
                 {ocupado ? 'Cadastrando...' : 'Cadastrar cliente'}
               </button>
             </form>
           </Modal>
  );
}
