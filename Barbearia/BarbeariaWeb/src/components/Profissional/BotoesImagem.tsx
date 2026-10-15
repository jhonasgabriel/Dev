interface BotoesImagemProps {
  escolher: (arquivo?: File) => void;
  desabilitado?: boolean;
  className?: string;
  classeBotao?: string;
  /** Câmera frontal (selfie) ou traseira (produto). */
  camera?: 'user' | 'environment';
}

/** "Escolher da galeria" e "Abrir câmera" para envio de imagem. */
export function BotoesImagem({escolher ,desabilitado = false ,className ,classeBotao ,camera = 'user'}: BotoesImagemProps)
{
  const classe = [classeBotao, desabilitado ? 'desabilitado' : ''].filter(Boolean).join(' ');

  return ( <div className={className}>
             <label className={classe}>
               Escolher da galeria
               <input type="file"
                      disabled={desabilitado}
                      accept="image/jpeg,image/png,image/webp"
                      onChange={e =>
                      {
                        escolher(e.target.files?.[0]);
                        e.target.value = '';
                      }}/>
             </label>
             <label className={classe}>
               Abrir câmera
               <input type="file"
                      disabled={desabilitado}
                      accept="image/*"
                      capture={camera}
                      onChange={e =>
                      {
                        escolher(e.target.files?.[0]);
                        e.target.value = '';
                      }}/>
             </label>
           </div>
  );
}
