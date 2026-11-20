#!/usr/bin/env node
/**
 * Prepara una revisión versionable de `subject`.
 * Nunca crea commits ni tags por sí mismo: esas operaciones son explícitas.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const scenarioId = process.argv[2];
if (!/^(E1|E2|E3|E4)$/.test(scenarioId ?? "")) {
  console.error("Uso: node scripts/set-subject-version.mjs E1|E2|E3|E4");
  process.exit(2);
}
const scenario = JSON.parse(readFileSync(resolve(`scenarios/${scenarioId}.json`), "utf8"));
const billingFile = resolve("subject/src/billing.ts");
const code = readFileSync(billingFile, "utf8");
const clean = "export function calculateTax(taxableCents: number, rate: number): number {";
const lintError = "export function calculateTax(taxableCents: number, rate: any): number {";
if (!code.includes(clean) && !code.includes(lintError)) {
  throw new Error("No se localizó la firma esperada de calculateTax; no se modificó el archivo.");
}
const nextSignature = scenario.lintVariant === "lint-error" ? lintError : clean;
const nextCode = code.replace(code.includes(clean) ? clean : lintError, nextSignature);
writeFileSync(billingFile, nextCode);
writeFileSync(resolve("subject/experiment-profile.json"), JSON.stringify({
  scenarioId, testProfile: scenario.testProfile, lintVariant: scenario.lintVariant,
}, null, 2) + "\n");
console.log(`Versión ${scenarioId} preparada: ${scenario.testProfile} / ${scenario.lintVariant}`);
console.log("Revisa git diff; registra y etiqueta el commit cuando corresponda.");
