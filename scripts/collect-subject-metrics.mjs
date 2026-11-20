#!/usr/bin/env node
/**
 * Genera métricas reales de Vitest V8 + ESLint con una sola entrada para A/B.
 * Uso: node scripts/collect-subject-metrics.mjs E1 --repeat 1 [--development]
 * Sin --development exige el tag Git del escenario.
 */
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { prepareWorkspace } from "./prepare-subject-workspace.mjs";

function requireExecutable(name) {
  const bin = resolve(`node_modules/.bin/${name}`);
  if (!existsSync(bin)) throw new Error(`Falta ${name} en node_modules. Instala dependencias en la raíz.`);
  return bin;
}
function run(executable, args, options = {}) {
  const result = spawnSync(executable, args, { encoding: "utf8", ...options });
  if (result.error) throw result.error;
  return result;
}

const scenarioId = process.argv[2];
if (!/^(E1|E2|E3|E4)$/.test(scenarioId ?? "")) {
  console.error("Uso: node scripts/collect-subject-metrics.mjs E1|E2|E3|E4 --repeat N [--development]");
  process.exit(2);
}
const repeatIndex = process.argv.indexOf("--repeat");
const repetition = repeatIndex < 0 ? 1 : Number(process.argv[repeatIndex + 1]);
if (!Number.isSafeInteger(repetition) || repetition < 1 || repetition > 99) {
  throw new Error("Repetición inválida (1..99)");
}
const development = process.argv.includes("--development");
const scenario = JSON.parse(readFileSync(resolve(`scenarios/${scenarioId}.json`), "utf8"));
const { workspace, commitSha } = prepareWorkspace(scenario, development);
const evidenceDir = resolve("prototype-data", "subject-evidence", scenarioId,
  `${Date.now()}-${randomUUID().slice(0, 8)}`);
const coverageDir = resolve(evidenceDir, "coverage");
mkdirSync(coverageDir, { recursive: true });

const vitest = run(requireExecutable("vitest"), ["run", "--config", resolve("subject/vitest.config.mts")], {
  env: { ...process.env,
    SUBJECT_WORKSPACE: workspace, SUBJECT_COVERAGE_DIR: coverageDir,
    SUBJECT_TEST_PROFILE: scenario.testProfile,
  },
});
if (vitest.status !== 0) {
  process.stderr.write(vitest.stdout + vitest.stderr);
  throw new Error("Falló Vitest; no se puede generar una evaluación válida");
}
const summaryPath = resolve(coverageDir, "coverage-summary.json");
if (!existsSync(summaryPath)) throw new Error("Vitest no produjo coverage-summary.json");
const coverageReport = JSON.parse(readFileSync(summaryPath, "utf8"));
const linesCovered = coverageReport.total?.lines?.covered;
const linesTotal = coverageReport.total?.lines?.total;
if (!Number.isSafeInteger(linesCovered) || !Number.isSafeInteger(linesTotal) ||
    linesTotal <= 0 || linesCovered < 0 || linesCovered > linesTotal) {
  throw new Error("Métricas de cobertura inválidas");
}

const eslint = run(requireExecutable("eslint"), ["--no-ignore", "--config",
  resolve("subject/eslint.config.mjs"), "--format", "json", resolve(workspace, "src")]);
if (eslint.status !== 0 && eslint.status !== 1) {
  process.stderr.write(eslint.stdout + eslint.stderr);
  throw new Error("Fallo técnico de ESLint (no es rechazo de calidad)");
}
let lintResults;
try { lintResults = JSON.parse(eslint.stdout); }
catch { throw new Error(`ESLint no produjo JSON válido: ${eslint.stderr}`); }
if (!Array.isArray(lintResults) || !lintResults.length) throw new Error("ESLint no analizó archivos");
const eslintErrors = lintResults.reduce((sum, file) => sum + file.errorCount, 0);

const coveragePass = (100 * linesCovered >= 80 * linesTotal);
const lintPass = eslintErrors === 0;
const expectedCoveragePass = scenario.testProfile === "high";
const expectedLintPass = scenario.lintVariant === "clean";
if (coveragePass !== expectedCoveragePass || lintPass !== expectedLintPass) {
  throw new Error(`Escenario ${scenarioId} no cumple su diseño. Cobertura: ${linesCovered}/${linesTotal}; errores ESLint: ${eslintErrors}. Ajusta los tests y vuelve a medir.`);
}
const decision = coveragePass && lintPass ? "APROBADO" : "RECHAZADO";
if (decision !== scenario.expectedDecision) throw new Error("Decisión no coincide con la definición de escenario");

const evaluationId = `${scenarioId}-R${String(repetition).padStart(2, "0")}-${randomUUID()}`;
const input = {
  scenarioId, evaluationId, commitSha, ruleVersion: "v1", linesCovered, linesTotal, eslintErrors,
};
const inputPath = resolve("prototype-data", "experimental-inputs", `${evaluationId}.json`);
mkdirSync(resolve("prototype-data", "experimental-inputs"), { recursive: true });
writeFileSync(inputPath, JSON.stringify(input, null, 2) + "\n");
writeFileSync(resolve(evidenceDir, "eslint-results.json"), JSON.stringify(lintResults, null, 2));
writeFileSync(resolve(evidenceDir, "manifest.json"), JSON.stringify({
  ...scenario, commitSha, evaluationId, development, coveragePercent: 100 * linesCovered / linesTotal,
  eslintErrors, decision, source: "Vitest V8 coverage-summary.json + ESLint JSON",
}, null, 2));
console.log(JSON.stringify({ inputPath, evidenceDir, ...input, coveragePercent: Number((100 * linesCovered / linesTotal).toFixed(2)), decision, development }, null, 2));
if (development) console.warn("AVISO: --development usa commitSha ficticio; no es un resultado experimental válido.");
