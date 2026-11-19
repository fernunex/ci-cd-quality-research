import {
  getEvaluation,
  getEvaluationHistoryByVersion,
  getLatestEvaluationByVersion,
  hasVersion,
} from "./conventional-records.js";

const [action, identifier] = process.argv.slice(2);
if (!identifier || !["id", "version", "history", "exists"].includes(action ?? "")) {
  console.error("Uso: npm run query:conventional -- <id|version|history|exists> <identificador>");
  process.exitCode = 1;
} else {
  try {
    let result: unknown;
    switch (action) {
      case "id":
        result = getEvaluation(identifier) ?? null;
        break;
      case "version":
        result = getLatestEvaluationByVersion(identifier) ?? null;
        break;
      case "history":
        result = getEvaluationHistoryByVersion(identifier);
        break;
      default:
        result = hasVersion(identifier);
    }
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error de consulta:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
