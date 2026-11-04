# So änderst du die Website selbst

Du brauchst keine Programmierkenntnisse. Fast alles, was du ändern willst, steht in **vier Dateien**.

## 1. Vorbereitung (einmalig)

1. **Visual Studio Code** installieren: <https://code.visualstudio.com> (kostenlos). Damit öffnest und bearbeitest du die Dateien.
2. **Node.js** installieren: <https://nodejs.org>, die LTS-Version (kostenlos).
3. In Visual Studio Code: *Datei → Ordner öffnen* und diesen Projektordner wählen.

## 2. Website starten

Doppelklick auf **`Website-starten.bat`**. Der Browser öffnet sich mit der Seite.

Lass das schwarze Fenster offen. Wenn du eine Datei speicherst (`Strg + S`), zeigt der Browser die Änderung nach wenigen Sekunden an. Beim ersten Öffnen kann die 3D-Vorschau etwas dauern.

## 3. Was du wo änderst

**Alles, was du regelmäßig änderst, liegt im Ordner `einstellungen`.** Dort kannst du nichts an der Technik beschädigen.

| Das möchtest du ändern | Datei |
|---|---|
| Texte, Überschriften, Fragen, Shop-Name, Impressums-Angaben | `einstellungen/texte.js` |
| Farben und Schriften der Website | `einstellungen/farben.css` |
| Schnee, Girlande, Kugeln, Start-Anhänger | `einstellungen/deko.js` |
| Preise, Größen, Stärken, Farben der Anhänger, Filamente, Namenslänge | `einstellungen/katalog.json` |
| Gesperrte Wörter | `einstellungen/gesperrte-woerter.txt` |
| Grenzwerte des Filamentlagers (die Rollen selbst: Seite `/lager`) | `einstellungen/lager.js` |

Für größere Änderungen am Aufbau:

| Das möchtest du ändern | Datei |
|---|---|
| Reihenfolge der Abschnitte auf der Startseite, Abschnitt entfernen | `website/app/page.js` |
| Reihenfolge der Auswahlschritte im Konfigurator | `website/konfigurator/Schritte.js` |
| Aufbau eines einzelnen Abschnitts | `website/abschnitte/` |
| Abstände, Größen, Handy-Ansicht | `website/stil/` |
| Datenschutz-Text und Impressum | `website/app/datenschutz/page.js`, `website/app/impressum/page.js` |

## 4. Beispiele

**Überschrift ändern** in `einstellungen/texte.js`:

```js
ueberschrift1: 'Ein Name.',
```

wird zu

```js
ueberschrift1: 'Dein Name.',
```

**Shop-Name ändern** in `texte.js`, ganz oben:

```js
export const MARKE = 'Mein Shop';
```

**Neue Frage ergänzen** in `texte.js`, in der Liste bei `fragen`:

```js
['Wie lange dauert die Fertigung?', 'Das steht im Etsy-Angebot.'],
```

**Gold wird zu Silber** in `farben.css`:

```css
--brass: #c8ccd2;
```

**Weniger Schnee** in `deko.js`:

```js
schneeflocken: 30,
```

**Preis ändern** in `katalog.json`. Preise stehen in **Cent**, also 14,90 € = `1490`:

```json
{ "id": "m80", "label": "Mittel", "diameter_mm": 80, "nozzles": ["n04"], "unit_price_cents": 1990, "etsy_listing_id": null },
```

Die Preise auf der Website müssen zu den Preisen in deinem Etsy-Angebot passen.

**Neue Farbe ergänzen** in `katalog.json`, in der Liste `colors`:

```json
{ "id": "rose", "label": "Rosé", "hex": "#D8A7A0", "material": "petg", "in_stock": true },
```

Die `id` muss eindeutig sein. `"in_stock": false` blendet eine Farbe aus. Im Shop erscheint die Farbe erst, wenn im Filamentlager eine passende Rolle eingetragen ist (siehe unten).

**Filamente und Farben eintragen, die du hast:** Das geht auf der versteckten Seite `/lager`. So kommst du hinein:

