const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:3001" : "");

function buildApiUrl(path) {
  if (!API_BASE_URL) {
    return path;
  }

  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

/**
 * Submit a game score to the leaderboard.
 * Returns the saved entry on success, or null on failure (fire-and-forget safe).
 *
 * @param {{ walletAddress: string, score: number, gameId: string, duration: number, reachedMax: boolean }} params
 * @returns {Promise<object|null>}
 */
export async function submitScore({ walletAddress, score, gameId, duration, reachedMax }) {
  try {
    const res = await fetch(buildApiUrl("/api/scores"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress, score, gameId, duration, reachedMax }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("submitScore API error:", res.status, data.error || "Unknown error");
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("submitScore network error:", err.message);
    return null;
  }
}

/**
 * Fetch the top 10 leaderboard entries.
 * Returns an array of entries, or null on failure.
 *
 * @returns {Promise<Array<{ rank: number, walletAddress: string, bestScore: number, gamesPlayed: number }>|null>}
 */
export async function fetchLeaderboard() {
  try {
    const res = await fetch(buildApiUrl("/api/leaderboard"));

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("fetchLeaderboard API error:", res.status, data.error || "Unknown error");
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("fetchLeaderboard network error:", err.message);
    return null;
  }
}
