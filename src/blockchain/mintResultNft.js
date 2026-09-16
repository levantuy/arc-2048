import { createPublicClient, createWalletClient, custom, defineChain, http, parseEventLogs } from "viem";
import { GAME_2048_RESULT_NFT_ABI } from "./contracts/game2048ResultNft";
import { getMintContractAddressByChainId, getNetworkById } from "./networks";
import { getWalletProvider } from "./wallet";

const NO_DATA_ERROR_TEXTS = [
  "returned no data",
  "execution reverted",
  "0x",
];

const getCurrentWalletChainId = async () => {
  const provider = getWalletProvider();
  const chainHex = await provider.request({ method: "eth_chainId" });
  const chainId = Number.parseInt(chainHex, 16);

  if (!Number.isFinite(chainId)) {
    throw new Error("Wrong chain context. Please reconnect wallet and try again.");
  }

  return chainId;
};

const resolveMintNetwork = (chainId) => {
  const network = getNetworkById(chainId);
  if (!network) {
    throw new Error("Wrong chain context. Please switch to a supported network and try again.");
  }

  return network;
};

const toViemChain = (network) =>
  defineChain({
    id: network.id,
    name: network.name,
    nativeCurrency: {
      name: network.currencyName,
      symbol: network.currencySymbol,
      decimals: network.currencyDecimals,
    },
    rpcUrls: {
      default: { http: [network.rpcUrl] },
      public: { http: [network.rpcUrl] },
    },
    blockExplorers: {
      default: {
        name: `${network.name} Explorer`,
        url: network.blockExplorer,
      },
    },
    testnet: network.testnet,
  });

const getRpcCandidates = (network) => {
  const rpcUrls = [network.rpcUrl, ...(network.rpcFallbackUrls || [])].filter(Boolean);
  return [...new Set(rpcUrls)];
};

const createPublicClientForRpc = (network, rpcUrl) =>
  createPublicClient({
    chain: toViemChain(network),
    transport: http(rpcUrl, {
      timeout: 15000,
      retryCount: 1,
    }),
  });

const isLikelyNoDataError = (error) => {
  const joined = [
    error?.shortMessage,
    error?.message,
    error?.details,
    error?.cause?.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return NO_DATA_ERROR_TEXTS.some((text) => joined.includes(text));
};

const resolveReadableClient = async (network, address, chainId) => {
  const rpcCandidates = getRpcCandidates(network);
  let lastError;

  for (const rpcUrl of rpcCandidates) {
    const publicClient = createPublicClientForRpc(network, rpcUrl);

    try {
      const bytecode = await publicClient.getBytecode({ address });
      if (!bytecode || bytecode === "0x") {
        lastError = new Error(
          `Mint contract bytecode was not found at ${address} on chain ${chainId} (${network.name}) via ${rpcUrl}.`
        );
        continue;
      }

      return { publicClient, rpcUrl };
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error(
    `No working RPC endpoint was found for chain ${chainId} (${network.name}).`
  );
};

const createClients = (network) => {
  const provider = getWalletProvider();
  const chain = toViemChain(network);

  const walletClient = createWalletClient({
    chain,
    transport: custom(provider),
  });

  return { walletClient, chain };
};

export const checkGameIdMinted = async (gameId, chainId) => {
  const resolvedChainId = chainId ?? (await getCurrentWalletChainId());
  const network = resolveMintNetwork(resolvedChainId);
  const address = getMintContractAddressByChainId(resolvedChainId);
  const { publicClient, rpcUrl } = await resolveReadableClient(network, address, resolvedChainId);

  try {
    return await publicClient.readContract({
      address,
      abi: GAME_2048_RESULT_NFT_ABI,
      functionName: "isGameIdMinted",
      args: [gameId],
    });
  } catch (error) {
    if (isLikelyNoDataError(error)) {
      throw new Error(
        `Mint contract call returned no data on chain ${resolvedChainId} (${network.name}) at ${address} via ${rpcUrl}. Verify contract address, chain, and ABI.`
      );
    }
    throw error;
  }
};

export const mintResultNft = async ({
  account,
  score,
  durationSeconds,
  gameId,
  playedAt,
  chainId,
  onTxSubmitted,
}) => {
  const resolvedChainId = chainId ?? (await getCurrentWalletChainId());
  const network = resolveMintNetwork(resolvedChainId);
  const address = getMintContractAddressByChainId(resolvedChainId);
  const { walletClient, chain } = createClients(network);
  const { publicClient } = await resolveReadableClient(network, address, resolvedChainId);

  const [connectedAccount] = await walletClient.getAddresses();
  if (!connectedAccount || connectedAccount.toLowerCase() !== account.toLowerCase()) {
    throw new Error("Connected wallet account mismatch.");
  }

  const txHash = await walletClient.writeContract({
    chain,
    address,
    abi: GAME_2048_RESULT_NFT_ABI,
    functionName: "mintResult",
    args: [account, BigInt(score), BigInt(durationSeconds), gameId, BigInt(playedAt)],
    account,
  });

  if (typeof onTxSubmitted === "function") {
    onTxSubmitted(txHash);
  }

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    timeout: 120000,
    pollingInterval: 1500,
  });

  const resultEvents = parseEventLogs({
    abi: GAME_2048_RESULT_NFT_ABI,
    eventName: "ResultMinted",
    logs: receipt.logs,
  });

  const tokenId = resultEvents[0]?.args?.tokenId?.toString() || "";
  return { txHash, tokenId, chainId: resolvedChainId };
};
