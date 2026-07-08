import { useState, useEffect, useCallback } from "react";
import { fetchLeaderboard } from "../api/leaderboard";
import { IoMdRefresh, IoMdClose } from "react-icons/io";

/* eslint-disable react/prop-types */

const REFRESH_INTERVAL_MS = 30_000;

const RANK_MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };

function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function SkeletonRow() {
  return (
    <div className="leaderboard-row animate-pulse">
      <div className="leaderboard-rank bg-white/10 text-transparent">#</div>
      <div className="min-w-0 space-y-2">
        <div className="h-4 w-32 rounded-full bg-white/10" />
        <div className="h-3 w-20 rounded-full bg-white/5" />
      </div>
      <div className="text-right space-y-2">
        <div className="h-4 w-16 rounded-full bg-white/10 ml-auto" />
        <div className="h-3 w-10 rounded-full bg-white/5 ml-auto" />
      </div>
      <div className="text-right space-y-2">
        <div className="h-4 w-10 rounded-full bg-white/10 ml-auto" />
        <div className="h-3 w-8 rounded-full bg-white/5 ml-auto" />
      </div>
    </div>
  );
}

/**
 * Leaderboard panel component.
 * @param {{ currentAccount: string, onClose: () => void }} props
 */
export default function Leaderboard({ currentAccount, onClose }) {
  const [entries, setEntries] = useState(null); // null = loading, [] = empty, [...] = data
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    const data = await fetchLeaderboard();
    if (data === null) {
      setError("Could not load leaderboard. Check that the API server is running.");
    } else {
      setEntries(data);
      setError(null);
    }
    if (showSpinner) setRefreshing(false);
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    const runInitialLoad = async () => {
      const data = await fetchLeaderboard();
      if (cancelled) return;

      if (data === null) {
        setError("Could not load leaderboard. Check that the API server is running.");
      } else {
        setEntries(data);
        setError(null);
      }
    };

    runInitialLoad();
    return () => {
      cancelled = true;
    };
  }, [load]);

  // Auto-refresh every 30 s
  useEffect(() => {
    const timer = globalThis.setInterval(() => load(), REFRESH_INTERVAL_MS);
    return () => globalThis.clearInterval(timer);
  }, [load]);

  const currentNormalized = currentAccount?.toLowerCase();

  return (
    <div className="arcade-overlay">
      <div className="arcade-dialog max-w-3xl">
        <div className="arcade-dialog__header flex items-center justify-between gap-3">
          <div>
            <div className="arcade-eyebrow">Scoreboard</div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-[0.16em] uppercase text-white">🏆 Leaderboard</h2>
            <p className="mt-1 text-sm text-slate-300">Top runs, tiny legends, and a little room for bragging rights.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => load(true)}
              disabled={refreshing || entries === null}
              className="arcade-button arcade-button--ghost arcade-icon-button disabled:opacity-50"
              title="Refresh"
              aria-label="Refresh leaderboard"
            >
              <IoMdRefresh className={refreshing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="arcade-button arcade-button--ghost arcade-icon-button"
              title="Close"
              aria-label="Close leaderboard"
            >
              <IoMdClose size={22} />
            </button>
          </div>
        </div>

        <div className="arcade-dialog__body">
          {error ? (
            <p className="text-center text-amber-300 py-8">{error}</p>
          ) : entries === null ? (
            <div className="leaderboard-list">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="arcade-panel text-center py-10">
              <p className="text-lg font-semibold text-white">No scores yet.</p>
              <p className="mt-1 text-sm text-slate-300">Be the first one to drop a ridiculous combo.</p>
            </div>
          ) : (
            <div className="leaderboard-list">
              {entries.map((entry) => {
                const isMe = currentNormalized && entry.walletAddress === currentNormalized;
                return (
                  <div key={entry.rank} className={`leaderboard-row ${isMe ? "leaderboard-row--me" : ""}`}>
                    <div className="leaderboard-rank">{RANK_MEDALS[entry.rank] ?? entry.rank}</div>
                    <div className="min-w-0">
                      <div className="leaderboard-player" title={entry.walletAddress}>
                        {shortenAddress(entry.walletAddress)}
                        {isMe && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">
                            You
                          </span>
                        )}
                      </div>
                      <div className="leaderboard-meta">Wallet address</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Best Score</div>
                      <div className="text-lg font-black text-white tabular-nums">{entry.bestScore.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Games</div>
                      <div className="text-lg font-black text-white tabular-nums">{entry.gamesPlayed}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="arcade-dialog__footer flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>Auto-refreshes every 30 s</span>
          <span>Refresh button is still here in case you do not trust fate.</span>
        </div>
      </div>
    </div>
  );
}
