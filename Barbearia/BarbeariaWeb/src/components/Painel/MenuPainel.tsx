import { useEffect, useRef } from 'react';
import { Marca } from '../Marca/Marca';

export type ItemMenu = [chave: string, rotulo: string];

interface MenuPainelProps {
  telas: ItemMenu[];
  tela: string;
  mudar: (tela: string) => void;
  inicio: string;
  rotulo: string;
}

/** Menu lateral no desktop e gaveta (☰) no celular. */
export function MenuPainel({telas ,tela ,mudar ,inicio ,rotulo}: MenuPainelProps)
{
  const gaveta = useRef<HTMLDialogElement>(null);
  const botaoAbrir = useRef<HTMLButtonElement>(null);

  function abrir()
  {
    gaveta.current?.showModal();
    document.body.style.overflow = 'hidden';
  }

  function fechar()
  {
    gaveta.current?.close();
    document.body.style.overflow = '';
    botaoAbrir.current?.focus();
  }

  // Ao voltar para a largura de desktop, a gaveta não faz mais sentido.
  useEffect(() =>
  {
    const redimensionar = () =>
    {
      if (window.innerWidth > 1000 && gaveta.current?.open) fechar();
    };
    window.addEventListener('resize', redimensionar);
    return () =>
    {
      window.removeEventListener('resize', redimensionar);
      document.body.style.overflow = '';
    };
  }, []);

  const marca = <Marca className="admin-marca" href={inicio} />;

  const navegacao = (
    <nav aria-label={rotulo}>
      {telas.map(([chave, nome]) => (
        <button key={chave}
                className={tela === chave ? 'ativo' : ''}
                aria-current={tela === chave ? 'page' : undefined}
                onClick={() =>
                {
                  mudar(chave);
                  if (gaveta.current?.open) fechar();
                }}>
          {nome}
        </button>
      ))}
    </nav>
  );

  const sair = (
    <a className="admin-sair" href="/" onClick={() => localStorage.removeItem('usuario')}>
      Sair
    </a>
  );

  return ( <>
             <header className="admin-mobile-bar">
               <button ref={botaoAbrir} aria-label="Abrir menu" aria-haspopup="dialog" onClick={abrir}>
                 ☰
               </button>
               {marca}
             </header>

             <aside className="admin-sidebar">
               {marca}
               {navegacao}
               {sair}
             </aside>

             <dialog ref={gaveta}
                     className="admin-drawer"
                     aria-label={rotulo}
                     onCancel={e =>
                     {
                       e.preventDefault();
                       fechar();
                     }}
                     onClick={e =>
                     {
                       if (e.target === gaveta.current) fechar();
                     }}>
               <div className="admin-drawer-inner">
                 <button className="drawer-close" aria-label="Fechar menu" onClick={fechar}>
                   ×
                 </button>
                 {marca}
                 {navegacao}
                 {sair}
               </div>
             </dialog>
           </>
  );
}
