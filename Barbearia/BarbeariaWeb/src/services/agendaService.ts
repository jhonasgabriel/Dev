import { api } from './http';

export interface Agendamento {
  id_agendamento: number;
  id_pessoa: number;
  id_barbeiro?: number | null;
  nm_barbeiro?: string;
  dt_agendamento: string;
  hr_agendamento: string;
  vl_total: number;
  qt_tempo?: number;
  qt_minutos_total?: number;
  forma_pagamento: string;
  st_agendamento: string;
  nm_usuario?: string;
  nm_servico?: string;
  ds_servicos?: string;
}

export interface HorarioFuncionamento {
  id_horario: number;
  dia_semana: number;
  hr_abertura: string;
  hr_fechamento: string;
  hr_inicio_almoco: string | null;
  hr_fim_almoco: string | null;
  sn_ativo: string;
}

export type DadosHorario = Omit<HorarioFuncionamento, 'id_horario'>;

export interface BloqueioHorario {
  id_bloqueio_horario: number;
  dt_bloqueio: string;
  hr_inicio: string;
  hr_fim: string;
  ds_motivo?: string;
  id_barbeiro?: number | null;
}

export interface Disponibilidade {
  hr_agendamento: string;
  dt_agendamento: string;
  st_disponibilidade: string;
}

/** "08:30" → "08:30:00" (formato TimeSpan da API). */
const horaApi = (hora: string | null) => (hora && hora.length === 5 ? `${hora}:00` : hora);

/** Horários livres do dia para os serviços escolhidos (e, opcionalmente, para um profissional). */
export const consultarDisponibilidade = (data: string, idsServico: number[], idBarbeiro?: number) =>
  api<Disponibilidade[]>('/agenda/consultar-agenda', 'POST', {
    dt_agendamento: data,
    id_servico: idsServico,
    id_barbeiro: idBarbeiro
  });

export const cadastrarAgendamento = (dados: {
  id_pessoa?: number;
  nm_cliente?: string;
  no_telefone?: string;
  id_barbeiro?: number;
  dt_agendamento: string;
  hr_agendamento: string;
  id_servico: number[];
}) =>
  api<Agendamento>('/agenda/agendamento', 'POST', {
    ...dados,
    hr_agendamento: horaApi(dados.hr_agendamento)
  });

/** Agendamentos do período. Para o barbeiro, a API devolve somente os dele. */
export const consultarAgendamentos = (inicio: string, fim: string, idUsuario?: number) =>
  api<Agendamento[]>('/agenda/consultar-agendamentos', 'POST', {
    dt_inicial: `${inicio}T00:00:00`,
    dt_final: `${fim}T23:59:59`,
    id_usuario: idUsuario
  });

export const cancelarAgendamento = (idAgendamento: number) => api<void>(`/agenda/${idAgendamento}/cancelar`, 'POST');

/** Horário global da barbearia (Admin). */
export const consultarHorarios = () => api<HorarioFuncionamento[]>('/agenda/horarios');

/** Horas do expediente no formato da API (hh:mm:ss). */
export const horarioParaApi = (horario: DadosHorario): DadosHorario => ({
  ...horario,
  hr_abertura: horaApi(horario.hr_abertura) ?? '',
  hr_fechamento: horaApi(horario.hr_fechamento) ?? '',
  hr_inicio_almoco: horaApi(horario.hr_inicio_almoco),
  hr_fim_almoco: horaApi(horario.hr_fim_almoco)
});

export const configurarHorario = (horario: DadosHorario) =>
  api<HorarioFuncionamento>('/agenda/configurar-horarios', 'POST', horarioParaApi(horario));

/** Bloqueios do dia: gerais (Admin) ou gerais + os do barbeiro logado. */
export const consultarBloqueios = (data: string) =>
  api<BloqueioHorario[]>(`/agenda/bloqueios?data=${encodeURIComponent(data)}`);

export const alterarBloqueio = (acao: 'bloquear' | 'desbloquear', data: string, inicio: string, fim: string) =>
  api<void>(`/agenda/${acao}-horario`, 'POST', {
    dt_bloqueio: `${data}T00:00:00`,
    hr_inicio: horaApi(inicio),
    hr_fim: horaApi(fim)
  });
