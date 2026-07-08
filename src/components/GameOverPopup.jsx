/* eslint-disable react/prop-types */

const STATUS_CONFIG = {
  idle: { label: "Ready to mint", dotClass: "bg-gray-500", textClass: "text-gray-300" },
  waiting_wallet_confirm: { label: "Waiting for wallet confirmation...", dotClass: "bg-yellow-400 animate-pulse", textClass: "text-amber-300" },
  pending_tx: { label: "Transaction pending...", dotClass: "bg-cyan-400 animate-pulse", textClass: "text-cyan-300" },
  success: { label: "Mint successful.", dotClass: "bg-green-400", textClass: "text-green-300" },
  failed: { label: "Mint failed", dotClass: "bg-red-500", textClass: "text-red-300" },
};

const shortenAddress = (addr) =>
  addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

const GameOverPopup = ({
  title,
  score,
  durationSeconds,
  gameId,
  account,
  canMint,
  mintState,
  txExplorerLink,
  wrongNetwork,
  selectedNetworkName,
  onConnectWallet,
  onMintResult,
  onNewGame,
}) => {
  const isWon = title === "You Won!";
  const statusCfg = STATUS_CONFIG[mintState.status] || STATUS_CONFIG.idle;
  const isMinting =
    mintState.status === "waiting_wallet_confirm" || mintState.status === "pending_tx";

  return (
    <div className="arcade-overlay">
      <div className="arcade-dialog">
        <div className="arcade-dialog__header text-center">
          <div className="text-4xl mb-1 select-none animate-bounce-soft">{isWon ? "🏆" : "🎮"}</div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-[0.18em] uppercase text-white">{title}</h2>
          <p className="mt-2 text-sm text-slate-300">
            {isWon ? "Board conquered. Brag responsibly." : "The cabinet has spoken. Run it back?"}
          </p>
        </div>

        <div className="arcade-dialog__body space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="arcade-panel text-center">
              <p className="arcade-chip__label mb-2">Score</p>
              <p className="text-3xl font-black text-white">{score.toLocaleString()}</p>
            </div>
            <div className="arcade-panel text-center">
              <p className="arcade-chip__label mb-2">Duration</p>
              <p className="text-3xl font-black text-white">{durationSeconds}s</p>
            </div>
          </div>

          <div className="arcade-panel space-y-1">
            <p className="arcade-chip__label">Game ID</p>
            <p className="text-xs text-slate-300 font-mono break-all">{gameId}</p>
          </div>

          <div className="arcade-panel space-y-3">
            {account ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <p className="arcade-chip__label">Wallet</p>
                  <p className="text-sm font-mono text-gray-100">{shortenAddress(account)}</p>
                </div>
                {wrongNetwork ? (
                  <span className="status-chip status-chip--danger">Wrong Network</span>
                ) : (
                  <span className="status-chip status-chip--success">{selectedNetworkName}</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-300">
                Connect your wallet to mint this glorious result as an NFT on-chain.
              </p>
            )}

            <div className="flex gap-2 flex-col sm:flex-row">
              <button
                className="arcade-button arcade-button--ghost flex-1"
                onClick={onConnectWallet}
              >
                {account ? "Disconnect" : "Connect Wallet"}
              </button>
              <button
                className="arcade-button arcade-button--cyan flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={onMintResult}
                disabled={!canMint}
              >
                {wrongNetwork && account && !isMinting ? "Switch & Mint" : "Mint Result NFT"}
              </button>
            </div>
          </div>

          <div className="arcade-panel space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusCfg.dotClass}`} />
              <span className={`text-sm ${statusCfg.textClass}`}>Status: {statusCfg.label}</span>
            </div>
            {mintState.error && (
              <p className="text-xs text-red-200 bg-red-950/40 border border-red-800/60 rounded-md px-3 py-2">
                {mintState.error}
              </p>
            )}
            {mintState.txHash && (
              <p className="text-xs text-slate-300 font-mono break-all">Tx Hash: {mintState.txHash}</p>
            )}
            {mintState.tokenId && (
              <p className="text-xs text-slate-200">Token ID: {mintState.tokenId}</p>
            )}
            {txExplorerLink && (
              <a
                href={txExplorerLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                View transaction
              </a>
            )}
          </div>

        </div>

        <div className="arcade-dialog__footer">
          <button
            className="arcade-button arcade-button--amber w-full"
            onClick={onNewGame}
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverPopup;
