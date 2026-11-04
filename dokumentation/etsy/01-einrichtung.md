# Etsy-Shop einrichten

Stand: 04.11.2026 · Reihenfolge von oben nach unten abarbeiten. Die Texte zum Kopieren stehen in [02-texte.md](02-texte.md).

> Keine Rechtsberatung. Die rechtlichen Punkte sind eine Checkliste, keine Prüfung. Vor dem ersten Verkauf die Rechtstexte von einem Händler-Rechtsdienst (z. B. IT-Recht Kanzlei, Händlerbund) prüfen lassen. Etsy ändert Regeln und Formulare oft: Wo diese Anleitung und das Etsy-Formular sich widersprechen, gilt das Formular.

**Zeitplan:** Heute ist der 4. November. Etsy prüft neue Shops (Identität, Bankkonto), das kann einige Tage dauern. Deshalb **Schritt 1 und 2 sofort** erledigen, parallel zu den Testdrucken. Angebote erst freischalten, wenn die Testdrucke bestanden sind.

---

## Schritt 0 · Entscheidungen vorab

Diese Punkte bestimmen, was du bei Etsy einträgst. Bitte zuerst klären:

- [ ] **Wer verkauft?** Du selbst oder die Firma deines Vaters. Davon hängen das Etsy-Konto, das Impressum, das Gewerbe und die Steuer ab.
- [ ] **Gewerbe angemeldet?** Wer regelmäßig mit Gewinnabsicht verkauft, braucht in der Regel eine Gewerbeanmeldung beim Gewerbeamt der Stadt. Bei der Firma deines Vaters ggf. als zusätzliche Tätigkeit ergänzen.
- [ ] **Kleinunternehmer (§ 19 UStG) ja oder nein?** Bestimmt, ob die Preise Umsatzsteuer enthalten und was im Impressum und auf den Rechnungen steht. Mit Steuerberater oder Finanzamt klären.
- [ ] **Verpackungsregister LUCID:** Wer verpackte Ware an Privatkunden in Deutschland verschickt, muss sich **vor dem ersten Versand** kostenlos bei LUCID registrieren (<https://lucid.verpackungsregister.org>) und die Versandverpackung bei einem dualen System lizenzieren (bei kleinen Mengen über Online-Anbieter für wenige Euro im Jahr).
- [x] **Versandart:** DHL Paket Deutschland, 6,19 €, 1–4 Werktage (siehe Schritt 4).

## Schritt 1 · Konto und Shop anlegen

1. Unter <https://www.etsy.com/de/sell> ein Verkäuferkonto anlegen, mit der Geschäfts-E-Mail-Adresse.
2. **Shop-Sprache:** Deutsch. **Land:** Deutschland. **Währung:** Euro. Diese drei lassen sich später kaum ändern.
3. **Shop-Name:** `Ayvira` ✓ (erledigt). Der Name ist bewusst nicht an Weihnachten gebunden, damit später weitere Produkte darunter passen.
4. **Verkäufertyp:** Bei der Frage „Privatperson oder Unternehmen“ **Unternehmen** wählen. Wer mit Gewinnabsicht verkauft, gilt nach EU-Recht (Digital Services Act) als Unternehmer. Etsy zeigt dann deine Händlerangaben öffentlich an, das ist Pflicht.
5. **Zahlungskonto:** Bankkonto (IBAN) des Verkäufers aus Schritt 0 und Identitätsprüfung (Ausweis). Erst danach kann der Shop öffnen.
6. **Zwei-Faktor-Anmeldung** einschalten (Einstellungen → Sicherheit). Ein Etsy-Shop hängt an einem Konto. Wenn du und dein Vater beide hineinmüsst, das Passwort in einem Passwort-Manager teilen und 2FA über eine Authentifizierungs-App einrichten, auf die ihr beide Zugriff habt.

## Schritt 2 · Rechtliche Angaben im Shop

Unter *Shop-Manager → Einstellungen → Rechtliches/Impressum* (der Name kann abweichen):

- [ ] **Impressum / Händlerangaben:** Name bzw. Firma, ladungsfähige Anschrift (kein Postfach), E-Mail, Telefon, ggf. Umsatzsteuer-ID, Handelsregister, vertretungsberechtigte Person. Vorlage: [02-texte.md § Impressum](02-texte.md#impressum).
- [ ] **Widerrufsbelehrung:** Etsy hat ein Feld dafür. Wichtig ist der Satz zum **Ausschluss bei personalisierter Ware** (§ 312g Abs. 2 Nr. 1 BGB). Vorlage: [02-texte.md § Widerruf](02-texte.md#widerrufsbelehrung).
- [ ] **Datenschutz:** Etsy stellt eine Datenschutzerklärung für die Plattform. Für deine eigene Verarbeitung (Name des Kunden zum Fertigen, Adresse zum Versand) einen kurzen eigenen Text ergänzen. Vorlage in [02-texte.md](02-texte.md#datenschutz).
- [ ] **Shop-Richtlinien:** Bearbeitungszeit, Personalisierung, Reklamation. Vorlage: [02-texte.md § Richtlinien](02-texte.md#shop-richtlinien).

Diese Angaben müssen **vor** dem ersten Angebot vollständig sein.

## Schritt 3 · Produktsicherheit (GPSR)

Seit Dezember 2024 müssen Produkte für EU-Kunden Angaben zur Sicherheit haben. Du bist **Hersteller** (du entwirfst und druckst selbst) mit Sitz in der EU, also brauchst du keine zusätzliche „verantwortliche Person“.

- [ ] Im Angebotsformular (Abschnitt *Produktsicherheit* o. Ä.) Hersteller mit Name, Anschrift, E-Mail eintragen.
- [ ] Warnhinweise ins Angebot und auf den Beipackzettel: „Dekorationsartikel, kein Spielzeug. Nicht in die Hände kleiner Kinder geben (Bruchgefahr, Kleinteile). Von offener Flamme und Hitzequellen fernhalten.“ Christbaumschmuck zählt nach der EU-Spielzeugrichtlinie ausdrücklich **nicht** als Spielzeug, der Hinweis schützt dich trotzdem.
- [ ] **Hersteller-Angaben in `einstellungen/katalog.json` → `legal.manufacturer`** eintragen (dort stehen noch Platzhalter). Daraus erzeugt `npm run auftrag` den Beipackzettel für jedes Paket.
- [ ] Eine kurze schriftliche Risikobewertung ablegen (eine Seite reicht: Material, Gebrauch, mögliche Gefahren, Gegenmaßnahmen). Kann ich dir vorbereiten.

## Schritt 4 · Versandprofil

Ein Anhänger mit 60–100 mm ist flach und leicht. Optionen:

| Versandart | Vorteil | Nachteil |
|---|---|---|
| Großbrief (Deutsche Post) im gepolsterten Umschlag | günstig | **keine Sendungsverfolgung**. Bei „nicht angekommen“ steht Aussage gegen Aussage |
| Warenpost/Päckchen oder Brief mit Einschreiben | Sendungsverfolgung, Etsy-Verkäuferschutz greift leichter | teurer |

**Empfehlung:** Versand mit Sendungsverfolgung als Standard, weil Etsy Bestellungen mit Sendungsnummer besser absichert. Die aktuellen Preise bei der Post nachsehen.

- [x] Versandprofil angelegt: Bestellabwicklung Mo–Fr, **Bearbeitungszeit 5–7 Werktage**, **DHL Paket Deutschland 1–4 Werktage, 6,19 €**. Für jeden weiteren Artikel in derselben Bestellung **0 €** einstellen, weil mehrere Anhänger in dasselbe Paket passen.
- [ ] Anfangs **nur Deutschland**. EU-Versand später ergänzen (Zoll entfällt, aber Laufzeiten und Porto sind höher).
- [x] **Weihnachts-Bestellschluss: Dienstag, 8. Dezember.** Rechnung: 7 Werktage Fertigung (Versand Do 17.12.) + bis zu 4 Werktage DHL = Ankunft spätestens Mi 23.12. Steht so in den Texten.

## Schritt 5 · Angebote erstellen

**Start mit 2–3 Angeboten**, nur Formen, deren Testdruck bestanden ist. Vorschlag: *Kranz mit Schneeflocken* und *Christbaumkugel mit Tannenzweigen*. Weitere kommen später. Jedes Angebot ist in [`einstellungen/etsy-angebote.json`](../../einstellungen/etsy-angebote.json) hinterlegt, damit der Bestell-Befehl weiß, was zu drucken ist.

Für jedes Angebot im Etsy-Formular:

1. **Über dieses Angebot:** „Ich habe es gemacht“ / *Made by* · „Ein fertiges Produkt“ · „Wird auf Bestellung gefertigt“ · Herstellungsjahr aktuell.
   Das ist zulässig, weil Rahmen, Motive und Geometrie **eigene Entwürfe** sind (Etsy-Regeln seit Juni 2025: 3D-Druck nur nach eigenem Design). Schriften sind unter der SIL Open Font License und dürfen kommerziell genutzt werden.
2. **Kategorie:** z. B. *Haus & Wohnen → Feiertags- & Saisondeko → Weihnachtsdeko → Christbaumschmuck* (genaue Bezeichnung im Formular wählen).
3. **Fotos:** mindestens 5, quadratisch, bei Tageslicht. Siehe Schritt 6.
4. **Titel, Beschreibung, 13 Tags:** aus [02-texte.md](02-texte.md#angebote).
5. **Variationen** (Preise variieren nach Größe):
   - *Größe:* Klein · 60 mm (12,90 €), Mittel · 80 mm (14,90 €), Groß · 100 mm (17,90 €). Das sind die Preise aus `katalog.json`. Wenn du sie bei Etsy änderst, auch dort ändern.
   - *Farbe:* nur Farben, die im Filamentlager mit genug Rest stehen.
   - *Schrift:* Pacifico, Dancing Script, Nunito (falls Etsy eine dritte Variation erlaubt). Sonst die Schrift im Personalisierungsfeld abfragen; die Vorlage enthält beide Varianten.
6. **Personalisierung:** einschalten, **Pflichtfeld**, Zeichenlimit so niedrig wie möglich (z. B. 60), Anleitung aus [02-texte.md](02-texte.md#personalisierung).
7. **Menge:** z. B. 99 (wird auf Bestellung gefertigt). **Rückgabe:** Rücknahme ausgeschlossen bei personalisierten Artikeln (gesetzliche Gewährleistung bleibt).
8. **Produktsicherheit** (siehe Schritt 3).
9. Erst als **Entwurf** speichern. Freischalten nach bestandenem Testdruck und vollständigen Rechtsangaben.

**Etsy-Gebühren** (Stand Etsy-Hilfe): 0,20 USD Einstellgebühr pro Angebot und alle 4 Monate, **6,5 % Transaktionsgebühr** auf Preis plus Versand, dazu eine länderabhängige **Zahlungsabwicklungsgebühr** (genaue Werte zeigt Etsy im Shop-Manager unter *Finanzen*). **Offsite Ads:** Etsy schaltet Werbung außerhalb von Etsy und berechnet bei einem daraus entstandenen Verkauf eine zusätzliche Gebühr (laut Berichten 15 %). Für kleine Shops ist das abschaltbar. Prüfen, ob du das willst.

## Schritt 6 · Fotos

**Solange es keinen Testdruck gibt: Fotostudio.** Website starten, versteckt anmelden (fünfmal auf den Shopnamen in der Fußzeile), im Lager oben auf **Fotostudio** klicken. Angebot und Beispielname wählen, dann **„Kompletten Satz herunterladen“**. Das ergibt 5 Bilder in 2000 × 2000 px, alle aus der echten Druckgeometrie:

1. Hauptbild vor Tannengrün mit Lichtern (Vorschaubild bei Etsy)
2. Hauptbild auf hellem Leinen
3. Farbübersicht mit allen lieferbaren Farben
4. Schriftübersicht
5. Größenvergleich 60 / 80 / 100 mm im echten Maßstab

Pro Angebot einen eigenen Satz erzeugen. Für Abwechslung zwischen den Angeboten verschiedene Beispielnamen nehmen (z. B. Julia, Emma, Jörg). Der Hinweis „Die Bilder sind 3D-Visualisierungen“ steht schon in der Beschreibungsvorlage.

**Sobald echte Drucke da sind,** diese fotografieren und als erste Bilder einsetzen. Echte Fotos verkaufen deutlich besser. Pro Angebot:

1. Anhänger am Weihnachtsbaum, freundliches Licht, Name gut lesbar
2. Nahaufnahme frontal vor ruhigem Hintergrund
3. Größenvergleich (in der Hand oder neben einer Münze), alle drei Größen nebeneinander
4. Farbübersicht: alle lieferbaren Farben nebeneinander
5. Schriftübersicht: der gleiche Name in Pacifico, Dancing Script, Nunito
6. Optional: Verpackung mit Beipackzettel, Rückseite, kurzes Video (Etsy erlaubt 5–15 s)

Die Fotos zeigen **Beispielnamen** (Julia, Jörg, Lilli aus den Testdrucken). In die Beschreibung schreiben, dass jeder Name individuell gefertigt wird.

## Schritt 7 · Ablauf für jede Bestellung

1. Etsy meldet eine Bestellung. Erst fertigen, wenn sie **bezahlt** ist.
2. Personalisierung lesen. Ist etwas unklar (Schreibweise, zu langer Name, Sonderzeichen): **über Etsy-Nachrichten nachfragen**, nie per E-Mail oder WhatsApp.
3. Im Projektordner im Terminal:

   ```bash
   npm run auftrag -- --angebot kranz-schneeflocken --name "Julia" --groesse Mittel --farbe Gold --schrift Pacifico --jahr 2026 --bestellung 3456789012
   ```

   Der Befehl prüft den Namen gegen die Katalogregeln und die gesperrten Wörter, erzeugt das Modell, lässt die Qualitätsprüfung laufen und legt alles in `auftraege/ETSY-3456789012-Julia/` ab.
4. `preview.png` öffnen und **Buchstabe für Buchstabe mit der Bestellung vergleichen**. Das ist deine Freigabe.
5. `model.stl` in Bambu Studio öffnen, das passende Filament wählen, slicen, über Bambu Connect an den P1S schicken.
6. Nach dem Druck: Sichtkontrolle (Öse fest, keine abgebrochenen Stege), `beipackzettel.txt` ausdrucken, verpacken.
7. In Etsy als versendet markieren, **Sendungsnummer eintragen**.
8. Restmenge des Filaments auf der Lagerseite aktualisieren, sobald die Website wieder läuft.

Der Ordner `auftraege` enthält Kundennamen und wird deshalb nicht in Git gespeichert. Nach Ablauf der Gewährleistung (2 Jahre) Aufträge löschen.

Voraussetzung auf dem Rechner: Node.js (für den Befehl) und Python mit den Paketen der Qualitätsprüfung (`trimesh`, `shapely`, `matplotlib`, `numpy`).

## Schritt 8 · Später: der Konfigurator

Bevor die Konfigurator-Website mit Etsy verbunden wird, **schriftlich beim Etsy-Support nachfragen**, ob ein Hinweis auf die Website im Angebot erlaubt ist. Etsy verbietet, Käufer zum Kauf außerhalb von Etsy zu leiten; der Konfigurator verkauft zwar nichts, ist aber eine externe Seite. Eine Textvorlage für die Anfrage steht in [02-texte.md](02-texte.md#anfrage-an-den-etsy-support). Bis zur Antwort läuft alles über das Personalisierungsfeld wie oben.
