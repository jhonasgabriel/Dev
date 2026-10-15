import Admin from './pages/Admin/Admin';
import Barbeiro from './pages/Barbeiro/Barbeiro';
import Cliente from './pages/Cliente/Cliente';
import Home from './pages/Home/Home';
import Login from './pages/login/Login';
import { usuarioDaSessao } from './services/sessao';

/** Rotas da aplicação. Os painéis exigem sessão do perfil correspondente; sem ela, abre o login. */
function App()
{
  const caminho = window.location.pathname;
  const perfil = usuarioDaSessao()?.tp_usuario.toLowerCase();
  const em = (base: string) => caminho === base || caminho.startsWith(`${base}/`);

  if (em('/admin')) return perfil === 'admin' ? <Admin /> : <Login />;
  if (em('/barbeiro')) return perfil === 'barbeiro' ? <Barbeiro /> : <Login />;
  if (caminho === '/login') return <Login />;
  if (caminho === '/cliente') return <Cliente />;

  return <Home />;
}

export default App;
