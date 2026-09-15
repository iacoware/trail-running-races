# effect-local

Regole oxlint locali per i pattern Effect che né il preset `effecttsgo` né `anti-slop-effect` coprono. Catalogo, copertura e severità in `docs/effect-patterns.md`.

| Regola                                 | Pattern                       |
| -------------------------------------- | ----------------------------- |
| `prefer-effect-fn`                     | P17                           |
| `untraced-recursion`                   | P17                           |
| `error-handling-in-effect-fn-handler`  | P25                           |
| `single-style-per-function`            | P24                           |
| `no-transport-types-in-generator`      | P26, opzione `transportTypes` |
| `boundary-entrypoint-shape`            | P27                           |
| `service-port-shape-only`              | P01                           |
| `no-bare-error-in-effect`              | P05                           |
| `no-parameterless-catch-all`           | P09                           |
| `try-object-form`, `no-effect-promise` | P08                           |
| `redacted-secret-names`                | P13                           |
| `run-only-at-entry`                    | P04, P22                      |
| `provide-named-layer`                  | P28, opzione `testFiles`      |
| `no-provide-on-definition`             | P28, opzione `testFiles`      |
| `no-nested-match`                      | P30                           |
| `no-asymmetric-match-handlers`         | P34                           |
| `no-inline-yield-star`                 | P32, con autofix              |
| `no-effect-return-type`                | P33, con suggestion           |

Tutte sintattiche: nessuna informazione di tipo, e come in anti-slop i nomi si confrontano alla lettera (`import { Effect as E }` sfugge). Quando il motivo di un'esclusione fa parte della regola, è la regola a riconoscere i file: `provide-named-layer` e `no-provide-on-definition` saltano i test da sé (default `**/*.test.*`, `**/*.spec.*`, `**/__tests__/**`, `**/test/**`, `**/tests/**`, relativi alla working directory; `src/testing/` non conta come test), e l'opzione `testFiles` sostituisce i default. Le esclusioni che dipendono dal progetto, come l'entry point, restano negli `overrides` di `.oxlintrc.json`. `transportTypes` di `no-transport-types-in-generator` è un'opzione perché i tipi di trasporto cambiano da progetto a progetto.

## Test

`pnpm test:lint-rules`, con il `RuleTester` di `oxlint/plugins-dev` eseguito da `node --test`.
