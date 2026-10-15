import { Marca } from '../Marca/Marca';
import './Rodape.css';

export function Rodape({exibirWhatsapp = true}: { exibirWhatsapp?: boolean })
{
  return ( <footer className="rodape-site">
             <Marca className="rodape-logo" />
             <p>© {new Date().getFullYear()} Barbearia dos Reis. Todos os direitos reservados.</p>
             {exibirWhatsapp && (
               <a className="rodape-whatsapp"
                  href="https://wa.me/5518996609836"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Falar pelo WhatsApp"
                  title="WhatsApp">
                 <svg viewBox="0 0 24 24" aria-hidden="true">
                   <path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 .1 5.4.1 11.9c0 2.1.5 4.2 1.6 6L0 24l6.3-1.6a11.9 11.9 0 0 0 5.7 1.4c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.4Zm-8.5 18.3a9.9 9.9 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.7-.2-.4a9.9 9.9 0 1 1 8.3 4.7Zm5.4-7.4c-.3-.2-1.8-.9-2-.9-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.4.2-.7.1-2.3-1.1-3.8-3.3-4-3.6-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z" />
                 </svg>
               </a>
             )}
           </footer>
  );
}
