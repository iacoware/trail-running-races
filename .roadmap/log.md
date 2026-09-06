# Log

## 2026-09-06 — Drawing

- `mancanti` / `anteprima` — **split.** `missing` è utile senza agente e senza pipeline di inserimento; rinviare l'anteprima lascia intatta la prova del diff.
- `anteprima` / `inserimento` — **split.** Il piano stampato risponde a "dove andrebbe" anche se la scrittura reale viene cancellata, e la scrittura si verifica anche senza CSV.
- `inserimento` / `da-verificare` — **split.** Il parcheggio è il fallback degli esiti non risolti; l'inserimento delle gare trovate si verifica con gli esiti non risolti solo riportati nel riepilogo.
- `da-verificare` / `sezioni-speciali` — **split.** Con le sezioni speciali create a mano il parcheggio si verifica per intero; la creazione automatica si rinvia da sola.
- `sezioni-speciali` / `agente-intercambiabile` — **split.** Nessuna interazione, invariante o adapter in comune.
- `goal.md` § Formato del foglio (Tipo `Trail`, `Sky`, …) / `concepts.md` § Tipo e `arch-choices.md` § Contratto (`"Trail" | "Sky"`) — **assumption.** Lo schema chiude il valore a due; i puntini del goal descrivono il foglio esistente, che non si tocca. → `inserimento, S3`
- `concepts.md` § Data di riferimento (due forme) / `tech-choices.md` § Parser e `arch-choices.md` § Contratto (tre forme) — **assumption.** L'intervallo a cavallo di mese è un intervallo: la grammatica ha tre forme. → `anteprima, S4`
- `goal.md` § Vincoli (dry run senza credenziali) / `tech-choices.md` § Configurazione (`--sheet-csv` implica `--dry-run`) — **assumption.** `--dry-run` da solo legge il foglio reale con credenziali; la promessa senza credenziali passa da `--sheet-csv`. → `anteprima, S4`
- `arch-choices.md` § Pipeline (posizioni ricalcolate rileggendo prima di ogni inserimento) / `arch-choices.md` § Dry run (stessa pipeline, writer che stampa) — **assumption.** Nel dry run ogni posizione è calcolata contro il foglio letto, non contro le righe pianificate prima nello stesso run. → `anteprima, S4`
- `tech-choices.md` § Configurazione (`--only` anche se assente dal file) / `goal.md` § Cosa fa lo script (passo 2, match con il foglio) — **assumption.** `--only` restringe i candidati a quel nome ma non salta il controllo di presenza nel foglio. → `inserimento, S3`
- `tech-choices.md` § Elenco gare (chiave normalizzata completa) / `arch-choices.md` § Chiave di identità (trim, case insensitive) — **assumption.** La stessa normalizzazione vale su entrambi i lati del match. → `mancanti, S2`
- `arch-choices.md` § Posizionamento (riga vuota interna spezza la sezione, si rimuove a mano) / `concepts.md` § Sezione (inizio riconosciuto da header o riga vuota) — **assumption.** Le righe che seguono una riga vuota senza header di sezione restano fuori da ogni sezione, con un avviso; il match per nome le conta comunque presenti. → `mancanti, S2`
- `tech-choices.md` § Google Sheets (un solo batchUpdate, `bold` per le righe sezione) / `arch-choices.md` § Non distruttività (una sola richiesta atomica per "inserisci riga") — **assumption.** La creazione di una sezione speciale e la riga che la richiede vanno nella stessa richiesta atomica. Argument: un crash tra le due lascerebbe una sezione vuota, che il vincolo di non distruttività non ammette. → `sezioni-speciali, S7`

## 2026-09-06 — Revising

- `mancanti` — **kept.** Promessa mantenuta da `S2` (archivio): il tema esce dalla tabella, `S3` non dipende più da una riga del registro.

## 2026-09-06 — Revising

- `anteprima` — **kept.** Promessa mantenuta da `S4` (archivio): il tema esce dalla tabella, `S5` non dipende più da una riga del registro.

## 2026-09-07 — Revising

- `inserimento` — **kept.** Promessa mantenuta da `S5` (archivio): il tema esce dalla tabella, `S6` e `S7` non dipendono più da una riga del registro.

## 2026-09-07 — Revising

- `da-verificare` — **kept.** Promessa mantenuta da `S6` (archivio): il tema esce dalla tabella, `S7` non dipende più da una riga del registro.

## 2026-09-07 — Revising

- `sezioni-speciali` — **kept.** Promessa mantenuta da `S7` (archivio): il tema esce dalla tabella; `S8` non ha dipendenze da aggiornare.

## 2026-09-07 — Revising

- `agente-intercambiabile` — **kept.** Promessa mantenuta da `S8` (archivio): il tema esce dalla tabella e NOW resta vuoto.