1. Einmalig im Ordner `website` eine Datei `.env.local` anlegen, darin eine Zeile mit deinem Passwort: `LAGER_PASSWORT=dein-langes-passwort`. Danach die Website neu starten. Die Datei wird von Git nie gespeichert.
2. Auf der Seite ganz nach unten scrollen und **fünfmal schnell auf den Markennamen** in der Fußzeile klicken (auf dem Handy: tippen).
3. Passwort eingeben. Du landest im Lager und bleibst 12 Stunden angemeldet.

Wer nicht angemeldet ist, bekommt unter `/lager` nur „Seite nicht gefunden“. Ohne gesetztes Passwort kommt niemand hinein, auch du nicht.

Dort trägst du jede Rolle ein: Material, Farbe, Hersteller, Restmenge in Gramm, AMS-Platz und welche Shop-Farbe sie beliefert.

- Eine Shop-Farbe ist im Konfigurator nur wählbar, solange eine verknüpfte Rolle mindestens 50 g Rest hat. Ist die letzte Rolle leer, verschwindet die Farbe von selbst.
- Rollen ohne Shop-Farbe, zum Beispiel PLA für eigene Projekte, kannst du trotzdem eintragen. Sie haben keinen Einfluss auf den Shop.
- Beim ersten Öffnen stehen dort schon die heutigen Katalogfarben mit je 1000 g. Bitte die Mengen an deine echten Rollen anpassen.
- Grenzwerte wie „ab wann leer“ und weitere Materialien stellst du in `einstellungen/lager.js` ein.

**Neue Größe oder Stärke**: In `sizes` eine Zeile nach demselben Muster ergänzen, die Stärken stehen in `thickness_mm` unter `n04`. Die Geometrie passt sich automatisch an.

**Etsy verbinden**: Trage bei jeder Größe die Nummer deines Etsy-Angebots ein. In der Adresse `etsy.com/listing/1234567890/...` ist das `1234567890`:

```json
"etsy_listing_id": 1234567890
```

**Etsy-Bestellung fertigen:** Alles zur Einrichtung des Etsy-Shops und zum Ablauf jeder Bestellung steht in `dokumentation/etsy/01-einrichtung.md`, die Texte zum Kopieren in `dokumentation/etsy/02-texte.md`. Kurzform im Terminal:

```bash
npm run auftrag -- --angebot kranz-schneeflocken --name "Julia" --groesse Mittel --farbe Gold --bestellung 3456789012
```

Welche Angebote es gibt (Form, Verzierung, Symbol), steht in `einstellungen/etsy-angebote.json`.

## 5. Die häufigsten Fehler

Wenn die Seite nach dem Speichern eine rote Fehlermeldung zeigt, liegt es fast immer daran. Die Meldung ist auf Englisch und nennt die Datei und die Zeile (`line 4`). Das ist keine Katastrophe: Sobald der Fehler behoben und gespeichert ist, erscheint die Seite von selbst wieder.

1. **Komma vergessen.** In den Listen endet jeder Eintrag außer dem letzten mit einem Komma. In `katalog.json` darf nach dem **letzten** Eintrag **kein** Komma stehen.
2. **Anführungszeichen fehlt** oder wurde gelöscht. Text steht immer zwischen zwei Zeichen. Ein Apostroph im Text wird in `texte.js` so geschrieben: `'Das ist\'s'`.
3. **Falsche Klammer gelöscht.** Klammern `{ }` und `[ ]` kommen immer paarweise.
4. **`address already in use` beim Start.** Die Website läuft schon in einem anderen schwarzen Fenster. Dieses Fenster schließen oder dort einfach weiterarbeiten.

Mit `Strg + Z` machst du eine Änderung rückgängig. Danach speichern, und die Seite läuft wieder.

## 6. Änderungen prüfen

Nach größeren Änderungen, vor allem am Katalog, einmal im Terminal von Visual Studio Code (*Terminal → Neues Terminal*) ausführen:

```bash
npm run pruefen
```

