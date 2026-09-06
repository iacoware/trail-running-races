# Goal

Mantenere a mano un elenco piatto di nomi di gare di Trail / Sky Running in un file di testo e far sì che uno script riempia un Google Sheet con le sole gare mancanti, cercando le informazioni tramite un agente.

## Perché

Dato un periodo dell'anno, voglio sapere quali gare sono fattibili e vicine a quel periodo. Il dato primario è quindi la **data indicativa** della gara; a seguire luogo, distanza da Firenze, tipo e distanze proposte.

## Cosa fa lo script

1. Legge l'elenco dei nomi dal file.
2. Legge il foglio e individua le gare già presenti (match esatto sul nome, case insensitive).
3. Per ogni gara mancante invoca un agente che cerca sul web e restituisce una scheda strutturata.
4. Inserisce una riga nella sezione della regione giusta, in ordine di data, senza toccare le righe esistenti.

## Vincoli

- **Idempotente**: lanciato due volte di seguito, la seconda volta non fa nulla. Vale anche dopo un crash a metà run.
- **Non distruttivo**: non modifica, non riordina, non cancella righe esistenti. Rimuovere un nome dal file non rimuove la riga dal foglio.
- **Una riga per gara**, non per edizione. La data è quella indicativa dell'edizione più recente trovata; l'anno non compare.
- **Agente intercambiabile**: Claude Code o Codex invocati headless; il prompt è un file, l'output è JSON.
- **Nessuna colonna aggiuntiva** nel foglio: lo script lavora sulle colonne che esistono già.
- **Dry run** sempre disponibile: mostra cosa inserirebbe senza toccare il foglio né richiedere credenziali Google.

## Formato del foglio

| Colonna | Contenuto |
|---|---|
| Nome | nome gara, come link al sito ufficiale |
| Data (+ o -) | testo indicativo, es. `18-21 marzo`, `2 maggio` |
| Luogo | comune o comuni |
| Da FI | tempo in auto da Firenze, stimato, es. `~2h` |
| Tipo | `Trail`, `Sky`, … |
| Distanze | una riga per percorso: `17.5km 750m+`, con suffisso `, camminata` se non competitiva. Esclusi i percorsi per bambini e le non competitive sotto i 5km |

Le gare sono raggruppate in **sezioni per regione**: una riga con il solo nome della regione (in grassetto, ma lo script la riconosce dalla struttura), seguita dalle gare ordinate per data, seguita da una riga vuota. Le sezioni regionali le crei tu a mano: lo script non ne aggiunge. Sezioni speciali create su richiesta in fondo al foglio, in quest'ordine: `Resto di Italia` (regione italiana senza sezione propria), `Estero` e `Da verificare` (gara non trovata o ambigua).

## Esiti possibili per gara

- **Trovata**: riga completa nella sezione della regione, in ordine di data.
- **Non trovata**: riga con solo nome e messaggio `non ho trovato niente` nella colonna Data, in fondo alla sezione `Da verificare`.
- **Ambigua**: riga con solo nome e messaggio `più di un evento con questo nome` nella colonna Data, in fondo alla sezione `Da verificare`. L'agente usa la freschezza del sito come criterio per scegliere prima di dichiarare ambiguità.
- **Errore agente** (timeout, JSON non valido): nessuna riga, errore riportato a fine run; verrà ritentata al run successivo.

Le righe "non trovata" e "ambigua" contano come presenti: al run successivo vengono skippate finché non le cancelli a mano.

## Sottocomandi

- `fill`: il comportamento descritto sopra. Flag `--dry-run`, `--only <nome>`, `--sheet-csv <path>`.
- `missing`: stampa i nomi mancanti senza invocare l'agente.

## Fuori scope, per ora

- Sottocomandi futuri: `sort` (riordina per data) e `update` (sovrascrive informazioni esistenti).

