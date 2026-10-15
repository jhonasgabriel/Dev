import type { InCadastrarPessoa } from '../models/InCadastrarPessoa';
import type { OutPessoa } from '../models/OutPessoa';
import { api } from './http';

export interface HistoricoPessoa {
  id_historico: number;
  dt_atendimento: string;
  ds_servicos: string;
  vl_total: number;
  forma_pagamento: string;
  st_atendimento: string;
}

export interface FrequenciaPessoa {
  qt_atendimentos: number;
  dt_ultimo_atendimento: string | null;
  vl_total_gasto: number;
  vl_total_pendente: number;
}

export const cadastrarPessoa = (dados: InCadastrarPessoa) => api<OutPessoa>('/pessoas/cadastrar', 'POST', dados);

/** Clientes; para o barbeiro, a API devolve somente os dele. */
export const consultarPessoas = (nome: string, telefone: string, idBarbeiro?: number) =>
  api<OutPessoa[]>('/pessoas/consultar', 'POST', {
    nm_usuario: nome || null,
    no_telefone: telefone || null,
    id_barbeiro: idBarbeiro || null
  });

export const atualizarPessoa = (pessoa: OutPessoa) =>
  api<void>(`/pessoas/atualizar/${pessoa.id_pessoa}`, 'PUT', pessoa);

export const removerPessoa = (id: number) => api<void>(`/pessoas/${id}`, 'DELETE');

export const alterarStatusPessoa = (id: number, ativo: boolean) =>
  api<void>(`/pessoas/${id}/${ativo ? 'ativar' : 'inativar'}`, 'PATCH');

export const historicoPessoa = (id: number) => api<HistoricoPessoa[]>(`/pessoas/${id}/historico`);

export const frequenciaPessoa = (id: number) => api<FrequenciaPessoa>(`/pessoas/${id}/frequencia`);
