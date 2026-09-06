# Scelte architetturali

## Separazione deterministico / non deterministico

L'unica parte non deterministica è la ricerca delle informazioni, delegata all'agente. Tutto il resto è codice: match dei nomi, calcolo della posizione, formattazione delle celle, scrittura. L'agente non decide mai se una gara esiste già, in quale riga va, né come si scrive una cella.

## Pipeline

```
elenco.txt ──▶ nomi
foglio     ──▶ righe esistenti, sezioni
                    │
              diff per chiave ──▶ gare mancanti
                    │
        per ogni mancante: agente ──▶ scheda gara (JSON validato)
                    │
              posizione ──▶ (sezione, indice riga)
                    │
              inserimento riga
```

Ogni gara mancante è un'unità di lavoro indipendente: una chiamata agente, una validazione, un inserimento. Le posizioni vengono ricalcolate rileggendo il foglio prima di ogni inserimento, perché ogni inserimento sposta le righe successive.

## Chiave di identità

Il nome scritto nel file, confrontato con il testo visibile della colonna Nome, normalizzato (trim, case insensitive). È l'unica cosa che rende lo script idempotente: se il match è stabile, un crash a metà run non produce duplicati. Il nome nel foglio è scritto esattamente come nel file.

## Una chiamata agente per gara

Non un prompt unico con tutte le gare. Motivi: retry per singola gara, nessun rischio di mescolare i dati di gare diverse, parallelizzabile in futuro, output piccolo e facile da validare.

## Contratto con l'agente

L'agente riceve un prompt da template e deve rispondere con solo JSON conforme a uno schema. Lo script valida il JSON; se non è valido la gara va in errore, non nel foglio.

```jsonc
{
  "esito": "trovata" | "non_trovata" | "ambigua",
  "url": "https://…",                 // solo se trovata
  "data": "18-21 marzo",              // una delle tre forme della grammatica, senza anno
  "luogo": ["Radda", "Gaiole", "Castellina in Chianti"],
  "regione": "Toscana",               // una delle 20 regioni italiane, oppure "Estero"
  "minutiDaFirenze": 60,              // stima in auto
  "tipo": "Trail" | "Sky",
  "distanze": [
    { "km": 17.5, "dislivello": 750, "camminata": true, "bambini": false }  // dislivello opzionale
  ],
  "candidati": ["…"]                  // solo se ambigua
}
```

Lo script, non l'agente, produce le stringhe delle celle a partire da questi campi. La data deve rientrare nella grammatica del parser (vincolo nello Schema): mese e giorno di inizio si derivano dal testo, non si chiedono all'agente, così una riga scritta oggi resta ordinabile domani. `regione` è un valore chiuso: un valore fuori lista rende la scheda non valida. L'agente riporta tutti i percorsi che trova; è lo script a scartare quelli per bambini e le non competitive sotto i 5km, così il criterio resta nel codice e non nel prompt.

## Agente intercambiabile

L'agente è un comando shell configurato da env variable, che riceve il prompt su stdin e restituisce il testo su stdout. Claude Code e Codex hanno entrambi una modalità headless che rientra in questo contratto. Lo script estrae il primo blocco JSON dall'output per tollerare testo attorno.

## Posizionamento della riga

- Le sezioni sono riconosciute dalla struttura, non dal grassetto: riga con solo la colonna Nome valorizzata, preceduta da riga vuota o dall'header. Una riga con solo il nome preceduta da una riga gara è una gara senza data. Una riga vuota lasciata per errore dentro una sezione spezza la sezione: si rimuove a mano.
- Dentro la sezione le righe esistenti si assumono ordinate per data. Lo script parsa il testo della colonna Data delle righe esistenti; una riga con data non parsabile (messaggio di errore, testo libero) chiude la parte ordinata della sezione.
- La nuova riga va dopo l'ultima riga con data parsabile minore o uguale alla sua, e comunque prima della prima riga non parsabile.
- Lo script non crea sezioni regionali. La regione della scheda si confronta con i nomi delle sezioni esistenti (normalizzati, con alias per `Emilia-Romagna`, `Trentino-Alto Adige`, `Friuli-Venezia Giulia`, `Valle d'Aosta`); regione italiana senza sezione → `Resto di Italia`; `Estero` → `Estero`.
- Le sole sezioni create dallo script sono le tre speciali, in fondo al foglio, precedute da una riga vuota, nell'ordine canonico `Resto di Italia`, `Estero`, `Da verificare`: una speciale nuova va prima della prima speciale che la segue nell'ordine. `Resto di Italia` ed `Estero` sono ordinate per data come le altre.
- Le righe "non trovata" e "ambigua" vanno in coda a `Da verificare`.

Non si aggiunge una colonna con data strutturata: l'ordinamento si ricava dal testo. È una scelta deliberata per non cambiare il formato del foglio; il costo è un parser di date italiane con una grammatica limitata (vedi tech-choices).

## Non distruttività

L'unica operazione di scrittura è "inserisci riga in posizione N e valorizzala", in una sola richiesta atomica (vedi tech-choices): un crash non lascia righe vuote. Mai update di righe esistenti, mai delete, mai sort. I sottocomandi `sort` e `update` sono futuri e opt-in.

## Modalità dry run

Stessa pipeline, con il writer sostituito da uno che stampa il piano: sezione, riga di destinazione, contenuto. Utile anche senza credenziali Google, purché si abbia una copia locale del foglio (CSV esportato, `--sheet-csv`) da usare come sorgente in lettura. Il dry run invoca comunque l'agente; per il solo elenco dei mancanti c'è il sottocomando `missing`.
