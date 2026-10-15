import { api, enviarImagem } from './http';

export { urlImagem } from './http';

export interface Profissional {
  id_usuario: number;
  nm_usuario: string;
  ds_imagem?: string | null;
}

export interface UsuarioBarbeiro {
  id_usuario: number;
  id_pessoa: number;
  nm_usuario: string;
  no_telefone: string;
  tp_usuario: string;
  sn_ativo: string;
  sn_senha_definida: boolean;
  ds_imagem?: string | null;
}

export interface NovoBarbeiro {
  nm_usuario: string;
  cd_inscricao_nacional: string;
  dt_nascimento: string;
  no_telefone: string;
  senha: string;
  confirmar_senha: string;
}

export interface ServicoProfissional {
  id_servico: number;
  nm_servico: string;
  vl_servico: number;
  qt_minutos: number;
  ds_servico?: string;
  sn_realiza: boolean;
}

export interface UsuarioLogado {
  id_usuario: number;
  nm_usuario: string;
  tp_usuario: string;
}

/** Profissionais ativos; com serviços informados, somente os que realizam todos eles. */
export function listarProfissionais(servicos: number[] = [])
{
  const filtro = servicos.length ? `?servicos=${servicos.join(',')}` : '';
  return api<Profissional[]>(`/usuarios/profissionais${filtro}`);
}

export const listarBarbeiros = () => api<UsuarioBarbeiro[]>('/usuarios/barbeiros');

export const cadastrarBarbeiro = (dados: NovoBarbeiro) => api<UsuarioBarbeiro>('/usuarios/barbeiros', 'POST', dados);

export const servicosProfissional = (id: number) => api<ServicoProfissional[]>(`/usuarios/${id}/servicos`);

export const definirServicosProfissional = (id: number, servicos: number[]) =>
  api<void>(`/usuarios/${id}/servicos`, 'PUT', { id_servico: servicos });

/** Envia a foto e devolve o caminho público gravado. */
export async function enviarFotoProfissional(id: number, imagem: File)
{
  const resposta = await enviarImagem<{ ds_imagem: string }>(`/usuarios/${id}/foto`, imagem);
  return resposta?.ds_imagem ?? '';
}

export function usuarioLogado(): UsuarioLogado
{
  try
  {
    return JSON.parse(localStorage.getItem('usuario') ?? '{}');
  }
  catch
  {
    return { id_usuario: 0, nm_usuario: '', tp_usuario: '' };
  }
}
