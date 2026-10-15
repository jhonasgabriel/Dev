import { useEffect, useState } from 'react';
import { definirServicosProfissional, servicosProfissional } from '../../services/usuarioService';
import type { ServicoProfissional } from '../../services/usuarioService';
import { mensagemErro, moeda } from '../../utils/formatacao';
import { Mensagem } from '../Mensagem/Mensagem';

/** Serviços do catálogo que o profissional realiza; só esses são oferecidos com ele no agendamento. */
export function ServicosRealizados({id}: { id: number })
{
  const [lista, setLista] = useState<ServicoProfissional[]>([]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [ocupado, setOcupado] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() =>
  {
    let ativo = true;
    setOcupado(true);

    servicosProfissional(id)
      .then(dados =>
      {
        if (!ativo) return;
        setLista(dados);
        setSelecionados(dados.filter(s => s.sn_realiza).map(s => s.id_servico));
      })
      .catch(e =>
      {
        if (ativo) setErro(mensagemErro(e, 'Não foi possível carregar os serviços.'));
      })
      .finally(() =>
      {
        if (ativo) setOcupado(false);
      });

    return () =>
    {
      ativo = false;
    };
  }, [id]);

  function alternar(idServico: number, marcado: boolean)
  {
    setSelecionados(atuais => (marcado ? [...atuais, idServico] : atuais.filter(x => x !== idServico)));
  }

  async function salvar()
  {
    setOcupado(true);
    setErro('');
    setSucesso('');
    try
    {
      await definirServicosProfissional(id, selecionados);
      setSucesso('Serviços atualizados com sucesso.');
    }
    catch (e)
    {
      setErro(mensagemErro(e, 'Não foi possível salvar os serviços.'));
    }
    finally
    {
      setOcupado(false);
    }
  }

  return ( <div className="servicos-realizados">
             {!lista.length && !ocupado && <p className="admin-vazio">Nenhum serviço cadastrado pelo Admin.</p>}

             <div className="servicos-realizados-lista">
               {lista.map(servico =>
               {
                 const marcado = selecionados.includes(servico.id_servico);
                 return ( <label key={servico.id_servico} className={marcado ? 'selecionado' : ''}>
                            <input type="checkbox"
                                   checked={marcado}
                                   disabled={ocupado}
                                   onChange={e => alternar(servico.id_servico, e.target.checked)}/>
                            <span>
                              <strong>{servico.nm_servico}</strong>
                              <small>
                                {servico.qt_minutos} min
                                {servico.ds_servico ? ` · ${servico.ds_servico}` : ''}
                              </small>
                            </span>
                            <b>{moeda(servico.vl_servico)}</b>
                          </label>
                 );
               })}
             </div>

             <Mensagem erro={erro} sucesso={sucesso} />
             {lista.length > 0 && (
               <button type="button" className="salvar-horario" disabled={ocupado} onClick={salvar}>
                 {ocupado ? 'Salvando...' : 'Salvar serviços'}
               </button>
             )}
           </div>
  );
}
