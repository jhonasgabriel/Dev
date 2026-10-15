import { api } from './http';

/** Conclui o agendamento: inicia o atendimento e registra o valor recebido. */
export const finalizarAgendamento = (dados: {
  id_agendamento: number;
  dt_atendimento: string;
  vl_recebido: number;
  forma_pagamento: string;
}) => api<void>('/controle/finalizar', 'POST', dados);