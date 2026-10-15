import Cliente from './pages/Cliente/Cliente';
import Home from './pages/Home/Home';
import Login from './pages/login/Login';

/** Rotas da aplicação: cada módulo adiciona as suas páginas aqui. */
function App()
{
  const caminho = window.location.pathname;

  if (caminho === '/login') return <Login />;
  if (caminho === '/cliente') return <Cliente />;

  return <Home />;
}

export default App;
