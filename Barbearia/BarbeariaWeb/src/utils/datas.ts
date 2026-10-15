/** Datas no formato da API (aaaa-mm-dd), sempre no fuso local. */
export const paraIso = (data: Date) => data.toLocaleDateString('sv-SE');

export const hojeIso = () => paraIso(new Date());

/** aaaa-mm-dd (ou data/hora ISO) → dd/mm/aaaa */
export const dataBr = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');

/** Meio-dia evita que o fuso horário mude o dia ao converter. */
export const dataLocal = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`);

export const primeiroDiaMes = (iso: string) => `${iso.slice(0, 7)}-01`;

export function ultimoDiaMes(iso: string)
{
  const [ano, mes] = iso.slice(0, 7).split('-').map(Number);
  return paraIso(new Date(ano, mes, 0));
}

/** Data limite para alguém com a idade informada (ex.: 14 anos para barbeiros). */
export function dataComIdade(anos: number)
{
  const data = new Date();
  data.setFullYear(data.getFullYear() - anos);
  return paraIso(data);
}

/** "08:30" → 510 */
export function minutos(hora: string)
{
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** 510 → "08:30" */
export const paraHora = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

export const DIAS_SEMANA = ['Domingo'
                           ,'Segunda-feira'
                           ,'Terça-feira'
                           ,'Quarta-feira'
                           ,'Quinta-feira'
                           ,'Sexta-feira'
                           ,'Sábado'];
