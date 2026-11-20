#!/usr/bin/env node
/**
 * Crea un espacio aislado para métricas; no modifica el código fuente versionado.
 * Con una etiqueta Git, lee los bytes reales de esa revisión, no el working tree.
 */
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve, relative, dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args[0]}: ${result.stderr.trim()}`);
  return result.stdout;
}

export function prepareWorkspace(scenario, development = false) {
  const workspace = resolve("experimental-workspaces", scenario.scenarioId);
  rmSync(workspace, { recursive: true, force: true });
  mkdirSync(workspace, { recursive: true });

  let commitSha;
  if (development) {
    cpSync(resolve("subject/src"), join(workspace, "src"), { recursive: true });
    cpSync(resolve("subject/test"), join(workspace, "test"), { recursive: true });
    const billPath = join(workspace, "src/billing.ts");
    const bill = readFileSync(billPath, "utf8");
    const clean = "export function calculateTax(taxableCents: number, rate: number): number {";
    const dirty = "export function calculateTax(taxableCents: number, rate: any): number {";
    if (!bill.includes(clean) && !bill.includes(dirty)) throw new Error("No se encontró la variante fiscal");
    writeFileSync(billPath, bill.replace(bill.includes(clean) ? clean : dirty,
      scenario.lintVariant === "lint-error" ? dirty : clean));
    commitSha = `DEV-SIN-ETIQUETA-${scenario.scenarioId}`;
  } else {
    commitSha = git(["rev-parse", "--verify", `${scenario.gitTag}^{commit}`]).trim();
    const paths = git(["ls-tree", "-r", "--name-only", commitSha, "subject/src", "subject/test"])
      .trim().split("\n").filter(Boolean);
    if (paths.length < 10) throw new Error("La revisión de Git no contiene la aplicación completa");
    for (const path of paths) {
      const rel = relative("subject", path);
      const target = join(workspace, rel);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, git(["show", `${commitSha}:${path}`]));
    }
    const profile = JSON.parse(git(["show", `${commitSha}:subject/experiment-profile.json`]));
    for (const field of ["scenarioId", "lintVariant", "testProfile"]) {
      if (profile[field] !== scenario[field]) {
        throw new Error(`El tag ${scenario.gitTag} no corresponde a ${scenario.scenarioId}: ${field}`);
      }
    }
  }
  return { workspace, commitSha };
}
