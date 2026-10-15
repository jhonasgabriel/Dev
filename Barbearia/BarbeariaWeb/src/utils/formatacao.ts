/** Mantém somente os dígitos, com limite de tamanho. */
export const somenteNumeros = (valor: string, limite: number) => valor.replace(/\D/g, '').slice(0, limite);

/** (00) 0000-0000 ou (00) 00000-0000 enquanto digita; o estado guarda somente os números. */
export function formatarTelefone(valor: string)
{
  const numeros = somenteNumeros(valor ?? '', 11);

  if (numeros.length <= 2) return numeros ? `(${numeros}` : '';
  if (numeros.length <= 6) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  if (numeros.length <= 10)
  {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

/** 000.000.000-00 enquanto digita; o estado guarda somente os números. */
export function formatarCpf(valor: string)
{
  const n = somenteNumeros(valor ?? '', 11);

  if (n.length <= 3) return n;
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

/** Confere os dígitos verificadores do CPF. */
export function cpfValido(valor: string)
{
  const n = somenteNumeros(valor ?? '', 11);
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;

  for (let posicao = 9; posicao <= 10; posicao++)
  {
    let soma = 0;
    for (let i = 0; i < posicao; i++) soma += Number(n[i]) * (posicao + 1 - i);
    if (Number(n[posicao]) !== ((soma * 10) % 11) % 10) return false;
  }
  return true;
}

export const moeda = (valor = 0) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Mensagem do erro para exibir ao usuário. */
export const mensagemErro = (erro: unknown, padrao = 'Não foi possível concluir a operação.') =>
  erro instanceof Error ? erro.message : padrao;
