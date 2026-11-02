# Phase 2 · Compliance: Etsy-Regeln und deutsches/EU-Recht

Stand: 2026-10-27 · Status: **Entwurf, wartet auf Freigabe**

> Keine Rechtsberatung. Diese Liste übersetzt bekannte Pflichten in technische Anforderungen.
> Vor dem Produktivbetrieb (Phase 9) sollten Rechtstexte (Impressum, Datenschutz, Widerruf, Produktsicherheitsangaben) von einem
> Händler-Rechtsdienst (z. B. IT-Recht Kanzlei, Händlerbund) erstellt oder geprüft werden. Etsy-Richtlinien ändern sich;
> jede Etsy-Regel unten wird vor Phase 4 und Phase 9 gegen die aktuelle Originalseite geprüft.

## 1. Etsy

| Regel | Was das für uns bedeutet | Umsetzung |
|---|---|---|
| **Keine Gebührenumgehung**: Etsy darf nicht genutzt werden, um Käufer zum Kauf außerhalb von Etsy zu leiten | Fluss nur **Website → Etsy**, nie umgekehrt. Die Website hat **keinen eigenen Checkout**, kein „Kauf außerhalb Etsy“, keinen günstigeren Preis | Einziger Kauf-Button: „Weiter zu Etsy“. Preise auf der Website = Etsy-Preise (aus Katalog, Abgleich mit Listing) |
| Externe Links in Etsy | Ob ein Link zum Konfigurator im Angebotstext erlaubt ist, ist nicht eindeutig (der Konfigurator verkauft nicht, ist aber eine externe Seite) | **Vor Phase 4 schriftlich beim Etsy-Support anfragen.** Bis dahin: Website nur im Etsy-Profil/„Über uns“, Angebotstext erklärt nur das Code-Feld |
| Kommunikation mit Käufern | Keine Nachrichten, die vom Etsy-Kauf wegführen | System schreibt Käufern in v1 **nie** automatisch. Rückfragen machst du über Etsy-Nachrichten |
| **Creativity Standards** („Made by seller“) | 3D-Druck ist erlaubt, wenn er auf **deinem eigenen Design** beruht. Fremde/lizenzierte Modelle oder Nachbauten fremder Produkte sind nicht zulässig | Alle Rahmen, Motive und Symbole entwerfen wir selbst. **Das Foto aus deiner Anfrage dient nur als Stil-Referenz – wir bauen es nicht nach.** Schriftarten nur mit Lizenz für kommerzielle Nutzung (SIL OFL), Lizenzdateien im Repo |
| KI-Offenlegung | Etsy verlangt laut Berichten Angaben, wenn KI bei der Gestaltung eingesetzt wird | Geometrie entsteht deterministisch, ohne generative KI. Falls später KI-Funktionen Designs beeinflussen: Offenlegung im Listing (vorher aktuelle Etsy-Formulierung prüfen) |
| **API-Nutzungsbedingungen** | Lizenz ist widerruflich; Daten nur zweckgebunden; „Etsy“ darf nicht im App-/Domainnamen stehen; keine Darstellung als offizielle Etsy-App | Nur lesende Scopes, nur eigener Shop, minimale Käuferdaten, Löschfristen. Hinweis auf der Website: „Bestellung und Bezahlung erfolgen über Etsy. Diese Website ist kein Angebot von Etsy, Inc.“ Kein Etsy-Logo ohne Markenrichtlinien |
| Personalisierung | Etsy-Personalisierungsfeld ist der vorgesehene Weg für Kundenangaben | Code-Eingabe im Pflicht-Personalisierungsfeld |
| Kauf auf Etsy = Etsy-Bedingungen | Käufer- und Verkäuferschutz gelten nur innerhalb Etsy | Bezahlung, Stornierung, Erstattung ausschließlich über Etsy. `order.canceled` stoppt den Workflow |

## 2. Deutschland / EU

### Website

