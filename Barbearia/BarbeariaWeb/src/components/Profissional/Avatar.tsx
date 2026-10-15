import { urlImagem } from '../../services/http';
import './Profissional.css';

const inicial = (nome: string) => (nome.trim()[0] ?? '?').toUpperCase();

/** Foto redonda do profissional; sem foto, mostra a inicial do nome. */
export function Avatar({nome ,imagem ,tamanho = 64}: { nome: string; imagem?: string | null; tamanho?: number })
{
  const estilo = { width: tamanho, height: tamanho };

  if (imagem)
  {
    return <img className="profissional-avatar" style={estilo} src={urlImagem(imagem)} alt={nome} />;
  }
  return ( <span className="profissional-avatar sem-foto" style={estilo} aria-hidden="true">
             {inicial(nome)}
           </span>
  );
}
