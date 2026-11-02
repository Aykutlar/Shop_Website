// ─────────────────────────────────────────────────────────────
//  ALLE TEXTE DER WEBSITE
//
//  Hier darfst du alles ändern, was zwischen den Anführungszeichen steht.
//  Beispiel:  knopf: 'Jetzt gestalten',
//             knopf: 'Los geht es',
//
//  Regeln:
//  - Die Anführungszeichen ' und das Komma am Zeilenende bleiben stehen.
//  - Ein Apostroph im Text wird so geschrieben: 'Das ist\'s'
//  - Die Wörter links vom Doppelpunkt (z. B. knopf:) nicht ändern.
// ─────────────────────────────────────────────────────────────

// Name deines Shops, erscheint oben links, unten und im Browser-Tab.
export const MARKE = 'Atelier Namenszug';

// Deine Angaben für Impressum und Datenschutz. Vor dem Livegang ausfüllen.
export const RECHTLICHES = {
  betreiber: '[Name / Firma des Betreibers]',
  strasse: '[Straße und Hausnummer]',
  ort: '[PLZ und Ort]',
  email: '[E-Mail-Adresse]',
  telefon: '[Telefonnummer]',
  ustId: '[USt-IdNr., falls vorhanden]',
  hoster: 'Strato GmbH, [Adresse laut Vertrag prüfen]',
};

