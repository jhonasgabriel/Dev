import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  titulo: string;
  subtitulo?: string;
  fechar: () => void;
  /** Enquanto ocupado (salvando), o modal não fecha. */
  ocupado?: boolean;
  className?: string;
  children: ReactNode;
}

/** Janela sobreposta padrão do painel (fundo escuro, título e botão ×). */
export function Modal({titulo ,subtitulo ,fechar ,ocupado = false ,className = '' ,children}: ModalProps)
{
  const idTitulo = `modal-${titulo.toLowerCase().replace(/\W+/g, '-')}`;
  const tentarFechar = () =>
  {
    if (!ocupado) fechar();
  };

  return ( <div className="modal-fundo" role="presentation" onMouseDown={tentarFechar}>
             <section className={`modal-cliente ${className}`.trim()}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby={idTitulo}
                      onMouseDown={evento => evento.stopPropagation()}>
               <div className="modal-topo">
                 <div>
                   {subtitulo && <span>{subtitulo}</span>}
                   <h2 id={idTitulo}>{titulo}</h2>
                 </div>
                 <button type="button" aria-label="Fechar" disabled={ocupado} onClick={tentarFechar}>
                   ×
                 </button>
               </div>
               {children}
             </section>
           </div>
  );
}

/** Diálogo nativo (<dialog>) usado nas operações financeiras: prende o foco e fecha com Esc. */
export function Dialogo({titulo ,fechar ,ocupado = false ,children}: ModalProps)
{
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() =>
  {
    const anterior = document.activeElement as HTMLElement | null;
    dialogo.current?.showModal();
    return () => anterior?.focus();
  }, []);

  return ( <dialog
             ref={dialogo}
             className="controle-dialog"
             aria-labelledby="dialogo-titulo"
             onCancel={evento =>
             {
               evento.preventDefault();
               if (!ocupado) fechar();
             }}>
             <header>
               <h2 id="dialogo-titulo">{titulo}</h2>
               <button type="button" aria-label="Fechar" disabled={ocupado} onClick={fechar}>
                 ×
               </button>
             </header>
             {children}
           </dialog>
  );
}
