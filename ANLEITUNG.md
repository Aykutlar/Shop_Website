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

| Das möchtest du ändern | Datei |
|---|---|
| Texte, Überschriften, Fragen, Shop-Name, Impressums-Angaben | `apps/web/src/inhalte/texte.js` |
| Farben der Website | `apps/web/src/app/farben.css` |
| Schnee, Girlande, Kugeln, Start-Anhänger | `apps/web/src/inhalte/deko.js` |
| Preise, Größen, Stärken, Farben der Anhänger, Filamente, Namenslänge | `config/katalog.json` |
| Gesperrte Wörter | `config/blocklist.txt` |
| Datenschutz-Text | `apps/web/src/app/datenschutz/page.js` |

## 4. Beispiele

**Überschrift ändern** in `texte.js`:

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

Die `id` muss eindeutig sein. `"in_stock": false` blendet eine Farbe aus.

**Neue Größe oder Stärke**: In `sizes` eine Zeile nach demselben Muster ergänzen, die Stärken stehen in `thickness_mm` unter `n04`. Die Geometrie passt sich automatisch an.

**Etsy verbinden**: Trage bei jeder Größe die Nummer deines Etsy-Angebots ein. In der Adresse `etsy.com/listing/1234567890/...` ist das `1234567890`:

```json
"etsy_listing_id": 1234567890
```

## 5. Die drei häufigsten Fehler

Wenn die Seite nach dem Speichern eine rote Fehlermeldung zeigt, liegt es fast immer daran. Die Meldung ist auf Englisch und nennt die Datei und die Zeile (`line 4`). Das ist keine Katastrophe: Sobald der Fehler behoben und gespeichert ist, erscheint die Seite von selbst wieder.

1. **Komma vergessen.** In den Listen endet jeder Eintrag außer dem letzten mit einem Komma. In `katalog.json` darf nach dem **letzten** Eintrag **kein** Komma stehen.
2. **Anführungszeichen fehlt** oder wurde gelöscht. Text steht immer zwischen zwei Zeichen. Ein Apostroph im Text wird in `texte.js` so geschrieben: `'Das ist\'s'`.
3. **Falsche Klammer gelöscht.** Klammern `{ }` und `[ ]` kommen immer paarweise.

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

| Ordner oder Datei | Inhalt |
|---|---|
| `packages/geometry` | Berechnet die Anhänger und die Druckdateien |
| `services/qc` | Qualitätsprüfung der Modelle |
| `db` | Datenbank und Freigaberegeln |
| `apps/web/src/app/api` | Speichern der Konfigurationen |
| `apps/web/src/components` | Bausteine der Oberfläche. Für Änderungen am Aufbau, nicht an Texten |
| `node_modules`, `.next`, `.data`, `out` | Werden automatisch erzeugt |

## 9. Überblick über die Struktur

```text
Website-starten.bat       Startet die Website mit Doppelklick
ANLEITUNG.md              Diese Anleitung
config/
  katalog.json            Produktoptionen und Preise
  blocklist.txt           Gesperrte Wörter
apps/web/src/
  inhalte/
    texte.js              Alle Texte
    deko.js               Dekoration und Start-Anhänger
  app/
    farben.css            Farben
    globals.css           Layout, Abstände, Größen
    page.js               Reihenfolge der Abschnitte auf der Startseite
    impressum/, datenschutz/
```
