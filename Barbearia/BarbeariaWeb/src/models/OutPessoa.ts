export interface OutPessoa {
  id_pessoa: number;
  nm_usuario: string;
  no_telefone: string;
  dt_nascimento: string | null;
  tp_usuario: string;
  sn_ativo: string;
  vl_pendente: number;
  qt_atendimentos: number;
  dt_ultimo_atendimento: string | null;
  nm_barbeiros?: string;
}
