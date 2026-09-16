import fs from "node:fs/promises";
import path from "node:path";
import { formatUnits } from "viem";
import { network } from "hardhat";

const ARC_MAINNET_CHAIN_ID = 5042;
const REQUIRED_HARDHAT_NETWORK = "arcMainnet";
const DISPLAY_NETWORK_NAME = "Arc Mainnet";

const isMissingPrivateKey = () => {
  const key = String(process.env.DEPLOYER_PRIVATE_KEY || "").trim();
  if (!key) {
    return true;
  }

  const normalized = key.toLowerCase();
  return normalized.includes("your_") || normalized.includes("replace") || normalized === "0x";
};

const ensureMainnetPreflight = async (provider) => {
  const chainIdHex = await provider.send("eth_chainId", []);
  const chainId = Number.parseInt(chainIdHex, 16);
  const blockNumber = await provider.getBlockNumber();

  if (chainId !== ARC_MAINNET_CHAIN_ID) {
    throw new Error(
      `Invalid chainId from RPC. Expected ${ARC_MAINNET_CHAIN_ID}, got ${chainId}. Check ARC mainnet RPC configuration.`
    );
  }

  return { chainId, blockNumber };
};

const ensureSufficientGasBudget = async ({ provider, factory, deployer }) => {
  const balance = await provider.getBalance(deployer.address);
  if (balance <= 0n) {
    throw new Error(
      "Deployer balance is 0. ARC mainnet uses USDC as native gas token. Fund wallet with gas USDC before deploy."
    );
  }

  const deployTx = await factory.getDeployTransaction();
  const estimatedGas = await provider.estimateGas({
    ...deployTx,
    from: deployer.address,
  });

  const feeData = await provider.getFeeData();
  const gasUnitPrice = feeData.maxFeePerGas ?? feeData.gasPrice;

  if (!gasUnitPrice || gasUnitPrice <= 0n) {
    return {
      balance,
      estimatedGas,
      estimatedCost: null,
      gasUnitPrice: null,
    };
  }

  const estimatedCost = estimatedGas * gasUnitPrice;
  if (balance < estimatedCost) {
    throw new Error(
      `Insufficient gas USDC. Balance=${formatUnits(balance, 18)} USDC, estimated deploy cost~${formatUnits(
        estimatedCost,
        18
      )} USDC.`
    );
  }

  return {
    balance,
    estimatedGas,
    estimatedCost,
    gasUnitPrice,
  };
};

const writeDeploymentArtifact = async ({ deployer, contractAddress, txHash, chainId, blockNumber }) => {
  const outputDir = path.resolve("docs", "deployments");
  await fs.mkdir(outputDir, { recursive: true });

  const payload = {
    network: DISPLAY_NETWORK_NAME,
    hardhatNetwork: REQUIRED_HARDHAT_NETWORK,
    chainId,
    blockNumber,
    deployer,
    contract: "Game2048ResultNFT",
    contractAddress,
    deploymentTxHash: txHash,
    deployedAt: new Date().toISOString(),
  };

  const latestPath = path.join(outputDir, "arc-mainnet.latest.json");
  await fs.writeFile(latestPath, JSON.stringify(payload, null, 2), "utf8");

  return latestPath;
};

async function main() {
  const runtimeNetworkName =
    process.env.HARDHAT_NETWORK || network?.name || "unknown";

  if (runtimeNetworkName !== "unknown" && runtimeNetworkName !== REQUIRED_HARDHAT_NETWORK) {
    throw new Error(
      `This script must run with --network ${REQUIRED_HARDHAT_NETWORK}. Current: ${runtimeNetworkName}`
    );
  }

  if (isMissingPrivateKey()) {
    throw new Error("DEPLOYER_PRIVATE_KEY is missing or looks like a placeholder.");
  }

  const { ethers } = await network.getOrCreate();
  const provider = ethers.provider;
  const [deployer] = await ethers.getSigners();

  const preflight = await ensureMainnetPreflight(provider);
  console.log(`ARC preflight OK. chainId=${preflight.chainId} block=${preflight.blockNumber}`);
  console.log(`Deploying with account: ${deployer.address}`);

  const factory = await ethers.getContractFactory("Game2048ResultNFT");
  const gasBudget = await ensureSufficientGasBudget({ provider, factory, deployer });
  console.log(`Deployer balance: ${formatUnits(gasBudget.balance, 18)} USDC`);
  if (gasBudget.estimatedCost !== null) {
    console.log(`Estimated deploy cost: ~${formatUnits(gasBudget.estimatedCost, 18)} USDC`);
  }

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const txHash = contract.deploymentTransaction()?.hash || "";

  const artifactPath = await writeDeploymentArtifact({
    deployer: deployer.address,
    contractAddress,
    txHash,
    chainId: preflight.chainId,
    blockNumber: preflight.blockNumber,
  });

  console.log(`Game2048ResultNFT deployed to: ${contractAddress}`);
  console.log(`Deployment tx hash: ${txHash}`);
  console.log(`Deployment metadata: ${artifactPath}`);
}

main().catch((error) => {
  console.error("ARC mainnet deploy failed:", error.message || error);
  process.exitCode = 1;
});
