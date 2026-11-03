// Zahlen so anzeigen, wie man sie in Deutschland schreibt.
import catalog from '../../einstellungen/katalog.json';

export const euro = (cents) => (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: catalog.currency });
export const mm = (value) => value.toLocaleString('de-DE', { maximumFractionDigits: 1 });
