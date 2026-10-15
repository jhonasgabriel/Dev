import { useState } from 'react';
import { useConsulta } from '../../../hooks/useConsulta';
import { consultarAgendamentos } from '../../../services/agendaService';
import { consultarResumoBarbeiro } from '../../../services/barbeiroService';
import { CONTROLE_VAZIO, consultarControle } from '../../../services/controleService';
import type { Controle } from '../../../services/controleService';
import { dataBr, hojeIso, primeiroDiaMes, ultimoDiaMes } from '../../../utils/datas';
import { GraficosRelatorio } from './GraficosRelatorio';
import { ListaDebitos } from './ListaDebitos';
import { TabelasRelatorio } from './TabelasRelatorio';
import '../Controle.css';

/**
 * Relatório mensal. Sem profissional, mostra a barbearia inteira (com débitos a receber);
 * com profissional, somente os atendimentos dele.
 */
export function Relatorio({idBarbeiro}: { idBarbeiro?: number })
{
  const hoje = hojeIso();
  const [referencia, setReferencia] = useState(hoje);

  const inicio = primeiroDiaMes(referencia);
  const fim = ultimoDiaMes(referencia);
  const escopo = idBarbeiro ?? 'geral';

  const relatorio = useConsulta(
    `relatorio-${escopo}-${inicio}/${fim}`,
    () => (idBarbeiro ? relatorioDoBarbeiro(idBarbeiro, inicio, fim) : consultarControle(inicio, fim)),
    CONTROLE_VAZIO
  );
  const agendamentos = useConsulta(
    `movimento-${escopo}-${inicio}/${fim}`,
    () => consultarAgendamentos(inicio, fim, idBarbeiro),
    []
  );

  function mudarMes(delta: number)
  {
    const [ano, mes] = referencia.slice(0, 7).split('-').map(Number);
    const novo = new Date(ano, mes - 1 + delta, 1);
    setReferencia(`${novo.getFullYear()}-${String(novo.getMonth() + 1).padStart(2, '0')}-01`);
  }

  const dados = relatorio.dados;

  return ( <section className="operacoes controle-relatorio">
             <div className="relatorio-filtros">
               <button type="button"
                       className={referencia.slice(0, 7) === hoje.slice(0, 7) ? 'ativo' : ''}
                       onClick={() => setReferencia(hoje)}>
                 Mês Atual
               </button>

               <div className="relatorio-mes-alternador">
                 <button type="button" aria-label="Mês anterior" onClick={() => mudarMes(-1)}>
                   ‹
                 </button>
                 <label className="relatorio-mes">
                   Selecionar Mês
                   <input type="month"
                          value={referencia.slice(0, 7)}
                          onChange={e => e.target.value && setReferencia(`${e.target.value}-01`)}/>
                 </label>
                 <button type="button" aria-label="Próximo mês" onClick={() => mudarMes(1)}>
                   ›
                 </button>
               </div>
             </div>

             <p className="relatorio-periodo">
               Período: {dataBr(inicio)} a {dataBr(fim)}
             </p>
             {relatorio.carregando && <p role="status">Carregando relatório...</p>}

             {dados && (
               <>
                 <dl className="op-summary">
                   <div>
                     <dt>Atendimentos finalizados</dt>
                     <dd>{dados.resumo.qt_atendimentos}</dd>
                   </div>
                   <div>
                     <dt>Serviços realizados</dt>
                     <dd>{dados.servicos.reduce((total, item) => total + item.qt_servicos, 0)}</dd>
                   </div>
                 </dl>

                 <GraficosRelatorio inicio={inicio}
                                    fim={fim}
                                    agendamentos={agendamentos.dados ?? []}
                                    servicos={dados.servicos}/>
                 <TabelasRelatorio dados={dados} comProfissionais={!idBarbeiro} />

                 {!idBarbeiro && <ListaDebitos debitos={dados.debitos} atualizar={relatorio.atualizar} />}
               </>
             )}
           </section>
  );
}

/** Converte o resumo do barbeiro para o mesmo formato do relatório geral. */
async function relatorioDoBarbeiro(id: number, inicio: string, fim: string): Promise<Controle>
{
  const perfil = await consultarResumoBarbeiro(id, inicio, fim);
  const porForma = (forma: string) =>
    perfil.formas_pagamento.find(item => item.forma_pagamento === forma)?.vl_total ?? 0;

  return {
    ...CONTROLE_VAZIO,
    resumo: {
      ...perfil.resumo,
      qt_atendimentos: perfil.resumo.qt_agendamentos,
      vl_pix: porForma('PIX'),
      vl_credito: porForma('CREDITO'),
      vl_debito: porForma('DEBITO'),
      vl_especie: porForma('ESPECIE')
    },
    servicos: perfil.servicos.map(item => ({
      ...item,
      vl_unitario: item.qt_servicos ? item.vl_total / item.qt_servicos : 0
    })),
    formas_pagamento: perfil.formas_pagamento
  };
}
