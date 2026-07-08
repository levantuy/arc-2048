import hardhatEthersPlugin from "@nomicfoundation/hardhat-ethers";
import hardhatEthersChaiMatchersPlugin from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatMochaPlugin from "@nomicfoundation/hardhat-mocha";
import dotenv from "dotenv";
import { createRequire } from "module";
import { defineConfig } from "hardhat/config";

const require = createRequire(import.meta.url);

dotenv.config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const ARC_RPC_URL = process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network";
const OPTIMISM_SEPOLIA_RPC_URL =
  process.env.OPTIMISM_SEPOLIA_RPC_URL || "https://sepolia.optimism.io";
const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const ARBITRUM_SEPOLIA_RPC_URL =
  process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
const BASE_SEPOLIA_RPC_URL =
  process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const POLYGON_AMOY_RPC_URL =
  process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc";
const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";
const OPTIMISM_RPC_URL = process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io";

const accounts = PRIVATE_KEY ? [PRIVATE_KEY] : [];

const config = defineConfig({
  plugins: [hardhatEthersPlugin, hardhatEthersChaiMatchersPlugin, hardhatMochaPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.35",
        path: require.resolve("solc/soljson.js"),
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    arcTestnet: {
      type: "http",
      chainType: "l1",
      url: ARC_RPC_URL,
      chainId: 5042002,
      accounts,
    },
    optimismSepolia: {
      type: "http",
      chainType: "l1",
      url: OPTIMISM_SEPOLIA_RPC_URL,
      chainId: 11155420,
      accounts,
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: SEPOLIA_RPC_URL,
      chainId: 11155111,
      accounts,
    },
    arbitrumSepolia: {
      type: "http",
      chainType: "l1",
      url: ARBITRUM_SEPOLIA_RPC_URL,
      chainId: 421614,
      accounts,
    },
    baseSepolia: {
      type: "http",
      chainType: "l1",
      url: BASE_SEPOLIA_RPC_URL,
      chainId: 84532,
      accounts,
    },
    polygonAmoy: {
      type: "http",
      chainType: "l1",
      url: POLYGON_AMOY_RPC_URL,
      chainId: 80002,
      accounts,
    },
    arbitrum: {
      type: "http",
      chainType: "l1",
      url: ARBITRUM_RPC_URL,
      chainId: 42161,
      accounts,
    },
    base: {
      type: "http",
      chainType: "l1",
      url: BASE_RPC_URL,
      chainId: 8453,
      accounts,
    },
    polygon: {
      type: "http",
      chainType: "l1",
      url: POLYGON_RPC_URL,
      chainId: 137,
      accounts,
    },
    optimism: {
      type: "http",
      chainType: "l1",
      url: OPTIMISM_RPC_URL,
      chainId: 10,
      accounts,
    },
  },
});

export default config;
