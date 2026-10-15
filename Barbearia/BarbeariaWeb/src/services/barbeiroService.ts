import { horarioParaApi } from './agendaService';
import type { DadosHorario, HorarioFuncionamento } from './agendaService';
import { api } from './http';

export interface ResumoBarbeiro {
  qt_agendamentos: number;
  qt_confirmados: number;
  qt_cancelados: number;
  qt_clientes: number;
  vl_faturado: number;
  vl_recebido: number;
  vl_pendente: number;
}

export interface ClienteBarbeiro {
  id_pessoa: number;
  nm_usuario: string;
  no_telefone: string;
  sn_ativo: string;
  qt_agendamentos: number;
  qt_atendimentos: number;
  dt_ultimo_atendimento?: string;
  vl_total_gasto: number;
  vl_pendente: number;
}

export interface RelatorioBarbeiro {
  resumo: ResumoBarbeiro;
  servicos: { nm_servico: string; qt_servicos: number; vl_total: number }[];
  formas_pagamento: { forma_pagamento: string; qt_pagamentos: number; vl_total: number }[];
}

export interface HorarioBarbeiro extends HorarioFuncionamento {
  id_barbeiro: number;
  sn_personalizado: boolean;
}

export const consultarResumoBarbeiro = (id: number, inicio: string, fim: string) =>
  api<RelatorioBarbeiro>(`/barbeiros/${id}/resumo?inicio=${encodeURIComponent(inicio)}&fim=${encodeURIComponent(fim)}`);

export const consultarClientesBarbeiro = (id: number) => api<ClienteBarbeiro[]>(`/barbeiros/${id}/clientes`);

export const consultarHorariosBarbeiro = (id: number) => api<HorarioBarbeiro[]>(`/barbeiros/${id}/horarios`);

export const configurarHorarioBarbeiro = (id: number, horario: DadosHorario) =>
  api<HorarioBarbeiro>(`/barbeiros/${id}/horarios`, 'POST', horarioParaApi(horario));
