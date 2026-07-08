import { applyCors, getLeaderboard } from "./_lib/leaderboard.js";

export default async function handler(req, res) {
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rows = await getLeaderboard();
    return res.status(200).json(rows);
  } catch (err) {
    console.error("GET /api/leaderboard error:", err.message);
    return res.status(500).json({ error: "Failed to fetch leaderboard. Please try again." });
  }
}
