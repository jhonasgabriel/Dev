import { useState } from 'react';
import type { FormEvent } from 'react';
import { alterarBloqueio } from '../../services/agendaService';
import { hojeIso } from '../../utils/datas';
import { mensagemErro } from '../../utils/formatacao';
import { Mensagem } from '../Mensagem/Mensagem';
import { Modal } from '../Modal/Modal';

type Acao = 'bloquear' | 'desbloquear';

/**
 * Bloqueia ou libera um intervalo de horários.
 * Admin: bloqueio geral da barbearia. Barbeiro: somente a própria agenda (a API decide pelo token).
 */
export function BloqueiosModal({fechar ,subtitulo}: { fechar: () => void; subtitulo?: string })
{
  const [data, setData] = useState(hojeIso());
  const [inicio, setInicio] = useState('08:00');
  const [fim, setFim] = useState('09:00');
  const [acao, setAcao] = useState<Acao>('bloquear');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function salvar(evento: FormEvent)
  {
    evento.preventDefault();
    setErro('');
    setSucesso('');
    if (inicio >= fim)
    {
      setErro('O fim deve ser posterior ao início.');
      return;
    }

    setOcupado(true);
    try
    {
      await alterarBloqueio(acao, data, inicio, fim);
      setSucesso(acao === 'bloquear' ? 'Horário bloqueado.' : 'Horário desbloqueado.');
    }
    catch (e)
    {
      setErro(mensagemErro(e));
    }
    finally
    {
      setOcupado(false);
    }
  }

  return ( <Modal
             titulo="Bloqueio de Horários"
             subtitulo={subtitulo}
             className="bloqueio-modal"
             fechar={fechar}
             ocupado={ocupado}>
             <div className="operacoes bloqueios-form">
               <form onSubmit={salvar}>
                 <label>
                   Início
                   <input required type="time" value={inicio} onChange={e => setInicio(e.target.value)} />
                 </label>
                 <label>
                   Fim
                   <input required type="time" value={fim} onChange={e => setFim(e.target.value)} />
                 </label>
                 <label>
                   Data
                   <input required type="date" min={hojeIso()} value={data} onChange={e => setData(e.target.value)} />
                 </label>
                 <label>
                   Ação
                   <select value={acao} onChange={e => setAcao(e.target.value as Acao)}>
                     <option value="bloquear">Bloquear</option>
                     <option value="desbloquear">Desbloquear</option>
                   </select>
                 </label>
                 <button className="op-primary" disabled={ocupado}>
                   {ocupado ? 'Salvando...' : 'Confirmar alteração'}
                 </button>
               </form>
               <Mensagem erro={erro} sucesso={sucesso} />
             </div>
           </Modal>
  );
}
