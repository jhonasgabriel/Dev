import type { ReactNode } from 'react';
import { Rodape } from '../Rodape/Rodape';
import { MenuPainel } from './MenuPainel';
import type { ItemMenu } from './MenuPainel';

interface PainelProps {
  telas: ItemMenu[];
  tela: string;
  mudar: (tela: string) => void;
  inicio: string;
  rotulo: string;
  titulo: string;
  /** Avisos exibidos logo abaixo do título (ex.: atendimentos não finalizados). */
  avisos?: ReactNode;
  className?: string;
  children: ReactNode;
}

const DATA_EXTENSO = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long'
});

/** Estrutura dos painéis do Admin e do Barbeiro: menu, cabeçalho, conteúdo e rodapé. */
export function Painel({titulo ,avisos ,className = '' ,children ,...menu}: PainelProps)
{
  return ( <main className={`admin-page ${className}`.trim()}>
             <MenuPainel {...menu} />

             <div className="admin-conteudo">
               <header className="admin-topo">
                 <div>
                   <h1>{titulo}</h1>
                 </div>
                 <time>{DATA_EXTENSO.format(new Date())}</time>
               </header>
               {avisos}
               {children}
             </div>

             <Rodape exibirWhatsapp={false} />
           </main>
  );
}
