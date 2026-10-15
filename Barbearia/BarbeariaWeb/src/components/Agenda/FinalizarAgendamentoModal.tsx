import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Agendamento } from '../../services/agendaService';
import { finalizarAgendamento } from '../../services/controleService';
import { dataBr } from '../../utils/datas';
import { mensagemErro, moeda } from '../../utils/formatacao';
import { Mensagem } from '../Mensagem/Mensagem';
import { Dialogo } from '../Modal/Modal';
import { FormaPagamento, FORMAS_PAGAMENTO } from './FormaPagamento';

interface FinalizarAgendamentoModalProps {
  item: Agendamento;
  fechar: () => void;
  concluido: () => void;
}

/** Conclui o atendimento do agendamento registrando quanto foi recebido. */
export function FinalizarAgendamentoModal({item ,fechar ,concluido}: FinalizarAgendamentoModalProps)
{
  const [valor, setValor] = useState(item.vl_total.toFixed(2));
  const [forma, setForma] = useState(FORMAS_PAGAMENTO.includes(item.forma_pagamento) ? item.forma_pagamento : 'PIX');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const enviando = useRef(false);

  const recebido = Number(valor || 0);
  const emDinheiro = forma === 'ESPECIE';

  async function salvar(evento: FormEvent)
  {
    evento.preventDefault();
    if (enviando.current) return;

    const valorInvalido =
      valor === '' || !Number.isFinite(recebido) || recebido < 0 || (!emDinheiro && recebido > item.vl_total);
    if (valorInvalido)
    {
      setErro('Informe um valor válido para a forma de pagamento.');
      return;
    }

    enviando.current = true;
    setOcupado(true);
    setErro('');
    try
    {
      await finalizarAgendamento({
        id_agendamento: item.id_agendamento,
        dt_atendimento: item.dt_agendamento.slice(0, 10),
        vl_recebido: recebido,
        forma_pagamento: forma
      });
      concluido();
    }
    catch (e)
    {
      setErro(mensagemErro(e, 'Não foi possível finalizar.'));
    }
    finally
    {
      enviando.current = false;
      setOcupado(false);
    }
  }

  return ( <Dialogo titulo="Finalizar atendimento" fechar={fechar} ocupado={ocupado}>
             <p>
               <strong>{item.nm_usuario}</strong>
               <br />
               {item.ds_servicos || item.nm_servico}
               <br />
               {dataBr(item.dt_agendamento)} às {item.hr_agendamento.slice(0, 5)}
             </p>
             <p>
               Total dos serviços: <strong>{moeda(item.vl_total)}</strong>
             </p>

             <form onSubmit={salvar}>
               <fieldset disabled={ocupado}>
                 <label>
                   Valor recebido (R$)
                   <input autoFocus
                          required
                          type="number"
                          inputMode="decimal"
                          min="0"
                          max={emDinheiro ? undefined : item.vl_total}
                          step="0.01"
                          value={valor}
                          onChange={e => setValor(e.target.value)}/>
                 </label>
                 <FormaPagamento valor={forma} mudar={setForma} />
               </fieldset>

               <p>
                 Saldo devedor: <strong>{moeda(Math.max(0, item.vl_total - recebido))}</strong>
               </p>
               {emDinheiro && recebido > item.vl_total && (
                 <p>
                   Troco: <strong>{moeda(recebido - item.vl_total)}</strong>
                 </p>
               )}

               <Mensagem erro={erro} />
               <button disabled={ocupado}>{ocupado ? 'Finalizando...' : 'Finalizar atendimento'}</button>
             </form>
           </Dialogo>
  );
}
