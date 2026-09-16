import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const execFileAsync = promisify(execFile);
const ARC_MAINNET_CHAIN_ID = 5042;
const RPC_TIMEOUT_MS = Number(process.env.ARC_RPC_TIMEOUT_MS || 8000);
const MAX_RETRIES_PER_ENDPOINT = Math.max(
  1,
  Number(process.env.ARC_RPC_MAX_RETRIES || 2)
);
const POLLING_BACKOFF_MS = [1000, 2000, 4000];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeUrlList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const buildMainnetConfig = () => {
  const alchemyApiKey = process.env.ARC_MAINNET_ALCHEMY_API_KEY || "";
  const alchemyHttp = alchemyApiKey
    ? `https://arc-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
    : "";
  const alchemyWs = alchemyApiKey
    ? `wss://arc-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
    : "";

  const rpcPrimary =
    process.env.ARC_MAINNET_RPC_URL ||
    process.env.VITE_ARC_MAINNET_RPC_URL ||
    "https://rpc.mainnet.arc.io";

  const configuredFallback = normalizeUrlList(
    process.env.ARC_MAINNET_RPC_FALLBACK_URLS ||
      process.env.VITE_ARC_MAINNET_RPC_FALLBACK_URLS
  );

  const defaultFallback = [
    "https://rpc.blockdaemon.mainnet.arc.io",
    "https://rpc.drpc.mainnet.arc.io",
    "https://rpc.quicknode.mainnet.arc.io",
    alchemyHttp,
  ].filter(Boolean);

  const rpcFallback = configuredFallback.length > 0 ? configuredFallback : defaultFallback;

  const configuredWs = normalizeUrlList(
    process.env.ARC_MAINNET_WS_URLS || process.env.VITE_ARC_MAINNET_WS_URLS
  );

  const defaultWs = [
    "wss://rpc.blockdaemon.mainnet.arc.io/websocket",
    "wss://rpc.quicknode.mainnet.arc.io",
    alchemyWs,
  ].filter(Boolean);

  const wsEndpoints = configuredWs.length > 0 ? configuredWs : defaultWs;

  return {
    networkName: "Arc Mainnet",
    chainId: ARC_MAINNET_CHAIN_ID,
    explorer: "https://explorer.arc.io",
    rpcPrimary,
    rpcFallback,
    wsEndpoints,
  };
};

const toRpcError = (endpoint, attempt, cause) => {
  const message = cause?.message || String(cause || "Unknown RPC error");
  const normalized = message.toLowerCase();
  const permissionDenied =
    normalized.includes("401") ||
    normalized.includes("403") ||
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden") ||
    normalized.includes("permission") ||
    normalized.includes("credential");

  return {
    endpoint,
    attempt,
    message,
    permissionDenied,
  };
};

const rpcCall = async (endpoint, method, params = []) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    if (payload.error) {
      throw new Error(payload.error.message || "RPC error without message");
    }

    return payload.result;
  } finally {
    clearTimeout(timer);
  }
};

const preflightHttp = async (config) => {
  const endpoints = [config.rpcPrimary, ...config.rpcFallback];
  const errors = [];

  for (let index = 0; index < endpoints.length; index += 1) {
    const endpoint = endpoints[index];

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_ENDPOINT; attempt += 1) {
      try {
        const chainIdHex = await rpcCall(endpoint, "eth_chainId");
        const blockNumberHex = await rpcCall(endpoint, "eth_blockNumber");

        const chainId = Number.parseInt(chainIdHex, 16);
        const blockNumber = Number.parseInt(blockNumberHex, 16);

        if (chainId !== config.chainId) {
          const mismatchError = new Error(
            `Chain mismatch on ${endpoint}. Expected ${config.chainId}, got ${chainId}.`
          );
          mismatchError.code = "CHAIN_ID_MISMATCH";
          throw mismatchError;
        }

        return {
          success: true,
          chainId,
          blockNumber,
          activeEndpoint: endpoint,
          fallbackActivated: index > 0,
          errors,
        };
      } catch (error) {
        if (error?.code === "CHAIN_ID_MISMATCH") {
          throw error;
        }

        const captured = toRpcError(endpoint, attempt, error);
        errors.push(captured);

        if (attempt < MAX_RETRIES_PER_ENDPOINT) {
          await sleep(POLLING_BACKOFF_MS[Math.min(attempt - 1, POLLING_BACKOFF_MS.length - 1)]);
        }
      }
    }
  }

  return {
    success: false,
    chainId: null,
    blockNumber: null,
    activeEndpoint: null,
    fallbackActivated: false,
    errors,
  };
};

