import { useState, useEffect, useRef, useCallback } from "react";
import Board from "./components/Board";
import {
  initializeGrid,
  moveTiles,
  isGameOver,
  hasReached2048,
} from "./components/gameLogic";
import { IoMdRefresh } from "react-icons/io";
import GameOverPopup from "./components/GameOverPopup";
import { toUserFacingMintError, toUserFacingWalletError } from "./blockchain/errors";
import { checkGameIdMinted, mintResultNft } from "./blockchain/mintResultNft";
import {
  ARC_NETWORK,
  getNetworkById,
  getTxExplorerLinkByChainId,
  SUPPORTED_NETWORKS,
} from "./blockchain/networks";
import {
  connectWallet,
  ensureNetwork,
  formatNativeBalance,
  getCurrentAccount,
  getNativeBalance,
  getCurrentChainId,
  getWalletProvider,
} from "./blockchain/wallet";
import { createGameSession, getGameDurationSeconds } from "./utils/gameSession";
import { submitScore } from "./api/leaderboard";
import Leaderboard from "./components/Leaderboard";
import Footer from "./components/Footer";

const MOBILE_BREAKPOINT = 768;

const INITIAL_MINT_STATE = {
  status: "idle",
  txHash: "",
  tokenId: "",
  error: "",
  chainId: null,
};

const shortenAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const HUD_LABELS = {
  score: "Combo Score",
  best: "High Score",
  network: "Arcade Network",
  wallet: "Player Wallet",
};

const MOBILE_CONTROLS = [
  { direction: "up", label: "Up", icon: "^" },
  { direction: "left", label: "Left", icon: "<" },
  { direction: "down", label: "Down", icon: "v" },
  { direction: "right", label: "Right", icon: ">" },
];

