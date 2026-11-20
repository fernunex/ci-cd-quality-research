
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  Contract,
  JsonRpcProvider,
  isAddress,
  isHexString,
} from "ethers";
import { toBytes32Id } from "./conventional-records.js";

function asBytes32(identifier: string): string {
  // Acepta un bytes32 existente o un identificador textual.
  return isHexString(identifier, 32)
    ? identifier
    : toBytes32Id(identifier);
}

function formatEvaluation(record: any) {
  return {
    versionId: record.versionId,
    recordedAt: Number(record.recordedAt),
    linesCovered: Number(record.linesCovered),
    linesTotal: Number(record.linesTotal),
    eslintErrors: Number(record.eslintErrors),
    decision: record.approved ? "APROBADO" : "RECHAZADO",
    exists: record.exists,
  };
}

async function main() {
  const [action, identifier] = process.argv.slice(2);

  if (
    !identifier ||
    !["id", "version", "exists"].includes(action)
  ) {
    throw new Error(
      "Uso: npm run query:blockchain -- " +
      "<id|version|exists> <identificador>"
    );
  }

  const rpcUrl =
    process.env.RPC_URL ?? "http://127.0.0.1:8545";

  const address = process.env.CONTRACT;

  if (!address || !isAddress(address)) {
    throw new Error("Configura CONTRACT con una dirección válida.");
  }

  const artifactPath = resolve(
    "blockchain/out/QualityVerification.sol/QualityVerification.json"
  );

  const artifact = JSON.parse(
    readFileSync(artifactPath, "utf8")
  );

  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();

  if ((await provider.getCode(address)) === "0x") {
    throw new Error("No existe un contrato en esa dirección y red.");
  }

  const contract = new Contract(
    address,
    artifact.abi,
    provider
  );

  const id = asBytes32(identifier);

  let result: unknown;

  if (action === "exists") {
    result = {
      versionId: id,
      exists: await contract.hasVersion(id),
    };
  } else if (action === "id") {
    const record = await contract.getEvaluation(id);

    result = {
      evaluationId: id,
      ...formatEvaluation(record),
    };
  } else {
    const latest =
      await contract.getLatestEvaluationByVersion(id);

    result = {
      evaluationId: latest[0],
      ...formatEvaluation(latest[1]),
    };
  }

  console.log(
    JSON.stringify(
      {
        chainId: network.chainId.toString(),
        contract: address,
        result,
      },
      null,
      2
    )
  );
}

main().catch((error: unknown) => {
  console.error(
    "Error blockchain:",
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
});

