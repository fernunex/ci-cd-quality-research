import { describe, expect, it } from "vitest";
import { evaluateQuality } from "../src/quality-rules.js";

describe("Modelo de calidad v1", () => {
  it.each([
    [90, 100, 0, "APROBADO"],  // E1
    [70, 100, 0, "RECHAZADO"], // E2
    [90, 100, 2, "RECHAZADO"], // E3
    [70, 100, 2, "RECHAZADO"], // E4
    [80, 100, 0, "APROBADO"],  // Umbral exacto
    [79, 100, 0, "RECHAZADO"], // Justo debajo del umbral
  ] as const)("cobertura %i/%i, errores %i -> %s", (covered, total, errors, expected) => {
    expect(evaluateQuality({ linesCovered: covered, linesTotal: total, eslintErrors: errors }))
      .toBe(expected);
  });

  it("rechaza entradas inválidas sin confundirlas con rechazo de calidad", () => {
    expect(() => evaluateQuality({ linesCovered: 0, linesTotal: 0, eslintErrors: 0 })).toThrow();
    expect(() => evaluateQuality({ linesCovered: 101, linesTotal: 100, eslintErrors: 0 })).toThrow();
    expect(() => evaluateQuality({ linesCovered: 90, linesTotal: 100, eslintErrors: -1 })).toThrow();
    expect(() => evaluateQuality({ linesCovered: 90.5, linesTotal: 100, eslintErrors: 0 })).toThrow();
  });
});
