import { api } from './http';

export interface Servico {
  id_servico: number;
  nm_servico: string;
  vl_servico: number;
  qt_minutos: number;
  ds_servico: string;
  sn_ativo: string;
}

export interface DadosServico {
  nm_servico: string;
  vl_servico: number;
  qt_minutos: number;
  ds_servico: string;
}

export const listarServicos = (incluirInativos = false) =>
  api<Servico[]>(`/servicos?incluirInativos=${incluirInativos}`);

export const cadastrarServico = (dados: DadosServico) => api<Servico>('/servicos', 'POST', dados);

export const atualizarServico = (id: number, dados: DadosServico) => api<void>(`/servicos/${id}`, 'PUT', dados);

export const excluirServico = (id: number) => api<void>(`/servicos/${id}`, 'DELETE');

export const alterarStatusServico = (id: number, ativo: boolean) =>
  api<void>(`/servicos/${id}/${ativo ? 'ativar' : 'inativar'}`, 'PATCH');
