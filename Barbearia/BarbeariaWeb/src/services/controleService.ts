import { api } from './http';

export interface Debito {
  id_atendimento: number;
  id_agendamento: number;
  id_pessoa: number;
  nm_usuario: string;
  ds_servicos: string;
  dt_atendimento: string;
  vl_total: number;
  vl_recebido: number;
  vl_pendente: number;
}

export interface Controle {
  resumo: {
    vl_recebido: number;
    vl_faturado: number;
    vl_pendente: number;
    qt_atendimentos: number;
    vl_pix: number;
    vl_credito: number;
    vl_debito: number;
    vl_especie: number;
  };
  debitos: Debito[];
  finalizados: number[];
  servicos: { nm_servico: string; vl_unitario: number; qt_servicos: number; vl_total: number }[];
  formas_pagamento: { forma_pagamento: string; qt_pagamentos: number; vl_total: number }[];
  profissionais: {
    id_usuario: number;
    nm_usuario: string;
    tp_usuario: string;
    qt_atendimentos: number;
    vl_faturado: number;
    vl_recebido: number;
    vl_pendente: number;
  }[];
}

export interface Recebimento {
  id_atendimento: number;
  vl_pagamento: number;
  forma_pagamento: string;
  cd_chave: string;
}

export const CONTROLE_VAZIO: Controle = {
  resumo: {
    vl_recebido: 0,
    vl_faturado: 0,
    vl_pendente: 0,
    qt_atendimentos: 0,
    vl_pix: 0,
    vl_credito: 0,
    vl_debito: 0,
    vl_especie: 0
  },
  debitos: [],
  finalizados: [],
  servicos: [],
  formas_pagamento: [],
  profissionais: []
};

export const consultarControle = (inicio: string, fim: string) =>
  api<Controle>(`/controle?inicio=${encodeURIComponent(inicio)}&fim=${encodeURIComponent(fim)}`);

/** Conclui o agendamento: inicia o atendimento e registra o valor recebido. */
export const finalizarAgendamento = (dados: {
  id_agendamento: number;
  dt_atendimento: string;
  vl_recebido: number;
  forma_pagamento: string;
}) => api<void>('/controle/finalizar', 'POST', dados);

/** A chave torna o recebimento idempotente: reenviar a mesma tentativa não duplica o pagamento. */
export const receberDebito = (recebimento: Recebimento) => api<void>('/controle/receber', 'POST', recebimento);

/** UUID v4 da operação (getRandomValues funciona também em HTTP na rede local). */
export function chaveOperacao()
{
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;

  const hex = Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}
