import { useState } from 'react';
import type { FormEvent } from 'react';
import { login } from '../../services/loginService';
import './Login.css';
import { Rodape } from '../../components/Rodape/Rodape';
import { Marca } from '../../components/Marca/Marca';

function Login()
{
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function realizarLogin(event: FormEvent<HTMLFormElement>)
  {
    event.preventDefault();

    setMensagemErro('');

    if (!nome.trim())
    {
      setMensagemErro('Informe o nome.');
      return;
    }

    if (!senha)
    {
      setMensagemErro('Informe a senha.');
      return;
    }

    try
    {
      setCarregando(true);

      const usuario = await login({
        nm_usuario: nome.trim(),
        senha
      });

      const perfil = usuario.tp_usuario.toLowerCase();
      if (perfil !== 'admin' && perfil !== 'barbeiro')
      {
        throw new Error('Este acesso é exclusivo para administradores e barbeiros.');
      }
      localStorage.setItem(
        'usuario',
        JSON.stringify({
          id_usuario: usuario.id_usuario,
          id_pessoa: usuario.id_pessoa,
          nm_usuario: usuario.nm_usuario,
          tp_usuario: usuario.tp_usuario,
          cd_token: usuario.cd_token
        })
      );
      setSenha('');

      if (perfil === 'admin')
      {
        window.location.href = '/admin';
        return;
      }

      window.location.href = '/barbeiro';
    }
    catch (error)
    {
      if (error instanceof Error)
      {
        setMensagemErro(error.message);
      }
      else
      {
        setMensagemErro('Não foi possível realizar o login.');
      }
    }
    finally
    {
      setCarregando(false);
    }
  }

  return ( <main className="login-page">
             <section className="login-container">
               <div className="login-header">
                 <Marca className="login-marca" />
                 <h1>Acesso Restrito</h1>
                 <p>Área Exclusiva</p>
               </div>

               <form className="login-form" onSubmit={realizarLogin}>
                 <div className="form-group">
                   <label htmlFor="nome">Nome de acesso</label>

                   <input id="nome"
                          name="nome"
                          type="text"
                          value={nome}
                          onChange={event => setNome(event.target.value)}
                          placeholder="Digite seu nome"
                          maxLength={50}
                          autoComplete="username"
                          required/>
                 </div>

                 <div className="form-group">
                   <label htmlFor="senha">Senha</label>

                   <input id="senha"
                          name="senha"
                          type="password"
                          value={senha}
                          onChange={event => setSenha(event.target.value)}
                          placeholder="Digite sua senha"
                          maxLength={128}
                          autoComplete="current-password"
                          required/>
                 </div>

                 {mensagemErro && (
                   <div className="login-error" role="alert">
                     {mensagemErro}
                   </div>
                 )}

                 <button className="login-button" type="submit" disabled={carregando}>
                   {carregando ? 'Entrando...' : 'Entrar'}
                 </button>
               </form>

               <div className="login-footer">
                 <a href="/">← Voltar ao início</a>
               </div>
             </section>
             <Rodape />
           </main>
  );
}

export default Login;
