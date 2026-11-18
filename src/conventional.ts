import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { evaluateQuality, validateMetrics } from "./quality-rules.js";

function requiredText(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} debe ser un texto no vacío.`);
  }
  return value;
}

try {
  const inputFile = process.argv[2];
  if (!inputFile) {
    throw new Error("Uso: npm run verify:conventional -- examples/E1.json");
  }

  const raw: unknown = JSON.parse(readFileSync(inputFile, "utf8"));
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("La entrada debe ser un objeto JSON.");
  }
  const input = raw as Record<string, unknown>;
  const scenarioId = requiredText(input.scenarioId, "scenarioId");
  const commitSha = requiredText(input.commitSha, "commitSha");
  const ruleVersion = requiredText(input.ruleVersion, "ruleVersion");
  if (ruleVersion !== "v1") {
    throw new Error("Por ahora solo está soportada ruleVersion=v1.");
  }

  const metrics = validateMetrics(input);
  const decision = evaluateQuality(metrics);
  const record = {
    scenarioId,
    commitSha,
    ruleVersion,
    ...metrics,
    decision,
    evaluatedAt: new Date().toISOString(),
  };

  const outputDir = join(process.cwd(), "prototype-data");
  mkdirSync(outputDir, { recursive: true });
  const outputFile = join(outputDir, "conventional.jsonl");
  appendFileSync(outputFile, JSON.stringify(record) + "\n", "utf8");

  console.log(`Decisión: ${decision}`);
  console.log(`Registro guardado en: ${outputFile}`);
} catch (error) {
  console.error("Error de evaluación:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
