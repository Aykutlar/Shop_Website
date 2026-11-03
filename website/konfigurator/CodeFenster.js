'use client';

import { useEffect, useRef, useState } from 'react';
import { TEXTE } from '../../einstellungen/texte';
import { euro } from '../technik/format';

const C = TEXTE.codeFenster;

export default function CodeFenster({ saved, onClose }) {
  const dialog = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dialog.current.showModal();
  }, []);

  async function copy() {
    await navigator.clipboard.writeText(saved.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <dialog ref={dialog} className="dialog" onClose={onClose} aria-labelledby="saved-title">
      <p className="eyebrow">{C.oberzeile}</p>
      <h2 id="saved-title">{C.ueberschrift}</h2>
      <div className="code-row">
        <output className="code">{saved.code}</output>
        <button type="button" className="button ghost small" onClick={copy}>{copied ? C.kopiert : C.kopieren}</button>
      </div>
      <ol className="handover">
        {C.schritte.map((text) => <li key={text}>{text}</li>)}
      </ol>
      <p className="caption">
        {saved.summary.name} · {saved.summary.shapeLabel} · {saved.summary.diameterMm} mm · {saved.summary.colorLabel} · {saved.summary.quantity}× · {euro(saved.totalCents)}
      </p>
      {saved.etsyUrl ? (
        <a className="button solid" href={saved.etsyUrl} target="_blank" rel="noopener noreferrer">{C.knopf}</a>
      ) : (
        <p className="hint">{C.keinLink}</p>
      )}
      <p className="caption">{C.hinweis}</p>
      <form method="dialog"><button className="link">{C.zurueck}</button></form>
    </dialog>
  );
}
