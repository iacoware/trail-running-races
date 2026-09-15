// Stand-in for AGENT_CMD in tests: `node fakeAgent.ts <mode>`, prompt on stdin, answer on stdout.
let prompt = ""
for await (const chunk of process.stdin) prompt += chunk

const found = {
  esito: "trovata",
  url: "https://www.esempio.it",
  data: "18-21 marzo",
  luogo: ["Radda", "Gaiole"],
  regione: "Toscana",
  minutiDaFirenze: 60,
  tipo: "Trail",
  distanze: [{ km: 17.5, dislivello: 750, camminata: true, bambini: false }],
}

switch (process.argv[2]) {
  case "card":
    console.log(
      `Ecco la scheda:\n\`\`\`json\n${JSON.stringify(found, null, 2)}\n\`\`\`\nSpero sia utile.`,
    )
    break
  case "text":
    console.log("Non ho trovato nulla di rilevante.")
    break
  case "echo-prompt":
    console.log(JSON.stringify({ esito: "ambigua", candidati: [prompt] }))
    break
  case "sleep":
    await new Promise((resolve) => setTimeout(resolve, 5000))
    break
  case "fail":
    console.error("boom")
    process.exit(2)
}
