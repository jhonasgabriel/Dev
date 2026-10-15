import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { FormaPagamento } from '../../../components/Agenda/FormaPagamento';
import { Mensagem } from '../../../components/Mensagem/Mensagem';
import { Dialogo } from '../../../components/Modal/Modal';
import { chaveOperacao, receberDebito } from '../../../services/controleService';
import type { Debito, Recebimento } from '../../../services/controleService';
import { ApiError } from '../../../services/http';
import { dataBr } from '../../../utils/datas';
import { mensagemErro, moeda } from '../../../utils/formatacao';

/** Clientes com valores pendentes e o recebimento de cada débito. */
export function ListaDebitos({debitos ,atualizar}: { debitos: Debito[]; atualizar: () => void })
{
  const [recebendo, setRecebendo] = useState<Debito | null>(null);
  const total = debitos.reduce((soma, item) => soma + item.vl_pendente, 0);

  return ( <section className="controle-debitos">
             <h2>A Receber</h2>
             <strong className="controle-total">{moeda(total)}</strong>

             {!debitos.length ? (
               <p>Nenhum cliente com débito.</p>
             ) : (
               <ul>
                 {debitos.map(debito => (
                   <li key={debito.id_atendimento}>
                     <div>
                       <strong>{debito.nm_usuario}</strong>
                       <span>{debito.ds_servicos}</span>
                       <span>Data do serviço: {dataBr(debito.dt_atendimento)}</span>
                     </div>
                     <strong>{moeda(debito.vl_pendente)}</strong>
                     <button onClick={() => setRecebendo(debito)}>Receber</button>
                   </li>
                 ))}
               </ul>
             )}

             {recebendo && (
               <ReceberDebitoModal debito={recebendo}
                                   fechar={() => setRecebendo(null)}
                                   recebido={() =>
                                   {
                                     setRecebendo(null);
                                     atualizar();
                                   }}/>
             )}
           </section>
  );
}

const chaveRascunho = (idAtendimento: number) => `recebimento-${idAtendimento}`;

/** Tentativa salva localmente quando a resposta se perdeu (reenvio com a mesma chave). */
function lerRascunho(idAtendimento: number): Recebimento | null
{
  try
  {
    const salvo = JSON.parse(sessionStorage.getItem(chaveRascunho(idAtendimento)) ?? 'null');
    return salvo?.id_atendimento === idAtendimento ? salvo : null;
  }
  catch
  {
    return null;
  }
}

interface ReceberDebitoModalProps {
  debito: Debito;
  fechar: () => void;
  recebido: () => void;
}

function ReceberDebitoModal({debito ,fechar ,recebido}: ReceberDebitoModalProps)
{
  const rascunho = lerRascunho(debito.id_atendimento);
  const tentativa = useRef<Recebimento | null>(rascunho);
  const chave = useRef(rascunho?.cd_chave ?? chaveOperacao());
  const enviando = useRef(false);

  const [valor, setValor] = useState((rascunho?.vl_pagamento ?? debito.vl_pendente).toFixed(2));
  const [forma, setForma] = useState(rascunho?.forma_pagamento ?? 'PIX');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function receber(evento: FormEvent)
  {
    evento.preventDefault();
    if (enviando.current) return;

    enviando.current = true;
    setOcupado(true);
    setErro('');

    // Reenvio após resposta perdida usa exatamente o mesmo valor e a mesma chave.
    tentativa.current ??= {
      id_atendimento: debito.id_atendimento,
      vl_pagamento: Number(valor),
      forma_pagamento: forma,
      cd_chave: chave.current
    };

    try
    {
      sessionStorage.setItem(chaveRascunho(debito.id_atendimento), JSON.stringify(tentativa.current));
      await receberDebito(tentativa.current);
      sessionStorage.removeItem(chaveRascunho(debito.id_atendimento));
      recebido();
    }
    catch (e)
    {
      // Recusa da API (4xx): a tentativa não foi gravada e pode ser refeita com outros dados.
      if (e instanceof ApiError && e.status >= 400 && e.status < 500)
      {
        sessionStorage.removeItem(chaveRascunho(debito.id_atendimento));
        tentativa.current = null;
        chave.current = chaveOperacao();
      }
      setErro(mensagemErro(e, 'Não foi possível registrar o recebimento.'));
    }
    finally
    {
      enviando.current = false;
      setOcupado(false);
    }
  }

  return ( <Dialogo titulo={`Receber de ${debito.nm_usuario}`} fechar={fechar} ocupado={ocupado}>
             <p>
               Saldo: {moeda(debito.vl_pendente)} · {dataBr(debito.dt_atendimento)}
             </p>

             <form onSubmit={receber}>
               <fieldset disabled={ocupado || !!tentativa.current}>
                 <label>
                   Valor recebido (R$)
                   <input autoFocus
                          required
                          type="number"
                          inputMode="decimal"
                          min="0.01"
                          max={debito.vl_pendente}
                          step="0.01"
                          value={valor}
                          onChange={e => setValor(e.target.value)}/>
                 </label>
                 <FormaPagamento valor={forma} mudar={setForma} />
               </fieldset>

               <Mensagem erro={erro} />
               <button disabled={ocupado}>
                 {ocupado ? 'Registrando...' : tentativa.current ? 'Tentar novamente' : 'Registrar recebimento'}
               </button>
             </form>
           </Dialogo>
  );
}
