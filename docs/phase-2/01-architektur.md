# Phase 2 · Architektur

Stand: 2026-10-27 · Status: **Entwurf, wartet auf Freigabe**

## 1. Entscheidungen aus deinen Antworten

| Thema | Entscheidung | Begründung |
|---|---|---|
| Drucker | Bambu Lab P1S + AMS, Standarddüse 0,4 mm; 0,2 mm nur für Option „Fein“ | 0,4 mm ist schnell und robust; 0,2 mm erlaubt feinere Schrift, druckt aber ca. 3–4× langsamer |
| Material | Standard **PETG** (z. B. Bambu PETG HF); Alternative **PLA Tough+** | PETG ist zäh und biegt eher, statt zu brechen – wichtig bei dünnen Stegen. PLA ist spröder. ASA/ABS wären möglich (P1S ist geschlossen), bringen aber Verzug und Gerüche – nicht im MVP |
| Druckübergabe | Bambu Connect, letzter Start-Klick durch dich | Einzig offiziell unterstützter Weg für Drittsoftware mit aktueller Firmware |
| Produktstil | Freistehende Ausschnitt-Optik ohne Rückwand | Folge: **jedes Teil muss mit dem Rahmen verbunden sein** (siehe §3) |
| Automatisierung | v1: jede Stufe manuell. Datenmodell enthält bereits eine abschaltbare, standardmäßig deaktivierte Automatik-Richtlinie je Stufe | Später einzeln freischaltbar, ohne Umbau |

## 2. Korrektur gegenüber Phase 1: Geometrie-Kern in TypeScript statt OpenSCAD

In Phase 1 hatte ich OpenSCAD empfohlen. Deine Antwort zu Frage 5 (keine Rückwand) ändert das:

- Ohne Rückwand müssen i-Punkte, Umlaute, nicht verbundene Buchstaben, Jahreszahl und Symbole **automatisch erkannt und mit Stegen angebunden** werden.
- Das erfordert 2D-Rechengeometrie (Zusammenhangskomponenten, kürzeste Verbindung, Offset-Prüfungen). **OpenSCAD kann das nicht** – es kann weder Inseln erkennen noch Abstände messen.
- Würde ich diese Logik in Python auslagern, liefe die Browser-Vorschau mit anderem Code als die Produktion → Vorschau wäre nicht mehr maßstabsgetreu.

**Neue Lösung – ein einziger Geometrie-Kern, der im Browser und auf dem Server identisch läuft:**

| Baustein | Bibliothek | Zweck |
|---|---|---|
| Schrift-Konturen | `opentype.js` | Glyphen aus lizenzierten TTF/OTF-Dateien, inkl. Kerning |
| 2D-Boolesche Operationen, Offsets | `Clipper2` (JS/WASM-Port) | Vereinigen, Inseln finden, Stege, Mindestbreiten |
| 3D-Extrusion, Löcher, Export | `manifold-3d` (WASM) | Garantiert geschlossene (manifold) Körper, STL/3MF |

Paket `packages/geometry` (TypeScript, deterministisch, versioniert). Gleiche Eingabe + gleiche Kern-Version + gleicher Katalog ⇒ bit-identische Ausgabe. Das wird getestet (Golden-File-Tests).

**Editierbare Quelldateien** (Anforderung „SCAD oder vergleichbar“) – pro Auftrag:

1. `recipe.json` – vollständige parametrische Beschreibung (Katalog-Version, Kern-Version, alle Parameter). Regeneriert das Modell exakt.
2. `model.scad` – generierte OpenSCAD-Datei: fertige 2D-Kontur als Polygon + Parameter (Dicke, Ösen-Durchmesser, Skalierung) als Variablen. In OpenSCAD öffnen, ändern, neu exportieren.
3. `layout.svg` – 2D-Kontur in Millimetern, editierbar in Inkscape / Fusion 360 / Affinity.

**Qualitätsprüfung bleibt bewusst in Python** (trimesh, manifold3d, Shapely): Ein *unabhängiger* Prüfer prüft das Ergebnis des Generators – der Generator prüft sich nicht selbst.

## 3. Gestaltungskonzept (kreativ, aber druckbar)

Formen (Rahmen):
- **Kranz** – Kreisring mit Motivband: Schneeflocken · Sterne · Tannenzweige · Stechpalme (wie dein Foto, aber eigene Motive)
- **Christbaumkugel** – Kreis mit stilisierter Kappe oben, Öse in der Kappe
- **Stern** – fünfzackiger Rahmen
- **Tanne** – Tannenbaum-Silhouette als Rahmen
- **Pur** – nur Schriftzug mit geschwungener Unterlinie („Swash“) und Öse

