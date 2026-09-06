# Roadmap — Trail running races

**Goal:** Mantenere a mano un elenco piatto di nomi di gare Trail / Sky in un file di testo e far sì che uno script riempia il Google Sheet con le sole gare mancanti, cercando le informazioni tramite un agente, per sapere quali gare sono fattibili in un dato periodo dell'anno.

**Sources:** `docs/goal.md`, `docs/concepts.md`, `docs/arch-choices.md`, `docs/tech-choices.md`, `fixtures/sheet.csv`.

**Current state:** Consegnate S0, S1, S2, S3, S4, S5 e S6: repository git su `main`, toolchain pnpm con Effect 4 `rc.112` e type stripping nativo di Node 24, chiave del service account in locale fuori da git, `pnpm start missing` che stampa i nomi dell'elenco senza riga nel foglio reale attraverso i port `RaceList` e `SheetReader`, e `fill [--dry-run] [--only <nome>] [--sheet-csv <path>]` che invoca l'agente headless una gara per volta attraverso il port `Agent`, decodifica la scheda con lo Schema chiuso, inserisce attraverso il port `SheetWriter` ogni gara trovata nella sezione prevista e parcheggia non trovate e ambigue in `Da verificare`; prima di ogni inserimento rilegge il foglio, usa una sola richiesta atomica e chiude con il riepilogo di inserite, non trovate, ambigue ed errori. `--sheet-csv` legge il foglio da un export CSV e implica il dry run, così l'anteprima gira senza credenziali Google. Le promesse di `anteprima`, `inserimento` e `da-verificare` sono mantenute. Lo script gira sulla macchina dell'autore, senza deploy e senza CI (`tech-choices.md` § Linguaggio): NOW finisce con l'autore che usa `fill` contro il foglio reale, e nessuna riga di rilascio segue.

## Themes

| Theme | Promise | First validator |
|---|---|---|
| `sezioni-speciali` | Non devo preparare `Resto di Italia`, `Estero` e `Da verificare`: lo script le crea in fondo al foglio quando servono, nell'ordine canonico. | `S7` |
| `agente-intercambiabile` | Passo da Claude Code a Codex cambiando una variabile d'ambiente, senza toccare il codice. | `S8` |

## NOW

| Id | Title | Theme | Kind | Size | Readiness | Executor | Depends on |
|---|---|---|---|---|---|---|---|
| S7 | [Sezioni speciali create quando mancano](slices/S7-sezioni-speciali.md) | `sezioni-speciali` | `product` | `small` | `ready` | `agent` | — |
| S8 | [Lo stesso run con Codex come agente](slices/S8-codex-come-agente.md) | `agente-intercambiabile` | `product` | `small` | `ready` | `mixed` | — |

## LATER

- Sottocomando `sort`: riordina per data le righe di una sezione, opt-in.
- Sottocomando `update`: sovrascrive le informazioni di righe esistenti, opt-in.
- Chiamate all'agente in parallelo invece che in sequenza.
- Hint per gara nell'elenco (es. regione o sito) per guidare la ricerca dell'agente.

## OUT-OF-SCOPE

- **Sezioni regionali create dallo script.** Le sezioni regionali sono quelle che l'autore ha già nel foglio, quindi lo script non decide mai il layout regionale; il prezzo è che una gara di una regione senza sezione finisce in `Resto di Italia`.
- **Colonna con data strutturata.** Il formato del foglio resta quello che è, quindi l'ordinamento si ricava dal testo della colonna Data; il prezzo è una grammatica italiana limitata, e una riga con data fuori grammatica chiude la parte ordinata della sezione.
- **Modifica, cancellazione e riordino di righe esistenti.** L'unica scrittura è l'inserimento atomico di una riga, quindi un crash non lascia mai righe vuote e rilanciare è sempre sicuro; il prezzo è che un dato sbagliato resta finché non lo si corregge a mano, e togliere un nome dal file non toglie la riga dal foglio.
- **Punto di partenza configurabile.** Il foglio è per chi vive a Firenze, quindi prompt e colonna `Da FI` fissano Firenze; il prezzo è che un altro utente deve modificare il codice.
- **Cache locale delle ricerche e database.** Il foglio è l'unico stato, quindi niente da tenere allineato; il prezzo è una chiamata all'agente ogni volta che una gara torna mancante.
- **CI e build step.** Node 24 esegue i `.ts` direttamente, quindi nessuna pipeline da mantenere; il prezzo è che type check e test girano solo quando l'autore li lancia.
- **Test end-to-end contro il foglio reale.** Il dry run sul CSV locale è il test di integrazione, quindi nessun foglio di test da mantenere; il prezzo è che un difetto del writer emerge solo sul foglio reale, mitigato dall'inserimento atomico.
- **Riparazione di sezioni spezzate.** Una riga vuota lasciata dentro una sezione si rimuove a mano, quindi lo script non riscrive mai la struttura; il prezzo è un avviso e righe fuori sezione finché non si interviene.

## Assumptions

- `sezioni-speciali, S7` — La creazione di una sezione speciale e la riga gara che la richiede vanno nella stessa richiesta atomica, così un crash non lascia una sezione vuota.

## Open questions

- Nessuna.

## Cross-functional concerns

- **Authorization.** Il foglio è raggiunto solo con il service account condiviso come editor, mai con credenziali personali; la chiave arriva da `GOOGLE_SERVICE_ACCOUNT_JSON` e non entra mai nel repository.
- **Validation and errors.** L'output dell'agente è decodificato con lo Schema della scheda al confine: JSON assente o non decodificabile, data fuori grammatica, regione fuori lista o timeout sono errori tagged riportati nel riepilogo di fine run, mai una riga nel foglio; almeno un errore vale exit code 1 e la gara viene ritentata al run successivo.
- **Operability.** Una chiamata agente per gara, in sequenza: l'errore di una gara non interrompe il run delle altre e il riepilogo finale riporta inserite, non trovate, ambigue con candidati ed errori.
- **Data integrity and recovery.** L'unica scrittura è un solo `batchUpdate` che inserisce la riga già valorizzata in posizione N; la posizione è ricalcolata rileggendo il foglio prima di ogni inserimento; l'idempotenza poggia solo sul match della chiave normalizzata con il testo visibile della colonna Nome, e nessuna riga esistente viene mai modificata.
