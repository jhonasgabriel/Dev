interface UsuarioSessao {
  id_usuario: number;
  tp_usuario: string;
  cd_token: string;
}

/** Lê o "exp" do JWT (sem validar a assinatura: quem valida é a API a cada chamada). */
function expiracaoDoToken(token: string)
{
  const payload = token.split('.')[1];
  if (!payload) return null;

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const completo = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return (JSON.parse(atob(completo)) as { exp?: number }).exp;
}

/** Usuário logado (Admin ou Barbeiro). Token vencido ou inválido encerra a sessão. */
export function usuarioDaSessao(): UsuarioSessao | null
{
  try
  {
    const usuario = JSON.parse(localStorage.getItem('usuario') ?? '{}') as Partial<UsuarioSessao>;
    if (!usuario.id_usuario || !usuario.cd_token || !usuario.tp_usuario) throw new Error();

    const expiracao = expiracaoDoToken(usuario.cd_token);
    if (typeof expiracao === 'number' && expiracao * 1000 <= Date.now()) throw new Error();

    return usuario as UsuarioSessao;
  }
  catch
  {
    localStorage.removeItem('usuario');
    return null;
  }
}