Der Befehl prüft Eingaben, Datenbankregeln und testet, ob die Website sauber gebaut werden kann.

## 7. Stände sichern und zurückholen (Git)

Das Projekt nutzt Git. Git merkt sich gesicherte Stände, zu denen du jederzeit zurückkannst. Es läuft nur auf deinem PC, nichts wird ins Internet hochgeladen.

**Einen Stand sichern**, zum Beispiel nachdem eine Änderung gut aussieht:

1. In Visual Studio Code links auf das Symbol **Quellcodeverwaltung** klicken (`Strg + Umschalt + G`).
2. Dort siehst du alle geänderten Dateien. Ein Klick zeigt alt und neu nebeneinander.
3. Oben kurz beschreiben, was sich geändert hat, zum Beispiel `Preise angepasst`.
4. Auf **Commit** klicken. Fragt das Programm, ob alle Änderungen übernommen werden sollen, mit **Ja** bestätigen.

**Noch nicht gesicherte Änderungen verwerfen:** In derselben Ansicht mit der rechten Maustaste auf die Datei klicken und **Änderungen verwerfen** wählen. Das lässt sich nicht rückgängig machen.

**Einen älteren Stand ansehen:** Im Terminal zeigt dieser Befehl die Liste aller Stände:

```bash
git log --oneline
```

Um einen älteren Stand zurückzuholen, frag am besten Claude. So geht dabei nichts verloren.

Nicht gesichert werden die Testdatenbank (`.data`), die Beispielmodelle (`out`) und installierte Pakete. Git ist außerdem kein Backup: Geht die Festplatte kaputt, sind auch die gesicherten Stände weg.

## 8. Hier besser nichts ändern

Diese Ordner enthalten die Technik. Änderungen können die Druckdateien oder die Sicherheit beeinflussen:

| Ordner | Inhalt |
|---|---|
| `anhaenger` | Berechnet die Anhänger und die Druckdateien |
| `pruefung` | Unabhängige Qualitätsprüfung der Modelle |
| `datenbank` | Datenbank und Freigaberegeln |
| `website/technik` | Vorschau-Rechner, Speichern, Code-Erzeugung |
| `website/app/api` | Nimmt gesicherte Gestaltungen entgegen |
| `node_modules`, `.next`, `.data`, `out`, `website/public` | Werden automatisch erzeugt |

## 9. Überblick über die Struktur

```text
Shop_Website/
  ANLEITUNG.md             Diese Anleitung
  Website-starten.bat      Startet die Website mit Doppelklick
  einstellungen/           HIER ÄNDERST DU ALLES WICHTIGE
  website/                 Die Website
    app/                   Die Seiten: Start, Impressum, Datenschutz, Lager
    lager/                 Hintergrundseite für Filamente und Farben
    abschnitte/            Kopfzeile, Zusagen, Fertigung, Ablauf, Fragen, Fußzeile
    konfigurator/          Bühne, 3D-Anhänger, Auswahlschritte, Preisleiste, Code-Fenster
    stil/                  Aussehen, nach Thema getrennt
    technik/               Rechner und Speichern im Hintergrund
  anhaenger/               Berechnet Anhänger und Druckdateien
  pruefung/                Prüft die fertigen Modelle
  datenbank/               Aufbau der Datenbank und Freigaberegeln
  dokumentation/           Planung und Hintergründe
```

## 10. Vor dem Livegang

- `einstellungen/texte.js`: Shop-Name und alle Angaben in eckigen Klammern
- `einstellungen/katalog.json`: Preise, `etsy_listing_id` je Größe, Herstellerangaben, verfügbare Farben
- `einstellungen/gesperrte-woerter.txt`: Liste ergänzen
- `website/technik/datenbank.js`: lokale Datenbank gegen PostgreSQL tauschen (übernimmt Claude)
- Auf dem Server `LAGER_PASSWORT` setzen (langes, zufälliges Passwort, ein anderes als lokal), sonst kommt niemand in `/lager`
- Filamentlager auf `/lager` mit den echten Rollen und Mengen füllen
