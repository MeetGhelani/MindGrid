import { useEffect, useState } from "react";
import Controls from "./components/Controls";
import Grid from "./components/Grid";
import HowToPlayModal from "./components/HowToPlayModal";
import RulePanel from "./components/RulePanel";
import { useGameStore } from "./store/gameStore";

const tutorialStorageKey = "mindgrid-how-to-play-seen";

function getInitialTutorialState() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.localStorage.getItem(tutorialStorageKey) !== "true";
}

export default function App() {
  const { currentLevel, failed, feedback, levelIndex, levels, selectLevel, unlockedLevelCount, won } =
    useGameStore();
  const [showTutorial, setShowTutorial] = useState(getInitialTutorialState);

  useEffect(() => {
    if (!showTutorial && typeof window !== "undefined") {
      window.localStorage.setItem(tutorialStorageKey, "true");
    }
  }, [showTutorial]);

  return (
    <main className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <section className="game-frame">
        <header className="topbar">
          <div className="brand-block">
            <span className="brand-kicker">MindGrid</span>
            <h1>Reality Hacker</h1>
          </div>

          <div className="topbar-actions">
            <div className={`level-chip ${won ? "is-win" : failed ? "is-fail" : ""}`}>
              <span>Level</span>
              <strong>
                {levelIndex + 1}/{levels.length}
              </strong>
            </div>

            <button type="button" className="ghost-button" onClick={() => setShowTutorial(true)}>
              How To Play
            </button>
          </div>
        </header>

        <div className={`status-strip tone-${feedback.kind}`} role="status" aria-live="polite">
          <span className="status-dot" />
          <p>{feedback.message}</p>
        </div>

        <div className="level-ribbon">
          <div className="level-copy">
            <span className="level-name">{currentLevel.name}</span>
            <small>
              {won
                ? "Solved. The next puzzle is unlocked."
                : failed
                  ? "Sequence failed. Restart and try a cleaner plan."
                  : "Adult logic puzzle. Waste nothing."}
            </small>
          </div>

          <div className="level-tabs" aria-label="Level picker">
            {levels.map((level, index) => {
              const locked = index >= unlockedLevelCount;

              return (
                <button
                  key={level.id}
                  type="button"
                  className={
                    index === levelIndex
                      ? "level-tab is-active"
                      : locked
                        ? "level-tab is-locked"
                        : "level-tab"
                  }
                  onClick={() => selectLevel(index)}
                  aria-label={`Open level ${level.id}`}
                  disabled={locked}
                >
                  {level.id}
                </button>
              );
            })}
          </div>
        </div>

        <section className="board-stage">
          <Grid />
        </section>

        <div className="bottom-dock">
          <Controls />
          <RulePanel />
        </div>
      </section>

      <HowToPlayModal open={showTutorial} onClose={() => setShowTutorial(false)} />
    </main>
  );
}
