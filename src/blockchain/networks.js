import { GAME_2048_RESULT_NFT_ADDRESS } from "./contracts/game2048ResultNft";

const SEPOLIA_RPC_URL =
  import.meta.env.VITE_SEPOLIA_RPC_URL || "https://rpc.sepolia.org";

const ARC_MAINNET_CHAIN_ID = 5042;
const ARC_TESTNET_CHAIN_ID = 5042002;

const buildAlchemyMainnetHttpUrl = (apiKey) =>
  apiKey ? `https://arc-mainnet.g.alchemy.com/v2/${apiKey}` : "";

const buildAlchemyMainnetWsUrl = (apiKey) =>
  apiKey ? `wss://arc-mainnet.g.alchemy.com/v2/${apiKey}` : "";

const getArcMainnetDefaults = () => {
  const alchemyApiKey = import.meta.env.VITE_ARC_MAINNET_ALCHEMY_API_KEY || "";
  const alchemyHttpUrl = buildAlchemyMainnetHttpUrl(alchemyApiKey);
  const alchemyWsUrl = buildAlchemyMainnetWsUrl(alchemyApiKey);

  const fallbackRpcUrls = [
    "https://rpc.blockdaemon.mainnet.arc.io",
    "https://rpc.drpc.mainnet.arc.io",
    "https://rpc.quicknode.mainnet.arc.io",
    alchemyHttpUrl,
  ].filter(Boolean);

  const wsUrls = [
    "wss://rpc.blockdaemon.mainnet.arc.io/websocket",
    "wss://rpc.quicknode.mainnet.arc.io",
    alchemyWsUrl,
  ].filter(Boolean);

  return {
    id: ARC_MAINNET_CHAIN_ID,
    name: "Arc Mainnet",
    network: "arcMainnet",
    rpcUrl: "https://rpc.mainnet.arc.io",
    rpcFallbackUrls: fallbackRpcUrls,
    wsUrls,
    blockExplorer: "https://explorer.arc.io",
    currencyName: "USDC",
    currencySymbol: "USDC",
    currencyDecimals: 18,
    nftContractAddress: "",
    testnet: false,
    permissioned: true,
  };
};

const ARC_MAINNET_DEFAULTS = getArcMainnetDefaults();

const ARC_TESTNET_DEFAULTS = {
  id: ARC_TESTNET_CHAIN_ID,
  name: "Arc Testnet",
  network: "arcTestnet",
  rpcUrl: "https://rpc.testnet.arc.io",
  rpcFallbackUrls: [
    "https://rpc.blockdaemon.testnet.arc.io",
    "https://rpc.drpc.testnet.arc.io",
    "https://rpc.quicknode.testnet.arc.io",
  ],
  wsUrls: [
    "wss://rpc.testnet.arc.io",
    "wss://rpc.blockdaemon.testnet.arc.io/websocket",
    "wss://rpc.drpc.testnet.arc.io",
    "wss://rpc.quicknode.testnet.arc.io",
  ],
  blockExplorer: "https://explorer.testnet.arc.io",
  currencyName: "USDC",
  currencySymbol: "USDC",
  currencyDecimals: 18,
  nftContractAddress: "0x81699F9516123a33b3f57EA2944A1cCBd7bC17ae",
  testnet: true,
  permissioned: false,
};

const SUPPORTED_NETWORKS_BASE = [
  ARC_MAINNET_DEFAULTS,
  ARC_TESTNET_DEFAULTS,
  {
    id: 11155420,
    name: "Optimism Sepolia",
    network: "optimismSepolia",
    rpcUrl: "https://sepolia.optimism.io",
    blockExplorer: "https://sepolia-optimism.etherscan.io",
    currencyName: "Sepolia Ether",
    currencySymbol: "ETH",
    currencyDecimals: 18,
    nftContractAddress: "0xEdB581AEBBad5553c24898E2F64F790e17927326",
    testnet: true,
  },
  {
    id: 11155111,
    name: "Sepolia",
    network: "sepolia",
    rpcUrl: SEPOLIA_RPC_URL,
    blockExplorer: "https://sepolia.etherscan.io",
    currencyName: "Sepolia Ether",
    currencySymbol: "ETH",
    currencyDecimals: 18,
    nftContractAddress: "0x716077DB2A5ec3689dDf45EE3C64CB9160abCa2B",
    testnet: true,
  },
  {
    id: 421614,
    name: "Arbitrum Sepolia",
    network: "arbitrumSepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorer: "https://sepolia.arbiscan.io",
    currencyName: "Sepolia Ether",
    currencySymbol: "ETH",
    currencyDecimals: 18,
    nftContractAddress: "",
    testnet: true,
  },
  {
    id: 84532,
    name: "Base Sepolia",
    network: "baseSepolia",
    rpcUrl: "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
    currencyName: "Sepolia Ether",
    currencySymbol: "ETH",
    currencyDecimals: 18,
    nftContractAddress: "0x95b8b2c35525aF17dA88DC74665ee0787d3D16D0",
    testnet: true,
  },
  {
    id: 80002,
    name: "Polygon Amoy",
    network: "polygonAmoy",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    blockExplorer: "https://amoy.polygonscan.com",
    currencyName: "MATIC",
    currencySymbol: "MATIC",
    currencyDecimals: 18,
    nftContractAddress: "0x95bfa7d286B6720ca7dd097D60Ae289C3c740939",
    testnet: true,
  },
  {
    id: 42161,
    name: "Arbitrum One",
    network: "arbitrum",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io",
    currencyName: "Ether",
    currencySymbol: "ETH",
    currencyDecimals: 18,
    nftContractAddress: "0x12FCf0B1AE124737dD47F584bcC66B865Af2666D",
    testnet: false,
  },
  {
    id: 8453,
    name: "Base",
    network: "base",
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    currencyName: "Ether",
    currencySymbol: "ETH",
    currencyDecimals: 18,
    nftContractAddress: "0x0b65b241B7D91f8f41Ae31784288bcC5636431DB",
    testnet: false,
  },
  {
    id: 137,
    name: "Polygon",
    network: "polygon",
    rpcUrl: "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
    currencyName: "MATIC",
    currencySymbol: "MATIC",
    currencyDecimals: 18,
    nftContractAddress: "",
    testnet: false,
  },
  {
    id: 10,
    name: "Optimism",
    network: "optimism",
    rpcUrl: "https://mainnet.optimism.io",
    blockExplorer: "https://optimistic.etherscan.io",
    currencyName: "Ether",
    currencySymbol: "ETH",
    currencyDecimals: 18,
    nftContractAddress: "0x95b8b2c35525aF17dA88DC74665ee0787d3D16D0",
    testnet: false,
  },
];

