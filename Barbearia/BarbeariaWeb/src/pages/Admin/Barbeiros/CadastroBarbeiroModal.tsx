import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Mensagem } from '../../../components/Mensagem/Mensagem';
import { Modal } from '../../../components/Modal/Modal';
import { BotoesImagem } from '../../../components/Profissional/BotoesImagem';
import { cadastrarBarbeiro, enviarFotoProfissional } from '../../../services/usuarioService';
import { dataComIdade } from '../../../utils/datas';
import { cpfValido, formatarCpf, formatarTelefone, mensagemErro, somenteNumeros } from '../../../utils/formatacao';
import { validarImagem } from '../../../utils/imagem';

const VAZIO = { nome: '', cpf: '', nascimento: '', telefone: '', senha: '', confirmar: '' };

interface CadastroBarbeiroModalProps {
  fechar: () => void;
  /** Mensagem para a lista (inclui aviso se a foto não pôde ser enviada). */
  cadastrado: (mensagem: string) => void;
}

/** Cadastro do barbeiro: dados pessoais, foto opcional e senha com confirmação. */
export function CadastroBarbeiroModal({fechar ,cadastrado}: CadastroBarbeiroModalProps)
{
  const [form, setForm] = useState(VAZIO);
  const [foto, setFoto] = useState<File | null>(null);
  const [previa, setPrevia] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  // Libera a URL temporária da prévia ao trocar de foto ou fechar.
  useEffect(() =>
  {
    return () =>
    {
      if (previa) URL.revokeObjectURL(previa);
    };
  }, [previa]);

  const alterar = (campo: keyof typeof VAZIO, valor: string) => setForm({ ...form, [campo]: valor });

  function escolherFoto(arquivo?: File)
  {
    if (!arquivo) return;
    const invalida = validarImagem(arquivo);
    if (invalida)
    {
      setErro(invalida);
      return;
    }
    setFoto(arquivo);
    setPrevia(URL.createObjectURL(arquivo));
    setErro('');
  }

  function validar()
  {
    if (!cpfValido(form.cpf)) return 'CPF inválido.';
    if (form.telefone.length < 10) return 'Informe um telefone válido com DDD.';
    if (form.senha !== form.confirmar) return 'As senhas não conferem.';
    return '';
  }

  async function salvar(evento: FormEvent)
  {
    evento.preventDefault();
    const invalido = validar();
    if (invalido)
    {
      setErro(invalido);
      return;
    }

    setOcupado(true);
    setErro('');
    try
    {
      const criado = await cadastrarBarbeiro({
        nm_usuario: form.nome.trim(),
        cd_inscricao_nacional: form.cpf,
        dt_nascimento: form.nascimento,
        no_telefone: form.telefone,
        senha: form.senha,
        confirmar_senha: form.confirmar
      });

      let aviso = '';
      if (foto)
      {
        try
        {
          await enviarFotoProfissional(criado.id_usuario, foto);
        }
        catch
        {
          aviso = ' A foto não pôde ser enviada; envie novamente pelo perfil.';
        }
      }

      cadastrado(
        'Barbeiro cadastrado. Ele já pode entrar com o nome e a senha; ' +
          `peça para marcar os serviços que realiza.${aviso}`
      );
    }
    catch (e)
    {
      setErro(mensagemErro(e, 'Não foi possível cadastrar.'));
    }
    finally
    {
      setOcupado(false);
    }
  }

  return ( <Modal titulo="Cadastrar barbeiro" subtitulo="Novo cadastro" fechar={fechar} ocupado={ocupado}>
             <form onSubmit={salvar}>
               <div className="barbeiro-foto-cadastro">
                 {previa ? (
                   <img src={previa} alt="Prévia da foto" />
                 ) : (
                   <span aria-hidden="true">{(form.nome.trim()[0] ?? '?').toUpperCase()}</span>
                 )}
                 <div>
                   <BotoesImagem className="barbeiro-foto-botoes"
                                 classeBotao="barbeiro-foto-botao"
                                 escolher={escolherFoto}/>
                   <small>Opcional · JPEG, PNG ou WebP até 5 MB</small>
                 </div>
               </div>

               <label>
                 Nome (usado no login)
                 <input autoFocus
                        required
                        minLength={3}
                        maxLength={50}
                        value={form.nome}
                        onChange={e => alterar('nome', e.target.value)}/>
               </label>
               <label>
                 CPF
                 <input required
                        inputMode="numeric"
                        maxLength={14}
                        placeholder="000.000.000-00"
                        value={formatarCpf(form.cpf)}
                        onChange={e => alterar('cpf', somenteNumeros(e.target.value, 11))}/>
               </label>
               <label>
                 Data de nascimento
                 <input required
                        type="date"
                        max={dataComIdade(14)}
                        value={form.nascimento}
                        onChange={e => alterar('nascimento', e.target.value)}/>
               </label>
               <label>
                 Telefone
                 <input required
                        inputMode="numeric"
                        maxLength={15}
                        placeholder="(00) 00000-0000"
                        value={formatarTelefone(form.telefone)}
                        onChange={e => alterar('telefone', somenteNumeros(e.target.value, 11))}/>
               </label>
               <label>
                 Senha
                 <input type="password"
                        required
                        minLength={10}
                        maxLength={128}
                        autoComplete="new-password"
                        value={form.senha}
                        onChange={e => alterar('senha', e.target.value)}/>
               </label>
               <label>
                 Confirme a senha
                 <input type="password"
                        required
                        minLength={10}
                        maxLength={128}
                        autoComplete="new-password"
                        value={form.confirmar}
                        onChange={e => alterar('confirmar', e.target.value)}/>
               </label>

               {form.confirmar && form.senha !== form.confirmar && <Mensagem erro="As senhas não conferem." />}
               <Mensagem erro={erro} />

               <button className="salvar-cliente" disabled={ocupado}>
                 {ocupado ? 'Cadastrando...' : 'Cadastrar barbeiro'}
               </button>
             </form>
           </Modal>
  );
}
