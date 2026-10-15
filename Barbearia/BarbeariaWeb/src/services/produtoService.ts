import { api, enviarImagem } from './http';

export interface Produto {
  id_produto: number;
  nm_produto: string;
  nm_marca?: string;
  vl_produto: number;
  ds_produto: string;
  ds_imagem?: string;
  sn_ativo: string;
}

export interface DadosProduto {
  nm_produto: string;
  nm_marca: string;
  vl_produto: number;
  ds_produto: string;
}

export const listarProdutos = (incluirInativos = false) =>
  api<Produto[]>(`/produtos?incluirInativos=${incluirInativos}`);

export const cadastrarProduto = (dados: DadosProduto) => api<Produto>('/produtos', 'POST', dados);

export const atualizarProduto = (id: number, dados: DadosProduto) => api<void>(`/produtos/${id}`, 'PUT', dados);

export const removerProduto = (id: number) => api<void>(`/produtos/${id}`, 'DELETE');

export const ativarProduto = (id: number) => api<void>(`/produtos/${id}/ativar`, 'PATCH');

export const enviarImagemProduto = (id: number, imagem: File) =>
  enviarImagem<Produto>(`/produtos/${id}/imagem`, imagem);
