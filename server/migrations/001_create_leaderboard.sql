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
