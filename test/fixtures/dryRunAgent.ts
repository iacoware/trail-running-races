// Stand-in for AGENT_CMD in the dry run integration test: answers by race name, so the run
// exercises found, not found and ambiguous in one go.
let prompt = ""
for await (const chunk of process.stdin) prompt += chunk

const name = /Gara da cercare: (.+)/.exec(prompt)?.[1]?.trim() ?? ""

const distance = (km: number, dislivello: number, flags: Partial<Record<string, boolean>> = {}) => ({
  km,
  dislivello,
  camminata: flags["camminata"] === true,
  bambini: flags["bambini"] === true,
})

const found = (over: Record<string, unknown>) => ({
  esito: "trovata",
  url: "https://www.esempio.it",
  data: "5-6 marzo",
  luogo: ["Castelnuovo di Garfagnana", "Careggine"],
  regione: "Toscana",
  minutiDaFirenze: 90,
  tipo: "Trail",
  distanze: [distance(42, 2500)],
  ...over,
})

const answers: Record<string, unknown> = {
  "Garfagnana Epic Trail": found({
    distanze: [
      distance(3, 50, { bambini: true }),
      distance(4, 80, { camminata: true }),
      distance(12, 300, { camminata: true }),
      distance(42, 2500),
    ],
  }),
  "Gara Lombarda": found({ regione: "Lombardia", data: "1 aprile" }),
  "Gara Francese": found({ regione: "Estero", data: "1 aprile" }),
  "Gara Tardiva": found({ data: "20 giugno" }),
  "Gara inesistente di prova": { esito: "non_trovata" },
  "Gara Doppia": { esito: "ambigua", candidati: ["edizione 2024", "edizione 2025"] },
}

console.log(JSON.stringify(answers[name] ?? { esito: "non_trovata" }))