export const TEXTE = {
  // Das, was Google und der Browser-Tab anzeigen.
  seite: {
    untertitel: 'Personalisierte Weihnachtsanhänger',
    beschreibung: 'Gestalten Sie Ihren personalisierten Weihnachtsanhänger in Echtzeit-3D. Einzeln gefertigt, von Hand geprüft.',
  },

  // Menü oben.
  menue: {
    gestalten: 'Gestalten',
    fertigung: 'Fertigung',
    ablauf: 'Ablauf',
    fragen: 'Fragen',
  },

  // Erster Bildschirm rechts neben dem Anhänger.
  start: {
    oberzeile: 'Zum Weihnachtsfest · Personalisiert',
    ueberschrift1: 'Ein Name.',
    ueberschrift2: 'Ein Stück Weihnachten.',
    einleitung: 'Ein Anhänger, der jedes Jahr wieder an den Baum zurückkehrt. Für genau einen Menschen gefertigt: Gestalten Sie ihn selbst und sehen Sie in Echtzeit das Modell, das später gedruckt wird.',
    versprechen: [
      'Einzeln für Sie gefertigt',
      'Vor dem Druck von Hand geprüft',
      'Sichere Bezahlung über Etsy',
    ],
    knopf: 'Jetzt gestalten',
  },

  // Konfigurator: Überschriften der einzelnen Schritte und Hinweise.
  konfigurator: {
    name: 'Name',
    schrift: 'Schrift',
    form: 'Form',
    verzierung: 'Verzierung',
    symbol: 'Symbol',
    groesse: 'Größe',
    staerke: 'Stärke',
    farbe: 'Farbe',
    farbeHinweis: 'PETG – zäh und bruchfest',
    jahreszahl: 'Jahreszahl',
    jahreszahlAuswahl: 'Jahreszahl hinzufügen',
    anzahl: 'Anzahl',
    preisHinweis: 'inkl. MwSt., zzgl. Versand',
    knopf: 'Gestaltung sichern & weiter',
    knopfLaeuft: 'Wird gesichert …',
    hinweisUnten: 'Im nächsten Schritt erhalten Sie Ihren persönlichen Code für die Bestellung auf Etsy. Der Kauf erfolgt ausschließlich dort.',
    vorschauLaedt: 'Vorschau wird berechnet …',
    vorschauHinweis: 'Echte Produktionsgeometrie · Ziehen zum Drehen',
    zuFiligran: 'Diese Kombination wäre zu filigran für den Druck. Bitte wählen Sie eine größere Ausführung, eine andere Schrift oder einen kürzeren Namen.',
    verbindungsfehler: 'Die Verbindung ist fehlgeschlagen. Bitte versuchen Sie es erneut.',
  },

  // Fenster, das nach dem Sichern erscheint.
  codeFenster: {
    oberzeile: 'Ihre Gestaltung ist gesichert',
    ueberschrift: 'Ihr persönlicher Code',
    kopieren: 'Kopieren',
    kopiert: 'Kopiert',
    schritte: [
      'Notieren oder kopieren Sie den Code.',
      'Wechseln Sie zu unserem Angebot auf Etsy und wählen Sie dort Ihre Größe und Anzahl.',
      'Tragen Sie den Code in das Personalisierungsfeld ein. So ordnen wir Ihre Bestellung exakt dieser Gestaltung zu.',
    ],
    knopf: 'Weiter zu Etsy',
    keinLink: 'Das Etsy-Angebot wird noch verbunden. Ihr Code bleibt gespeichert.',
    hinweis: 'Bestellung und Bezahlung erfolgen ausschließlich über Etsy. Diese Website ist kein Angebot von Etsy, Inc.',
    zurueck: 'Gestaltung weiter bearbeiten',
  },

  // Bordeauxrote Leiste unter dem Konfigurator: [Überschrift, Text].
  zusagen: [
    ['Sichere Bezahlung', 'Bestellung und Bezahlung laufen vollständig über Etsy.'],
    ['Einzelanfertigung', 'Jeder Anhänger entsteht erst mit Ihrer Bestellung.'],
    ['Persönliche Prüfung', 'Kein Modell geht ohne Freigabe in den Druck.'],
    ['Exakte Vorschau', 'Sie sehen das echte Modell in echten Maßen.'],
  ],

  fertigung: {
    oberzeile: 'Fertigung',
    ueberschrift: 'Gemacht für genau einen Namen.',
    spalten: [
      ['Ihr Name ist die Form', 'Jeder Anhänger wird aus Ihren Angaben neu berechnet. Keine Schablone, kein Aufkleber: Schriftzug und Rahmen sind ein einziges Stück.'],
      ['Zäh statt spröde', 'Gedruckt aus PETG, einem Werkstoff, der eher nachgibt als bricht. So bleibt er viele Weihnachten lang ein Teil Ihres Festes.'],
      ['Von Hand geprüft', 'Vor dem Druck wird jedes Modell automatisch vermessen und anschließend persönlich freigegeben.'],
    ],
  },

  ablauf: {
    oberzeile: 'Ablauf',
    ueberschrift: 'In vier Schritten zu Ihrem Anhänger.',
    schritte: [
      ['Gestalten', 'Sie entwerfen Ihren Anhänger hier in Echtzeit und sichern das Ergebnis.'],
      ['Code erhalten', 'Sie erhalten einen persönlichen Code, der genau diese Gestaltung bezeichnet.'],
      ['Auf Etsy bestellen', 'Sie bestellen und bezahlen auf Etsy und tragen dort den Code in das Personalisierungsfeld ein.'],
      ['Fertigung', 'Wir ordnen Ihre Bestellung zu, prüfen das Modell und fertigen Ihren Anhänger.'],
    ],
  },

  // Eine neue Frage: einfach eine weitere Zeile im selben Muster ergänzen.
  fragen: {
    oberzeile: 'Fragen',
    ueberschrift: 'Gut zu wissen.',
    liste: [
      ['Warum bestelle ich über Etsy?', 'Etsy übernimmt die Abwicklung von Bestellung und Bezahlung. Auf dieser Website gestalten Sie Ihren Anhänger, gekauft wird ausschließlich auf Etsy.'],
      ['Wie genau ist die Vorschau?', 'Die Vorschau zeigt das tatsächliche Fertigungsmodell in den angegebenen Maßen. Farbton und Oberfläche können am Bildschirm leicht abweichen; druckbedingt sind feine Schichtlinien sichtbar.'],
      ['Welche Zeichen sind möglich?', 'Buchstaben einschließlich Umlauten und vieler Sonderzeichen wie é, ş oder ñ, außerdem Bindestrich und Apostroph. Punkte und Akzente werden fest mit dem Schriftzug verbunden.'],
      ['Kann ich meine Bestellung widerrufen?', 'Personalisierte Ware wird nach Ihren Vorgaben angefertigt. Für solche Waren besteht in der Regel kein Widerrufsrecht. Maßgeblich sind die Angaben im Etsy-Shop.'],
    ],
    // Überschrift der Frage, deren Antwort aus den Warnhinweisen im Katalog kommt.
    warnhinweise: 'Worauf muss ich achten?',
  },

  fusszeile: {
    impressum: 'Impressum',
    datenschutz: 'Datenschutz',
    hinweis: 'Bestellung und Bezahlung erfolgen über Etsy. Diese Website ist kein Angebot von Etsy, Inc.',
  },
};
