# S1 — Skeleton: l'header del foglio letto via service account

← [Register](../roadmap.md#now)

**Outcome:** `node src/main.ts` raggiunge il foglio reale con il service account e stampa la riga di header.

**Requested by:** `tech-choices.md` § Effect 4 (Config, servizi come port, `NodeServices.layer`), § Google Sheets (Auth, Lettura).
**Spec:** —
**Tickets:** —
**ADRs:** —

## Audience

L'autore come sviluppatore: vede che runtime, Effect 4 rc, Config da env e Sheets API sono collegati end-to-end prima di scrivere una riga di dominio.

## Includes

- Entry point `src/main.ts` eseguito direttamente da Node 24, con `NodeServices.layer` fornito.
- `Config` per `SHEET_ID`, `SHEET_TAB` (default il primo tab) e `GOOGLE_SERVICE_ACCOUNT_JSON` (JSON inline se inizia con `{`, altrimenti percorso), con errore tipizzato se manca qualcosa.
- Port `SheetReader` definito con `Context.Service` in sola forma shape; Layer Google con JWT da `google-auth-library` e `@googleapis/sheets`, `Effect.tryPromise` in forma oggetto con rejection mappate su `SheetAuthError` e affini.
- Un'operazione non di dominio: `spreadsheets.values.get` della prima riga del tab, stampata così com'è.

## Verification

- Con la chiave e l'id del foglio nell'env, `node src/main.ts` stampa i sei nomi di colonna del foglio reale.
- Senza `SHEET_ID` il comando termina con un messaggio che nomina la variabile mancante ed exit code 1.
- Con una chiave non valida, o un foglio non condiviso, l'errore stampato è quello tagged, non uno stack trace di `googleapis`.

## Learning target

Da un entry `.ts` senza build, Effect 4 rc con `Config` e Layer e `@googleapis/sheets` con JWT arrivano al foglio reale a runtime: il modo in cui la rc organizza i moduli non blocca la composizione decisa.

## Excludes

- Colonne per header, sezioni, match dei nomi: `S2`.
- Il processo figlio dell'agente: `S3` è la riga che lo valida.
- Qualsiasi scrittura sul foglio: `S5`.

## Note di consegna

- Il port `SheetReader` espone `rows` (tutte le righe del tab, un solo `values.get`) e `main` stampa la prima: è la forma che `S2` consuma, invece di un'operazione usa e getta sulla sola riga 1.
- Il tab si risolve con un `spreadsheets.get` preliminare (titoli e flag `hidden`): default il primo tab visibile, e un `SHEET_TAB` inesistente dà `SheetTabNotFoundError` con i tab disponibili invece di un 400 generico. La stessa chiamata servirà a `S5` per l'id numerico del tab.
- Il client JWT è quello di `google-auth-library` preso dal riesporto `auth` di `@googleapis/sheets`: la dipendenza diretta portava una seconda versione della libreria e un tipo `JWT` incompatibile con `sheets({ auth })`. `tech-choices.md` § Google Sheets aggiornato.
- `pnpm start` carica `.env` se presente (`--env-file-if-exists`); le variabili già nell'ambiente prevalgono.

## Open questions

- —