| Pflicht | Grundlage | Umsetzung |
|---|---|---|
| **Impressum** | § 5 DDG (Digitale-Dienste-Gesetz, ersetzt TMG) | Seite `/impressum`, aus jeder Seite erreichbar |
| **Datenschutzerklärung** | Art. 13 DSGVO | Seite `/datenschutz`: Konfigurationsdaten, Hosting, E-Mail-Dienst, Etsy-Übergabe, Speicherfristen, Betroffenenrechte |
| **Auftragsverarbeitung** | Art. 28 DSGVO | AV-Verträge mit Hoster, Objektspeicher, E-Mail-Dienst. Dienste mit Sitz/Verarbeitung in der EU bevorzugt |
| **Keine Cookies/Tracker ohne Einwilligung** | § 25 TDDDG, DSGVO | v1 nutzt **nur technisch notwendige** Cookies (Admin-Sitzung). Kein Analytics ⇒ kein Cookie-Banner nötig. Später nur einwilligungsbasiert |
| **Keine Drittanbieter-Einbindungen, die IP-Adressen übertragen** | DSGVO (vgl. LG München I, 2022, Google Fonts) | **Alle Schriften, 3D-Bibliotheken und WASM-Dateien werden selbst gehostet**, kein CDN von Dritten |
| **Preisangaben** | PAngV | Gesamtpreis inkl. MwSt (bzw. Hinweis § 19 UStG bei Kleinunternehmer), Hinweis „zzgl. Versand – Versandkosten auf Etsy“ |
| **Kein irreführender „Bestell“-Button** | § 312j BGB (Button-Lösung gilt für den Checkout – der ist auf Etsy) | Button heißt „Weiter zu Etsy“, nicht „Kaufen“/„Bestellen“; Hinweis, dass der Vertrag erst auf Etsy entsteht |
| **Barrierefreiheit** | BFSG (seit 28.06.2025; Kleinstunternehmen mit < 10 Beschäftigten und ≤ 2 Mio. € Umsatz sind bei Dienstleistungen ausgenommen) | Unabhängig davon Ziel WCAG 2.1 AA: Tastaturbedienung, Kontraste, Textalternative zur 3D-Vorschau |
| **Inhalte von Kunden** | Marken-, Namens-, Persönlichkeitsrecht; StGB | Sperrliste (beleidigende/verfassungsfeindliche Begriffe, bekannte Marken) bei der Validierung + deine manuelle Prüfung jeder Bestellung. Recht zur Ablehnung in den Etsy-Shop-Richtlinien |

### Produkt und Versand

| Pflicht | Grundlage | Umsetzung im System |
|---|---|---|
| **Produktsicherheit** | GPSR (EU 2023/988, seit 13.12.2024) | Pro Auftrag automatisch ein Beipackzettel/Etikett: Hersteller (Name, Anschrift, E-Mail), **Produkt-/Chargenkennung = Konfigurationscode**, Material, Warnhinweis (z. B. „Dekorationsartikel, kein Spielzeug. Nicht in die Hände kleiner Kinder – Kleinteile/Bruchgefahr. Von offener Flamme fernhalten.“). Dokumentierte Risikobewertung. Gleiche Angaben im Etsy-Listing (Etsy hat GPSR-Felder für EU-Verkäufe) |
| **Widerrufsrecht** | § 312g Abs. 2 Nr. 1 BGB: kein Widerrufsrecht bei Waren, die nach Kundenspezifikation angefertigt werden | Muss in der **Etsy-Widerrufsbelehrung** stehen (Etsy-Shop-Richtlinien), nicht nur auf der Website |
| **Verpackungsregistrierung** | VerpackG (LUCID-Registrierung + Systembeteiligung) | Kein Software-Thema, aber Voraussetzung für den Versand an Verbraucher – bitte prüfen, ob erledigt |
| **Steuer/Aufbewahrung** | § 147 AO, GoBD (bis zu 10 Jahre für Buchungsbelege) | Rechnungen/Belege entstehen über Etsy und deine Buchhaltung. Unser System ist **kein Buchhaltungssystem**; die 24-Monats-Löschfrist gilt nur für Produktionsdaten. Etsy-Abrechnungen bitte separat archivieren |
| **Gewährleistung** | §§ 434 ff. BGB (2 Jahre) | Produktionsdaten (Rezept, STL, Freigaben) 24 Monate aufbewahren ⇒ Nachdruck bei Reklamation möglich |

## 3. Auswirkungen auf das Datenmodell und die Phasen

- Katalog erhält Pflichtfelder `legal.manufacturer`, `legal.warnings`, `material` je Filament (für GPSR-Etikett) – siehe `config/katalog.json`.
- Artefakttyp `PRODUCT_LABEL_PDF` (Beipackzettel) ist im Schema enthalten; die Erzeugung folgt in Phase 6.
- Validierung erhält eine Sperrliste (Phase 3) und einen Hinweis „Inhalt prüfen“ in der Freigabe (Phase 6).
- Website-Seiten Impressum, Datenschutz, „So funktioniert die Bestellung über Etsy“ sind Teil von Phase 3.
- Checkliste „Rechtliches“ wird Teil der Abnahme von Phase 9.
