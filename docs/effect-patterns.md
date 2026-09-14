# Pattern Effect

Catalogo dei pattern idiomatici di Effect. Serve da base per due cose: regole oxlint custom e una skill agente sottile, specifica del progetto. Ogni pattern ha una regola, un esempio sbagliato e uno giusto in sintassi Effect 4, i riferimenti ad archivio, lo stato in questo repo e la classe di enforcement.

## Fonti e metodo

- **archivio** (`promemoria/archivio`, commit `afa6ebd2b`, sola lettura): monorepo Next.js con Effect `3.19.15` e `@effect/platform` `0.94`, 218 file che importano `effect`. Letti `CLAUDE.md` e `docs/`: le uniche convenzioni Effect dichiarate sono "le API ritornano Effect grezzi, `runEffect` solo al bordo", `Effect.all` per i caricamenti paralleli e il port & adapter per i repository. Nessuna regola lint Effect, nessun `@effect/language-service`.
- **Questo repo**: Effect `4.0.0-rc.112`. Ogni nome di API v4 citato è verificato su `node_modules/effect/dist/*.d.ts`; i nomi v3 su `node_modules/.pnpm/effect@3.19.15` di archivio.
- **Documentazione ufficiale**: `effect.website/llms.txt` oggi risponde 404 e il sito è passato alla v4. Come riferimento per gli idiomi valgono quindi `node_modules/effect/AGENTS.md` e `node_modules/effect/ai-docs/src/**`, distribuiti con il pacchetto v4 installato, più il JSDoc dei `.d.ts`.
- **inloco** (`doubleloop/inloco`, Effect `3.22.1`, sola lettura): fonte dei pattern P24-P27 sullo stile delle funzioni effettful e dei boundary HTTP. I riferimenti sono ai commit `60e3f77` (stile misto di partenza), `fe5bcf9` (`refactor: make event creation fully effectful`), `4d0a8fb` (la sezione "Application Boundary Style" della sua skill) e `c3c5ab1` (`fix: close the error channel at the web boundary`).
- **anti-slop** (`dmmulroy/anti-slop`, commit `c44ef22`): sorgenti e test delle cinque regole Effect.
- **Language service**: `Effect-TS/language-service` (commit `5e4d380`) e `Effect-TS/tsgo` (commit `223f9fa`), più i metadati npm e la pagina ufficiale `effect.website/docs/v4/getting-started/devtools`.

Natura di ogni pattern:

- **idioma**: sostenuto dalla documentazione o dal sorgente di Effect;
- **locale**: convenzione di questo progetto o di archivio;
- **misto**: API idiomatica, ma il divieto che la accompagna è una scelta locale.

Classi di enforcement:

- `lint-sintattico`: plugin JS di oxlint, senza informazioni di tipo;
- `lint-tipi`: serve il type checker (tsc, typescript-eslint type-aware, `@effect/tsgo`);
- `solo-skill`: regola semantica o architetturale, non verificabile meccanicamente.

## Riepilogo

| ID | Pattern | Natura | Enforcement | v4 | Questo repo |
|---|---|---|---|---|---|
| P01 | Port come `Context.Service` solo shape | misto | lint-sintattico | `Context.Service`; `Context.Tag`/`Effect.Service` non esistono | conforme |
| P02 | Adapter in Layer separati, port senza dettagli d'adapter | misto | solo-skill | invariato | conforme |
| P03 | Capability via `yield*`, mai parametri o singleton | idioma | solo-skill | invariato | conforme |
| P04 | Esecuzione solo all'entry point | idioma | lint-sintattico | `NodeRuntime.runMain`, `ManagedRuntime.make` | conforme |
| P05 | Errori attesi tagged, mai `Error` nudo | idioma | lint-sintattico | invariato | conforme |
| P06 | Entrambe ammesse: `Schema.TaggedError` se l'errore esce dal processo, altrimenti `Data.TaggedError` | locale | solo-skill | entrambi presenti | ammesso, non preferito |
| P07 | Fallire con `return yield* new Err()` | idioma | lint-sintattico | invariato | conforme |
| P08 | `tryPromise`/`try` in forma oggetto | idioma | lint-sintattico | la forma thunk dà `Cause.UnknownError` | conforme |
| P09 | Catch mirati, niente catch-all che discrimina o ingoia | idioma | lint-sintattico | `catchAll` → `catch` | conforme |
| P10 | Schema al confine, niente `as` né `JSON.parse` | idioma | lint-sintattico | `decodeUnknownEffect`/`Result`/`Option` | 1 deviazione |
| P11 | Niente `decode*Sync` dentro codice Effect | idioma | lint-sintattico | invariato | conforme |
| P12 | HttpClient configurato in Layer | idioma | solo-skill | `effect/unstable/http` | n/a |
| P13 | Config via `Config`, segreti `Config.redacted` | idioma | lint-sintattico | invariato | devia |
| P14 | Match esaustivo: `$match` di default, `Match` per le eccezioni | misto | lint-sintattico | `Match.valueTags`, `Match.tagsExhaustive` | devia |
| P15 | Unioni come `Data.taggedEnum`, mai letterali `_tag` (preferito) | misto | lint-sintattico | `Data.taggedEnum` | devia |
| P16 | Option/Result/Exit via modulo, mai `_tag` | idioma | lint-sintattico | `Either` → `Result` | conforme |
| P17 | `Effect.fn("nome")` per funzioni effettful | idioma | lint-sintattico | invariato | devia |
| P18 | Niente effetti flottanti né `yield` senza `*` | idioma | lint-tipi | invariato | conforme (verificato con `oxlint`) |
| P19 | Risorse con `acquireRelease`, `Effect.scoped` solo se serve | idioma | lint-tipi | `Layer.scoped` rimosso | conforme |
| P20 | Concorrenza esplicita | idioma | solo-skill | invariato | conforme |
| P21 | Log e output via Effect, niente `console` dentro gli effetti | idioma | lint-sintattico | invariato | conforme (`Console`; una deroga motivata) |
| P22 | Test con `@effect/vitest` e fake come Layer | idioma | lint-sintattico | `layer(...)`, `it.effect` | conforme |
| P23 | Guard runtime con `Predicate` | idioma | lint-sintattico | invariato | conforme |
| P24 | Uno stile solo per funzione: o Effect o async/await | locale | lint-sintattico | invariato | conforme |
| P25 | Successo nel generatore, errori nel secondo argomento di `Effect.fn` | locale | lint-sintattico | invariato | devia |
| P26 | Niente tipi di trasporto nel generatore | locale | lint-sintattico | invariato | n/a |
| P27 | Entry point con canale errori chiuso a `never` | misto | lint-sintattico | invariato | devia |

Totale: 20 `lint-sintattico`, 2 `lint-tipi`, 5 `solo-skill`.

## Pattern interamente meccanizzati

Questi tre non hanno più una sezione discorsiva: `pnpm lint` li segnala da sé, nel punto e nel momento giusto, e la prosa non aggiungeva nulla che il messaggio della regola non dica meglio. Resta qui solo ciò che il linter non può dire.

| P | Regola | Regole `effecttsgo` | Cosa resta da sapere |
|---|---|---|---|
| P07 | Fallire con `return yield* new Err()`, non `yield* Effect.fail(new Err())` | `unnecessary-fail-yieldable-error` (error), `missing-return-yield-star` (error) | Il `return` serve a TypeScript per capire che il flusso si interrompe (`node_modules/effect/AGENTS.md`: "Always return when raising an error") |
| P11 | Niente `decode*Sync` dentro codice Effect | `schema-sync`, `schema-sync-in-effect` (error) | Le varianti `*Sync` lanciano, quindi l'errore di decodifica diventa un difetto invece di arrivare nel canale errori. Fuori dagli effetti va `decodeUnknownResult` (`src/agent/parseAgentOutput.ts`) |
| P18 | Niente effetti flottanti né `yield` senza `*` | `floating-effect`, `floating-effect-in-vitest`, `missing-star-in-yield-effect-gen`, `missing-return-yield-star` (error) | Un Effect che nessuno esegue è un no-op silenzioso, tipicamente un log che non esce. Non verificabile senza type checker, quindi prima del passo 1 questa voce era l'unica del catalogo marcata "non verificato" |

Il criterio per stare qui è stretto: copertura verificata con una prova negativa, e nessuna decisione residua. P21 resta una sezione a sé pur essendo coperto, perché il messaggio della regola consiglia `Effect.log`, che per l'output di una CLI è sbagliato: quale sostituto usare è una decisione che il linter non prende.

## Servizi e Layer

### P01 · Port come `Context.Service` solo shape

**Regola**: un port è `class X extends Context.Service<X, Shape>()("pkg/path/X") {}`, senza opzione `make`, senza `static layer`; niente `Effect.Service`.

**Perché**: `make` e il layer statico legano il port a un'implementazione di default; il port deve restare un contratto. È convenzione locale: `node_modules/effect/AGENTS.md` mostra proprio `static readonly layer` sul servizio.

