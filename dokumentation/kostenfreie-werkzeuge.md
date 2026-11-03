# Werkzeuge: kostenfrei und kommerziell nutzbar

Stand: 2026-11-01. „Geprüft“ = Lizenz aus den installierten Paketdaten gelesen. „Geplant“ = noch nicht installiert, Lizenz wird vor dem Einbau genauso geprüft.

## Im Einsatz (geprüft)

| Baustein | Zweck | Lizenz |
|---|---|---|
| manifold-3d 3.5.4 | 2D-/3D-Geometrie (WASM) | Apache-2.0 |
| opentype.js 2.0.0 | Schrift-Konturen | MIT |
| Pacifico, Dancing Script, Nunito (via @fontsource) | Schriften | SIL OFL 1.1 |
| trimesh 5.2 | Qualitätsprüfung | MIT |
| Shapely 2.2 | Qualitätsprüfung | BSD-3-Clause |
| NumPy, SciPy, Matplotlib | Rechnen, Prüfbilder | BSD-artig / matplotlib-Lizenz |
| manifold3d (Python) | Volumenberechnung in trimesh | Apache-2.0 laut Projekt; Paketdaten ohne Angabe, in Phase 9 gegenprüfen |
| PGlite 0.5 | Datenbank lokal, bis der Server steht | Apache-2.0 |
| Next.js 16, React 19 | Website | MIT |
| Three.js 0.187 | 3D-Vorschau | MIT |
| Cormorant Garamond, Jost (via @fontsource) | Schriften der Website | SIL OFL 1.1 |

## Geplant

| Baustein | Zweck | Lizenz (erwartet) | Hinweis |
|---|---|---|---|
| PostgreSQL | Datenbank | PostgreSQL-Lizenz | |
| pg-boss, Zod, Drizzle | Job-Queue, Validierung, Datenbankzugriff | MIT / Apache-2.0 | |
| SimpleWebAuthn | Passkey-Login | MIT | |
| Nodemailer + Strato-SMTP | E-Mail-Versand | MIT | Nutzt das Postfach deiner Domain, kein bezahlter Mail-Dienst |
| Bambu Studio | Slicing | AGPL-3.0, kostenlos | Nur als Programm genutzt, der eigene Code bleibt unberührt |
| Bambu Connect | Druckübergabe | kostenlos, proprietär | Bedingungen vor Phase 7 lesen |
| Etsy Open API | Bestellungen lesen | kostenlos | Eigene Etsy-Verkaufsgebühren bleiben bestehen |

## Geänderte Entscheidungen wegen „keine Kosten“

- **Objektspeicher (S3) entfällt:** Dateien liegen im privaten Dateisystem des Servers, Backups per Skript.
- **Bezahlter E-Mail-Dienst entfällt:** Versand über das Strato-Postfach.
- **Clipper2 entfällt:** manifold-3d enthält die 2D-Operationen bereits.
- **Keine KI-API im Kern:** Geometrie und Prüfung laufen ohne laufende API-Kosten.

## Was trotzdem Geld kosten kann

- **Server:** Strato-Webhosting ohne Node.js reicht nicht. Das klärt sich am Wochenende mit den genauen Tarifdaten.
- **Rechtstexte:** kostenlose Generatoren gibt es, eine Prüfung durch einen Händler-Rechtsdienst ist meist kostenpflichtig.
- **Verpackungslizenz (VerpackG):** Die LUCID-Registrierung ist kostenlos, die Systembeteiligung nicht.
