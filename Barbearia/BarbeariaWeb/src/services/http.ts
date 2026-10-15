export const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL ?? '');
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number)
  {
    super(message);
    this.status = status;
  }
}

// Algumas procedures antigas retornam texto UTF-8 como VARCHAR, gerando
// mensagens como "invÃ¡lido". Corrige apenas esse caso antes de exibir ao usuário.
function normalizarMensagem(valor: unknown): string
{
  if (typeof valor !== 'string') return '';
  if (!/[ÃÂ]/.test(valor)) return valor;
  try
  {
    const bytes = Uint8Array.from(valor, caractere => caractere.charCodeAt(0) & 0xff);
    const corrigida = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return corrigida.includes('�') ? valor : corrigida;
  }
  catch
  {
    return valor;
  }
}

export function authHeaders(json = false): HeadersInit
{
  let token = '';
  try
  {
    token = JSON.parse(localStorage.getItem('usuario') ?? '{}').cd_token ?? '';
  }
  catch
  {
    /* Sessão inválida. */
  }
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export function validarSessao(response: Response)
{
  if (response.status === 401)
  {
    localStorage.removeItem('usuario');
    if (window.location.pathname !== '/') window.location.replace('/');
    throw new ApiError('Sua sessão expirou. Entre novamente.', 401);
  }
}

/** Chamada JSON para a API: envia o token, trata sessão expirada e converte erros em ApiError. */
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T>
{
  return enviar<T>(path, {
    method,
    headers: authHeaders(body !== undefined),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

/** Upload de arquivo (multipart) no campo "imagem". */
export async function enviarImagem<T>(path: string, imagem: File): Promise<T>
{
  const dados = new FormData();
  dados.append('imagem', imagem);
  return enviar<T>(path, { method: 'POST', headers: authHeaders(), body: dados });
}

/** Caminho público de uma imagem enviada (/uploads/...). */
export function urlImagem(caminho?: string | null)
{
  if (!caminho) return '';
  return /^https?:\/\//i.test(caminho) ? caminho : `${API_URL}${caminho}`;
}

async function enviar<T>(path: string, init: RequestInit): Promise<T>
{
  let response: Response;
  try
  {
    response = await fetch(`${API_URL}/api${path}`, init);
  }
  catch
  {
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.');
  }

  if (response.status === 204) return undefined as T;
  validarSessao(response);
  const text = await response.text();
  let data;
  try
  {
    data = text ? JSON.parse(text) : null;
  }
  catch
  {
    data = null;
  }
  if (!response.ok)
  {
    const validation = data?.errors ? Object.values(data.errors).flat().join(' ') : '';
    const mensagem =
      validation ||
      data?.message ||
      data?.detail ||
      (response.status >= 500
        ? 'Servidor indisponível. Tente novamente.'
        : data?.title || `Não foi possível concluir a operação (${response.status}).`);
    throw new ApiError(normalizarMensagem(mensagem), response.status);
  }
  return data as T;
}
