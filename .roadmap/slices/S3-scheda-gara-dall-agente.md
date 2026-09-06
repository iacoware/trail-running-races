# S3 — Scheda gara validata dall'agente per un nome

← [Register](../roadmap.md#now)

**Outcome:** `fill --dry-run` invoca l'agente headless per ogni gara mancante e stampa la scheda decodificata, o l'errore tagged.

**Requested by:** `goal.md` § Cosa fa lo script (passo 3), § Vincoli (agente intercambiabile), § Esiti possibili (errore agente); `arch-choices.md` § Contratto con l'agente, § Una chiamata agente per gara; `tech-choices.md` § Agente, § Effect 4 (ChildProcess).
**Spec:** —
**Tickets:** —
**ADRs:** —

## Audience

L'autore come sviluppatore: vede cosa l'agente restituisce per una gara vera e può iterare su `prompt.md` prima che il posizionamento esista.

## Includes

- Port `Agent` e Layer su `ChildProcessSpawner` di `effect/unstable/process`: `AGENT_CMD` (default `claude -p --output-format text --allowedTools WebSearch,WebFetch`) spezzato in argomenti array, prompt su stdin come `Stream`, stdout letto come stringa, `AGENT_TIMEOUT` in secondi (default 300) con `Effect.timeout` → `AgentTimeout`.
- `prompt.md` con placeholder `{{nome}}`: ricerca web, preferenza per il sito ufficiale, freschezza del sito per disambiguare, risposta in solo JSON conforme allo schema.
- Estrazione del primo blocco JSON dall'output e decodifica con lo Schema della scheda di `arch-choices.md` § Contratto: `esito`, `url`, `data` vincolata alla grammatica del parser, `luogo`, `regione` chiusa alle 20 regioni più `Estero`, `minutiDaFirenze`, `tipo` chiuso a `Trail` e `Sky`, `distanze`, `candidati`; output non decodificabile → `AgentInvalidOutput`.
- `fill --dry-run` e `--only <nome>`: i candidati sono le gare mancanti di `S2`, oppure il solo nome dato anche se assente dal file, sempre dopo il controllo di presenza nel foglio; per ciascuno, in sequenza, la scheda decodificata o l'errore stampati.

## Verification

- `fill --dry-run --only "<gara vera non nel foglio>"` stampa una scheda con `esito` trovata, `url` del sito ufficiale, `data` che rientra nella grammatica e `regione` in lista.
- Con un nome inventato la scheda ha `esito` non trovata; con un nome che designa più eventi ha `esito` ambigua e `candidati`.
- Con `AGENT_TIMEOUT=1` il run riporta `AgentTimeout` per la gara e termina con exit code 1; con un `AGENT_CMD` che stampa prosa attorno al JSON la scheda viene comunque decodificata; con un `AGENT_CMD` che stampa testo senza JSON l'errore è `AgentInvalidOutput`.
- `--only` con una gara già presente nel foglio non invoca l'agente.

## Learning target

Claude Code headless, con `prompt.md`, restituisce per gare vere schede che passano lo Schema chiuso: la grammatica delle date e la lista chiusa delle regioni non rifiutano ciò che l'agente produce spontaneamente.

## Excludes

- Posizionamento, formattazione delle celle e piano: `S4`.
- Riepilogo di fine run: `S4`; qui gli errori sono stampati per gara.
- Righe in `Da verificare` per non trovata e ambigua: `S6`.
- Codex come agente: `S8`.

## Open questions

- —
