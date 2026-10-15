import { useCallback, useEffect, useRef, useState } from 'react';

export function useConsulta<T>(chave: string, consultar: () => Promise<T>, fallback?: T)
{
  const consulta = useRef(consultar);
  const valorFallback = useRef(fallback);
  useEffect(() =>
  {
    consulta.current = consultar;
    valorFallback.current = fallback;
  }, [consultar, fallback]);
  const geracao = useRef(0);
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const atualizar = useCallback(async () =>
  {
    const id = ++geracao.current;
    try
    {
      const resposta = await consulta.current();
      if (id === geracao.current)
      {
        setDados(resposta);
        setErro('');
      }
    }
    catch (e)
    {
      if (id === geracao.current)
      {
        if (valorFallback.current !== undefined) setDados(valorFallback.current);
        setErro(e instanceof Error ? e.message : 'Não foi possível atualizar os dados.');
      }
    }
    finally
    {
      if (id === geracao.current) setCarregando(false);
    }
  }, []);
  useEffect(() =>
  {
    setDados(fallback ?? null);
    setErro('');
    setCarregando(true);
    void atualizar();
    const timer = window.setInterval(() =>
    {
      if (!document.hidden) void atualizar();
    }, 30000);
    const foco = () =>
    {
      if (!document.hidden) void atualizar();
    };
    document.addEventListener('visibilitychange', foco);
    return () =>
    {
      ++geracao.current;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', foco);
    };
  }, [chave, atualizar]);
  return { dados, erro, carregando, atualizar };
}
