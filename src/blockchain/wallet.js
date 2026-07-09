import { ARC_CHAIN_CONFIG, ARC_CHAIN_FOR_WALLET } from "./arcConfig";
import { formatUnits } from "viem";
import { toWalletChainParams } from "./networks";

const METAMASK_DAPP_DEEPLINK_BASE = "https://metamask.app.link/dapp/";

const isMobileDevice = () => {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent || navigator.vendor || "";
  return /android|iphone|ipad|ipod/i.test(userAgent);
};

const getMetaMaskDeepLink = (dappUrl) => {
  const fallbackUrl =
    typeof window !== "undefined" && window.location?.href
      ? window.location.href
      : "";
  const targetUrl = String(dappUrl || fallbackUrl).replace(/^https?:\/\//i, "");
  return `${METAMASK_DAPP_DEEPLINK_BASE}${targetUrl}`;
};

const getInjectedProvider = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const { ethereum } = window;
  if (!ethereum) {
    return null;
  }

  if (Array.isArray(ethereum.providers) && ethereum.providers.length > 0) {
    return ethereum.providers.find((provider) => provider?.isMetaMask) || ethereum.providers[0];
  }

  return ethereum;
};

export class WalletUnavailableError extends Error {
  constructor() {
    super("No EVM wallet found. Please install MetaMask or another EVM wallet.");
    this.name = "WalletUnavailableError";
  }
}

export class WalletRedirectError extends Error {
  constructor(deepLink) {
    super("Redirecting to MetaMask mobile app.");
    this.name = "WalletRedirectError";
    this.deepLink = deepLink;
  }
}

export const getWalletProvider = () => {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new WalletUnavailableError();
  }
  return provider;
};

export const getCurrentAccount = async () => {
  const provider = getWalletProvider();
  const accounts = await provider.request({ method: "eth_accounts" });
  return accounts[0] || "";
};

export const getCurrentChainId = async () => {
  const provider = getWalletProvider();
  const chainHex = await provider.request({ method: "eth_chainId" });
  return Number.parseInt(chainHex, 16);
};

export const connectWallet = async () => {
  try {
    const provider = getWalletProvider();
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    return accounts[0] || "";
  } catch (error) {
    if (error?.name === "WalletUnavailableError" && isMobileDevice()) {
      const deepLink = getMetaMaskDeepLink();
      if (typeof window !== "undefined" && typeof window.location?.assign === "function") {
        try {
          window.location.assign(deepLink);
        } catch {
          // Ignore redirect errors in restricted runtimes (e.g. test environments).
        }
      }
      throw new WalletRedirectError(deepLink);
    }

    throw error;
  }
};

export const switchToNetwork = async (network) => {
  const provider = getWalletProvider();
  const chainParams = toWalletChainParams(network);

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainParams.chainId }],
    });
  } catch (error) {
    if (error?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [chainParams],
      });

      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainParams.chainId }],
      });
      return;
    }

    throw error;
  }
};

export const ensureNetwork = async (network) => {
  if (!network) {
    throw new Error("Network configuration is required.");
  }

  let currentChainId = await getCurrentChainId();
  if (currentChainId !== network.id) {
    await switchToNetwork(network);
    currentChainId = await getCurrentChainId();
  }

  if (currentChainId !== network.id) {
    throw new Error(`Wrong chain selected. Expected ${network.id}, got ${currentChainId}.`);
  }

  return currentChainId;
};

export const switchToArcNetwork = async () => {
  const provider = getWalletProvider();
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_CHAIN_CONFIG.chainHex }],
    });
  } catch (error) {
    if (error?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [ARC_CHAIN_FOR_WALLET],
      });
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC_CHAIN_CONFIG.chainHex }],
      });
      return;
    }
    throw error;
  }
};

export const getNativeBalance = async (account) => {
  if (!account) {
    return 0n;
  }

  const provider = getWalletProvider();
  const balanceHex = await provider.request({
    method: "eth_getBalance",
    params: [account, "latest"],
  });

  return BigInt(balanceHex);
};

export const formatNativeBalance = (
  balance,
  decimals = 18,
  symbol = "",
  fractionDigits = 4
) => {
  const units = formatUnits(BigInt(balance || 0), decimals);
  const [wholePart, decimalPart = ""] = units.split(".");
  const shortenedDecimals = decimalPart.slice(0, fractionDigits).replace(/0+$/, "");
  const value = shortenedDecimals ? `${wholePart}.${shortenedDecimals}` : wholePart;

  return symbol ? `${value} ${symbol}` : value;
};

export const ensureArcNetwork = async () => {
  return ensureNetwork({
    id: ARC_CHAIN_CONFIG.chainId,
    name: ARC_CHAIN_CONFIG.chainName,
    rpcUrl: ARC_CHAIN_CONFIG.rpcUrl,
    blockExplorer: ARC_CHAIN_CONFIG.explorerUrl,
    currencyName: ARC_CHAIN_CONFIG.nativeCurrency.name,
    currencySymbol: ARC_CHAIN_CONFIG.nativeCurrency.symbol,
    currencyDecimals: ARC_CHAIN_CONFIG.nativeCurrency.decimals,
  });
};