const MINT_NOT_CONFIGURED_ERROR = "Mint is not configured for this network yet.";

export const ARC_CHAIN_ID = Number(import.meta.env.VITE_ARC_CHAIN_ID || ARC_MAINNET_CHAIN_ID);

const getArcNetworkWithEnvOverrides = () => {
  const arcFromList = SUPPORTED_NETWORKS_BASE.find((network) => network.id === ARC_CHAIN_ID);
  if (!arcFromList) {
    throw new Error(`Arc configuration for chainId ${ARC_CHAIN_ID} is missing.`);
  }

  const fallbackFromEnv = (import.meta.env.VITE_ARC_RPC_FALLBACK_URLS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const wsFromEnv = (import.meta.env.VITE_ARC_RPC_WS_URLS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const defaultWsFromSingle = import.meta.env.VITE_ARC_RPC_WS_URL
    ? [import.meta.env.VITE_ARC_RPC_WS_URL]
    : [];

  const mergedWsUrls = wsFromEnv.length > 0 ? wsFromEnv : defaultWsFromSingle;

  return {
    ...arcFromList,
    id: ARC_CHAIN_ID,
    name: import.meta.env.VITE_ARC_CHAIN_NAME || arcFromList.name,
    rpcUrl: import.meta.env.VITE_ARC_RPC_URL || arcFromList.rpcUrl,
    rpcFallbackUrls: fallbackFromEnv.length > 0 ? fallbackFromEnv : arcFromList.rpcFallbackUrls,
    wsUrls: mergedWsUrls.length > 0 ? mergedWsUrls : arcFromList.wsUrls,
    blockExplorer: import.meta.env.VITE_ARC_EXPLORER_URL || arcFromList.blockExplorer,
    nftContractAddress: GAME_2048_RESULT_NFT_ADDRESS || arcFromList.nftContractAddress,
  };
};

const ARC_NETWORK_WITH_ENV = getArcNetworkWithEnvOverrides();

export const SUPPORTED_NETWORKS = SUPPORTED_NETWORKS_BASE.map((network) =>
  network.id === ARC_NETWORK_WITH_ENV.id ? ARC_NETWORK_WITH_ENV : network
);

export const getNetworkById = (networkId) =>
  SUPPORTED_NETWORKS.find((network) => network.id === Number(networkId));

export const getMintContractAddressByChainId = (chainId) => {
  const network = getNetworkById(chainId);

  if (!network?.nftContractAddress) {
    throw new Error(MINT_NOT_CONFIGURED_ERROR);
  }

  return network.nftContractAddress;
};

export const getTxExplorerLinkByChainId = (txHash, chainId) => {
  if (!txHash) return "";

  const network = getNetworkById(chainId);
  if (!network?.blockExplorer) return "";

  return `${network.blockExplorer.replace(/\/$/, "")}/tx/${txHash}`;
};

export const ARC_NETWORK = getNetworkById(ARC_CHAIN_ID) || ARC_NETWORK_WITH_ENV;

export const toWalletChainParams = (network) => ({
  chainId: `0x${Number(network.id).toString(16)}`,
  chainName: network.name,
  nativeCurrency: {
    name: network.currencyName,
    symbol: network.currencySymbol,
    decimals: network.currencyDecimals,
  },
  rpcUrls: [network.rpcUrl, ...(network.rpcFallbackUrls || [])],
  blockExplorerUrls: [network.blockExplorer],
});
