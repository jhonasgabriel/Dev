import { useEffect, useRef, useState } from 'react';
import { CONFIGURACAO_PADRAO, paraConfiguracao } from '../components/Agenda/agenda';
import type { ConfiguracaoDia } from '../components/Agenda/agenda';
import type { HorarioFuncionamento } from '../services/agendaService';

/**
 * Expediente da semana já convertido para a tela.
 * O carregador decide a origem: horário global (Admin) ou do barbeiro.
 */
export function useHorarios(carregar: () => Promise<HorarioFuncionamento[]>)
{
  const carregador = useRef(carregar);
  const [horarios, setHorarios] = useState<ConfiguracaoDia[]>(CONFIGURACAO_PADRAO);
  const [versao, setVersao] = useState(0);

  useEffect(() =>
  {
    carregador
      .current()
      .then(lista => setHorarios(paraConfiguracao(lista)))
      .catch(() =>
      {
        /* Mantém o padrão até o próximo carregamento. */
      });
  }, [versao]);

  return { horarios, recarregar: () => setVersao(atual => atual + 1) };
}
