import { readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { Contract, JsonRpcProvider, Wallet, isAddress } from "ethers";
import { homedir } from "node:os";

import { parseEvaluationInput, toBytes32Id } from "./conventional-records.js";
import { evaluateQuality } from "./quality-rules.js";

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error("Uso: npm run verify:blockchain -- examples/E1.json");
  }

  // 1. Leer y validar las métricas.
  const input = parseEvaluationInput(
    JSON.parse(readFileSync(inputPath, "utf8")),
  );

  const expectedDecision = evaluateQuality(input);
  const evaluationId = toBytes32Id(input.evaluationId);
  const versionId = toBytes32Id(input.commitSha);

  const targetNetwork = process.env.TARGET_NETWORK ?? "anvil";

  if (!["anvil", "sepolia"].includes(targetNetwork)) {
    throw new Error("TARGET_NETWORK debe ser anvil o sepolia.");
  }

  const rpcUrl =
    targetNetwork === "sepolia"
      ? process.env.SEPOLIA_RPC_URL
      : (process.env.RPC_URL ?? "http://127.0.0.1:8545");

  if (!rpcUrl) {
    throw new Error("No se configuró la URL del RPC.");
  }

  const address = process.env.CONTRACT;

  if (!address || !isAddress(address)) {
    throw new Error("Configura CONTRACT.");
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();

  const expectedChainId = targetNetwork === "sepolia" ? 11155111n : 31337n;

  if (network.chainId !== expectedChainId) {
    throw new Error(
      `Red incorrecta. Esperada: ${expectedChainId}, ` +
        `obtenida: ${network.chainId}`,
    );
  }

  let signer;

  if (targetNetwork === "anvil") {
    signer = await provider.getSigner(0);
  } else {
    const keystorePassword = process.env.SEPOLIA_KEYSTORE_PASSWORD;

    if (!keystorePassword) {
      throw new Error("Falta SEPOLIA_KEYSTORE_PASSWORD.");
    }

    const keystorePath = resolve(
      homedir(),
      ".foundry",
      "keystores",
      "sepoliaDev",
    );

    const encryptedJson = readFileSync(keystorePath, "utf8");

    const wallet = await Wallet.fromEncryptedJson(
      encryptedJson,
      keystorePassword,
    );

    signer = wallet.connect(provider);
  }

  const artifact = JSON.parse(
    readFileSync(
      resolve(
        "blockchain/out/QualityVerification.sol/QualityVerification.json",
      ),
      "utf8",
    ),
  );

  const contract = new Contract(address, artifact.abi, signer);

  if ((await provider.getCode(address)) === "0x") {
    throw new Error("El contrato no existe en esta red.");
  }

  const authorized = await contract.authorizedEvaluator();

  if (authorized.toLowerCase() !== (await signer.getAddress()).toLowerCase()) {
    throw new Error("La cuenta no está autorizada para registrar.");
  }

  // 3. Medir desde el envío hasta la confirmación.
  const start = performance.now();

  const tx = await contract.recordEvaluation(
    evaluationId,
    versionId,
    input.linesCovered,
    input.linesTotal,
    input.eslintErrors,
  );

  console.log("Transacción enviada:", tx.hash);

  // Esperar una confirmación.
  const receipt = await tx.wait(1);

  const verificationMs = performance.now() - start;

  if (!receipt || receipt.status !== 1) {
    throw new Error("La transacción no se confirmó correctamente.");
  }

  // 4. Recuperar y comprobar la decisión registrada.
  const stored = await contract.getEvaluation(evaluationId);

  const decision = stored.approved ? "APROBADO" : "RECHAZADO";

  if (
    !stored.exists ||
    stored.versionId.toLowerCase() !== versionId.toLowerCase() ||
    Number(stored.linesCovered) !== input.linesCovered ||
    Number(stored.linesTotal) !== input.linesTotal ||
    Number(stored.eslintErrors) !== input.eslintErrors ||
    decision !== expectedDecision
  ) {
    throw new Error("El registro blockchain no coincide con la entrada.");
  }

  // 5. Conservar evidencia local de la transacción.
  const result = {
    scenarioId: input.scenarioId,
    evaluationId: input.evaluationId,
    evaluationIdBytes32: evaluationId,
    commitSha: input.commitSha,
    versionId,
    ruleVersion: input.ruleVersion,
    linesCovered: input.linesCovered,
    linesTotal: input.linesTotal,
    eslintErrors: input.eslintErrors,
    decision,
    recordedAt: Number(stored.recordedAt),
    chainId: Number(network.chainId),
    contractAddress: address,
    transactionHash: tx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: Number(receipt.gasUsed),
    verificationMs: Number(verificationMs.toFixed(3)),
  };

  const outputPath = resolve(
    targetNetwork === "sepolia"
      ? "prototype-data/blockchain-sepolia-dev.jsonl"
      : "prototype-data/blockchain.jsonl",
  );

  mkdirSync(dirname(outputPath), { recursive: true });
  appendFileSync(outputPath, JSON.stringify(result) + "\n", "utf8");

  console.log(JSON.stringify(result, null, 2));
  console.log("Evidencia guardada en:", outputPath);
}

main().catch((error: unknown) => {
  console.error(
    "Error blockchain:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
