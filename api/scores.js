import { applyCors, saveScore, validateScoreInput } from "./_lib/leaderboard.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { walletAddress, score, gameId, duration, reachedMax } = req.body || {};
  const validationError = validateScoreInput({ walletAddress, score, gameId, duration, reachedMax });

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const saved = await saveScore({ walletAddress, score, gameId, duration, reachedMax });
    return res.status(201).json(saved);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "This gameId has already been submitted." });
    }

    console.error("POST /api/scores error:", err.message);
    return res.status(500).json({ error: "Failed to save score. Please try again." });
  }
}
