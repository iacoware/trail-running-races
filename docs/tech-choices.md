# Scelte tecniche

## Linguaggio e runtime

TypeScript eseguito direttamente da Node >= 24, che fa type stripping nativo. Quindi niente `tsx`, niente build step, niente CI. Vincolo che ne deriva: solo sintassi TypeScript cancellabile, cioè niente `enum`, niente parameter properties, niente `namespace` con valori; import con estensione `.ts` esplicita. Il type check resta un comando separato (`tsc --noEmit`), non un prerequisito per girare.

## Effect 4

Tutto lo script è scritto con Effect 4, oggi release candidate: `effect` e `@effect/platform-node` pinnati alla stessa versione esatta (`4.0.0-rc.112`). Prima di scrivere codice si verifica l'API della versione installata, perché Effect 4 riorganizza i moduli rispetto alla 3. Uso previsto:

- **Schema** per la scheda gara restituita dall'agente e per la configurazione da env. Un solo schema condiviso tra decodifica dell'output dell'agente e formattazione delle celle. L'elenco gare è testo piatto senza struttura da validare: si legge con una funzione pura (`parseRaceList`), non con uno Schema.
- **Config** per le env variables, con errori tipizzati se manca qualcosa.
- **Servizi come port** definiti con `Context.Service` nella sola forma shape (`class Agent extends Context.Service<Agent, Shape>()("Agent") {}`), senza `make` incorporato, con implementazioni in Layer in file separati: `SheetReader`, `SheetWriter`, `Agent`, `RaceList`. Il dry run è un Layer alternativo di `SheetWriter` che stampa il piano; `--sheet-csv` è un Layer alternativo di `SheetReader`.
- **ChildProcess / ChildProcessSpawner** di `effect/unstable/process`, forniti da `NodeServices.layer` di `@effect/platform-node`, per lanciare l'agente: prompt su stdin come `Stream`, stdout letto come stringa, timeout con `Effect.timeout`. Argomenti in forma array, non template literal (non gestisce le virgolette).
- **Errori tagged** per ogni fallimento atteso: `AgentTimeout`, `AgentInvalidOutput`, `UnparsableDate`, `SheetAuthError`, ecc. Nessun `Error` nudo nel canale errori.

## Google Sheets

- **Auth**: service account. Chiave JSON generata su Google Cloud con Sheets API abilitata; il foglio va condiviso con l'email del service account in modalità editor. Nessuna password personale coinvolta, revocabile in qualsiasi momento.
- **Libreria**: `@googleapis/sheets`, con il client JWT di `google-auth-library` preso dal suo riesporto `auth` (così la versione è una sola, quella che `googleapis-common` pinna), avvolte in un Layer Effect con `Effect.tryPromise` in forma oggetto e rejection mappate su errori tagged. Scartata `google-spreadsheet`: non espone `textFormatRuns` e separa inserimento e scrittura in due chiamate.
- **Link nella colonna Nome**: link ricco via `updateCells` con `textFormatRuns[].format.link`, indipendente dal locale. Scartata la formula `=HYPERLINK`: con `USER_ENTERED` il separatore segue il locale del foglio (issue Google chiusa come won't fix).
- **Lettura**: `spreadsheets.values.get` (valori formattati) per il match sul testo visibile della colonna Nome. Colonne individuate per nome dell'header, normalizzato e per prefisso (`Data` matcha `Data (+ o -)`); colonna mancante → errore tagged all'avvio.
- **Inserimento**: un solo `batchUpdate` con `insertDimension` + `updateCells` (e `bold` per le righe sezione): la riga compare già valorizzata, nessuna riga vuota orfana in caso di crash.

## Configurazione via env

| Variabile | Contenuto |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | JSON della chiave (se inizia con `{`), oppure percorso al file |
| `SHEET_ID` | id del foglio, dall'URL |
| `SHEET_TAB` | nome del tab, default il primo |
| `AGENT_CMD` | comando shell dell'agente; Codex headless: `codex exec --ephemeral --sandbox read-only -`; default `claude -p --output-format text --allowedTools WebSearch,WebFetch --model sonnet --effort medium` |
| `AGENT_TIMEOUT` | timeout per chiamata in secondi, default 300 |
| `RACES_FILE` | percorso dell'elenco, default `races.txt` |

Sottocomandi: `fill` (cerca e inserisce), `missing` (stampa i mancanti, senza agente). Flag di `fill`: `--dry-run`, `--only <nome>` (anche se assente dal file), `--sheet-csv <path>` (legge il CSV al posto del foglio, implica `--dry-run`). A fine run un riepilogo con inserite, non trovate, ambigue (con candidati) ed errori; exit code 1 se almeno un errore.

## Elenco gare

File di testo, un nome per riga. Righe vuote e righe che iniziano con `#` ignorate. Duplicati: vince il primo, con warning. Chiave normalizzata: trim, lowercase, spazi collassati, Unicode NFC, apostrofi tipografici → `'`; gli accenti restano. Nessun hint aggiuntivo per ora.

## Agente

- Invocazione: processo figlio con il prompt su stdin, timeout configurabile, output su stdout. Le gare vengono processate in sequenza.
- Prompt: file `prompt.md` con placeholder `{{nome}}`. Il prompt chiede ricerca web, preferenza per il sito ufficiale, uso della freschezza del sito per disambiguare, e risposta in solo JSON conforme allo schema.
- Validazione: lo script estrae il primo blocco JSON dall'output e lo decodifica con lo Schema della scheda gara. Output non decodificabile è un errore tagged, non una riga nel foglio.

## Parser delle date

Grammatica volutamente limitata, in italiano, senza anno. Mese case insensitive, niente spazi attorno al trattino, niente `1°`. Una data esistente fuori grammatica tratta la riga come non ordinata; una data dell'agente fuori grammatica è un errore agente.

```
<giorno> <mese>                      2 maggio
<giorno>-<giorno> <mese>             20-21 febbraio
<giorno> <mese>-<giorno> <mese>      28 febbraio-1 marzo
```

Per l'ordinamento conta il giorno di inizio. Confronto su (mese, giorno).

## Formattazione celle

- Data: il campo `data` restituito dall'agente, ripulito da spazi doppi.
- Luogo: l'agente restituisce una lista di comuni; lo script li unisce con `, `.
- Da FI: dai minuti stimati dall'agente, `~50min`, `~1h`, `~1h30`. Il foglio è pensato per chi vive a Firenze; il punto di partenza non è configurabile.
- Distanze: una riga per elemento, `{km}km {dislivello}m+` (solo `{km}km` se il dislivello manca), con `, camminata` in coda se il flag è vero, ordinati per km crescente. Prima della formattazione si scartano i percorsi con flag `bambini` e quelli con `camminata` e meno di 5km. Se non resta nulla la cella rimane vuota. Decimali con il punto (le righe esistenti sono miste, non si toccano).

## Cosa non c'è

Nessun database, nessuna cache locale delle ricerche, nessun test end-to-end contro il foglio reale. Il dry run con CSV locale (`fixtures/sheet.csv`) è il test di integrazione.

## Toolchain

`pnpm`. Unit test con Vitest 4 e `@effect/vitest@rc` (`it.effect` per i test di effetti, deroga alla regola "mai `it`"), co-locati con i sorgenti. `tsc --noEmit` come type check separato.
