import { describe, expect, it } from "vitest";
import {
  ARC_CHAIN_ID,
  getMintContractAddressByChainId,
  getNetworkById,
  getTxExplorerLinkByChainId,
} from "./networks";

describe("network mint configuration", () => {
  it("has ARC mainnet config with USDC gas and ordered RPC fallback", () => {
    const arcMainnet = getNetworkById(5042);

    expect(arcMainnet.id).toBe(5042);
    expect(arcMainnet.currencySymbol).toBe("USDC");
    expect(arcMainnet.rpcUrl).toBe("https://rpc.mainnet.arc.io");
    expect(arcMainnet.rpcFallbackUrls).toEqual([
      "https://rpc.blockdaemon.mainnet.arc.io",
      "https://rpc.drpc.mainnet.arc.io",
      "https://rpc.quicknode.mainnet.arc.io",
    ]);

    expect([5042, 5042002]).toContain(ARC_CHAIN_ID);
  });

  it("resolves mint contract address from network config by chainId", () => {
    expect(getMintContractAddressByChainId(5042002)).toBe(
      "0x81699F9516123a33b3f57EA2944A1cCBd7bC17ae"
    );
  });

  it("throws a clear business error when network has no nft contract address", () => {
    expect(() => getMintContractAddressByChainId(421614)).toThrow(
      "Mint is not configured for this network yet."
    );
  });

  it("builds transaction explorer link from the chain that minted", () => {
    const txHash = "0xabc123";
    const baseNetwork = getNetworkById(8453);

    const link = getTxExplorerLinkByChainId(txHash, 8453);

    expect(link).toBe(
      `${baseNetwork.blockExplorer.replace(/\/$/, "")}/tx/${txHash}`
    );
  });
});