Kunde wählt: Form · Motivband · Schriftart · Name · optionale Jahreszahl (im Rahmenband unten) · optionales Symbol an den Namensenden (Stern, Herz, Schneeflocke, Glocke) · Größe · Dicke · Farbe (optional zweifarbig, siehe unten) · Anzahl.

Konnektivitätsregeln (Kern erzwingt sie, Prüfer kontrolliert sie):
1. Schriftzug wird so skaliert, dass erster und letzter Buchstabe den Rahmen **überlappen** (wie „J“ und „a“ im Foto).
2. Zusätzlich verbindet eine **Unterlinie** (Swash) Schriftzug und Rahmen beidseitig – optisch elegant, mechanisch der Hauptsteg.
3. Verbleibende Inseln (i-Punkt, Umlautpunkte, Symbole) werden über den kürzesten Weg mit einem **Steg ≥ Mindestbreite** angebunden. i-Punkte werden optional durch einen kleinen Stern/ein Herz ersetzt, das den Buchstaben berührt.
4. Danach: genau **1 zusammenhängender Körper**, sonst Abbruch.

Zweifarbig (Phase 7 prüfen, nicht MVP): Körper wird in zwei Ebenen geteilt (Basis + oberste 0,6 mm), jede Ebene bekommt einen eigenen AMS-Slot. Nur ein Farbwechsel pro Druck → wenig Abfall.

Vorläufige Fertigungsgrenzen (werden in Phase 5 durch Testdrucke kalibriert):

| Parameter | 0,4-mm-Düse | 0,2-mm-Düse |
|---|---|---|
| Mindeststegbreite | 1,2 mm | 0,6 mm |
| Mindestabstand (Lücke) | 0,8 mm | 0,5 mm |
| Dicke | 2,5 / 3 / 4 mm | 2 / 2,5 mm |
| Ösen-Loch / Material um Loch | ≥ 4 mm / ≥ 2 mm | ≥ 3 mm / ≥ 1,5 mm |
| Durchmesser | 60 / 80 / 100 mm | 50 / 60 mm |

## 4. Komponenten

```
apps/web            Next.js (App Router, TypeScript)
                    ├─ /           öffentlicher Konfigurator (Live-3D-Vorschau aus packages/geometry)
                    ├─ /admin      Kontroll- und Freigabeoberfläche (nur authentifiziert)
                    └─ /api        Konfigurationen, Etsy-Webhook, Agent-Schnittstelle
apps/worker         Node-Worker: Etsy-Abfrage, CAD-Jobs, E-Mail-Jobs (Job-Queue in Postgres)
apps/print-agent    Windows-Dienst auf dem Druckrechner (Node): Slicing, Übergabe an Bambu Connect
services/qc         Python: unabhängige Geometrieprüfung, Prüfbericht (aufgerufen vom Worker)
packages/geometry   Geometrie-Kern (Browser + Node)
packages/catalog    Katalog-Schema (Zod) + Preisberechnung + Validierung
packages/workflow   Zustandsmaschine (einzige Stelle, die Übergänge definiert)
packages/contracts  Signierte Job-Formate zwischen Server und Print-Agent
```

Technik: TypeScript überall außer QC (Python). PostgreSQL 16+ als einzige Datenbank (auch Job-Queue via `pg-boss`, Sperren via `SELECT … FOR UPDATE`). Prisma oder Drizzle als ORM (Entscheidung in Phase 3; Schema ist ORM-neutral als SQL entworfen). Objektspeicher S3-kompatibel mit Versionierung, privat.

## 5. Datenfluss

```
Kunde ─► Konfigurator ─► POST /api/configurations ─► DB (Konfiguration v1, Code WX-7K3M-9QF2)
                                                         │
Kunde ─► Etsy-Angebot (Code ins Personalisierungsfeld) ─► Etsy-Checkout
                                                         │
Etsy ─► Webhook order.paid (falls verfügbar) ──┐         │
Worker ─► Abfrage getShopReceipts alle 5 min ──┴─► Abgleich ─► ORDER_MATCHED / NEEDS_CLARIFICATION
Du ─► Freigabe ─► CAD-Job (Worker) ─► QC (Python) ─► CAD_GENERATED
Du ─► Freigabe ─► Agent holt Slicing-Job ─► Bambu-Studio-CLI ─► Upload ─► SLICING_COMPLETED
Du ─► Freigabe Slicing ─► Du ─► Freigabe Übertragung ─► Agent ─► Bambu Connect öffnet Datei
Du ─► in Bambu Connect: AMS-Slot prüfen, „Drucken“ ─► Admin: „Druck fertig“ ─► PRINT_COMPLETED
```

