import { estaCancelado, estaFinalizado, normalizarStatus } from '../../components/Agenda/agenda';
import { TelaAgenda } from '../../components/Agenda/TelaAgenda';
import { TelaHorarios } from '../../components/Agenda/TelaHorarios';
import { TelaClientes } from '../../components/Clientes/TelaClientes';
import { Painel } from '../../components/Painel/Painel';
import type { ItemMenu } from '../../components/Painel/MenuPainel';
import { useConsulta } from '../../hooks/useConsulta';
import { useHorarios } from '../../hooks/useHorarios';
import { useTela } from '../../hooks/useTela';
import { configurarHorario, consultarAgendamentos, consultarHorarios } from '../../services/agendaService';
import type { Agendamento } from '../../services/agendaService';
import { usuarioLogado } from '../../services/usuarioService';
import { dataBr, hojeIso } from '../../utils/datas';
import { Barbeiros } from './Barbeiros/Barbeiros';
import { Produtos } from './Produtos/Produtos';
import { Relatorio } from './Relatorio/Relatorio';
import { Servicos } from './Servicos/Servicos';
import { VisaoGeral } from './VisaoGeral';
import './Admin.css';
import './Barbeiros.css';
import './Controle.css';
import './Operacoes.css';

const TELAS = ['visao-geral'
              ,'agenda'
              ,'clientes'
              ,'barbeiros'
              ,'servicos'
              ,'horarios'
              ,'produtos'
              ,'relatorio'] as const;

type Tela = (typeof TELAS)[number];

const MENU: ItemMenu[] = [['visao-geral', 'Visão Geral']
                         ,['agenda', 'Agenda']
                         ,['clientes', 'Clientes']
                         ,['barbeiros', 'Barbeiros']
                         ,['servicos', 'Serviços']
                         ,['horarios', 'Horários']
                         ,['produtos', 'Produtos']
                         ,['relatorio', 'Relatório']];

/** Painel do Admin: menu e troca de telas. Cada tela cuida dos próprios dados. */
function Admin()
{
  const [tela, mudarTela] = useTela<Tela>('admin', TELAS, 'visao-geral');
  const { horarios, recarregar: recarregarHorarios } = useHorarios(consultarHorarios);
  const historico = useConsulta('agenda-completa', () => consultarAgendamentos('2000-01-01', '2100-12-31'), []);

  const agendamentos = historico.dados ?? [];
  const atualizarHistorico = () => void historico.atualizar();

  const titulo =
    tela === 'visao-geral'
      ? `Olá, ${usuarioLogado().nm_usuario || 'Administrador'}`
      : (MENU.find(([chave]) => chave === tela)?.[1] ?? '');

  return ( <Painel
             telas={MENU}
             tela={tela}
             mudar={nova => mudarTela(nova as Tela)}
             inicio="/admin"
             rotulo="Administração"
             titulo={titulo}
             avisos={<LembreteNaoFinalizados agendamentos={agendamentos} />}>
             {tela === 'visao-geral' && <VisaoGeral horarios={horarios} alterado={atualizarHistorico} />}
             {tela === 'agenda' && (
               <TelaAgenda titulo="Agenda de atendimentos"
                           horarios={horarios}
                           dataMinima={primeiraData(agendamentos)}
                           alterado={atualizarHistorico}/>
             )}
             {tela === 'clientes' && <TelaClientes titulo="Consultar clientes" admin />}
             {tela === 'barbeiros' && <Barbeiros />}
             {tela === 'servicos' && <Servicos />}
             {tela === 'horarios' && (
               <TelaHorarios horarios={horarios} salvarDia={configurarHorario} salvos={recarregarHorarios} />
             )}
             {tela === 'produtos' && <Produtos />}
             {tela === 'relatorio' && <Relatorio />}
           </Painel>
  );
}

/** Atendimentos de dias anteriores que ficaram sem finalizar (nem cancelados nem faltas). */
function LembreteNaoFinalizados({agendamentos}: { agendamentos: Agendamento[] })
{
  const hoje = hojeIso();
  const pendentes = agendamentos.filter(item =>
  {
    const status = normalizarStatus(item.st_agendamento);
    return (
      item.dt_agendamento.slice(0, 10) < hoje &&
      !estaFinalizado(status) &&
      !estaCancelado(status) &&
      !status.includes('falta')
    );
  });

  if (!pendentes.length) return null;

  const datas = [...new Set(pendentes.map(item => dataBr(item.dt_agendamento)))];
  return ( <div className="admin-mensagem lembrete-atendimentos" role="alert">
             Existem {pendentes.length} atendimento(s) não finalizado(s), nas datas: {datas.join(', ')}. Acesse a Agenda para
             conferir e finalizar.
           </div>
  );
}

/** O calendário da agenda começa no primeiro agendamento registrado. */
function primeiraData(agendamentos: Agendamento[])
{
  const datas = agendamentos.map(item => item.dt_agendamento.slice(0, 10)).sort();
  return datas[0] ?? hojeIso();
}

export default Admin;