const tryWsSubscribe = async (endpoint) => {
  if (typeof WebSocket !== "function") {
    return {
      success: false,
      endpoint,
      reason: "WebSocket API is not available in this Node runtime.",
    };
  }

  return new Promise((resolve) => {
    const socket = new WebSocket(endpoint);
    const timer = setTimeout(() => {
      try {
        socket.close();
      } catch {
        // noop
      }
      resolve({
        success: false,
        endpoint,
        reason: `Timeout after ${RPC_TIMEOUT_MS}ms while opening WebSocket.`,
      });
    }, RPC_TIMEOUT_MS);

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_subscribe",
          params: ["newHeads"],
        })
      );
    };

    socket.onmessage = (event) => {
      clearTimeout(timer);
      let parsed;
      try {
        parsed = JSON.parse(String(event?.data || ""));
      } catch {
        parsed = null;
      }

      try {
        socket.close();
      } catch {
        // noop
      }

      if (parsed?.error) {
        resolve({
          success: false,
          endpoint,
          reason: parsed.error.message || "Unknown WS RPC error",
        });
        return;
      }

      resolve({
        success: true,
        endpoint,
        subscriptionId: parsed?.result || null,
      });
    };

    socket.onerror = () => {
      clearTimeout(timer);
      resolve({
        success: false,
        endpoint,
        reason: "WebSocket connection error.",
      });
    };
  });
};

const evaluateRealtimeMode = async (config, requiresRealtime) => {
  if (!requiresRealtime) {
    return {
      mode: "polling-http",
      wsTried: false,
      wsEndpoint: null,
      wsErrors: [],
      pollingBackoffMs: POLLING_BACKOFF_MS,
    };
  }

  const wsErrors = [];
  for (const endpoint of config.wsEndpoints) {
    const result = await tryWsSubscribe(endpoint);
    if (result.success) {
      return {
        mode: "websocket",
        wsTried: true,
        wsEndpoint: endpoint,
        wsErrors,
        pollingBackoffMs: POLLING_BACKOFF_MS,
      };
    }
    wsErrors.push({ endpoint, reason: result.reason });
  }

  return {
    mode: "polling-http",
    wsTried: true,
    wsEndpoint: null,
    wsErrors,
    pollingBackoffMs: POLLING_BACKOFF_MS,
    fallbackActivated: true,
  };
};

const runNpmAudit = async () => {
  try {
    const { stdout } = await execFileAsync("npm", ["audit", "--json"], {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    });

    const parsed = JSON.parse(stdout || "{}");
    return {
      success: true,
      summary: parsed?.metadata?.vulnerabilities || null,
      raw: parsed,
    };
  } catch (error) {
    const stdout = error?.stdout || "";
    const stderr = error?.stderr || "";

    let parsed = null;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      parsed = null;
    }

    return {
      success: false,
      summary: parsed?.metadata?.vulnerabilities || null,
      raw: parsed,
      message: stderr || error?.message || "npm audit failed",
    };
  }
};

const buildChangeSummary = (config) => {
  const before = {
    chainId: process.env.VITE_ARC_CHAIN_ID || null,
    rpcPrimary: process.env.VITE_ARC_RPC_URL || process.env.ARC_RPC_URL || null,
    wsSingle: process.env.VITE_ARC_RPC_WS_URL || null,
  };

  const after = {
    chainId: config.chainId,
    rpcPrimary: config.rpcPrimary,
    rpcFallback: config.rpcFallback,
    wsEndpoints: config.wsEndpoints,
  };

  const reasons = [
    "Enforce ARC Mainnet chainId 5042 for security tasks.",
    "Use Circle primary RPC with ordered fallback endpoints for resilience.",
    "Use provider WebSocket endpoints only; do not derive WS from primary mainnet URL.",
    "Keep credentials outside source code by loading from environment variables.",
  ];

  return { before, after, reasons };
};