const App = () => {
  const [grid, setGrid] = useState(initializeGrid());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(
    () => Number(globalThis.localStorage?.getItem("bestScore") || 0)
  );
  const [newTiles, setNewTiles] = useState([]);
  const [mergedTiles, setMergedTiles] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSession, setGameSession] = useState(() => createGameSession());
  const [walletAccount, setWalletAccount] = useState("");
  const [walletChainId, setWalletChainId] = useState(null);
  const [selectedNetworkId, setSelectedNetworkId] = useState(ARC_NETWORK.id);
  const [walletNativeBalance, setWalletNativeBalance] = useState("");
  const [walletMessage, setWalletMessage] = useState("");
  const [mintState, setMintState] = useState(INITIAL_MINT_STATE);
  const [mintedGameIds, setMintedGameIds] = useState({});
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => window.innerWidth <= MOBILE_BREAKPOINT
  );
  const [isMobileHeaderOpen, setIsMobileHeaderOpen] = useState(false);
  const submittedGameIds = useRef(new Set());
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const boardTouchAreaRef = useRef(null);
  const gameEnded = gameOver || gameWon;
  const selectedNetwork = getNetworkById(selectedNetworkId) || ARC_NETWORK;

  // Auto-submit score to leaderboard when game ends (fire-and-forget)
  useEffect(() => {
    if (!gameEnded) return;
    if (!walletAccount) return;
    if (score <= 0) return;
    const gameId = gameSession.gameId;
    if (submittedGameIds.current.has(gameId)) return;
    submittedGameIds.current.add(gameId);
    const duration = getGameDurationSeconds(gameSession.startedAt);
    submitScore({
      walletAddress: walletAccount,
      score,
      gameId,
      duration,
      reachedMax: gameWon,
    });
  }, [gameEnded, walletAccount, score, gameSession, gameWon]);

  const runMove = useCallback((direction) => {
    if (gameEnded) {
      return;
    }

    const { newGrid, newScore, newTiles, mergedTiles } = moveTiles(grid, direction);

    if (newGrid) {
      const nextScore = score + newScore;
      setGrid(newGrid);
      setScore(nextScore);
      setNewTiles(newTiles);
      setMergedTiles(mergedTiles);
      if (nextScore > bestScore) {
        setBestScore(nextScore);
        globalThis.localStorage?.setItem("bestScore", String(nextScore));
      }
      if (isGameOver(newGrid)) {
        setGameOver(true);
      }
      if (hasReached2048(newGrid)) {
        setGameWon(true);
      }
    }
  }, [gameEnded, grid, score, bestScore]);

  const handleKeyDown = useCallback((e) => {
    if (!e.key.startsWith("Arrow")) {
      return;
    }

    runMove(e.key.replace("Arrow", "").toLowerCase());
  }, [runMove]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const updateViewportMode = () => {
      setIsMobileViewport(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);
    window.addEventListener("orientationchange", updateViewportMode);

    return () => {
      window.removeEventListener("resize", updateViewportMode);
      window.removeEventListener("orientationchange", updateViewportMode);
    };
  }, []);

  useEffect(() => {
    if (!gameStarted) return;

    if (isMobileViewport) {
      setIsMobileHeaderOpen(false);
      return;
    }

    setIsMobileHeaderOpen(true);
  }, [gameStarted, isMobileViewport]);

  const handleNewGame = () => {
    setGrid(initializeGrid());
    setScore(0);
    setNewTiles([]);
    setMergedTiles([]);
    setGameOver(false);
    setGameWon(false);
    setGameStarted(true);
    setGameSession(createGameSession());
    setMintState(INITIAL_MINT_STATE);
    setWalletMessage("");
  };

  const handleSwipe = useCallback((direction) => {
    runMove(direction);
  }, [runMove]);

  useEffect(() => {
    const touchArea = boardTouchAreaRef.current;
    if (!touchArea) {
      return;
    }

    const SWIPE_THRESHOLD_PX = 24;

    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (touchStartX.current === null || touchStartY.current === null) {
        return;
      }

      const touchEndX = e.touches[0].clientX;
      const touchEndY = e.touches[0].clientY;

      const deltaX = touchStartX.current - touchEndX;
      const deltaY = touchStartY.current - touchEndY;

      if (
        Math.abs(deltaX) < SWIPE_THRESHOLD_PX &&
        Math.abs(deltaY) < SWIPE_THRESHOLD_PX
      ) {
        return;
      }

      // Prevent page scroll only when a swipe gesture is detected on the board.
      e.preventDefault();

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          handleSwipe("left");
        } else {
          handleSwipe("right");
        }
      } else {
        if (deltaY > 0) {
          handleSwipe("up");
        } else {
          handleSwipe("down");
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    };

    const resetTouch = () => {
      touchStartX.current = null;
      touchStartY.current = null;
    };

    touchArea.addEventListener("touchstart", handleTouchStart, { passive: true });
    touchArea.addEventListener("touchmove", handleTouchMove, { passive: false });
    touchArea.addEventListener("touchend", resetTouch, { passive: true });
    touchArea.addEventListener("touchcancel", resetTouch, { passive: true });

    return () => {
      touchArea.removeEventListener("touchstart", handleTouchStart);
      touchArea.removeEventListener("touchmove", handleTouchMove);
      touchArea.removeEventListener("touchend", resetTouch);
      touchArea.removeEventListener("touchcancel", resetTouch);
    };
  }, [handleSwipe]);

  useEffect(() => {
    const syncWallet = async () => {
      try {
        const account = await getCurrentAccount();
        const chainId = await getCurrentChainId();
        setWalletAccount(account);
        setWalletChainId(chainId);

        if (getNetworkById(chainId)) {
          setSelectedNetworkId(chainId);
        }
      } catch {
        // Wallet may not be installed yet.
      }
    };

    syncWallet();
  }, []);

  useEffect(() => {
    let provider;
    try {
      provider = getWalletProvider();
    } catch {
      return;
    }

    const handleAccountsChanged = (accounts) => {
      setWalletAccount(accounts[0] || "");
      setWalletMessage("");
    };

    const handleChainChanged = (chainHex) => {
      const parsedChainId = Number.parseInt(chainHex, 16);
      setWalletChainId(parsedChainId);
      if (getNetworkById(parsedChainId)) {
        setSelectedNetworkId(parsedChainId);
      }
      setWalletMessage("");
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    const refreshNativeBalance = async () => {
      if (!walletAccount) {
        setWalletNativeBalance("");
        return;
      }

      try {
        const balance = await getNativeBalance(walletAccount);
        const formattedBalance = formatNativeBalance(
          balance,
          selectedNetwork.currencyDecimals,
          selectedNetwork.currencySymbol
        );
        setWalletNativeBalance(formattedBalance);
      } catch {
        setWalletNativeBalance(`-- ${selectedNetwork.currencySymbol}`);
      }
    };

    refreshNativeBalance();
  }, [walletAccount, walletChainId, selectedNetworkId, selectedNetwork.currencyDecimals, selectedNetwork.currencySymbol]);

  const handleConnectWallet = async () => {
    if (walletAccount) {
      setWalletAccount("");
      setWalletChainId(null);
      setWalletNativeBalance("");
      setWalletMessage("Wallet disconnected.");
      return;
    }

    try {
      setWalletMessage("");
      const account = await connectWallet();
      const chainId = await ensureNetwork(selectedNetwork);
      setWalletAccount(account);
      setWalletChainId(chainId);
    } catch (error) {
      setWalletMessage(toUserFacingWalletError(error));
    }
  };

  const handleNetworkChange = async (event) => {
    const nextNetworkId = Number(event.target.value);
    const nextNetwork = getNetworkById(nextNetworkId);
    if (!nextNetwork) {
      return;
    }

    const previousNetworkId = selectedNetworkId;
    setSelectedNetworkId(nextNetworkId);
    setWalletMessage("");

    if (!walletAccount) {
      return;
    }

    try {
      const chainId = await ensureNetwork(nextNetwork);
      setWalletChainId(chainId);
    } catch (error) {
      const fallbackNetworkId =
        walletChainId && getNetworkById(walletChainId) ? walletChainId : previousNetworkId;
      setSelectedNetworkId(fallbackNetworkId);
      setWalletMessage(toUserFacingWalletError(error));
    }
  };

  const handleMintResult = async () => {
    if (!gameEnded) return;
    if (!walletAccount) {
      setMintState({ ...INITIAL_MINT_STATE, status: "failed", error: "Please connect wallet first." });
      return;
    }
    if (score <= 0) {
      setMintState({ ...INITIAL_MINT_STATE, status: "failed", error: "Invalid score. Score must be greater than 0." });
      return;
    }
    if (mintedGameIds[gameSession.gameId]) {
      setMintState({ ...INITIAL_MINT_STATE, status: "failed", error: "This gameId has already been minted." });
      return;
    }

    try {
      setMintState({ ...INITIAL_MINT_STATE, status: "waiting_wallet_confirm" });

      // Auto-switch to selected network if wallet is on wrong network
      const currentChainId = await getCurrentChainId();
      if (currentChainId !== selectedNetworkId) {
        await ensureNetwork(selectedNetwork);
      }

      const chainId = await getCurrentChainId();
      setWalletChainId(chainId);
      if (getNetworkById(chainId)) {
        setSelectedNetworkId(chainId);
      }

      const currentAccount = await getCurrentAccount();
      if (!currentAccount) {
        throw new Error("Wallet is disconnected. Please connect wallet again.");
      }
      if (currentAccount.toLowerCase() !== walletAccount.toLowerCase()) {
        setWalletAccount(currentAccount);
      }

      const alreadyMinted = await checkGameIdMinted(gameSession.gameId, chainId);
      if (alreadyMinted) {
        throw new Error("DuplicateGameId");
      }

      const playedAt = Math.floor(Date.now() / 1000);
      const durationSeconds = getGameDurationSeconds(gameSession.startedAt);

      const { txHash, tokenId } = await mintResultNft({
        account: currentAccount,
        score,
        durationSeconds,
        gameId: gameSession.gameId,
        playedAt,
        chainId,
        onTxSubmitted: (hash) => {
          setMintState({
            status: "pending_tx",
            txHash: hash,
            tokenId: "",
            error: "",
            chainId,
          });
        },
      });

      setMintedGameIds((prev) => ({ ...prev, [gameSession.gameId]: true }));
      setMintState({ status: "success", txHash, tokenId, error: "", chainId });
    } catch (error) {
      console.error("Mint result NFT failed:", error);
      setMintState({
        status: "failed",
        txHash: "",
        tokenId: "",
        error: toUserFacingMintError(error),
        chainId: null,
      });
    }
  };

  const canMint =
    gameEnded &&
    score > 0 &&
    Boolean(walletAccount) &&
    !mintedGameIds[gameSession.gameId] &&
    mintState.status !== "waiting_wallet_confirm" &&
    mintState.status !== "pending_tx";

  const wrongNetwork =
    Boolean(walletAccount) &&
    walletChainId !== null &&
    walletChainId !== selectedNetworkId;

  const txExplorerLink = getTxExplorerLinkByChainId(
    mintState.txHash,
    mintState.chainId || walletChainId
  );
  const durationSeconds = getGameDurationSeconds(gameSession.startedAt);
  const popupTitle = gameWon ? "You Won!" : "Game Over";
  const walletStatusLabel = walletAccount ? "Cabinet Online" : "Wallet Offline";
  const walletStatusClass = walletAccount
    ? "status-chip status-chip--success"
    : "status-chip status-chip--warning";
  const shouldShowHeaderContent = !isMobileViewport || isMobileHeaderOpen;
  const mobileToggleLabel = isMobileHeaderOpen ? "Hide Header" : "Show Header";

  return (
    <div className="arcade-shell">
      <div className="arcade-shell__inner">
        {!gameStarted ? (
          <div className="arcade-intro flex flex-col items-center gap-6 text-center">
            <div className="space-y-4 max-w-3xl">
              <span className="arcade-eyebrow">Insert Coin Optional</span>
              <h1 className="arcade-title">2048</h1>
              <p className="arcade-subtitle mx-auto">
                Slide tiles, chase the chaos, and try not to let the board bully you.
                Wallet minting, network switching, and leaderboard bragging are ready when you are.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <div className="status-chip">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--arcade-cyan)] animate-pulse" />
                Arcade warm-up complete
              </div>
              <div className="status-chip">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--arcade-amber)] animate-pulse" />
                Swipe, stack, survive
              </div>
            </div>
            <button className="arcade-button arcade-button--amber px-6 text-base sm:text-lg" onClick={handleNewGame}>
              Start Game
            </button>
          </div>
        ) : (
          <div className="arcade-game-layout space-y-4">
            {isMobileViewport && (
              <div className="arcade-mobile-header-toggle-wrap">
                <button
                  type="button"
                  className="arcade-button arcade-button--ghost arcade-mobile-header-toggle"
                  onClick={() => setIsMobileHeaderOpen((prev) => !prev)}
                  aria-expanded={isMobileHeaderOpen}
                  aria-controls="game-header-content"
                  aria-label={mobileToggleLabel}
                >
                  {mobileToggleLabel}
                </button>
              </div>
            )}

            <header
              className={`arcade-cabinet arcade-game-header space-y-5 ${shouldShowHeaderContent ? "is-open" : "is-collapsed"}`}
            >
              <div
                id="game-header-content"
                className="arcade-game-header__inner"
                aria-hidden={!shouldShowHeaderContent}
              >
              <div className="arcade-toolbar gap-4">
                <div className="space-y-2 max-w-3xl">
                  <span className="arcade-eyebrow">Neon Snack Mode</span>
                  <h1 className="arcade-title text-left">2048</h1>
                  <p className="arcade-subtitle">
                    A neon cabinet for stacking tiles, flexing scores, and sending your best run on-chain.
                  </p>
                </div>
                <div className="arcade-hud-row">
                  <button
                    className="arcade-button arcade-button--ghost"
                    onClick={handleConnectWallet}
                  >
                    {walletAccount ? "Disconnect Wallet" : "Connect Wallet"}
                  </button>
                  <button
                    className="arcade-button arcade-button--amber"
                    onClick={() => setShowLeaderboard(true)}
                  >
                    🏆 Leaderboard
                  </button>
                  <button
                    className="arcade-button arcade-button--cyan arcade-icon-button"
                    onClick={handleNewGame}
                    title="New Game"
                    aria-label="New Game"
                  >
                    <IoMdRefresh />
                  </button>
                </div>
              </div>

              <div className="arcade-toolbar gap-4">
                <div className="arcade-chip arcade-chip--score">
                  <span>
                    <span className="arcade-chip__label">{HUD_LABELS.score}</span>
                    <span className="arcade-chip__value block">{score.toLocaleString()}</span>
                  </span>
                </div>
                <div className="arcade-chip arcade-chip--best">
                  <span>
                    <span className="arcade-chip__label">{HUD_LABELS.best}</span>
                    <span className="arcade-chip__value block">{bestScore.toLocaleString()}</span>
                  </span>
                </div>
                <div className="arcade-chip arcade-chip--compact arcade-chip--network gap-3 flex-wrap">
                    <span>
                      <span className="arcade-chip__label">{HUD_LABELS.network}</span>
                      <span className="arcade-chip__value block">{selectedNetwork.name}</span>
                    </span>
                    <label className="arcade-network-picker" htmlFor="network-select">
                      <span className="arcade-network-picker__hint">Switch chain</span>
                      <div className="arcade-select-wrap">
                        <select
                          id="network-select"
                          value={selectedNetworkId}
                          onChange={handleNetworkChange}
                          className="arcade-select arcade-select--network min-w-0"
                          aria-label="Switch blockchain network"
                        >
                          {SUPPORTED_NETWORKS.map((network) => (
                            <option key={network.id} value={network.id}>
                              {network.name}
                            </option>
                          ))}
                        </select>
                        <span className="arcade-select-wrap__chevron" aria-hidden="true">v</span>
                      </div>
                    </label>
                </div>
                <div className="arcade-chip arcade-chip--best">
                  <div className={walletStatusClass}>
                    <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
                    {walletStatusLabel}
                  </div>
                  {walletMessage && (
                    <div className="status-chip status-chip--warning max-w-full text-left">
                      {walletMessage}
                    </div>
                  )}
                </div>
              </div>

              {walletAccount && (
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="arcade-panel space-y-1 md:col-span-1">
                    <p className="arcade-chip__label">{HUD_LABELS.wallet}</p>
                    <p className="arcade-chip__value text-sm md:text-base" title={walletAccount}>
                      {shortenAddress(walletAccount)}
                    </p>
                  </div>
                  <div className="arcade-panel space-y-1 md:col-span-1">
                    <p className="arcade-chip__label">Native Balance</p>
                    <p className="arcade-chip__value text-sm md:text-base">
                      {walletNativeBalance || `0 ${selectedNetwork.currencySymbol}`}
                    </p>
                  </div>
                  <div className="arcade-panel space-y-1 md:col-span-1">
                    <p className="arcade-chip__label">Active Chain</p>
                    <p className="arcade-chip__value text-sm md:text-base">
                      {selectedNetwork.name}
                      {walletChainId ? ` (#${walletChainId})` : ""}
                    </p>
                  </div>
                </div>
              )}
              </div>
            </header>

            <main className="arcade-cabinet space-y-4">
              <div ref={boardTouchAreaRef} className="arcade-board-wrap">
                <Board grid={grid} newTiles={newTiles} mergedTiles={mergedTiles} />
              </div>

              {isMobileViewport && (
                <div className="arcade-mobile-controls" role="group" aria-label="Move tiles">
                  {MOBILE_CONTROLS.map((control) => (
                    <button
                      key={control.direction}
                      type="button"
                      className="arcade-mobile-controls__button"
                      onClick={() => runMove(control.direction)}
                      disabled={gameEnded}
                      aria-label={`Move ${control.label}`}
                    >
                      {control.icon}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--arcade-muted)]">
                <p>
                  Slide the board. Stack the chaos. Try not to let the tiles think they run the place.
                </p>
                <p>Game session: {gameSession.gameId.slice(0, 10)}...</p>
              </div>
            </main>

            {showLeaderboard && (
              <Leaderboard
                currentAccount={walletAccount}
                onClose={() => setShowLeaderboard(false)}
              />
            )}
          </div>
        )}
      </div>
      <Footer />
      {gameEnded && (
        <GameOverPopup
          title={popupTitle}
          score={score}
          durationSeconds={durationSeconds}
          gameId={gameSession.gameId}
          account={walletAccount}
          canMint={canMint}
          mintState={mintState}
          txExplorerLink={txExplorerLink}
          wrongNetwork={wrongNetwork}
          selectedNetworkName={selectedNetwork.name}
          onConnectWallet={handleConnectWallet}
          onMintResult={handleMintResult}
          onNewGame={handleNewGame}
        />
      )}
    </div>
  );
};

export default App;
