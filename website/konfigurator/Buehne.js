// Linke Seite: Anhänger in 3D mit Girlande, Schnee und Maßangabe.
import dynamic from 'next/dynamic';
import { DEKO } from '../../einstellungen/deko';
import { TEXTE } from '../../einstellungen/texte';
import { mm } from '../technik/format';
import Girlande from './Girlande';
import Schnee from './Schnee';

const Anhaenger3D = dynamic(() => import('./Anhaenger3D'), { ssr: false });

const K = TEXTE.konfigurator;

export default function Buehne({ model, color }) {
  const dims = model?.meta.expected;

  return (
    <section className="stage" aria-label="Vorschau">
      <div className="bokeh" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <Anhaenger3D model={model} color={color} />
      {DEKO.girlandeAn && <Girlande />}
      {DEKO.schneeAn && <Schnee />}
      <div className="stage-foot">
        <p className="stage-dims">
          {dims ? <>{mm(dims.widthMm)} × {mm(dims.heightMm)} × {mm(dims.thicknessMm)} mm</> : K.vorschauLaedt}
        </p>
        <p className="stage-note">{K.vorschauHinweis}</p>
      </div>
    </section>
  );
}
