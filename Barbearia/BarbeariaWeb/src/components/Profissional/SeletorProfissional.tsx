import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { listarProfissionais } from '../../services/usuarioService';
import type { Profissional } from '../../services/usuarioService';
import { Avatar } from './Avatar';

interface SeletorProfissionalProps {
  servicos: number[];
  valor?: number;
  mudar: (id?: number) => void;
}

/**
 * Escolha do profissional com foto. Só lista quem realiza todos os serviços selecionados;
 * "Qualquer profissional" deixa o sistema sortear entre os disponíveis no horário.
 */
export function SeletorProfissional({servicos ,valor ,mudar}: SeletorProfissionalProps)
{
  const [lista, setLista] = useState<Profissional[]>([]);
  const [erro, setErro] = useState('');
  const chave = [...servicos].sort((a, b) => a - b).join(',');

  useEffect(() =>
  {
    let ativo = true;
    const ids = chave ? chave.split(',').map(Number) : [];

    listarProfissionais(ids)
      .then(dados =>
      {
        if (!ativo) return;
        setLista(dados);
        setErro('');
        // O escolhido deixou de realizar os serviços selecionados.
        if (valor && !dados.some(p => p.id_usuario === valor)) mudar(undefined);
      })
      .catch(() =>
      {
        if (ativo) setErro('Não foi possível carregar os profissionais.');
      });

    return () =>
    {
      ativo = false;
    };
  }, [chave]);

  return ( <div className="seletor-profissional">
             <div className="profissionais-cards" role="radiogroup" aria-label="Profissional">
               <CartaoProfissional ativo={!valor} escolher={() => mudar(undefined)}>
                 <span className="profissional-avatar sem-foto qualquer" aria-hidden="true">
                   ✦
                 </span>
                 <span>Qualquer profissional</span>
               </CartaoProfissional>

               {lista.map(profissional => (
                 <CartaoProfissional key={profissional.id_usuario}
                                     ativo={valor === profissional.id_usuario}
                                     escolher={() => mudar(profissional.id_usuario)}>
                   <Avatar nome={profissional.nm_usuario} imagem={profissional.ds_imagem} />
                   <span>{profissional.nm_usuario}</span>
                 </CartaoProfissional>
               ))}
             </div>

             {erro && <p className="profissional-aviso erro">{erro}</p>}
             {!erro && servicos.length > 0 && !lista.length && (
               <p className="profissional-aviso">Nenhum profissional realiza todos os serviços selecionados.</p>
             )}
           </div>
  );
}

interface CartaoProfissionalProps {
  ativo: boolean;
  escolher: () => void;
  children: ReactNode;
}

function CartaoProfissional({ativo ,escolher ,children}: CartaoProfissionalProps)
{
  return ( <button type="button" role="radio" aria-checked={ativo} className={ativo ? 'ativo' : ''} onClick={escolher}>
             {children}
           </button>
  );
}