## 6. Etsy-Anbindung (Design)

- **Abfrage (Polling) ist der Hauptweg**, funktioniert mit einer normalen Etsy-App mit *Personal Access* für den eigenen Shop.
- **Webhooks sind Beschleuniger**, falls deine App Zugriff bekommt (laut Developer-Portal an kommerzielle Apps gebunden). Webhook-Inhalt wird nie vertraut: Signatur prüfen, Ereignis-ID deduplizieren, Bestellung immer per API frisch laden.
- OAuth-Tokens (Access + Refresh) werden **verschlüsselt** gespeichert (AES-256-GCM, Schlüssel nur in Umgebungsvariable).
- Nur lesende Scopes (`transactions_r`, `listings_r`). Keine Schreibzugriffe auf den Shop.
- Code-Format: `WX-XXXX-XXXX`, Crockford-Base32 (ohne verwechselbare Zeichen I/L/O/U), 8 Zufallszeichen + 1 Prüfzeichen im Code integriert → Tippfehler werden erkannt. Parser toleriert Leerzeichen, Kleinschreibung, fehlende Bindestriche.
- Prüfungen beim Abgleich: bezahlt · Code vorhanden · Code gültig · Code noch nicht verwendet · Etsy-Variante passt zur Größe · Menge passt · Betrag ≥ Konfigurationspreis × Menge. Jede Abweichung ⇒ `NEEDS_CLARIFICATION`.

## 7. Druckrechner und Print-Agent

- Läuft als Windows-Dienst unter eigenem, eingeschränktem Benutzerkonto.
- **Nur ausgehende HTTPS-Verbindungen**. Keine offenen Ports, kein Fernzugriff, keine Portfreigabe am Router.
- Authentifizierung: Ed25519-Schlüsselpaar auf dem Agent (privater Schlüssel per Windows DPAPI geschützt); Server kennt den öffentlichen Schlüssel. Jede Anfrage signiert, mit Zeitstempel + Nonce (Replay-Schutz).
- Jeder Job ist **vom Server signiert** und enthält: Job-ID, Typ (nur `SLICE` oder `HANDOFF_TO_BAMBU_CONNECT`), Freigabe-ID, SHA-256 der Eingabedatei. Agent prüft Signatur und Hash vor der Ausführung, sonst Ablehnung.
- Agent kennt eine feste Liste von Profilen (P1S 0,4 / 0,2, Prozess, Filamente). Es werden **keine** Pfade, Befehle oder Profile vom Server übernommen – nur Profil-*Schlüssel* aus der Liste.
- **Trockenlauf-Schalter** (lokal, Standard **an**): Handoff wird nur protokolliert, Bambu Connect wird nicht geöffnet. Erst nach Phase 8 von dir lokal umgestellt.

## 8. Sicherheit

| Bereich | Maßnahme |
|---|---|
| Admin-Login | Passkey (WebAuthn) als Hauptweg, TOTP als Reserve. Ein Admin-Konto. Sitzung: httpOnly, Secure, SameSite=Strict, 12 h |
| Freigaben | CSRF-Token, erneute Bestätigung (Step-up mit Passkey) für Druckübertragung; Freigabe gilt nur für einen konkreten Datei-Hash |
| Eingaben | Validierung serverseitig mit demselben Zod-Schema wie im Browser; Name nur aus erlaubtem Zeichensatz je Schrift (Glyph-Abdeckung geprüft) |
| Web | CSP, Rate-Limits auf öffentliche Endpunkte, keine Nutzerdaten in URLs außer dem Konfigurationscode |
| Dateien | Privater Speicher, kurzlebige signierte Links, Dateinamen nie aus Nutzereingaben, Hash-Prüfung bei jedem Weiterreichen |
| Geheimnisse | Nur Umgebungsvariablen/Secret-Store, nie im Repo; Etsy-Tokens verschlüsselt |
| Protokoll | Append-only-Auditlog für Logins, Freigaben, Ablehnungen, Statuswechsel, Jobs, E-Mails |
| Backups | Täglicher DB-Dump + Point-in-Time-Recovery (falls Hoster bietet), Objektspeicher versioniert, monatlicher Wiederherstellungstest |
| Datenschutz | Käuferdaten minimal (Bestell-ID, Vorname nur falls nötig), Löschfrist z. B. 24 Monate nach Versand |

## 9. Hosting-Anforderungen (offen)

Benötigt werden: Node.js 22, PostgreSQL 16+, ein dauerhaft laufender Hintergrundprozess (Worker), Python 3.12 für QC, HTTPS. Klassisches Webhosting (nur PHP/MySQL) reicht dafür **nicht** – siehe offene Frage im Chat.
