import { useCallback, useEffect, useState } from 'react';
import { consultarAgendamentos, consultarBloqueios } from '../services/agendaService';
import type { Agendamento, BloqueioHorario } from '../services/agendaService';
import { mensagemErro } from '../utils/formatacao';

/**
 * Agendamentos e bloqueios de um dia. A API já restringe ao barbeiro logado;
 * para o Admin, traz a agenda de toda a barbearia.
 */
export function useAgendaDia(data: string)
{
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [bloqueios, setBloqueios] = useState<BloqueioHorario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const recarregar = useCallback(async () =>
  {
    setErro('');
    try
    {
      const [doDia, bloqueados] = await Promise.all([consultarAgendamentos(data, data), consultarBloqueios(data)]);
      setAgendamentos(doDia);
      setBloqueios(bloqueados);
    }
    catch (e)
    {
      setErro(mensagemErro(e, 'Não foi possível carregar a agenda.'));
    }
    finally
    {
      setCarregando(false);
    }
  }, [data]);

  useEffect(() =>
  {
    setCarregando(true);
    void recarregar();
  }, [recarregar]);

  return { agendamentos, bloqueios, carregando, erro, recarregar };
}

export type AgendaDia = ReturnType<typeof useAgendaDia>;
