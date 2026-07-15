import pool from "../../server/db.js";

const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

let schemaReadyPromise;

function ensureSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) NOT NULL,
        score INTEGER NOT NULL CHECK (score >= 0),
        game_id VARCHAR(100) UNIQUE NOT NULL,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        reached_max BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_leaderboard_wallet ON leaderboard(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
    `);
  }

  return schemaReadyPromise;
}

function getAllowedOrigins() {
  const configured = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [
    "http://localhost:5173",
    "https://2048.learnjournal.site",
    "https://www.2048.learnjournal.site",
    ...configured,
  ];
}

export function applyCors(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  return false;
}

export function validateScoreInput({ walletAddress, score, gameId, duration, reachedMax }) {
  if (!walletAddress || !ETH_ADDRESS_RE.test(walletAddress)) {
    return "walletAddress must be a valid Ethereum address (0x + 40 hex chars)";
  }
  if (score === undefined || score === null || !Number.isInteger(score) || score < 0) {
    return "score must be a non-negative integer";
  }
  if (score > 999999) {
    return "score exceeds maximum allowed value";
  }
  if (!gameId || typeof gameId !== "string" || gameId.trim().length === 0 || gameId.length > 100) {
    return "gameId must be a non-empty string (max 100 chars)";
  }
  if (duration !== undefined && (!Number.isInteger(duration) || duration < 0)) {
    return "duration must be a non-negative integer (seconds)";
  }
  if (reachedMax !== undefined && typeof reachedMax !== "boolean") {
    return "reachedMax must be a boolean";
  }
  return null;
}

export async function saveScore({ walletAddress, score, gameId, duration, reachedMax }) {
  await ensureSchema();

  const durationSeconds = Number.isInteger(duration) ? duration : 0;
  const reachedMaxBool = reachedMax === true;

  const result = await pool.query(
    `INSERT INTO leaderboard (wallet_address, score, game_id, duration_seconds, reached_max)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, wallet_address, score, game_id, duration_seconds, reached_max, created_at`,
    [walletAddress.toLowerCase(), score, gameId.trim(), durationSeconds, reachedMaxBool]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    score: row.score,
    gameId: row.game_id,
    durationSeconds: row.duration_seconds,
    reachedMax: row.reached_max,
    createdAt: row.created_at,
  };
}

export async function getLeaderboard() {
  await ensureSchema();

  const result = await pool.query(
    `SELECT
       wallet_address,
       MAX(score) AS best_score,
       COUNT(*)::int AS games_played
     FROM leaderboard
     GROUP BY wallet_address
     ORDER BY best_score DESC
     LIMIT 10`
  );

  return result.rows.map((row, index) => ({
    rank: index + 1,
    walletAddress: row.wallet_address,
    bestScore: Number(row.best_score),
    gamesPlayed: row.games_played,
  }));
}
