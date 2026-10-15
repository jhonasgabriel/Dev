const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

/** Mensagem de erro se a imagem não puder ser enviada; vazio quando válida. */
export function validarImagem(arquivo: File)
{
  if (!TIPOS_ACEITOS.includes(arquivo.type)) return 'Envie uma imagem JPEG, PNG ou WebP.';
  if (arquivo.size > TAMANHO_MAXIMO) return 'A imagem deve possuir no máximo 5 MB.';
  return '';
}
