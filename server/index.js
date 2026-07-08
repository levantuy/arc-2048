import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pool from "./db.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(express.json());

// CORS: allow localhost and configured production domains.
const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
  "https://2048.learnjournal.site",
  "https://www.2048.learnjournal.site",
  ...configuredOrigins,
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl/Postman/server-to-server).
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// Rate limit POST /api/scores — max 10 per IP per minute
const scoreSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a minute before submitting again." },
});

// --- Helpers ---
const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function validateScoreInput({ walletAddress, score, gameId, duration, reachedMax }) {
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

// --- Run migration on startup ---
async function runMigrations() {
  try {
    const sql = readFileSync(join(__dirname, "migrations", "001_create_leaderboard.sql"), "utf-8");
    await pool.query(sql);
    console.log("Database migration applied.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
}

// --- Routes ---

// POST /api/scores — save a score entry
app.post("/api/scores", scoreSubmitLimiter, async (req, res) => {
  const { walletAddress, score, gameId, duration, reachedMax } = req.body;

  const validationError = validateScoreInput({ walletAddress, score, gameId, duration, reachedMax });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const durationSeconds = Number.isInteger(duration) ? duration : 0;
  const reachedMaxBool = reachedMax === true;

  try {
    const result = await pool.query(
      `INSERT INTO leaderboard (wallet_address, score, game_id, duration_seconds, reached_max)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, wallet_address, score, game_id, duration_seconds, reached_max, created_at`,
      [walletAddress.toLowerCase(), score, gameId.trim(), durationSeconds, reachedMaxBool]
    );

    const row = result.rows[0];
    return res.status(201).json({
      id: row.id,
      walletAddress: row.wallet_address,
      score: row.score,
      gameId: row.game_id,
      durationSeconds: row.duration_seconds,
      reachedMax: row.reached_max,
      createdAt: row.created_at,
    });
  } catch (err) {
    if (err.code === "23505") {
      // Unique constraint violation on game_id
      return res.status(409).json({ error: "This gameId has already been submitted." });
    }
    console.error("POST /api/scores error:", err.message);
    return res.status(500).json({ error: "Failed to save score. Please try again." });
  }
});

// GET /api/leaderboard — fetch top 10 scores
app.get("/api/leaderboard", async (_req, res) => {
  try {
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

    const rows = result.rows.map((row, index) => ({
      rank: index + 1,
      walletAddress: row.wallet_address,
      bestScore: Number(row.best_score),
      gamesPlayed: row.games_played,
    }));

    return res.json(rows);
  } catch (err) {
    console.error("GET /api/leaderboard error:", err.message);
    return res.status(500).json({ error: "Failed to fetch leaderboard. Please try again." });
  }
});

// --- Start ---
runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
});
