# trail-running-races

Riempie un Google Sheet di gare di Trail / Sky Running a partire da un elenco di nomi in `races.txt`. Per ogni gara mancante un agente (Claude Code o Codex, headless) cerca le informazioni sul web e lo script inserisce una riga nella sezione della regione giusta, in ordine di data. Dettagli in [docs/goal.md](docs/goal.md).

## Setup

Richiede Node ≥ 24 e pnpm.

```sh
pnpm install
cp .env.example .env
```

In `.env`:

| Variabile                     | Contenuto                                                           |
| ----------------------------- | ------------------------------------------------------------------- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | percorso del file della chiave del service account, oppure il JSON  |
| `SHEET_ID`                    | id del foglio, preso dall'URL fra `/d/` e `/edit`                   |
| `SHEET_TAB` (opzionale)       | nome del tab; default il primo                                      |
| `AGENT_CMD` (opzionale)       | comando dell'agente; default `claude -p …` con WebSearch e WebFetch |
| `AGENT_TIMEOUT` (opzionale)   | timeout per gara in secondi; default `300`                          |
| `RACES_FILE` (opzionale)      | percorso dell'elenco gare; default `races.txt`                      |

Il foglio va condiviso con l'email del service account (in scrittura per `fill`).

## Elenco gare

`races.txt`: un nome per riga. Righe vuote e righe che iniziano con `#` sono ignorate; i duplicati (case insensitive) sono segnalati e saltati.

## Comandi

### `missing`

```sh
pnpm start missing
```

Stampa i nomi presenti in `races.txt` ma non nel foglio (match esatto sul nome, case insensitive). Legge solo il foglio, non invoca l'agente.

### `fill`

```sh
pnpm start fill [--dry-run] [--only <nome>] [--sheet-csv <path>]
```

Per ogni gara mancante invoca l'agente e inserisce la riga nel foglio. A fine run stampa un riepilogo: righe inserite, non trovate, ambigue ed errori; con errori l'exit code è `1`.

- `--dry-run`: mostra le righe che inserirebbe senza scrivere nel foglio (lo legge comunque, quindi servono le credenziali).
- `--only <nome>`: limita il run a una sola gara, anche se assente da `races.txt`. Se è già nel foglio l'agente non viene invocato.
- `--sheet-csv <path>`: legge il foglio da un export CSV locale invece che da Google; implica `--dry-run` e non richiede credenziali Google.

Esempi:

```sh
pnpm start fill --dry-run --only "Elba trail"
pnpm start fill --sheet-csv fixtures/sheet.csv
pnpm start fill
```

Esiti per gara:

- **trovata**: riga completa nella sezione della regione, in ordine di data.
- **non trovata** / **ambigua**: riga con il solo nome in fondo alla sezione `Da verificare`; conta come presente nei run successivi finché non la cancelli a mano.
- **errore** (timeout, output non valido): nessuna riga; verrà ritentata al run successivo. Il riepilogo mostra l'output dell'agente se non era JSON valido.

Il comando è idempotente e non modifica né riordina le righe esistenti. Le sezioni regionali vanno create a mano; `Resto di Italia`, `Estero` e `Da verificare` sono create in fondo al foglio quando servono.

Il prompt dell'agente è in [prompt.md](prompt.md).

## Sviluppo

```sh
pnpm test         # vitest
pnpm typecheck
pnpm lint
pnpm format       # oxfmt; format:check per verificare
```
