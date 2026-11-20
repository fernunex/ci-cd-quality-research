#!/usr/bin/env node
/**
 * Crea métricas desde un escenario versionado y, con --send, envía el mismo JSON a A y B.
 * Por seguridad, no envía transacciones por defecto y rechaza --development con --send.
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, readFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const scenarioId = process.argv[2];
const send = process.argv.includes("--send");
const development = process.argv.includes("--development");
if (!/^(E1|E2|E3|E4)$/.test(scenarioId ?? "")) {
  throw new Error("Uso: node scripts/run-subject-pair.mjs E1|E2|E3|E4 [--repeat N] [--development | --send]");
}
if (send && development) throw new Error("No se permiten transacciones con versiones DEV no congeladas");
const repeatIdx = process.argv.indexOf("--repeat");
const repetition = repeatIdx < 0 ? "1" : process.argv[repeatIdx + 1];
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} falló: ${result.error?.message ?? result.stderr}`);
  }
  return result;
}
const collector = run(process.execPath, ["scripts/collect-subject-metrics.mjs", scenarioId,
  "--repeat", repetition, ...(development ? ["--development"] : [])]);
const collected = JSON.parse(collector.stdout);
console.log(JSON.stringify(collected, null, 2));
if (!send) {
  console.log("Solo se han generado métricas. Agrega --send para enviar ambas evaluaciones.");
  process.exit(0);
}
if (process.env.TARGET_NETWORK !== "sepolia") {
  throw new Error("--send requiere TARGET_NETWORK=sepolia; revisa los secretos y la red");
}
const input = collected.inputPath;
for (const script of ["verify:conventional", "verify:blockchain"]) {
  const result = spawnSync("npm", ["run", script, "--", input], {
    stdio: "inherit", env: process.env,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Falló ${script}. Si la transacción fue enviada, verifica antes su receipt; no reintentes automáticamente.`);
  }
}
function findExactlyOne(path, id) {
  const lines = readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean);
  const matches = lines.map((line) => JSON.parse(line)).filter((entry) => entry.evaluationId === id);
  if (matches.length !== 1) throw new Error(`Número de registros inesperado en ${path}: ${matches.length}`);
  return matches[0];
}
const a = findExactlyOne(resolve("prototype-data/conventional.jsonl"), collected.evaluationId);
const b = findExactlyOne(resolve("prototype-data/blockchain-sepolia-dev.jsonl"), collected.evaluationId);
const timing = findExactlyOne(resolve("prototype-data/conventional-timings.jsonl"), collected.evaluationId);
for (const field of ["scenarioId", "commitSha", "versionId", "ruleVersion", "linesCovered",
  "linesTotal", "eslintErrors", "decision"]) {
  if (a[field] !== b[field]) throw new Error(`Diferencia A/B en ${field}`);
}
if (b.chainId !== 11155111 || typeof b.gasUsed !== "number") {
  throw new Error("El registro blockchain no corresponde a Sepolia");
}
const record = {
  scenarioId, evaluationId: collected.evaluationId, commitSha: a.commitSha,
  linesCovered: a.linesCovered, linesTotal: a.linesTotal, eslintErrors: a.eslintErrors,
  conventional: a.decision, blockchain: b.decision, concordant: true,
  conventionalVerificationMs: Number(timing.verificationMs),
  blockchainVerificationMs: Number(b.verificationMs),
  differenceMs: Number((Number(b.verificationMs) - Number(timing.verificationMs)).toFixed(3)),
  gasUsed: b.gasUsed, chainId: b.chainId, transactionHash: b.transactionHash,
};
const output = resolve("prototype-data/paired-subject-sepolia-dev.jsonl");
mkdirSync(dirname(output), { recursive: true });
appendFileSync(output, JSON.stringify(record) + "\n");
console.log("Pareja verificada:", JSON.stringify(record, null, 2));
