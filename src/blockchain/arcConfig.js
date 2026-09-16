import { defineChain } from "viem";
import { ARC_NETWORK } from "./networks";

const CHAIN_ID = ARC_NETWORK.id;
const CHAIN_HEX = `0x${CHAIN_ID.toString(16)}`;
const RPC_FALLBACK_URLS = ARC_NETWORK.rpcFallbackUrls || [];
const RPC_WS_URLS = ARC_NETWORK.wsUrls || [];

export const ARC_CHAIN_CONFIG = {
  chainId: CHAIN_ID,
  chainHex: CHAIN_HEX,
  chainName: ARC_NETWORK.name,
  rpcUrl: ARC_NETWORK.rpcUrl,
  rpcFallbackUrls: RPC_FALLBACK_URLS,
  rpcWsUrls: RPC_WS_URLS,
  explorerUrl: ARC_NETWORK.blockExplorer,
  permissioned: Boolean(ARC_NETWORK.permissioned),
  nativeCurrency: {
    name: ARC_NETWORK.currencyName,
    symbol: ARC_NETWORK.currencySymbol,
    decimals: ARC_NETWORK.currencyDecimals,
  },
};

export const ARC_CHAIN_FOR_WALLET = {
  chainId: ARC_CHAIN_CONFIG.chainHex,
  chainName: ARC_CHAIN_CONFIG.chainName,
  nativeCurrency: ARC_CHAIN_CONFIG.nativeCurrency,
  rpcUrls: [ARC_CHAIN_CONFIG.rpcUrl, ...ARC_CHAIN_CONFIG.rpcFallbackUrls],
  blockExplorerUrls: [ARC_CHAIN_CONFIG.explorerUrl],
};

const arcHttpUrls = [ARC_CHAIN_CONFIG.rpcUrl, ...ARC_CHAIN_CONFIG.rpcFallbackUrls];
const arcWsUrls = ARC_CHAIN_CONFIG.rpcWsUrls;

export const ARC_VIEM_CHAIN = defineChain({
  id: ARC_CHAIN_CONFIG.chainId,
  name: ARC_CHAIN_CONFIG.chainName,
  nativeCurrency: ARC_CHAIN_CONFIG.nativeCurrency,
  rpcUrls: {
    default: {
      http: arcHttpUrls,
      ...(arcWsUrls.length > 0 ? { webSocket: arcWsUrls } : {}),
    },
    public: {
      http: arcHttpUrls,
      ...(arcWsUrls.length > 0 ? { webSocket: arcWsUrls } : {}),
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: ARC_CHAIN_CONFIG.explorerUrl,
    },
  },
  testnet: ARC_NETWORK.testnet,
});

export const getTxExplorerLink = (txHash) => {
  if (!txHash) return "";
  return `${ARC_CHAIN_CONFIG.explorerUrl.replace(/\/$/, "")}/tx/${txHash}`;
};
