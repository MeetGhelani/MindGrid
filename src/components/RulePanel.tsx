import { useGameStore } from "../store/gameStore";

function GravityIcon({ gravity }: { gravity: "down" | "up" }) {
  return <span className="gravity-icon">{gravity === "up" ? "UP" : "DN"}</span>;
}

export default function RulePanel() {
  const {
    currentLevel,
    failed,
    gravity,
    levelIndex,
    levels,
    moveCount,
    moveLimit,
    nextLevel,
    restartLevel,
    rulePoints,
    toggleGravity,
    won,
  } = useGameStore();

  const remainingMoves = Math.max(0, moveLimit - moveCount);

  return (
    <section className="rule-panel" aria-label="Rule controls">
      <div className="rule-header">
        <div>
          <span className="panel-kicker">Rule Panel</span>
          <h2>Control State</h2>
        </div>
        <div className={`rule-state-chip ${won ? "is-win" : failed ? "is-fail" : ""}`}>
          {won ? "Solved" : failed ? "Failed" : `Level ${levels[levelIndex].id}`}
        </div>
      </div>

      <div className="rule-summary">
        <div className={`gravity-pill gravity-${gravity}`}>
          <GravityIcon gravity={gravity} />
          <div>
            <span>Gravity</span>
            <strong>{gravity === "up" ? "Inverted" : "Standard"}</strong>
          </div>
        </div>

        <div className="points-pill">
          <span>Rule Points</span>
          <strong>{rulePoints}</strong>
        </div>
      </div>

      <div className="constraint-strip">
        <div className="constraint-card">
          <span>Moves Left</span>
          <strong>{remainingMoves}</strong>
        </div>
        <div className="constraint-card">
          <span>Puzzle</span>
          <strong>{currentLevel.name}</strong>
        </div>
      </div>

      <div className="point-meter" aria-hidden="true">
        {Array.from({ length: Math.max(3, currentLevel.rulePoints) }).map((_, index) => (
          <span key={index} className={index < rulePoints ? "meter-dot active" : "meter-dot"} />
        ))}
      </div>

      <div className="rule-actions">
        <button
          type="button"
          onClick={toggleGravity}
          className="primary-action"
          disabled={rulePoints <= 0 || won || failed}
        >
          <span>Flip Gravity</span>
          <small>{rulePoints > 0 && !won && !failed ? "Spend 1 point" : "Unavailable"}</small>
        </button>

        <button type="button" className="secondary-action" onClick={restartLevel}>
          Restart
        </button>

        <button
          type="button"
          className="secondary-action"
          onClick={nextLevel}
          disabled={!won && levelIndex + 1 >= levels.length}
        >
          {won ? "Next" : "Skip"}
        </button>
      </div>
    </section>
  );
}
