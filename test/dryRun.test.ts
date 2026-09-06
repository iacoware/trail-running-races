import { spawn } from "node:child_process"
import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { expect, test } from "vitest"

const GOOGLE_VARS = ["GOOGLE_SERVICE_ACCOUNT_JSON", "SHEET_ID", "SHEET_TAB"]

const EXPORTED_SHEET = "fixtures/sheet.csv"

type Run = { readonly stdout: string; readonly exitCode: number }

// The child inherits no Google variable: this is the run the goal promises without credentials.
const runFill = (args: ReadonlyArray<string>, racesFile: string) =>
  new Promise<Run>((resolve) => {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      RACES_FILE: racesFile,
      AGENT_CMD: "node test/fixtures/dryRunAgent.ts",
    }
    for (const name of GOOGLE_VARS) delete env[name]
    const child = spawn("node", ["src/main.ts", "fill", ...args], { env })
    let stdout = ""
    child.stdout.on("data", (chunk) => (stdout += chunk))
    child.on("close", (code) => resolve({ stdout, exitCode: code ?? 0 }))
  })

const workspace = async (races: ReadonlyArray<string>) => {
  const directory = await mkdtemp(join(tmpdir(), "trail-races-"))
  const racesFile = join(directory, "races.txt")
  await writeFile(racesFile, races.join("\n"))
  return { directory, racesFile }
}

const dryRunOn = async (races: ReadonlyArray<string>) => {
  const { racesFile } = await workspace(races)
  return runFill(["--dry-run", "--sheet-csv", EXPORTED_SHEET], racesFile)
}

// The edge cases live in copies of the export, so the export itself stays the real sheet.
const dryRunOnEdited = async (races: ReadonlyArray<string>, edit: (csv: string) => string) => {
  const { directory, racesFile } = await workspace(races)
  const sheet = join(directory, "sheet.csv")
  await writeFile(sheet, edit(await readFile(EXPORTED_SHEET, "utf8")))
  return runFill(["--sheet-csv", sheet], racesFile)
}

test("plans a Tuscan race between the two races bracketing its date", async () => {
  const run = await dryRunOn(["Garfagnana Epic Trail"])

  expect(run.stdout).toContain("== Garfagnana Epic Trail")
  expect(run.stdout).toContain("Toscana, riga 4, dopo Brunello Crossing")
  expect(run.stdout).toContain("Nome: Garfagnana Epic Trail")
  expect(run.stdout).toContain("Data: 5-6 marzo")
  expect(run.stdout).toContain("Luogo: Castelnuovo di Garfagnana, Careggine")
  expect(run.stdout).toContain("Da FI: ~1h30")
  expect(run.stdout).toContain("Tipo: Trail")
  expect(run.exitCode).toBe(0)
})

test("keeps only the walk over 5km among the non competitive routes", async () => {
  const run = await dryRunOn(["Garfagnana Epic Trail"])

  expect(run.stdout).toContain("Distanze: 12km 300m+, camminata\n          42km 2500m+\n")
})

test("sends a sectionless region to Resto di Italia and a foreign race to Estero", async () => {
  const run = await dryRunOn(["Gara Lombarda", "Gara Francese"])

  expect(run.stdout).toContain("Resto di Italia, riga 8, in testa alla sezione")
  expect(run.stdout).toContain("Estero, riga 10, in testa alla sezione")
  expect(run.exitCode).toBe(0)
})

test("creates missing Estero between Resto di Italia and Da verificare", async () => {
  const run = await dryRunOnEdited(["Gara Francese"], (csv) =>
    csv.replace(/^Estero,+\r?\n/m, ""),
  )

  expect(run.stdout).toContain("crea Estero: riga vuota 9, intestazione in grassetto 10")
  expect(run.stdout).toContain("Estero, riga 11, in testa alla sezione")
  expect(run.stdout).toContain("errori: 0")
  expect(run.exitCode).toBe(0)
})

test("creates Da verificare at the bottom when no special section exists", async () => {
  const run = await dryRunOnEdited(["Gara inesistente di prova"], (csv) =>
    csv.replace(/^(Resto di Italia|Estero|Da verificare),+(?:\r?\n|$)/gm, ""),
  )

  expect(run.stdout).toContain("crea Da verificare:")
  expect(run.stdout).toContain("Da verificare,")
  expect(run.stdout).toContain("Data: non ho trovato niente")
  expect(run.exitCode).toBe(0)
})

test("creates Resto di Italia, never the absent regional section", async () => {
  const run = await dryRunOnEdited(["Gara Lombarda"], (csv) =>
    csv.replace(/^Resto di Italia,+\r?\n/m, ""),
  )

  expect(run.stdout).toContain("crea Resto di Italia:")
  expect(run.stdout).not.toContain("crea Lombardia:")
  expect(run.exitCode).toBe(0)
})

test("plans a later race before the first unparsable row of its section", async () => {
  const run = await dryRunOnEdited(["Gara Tardiva"], (csv) =>
    csv.replace("Chianti UTMB,", "Gara Da Chiarire,non ho trovato niente,,,,\nChianti UTMB,"),
  )

  expect(run.stdout).toContain("Toscana, riga 4, dopo Brunello Crossing")
})

test("plans unresolved rows in Da verificare and keeps their details in the summary", async () => {
  const run = await dryRunOn(["Gara inesistente di prova", "Gara Doppia"])

  expect(run.stdout).toContain(
    "== Gara inesistente di prova\n" +
      "Da verificare, riga 12, in testa alla sezione\n" +
      "Nome: Gara inesistente di prova\n" +
      "Data: non ho trovato niente\n",
  )
  expect(run.stdout).toContain(
    "== Gara Doppia\n" +
      "Da verificare, riga 12, in testa alla sezione\n" +
      "Nome: Gara Doppia\n" +
      "Data: più di un evento con questo nome\n",
  )
  expect(run.stdout).toContain("pianificate: 0")
  expect(run.stdout).toContain("non trovate: 1\n  - Gara inesistente di prova")
  expect(run.stdout).toContain("ambigue: 1\n  - Gara Doppia: candidati edizione 2024")
  expect(run.stdout).toContain("errori: 0")
  expect(run.exitCode).toBe(0)
})
