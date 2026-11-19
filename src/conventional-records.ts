import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  evaluateQuality,
  validateMetrics,
  type QualityDecision,
  type QualityMetrics,
} from "./quality-rules.js";

export interface EvaluationInput extends QualityMetrics {
  evaluationId: string;
  scenarioId: string;
  commitSha: string;
  ruleVersion: "v1";
}

export interface EvaluationRecord extends EvaluationInput {
  versionId: string;
  decision: QualityDecision;
  evaluatedAt: string;
}

export const DEFAULT_RECORDS_PATH = join(process.cwd(), "prototype-data", "conventional.jsonl");
const MAX_UINT32 = 0xffff_ffff;

function requiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} debe ser un texto no vacío.`);
  }
  if (value !== value.trim()) {
    throw new Error(`${field} no debe contener espacios al principio o al final.`);
  }
  return value;
}

export function parseEvaluationInput(value: unknown): EvaluationInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("La entrada debe ser un objeto JSON.");
  }
  const data = value as Record<string, unknown>;
  const metrics = validateMetrics(value);
  for (const [name, count] of Object.entries(metrics)) {
    if (count > MAX_UINT32) {
      throw new Error(`${name} supera el límite uint32 del contrato.`);
    }
  }
  const ruleVersion = requiredText(data.ruleVersion, "ruleVersion");
  if (ruleVersion !== "v1") {
    throw new Error("Por ahora solo está soportada ruleVersion=v1.");
  }
  return {
    evaluationId: requiredText(data.evaluationId, "evaluationId"),
    scenarioId: requiredText(data.scenarioId, "scenarioId"),
    commitSha: requiredText(data.commitSha, "commitSha"),
    ruleVersion: "v1",
    ...metrics,
  };
}

/** Convención futura A/B: SHA-256(UTF-8 del identificador) como bytes32. */
export function toBytes32Id(identifier: string): string {
  return `0x${createHash("sha256").update(identifier, "utf8").digest("hex")}`;
}

export function readRecords(path = DEFAULT_RECORDS_PATH): EvaluationRecord[] {
  if (!existsSync(path)) return [];
  const content = readFileSync(path, "utf8");
  return content.split(/\r?\n/).filter((line) => line.trim() !== "").map((line, index) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      throw new Error(`Línea ${index + 1} del archivo de registros no es JSON válido.`);
    }
    if (typeof parsed !== "object" || parsed === null ||
        typeof (parsed as Record<string, unknown>).evaluationId !== "string" ||
        typeof (parsed as Record<string, unknown>).versionId !== "string") {
      throw new Error(`Registro antiguo/incompatible en línea ${index + 1}. Archiva el JSONL anterior antes de continuar.`);
    }
    return parsed as EvaluationRecord;
  });
}

export function saveEvaluation(input: unknown, path = DEFAULT_RECORDS_PATH): EvaluationRecord {
  const data = parseEvaluationInput(input);
  const existing = readRecords(path);
  if (existing.some((record) => record.evaluationId === data.evaluationId)) {
    throw new Error(`La evaluación ${data.evaluationId} ya está registrada.`);
  }
  const record: EvaluationRecord = {
    ...data,
    versionId: toBytes32Id(data.commitSha),
    decision: evaluateQuality(data),
    evaluatedAt: new Date().toISOString(),
  };
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify(record) + "\n", "utf8");
  return record;
}

export function getEvaluation(evaluationId: string, path = DEFAULT_RECORDS_PATH): EvaluationRecord | undefined {
  return readRecords(path).find((record) => record.evaluationId === evaluationId);
}

export function getEvaluationHistoryByVersion(commitSha: string, path = DEFAULT_RECORDS_PATH): EvaluationRecord[] {
  const versionId = toBytes32Id(commitSha);
  return readRecords(path).filter((record) => record.versionId === versionId);
}

export function hasVersion(commitSha: string, path = DEFAULT_RECORDS_PATH): boolean {
  return getEvaluationHistoryByVersion(commitSha, path).length > 0;
}

/** "Última" significa última incorporada al archivo, equivalente al índice de Solidity. */
export function getLatestEvaluationByVersion(commitSha: string, path = DEFAULT_RECORDS_PATH): EvaluationRecord | undefined {
  return getEvaluationHistoryByVersion(commitSha, path).at(-1);
}
