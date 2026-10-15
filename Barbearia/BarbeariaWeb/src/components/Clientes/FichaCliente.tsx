import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { OutPessoa } from '../../models/OutPessoa';
import {
  alterarStatusPessoa,
  atualizarPessoa,
  frequenciaPessoa,
  historicoPessoa,
  removerPessoa
} from '../../services/pessoaService';
import type { FrequenciaPessoa, HistoricoPessoa } from '../../services/pessoaService';
import { dataBr, hojeIso } from '../../utils/datas';
import { formatarTelefone, mensagemErro, moeda, somenteNumeros } from '../../utils/formatacao';
import { Modal } from '../Modal/Modal';

interface FichaClienteProps {
  pessoa: OutPessoa;
  fechar: () => void;
  /** false no painel do barbeiro: edita e vê o histórico, sem inativar ou excluir. */
  gerenciar?: boolean;
}

/** Cadastro e histórico do cliente em uma janela. */
export function FichaCliente({pessoa ,fechar ,gerenciar = true}: FichaClienteProps)
{
  const [form, setForm] = useState(pessoa);
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState('');
  const [removido, setRemovido] = useState(false);

  async function executar(acao: () => Promise<void>, sucesso: string)
  {
    setOcupado(true);
    setResultado('');
    try
    {
      await acao();
      setResultado(sucesso);
    }
    catch (e)
    {
      setResultado(mensagemErro(e));
    }
    finally
    {
      setOcupado(false);
    }
  }

  function salvar(evento: FormEvent)
  {
    evento.preventDefault();
    void executar(() => atualizarPessoa(form), 'Cadastro atualizado.');
  }

  function alterarStatus()
  {
    const ativar = form.sn_ativo !== 'S';
    void executar(
      async () =>
      {
        await alterarStatusPessoa(pessoa.id_pessoa, ativar);
        setForm({ ...form, sn_ativo: ativar ? 'S' : 'N' });
      },
      `Cliente ${ativar ? 'ativado' : 'inativado'}.`
    );
  }

  function remover()
  {
    if (!window.confirm(`Remover o cadastro de ${pessoa.nm_usuario}?`)) return;
    void executar(async () =>
    {
      await removerPessoa(pessoa.id_pessoa);
      setRemovido(true);
    }, '');
  }

  return ( <Modal titulo="Cadastro e histórico" subtitulo="Cliente" className="historico-modal" fechar={fechar}>
             {removido ? (
               <p role="status">Cadastro removido. Atualize a busca de clientes.</p>
             ) : (
               <section className="operacoes">
                 <h2>Cadastro de {pessoa.nm_usuario}</h2>

                 <form onSubmit={salvar}>
                   <label>
                     Nome
                     <input required
                            minLength={3}
                            maxLength={50}
                            value={form.nm_usuario}
                            onChange={e => setForm({ ...form, nm_usuario: e.target.value })}/>
                   </label>
                   <label>
                     Telefone
                     <input required
                            inputMode="numeric"
                            maxLength={15}
                            value={formatarTelefone(form.no_telefone)}
                            onChange={e => setForm({ ...form, no_telefone: somenteNumeros(e.target.value, 11) })}/>
                   </label>
                   <label>
                     Nascimento (opcional)
                     <input type="date"
                            max={hojeIso()}
                            value={form.dt_nascimento?.slice(0, 10) || ''}
                            onChange={e => setForm({ ...form, dt_nascimento: e.target.value || null })}/>
                   </label>

                   <button disabled={ocupado}>Salvar alterações</button>
                   {gerenciar && (
                     <>
                       <button type="button" disabled={ocupado} onClick={alterarStatus}>
                         {form.sn_ativo === 'S' ? 'Inativar' : 'Ativar'} cliente
                       </button>
                       <button type="button" disabled={ocupado} onClick={remover}>
                         Excluir cadastro sem histórico
                       </button>
                     </>
                   )}
                 </form>
                 <p role="status">{resultado}</p>

                 <HistoricoCliente idPessoa={pessoa.id_pessoa} />
               </section>
             )}
           </Modal>
  );
}

const FREQUENCIA_VAZIA: FrequenciaPessoa = {
  qt_atendimentos: 0,
  dt_ultimo_atendimento: null,
  vl_total_gasto: 0,
  vl_total_pendente: 0
};

function HistoricoCliente({idPessoa}: { idPessoa: number })
{
  const [historico, setHistorico] = useState<HistoricoPessoa[]>([]);
  const [frequencia, setFrequencia] = useState(FREQUENCIA_VAZIA);
  const [carregando, setCarregando] = useState(true);

  useEffect(() =>
  {
    let ativo = true;
    setCarregando(true);

    Promise.all([historicoPessoa(idPessoa), frequenciaPessoa(idPessoa)])
      .then(([atendimentos, resumo]) =>
      {
        if (!ativo) return;
        setHistorico(atendimentos);
        setFrequencia(resumo ?? FREQUENCIA_VAZIA);
      })
      .catch(() =>
      {
        if (!ativo) return;
        setHistorico([]);
        setFrequencia(FREQUENCIA_VAZIA);
      })
      .finally(() =>
      {
        if (ativo) setCarregando(false);
      });

    return () =>
    {
      ativo = false;
    };
  }, [idPessoa]);

  if (carregando)
  {
    return ( <>
               <h3>Histórico e frequência</h3>
               <p>Carregando...</p>
             </>
    );
  }

  const ultimaVisita = frequencia.dt_ultimo_atendimento ? dataBr(frequencia.dt_ultimo_atendimento) : 'Sem registro';

  return ( <>
             <h3>Histórico e frequência</h3>
             <p>
               {frequencia.qt_atendimentos} atendimentos · Última visita: {ultimaVisita} · Total gasto:{' '}
               {moeda(frequencia.vl_total_gasto)} · Pendente: {moeda(frequencia.vl_total_pendente)}
             </p>

             <div className="op-list">
               {historico.map(item => (
                 <article key={item.id_historico}>
                   <time>{dataBr(item.dt_atendimento)}</time>
                   <p>{item.ds_servicos}</p>
                   <p>
                     {moeda(item.vl_total)} · {item.forma_pagamento} · {item.st_atendimento}
                   </p>
                 </article>
               ))}
               {!historico.length && <p>Nenhum atendimento registrado.</p>}
             </div>
           </>
  );
}
