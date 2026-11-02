# Phase 2 – Architektur, Datenmodell, Freigabe-Workflow

Status: **Entwurf, wartet auf deine Freigabe** (Phase 3 startet erst danach)

| Dokument | Inhalt |
|---|---|
| [01-architektur.md](01-architektur.md) | Komponenten, Technik, Geometrie-Kern, Gestaltungskonzept, Druckrechner, Sicherheit |
| [02-freigabe-workflow.md](02-freigabe-workflow.md) | Zustandsmaschine, Sperren, Regeln, atomare Freigabe, Kontrolloberfläche |
| [03-datenmodell.md](03-datenmodell.md) | Tabellen, Abdeckung der Anforderungen, DB-Schutzmechanismen, Aufbewahrung |
| [04-compliance.md](04-compliance.md) | Etsy-Regeln, deutsches/EU-Recht und ihre technische Umsetzung |
| [../../db/schema.sql](../../db/schema.sql) | PostgreSQL-Schema mit Schutz-Triggern |
| [../../db/schema.test.mjs](../../db/schema.test.mjs) | 29 Tests gegen das Schema (Umgehungsversuche) – alle bestanden |
| [../../config/katalog.json](../../config/katalog.json) | Zentraler Produktkatalog (Beispiel; Preise und Etsy-IDs sind Platzhalter) |

Wichtigste Änderung gegenüber Phase 1: Geometrie-Kern in TypeScript (opentype.js + Clipper2 + manifold-3d) statt OpenSCAD, weil der Stil ohne Rückwand automatisches Anbinden loser Teile erfordert. OpenSCAD-Datei wird weiterhin als editierbare Quelldatei erzeugt.
