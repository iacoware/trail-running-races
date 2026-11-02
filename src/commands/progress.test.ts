import { Duration } from "effect"
import { expect, test } from "vitest"

import { candidatesLine, formatElapsed } from "./progress.ts"

test.each([
    [0, "nessuna gara da cercare"],
    [1, "1 gara da cercare"],
    [2, "2 gare da cercare"],
])("announces %i candidates", (count, line) => {
    expect(candidatesLine(count)).toBe(line)
})

test.each([
    [Duration.millis(300), "0s"],
    [Duration.millis(47_600), "48s"],
    [Duration.seconds(72), "1m 12s"],
])("rounds the elapsed time to whole seconds", (elapsed, text) => {
    expect(formatElapsed(elapsed)).toBe(text)
})
