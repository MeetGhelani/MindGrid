import { useRef } from "react";
import { useGameStore } from "../store/gameStore";

function GoalMark({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="7.25" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.75" fill="currentColor" />
    </svg>
  );
}

function TileBadge({ label, className }: { label: string; className: string }) {
  return <span className={className}>{label}</span>;
}

export default function Grid() {
  const { currentLevel, feedback, gravity, grid, player, move, won } = useGameStore();
  const width = grid[0]?.length ?? 0;
  const height = grid.length;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const boardKey =
    feedback.kind === "blocked" || feedback.kind === "gravity" || feedback.kind === "win" || feedback.kind === "fail"
      ? `board-${currentLevel.id}-${feedback.kind}-${feedback.id}`
      : `board-${currentLevel.id}`;

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];

    if (!start || !touch) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const threshold = 24;

    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
      return;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      move(deltaX > 0 ? 1 : -1, 0);
      return;
    }

    move(0, deltaY > 0 ? 1 : -1);
  }

  return (
    <div
      className="grid-shell"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="MindGrid board. Swipe on the board or use the controls to move."
    >
      <div
        key={boardKey}
        className={`grid-board tone-${feedback.kind} ${won ? "is-won" : ""}`}
        style={
          {
            gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
            "--grid-count-x": width,
            "--grid-count-y": height,
            "--player-x": player.x,
            "--player-y": player.y,
          } as React.CSSProperties
        }
        role="grid"
      >
        {grid.flat().map((tile, index) => {
          const x = index % width;
          const y = Math.floor(index / width);
          const isPlayer = player.x === x && player.y === y;

          const tileClasses = [
            "grid-tile",
            tile.kind === "wall" ? "tile-wall" : "tile-floor",
            tile.kind === "goal" ? "tile-goal" : "",
            tile.kind === "gateUp" ? "tile-gate-up" : "",
            tile.kind === "gateDown" ? "tile-gate-down" : "",
            tile.kind === "trap" ? "tile-trap" : "",
            tile.kind === "door" ? "tile-door" : "",
            tile.kind === "switch" ? "tile-switch" : "",
            tile.kind === "teleport" ? "tile-teleport" : "",
            tile.kind === "oneWay" ? "tile-one-way" : "",
            isPlayer ? "tile-has-player" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={`${currentLevel.id}-${x}-${y}`}
              className={tileClasses}
              style={{ animationDelay: `${index * 22}ms` }}
              role="gridcell"
              aria-label={`${tile.kind} tile at column ${x + 1}, row ${y + 1}`}
            >
              <div className="tile-inner">
                <span className="tile-coordinate">
                  {x + 1},{y + 1}
                </span>

                {tile.kind === "goal" && <GoalMark className={isPlayer ? "goal-icon is-occupied" : "goal-icon"} />}
                {tile.kind === "wall" && <span className="tile-wall-mark" />}
                {tile.kind === "trap" && (
                  <TileBadge label="X" className={isPlayer ? "trap-mark is-occupied" : "trap-mark"} />
                )}
                {tile.kind === "door" && (
                  <TileBadge
                    label={tile.id?.toUpperCase() ?? "D"}
                    className={isPlayer ? "door-mark is-occupied" : "door-mark"}
                  />
                )}
                {tile.kind === "switch" && (
                  <TileBadge
                    label={tile.id?.toUpperCase() ?? "S"}
                    className={isPlayer ? "switch-mark is-occupied" : "switch-mark"}
                  />
                )}
                {tile.kind === "teleport" && (
                  <TileBadge
                    label={tile.id?.toUpperCase() ?? "P"}
                    className={isPlayer ? "teleport-mark is-occupied" : "teleport-mark"}
                  />
                )}
                {tile.kind === "gateUp" && (
                  <TileBadge
                    label="UP"
                    className={isPlayer ? "gate-mark gate-up is-occupied" : "gate-mark gate-up"}
                  />
                )}
                {tile.kind === "gateDown" && (
                  <TileBadge
                    label="DN"
                    className={isPlayer ? "gate-mark gate-down is-occupied" : "gate-mark gate-down"}
                  />
                )}
                {tile.kind === "oneWay" && (
                  <TileBadge
                    label={
                      tile.direction === "up"
                        ? "↑"
                        : tile.direction === "right"
                          ? "→"
                          : tile.direction === "down"
                            ? "↓"
                            : "←"
                    }
                    className={isPlayer ? "one-way-mark is-occupied" : "one-way-mark"}
                  />
                )}
                {isPlayer && (
                  <div className={`player-core ${feedback.kind === "move" ? "is-moving" : ""}`} aria-hidden="true">
                    <span />
                    <small>{gravity === "up" ? "P^" : "Pv"}</small>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="board-flash" aria-hidden="true" />
      </div>

      <p className="grid-hint">
        UP and DN are gravity gates. Doors need switches. Teleports preserve move count.
      </p>
    </div>
  );
}
