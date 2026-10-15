import type { HorarioFuncionamento } from '../../services/agendaService';
import { DIAS_SEMANA, minutos, paraHora } from '../../utils/datas';

/** Horário de um dia da semana como é editado na tela (horas em "hh:mm"). */
export interface ConfiguracaoDia {
  dia_semana: number;
  nome: string;
  ativo: boolean;
  hr_abertura: string;
  hr_fechamento: string;
  hr_inicio_almoco: string;
  hr_fim_almoco: string;
}

export const CONFIGURACAO_PADRAO: ConfiguracaoDia[] = DIAS_SEMANA.map((nome, dia) => ({
  dia_semana: dia,
  nome,
  ativo: dia !== 0,
  hr_abertura: '08:00',
  hr_fechamento: '16:00',
  hr_inicio_almoco: '12:00',
  hr_fim_almoco: '13:00'
}));

const STATUS_FINALIZADOS = ['finalizado', 'finalizada', 'pago', 'paga', 'ok', 'concluido', 'concluída', 'concluida'];

export const normalizarStatus = (status?: string) => (status ?? '').trim().toLocaleLowerCase('pt-BR');

export const estaFinalizado = (status?: string) => STATUS_FINALIZADOS.includes(normalizarStatus(status));

export const estaCancelado = (status?: string) => normalizarStatus(status).includes('cancel');

/** Agendado/confirmado: ainda pode ser finalizado. */
export const estaPendente = (status?: string) => ['confirmado', 'agendado'].includes(normalizarStatus(status));

/** Converte o horário da API para a tela; dias sem cadastro usam o padrão. */
export function paraConfiguracao(lista: HorarioFuncionamento[]): ConfiguracaoDia[]
{
  return CONFIGURACAO_PADRAO.map(padrao =>
  {
    const salvo = lista.find(item => item.dia_semana === padrao.dia_semana);
    if (!salvo) return padrao;

    return {
      ...padrao,
      ativo: salvo.sn_ativo === 'S',
      hr_abertura: salvo.hr_abertura.slice(0, 5),
      hr_fechamento: salvo.hr_fechamento.slice(0, 5),
      hr_inicio_almoco: salvo.hr_inicio_almoco?.slice(0, 5) ?? '',
      hr_fim_almoco: salvo.hr_fim_almoco?.slice(0, 5) ?? ''
    };
  });
}

/** Configuração do dia da semana da data (aaaa-mm-dd). */
export function configuracaoDaData(configuracoes: ConfiguracaoDia[], data: string)
{
  const dia = new Date(`${data}T12:00:00`).getDay();
  return configuracoes.find(item => item.dia_semana === dia);
}

/** Horários de 30 em 30 minutos do expediente, sem o intervalo de almoço. */
export function gerarHorarios(configuracao?: ConfiguracaoDia)
{
  if (!configuracao?.ativo) return [];

  const abertura = minutos(configuracao.hr_abertura);
  const fechamento = minutos(configuracao.hr_fechamento);
  const inicioAlmoco = configuracao.hr_inicio_almoco ? minutos(configuracao.hr_inicio_almoco) : null;
  const fimAlmoco = configuracao.hr_fim_almoco ? minutos(configuracao.hr_fim_almoco) : null;

  const horarios: string[] = [];
  for (let atual = abertura; atual < fechamento; atual += 30)
  {
    const emAlmoco = inicioAlmoco !== null && fimAlmoco !== null && atual >= inicioAlmoco && atual < fimAlmoco;
    if (!emAlmoco) horarios.push(paraHora(atual));
  }
  return horarios;
}
