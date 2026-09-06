# S8 — Lo stesso run con Codex come agente

← [Register](../roadmap.md#now)

**Outcome:** Con `AGENT_CMD` puntato a Codex headless, `fill` produce le stesse schede e lo stesso piano, senza modifiche al codice.

**Requested by:** `goal.md` § Vincoli (agente intercambiabile); `arch-choices.md` § Agente intercambiabile; `tech-choices.md` § Configurazione via env (`AGENT_CMD`).
**Spec:** —
**Tickets:** —
**ADRs:** —

## Audience

L'autore: sceglie l'agente per costo o disponibilità cambiando una variabile d'ambiente.

## Includes

- Lavoro umano: Codex CLI installato e autenticato sulla macchina dell'autore.
- Il comando Codex in forma headless, con prompt da stdin e risposta su stdout, documentato in `.env.example` accanto al default Claude.
- Eventuali ritocchi a `prompt.md` che servono a entrambi gli agenti, registrati; nessuna biforcazione del prompt per agente.

## Verification

- `AGENT_CMD="codex exec ..." fill --dry-run --sheet-csv fixtures/sheet.csv --only "<gara vera>"` stampa un piano con una scheda decodificata, come con Claude Code.
- Con `AGENT_TIMEOUT=1` il run riporta `AgentTimeout` anche con Codex.
- Nessun file sorgente cambia tra il run con Claude Code e quello con Codex.

## Learning target

Il contratto prompt su stdin → JSON su stdout regge per una seconda CLI headless senza toccare il codice; dove il prompt deve differire per agente è il risultato che questa riga porta a galla.

## Excludes

- Un prompt per agente: se serve, è una candidata da discutere, non un'aggiunta silenziosa.
- Chiamate in parallelo: candidata in `LATER`.

## Open questions

- —
