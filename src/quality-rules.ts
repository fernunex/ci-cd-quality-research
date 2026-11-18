/** Modelo de calidad, versión v1. Los valores son conteos enteros. */
export interface QualityMetrics {
  linesCovered: number;
  linesTotal: number;
  eslintErrors: number;
}

export type QualityDecision = "APROBADO" | "RECHAZADO";

export function validateMetrics(value: unknown): QualityMetrics {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Las métricas deben ser un objeto.");
  }

  const data = value as Record<string, unknown>;
  for (const key of ["linesCovered", "linesTotal", "eslintErrors"]) {
    const n = data[key];
    if (typeof n !== "number" || !Number.isSafeInteger(n) || n < 0) {
      throw new Error(`${key} debe ser un entero no negativo y seguro.`);
    }
  }

  const linesCovered = data.linesCovered as number;
  const linesTotal = data.linesTotal as number;
  const eslintErrors = data.eslintErrors as number;

  if (linesTotal === 0) {
    throw new Error("linesTotal debe ser mayor que cero.");
  }
  if (linesCovered > linesTotal) {
    throw new Error("linesCovered no puede superar linesTotal.");
  }

  return { linesCovered, linesTotal, eslintErrors };
}

export function evaluateQuality(value: unknown): QualityDecision {
  const { linesCovered, linesTotal, eslintErrors } = validateMetrics(value);
  // BigInt evita pérdida de precisión en la multiplicación de enteros.
  const enoughCoverage = BigInt(linesCovered) * 100n >= BigInt(linesTotal) * 80n;
  return enoughCoverage && eslintErrors === 0 ? "APROBADO" : "RECHAZADO";
}
