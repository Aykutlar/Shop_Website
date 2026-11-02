# Phase 2 · Datenmodell

Stand: 2026-10-27 · Status: **Entwurf, wartet auf Freigabe** · Schema: [`db/schema.sql`](../../db/schema.sql) · Tests: [`db/schema.test.mjs`](../../db/schema.test.mjs)

## 1. Übersicht

```
catalog_versions ─┐
                  ▼
configurations ─► configuration_versions (unveränderlich, eine pro Änderung)
      │                     │
      ▼                     ▼
  workflows ◄────── etsy_order_items ◄── etsy_receipts      etsy_webhook_events (Dedup)
      │                                                    etsy_oauth_tokens (verschlüsselt)
      ├─► approvals (unveränderlich) ─► approval_invalidations
      ├─► state_transitions (Historie, unveränderlich)
      ├─► jobs ─► artifacts (mit SHA-256) ─► check_results
      └─► emails (Idempotenzschlüssel)
workflow_transitions (erlaubte Übergänge) · automation_policies (aus) · print_agents · agent_nonces · audit_log
```

## 2. Abdeckung der Anforderungen „Konfiguration speichern“

| Anforderung | Feld |
|---|---|
| Konfigurations-ID (nicht erratbar) | `configurations.public_code` (`WX-XXXX-XXXX`, ~40 Bit Zufall + Prüfzeichen) und interne UUID |
| Version | `configuration_versions.version_no` |
| Alle Parameter | `params` (JSONB) + `params_hash` |
| Vorschau | `artifacts` vom Typ `PREVIEW_PNG` / `PREVIEW_GLB` |
| Preis | `unit_price_cents`, `quantity`, `currency` |
| Erstellungszeitpunkt | `created_at` |
| Status | `workflows.state` + `block` |
| Unveränderte Zuordnung | Versionen sind per Trigger unveränderlich; Katalog- und Geometrie-Version werden mitgespeichert ⇒ exakt reproduzierbar |

Code-Format (umgesetzt): 7 Zufallszeichen (35 Bit) + 1 Prüfzeichen. Zusammen mit dem Rate-Limit und dem Verfall nicht bestellter Konfigurationen nach 90 Tagen ist Raten praktisch aussichtslos.

## 3. Datenbank als zweite Verteidigungslinie

Die Anwendung prüft alles selbst. Zusätzlich erzwingt die Datenbank (getestet, 29/29 bestanden gegen PostgreSQL 16 via PGlite):

- Kein Überspringen von Stufen, kein Start mitten in der Kette.
- Freigabe-Stufen nur mit passender, nicht entwerteter Freigabe für genau diesen Workflow und Übergang.
- Druckübertragung nur mit Passkey-bestätigter Freigabe.
- Gesperrte Workflows bewegen sich nicht; abgebrochene sind endgültig.
- Freigaben, Historie, Auditlog und Konfigurationsversionen sind unveränderlich.
- Konfigurationsänderung entwertet alle Freigaben und setzt zurück.
- Eindeutigkeit: ein aktiver Workflow pro Code, ein Workflow pro Etsy-Position, ein Job pro Idempotenzschlüssel, ein Webhook-Ereignis nur einmal.
- Agent-Jobs (`SLICE`, `HANDOFF`) nur mit Freigabe-ID und erwartetem Datei-Hash.
- Automatik für Druckübertragung und Druckabschluss nicht aktivierbar.

**Bekannte Grenze:** Ein Datenbank-Superuser kann Trigger umgehen. In Phase 3 bekommt die Anwendung deshalb eine eigene DB-Rolle ohne direktes `UPDATE` auf `workflows.state`; Zustandswechsel laufen nur über `SECURITY DEFINER`-Funktionen. Die Historie (`state_transitions`) wird dann ebenfalls im Trigger geschrieben statt im Anwendungscode.

## 4. Aufbewahrung

| Daten | Frist |
|---|---|
| Nicht bestellte Konfigurationen | 90 Tage, danach gelöscht (inkl. Vorschauen) |
| Bestellte Konfigurationen, Artefakte, Freigaben, Historie | 24 Monate nach Abschluss (Gewährleistung/Nachdruck), dann anonymisiert |
| Etsy-Käuferdaten | nur Bestell-IDs und Beträge; keine Adressen |
| Auditlog | 24 Monate |