const writeReport = async (reportPath, report) => {
  const absolutePath = path.resolve(reportPath);
  await fs.writeFile(absolutePath, JSON.stringify(report, null, 2), "utf8");
  return absolutePath;
};

const main = async () => {
  const args = process.argv.slice(2);
  const requiresRealtime = args.includes("--realtime");
  const runAudit = args.includes("--run-audit");
  const outputArg = args.find((arg) => arg.startsWith("--out="));
  const reportPath = outputArg ? outputArg.replace("--out=", "") : "arc-network-preflight-report.json";

  const config = buildMainnetConfig();

  if (config.chainId !== ARC_MAINNET_CHAIN_ID) {
    throw new Error(`Invalid ARC mainnet chainId config: expected ${ARC_MAINNET_CHAIN_ID}`);
  }

  if (config.rpcPrimary.includes("testnet")) {
    throw new Error("Mainnet preflight cannot use a testnet RPC endpoint.");
  }

  const preflight = await preflightHttp(config);
  if (!preflight.success) {
    const missingPermission = preflight.errors.some((item) => item.permissionDenied);
    const detail = missingPermission
      ? "Missing permission to access private ARC mainnet endpoint."
      : "Unable to read chain state from all configured endpoints.";
    throw new Error(`${detail} Checked ${1 + config.rpcFallback.length} endpoints.`);
  }

  const realtime = await evaluateRealtimeMode(config, requiresRealtime);
  const audit = runAudit ? await runNpmAudit() : null;

  const report = {
    generatedAt: new Date().toISOString(),
    networkConfigurationApplied: {
      networkName: config.networkName,
      chainId: config.chainId,
      rpcPrimary: config.rpcPrimary,
      rpcFallback: config.rpcFallback,
      wsEndpoint: realtime.wsEndpoint,
      wsCandidates: config.wsEndpoints,
      explorer: config.explorer,
      nativeGasTokenSymbol: "USDC",
    },
    preflightResult: {
      chainIdActual: preflight.chainId,
      blockNumber: preflight.blockNumber,
      activeEndpoint: preflight.activeEndpoint,
      fallbackActivated: preflight.fallbackActivated,
    },
    connectionErrors: {
      rpcErrors: preflight.errors,
      wsErrors: realtime.wsErrors,
      fallbackMechanismActivated: preflight.fallbackActivated || Boolean(realtime.fallbackActivated),
      pollingBackoffMs: realtime.pollingBackoffMs,
    },
    realtimeMode: realtime.mode,
    configurationChanges: buildChangeSummary(config),
    vulnerabilities: audit
      ? {
          collectedByThisRun: true,
          success: audit.success,
          summary: audit.summary,
          error: audit.success ? null : audit.message,
        }
      : {
          collectedByThisRun: false,
          summary: null,
        },
  };

  const outputPath = await writeReport(reportPath, report);

  if (runAudit && audit?.raw) {
    await fs.writeFile(path.resolve("audit-final.json"), JSON.stringify(audit.raw, null, 2), "utf8");
  }

  const fallbackText = preflight.fallbackActivated ? "enabled" : "not needed";
  console.log("ARC Mainnet preflight succeeded.");
  console.log(`Active endpoint: ${preflight.activeEndpoint}`);
  console.log(`Chain ID: ${preflight.chainId}`);
  console.log(`Block number: ${preflight.blockNumber}`);
  console.log(`Fallback: ${fallbackText}`);
  console.log(`Report: ${outputPath}`);
  if (runAudit) {
    console.log("Vulnerability summary included in report (and audit-final.json).");
  }
};

main().catch((error) => {
  console.error("ARC preflight failed:", error.message || error);
  process.exitCode = 1;
});
