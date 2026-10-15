interface MensagemProps {
  erro?: string;
  sucesso?: string;
}

/** Aviso de erro ou de sucesso abaixo de formulários e listas. */
export function Mensagem({erro ,sucesso}: MensagemProps)
{
  if (erro)
  {
    return ( <p className="admin-mensagem erro" role="alert">
               {erro}
             </p>
    );
  }
  if (sucesso)
  {
    return ( <p className="admin-mensagem" role="status">
               {sucesso}
             </p>
    );
  }
  return null;
}
