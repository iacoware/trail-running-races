# Roadmap — Trail running races

**Goal:** Mantenere a mano un elenco piatto di nomi di gare Trail / Sky in un file di testo e far sì che uno script riempia il Google Sheet con le sole gare mancanti, cercando le informazioni tramite un agente, per sapere quali gare sono fattibili in un dato periodo dell'anno.

**Sources:** `docs/goal.md`, `docs/concepts.md`, `docs/arch-choices.md`, `docs/tech-choices.md`, `fixtures/sheet.csv`.

**Current state:** Consegnata S0: repository git su `main`, toolchain pnpm con Effect 4 `rc.112` e type stripping nativo di Node 24, `pnpm typecheck` e `pnpm test` verdi, chiave del service account in locale fuori da git e lettura del foglio reale verificata. Lo script gira sulla macchina dell'autore, senza deploy e senza CI (`tech-choices.md` § Linguaggio): NOW finisce con l'autore che usa `fill` contro il foglio reale, e nessuna riga di rilascio segue.

## Themes

| Theme | Promise | First validator |
|---|---|---|
| `mancanti` | Vedo quali gare dell'elenco mancano ancora nel foglio, senza interrogare l'agente. | `S2` |
| `anteprima` | Vedo cosa `fill` inserirebbe (sezione, posizione, celle) senza toccare il foglio, anche senza credenziali Google partendo da un CSV esportato. | `S4` |
| `inserimento` | Una gara aggiunta all'elenco compare nel foglio nella sezione della sua regione, in ordine di data, con nome linkato e celle compilate, senza che io cerchi nulla; rilanciare non fa nulla. | `S5` |
| `da-verificare` | Una gara che l'agente non trova, o trova ambigua, finisce in coda a `Da verificare` con il motivo e non viene ricercata di nuovo finché non la cancello. | `S6` |
| `sezioni-speciali` | Non devo preparare `Resto di Italia`, `Estero` e `Da verificare`: lo script le crea in fondo al foglio quando servono, nell'ordine canonico. | `S7` |
| `agente-intercambiabile` | Passo da Claude Code a Codex cambiando una variabile d'ambiente, senza toccare il codice. | `S8` |

## NOW

| Id | Title | Theme | Kind | Size | Readiness | Executor | Depends on |
|---|---|---|---|---|---|---|---|
| S1 | [Skeleton: l'header del foglio letto via service account](slices/S1-skeleton-header-foglio.md) | `—` | `release` | `small` | `ready` | `agent` | — |
| S2 | [missing: i nomi mancanti dal foglio reale](slices/S2-missing-gare-mancanti.md) | `mancanti` | `product` | `small` | `ready` | `agent` | — |
| S3 | [Scheda gara validata dall'agente per un nome](slices/S3-scheda-gara-dall-agente.md) | `inserimento` | `enabler` | `medium` | `ready` | `agent` | S2 |
| S4 | [Piano di inserimento in dry run, anche da CSV](slices/S4-piano-dry-run-da-csv.md) | `anteprima` | `product` | `medium` | `ready` | `agent` | S3 |
| S5 | [Riga della gara trovata inserita nel foglio](slices/S5-inserimento-nel-foglio.md) | `inserimento` | `product` | `medium` | `ready` | `agent` | S4 |
| S6 | [Non trovata e ambigua parcheggiate in Da verificare](slices/S6-da-verificare.md) | `da-verificare` | `product` | `small` | `ready` | `agent` | S5 |
| S7 | [Sezioni speciali create quando mancano](slices/S7-sezioni-speciali.md) | `sezioni-speciali` | `product` | `small` | `ready` | `agent` | S5, S6 |
| S8 | [Lo stesso run con Codex come agente](slices/S8-codex-come-agente.md) | `agente-intercambiabile` | `product` | `small` | `ready` | `mixed` | S3 |

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

- `inserimento, S3` — `Tipo` è chiuso a `Trail` e `Sky` come nello schema della scheda; i puntini in `goal.md` § Formato del foglio descrivono il foglio esistente, che non si tocca. Un valore diverso rende la scheda non valida.
- `inserimento, S3` — `--only <nome>` restringe i candidati a quel nome ma non salta il controllo di presenza nel foglio: una gara già presente non viene ricercata neppure con `--only`.
- `anteprima, S4` — La grammatica delle date ha tre forme (`tech-choices.md` § Parser), non le due di `concepts.md` § Data di riferimento: l'intervallo a cavallo di mese è un intervallo.
- `anteprima, S4` — `--dry-run` da solo legge il foglio reale, credenziali incluse; "senza richiedere credenziali" del goal si ottiene con `--sheet-csv`, che implica il dry run.
- `anteprima, S4` — Nel dry run ogni posizione è calcolata contro il foglio così com'è stato letto, non contro le righe pianificate prima nello stesso run: due gare nuove nella stessa sezione possono indicare la stessa riga di destinazione.
- `mancanti, S2` — La normalizzazione della chiave di `tech-choices.md` § Elenco gare (trim, lowercase, spazi collassati, NFC, apostrofi) si applica anche al testo visibile della colonna Nome, non solo ai nomi del file.
- `mancanti, S2` — Le righe che seguono una riga vuota senza un header di sezione restano fuori da ogni sezione e producono un avviso; il match per nome le conta comunque come presenti.
- `sezioni-speciali, S7` — La creazione di una sezione speciale e la riga gara che la richiede vanno nella stessa richiesta atomica, così un crash non lascia una sezione vuota.

## Open questions

- Nessuna.

## Cross-functional concerns

- **Authorization.** Il foglio è raggiunto solo con il service account condiviso come editor, mai con credenziali personali; la chiave arriva da `GOOGLE_SERVICE_ACCOUNT_JSON` e non entra mai nel repository.
- **Validation and errors.** L'output dell'agente è decodificato con lo Schema della scheda al confine: JSON assente o non decodificabile, data fuori grammatica, regione fuori lista o timeout sono errori tagged riportati nel riepilogo di fine run, mai una riga nel foglio; almeno un errore vale exit code 1 e la gara viene ritentata al run successivo.
- **Operability.** Una chiamata agente per gara, in sequenza: l'errore di una gara non interrompe il run delle altre e il riepilogo finale riporta inserite, non trovate, ambigue con candidati ed errori.
- **Data integrity and recovery.** L'unica scrittura è un solo `batchUpdate` che inserisce la riga già valorizzata in posizione N; la posizione è ricalcolata rileggendo il foglio prima di ogni inserimento; l'idempotenza poggia solo sul match della chiave normalizzata con il testo visibile della colonna Nome, e nessuna riga esistente viene mai modificata.
