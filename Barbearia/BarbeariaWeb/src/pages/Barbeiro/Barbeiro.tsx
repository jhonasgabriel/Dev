import { TelaAgenda } from '../../components/Agenda/TelaAgenda';
import { TelaHorarios } from '../../components/Agenda/TelaHorarios';
import { TelaClientes } from '../../components/Clientes/TelaClientes';
import { Painel } from '../../components/Painel/Painel';
import type { ItemMenu } from '../../components/Painel/MenuPainel';
import { FotoProfissional } from '../../components/Profissional/FotoProfissional';
import { ServicosRealizados } from '../../components/Profissional/ServicosRealizados';
import { useHorarios } from '../../hooks/useHorarios';
import { useTela } from '../../hooks/useTela';
import type { DadosHorario } from '../../services/agendaService';
import { configurarHorarioBarbeiro, consultarHorariosBarbeiro } from '../../services/barbeiroService';
import { usuarioLogado } from '../../services/usuarioService';
import { Relatorio } from '../Admin/Relatorio/Relatorio';
import { VisaoGeralBarbeiro } from './VisaoGeralBarbeiro';
import '../Admin/Admin.css';
import '../Admin/Controle.css';
import '../Admin/Barbeiros.css';
import '../Admin/Operacoes.css';

const TELAS = ['visao-geral', 'agenda', 'clientes', 'servicos', 'horarios', 'relatorio'] as const;

type Tela = (typeof TELAS)[number];

const MENU: ItemMenu[] = [['visao-geral', 'Visão Geral']
                         ,['agenda', 'Agenda']
                         ,['clientes', 'Clientes']
                         ,['servicos', 'Serviços']
                         ,['horarios', 'Horários']
                         ,['relatorio', 'Relatório']];

/**
 * Painel do barbeiro: as mesmas telas do Admin, sempre restritas a ele
 * (a API usa o ID do token, independentemente do que a tela enviar).
 */
export default function Barbeiro()
{
  const eu = usuarioLogado();
  const id = Number(eu.id_usuario);
  const [tela, mudarTela] = useTela<Tela>('barbeiro', TELAS, 'visao-geral');
  const { horarios, recarregar } = useHorarios(() => consultarHorariosBarbeiro(id));

  const titulo =
    tela === 'visao-geral'
      ? `Olá, ${eu.nm_usuario || 'Barbeiro'}`
      : (MENU.find(([chave]) => chave === tela)?.[1] ?? '');

  return ( <Painel
             className="barbeiro-page"
             telas={MENU}
             tela={tela}
             mudar={nova => mudarTela(nova as Tela)}
             inicio="/barbeiro"
             rotulo="Painel do barbeiro"
             titulo={titulo}>
             {tela === 'visao-geral' && <VisaoGeralBarbeiro idBarbeiro={id} horarios={horarios} />}
             {tela === 'agenda' && <TelaAgenda titulo="Minha agenda" horarios={horarios} idBarbeiro={id} />}
             {tela === 'clientes' && <TelaClientes titulo="Meus clientes" />}
             {tela === 'servicos' && <MeusServicos id={id} nome={eu.nm_usuario} />}
             {tela === 'horarios' && (
               <TelaHorarios horarios={horarios}
                             salvarDia={(horario: DadosHorario) => configurarHorarioBarbeiro(id, horario)}
                             salvos={recarregar}
                             subtituloBloqueio="Somente a sua agenda"/>
             )}
             {tela === 'relatorio' && <Relatorio idBarbeiro={id} />}
           </Painel>
  );
}

function MeusServicos({id ,nome}: { id: number; nome: string })
{
  return ( <section className="admin-bloco servicos-proprios">
             <div className="admin-bloco-titulo">
               <h2>Serviços que você realiza</h2>
             </div>
             <p className="barbeiros-orientacao">
               O catálogo é mantido pelo Admin. Marque os serviços que você executa: no agendamento, o cliente só encontra você
               nos serviços marcados.
             </p>
             <div className="barbeiro-perfil-servicos">
               <FotoProfissional id={id} nome={nome} />
               <ServicosRealizados id={id} />
             </div>
           </section>
  );
}
