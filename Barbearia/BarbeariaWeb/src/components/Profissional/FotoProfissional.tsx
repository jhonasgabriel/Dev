import { useEffect, useState } from 'react';
import { enviarFotoProfissional } from '../../services/usuarioService';
import { mensagemErro } from '../../utils/formatacao';
import { validarImagem } from '../../utils/imagem';
import { Avatar } from './Avatar';
import { BotoesImagem } from './BotoesImagem';

interface FotoProfissionalProps {
  id: number;
  nome: string;
  imagem?: string | null;
  alterada?: (caminho: string) => void;
}

/** Foto do profissional: galeria ou câmera do celular (JPEG, PNG ou WebP até 5 MB). */
export function FotoProfissional({id ,nome ,imagem ,alterada}: FotoProfissionalProps)
{
  const [atual, setAtual] = useState(imagem ?? '');
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => setAtual(imagem ?? ''), [imagem]);

  async function enviar(arquivo?: File)
  {
    if (!arquivo) return;
    const invalida = validarImagem(arquivo);
    if (invalida)
    {
      setSucesso(false);
      setMensagem(invalida);
      return;
    }

    setOcupado(true);
    setMensagem('');
    try
    {
      const caminho = await enviarFotoProfissional(id, arquivo);
      setAtual(caminho);
      alterada?.(caminho);
      setSucesso(true);
      setMensagem('Foto atualizada.');
    }
    catch (e)
    {
      setSucesso(false);
      setMensagem(mensagemErro(e, 'Não foi possível enviar a foto.'));
    }
    finally
    {
      setOcupado(false);
    }
  }

  return ( <div className="foto-profissional">
             <Avatar nome={nome} imagem={atual} tamanho={88} />
             <div>
               <strong>Foto de exibição</strong>
               <small>Aparece para o cliente na escolha do profissional.</small>
               <BotoesImagem className="foto-profissional-acoes" desabilitado={ocupado} escolher={enviar} />
               {mensagem && (
                 <small role="status" className={sucesso ? 'ok' : 'erro'}>
                   {mensagem}
                 </small>
               )}
             </div>
           </div>
  );
}
