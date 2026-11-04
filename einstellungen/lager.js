// ─────────────────────────────────────────────────────────────
//  FILAMENTLAGER
//
//  Die Rollen selbst trägst du auf der Seite /lager ein.
//  Hier stehen nur die Grenzwerte dazu, in Gramm.
// ─────────────────────────────────────────────────────────────

export const LAGER = {
  // Unter diesem Rest zählt eine Rolle nicht mehr: Die Shop-Farbe verschwindet,
  // wenn keine andere verknüpfte Rolle mehr übrig ist. Ein Anhänger wiegt etwa 10–25 g.
  mindestRestGramm: 50,

  // Ab hier wird eine Rolle auf der Lagerseite als „fast leer“ markiert.
  fastLeerGramm: 200,

  // Vorschlag für neue Rollen (eine volle Bambu-Rolle hat 1000 g).
  neueRolleGramm: 1000,

  // Zusätzliche Materialien, die du besitzt, aber (noch) nicht im Shop anbietest.
  // Die Shop-Materialien kommen automatisch aus katalog.json.
  weitereMaterialien: {
    pla: 'PLA',
    pla_matte: 'PLA Matt',
    pla_silk: 'PLA Silk',
    abs: 'ABS',
    asa: 'ASA',
    tpu: 'TPU',
    sonstiges: 'Sonstiges',
  },
};
