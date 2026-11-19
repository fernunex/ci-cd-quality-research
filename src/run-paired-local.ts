
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  appendFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

type EvaluationRecord = {
  evaluationId: string;
  [key: string]: unknown;
};

const scenarios = ["E1", "E2", "E3", "E4"];

function runVerifier(script: string, inputPath: string): void {
  const result = spawnSync(
    "npm",
    ["run", script, "--", inputPath],
    {
      stdio: "inherit",
      cwd: process.cwd(),
      env: process.env,
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Falló ${script}`);
  }
}

function findRecord(
  filePath: string,
  evaluationId: string
): EvaluationRecord {
  const lines = readFileSync(filePath, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  const matches = lines
    .map((line) => JSON.parse(line) as EvaluationRecord)
    .filter((record) => record.evaluationId === evaluationId);

  if (matches.length !== 1) {
    throw new Error(
      `Se esperó un registro único para ${evaluationId}; ` +
      `se encontraron ${matches.length}`
    );
  }

  return matches[0];
}


function main(): void {
  const tempDir = mkdtempSync(
    join(tmpdir(), "quality-paired-")
  );

  try {
    for (const scenario of scenarios) {
      const fixturePath = resolve(
        `examples/${scenario}.json`
      );

      const input = JSON.parse(
        readFileSync(fixturePath, "utf8")
      );

      // ID nuevo en cada ejecución.
      const evaluationId =
        `${scenario}-P${randomUUID()}`;

      input.evaluationId = evaluationId;

      // Ambos mecanismos reciben el mismo archivo.
      const temporaryInput = join(
        tempDir,
        `${scenario}.json`
      );

      writeFileSync(
        temporaryInput,
        JSON.stringify(input, null, 2)
      );

      console.log(
        `\n=== ${scenario}: ${evaluationId} ===`
      );

      runVerifier(
        "verify:conventional",
        temporaryInput
      );

      runVerifier(
        "verify:blockchain",
        temporaryInput
      );

      const conventional = findRecord(
        resolve("prototype-data/conventional.jsonl"),
        evaluationId
      );

      const blockchain = findRecord(
        resolve("prototype-data/blockchain.jsonl"),
        evaluationId
      );

      const conventionalTiming = findRecord(
  resolve("prototype-data/conventional-timings.jsonl"),
  evaluationId
);

const conventionalVerificationMs =
  Number(conventionalTiming.verificationMs);

const blockchainVerificationMs =
  Number(blockchain.verificationMs);

if (
  !Number.isFinite(conventionalVerificationMs) ||
  !Number.isFinite(blockchainVerificationMs) ||
  conventionalVerificationMs < 0 ||
  blockchainVerificationMs < 0
) {
  throw new Error("Duración de verificación inválida.");
}

      const fields = [
        "scenarioId",
        "commitSha",
        "versionId",
        "ruleVersion",
        "linesCovered",
        "linesTotal",
        "eslintErrors",
        "decision",
      ] as const;

      const differences = fields.filter(
        (field) =>
          conventional[field] !== blockchain[field]
      );

      if (differences.length > 0) {
        throw new Error(
          `Diferencias en ${evaluationId}: ` +
          differences.join(", ")
        );
      }

      const summary = {
  scenarioId: scenario,
  evaluationId,
  decision: blockchain.decision,
  concordant: true,
  conventionalVerificationMs,
  blockchainVerificationMs,
  differenceMs: Number(
    (
      blockchainVerificationMs -
      conventionalVerificationMs
    ).toFixed(3)
  ),
  gasUsed: blockchain.gasUsed,
  transactionHash: blockchain.transactionHash,
  chainId: blockchain.chainId,
};

      appendFileSync(
        resolve("prototype-data/paired-local.jsonl"),
        JSON.stringify(summary) + "\n"
      );

      console.log(
        `Resultado pareado: ${scenario} CONCORDANTE`
      );
    }
  } finally {
    rmSync(tempDir, {
      recursive: true,
      force: true,
    });
  }
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
