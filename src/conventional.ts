
import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

import {
  DEFAULT_RECORDS_PATH,
  parseEvaluationInput,
  saveEvaluation,
} from "./conventional-records.js";

try {
  const inputFile = process.argv[2];

  if (!inputFile) {
    throw new Error(
      "Uso: npm run verify:conventional -- examples/E1.json"
    );
  }

  // Preparar las métricas antes de iniciar la medición.
  const input = parseEvaluationInput(
    JSON.parse(readFileSync(inputFile, "utf8"))
  );

  // Intervalo: decisión convencional y persistencia en JSONL.
  const start = performance.now();

  const record = saveEvaluation(input);

  const verificationMs = Number(
    (performance.now() - start).toFixed(3)
  );

  // Guardamos la duración después de finalizar el intervalo medido.
  appendFileSync(
    resolve("prototype-data/conventional-timings.jsonl"),
    JSON.stringify({
      scenarioId: record.scenarioId,
      evaluationId: record.evaluationId,
      verificationMs,
    }) + "\n",
    "utf8"
  );

  console.log(`Evaluación: ${record.evaluationId}`);
  console.log(`Decisión: ${record.decision}`);
  console.log(`Tiempo convencional: ${verificationMs} ms`);
  console.log(`Registro guardado en: ${DEFAULT_RECORDS_PATH}`);
} catch (error) {
  console.error(
    "Error de evaluación:",
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
}