```ts
// no (v3: Effect.Service<Agent>()("Agent", { effect: ... }))
class Agent extends Context.Service<Agent, Shape>()("app/Agent", { make: makeAgent }) {}

// sì
export class Agent extends Context.Service<
  Agent,
  { readonly search: (name: string) => Effect.Effect<RaceCard, AgentError> }
>()("trail-running-races/agent/Agent") {}
```

- **archivio**: `Context.Tag` con shape tipo nel dominio (`packages/archivio-data/src/infra/runtime-deps.ts:17`, shape in `packages/archivio-data/src/domain/collections/archivio-collections-repository.ts:45`), zero `Effect.Service`. Il tag però sta in `infra/` accanto al layer Live, quindi il dominio importa da infra.
- **Questo repo**: conforme (`src/agent/Agent.ts:5`, `src/sheet/SheetReader.ts:6`, `src/sheet/SheetWriter.ts:5`, `src/races/RaceList.ts:4`).
- **Enforcement**: `lint-sintattico`. Si segnala una `ClassDeclaration` il cui `superClass` è `Context.Service<…>()(id, opts)` con un secondo argomento, o che ha un membro `static` di nome `layer`/`Default`. Si segnala anche `Effect.Service`/`Context.Tag`/`Context.GenericTag`; in v4 li rifiuta già tsc, la regola serve al codice v3. Nessuna regola anti-slop lo copre.

### P02 · Adapter in Layer separati, port senza dettagli d'adapter

**Regola**: ogni implementazione è un `Layer` in un file suo (`google/`, `csv/`, `print/`). Il port non espone tipi della libreria né requisiti infrastrutturali nel canale `R`: le dipendenze si risolvono alla costruzione del layer.

**Perché**: l'adapter si sostituisce senza toccare i consumer, e i metodi del servizio restano con `R = never`. Il divieto di requisiti nel port corrisponde alla diagnostica `leakingRequirements` del language service; i file separati sono una convenzione locale.

```ts
// no: il port trascina HttpClient nei consumer
readonly get: (url: string) => Effect.Effect<Todo, ApiError, HttpClient.HttpClient>

// sì: la dipendenza entra nella costruzione del layer
export const layer = Layer.effect(Agent, Effect.gen(function* () {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
  return Agent.of({ search: (name) => run(spawner, name) })
}))
```

- **archivio**: il port HTTP espone `EffectHttpClient` in `R` (`packages/http/src/domain/http-client.ts:59`). Il file del port repository contiene helper di presentazione (i18n, `console.error`) (`packages/archivio-data/src/domain/collections/archivio-collections-repository.ts:10-31`). Gli adapter in-memory come Layer sono invece un buon esempio (`packages/archivio-data/src/infra/runtime-deps.ts:27`).
- **Questo repo**: conforme. I port importano solo tipi; gli adapter sono in `src/agent/process/ProcessAgent.ts:39`, `src/sheet/google/GoogleSheet.ts:29` (`Layer.effectContext` per due servizi), `src/sheet/csv/CsvSheetReader.ts:7` e `src/sheet/print/PrintSheetWriter.ts:34`.
- **Enforcement**: `solo-skill`. C'è un aiuto parziale da `lint-tipi` (`leakingRequirements`, severità suggestion) e da `no-restricted-imports` sui file port (vietare `@googleapis/*` e `effect/unstable/*`).

### P03 · Capability via `yield*`, mai parametri o singleton

**Regola**: un servizio si ottiene con `const x = yield* Service` dentro l'effetto. Niente parametri di funzione con tipo servizio, niente client in variabili di modulo.

**Perché**: il requisito compare nel tipo e il test lo sostituisce con un Layer; un parametro o un singleton lo nasconde. I valori di dominio e gli input dell'operazione restano parametri espliciti.

```ts
// no
const loadConfig = () => Effect.gen(function* () { const http = httpClient() /* singleton */ })

// sì
const insert = Effect.gen(function* () { const writer = yield* SheetWriter })
```

- **archivio**: client da singleton `lazyCache` dentro l'effetto (`apps/caveau/src/features/config/api-config.ts:56`) e config letta da `process.env` via `appConfigServer()` (`:54`). Il client passato come parametro e rifornito con `provideService` (`packages/pimcore-data/src/infra/users/http-adapter.ts:22`) avviene invece alla costruzione dell'adapter: è accettabile.
- **Questo repo**: conforme (`src/commands/fill.ts:55,75`, `src/agent/process/ProcessAgent.ts:44`).
- **Enforcement**: `solo-skill`. Riconoscere un "parametro di tipo servizio" richiede i tipi e resta comunque euristico.

### P04 · Esecuzione solo all'entry point

**Regola**: un solo `NodeRuntime.runMain` (o `ManagedRuntime.make` quando si integra un framework) nell'entry point, dove si compongono anche i Layer. Niente `Effect.runPromise`/`runSync` altrove, test compresi.

**Perché**: logger, layer e gestione dei difetti si configurano in un solo punto (`AGENTS.md`, sezioni "Running Effect programs" e "Integrating Effect").

```ts
// no
export const check = () => Effect.runPromise(pingDb(url))

// sì
NodeRuntime.runMain(run(process.argv.slice(2)).pipe(Effect.provide(NodeServices.layer)))
```

- **archivio**: `ManagedRuntime` + `runEffect` al bordo Next.js (`apps/caveau/src/common/runtime-server.ts:99,130`). Fanno eccezione `Effect.runPromise` ad hoc che salta runtime e `Logger.json` (`apps/caveau/src/app/public/health/route.ts:12`) e `runPromise` nei test (`apps/config-editor/src/features/auth/session.test.ts:12`).
- **Questo repo**: conforme (`src/main.ts:76`).
- **Enforcement**: `lint-sintattico`. Si segnala una `CallExpression` `Effect.run*`, `NodeRuntime.runMain` o `ManagedRuntime.make` fuori da una allowlist di file (`src/main.ts`).

## Errori

### P05 · Errori attesi tagged, mai `Error` nudo

**Regola**: ogni fallimento atteso è una classe `Schema.TaggedError` o `Data.TaggedError`. Mai `Effect.fail(new Error(…))` né `Effect.fail("stringa")`, mai `class X extends Error` con `_tag` manuale, mai `throw` dentro un generatore Effect.

**Perché**: il canale errori tipizzato funziona solo con tag discriminanti. Un `throw` nel generatore diventa un difetto.

```ts
// no
class TabNotFound extends Error { readonly _tag = "TabNotFound" }
Effect.fail(new Error("tab non trovato"))

// sì
export class SheetTabNotFoundError extends Schema.TaggedError<SheetTabNotFoundError>()(
  "SheetTabNotFoundError",
  { spreadsheetId: Schema.String, message: Schema.String },
) {}
```

- **archivio**: `Schema.TaggedError` in 23 file (es. `packages/archivio-data/src/errors.ts:3`), nessun `extends Error` con `_tag`. Fa eccezione il `throw new Error("not_authenticated")` usato come controllo di flusso dentro `tryPromise` (`apps/caveau/src/features/auth/session.ts:38`).
- **Questo repo**: conforme (`src/agent/errors.ts:3`, `src/sheet/errors.ts:3`).
- **Enforcement**: `lint-sintattico`. Si segnalano:
  - `Effect.fail(arg)` con `arg` uguale a `NewExpression` di `Error`/`TypeError`/`RangeError`, a un `Literal` o a un `TemplateLiteral`;
  - una `ClassDeclaration` che estende `Error` con una `PropertyDefinition` `_tag`;
  - un `ThrowStatement` dentro una funzione generatore passata a `Effect.gen`/`Effect.fn`.

  Coperti dal preset: `global-error-in-effect-failure` e `global-error-in-effect-catch` (alzate a error), `extends-native-error`. **Verificato scoperto**: un `throw` dentro un generatore e `Effect.fail("stringa")` non danno alcuna diagnostica, mentre `Effect.fail(new TypeError(…))` sì. Sono i due casi che giustificano ancora una regola locale. La regola anti-slop `no-manual-tagged-construction` non vede i campi di classe.

### P06 · `Data.TaggedError` o `Schema.TaggedError` secondo il confine

**Regola**: vanno bene entrambe. `Schema.TaggedError` quando l'errore va codificato per uscire dal processo, tipicamente su HTTP, RPC o file; `Data.TaggedError` negli altri casi, e a maggior ragione dove Schema non si usa affatto. Non è un divieto: in un modulo che già usa Schema, uniformarsi a `Schema.TaggedError` è accettabile.

**Perché**: lo Schema serve solo se l'errore va codificato, quindi altrove è peso inutile. Le due fonti ufficiali si contraddicono, quindi l'euristica resta una scelta locale:

- la documentazione sul sito, `effect.website/docs/v4/error-management/expected-errors`, usa `Data.TaggedError` e non nomina mai `Schema.TaggedError`;
- le docs per agenti distribuite dentro il pacchetto, `node_modules/effect/AGENTS.md` e `ai-docs/src/01_effect/04_errors/`, usano solo `Schema.TaggedError`; in `ai-docs` `Data.TaggedError` non compare mai.

