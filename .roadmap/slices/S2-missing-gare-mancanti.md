# S2 — missing: i nomi mancanti dal foglio reale

← [Register](../roadmap.md#now)

**Outcome:** `missing` stampa i nomi dell'elenco che non hanno una riga nel foglio reale, senza invocare l'agente.

**Requested by:** `goal.md` § Sottocomandi (`missing`), § Cosa fa lo script (passi 1-2); `tech-choices.md` § Elenco gare, § Google Sheets (Lettura); `arch-choices.md` § Chiave di identità, § Posizionamento (riconoscimento sezioni).
**Spec:** —
**Tickets:** —
**ADRs:** —

## Audience

L'autore: dopo aver aggiunto nomi al file sa quali gare verranno cercate, prima di pagare una chiamata all'agente.

## Includes

- Port `RaceList` e Layer su file: percorso da `RACES_FILE` (default `races.txt`), righe vuote e righe che iniziano con `#` ignorate, duplicati con avviso e vince il primo.
- Chiave normalizzata: trim, lowercase, spazi collassati, Unicode NFC, apostrofi tipografici → `'`, accenti conservati; applicata sia ai nomi del file sia al testo visibile della colonna Nome.
- `SheetReader` completo: `values.get` con valori formattati, colonne individuate per header normalizzato e per prefisso (`Data` matcha `Data (+ o -)`), colonna mancante → errore tagged all'avvio.
- Modello del foglio da griglia: sezione = riga con solo Nome valorizzato preceduta dall'header o da una riga vuota, chiusa dalla riga vuota; le righe che seguono una riga vuota senza header restano fuori sezione con un avviso.
- Diff per chiave e stampa dei nomi mancanti, uno per riga, nell'ordine del file; exit code 0.

## Verification

- Con il foglio reale e un file che contiene due gare presenti (una scritta con maiuscole diverse dal foglio) e una assente, `missing` stampa solo quella assente.
- Una gara presente nel foglio come cella con link viene riconosciuta dal testo visibile.
- Un nome ripetuto nel file produce un avviso e una sola riga in output; una riga `# commento` non produce nulla.
- Con l'header `Distanze` rinominato, il comando termina con un errore tagged che nomina la colonna, senza stampare mancanti.

## Learning target

Il match sul testo visibile della colonna Nome, letto con valori formattati, è stabile anche sulle celle con link: è l'unica cosa su cui poggia l'idempotenza di tutta la mappa.

## Excludes

- `--sheet-csv`: è un flag di `fill`, arriva in `S4`.
- Parsing delle date e ordine dentro le sezioni: `S4`.
- Riparazione delle sezioni spezzate: licenza in `OUT-OF-SCOPE`.

## Open questions

- —
