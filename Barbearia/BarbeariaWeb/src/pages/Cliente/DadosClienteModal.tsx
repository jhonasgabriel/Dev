import { useState } from 'react';
import type { FormEvent } from 'react';
import { formatarTelefone, somenteNumeros } from '../../utils/formatacao';

interface DadosClienteModalProps {
  ocupado: boolean;
  erro: string;
  fechar: () => void;
  confirmar: (nome: string, telefone: string) => void;
}

/** Última etapa do agendamento: nome e telefone do cliente. */
export function DadosClienteModal({ocupado ,erro ,fechar ,confirmar}: DadosClienteModalProps)
{
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [aviso, setAviso] = useState('');

  function enviar(evento: FormEvent)
  {
    evento.preventDefault();
    if (nome.trim().length < 3)
    {
      setAviso('Informe seu nome com pelo menos 3 caracteres.');
      return;
    }
    if (telefone.length < 10)
    {
      setAviso('Informe um telefone válido com DDD.');
      return;
    }
    setAviso('');
    confirmar(nome.trim(), telefone);
  }

  const mensagem = aviso || erro;

  return ( <div
             className="modal-dados-fundo"
             role="presentation"
             onMouseDown={evento =>
             {
               if (evento.target === evento.currentTarget && !ocupado) fechar();
             }}>
             <section className="modal-dados" role="dialog" aria-modal="true" aria-labelledby="titulo-dados">
               <button className="modal-dados-fechar"
                       type="button"
                       aria-label="Fechar"
                       disabled={ocupado}
                       onClick={fechar}>
                 ×
               </button>

               <span>Última etapa</span>
               <h2 id="titulo-dados">Informe seus dados</h2>
               <p>Usaremos estas informações somente para identificar seu agendamento.</p>

               <form onSubmit={enviar}>
                 <label htmlFor="nome-cliente">
                   Nome
                   <input id="nome-cliente"
                          autoFocus
                          required
                          minLength={3}
                          maxLength={50}
                          autoComplete="name"
                          placeholder="Seu nome"
                          value={nome}
                          onChange={e => setNome(e.target.value)}/>
                 </label>
                 <label htmlFor="telefone-cliente">
                   Número de telefone
                   <input id="telefone-cliente"
                          required
                          inputMode="numeric"
                          minLength={14}
                          maxLength={15}
                          autoComplete="tel"
                          placeholder="(00) 00000-0000"
                          value={formatarTelefone(telefone)}
                          onChange={e => setTelefone(somenteNumeros(e.target.value, 11))}/>
                 </label>

                 {mensagem && (
                   <p className="mensagem erro" role="alert">
                     {mensagem}
                   </p>
                 )}
                 <button type="submit" disabled={ocupado}>
                   {ocupado ? 'Confirmando...' : 'Finalizar agendamento'}
                 </button>
               </form>
             </section>
           </div>
  );
}
