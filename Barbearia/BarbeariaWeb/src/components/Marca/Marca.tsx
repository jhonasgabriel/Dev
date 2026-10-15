import './Marca.css';

export function Marca({className = '' ,href = '/'}: { className?: string; href?: string })
{
  return ( <a className={`marca-reis ${className}`.trim()} href={href} aria-label="Barbearia dos Reis">
             <span>BARBEARIA</span>
             <strong>DOS REIS</strong>
             <svg viewBox="0 0 32 18" aria-hidden="true">
               <circle cx="8" cy="5" r="3" />
               <circle cx="8" cy="13" r="3" />
               <path d="M10.5 6.5 26 15M10.5 11.5 26 3M23 2l4 1-2 3M23 16l4-1-2-3" />
             </svg>
           </a>
  );
}
