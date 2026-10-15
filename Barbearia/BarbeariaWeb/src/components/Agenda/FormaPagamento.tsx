export const FORMAS_PAGAMENTO = ['PIX', 'ESPECIE', 'CREDITO', 'DEBITO'];

/** Seleção da forma de pagamento (Pix, dinheiro, crédito ou débito). */
export function FormaPagamento({valor ,mudar}: { valor: string; mudar: (forma: string) => void })
{
  return ( <label>
             Forma de pagamento
             <select value={valor} onChange={e => mudar(e.target.value)}>
               <option value="PIX">Pix</option>
               <option value="ESPECIE">Dinheiro</option>
               <option value="CREDITO">Crédito</option>
               <option value="DEBITO">Débito</option>
             </select>
           </label>
  );
}
