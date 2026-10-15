import { useEffect, useState } from 'react';
import { listarServicos } from '../../services/servicoService';
import { urlImagem } from '../../services/http';
import { listarProdutos } from '../../services/produtoService';
import { moeda } from '../../utils/formatacao';
import { Marca } from '../../components/Marca/Marca';
import { Rodape } from '../../components/Rodape/Rodape';
import './Home.css';

interface ItemServico {
  id_servico: number;
  nm_servico: string;
  ds_servico: string;
  vl_servico: number;
}
interface ItemProduto {
  id_produto: number;
  nm_produto: string;
  nm_marca?: string;
  vl_produto: number;
  ds_produto?: string;
  ds_imagem?: string;
  sn_ativo: string;
}

const servicosExemplo: ItemServico[] = [
  {
    id_servico: -1,
    nm_servico: 'Corte tradicional',
    ds_servico: 'Acabamento preciso e estilo clássico',
    vl_servico: 50
  },
  {
    id_servico: -2,
    nm_servico: 'Corte degradê',
    ds_servico: 'Transição suave e acabamento moderno',
    vl_servico: 65
  },
  {
    id_servico: -3,
    nm_servico: 'Barba completa',
    ds_servico: 'Toalha quente e acabamento na navalha',
    vl_servico: 45
  },
  {
    id_servico: -4,
    nm_servico: 'Corte + barba',
    ds_servico: 'Experiência completa de cuidado',
    vl_servico: 90
  }
];

const produtosExemplo: ItemProduto[] = [
  {
    id_produto: -1,
    nm_produto: 'Pomada modeladora',
    nm_marca: 'Matte',
    vl_produto: 45,
    sn_ativo: 'S'
  },
  {
    id_produto: -2,
    nm_produto: 'Óleo para barba',
    nm_marca: 'Hidratante',
    vl_produto: 35,
    sn_ativo: 'S'
  },
  {
    id_produto: -3,
    nm_produto: 'Balm pós-barba',
    nm_marca: 'Premium',
    vl_produto: 40,
    sn_ativo: 'S'
  }
];

function IconeUsuario()
{
  return ( <svg viewBox="0 0 24 24" aria-hidden="true">
             <path d="M12 12.2a4.6 4.6 0 1 0 0-9.2 4.6 4.6 0 0 0 0 9.2Zm0 2.3c-5 0-8.1 2.6-8.1 5.1 0 .8.6 1.4 1.4 1.4h13.4c.8 0 1.4-.6 1.4-1.4 0-2.5-3.1-5.1-8.1-5.1Z" />
           </svg>
  );
}

export default function Home()
{
  const [servicos, setServicos] = useState<ItemServico[]>(servicosExemplo);
  const [produtos, setProdutos] = useState<ItemProduto[]>(produtosExemplo);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() =>
  {
    listarServicos()
      .then(lista =>
      {
        const ativos = lista.filter(item => item.sn_ativo === 'S');
        if (ativos.length) setServicos(ativos);
      })
      .catch(() => undefined);
    listarProdutos()
      .then(lista =>
      {
        const ativos = lista.filter(item => item.sn_ativo === 'S');
        if (ativos.length) setProdutos(ativos);
      })
      .catch(() => undefined);
  }, []);

  const irPara = () => setMenuAberto(false);

  return ( <main className="home-page">
             <header className="home-header">
               <Marca className="home-marca" href="#inicio" />
               <button className="home-menu-botao"
                       type="button"
                       aria-label="Abrir menu"
                       aria-expanded={menuAberto}
                       onClick={() => setMenuAberto(!menuAberto)}>
                 ☰
               </button>
               <nav className={menuAberto ? 'aberto' : ''} aria-label="Navegação principal">
                 <a href="#inicio" onClick={irPara}>
                   Início
                 </a>
                 <a href="#servicos" onClick={irPara}>
                   Serviços
                 </a>
                 <a href="#produtos" onClick={irPara}>
                   Produtos
                 </a>
               </nav>
               <div className="home-acoes">
                 <a className="home-agendar" href="/cliente">
                   Agende seu horário
                 </a>
                 <a className="home-login" href="/login" aria-label="Entrar na sua conta" title="Entrar">
                   <IconeUsuario />
                 </a>
               </div>
             </header>

             <section className="home-hero" id="inicio">
               <div className="home-hero-conteudo">
                 <span className="home-sobretitulo">Tradição, cuidado e personalidade</span>
                 <h1>
                   Seu melhor estilo
                   <br />
                   começa aqui.
                 </h1>
                 <p>Cortes clássicos, barba impecável e uma experiência feita para você.</p>
                 <a href="/cliente">
                   Agende seu horário <span aria-hidden="true">→</span>
                 </a>
               </div>
             </section>

             <section className="home-secao home-servicos" id="servicos">
               <div className="home-titulo-secao">
                 <span>Nossos cuidados</span>
                 <h2>Serviços & preços</h2>
                 <p>Qualidade e atenção em cada detalhe.</p>
               </div>
               <div className="home-grade-servicos">
                 {servicos.map((item, indice) => (
                   <article key={item.id_servico}>
                     <span className="numero">0{indice + 1}</span>
                     <div>
                       <h3>{item.nm_servico}</h3>
                       <p>{item.ds_servico || 'Cuidado profissional para renovar o seu estilo.'}</p>
                     </div>
                     <strong>{moeda(item.vl_servico)}</strong>
                   </article>
                 ))}
               </div>
               <a className="home-link-agendar" href="/cliente">
                 Escolher serviço e horário <span>→</span>
               </a>
             </section>

             <section className="home-secao home-produtos" id="produtos">
               <div className="home-titulo-secao">
                 <span>Leve o cuidado com você</span>
                 <h2>Produtos</h2>
                 <p>Uma seleção para manter o visual em dia.</p>
               </div>
               <div className="home-grade-produtos">
                 {produtos.map((item, indice) => (
                   <article key={item.id_produto}>
                     {item.ds_imagem ? (
                       <img className="produto-foto"
                            src={urlImagem(item.ds_imagem)}
                            alt={item.nm_produto}
                            loading="lazy"/>
                     ) : (
                       <div className="produto-icone" aria-hidden="true">
                         {indice % 3 === 0 ? '◆' : indice % 3 === 1 ? '✦' : '●'}
                       </div>
                     )}
                     <div>
                       <small>{item.nm_marca || 'Seleção da casa'}</small>
                       <h3>{item.nm_produto}</h3>
                       <p>{item.ds_produto || 'Produto selecionado para o cuidado diário.'}</p>
                     </div>
                     <strong>{moeda(item.vl_produto)}</strong>
                   </article>
                 ))}
               </div>
             </section>

             <section className="home-localizacao" aria-labelledby="titulo-localizacao">
               <div className="home-localizacao-info">
                 <span>Onde estamos</span>
                 <h2 id="titulo-localizacao">Venha nos visitar</h2>
                 <p>
                   Av. Castelo Branco, 155
                   <br />
                   Salmourão — SP
                 </p>
                 <a href="https://www.google.com/maps/search/?api=1&query=Av.+Castelo+Branco,+155,+Salmourão,+SP"
                    target="_blank"
                    rel="noreferrer">
                   Abrir no Google Maps →
                 </a>
               </div>
               <iframe title="Localização da Barbearia dos Reis"
                       src="https://www.google.com/maps?q=Av.%20Castelo%20Branco,%20155,%20Salmour%C3%A3o%20SP&output=embed"
                       loading="lazy"
                       referrerPolicy="no-referrer-when-downgrade"/>
             </section>

             <Rodape />
           </main>
  );
}
