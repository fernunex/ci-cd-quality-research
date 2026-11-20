import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getEvaluation,
  getEvaluationHistoryByVersion,
  getLatestEvaluationByVersion,
  hasVersion,
  saveEvaluation,
  toBytes32Id,
} from "../src/conventional-records.js";

const base = {
  scenarioId: "E1",
  commitSha: "commit-prueba-1",
  ruleVersion: "v1",
  linesCovered: 90,
  linesTotal: 100,
  eslintErrors: 0,
};

let directory: string;
let file: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "quality-records-"));
  file = join(directory, "records.jsonl");
});

afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("Consultas del registro convencional", () => {
  it("permite recuperar una evaluación por su ID", () => {
    const record = saveEvaluation({ ...base, evaluationId: "E1-R1" }, file);
    expect(record.decision).toBe("APROBADO");
    expect(record.versionId).toBe(toBytes32Id(base.commitSha));
    expect(getEvaluation("E1-R1", file)?.decision).toBe("APROBADO");
  });

  it("permite consultar la última evaluación y todo el historial de una versión", () => {
    saveEvaluation({ ...base, evaluationId: "E1-R1" }, file);
    saveEvaluation({ ...base, evaluationId: "E1-R2", linesCovered: 70 }, file);
    expect(hasVersion(base.commitSha, file)).toBe(true);
    expect(getLatestEvaluationByVersion(base.commitSha, file)?.evaluationId).toBe("E1-R2");
    expect(getLatestEvaluationByVersion(base.commitSha, file)?.decision).toBe("RECHAZADO");
    expect(getEvaluationHistoryByVersion(base.commitSha, file)).toHaveLength(2);
    expect(getEvaluation("E1-R1", file)?.decision).toBe("APROBADO");
  });

  it("distingue versiones sin evaluaciones", () => {
    expect(hasVersion("otro-commit", file)).toBe(false);
    expect(getLatestEvaluationByVersion("otro-commit", file)).toBeUndefined();
    expect(getEvaluation("desconocido", file)).toBeUndefined();
  });

  it("impide duplicar identificadores de evaluación", () => {
    saveEvaluation({ ...base, evaluationId: "E1-R1" }, file);
    expect(() => saveEvaluation({ ...base, evaluationId: "E1-R1" }, file))
      .toThrow(/ya está registrada/);
  });

  it("aplica el rango uint32 para las métricas del contrato", () => {
    expect(() => saveEvaluation({ ...base, evaluationId: "X", linesTotal: 2 ** 32 }, file))
      .toThrow(/uint32/);
  });
});
