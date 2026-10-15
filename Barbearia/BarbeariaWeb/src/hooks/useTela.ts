import { useEffect, useState } from 'react';

/**
 * Tela atual do painel guardada na URL (/admin/agenda, /barbeiro/clientes...),
 * para que voltar/avançar do navegador e o recarregamento mantenham a tela.
 */
export function useTela<T extends string>(base: string, telas: readonly T[], inicial: T)
{
  const lerUrl = () =>
  {
    const trecho = window.location.pathname.split('/')[2] as T;
    return telas.includes(trecho) ? trecho : inicial;
  };

  const [tela, setTela] = useState<T>(lerUrl);

  useEffect(() =>
  {
    const voltar = () => setTela(lerUrl());
    window.addEventListener('popstate', voltar);
    return () => window.removeEventListener('popstate', voltar);
  }, []);

  function mudar(nova: T)
  {
    setTela(nova);
    window.history.pushState(null, '', `/${base}/${nova}`);
  }

  return [tela, mudar] as const;
}
