import { useEffect, useRef, useState } from 'react';
import './SeletorData.css';

interface Props {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  somenteCalendario?: boolean;
  ariaLabel?: string;
}

const MESES = ['Janeiro'
              ,'Fevereiro'
              ,'Março'
              ,'Abril'
              ,'Maio'
              ,'Junho'
              ,'Julho'
              ,'Agosto'
              ,'Setembro'
              ,'Outubro'
              ,'Novembro'
              ,'Dezembro'];

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function paraData(valor?: string)
{
  if (!valor) return null;
  const [ano, mes, dia] = valor.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

function paraApi(data: Date)
{
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

function paraTela(valor: string)
{
  if (!valor) return '';
  const [ano, mes, dia] = valor.split('-');
  return `${dia}/${mes}/${ano}`;
}

function SeletorData({id ,name ,value ,onChange ,min ,max ,somenteCalendario = false ,ariaLabel = 'Selecionar data'}: Props)
{
  const hoje = new Date();
  const limite = paraData(max) ?? hoje;
  const minimo = paraData(min);
  const inicial = paraData(value);
  const [aberto, setAberto] = useState(false);
  const [escolhida, setEscolhida] = useState<Date | null>(inicial);
  const [visivel, setVisivel] = useState(
    () => new Date(inicial?.getFullYear() ?? hoje.getFullYear(), inicial?.getMonth() ?? hoje.getMonth(), 1)
  );
  const [menu, setMenu] = useState<'mes' | 'ano' | null>(null);
  const [texto, setTexto] = useState(() => paraTela(value));
  const raiz = useRef<HTMLDivElement>(null);
  const primeiroAno = minimo?.getFullYear() ?? limite.getFullYear() - 100;
  const anos = Array.from({ length: limite.getFullYear() - primeiroAno + 1 }, (_, i) => limite.getFullYear() - i);

  useEffect(() =>
  {
    setTexto(paraTela(value));
  }, [value]);

  useEffect(() =>
  {
    function fora(event: MouseEvent)
    {
      if (!raiz.current?.contains(event.target as Node))
      {
        setAberto(false);
        setMenu(null);
      }
    }
    function escape(event: KeyboardEvent)
    {
      if (event.key === 'Escape')
      {
        setAberto(false);
        setMenu(null);
      }
    }
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', escape);
    return () =>
    {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  function abrir()
  {
    const atual = paraData(value);
    const base = atual ?? limite;
    setEscolhida(atual);
    setVisivel(new Date(base.getFullYear(), base.getMonth(), 1));
    setAberto(!aberto);
    setMenu(null);
  }

  function alterarTexto(valor: string)
  {
    const numeros = valor.replace(/\D/g, '').slice(0, 8);
    const formatado =
      numeros.length <= 2
        ? numeros
        : numeros.length <= 4
          ? `${numeros.slice(0, 2)}/${numeros.slice(2)}`
          : `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
    setTexto(formatado || '');
    if (numeros.length !== 8) return;
    const dia = Number(numeros.slice(0, 2));
    const mes = Number(numeros.slice(2, 4));
    const ano = Number(numeros.slice(4));
    const data = new Date(ano, mes - 1, dia);
    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia || data > limite) return;
    onChange(paraApi(data));
  }

  function mudarMes(delta: number)
  {
    const novo = new Date(visivel.getFullYear(), visivel.getMonth() + delta, 1);
    const primeiroMes = minimo ? new Date(minimo.getFullYear(), minimo.getMonth(), 1) : null;
    if ((!primeiroMes || novo >= primeiroMes) && novo <= new Date(limite.getFullYear(), limite.getMonth(), 1))
      setVisivel(novo);
  }

  function mudarAno(ano: number)
  {
    const novo = new Date(ano, visivel.getMonth(), 1);
    const maximo = new Date(limite.getFullYear(), limite.getMonth(), 1);
    const minimoVisivel = minimo ? new Date(minimo.getFullYear(), minimo.getMonth(), 1) : null;
    setVisivel(novo > maximo ? maximo : minimoVisivel && novo < minimoVisivel ? minimoVisivel : novo);
    setMenu(null);
  }

  const inicio = new Date(visivel.getFullYear(), visivel.getMonth(), 1).getDay();
  const total = new Date(visivel.getFullYear(), visivel.getMonth() + 1, 0).getDate();
  const dias = Array.from({ length: inicio + total }, (_, i) => (i < inicio ? null : i - inicio + 1));
  const noMesLimite = visivel.getFullYear() === limite.getFullYear() && visivel.getMonth() === limite.getMonth();
  const noMesMinimo =
    !!minimo && visivel.getFullYear() === minimo.getFullYear() && visivel.getMonth() === minimo.getMonth();

  return ( <div className="seletor-data" ref={raiz}>
             <input id={id}
                    name={name}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className={`seletor-data-campo${aberto ? ' aberto' : ''}`}
                    value={texto}
                    placeholder="dd/mm/aaaa"
                    onClick={somenteCalendario ? abrir : undefined}
                    onChange={event =>
                    {
                      if (!somenteCalendario) alterarTexto(event.target.value);
                    }}
                    readOnly={somenteCalendario}
                    aria-label={ariaLabel}/>
             <button className="seletor-data-botao"
                     type="button"
                     onClick={abrir}
                     aria-haspopup="dialog"
                     aria-expanded={aberto}
                     aria-label="Abrir calendário">
               <span className="icone-calendario" aria-hidden="true" />
             </button>

             {aberto && (
               <div className="calendario" role="dialog" aria-label={ariaLabel}>
                 <header className="calendario-cabecalho">
                   <div className="calendario-periodo">
                     <button type="button" onClick={() => setMenu(menu === 'mes' ? null : 'mes')}>
                       {MESES[visivel.getMonth()]} <span className="seta-baixo" aria-hidden="true" />
                     </button>
                     <button type="button" onClick={() => setMenu(menu === 'ano' ? null : 'ano')}>
                       {visivel.getFullYear()} <span className="seta-baixo" aria-hidden="true" />
                     </button>
                   </div>
                   <div className="calendario-setas">
                     <button type="button"
                             onClick={() => mudarMes(-1)}
                             disabled={noMesMinimo}
                             aria-label="Mês anterior">
                       <span className="seta-esquerda" aria-hidden="true" />
                     </button>
                     <button type="button" onClick={() => mudarMes(1)} disabled={noMesLimite} aria-label="Próximo mês">
                       <span className="seta-direita" aria-hidden="true" />
                     </button>
                   </div>

                   {menu === 'mes' && (
                     <div className="calendario-menu menu-mes">
                       <small>MES</small>
                       {MESES.map((mes, i) => (
                         <button type="button"
                                 className={i === visivel.getMonth() ? 'ativo' : ''}
                                 disabled={
                                   (visivel.getFullYear() === limite.getFullYear() && i > limite.getMonth()) ||
                                   (!!minimo && visivel.getFullYear() === minimo.getFullYear() && i < minimo.getMonth())
                                 }
                                 onClick={() =>
                                 {
                                   setVisivel(new Date(visivel.getFullYear(), i, 1));
                                   setMenu(null);
                                 }}
                                 key={mes}>
                           {mes}
                         </button>
                       ))}
                     </div>
                   )}
                   {menu === 'ano' && (
                     <div className="calendario-menu menu-ano">
                       <small>ANO</small>
                       {anos.map(ano => (
                         <button type="button"
                                 className={ano === visivel.getFullYear() ? 'ativo' : ''}
                                 onClick={() => mudarAno(ano)}
                                 key={ano}>
                           {ano}
                         </button>
                       ))}
                     </div>
                   )}
                 </header>

                 <div className="calendario-grade">
                   {SEMANA.map((dia, i) => (
                     <span className="dia-semana" key={`${dia}-${i}`}>
                       {dia}
                     </span>
                   ))}
                   {dias.map((dia, i) =>
                   {
                     if (!dia) return <span key={`vazio-${i}`} />;
                     const data = new Date(visivel.getFullYear(), visivel.getMonth(), dia);
                     const selecionada = escolhida?.toDateString() === data.toDateString();
                     return ( <button
                                type="button"
                                className={selecionada ? 'selecionado' : ''}
                                disabled={data > limite || (!!minimo && data < minimo)}
                                onClick={() => setEscolhida(data)}
                                key={paraApi(data)}>
                                {dia}
                              </button>
                     );
                   })}
                 </div>

                 <footer className="calendario-acoes">
                   <button className="cancelar" type="button" onClick={() => setAberto(false)}>
                     Cancelar
                   </button>
                   <button className="selecionar"
                           type="button"
                           disabled={!escolhida}
                           onClick={() =>
                           {
                             if (escolhida) onChange(paraApi(escolhida));
                             setAberto(false);
                           }}>
                     Selecionar
                   </button>
                 </footer>
               </div>
             )}
           </div>
  );
}

export default SeletorData;