La sintassi di dichiarazione resta diversa: `Data.TaggedError` prende i campi come tipi, `Schema.TaggedError` come schemi, e vuole il tipo `Self`. Identici sono invece l'uso e il costruttore: `new Err({ ... })`, yieldable dentro `Effect.gen`, catturabili con `catchTag`.

```ts
// in-process
export class UnparsableDateError extends Data.TaggedError("UnparsableDateError")<{
  readonly race: string
  readonly date: string
}> {}

// oltre il confine di processo
export class UnparsableDateError extends Schema.TaggedError<UnparsableDateError>()(
  "UnparsableDateError",
  { race: Schema.String, date: Schema.String },
) {}
```

- **archivio**: coerente con la regola. `Schema.TaggedError` con `serialize()` per gli errori restituiti dalle server action (`packages/archivio-data/src/errors.ts:3-9`); `Data.TaggedError` per quelli locali (`apps/caveau/src/app/public/health/route.ts:51`). Il campo `cause` passa però da un `JSON.parse` dentro `ParseResult.succeed`, che lancia su input non valido (`packages/shared/src/effect.ts:41`).
- **Questo repo**: ammesso ma non preferito. Tutti gli errori sono `Schema.TaggedError` e nessuno esce dal processo (`src/plan/errors.ts:3`, `src/agent/errors.ts:3`, `src/sheet/errors.ts`). Migrarli a `Data.TaggedError` è facoltativo; `Schema.Defect()` sul campo `cause` diventerebbe un tipo normale.
- **Enforcement**: `solo-skill`. Dove passa il confine di processo non si deduce dalla sintassi, e comunque entrambe le forme sono ammesse.

### P08 · `tryPromise`/`try` in forma oggetto

**Regola**: `Effect.tryPromise({ try, catch })` ed `Effect.try({ try, catch })`, con `catch` che produce un errore tagged dell'adapter. `Effect.promise` solo per promise che non possono rigettare, per esempio il rilascio di una risorsa.

**Perché**: la forma thunk tipizza l'errore come `Cause.UnknownError` (JSDoc di `Effect.tryPromise` in v4; in v3 `UnknownException`). `Effect.promise` trasforma un rigetto in difetto.

```ts
// no
Effect.tryPromise(() => api.spreadsheets.get({ spreadsheetId }))
Effect.promise(() => client.connect())

// sì
Effect.tryPromise({ try: () => api.spreadsheets.get({ spreadsheetId }), catch: toSheetError(spreadsheetId) })
```

- **archivio**:
  - forma thunk seguita da `catchAll` (`packages/http/src/infra/fetch-http-client.ts:30`, `apps/caveau/src/features/auth/session.ts:32-39`, `apps/caveau/src/features/auth/action-login.ts:47`);
  - `Effect.promise` sulla connessione Mongo (`packages/shared/src/mongodb.ts:17`);
  - forma oggetto corretta in `packages/config-editor-data/src/infra/assets/assets.ts:37`.
- **Questo repo**: conforme (`src/sheet/google/GoogleSheet.ts:42`).
- **Enforcement**: `lint-sintattico`. Si segnala `Effect.tryPromise`/`Effect.try` il cui primo argomento non è un `ObjectExpression`. `Effect.promise` va segnalato con un warning, tranne quando è il secondo argomento di `acquireRelease`.

### P09 · Catch mirati, niente catch-all che discrimina o ingoia

**Regola**:
- per il recupero o la traduzione di errori specifici si usano `catchTag`, `catchTag([...])`, `catchTags` o `mapError`;
- `Effect.catch` (v3 `catchAll`) serve solo al bordo o per convertire tutto in un valore di output;
- mai confronti su `_tag` dentro un catch-all;
- mai `catch(() => fallback)` quando `orElseSucceed` esprime l'intento.

**Perché**: un catch-all che discrimina a mano non si accorge dei nuovi errori; uno che ignora il parametro ingoia anche quelli aggiunti dopo.

```ts
// no
Effect.catch((e) => (e._tag === "AgentTimeout" ? Effect.succeed(skip) : Effect.fail(e)))

// sì
Effect.catchTag("AgentTimeout", () => Effect.succeed(skip))
Effect.catchTag(["ParseError", "ReservedPortError"], () => Effect.succeed(3000))
```

- **archivio**:
  - catch-all che ingoia (`apps/caveau/src/features/config/api-config.ts:46`);
  - `handleErrors`: un dispatcher per `_tag` fatto a mano sopra `catchAll`, con `e as never` (`packages/shared/src/effect.ts:29,37`). È esaustivo per tipo, ma reinventa `catchTags`;
  - quattro `catchTag` che mappano sullo stesso errore, dove bastava un `mapError` (`packages/pimcore-data/src/infra/users/http-adapter.ts:23-34`).
- **Questo repo**: conforme. `Effect.catch` compare solo al bordo (`src/main.ts:81`) e per convertire in `RaceOutcome` (`src/commands/fill.ts:90`).
- **Enforcement**: `lint-sintattico`. Il preset copre le trasformazioni (`catch-all-to-map-error` e `catch-unfailable-effect`, alzate a error, più `catch-all-tag-dispatch-to-catch-tag`, `catch-to-ignore`, `multiple-catch-tag`). **Verificato scoperto**: il catch-all senza parametro che ingoia, e la discriminazione manuale su `_tag` dentro `Effect.catch` — quest'ultima è il bersaglio di `no-manual-effect-error-tag` di anti-slop (passo 2), il primo richiede una regola locale con allowlist per l'entry point.

## Confini e Schema

### P10 · Schema al confine, niente `as` né `JSON.parse`

