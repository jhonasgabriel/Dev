import type { InLogin } from '../models/InLogin';
import type { OutLogin } from '../models/OutLogin';

import { API_URL } from './http';

export async function login(param: InLogin): Promise<OutLogin>
{
  const response = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(param)
  });

  if (response.status === 401)
  {
    throw new Error('Nome ou senha inválidos.');
  }
  if (response.status === 429)
  {
    throw new Error('Muitas tentativas de login. Aguarde um minuto e tente novamente.');
  }

  if (!response.ok)
  {
    const texto = await response.text();
    let erro;
    try
    {
      erro = JSON.parse(texto);
    }
    catch
    {
      erro = null;
    }
    const validacao = erro?.errors ? Object.values(erro.errors).flat().join(' ') : '';
    throw new Error(validacao || erro?.message || erro?.title || 'Não foi possível realizar o login.');
  }

  return await response.json();
}
