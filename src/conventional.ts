import { readFileSync } from "node:fs";
import { DEFAULT_RECORDS_PATH, saveEvaluation } from "./conventional-records.js";

try {
  const inputFile = process.argv[2];
  if (!inputFile) {
    throw new Error("Uso: npm run verify:conventional -- examples/E1.json");
  }
  const input: unknown = JSON.parse(readFileSync(inputFile, "utf8"));
  const record = saveEvaluation(input);
  console.log(`Evaluación: ${record.evaluationId}`);
  console.log(`Decisión: ${record.decision}`);
  console.log(`Registro guardado en: ${DEFAULT_RECORDS_PATH}`);
} catch (error) {
  console.error("Error de evaluación:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