**Regola**: i dati non fidati (output dell'agente, risposte API, env, file, form) si decodificano con Schema, poi si trasformano da modello di trasporto a modello di dominio. Niente asserzioni `as T`, `JSON.parse` nudo o predicati scritti a mano.

**Perché**: `AGENTS.md`: "AVOID using predicates or manual parsing, instead use Schema".

```ts
// no
const role = formData.get("role") as KnownRole
return Option.some(JSON.parse(text))

// sì
const decodeKey = Schema.decodeUnknownEffect(Schema.fromJsonString(ServiceAccountKey))
const parseObject = Schema.decodeUnknownOption(Schema.fromJsonString(Schema.Unknown))
```

- **archivio**:
  - positivo: schema del documento Mongo più `toCollection` (`packages/archivio-data/src/infra/collections/mongo-collections.ts:12-40`);
  - asserzioni dopo la decodifica (`packages/http/src/infra/fetch-http-client.ts:56`) e sui form (`apps/caveau/src/features/search/action-saved-searches.ts:83`, `apps/caveau/src/features/users/api-user.ts:16`).
- **Questo repo**:
  - conforme su `src/agent/parseAgentOutput.ts:6`, `src/sheet/google/GoogleSheet.ts:45` e `src/sheet/google/serviceAccountKey.ts:12`; nessun `as` oltre `as const`;
  - devia su `src/agent/extractJson.ts:5`, con `JSON.parse` in try/catch. Le API `Schema.decodeUnknownOption` e `Schema.fromJsonString` esistono in v4, ma la combinazione con `Schema.Unknown` non è stata eseguita.
- **Enforcement**: `lint-sintattico`. Si segnala `JSON.parse`, e `TSAsExpression` diversa da `as const`; per le asserzioni anti-slop ha `require-safety-comment-for-type-assertion` e `no-chained-type-assertions`. In `lint-tipi`: `preferSchemaOverJson` e `unsafeEffectTypeAssertion` (entrambe off di default).

### P12 · HttpClient configurato in Layer

**Regola**: si prende `HttpClient.HttpClient` dal contesto, dentro il Layer dell'adapter, e lo si configura una volta:
- base URL con `HttpClient.mapRequest(HttpClientRequest.prependUrl(baseUrl))`;
- `HttpClient.filterStatusOk` se tutti i non-2xx hanno lo stesso significato, altrimenti `HttpClientResponse.matchStatus`;
- body decodificato con `HttpClientResponse.schemaBodyJson`.

**Perché**: status, retry e decodifica stanno in un punto solo. È l'esempio ufficiale `ai-docs/src/50_http-client/10_basics.ts`.

```ts
// no
if (response.status >= 300) return yield* new ResponseError({ … })

// sì
const client = (yield* HttpClient.HttpClient).pipe(
  HttpClient.mapRequest(HttpClientRequest.prependUrl(baseUrl)),
  HttpClient.filterStatusOk,
)
const todo = yield* client.get(`/todos/${id}`).pipe(
  Effect.flatMap(HttpClientResponse.schemaBodyJson(Todo)),
  Effect.mapError((cause) => new ApiError({ cause })),
)
```

- **archivio**: wrapper stile axios con join manuale dell'URL (`packages/http/src/infra/fetch-http-client.ts:36`), controllo dello status a mano (`:47`) e `filterStatusOk` commentato (`:117`). La mappatura degli errori con `Match.type` e `Match.exhaustive` (`:129-151`) è invece un buon esempio.
- **Questo repo**: n/a; Google Sheets passa da `@googleapis/sheets`.
- **v4**: moduli in `effect/unstable/http`, non più `@effect/platform`. Esiste anche `HttpClient.retryTransient`.
- **Enforcement**: `solo-skill`. Una regola euristica potrebbe segnalare `.status >=`/`<` nei file che importano `HttpClient`.

### P13 · Config via `Config`, segreti `Config.redacted`

**Regola**: le variabili d'ambiente si leggono solo con il modulo `Config`, in un solo file; i segreti vanno in `Config.redacted` (o `Config.schema(Schema.Redacted(…), name)`), e `Redacted.value` si chiama solo nel punto in cui si passa il segreto alla libreria.

**Perché**: gli errori di config sono tipizzati e il segreto non finisce in log e `toString`. Il JSDoc v4 dice che `Config.redacted` è una scorciatoia per `Config.schema(Schema.Redacted(Schema.String), name)`.

```ts
// no
serviceAccount: Config.schema(NonBlank, "GOOGLE_SERVICE_ACCOUNT_JSON")

// sì
serviceAccount: Config.schema(Schema.Redacted(NonBlank), "GOOGLE_SERVICE_ACCOUNT_JSON")
```

- **archivio**: nessun uso del modulo `Config`. Helper su `process.env` con segreti in chiaro (`apps/caveau/src/features/config/app-config-server.ts:19,23`) e `process.env` letto dentro gli helper Effect (`packages/shared/src/with-span.ts:16`).
- **Questo repo**: `Config` usato bene (`src/config.ts:12`). Però `GOOGLE_SERVICE_ACCOUNT_JSON`, che nella forma inline contiene `private_key`, non è redatto (`src/config.ts:15-17`).
- **Enforcement**: `lint-sintattico`. Si segnala `process.env` fuori da `src/config.ts`. Con un warning euristico si segnalano `Config.string`/`Config.schema` il cui nome letterale matcha `/(KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL|_JSON)$/` senza `Redacted`/`redacted`. In `lint-tipi`, la famiglia `processEnv*` è off di default.

## Matching e tipi dati

### P14 · Match esaustivo sulle unioni tagged

**Regola**: il matching sulle unioni tagged è sempre esaustivo. Sulle unioni definite qui la prima scelta è `$match` di `Data.taggedEnum` (P15). `Match` copre le eccezioni, cioè i casi che `taggedEnum` non serve: unioni che arrivano da Schema o dall'esterno, discriminanti diversi da `_tag` (`Match.discriminator`), condizioni sui campi (`Match.when`), risultati parziali (`Match.option`). Le forme sono `Match.valueTags`, `Match.value`/`Match.type` con `Match.tag` e `Match.exhaustive`, e `Match.tagsExhaustive`. Per filtrare si usa `Predicate.isTagged`. Niente ternari, `if` o `switch` su `_tag`.

**Perché**: `_tag` è un discriminante pubblico, leggerlo non è sbagliato. Il problema è che un ternario o un `if` ricadono in silenzio sul ramo "altro" quando si aggiunge una variante. Anche uno `switch` con case che ritornano `void` non fallisce il type check.

```ts
// no (src/sheet/print/PrintSheetWriter.ts:20)
planned.sectionAction._tag === "UseExistingSection" ? [] : [describe(planned.sectionAction)]

// sì
Match.valueTags(planned.sectionAction, {
  UseExistingSection: () => [],
  CreateSection: (action) => [describe(action)],
})
outcomes.some(Predicate.isTagged("Failed"))
```

- **archivio**:
  - `Match.value` + `Match.when({ _tag })` + `Match.exhaustive` in 25 file (`apps/caveau/src/features/collections/use-collections.ts:67`); con `Match.tag` o `Match.valueTags` sarebbe più corto;
  - `_tag ===` in OR (`apps/caveau/src/features/users/user-edit-form.tsx:71-72`).
- **Questo repo**:
  - conforme su `src/sheet/google/serviceAccountKey.ts:30,37`;
  - devia su `src/plan/planRow.ts:44,53`, `src/sheet/print/PrintSheetWriter.ts:20` e `src/sheet/google/insertRowRequests.ts:62,97`;
  - filtri per `_tag` in `src/commands/summary.ts:7,47`;
  - `switch` senza guardia di esaustività in `src/sheet/parseSheet.ts:59` (se resta `switch`: `default: return absurd(cursor)`, con `absurd` da `effect/Function`).
- **Enforcement**: `lint-sintattico`. `no-manual-tag-comparison` di anti-slop è attiva (a `error`, rumore zero) senza modifiche: segnala anche gli `switch` completi su `_tag`, ed è voluto, perché la via preferita è `$match` o `Match`. `prefer-effect-match` copre le catene di ternari.

### P15 · Varianti costruite con costruttori, non letterali `_tag`

**Regola**: le varianti delle unioni tagged si costruiscono con `Data.taggedEnum<Union>()`, `Schema.TaggedStruct`/`TaggedClass` o classi errore, non con letterali `{ _tag: "X", … }`.

**Perché**: il costruttore fissa il tag in un solo punto e porta con sé `$is` e `$match` esaustivo. Più type-safety senza doverla scrivere a mano, quindi è l'approccio preferito per le unioni tagged definite qui. Il divieto dei letterali è una scelta di anti-slop; l'API è idiomatica.

```ts
// no
return { _tag: "ExistingSection", section, action: { _tag: "UseExistingSection" } }

// sì
const SectionTarget = Data.taggedEnum<SectionTarget>()
return SectionTarget.MissingSpecialSection({ name, action })
```

- **archivio**: letterali `_tag` solo come pattern di `Match.when`, che la regola anti-slop esenta.
- **Questo repo**: letterali in `src/config.ts:10`, `src/commands/fill.ts:65,77,81,84,90`, `src/plan/targetSection.ts:51-79`, `src/sheet/parseSheet.ts:49-68`, e nelle fixture di test (`src/plan/planRow.test.ts:108`, `src/config.test.ts:50`).
- **Enforcement**: `lint-sintattico`. `no-manual-tagged-construction` di anti-slop è attiva a `error`, senza modifiche, spenta su `**/*.test.ts` e `src/testing/**`, dove il letterale resta comodo e innocuo. Le sei unioni sono migrate: `src/` è a zero violazioni. Da fare: portare a `Data.taggedEnum` le sei unioni `ServiceAccountSource`, `RaceOutcome`, `SectionTarget`, `SectionAction`, `Cursor` e `SheetWarning`.

### P16 · Option/Result/Exit via modulo, mai `_tag`

**Regola**: sui tipi dati di Effect si usano predicati e matcher del modulo (`Option.match`, `Option.isNone`, `Result.isFailure`, `Result.match`, `Exit.match`), mai `x._tag === "Some"`. I nullable si convertono al confine con `Option.fromNullishOr` (v3 `Option.fromNullable`).

**Perché**: il `_tag` di questi tipi è un dettaglio interno. I matcher obbligano a gestire entrambi i rami.

```ts
// no
if (card._tag === "Failure") return failed(card.failure)

// sì
if (Result.isFailure(card)) return failed(card.failure)
Option.match(sheetCsv, { onNone: () => GoogleSheet.layer, onSome: CsvSheetReader.layer })
```

- **archivio**: conforme (`packages/archivio-data/src/infra/collections/mongo-collections.ts:55` con `O.isNone`, `packages/shared/src/action-result.ts:24` con `Either.match`).
- **Questo repo**: conforme (`src/main.ts:41`, `src/commands/fill.ts:77`, `src/sheet/google/GoogleSheet.ts:67`).
- **v4**: `Either` non esiste più. Le corrispondenze sono `Effect.either` → `Effect.result`, `Either.match` → `Result.match` (`onFailure`/`onSuccess`), `Schema.decodeUnknownEither` → `decodeUnknownResult`.
- **Enforcement**: `lint-sintattico`. `no-manual-tag-comparison` copre già i letterali `Some`/`None`/`Success`/`Failure`/`Left`/`Right`; l'accesso a `.value` senza narrowing lo blocca già tsc.

## Stile degli effetti

### P17 · `Effect.fn("nome")` per funzioni effettful

**Regola**: una funzione che ritorna un Effect si scrive `Effect.fn("nome")(function* (…) {…}, …combinatori)`, non `(…) => Effect.gen(…)`. I combinatori extra vanno passati come argomenti, non con `.pipe`.

**Perché**: stack trace e span con il nome, senza wrapper. `AGENTS.md`: "Avoid creating functions that return an Effect.gen" e "Do not use .pipe with Effect.fn".

```ts
// no
const outcomeFor = (name: string) => Effect.gen(function* () { … }).pipe(Effect.catch(toFailed))

// sì
const outcomeFor = Effect.fn("outcomeFor")(function* (name: string) { … }, Effect.catch(toFailed))
```

- **archivio**: zero `Effect.fn`. Le funzioni sono arrow con `Effect.gen` più un wrapper di span fatto in casa (`packages/archivio-data/src/infra/collections/mongo-collections.ts:44-70`, `packages/shared/src/with-span.ts:25`).
- **Questo repo**: conforme su `src/sheet/google/serviceAccountKey.ts:16,35`. Devia su `src/commands/fill.ts:53,71`, `src/agent/process/ProcessAgent.ts:48,81` e `src/commands/missing.ts:7`.
- **Enforcement**: `lint-sintattico`. Si segnala un `VariableDeclarator` o una `Property` con valore `ArrowFunctionExpression` o `FunctionExpression` il cui corpo è (o ritorna soltanto) `Effect.gen(…)`. Si segnala anche `Effect.fn(…)(…).pipe(`. In `lint-tipi`: `effectFnOpportunity` (suggestion).

### P19 · Risorse con `acquireRelease`, `Effect.scoped` solo se serve

**Regola**: una risorsa con ciclo di vita (connessione, client, processo) si acquisisce con `Effect.acquireRelease`, dentro `Layer.effect` (in v4 il layer fornisce lo scope) o dentro `Effect.scoped`. `Effect.scoped` si usa solo quando l'effetto richiede `Scope`.

**Perché**: il rilascio avviene anche quando l'effetto fallisce o viene interrotto. In v4 `Layer.scoped` non esiste più: secondo il JSDoc, `Layer.effect` copre "scoped resource acquisition".

```ts
// no: se ping fallisce, close non viene mai chiamato
Effect.tryPromise({ try: async () => { await client.connect(); await ping(); await client.close() }, catch })

// sì
const client = yield* Effect.acquireRelease(
  Effect.tryPromise({ try: () => MongoClient.connect(url), catch: (cause) => new DbError({ cause }) }),
  (client) => Effect.promise(() => client.close()),
)
```

- **archivio**: la connessione resta aperta se il ping fallisce (`apps/caveau/src/app/public/health/route.ts:28-36`); una cache statica di client (`packages/shared/src/mongodb.ts:23`) prende il posto di un layer con finalizer. Zero `Effect.scoped`/`acquireRelease`.
- **Questo repo**: conforme (`src/agent/process/ProcessAgent.ts:69`, dove lo spawn richiede `Scope`).
- **Enforcement**: `lint-tipi`. Capire se `R` contiene `Scope` richiede i tipi; `scopeInLayerEffect` esiste solo per v3. Per v4 non è stata verificata alcuna diagnostica sugli `Effect.scoped` superflui, quindi in pratica il pattern ricade nella skill.

### P20 · Concorrenza esplicita

**Regola**: `Effect.all`/`Effect.forEach` sono sequenziali di default. Si passa `{ concurrency }` solo per lavori indipendenti, con un limite numerico verso servizi esterni.

**Perché**: il parallelismo è una decisione, non un default; il limite protegge dai rate limit.

```ts
const [stdout, stderr] = yield* Effect.all([collect(handle.stdout), collect(handle.stderr)], {
  concurrency: "unbounded",
})
```

- **archivio**: `"unbounded"` per i caricamenti di pagina (`apps/caveau/src/features/detail/apis/api-detail-page.ts:48` e altri 9 punti). È ragionevole, ma nessun limite verso Pimcore.
- **Questo repo**: conforme (`src/agent/process/ProcessAgent.ts:56`: stdout e stderr vanno drenati insieme). Le gare sono in sequenza per scelta (`docs/tech-choices.md`).
- **Enforcement**: `solo-skill`.

### P21 · Log e output via Effect, niente `console` dentro gli effetti

**Regola**: la diagnostica passa da `Effect.log*` e `Effect.annotateLogs`, con un `Logger` configurato all'entry point. L'output del programma passa da `Console.log` o da `Effect.sync` al bordo, mai da `console.*` dentro un generatore o una callback `catch`.

**Perché**: il logger si sostituisce nei test (`captureLogs`) e i log restano strutturati.

```ts
// no
Effect.gen(function* () { for (const name of yield* missing) console.log(name) })

// sì
Effect.gen(function* () { yield* Effect.forEach(yield* missing, (name) => Console.log(name)) })
```

- **archivio**: conforme su `packages/shared/src/with-error-logging.ts:9,43` (`tapError` + `logError` + `annotateLogs`). Devia su `apps/caveau/src/app/public/health/route.ts:42` (`console.error` nella `catch` di `tryPromise`).
- **Questo repo**: conforme. L'output di programma passa da `Console.log`/`Console.error` (`src/main.ts`, `src/sheet/print/PrintSheetWriter.ts`), che è un `Context.Reference` sostituibile nei test e non decora le righe come farebbe `Effect.log`. Unica deroga, con `// oxlint-disable-next-line` motivato: il `console.error` dentro `Logger.make` in `src/main.ts`, che **è** il sink del logger — chiedergli di usare un logger sarebbe circolare.
- **Enforcement**: `lint-sintattico`, coperto dal preset con `global-console-in-effect` e `global-console` (verificato: `Console.log`/`Console.error` non fanno scattare la regola, `console.log` sì). Attenzione: `Console.log` è variadico e `Effect.forEach` passa l'indice, quindi `Effect.forEach(lines, Console.log)` stampa l'indice in coda a ogni riga — serve la lambda esplicita.

### P22 · Test con `@effect/vitest` e fake come Layer

**Regola**: i test di effetti usano `it.effect`, o `effect` importato come `test`, e `layer(...)` per i layer condivisi. I fake sono `Layer.succeed(Tag, Tag.of({…}))`. Niente `Effect.runPromise` nei test, niente mock di modulo.

**Perché**: il test gira nel runtime di test di Effect (con `TestClock`) e sostituisce i servizi dove il codice li legge. Riferimenti: `ai-docs/src/09_testing/10_effect-tests.ts` e `ai-docs/src/09_testing/20_layer-tests.ts`.

```ts
// no
test("…", async () => { await Effect.runPromise(authorize({ role: "Manager" })) })

// sì
const sheetWith = (...rows: ReadonlyArray<Row>) =>
  Layer.succeed(SheetReader, SheetReader.of({ rows: Effect.succeed([header, ...rows]) }))
```

- **archivio**: niente `@effect/vitest`. `runPromise` nei test (`apps/config-editor/src/features/auth/session.test.ts:12`) e `ManagedRuntime` a livello di modulo mai rilasciato (`packages/http/src/infra/http-client.test.ts:13`).
- **Questo repo**: conforme (`src/commands/fill.test.ts:1,17-26`). Gli altri test usano `it.effect`, secondo la deroga di `docs/tech-choices.md`.
- **Enforcement**: `lint-sintattico`. Nei `*.test.ts` si segnalano `Effect.run*` e `ManagedRuntime.make`; anti-slop ha `no-module-mocking` per `vi.mock`.

### P23 · Guard runtime con `Predicate`

**Regola**: sui valori `unknown` si usano i predicati di `Predicate` (`hasProperty`, `isString`, `isTagged`…), non guard scritti a mano con `typeof` e `in`.

**Perché**: `AGENTS.md`: "NEVER write your own helper functions like isRecord or isString".

```ts
// no
if (typeof error === "object" && error !== null && "_tag" in error) { … }

// sì
if (Predicate.hasProperty(cause, "status") && Predicate.isNumber(cause.status)) { … }
```

- **archivio**: guard a mano (`packages/shared/src/with-error-logging.ts:18`).
- **Questo repo**: conforme (`src/sheet/google/googleError.ts:3-7`).
- **Enforcement**: `lint-sintattico`. `no-runtime-typeof` di anti-slop, nel plugin generico e non in quello Effect, con l'opzione `allowInTypeGuards`.

## Stile delle funzioni effettful e dei boundary

I quattro pattern seguenti vengono da inloco e valgono insieme: descrivono la forma di una funzione effettful e di un handler di route. Nascono dal confronto fra `60e3f77`, dove lo stesso handler mescolava `await`, `Effect.runPromise`, `Effect.either` e ispezioni di `_tag`, e lo stato dopo `fe5bcf9` e `c3c5ab1`. Sono convenzioni locali, ma tutte e quattro sono imponibili.

### P24 · Uno stile solo per funzione

**Regola**: una funzione è interamente Effect oppure non lo è affatto. Dentro una funzione che contiene `yield*` o costruttori Effect non ci sono `async`, `await`, `.then` né `Effect.run*`. Le promise si sollevano con `Effect.tryPromise` (P08).

**Perché**: il mix è la forma peggiore delle due, perché gli errori viaggiano su due canali diversi, quello delle eccezioni e quello di Effect, e nessuno dei due li vede tutti.

```ts
// no (inloco, 60e3f77)
export const POST = async (request: Request) => {
  const credential = await readSession()
  const submission = submittedEvent(await request.formData())
  if (submission._tag === "Left") return new Response(submission.left, { status: 400 })
  const created = await Effect.runPromise(Effect.either(apiCreateEvent(credential, submission.right)))
  // …
}

// sì (inloco, c3c5ab1)
const createEvent = Effect.fn("events.create")(function* (request: Request) {
  const credential = yield* sessionCredential
  const form = yield* Effect.tryPromise({ try: () => request.formData(), catch: () => new BadRequest({ message: "invalid form data" }) })
  // …
})
```

- **inloco**: `60e3f77` è il caso negativo; `apps/web/src/app/events/create/route.ts` dopo `c3c5ab1` è il caso positivo.
- **Questo repo**: conforme, non c'è `async`/`await` in `src/`.
- **Enforcement**: `lint-sintattico`. In una funzione che contiene uno `YieldExpression{delegate}` o una `CallExpression` su `Effect.*`, si segnalano `async`, `AwaitExpression`, `.then(` e `Effect.run*`. `Effect.run*` è già coperto da `run-only-at-entry` (P04).

### P25 · Successo nel generatore, errori nel secondo argomento di `Effect.fn`

**Regola**: il generatore passato a `Effect.fn` contiene solo il percorso felice, letto dall'alto in basso. La gestione degli errori sta nel secondo argomento pipeable. Dentro il generatore sono vietati `catchTag`, `catchTags`, `catch`/`catchAll`, `catchIf`, `Effect.either`/`Effect.result` e `Effect.exit`; restano ammessi `Effect.mapError`, `Effect.orElse` e `Effect.orElseSucceed`, che nominano l'errore o danno un'alternativa senza aprire un ramo di gestione. Vale per tutte le funzioni effettful, non solo per i boundary.

**Perché**: separa la logica di successo dalla traduzione degli errori, e rende la traduzione un punto unico ed esaustivo invece di una cattura sparsa lungo il flusso. Un fallimento va nominato dove nasce (`mapError`) e gestito dove si decide la risposta.

```ts
// no
function* () {
  const x = yield* fetchThing.pipe(Effect.catchTag("NotFound", () => Effect.succeed(fallback)))
}

// sì: alternativa inline, nessun ramo di gestione
function* () {
  const x = yield* fetchThing.pipe(Effect.orElseSucceed(() => fallback))
  const y = yield* decode(raw).pipe(Effect.mapError((error) => new BadRequest({ message: error.message })))
}

// sì: la traduzione sta tutta nel secondo argomento, che riceve anche gli argomenti originali
const createEvent = Effect.fn("events.create")(
  function* (request: Request) { /* solo successo */ },
  (effect, request) => effect.pipe(Effect.catchTags({ BadRequest: (e) => refused(400, e.message) })),
)
```

- **inloco**: `apps/web/src/app/events/create/route.ts` dopo `c3c5ab1`; `submittedEvent` usa `mapError` dentro il flusso (`apps/web/src/features/events/submission.ts`).
- **Questo repo**: devia dove il catch è appeso con `.pipe` a un `Effect.gen` invece che passato come argomento di `Effect.fn` (`src/commands/fill.ts:88-90`, `src/agent/process/ProcessAgent.ts:68-93`). È lo stesso punto di P17.
- **Enforcement**: `lint-sintattico`. Dentro un generatore passato a `Effect.gen`/`Effect.fn` si segnalano `Effect.catchTag`, `catchTags`, `catch`, `catchAll`, `catchIf`, `either`, `result` ed `exit`, ovunque compaiano, anche dentro un `.pipe` su una singola espressione. Va in coppia con `prefer-effect-fn` (P17), altrimenti resta il modo di aggirarla appendendo `.pipe` all'`Effect.gen`.

### P26 · Niente tipi di trasporto nel generatore

**Regola**: il generatore restituisce un valore di dominio. La conversione in `Response` (o `NextResponse`, o un DTO di trasporto) avviene nel secondo argomento di `Effect.fn`, con `Effect.map` per il successo e `Effect.catchTags` per gli errori.

**Perché**: un `return new Response(...)` anticipato nel percorso felice è quasi sempre un ramo d'errore travestito da successo, e sfugge alla traduzione esaustiva. Mettendo la conversione tutta nel secondo argomento, successo ed errore diventano simmetrici e il generatore resta leggibile come sequenza lineare.

```ts
// no (inloco, ancora oggi): un ramo d'errore dentro il percorso felice
function* (request: Request) {
  const credential = yield* sessionCredential
  if (credential === undefined) return Response.redirect(new URL("/login", origin), 303)
  // …
}

// sì
const createEvent = Effect.fn("events.create")(
  function* (request: Request) {
    const credential = yield* sessionCredential   // fallisce con Unauthenticated
    return yield* apiCreateEvent(credential, yield* submittedEvent(yield* form(request)))
  },
  (effect, request) =>
    effect.pipe(
      Effect.map((created) => Response.redirect(new URL(`/events/${created.id}`, requestOrigin(request)), 303)),
      Effect.catchTags({ Unauthenticated: () => endSession.pipe(Effect.as(toLogin(request))) }),
    ),
)
```

Resta lecito `return yield* new Unauthenticated(...)`, che è un fallimento dichiarato (P07).

- **inloco**: il ramo `credential === undefined` sopravvive a `c3c5ab1`, pur avendo già il caso gemello `Unauthenticated` nel `catchTags`.
- **Questo repo**: n/a, è una CLI senza tipi di trasporto. L'equivalente sarebbe la costruzione delle righe di output.
- **Enforcement**: `lint-sintattico`. Si segnalano `new Response(...)` e `Response.<metodo>(...)` (configurabile: `NextResponse`, i DTO di trasporto del progetto) dentro un generatore passato a `Effect.gen`/`Effect.fn`. Non copre il caso semantico di un `return` anticipato di un valore di dominio che in realtà segnala un errore: quello resta indistinguibile da un successo legittimo.

### P27 · Entry point con canale errori chiuso a `never`

**Regola**: l'entry point è solo l'esecuzione dell'handler, con il canale errori fissato a `never` prima di eseguirlo, con `satisfies Effect.Effect<A, never>` o con un helper tipizzato.

**Perché**: `Effect.runPromise` accetta qualunque canale errori e trasforma ciò che resta in una promise rifiutata, cioè in un 500 generico. Fissare `never` sposta il controllo su `tsc`: un errore nuovo e non tradotto non compila. `Effect.Effect<A, never>` fissa anche `R = never`, quindi impone di fornire tutti i Layer necessari.

```ts
// no
export const POST = (request: Request) => Effect.runPromise(createEvent(request))

// sì (inloco, c3c5ab1)
export const POST = (request: Request) =>
  Effect.runPromise(createEvent(request) satisfies Effect.Effect<Response, never>)

// equivalente, più facile da controllare col lint
const runBoundary = (effect: Effect.Effect<Response, never, never>) => Effect.runPromise(effect)
```

- **inloco**: `fe5bcf9` lasciava `UnknownException`, `HttpApiDecodeError` e `ConfigError` fuori dal `catchTags`, e quei fallimenti uscivano come 500 di Next. `c3c5ab1` chiude il canale e lo dichiara.
- **Questo repo**: devia in modo lieve. `src/main.ts:76` esegue `NodeRuntime.runMain` su un effetto già ripulito da `Effect.catch`, ma il tipo non è dichiarato: aggiungere `satisfies Effect.Effect<void, never>` renderebbe l'invariante verificata da `tsc`.
- **Enforcement**: `lint-sintattico` per la forma (l'entry point è solo `run*` con `satisfies` o l'helper); la garanzia vera la dà `tsc`.

## Regole anti-slop

Le regole stanno nel plugin `anti-slop-effect`. Il pacchetto non è pubblicato su npm: **vendorizzato il 2026-09-14** in `tools/oxlint/anti-slop-effect/` (commit `c44ef22`, MIT, file invariati; origine e istruzioni di aggiornamento nel suo `README.md`), caricato da `.oxlintrc.json` con `jsPlugins`. Nessuna regola usa informazioni di tipo o risolve gli alias d'import (`Effect as E` sfugge), e nessuna ha opzioni.

Compatibilità verificata: `@oxlint/plugins` `1.82.0` (allineato a `oxlint`, non il `1.78.0` dell'upstream); i cinque `RuleTester` upstream passano, eseguiti da `pnpm test:lint-rules` con `node --test`. Sono esclusi da Vitest in `vitest.config.ts`, che altrimenti li raccoglieva e falliva con "No test suite found".

| Regola | Cosa rileva | v3 / v4 | Stato (2026-09-14) |
|---|---|---|---|
| `no-manual-effect-error-tag` | `_tag ==/===/!=/!==` letterale o `switch` su `_tag`, solo nella funzione passata direttamente a `Effect.catch`/`catchAll`/`catchIf`; su `x.reason._tag` suggerisce `catchReason` | entrambe; `catchAll` esiste solo in v3 e non disturba | **error** (P09); rumore zero, verificata con prova negativa |
| `prefer-effect-match` | catena di almeno 2 ternari sulla stessa espressione (per testo) confrontata con letterali | agnostica | **error** (P14); rumore zero, verificata con prova negativa |
| `no-manual-tag-comparison` | stessi confronti e `switch`, ovunque tranne nei catch-all | agnostica | **error** (P14, P16); i 10 punti iniziali sono stati migrati |
| `no-manual-tagged-construction` | object literal con `_tag` letterale, esente solo come argomento diretto di `Match.when`/`Match.not` | agnostica | **error** (P15), spenta su `**/*.test.ts` e `src/testing/**` come previsto: i 18 punti in `src/` sono stati migrati |
| `no-service-constructor-imports` | import nominati `/^make[A-Z]/` da percorsi relativi, test esclusi | agnostica, euristica di naming | vendorizzata ma **non attivata**: qui nessun `make*` e gli adapter si importano come namespace; P01 va scritta a parte |

Tutte spente su `tools/**`, dove i casi di test delle regole contengono di proposito le forme vietate.

Limiti noti, dalla lettura del codice:
- non rilevano gli handler passati per nome, i confronti dentro funzioni annidate nell'handler o `?._tag`;
- `no-manual-tag-comparison` segnala anche i `_tag` di librerie non Effect e i confronti dentro `catchTag`.

## Language service

Fatti verificati su repo, CHANGELOG e npm:

- **Supporto Effect 4**: `@effect/language-service` ha i completamenti dalla 0.73.0 e diagnostiche e refactor dalla 0.74.0 (febbraio 2026). Riconosce la versione installata e attiva le regole per v3 o v4. Entrambi i repo testano contro `effect` `4.0.0-beta.107`; la serie rc (qui rc.112) non è menzionata.
- **TypeScript 7**: questo repo ha `typescript` `7.0.2`, il port nativo in Go, che non ha `lib/typescript.js`. Il plugin JS e il suo `patch` accettano solo TS 5 e 6: `patch` si ferma con "for 7 support look into @effect/tsgo". Il README dice di usare `@effect/tsgo` da TS 7.
- **`@effect/tsgo` 0.45.0**:
  - supporta TypeScript `7.0.2`, lo stesso gitHead installato qui;
  - `effect-tsgo patch` sostituisce il binario `tsc` della piattaforma e conserva una copia `.original`;
  - `effect-tsgo diagnostics --project tsconfig.json` funziona senza patch, con `--format`, `--strict` e `--severity`, ed esce con 1 sugli errori (o sui warning con `--strict`).
- **Il `patch` del plugin JS (solo TS 5/6)**: riscrive `typescript.js` e `_tsc.js`, e dopo il patch il `tsc` normale emette le diagnostiche e ne tiene conto nell'exit code. Il README consiglia `"prepare": "effect-language-service patch"`.
- **Severità**: si configura con `diagnosticSeverity` nel plugin del `tsconfig`, oppure con commenti `// @effect-diagnostics effect/<regola>:off`. tsgo ha anche `overrides` per glob.
- **Diagnostiche utili per questo catalogo**:
  - errore: `floatingEffect`, `missingStarInYieldEffectGen`, `missingReturnYieldStar`, `missingEffectContext`;
  - warning: `globalErrorInEffectFailure`, `outdatedApi` (solo v4), `duplicatePackage`;
  - suggestion: `effectFnOpportunity`, `leakingRequirements`, `catchUnfailableEffect`, `catchAllToMapError`, `unnecessaryFailYieldableError`, `schemaSyncInEffect` (tsgo: v3 e v4);
  - off di default: `strictEffectProvide`.
- **Verificato in locale (2026-09-14)**: le diagnostiche funzionano con `effect@4.0.0-rc.112`; `effect-tsgo patch --oxlint` riesce sul layout pnpm di questo repo; il preset `recommended` attiva 98 regole (85 `warn`, 13 `error`) con `options.typeAware: true`, tutte con severità già impostata (nessuna resta spenta in attesa di configurazione).

### Integrazione ufficiale con oxlint

`effect.website/docs/v4/getting-started/devtools` documenta una via ufficiale che fa girare le diagnostiche di tsgo **dentro oxlint**, come regole type-aware. È questa la strada da seguire, non un plugin JS scritto a mano.

```bash
pnpm add -D @effect/tsgo oxlint oxlint-tsgolint
```

`package.json`:

```json
{ "scripts": { "prepare": "effect-tsgo patch --oxlint" } }
```

`.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/@effect/tsgo/oxlint-schema.json",
  "extends": ["./node_modules/@effect/tsgo/oxlint-presets/recommended.json"]
}
```

`tsconfig.json`, per l'editor; con `diagnostics: false` le stesse diagnostiche non compaiono due volte, dato che le dà già oxlint:

```json
{ "compilerOptions": { "plugins": [{ "name": "@effect/language-service", "diagnostics": false }] } }
```

`npx @effect/tsgo setup` fa tutto questo da solo. In VS Code o Cursor va poi selezionata la versione di TypeScript del workspace.

Verificato: `@effect/tsgo` `0.45.0` e `oxlint-tsgolint` `7.0.2001` esistono su npm, e la seconda allinea il numero di versione a TypeScript `7.0.2`, quello installato qui.

**Attivato in questo repo il 2026-09-14** (`oxlint@1.82.0`, `@effect/tsgo@0.45.0`, `oxlint-tsgolint@7.0.2001`, script `lint: oxlint`):

- la **patch è obbligatoria**: senza `effect-tsgo patch --oxlint`, `oxlint` rifiuta il preset con `Unknown plugin: 'effecttsgo'`. Il plugin non è caricabile da configurazione, sta nel binario patchato. Di conseguenza `prepare: effect-tsgo patch --oxlint` è in `package.json`; la patch sostituisce anche il `tsc` della piattaforma (annotato in `docs/tech-choices.md`);
- nei file di configurazione i nomi delle regole sono **kebab-case con prefisso `effecttsgo/`** (`effecttsgo/floating-effect`), non i camelCase della documentazione (`floatingEffect`);
- exit code: `error` → 1, solo `warning` → 0. Il lint non blocca finché le violazioni restano warning.

### Copertura reale del preset, per pattern

`coperto` = una violazione del pattern produce una diagnostica; `parziale` = solo alcune forme; `no` = serve una regola custom (passo 2 o 3). Severità: quella effettiva dopo gli `overrides` di `.oxlintrc.json`.

| P | Copertura | Regole `effecttsgo` | Severità |
|---|---|---|---|
| P01 | parziale | `non-object-effect-service-type`, `generic-effect-services`, `missing-effect-context`, `missing-layer-context`, `class-self-mismatch` | error / warn |
| P02 | no | — | — |
| P03 | no | — | — |
| P04 | parziale | `run-effect-inside-effect` | error (alzata) |
| P05 | parziale | `global-error-in-effect-failure`, `global-error-in-effect-catch`, `extends-native-error`, `unknown-in-effect-catch`. Verificato scoperto: `throw` dentro un generatore e `Effect.fail("stringa")` (un `new TypeError` invece è segnalato) | error (alzate) / warn |
| P06 | no | `redundant-schema-tag-identifier` (solo cosmetica) | warn |
| P07 | coperto | `unnecessary-fail-yieldable-error`, `missing-return-yield-star` | error |
| P08 | **no** | — (verificato: `Effect.tryPromise(() => …)` in forma thunk non è segnalato) | — |
| P09 | parziale | `catch-all-to-map-error`, `catch-unfailable-effect`, `catch-all-tag-dispatch-to-catch-tag`, `catch-to-ignore`, `multiple-catch-tag`, `catch-tag-to-catch-reason`, `catch-conditional-refail-to-catch-if`, `catch-die-to-or-die`; la discriminazione manuale su `_tag` dentro `Effect.catch` è ora coperta da `anti-slop-effect/no-manual-effect-error-tag`. Resta scoperto il catch-all senza parametro che ingoia | error (alzate le prime due) / warn |
| P10 | parziale | `prefer-schema-over-json`, `prefer-typed-schema-decoder`, `instance-of-schema` (l'`as` non è coperto) | warn |
| P11 | coperto | `schema-sync`, `schema-sync-in-effect` | error (alzate) |
| P12 | no | — | — |
| P13 | parziale | `process-env`, `process-env-in-effect` (i nomi dei segreti non sono coperti) | error (alzate) |
| P14 | coperto | preset: `match-effect-to-match`, `option-match-to-from-option`; il `_tag ===`/`switch` generico da `anti-slop-effect/no-manual-tag-comparison`, le catene di ternari da `anti-slop-effect/prefer-effect-match` | warn / error (le due anti-slop) |
| P15 | coperto | preset: `schema-struct-with-tag` (solo Schema); i letterali `_tag` da `anti-slop-effect/no-manual-tagged-construction`, spenta su test e fixture | warn / error (l'anti-slop) |
| P16 | coperto | preset: `run-of-exit-to-run-exit`, `prefer-succeed-some-or-none`; il `_tag` da `anti-slop-effect/no-manual-tag-comparison` | warn / error (l'anti-slop) |
| P17 | parziale | `effect-fn-opportunity`, `effect-fn-implicit-any`, `effect-fn-iife`, `unnecessary-effect-gen` (il nome in `Effect.fn("…")` non è imposto) | error (alzata la prima) / warn |
| P18 | coperto | `floating-effect`, `floating-effect-in-vitest`, `missing-star-in-yield-effect-gen`, `missing-return-yield-star` | error |
| P19 | parziale | `acquire-release-disposable`, `scope-in-layer-effect` | warn |
| P20 | no | `all-of-map-to-for-each` | warn |
| P21 | coperto | `global-console-in-effect`, `global-console` (più `global-date`, `global-random`, `global-fetch`, `global-timers`) | warn |
| P22 | parziale | `floating-effect-in-vitest` | error |
| P23 | no | — | — |
| P24 | parziale | `async-function` | warn |
| P25 | no | — | — |
| P26 | no | — | — |
| P27 | parziale | `leaking-requirements` (il canale errori chiuso a `never` non è coperto) | error (alzata) |

Fuori catalogo ma utile: `outdated-api` (warn) segnala le API v3 residue, e `duplicate-package` le installazioni doppie di `effect`.

Alzate a `error` in `.oxlintrc.json` perché a rumore zero sul codice attuale e corrispondenti a pattern da imporre: `extends-native-error`, `global-error-in-effect-catch`, `global-error-in-effect-failure`, `unnecessary-fail-yieldable-error`, `catch-all-to-map-error`, `catch-unfailable-effect`, `schema-sync`, `schema-sync-in-effect`, `process-env`, `process-env-in-effect`, `effect-fn-opportunity`, `leaking-requirements`, `run-effect-inside-effect`.

Cinque regole del preset non guardano il contesto Effect — scattano su qualunque `async function`, `new Promise`, import di builtin Node, `console` o `setTimeout`, anche dove Effect non è coinvolto (le varianti `-in-effect` invece sì). Producevano 21 warning su due file che non sono codice Effect: `test/dryRun.test.ts`, che lancia la CLI come processo figlio, e `src/testing/fakeAgent.ts`, script standalone usato come `AGENT_CMD` nei test. Spente lì con un `overrides` in `.oxlintrc.json`, invariate altrove: `async-function`, `new-promise`, `node-builtin-import`, `global-console`, `global-timers`.

I 26 `multiple-effect-provide` sono stati corretti: `e.pipe(Effect.provide(A), Effect.provide(B))` fornisce `B` anche alla **costruzione** di `A`, quindi una dipendenza comune viene costruita due volte (la memoizzazione vale dentro un solo `provide`). Sostituiti da un unico `provide`, scegliendo il combinatore in base alla relazione fra i layer:

- layer indipendenti → `Layer.mergeAll(A, B)`, che accumula i requirements in `RIn` senza risolverli (`Layer<in ROut, out E, out RIn>`: `ROut` contravariante, `RIn` covariante). Così `src/main.ts` e tutti i fake dei test, che sono `Layer.succeed`;
- layer con dipendenza → `Layer.provide(A, B)`. È il caso di `src/sheet/csv/CsvSheetReader.test.ts`: `CsvSheetReader.layer(path)` richiede `FileSystem`, quindi lì `mergeAll` non compila. La regola `layer-merge-all-with-dependencies` copre l'errore inverso.

Nei test l'idioma completo sarebbe salire a `layer(...)` di `@effect/vitest` per i layer costanti del file, ma qui i fake sono factory che chiudono su un array mutabile dichiarato dentro il test (`searched`, `written`, `current`): sono per-test per costruzione, e solo `tuscany` è condiviso — e nemmeno da tutti i test. Per lo stesso motivo un `ManagedRuntime` condiviso non è applicabile: dovrebbe essere ricostruito a ogni test, e farebbe perdere i test services di `it.effect`.

**Rumore del preset: 0 warning, 0 error.** Gli ultimi 8 sono stati chiusi così:

- 5 `global-console-in-effect` + 1 `global-console`: output di programma portato su `Console.log`/`Console.error`. Non era né logging (`Effect.log` decora le righe con timestamp e livello, inaccettabile per una CLI) né un aggiramento della regola: `Console` è un `Context.Reference`, quindi l'output diventa sostituibile nei test. La sola eccezione è il `console.error` dentro `Logger.make`, soppresso con `// oxlint-disable-next-line effecttsgo/global-console` e una motivazione: è il sink del logger. Verificato che la sintassi del language service (`// @effect-diagnostics-next-line`) **non** funziona passando da oxlint; serve quella di oxlint;
- `timeout-catch-tag-to-timeout-or-else` in `ProcessAgent.ts`: `Effect.timeout` + `catchTag("TimeoutError")` sostituiti da `Effect.timeoutOrElse({ duration, orElse })`, così `TimeoutError` non entra più nel canale errori per essere subito ricatturato;
- `schema-number` in `agent/errors.ts`: `seconds: Schema.Number` → `Schema.Int`. Il valore nasce da `config.ts` con `isInt()` e `> 0`, ed era l'unico `Schema.Number` nudo del repo (`RaceCard.ts` già usava `Int`/`Finite`).

## Prossimi passi

1. ~~**oxlint + tsgo**~~ **fatto**: vedi "Attivato in questo repo" sopra. `pnpm lint` è a 0 warning, 0 error. La patch è risultata obbligatoria, non opzionale.
2. ~~**Vendoring anti-slop**~~ **fatto** (2026-09-14): `tools/oxlint/anti-slop-effect/`, quattro regole su cinque attive, **tutte a `error`**. Le 28 violazioni iniziali sono state chiuse migrando le sei unioni di P15 a `Data.taggedEnum`.
3. **Plugin locale** `tools/oxlint/effect-local/`, solo per ciò che il preset non copre. Lista potata dopo il passo 1, in ordine di valore:
   1. `error-handling-in-effect-fn-handler` (P25), insieme a `prefer-effect-fn` (P17), da cui dipende;
   2. `single-style-per-function` (P24);
   3. `no-transport-types-in-generator` (P26), con la lista dei tipi di trasporto come opzione;
   4. `boundary-entrypoint-shape` (P27);
   5. `service-port-shape-only` (P01);
   6. `no-bare-error-in-effect` (P05), ridotta a `throw` in generatore e `Effect.fail("stringa")`;
   7. `no-parameterless-catch-all` (P09), con allowlist per l'entry point;
   8. `try-object-form`, con `Effect.promise` come warning (P08);
   9. `redacted-secret-names` (P13);
   10. `run-only-at-entry` (P04, P22), ridimensionata.

   Cadute perché coperte dal preset: `no-sync-decode-in-effect` (P11), `no-process-env` (P13), `return-yield-error` (P07), `no-console-in-effect` (P21).

   Ogni regola va scritta con il `RuleTester` di `oxlint/plugins-dev`, come in anti-slop.
4. **tsgo fuori da oxlint**: se l'integrazione del passo 1 non funziona su `rc.112`, il ripiego è `effect-tsgo diagnostics --project tsconfig.json` come script separato, senza patch, con `floatingEffect`, `missingStarInYieldEffectGen`, `globalErrorInEffectFailure`, `effectFnOpportunity` e `leakingRequirements` (P18, P19).
5. **Skill**, sottile:
   - i pattern `solo-skill` (P02, P03, P06, P12, P19, P20);
   - la tabella v3 → v4:

     | v3 | v4 |
     |---|---|
     | `Context.Tag` | `Context.Service` |
     | `catchAll` | `catch` |
     | `Either` / `Effect.either` | `Result` / `Effect.result` |
     | `Option.fromNullable` | `Option.fromNullishOr` |
     | `Layer.scoped` | `Layer.effect` |
     | `Schema.decodeUnknown` | `Schema.decodeUnknownEffect` |
     | `@effect/platform` | `effect/unstable/http` |

   - il rimando a `node_modules/effect/AGENTS.md` e `ai-docs/`;
   - l'istruzione di lanciare `pnpm lint` e `pnpm typecheck` prima di chiudere.

   Niente che il linter già applica.
6. **Hook**: un `PostToolUse` su `Edit|Write` per `src/**/*.ts` che lancia `oxlint` sul file toccato, più `pnpm typecheck && pnpm lint` a fine turno. Non c'è CI (`docs/tech-choices.md`), quindi l'hook è l'unico punto di enforcement automatico.

## Migrazioni da fare

Ordine consigliato, una volta attivo il lint:

1. ~~Portare a `Data.taggedEnum` le sei unioni di P15~~ **fatto** (2026-09-14): `ServiceAccountSource`, `Cursor`, `SheetWarning`, `SectionAction`, `SectionTarget`, `RaceOutcome`. Come previsto ha chiuso anche tutti i punti di P14/P16: `$match` ha sostituito lo `switch` di `parseSheet` e i ternari di `planRow`, `$is` i confronti di `summary`, `insertRowRequests`, `PrintSheetWriter` e `fill.test.ts`.
2. Coprire con `Match` i punti rimasti, cioè quelli su unioni che non sono `taggedEnum` (`src/agent/RaceCard.ts`, che viene da Schema).
3. `Config.redacted` per il service account (P13).
4. `Effect.fn` sulle funzioni effettful con nome (P17), spostando nel secondo argomento i catch oggi appesi con `.pipe` (P25): `src/commands/fill.ts:88-90` e `src/agent/process/ProcessAgent.ts:68-93`.
5. `satisfies Effect.Effect<void, never>` sull'effetto passato a `runMain` in `src/main.ts:76` (P27).
