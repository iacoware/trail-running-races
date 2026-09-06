# Glossario

**Elenco gare** — File di testo mantenuto a mano, un nome di gara per riga. È la sorgente di verità su *quali* gare interessano; non contiene altre informazioni.

**Nome gara** — Stringa scritta nell'elenco. È la chiave di identità: il match con il foglio è esatto e case insensitive, e nel foglio viene scritta tale e quale.

**Gara** — Un evento ricorrente, non una sua edizione. Ha una sola riga nel foglio. La data è quella indicativa dell'edizione più recente trovata, senza anno.

**Foglio** — Il Google Sheet di destinazione. Ha un header fisso e righe raggruppate per sezione.

**Sezione** — Gruppo di righe del foglio che inizia con una riga contenente il solo nome della regione, riconosciuta dalla struttura (solo Nome valorizzato, preceduta dall'header o da una riga vuota) e non dalla formattazione, e termina con una riga vuota. Dentro una sezione le gare sono in ordine di data. Lo script non crea mai sezioni regionali: le regioni con sezione sono quelle già presenti nel foglio.

**Regione** — Valore chiuso della scheda gara: una delle 20 regioni italiane oppure `Estero`. Decide la sezione di destinazione: regione con sezione nel foglio, altrimenti `Resto di Italia`, oppure `Estero`.

**Sezione speciale** — Sezione creata dallo script su richiesta, in fondo al foglio, nell'ordine `Resto di Italia` (regione italiana senza sezione dedicata), `Estero`, `Da verificare` (gare non trovate o ambigue). Le prime due sono ordinate per data come le sezioni regionali.

**Riga gara** — Riga del foglio che descrive una gara: Nome (link), Data, Luogo, Da FI, Tipo, Distanze.

**Riga separatore** — Riga vuota che chiude una sezione. Una riga vuota lasciata per errore dentro una sezione va rimossa a mano.

**Data di riferimento** — Testo indicativo della data della gara, in una di due forme: giorno singolo (`2 maggio`) o intervallo (`28-31 marzo`). Serve a rispondere alla domanda "quali gare ci sono in quel periodo". Il giorno di inizio determina l'ordine nella sezione. Una data della scheda gara fuori da queste forme è un errore agente; una data già nel foglio fuori da queste forme chiude la parte ordinata della sezione.

**Scheda gara** — JSON prodotto dall'agente per una gara: esito, url, data, luogo, regione, tempo da Firenze, tipo, distanze. Lo script la valida e la traduce in una riga gara.

**Esito** — Risultato della ricerca dell'agente: *trovata*, *non trovata*, *ambigua*. Solo *trovata* produce una riga completa; gli altri producono una riga con messaggio in `Da verificare`.

**Ambiguità** — Più eventi rispondono allo stesso nome e l'agente non sa scegliere, nemmeno usando la freschezza dei siti come criterio. I candidati vengono riportati nel riepilogo del run, non nel foglio.

**Agente** — Comando headless (Claude Code, Codex) che cerca sul web e risponde con una scheda gara. È l'unica componente non deterministica ed è intercambiabile.

**Prompt** — Template testuale con il nome della gara, che istruisce l'agente su cosa cercare e sul formato JSON di risposta.

**Gara mancante** — Nome presente nell'elenco senza riga corrispondente nel foglio. È l'unico caso in cui lo script scrive.

**Run** — Un'esecuzione dello script. È idempotente: ripetuto senza cambiamenti nell'elenco non scrive nulla.

**Dry run** — Run che calcola il piano di inserimento, agente compreso, e lo stampa senza scrivere sul foglio.

**Elenco mancanti** — Le gare mancanti stampate senza interrogare l'agente.

**Da FI** — Tempo indicativo in auto da Firenze, stimato dall'agente in minuti e reso dallo script come `~1h30`.

**Tipo** — Disciplina prevalente della gara, un solo valore tra `Trail` e `Sky`.

**Distanza** — Un percorso proposto dalla gara: chilometri, dislivello positivo (può mancare), flag "camminata" per i percorsi non competitivi, flag "bambini" per i percorsi riservati ai bambini. Una gara ne ha una o più; nel foglio compaiono per chilometri decrescenti.

**Percorso ignorato** — Percorso che non compare nel foglio: riservato ai bambini, oppure non competitivo e sotto i 5km. La soglia vale solo per le non competitive; una gara competitiva corta resta.
