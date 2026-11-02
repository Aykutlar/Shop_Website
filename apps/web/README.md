# Konfigurator-Website

Die Anleitung zum Ändern und Starten steht in [ANLEITUNG.md](../../ANLEITUNG.md) im Hauptordner.

Vor dem Livegang ersetzen:

- `src/inhalte/texte.js`: Markenname und Angaben für Impressum und Datenschutz
- `config/katalog.json`: Preise, `etsy_listing_id` je Größe, Herstellerangaben, Filamentbestand
- `config/blocklist.txt`: gesperrte Begriffe
- `src/server/db.js`: lokale Datenbank gegen PostgreSQL tauschen

Umgebungsvariablen:

- `ETSY_SHOP_URL`: Ziel für „Weiter zu Etsy“, solange keine Angebots-ID gepflegt ist
- `ORNAMENT_DATA_DIR`: Speicherort für Datenbank und Dateien (Standard `.data`)
