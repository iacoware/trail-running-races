import { spawn } from "node:child_process"
import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { expect, test } from "vitest"

const GOOGLE_VARS = ["GOOGLE_SERVICE_ACCOUNT_JSON", "SHEET_ID", "SHEET_TAB"]

const SHEET_CSV = `Nome,Data (+ o -),Luogo,Da FI,Tipo,Distanze
Toscana,,,,,
Brunello Crossing,20-21 febbraio,Montalcino,~2h,Trail,"17.5km 750m+, camminata
45km 1820m+"
Chianti UTMB,18-21 marzo,"Radda,Gaiole",~1h,Trail,46km 1650m+
,,,,,
Resto di Italia,,,,,
,,,,,
Estero,,,,,
`

type Run = { readonly stdout: string; readonly exitCode: number }

// The child inherits no Google variable: this is the run the goal promises without credentials.
const runFill = (workspace: string, args: ReadonlyArray<string>) =>
  new Promise<Run>((resolve) => {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      RACES_FILE: join(workspace, "races.txt"),
      AGENT_CMD: "node test/fixtures/dryRunAgent.ts",
    }
    for (const name of GOOGLE_VARS) delete env[name]
    const child = spawn("node", ["src/main.ts", "fill", ...args], { env })
    let stdout = ""
    child.stdout.on("data", (chunk) => (stdout += chunk))
    child.on("close", (code) => resolve({ stdout, exitCode: code ?? 0 }))
  })

const workspaceWith = async (races: ReadonlyArray<string>, csv = SHEET_CSV) => {
  const directory = await mkdtemp(join(tmpdir(), "trail-races-"))
  await writeFile(join(directory, "races.txt"), races.join("\n"))
  await writeFile(join(directory, "sheet.csv"), csv)
  return directory
}

const dryRunOn = async (races: ReadonlyArray<string>, csv = SHEET_CSV) => {
  const workspace = await workspaceWith(races, csv)
  return runFill(workspace, ["--dry-run", "--sheet-csv", join(workspace, "sheet.csv")])
}

test("plans a Tuscan race between the two races that bracket its date, without Google credentials", async () => {
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

  expect(run.stdout).toContain("Distanze: 42km 2500m+\n          12km 300m+, camminata\n")
})

test("sends an Italian region without a section to Resto di Italia and a foreign race to Estero", async () => {
  const run = await dryRunOn(["Gara Lombarda", "Gara Francese"])

  expect(run.stdout).toContain("Resto di Italia, riga 7, in testa alla sezione")
  expect(run.stdout).toContain("Estero, riga 9, in testa alla sezione")
  expect(run.exitCode).toBe(0)
})

test("reports a tagged error and plans nothing when the destination section is missing", async () => {
  const withoutAbroad = SHEET_CSV.replace("Estero,,,,,\n", "")

  const run = await dryRunOn(["Gara Francese"], withoutAbroad)

  expect(run.stdout).not.toContain("== Gara Francese\n")
  expect(run.stdout).toContain("errori: 1")
  expect(run.stdout).toContain("Gara Francese: SectionMissingError")
  expect(run.exitCode).toBe(1)
})

test("plans a later race before the first unparsable row of its section", async () => {
  const withUnparsable = SHEET_CSV.replace(
    "Chianti UTMB,18-21 marzo",
    "Gara Da Chiarire,non ho trovato niente,,,,\nChianti UTMB,18-21 marzo",
  )

  const run = await dryRunOn(["Gara Tardiva"], withUnparsable)

  expect(run.stdout).toContain("Toscana, riga 4, dopo Brunello Crossing")
})

test("lists a race the agent did not find in the summary only, keeping exit code 0", async () => {
  const run = await dryRunOn(["Gara inesistente di prova", "Gara Doppia"])

  expect(run.stdout).not.toContain("== Gara inesistente di prova")
  expect(run.stdout).toContain("pianificate: 0")
  expect(run.stdout).toContain("non trovate: 1\n  - Gara inesistente di prova")
  expect(run.stdout).toContain("ambigue: 1\n  - Gara Doppia: candidati edizione 2024, edizione 2025")
  expect(run.stdout).toContain("errori: 0")
  expect(run.exitCode).toBe(0)
})
