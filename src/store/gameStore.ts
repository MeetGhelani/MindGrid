import { useSyncExternalStore } from "react";
import { levels } from "../game/levels/levels";
import { gravityDown, gravityUp } from "../game/rules/gravityRule";
import { RuleManager } from "../game/rules/ruleManager";
import type {
  Direction,
  FeedbackState,
  LevelDefinition,
  Position,
  TileDefinition,
} from "../types/game";

const ruleManager = new RuleManager(gravityDown);

interface GameState {
  levels: LevelDefinition[];
  unlockedLevelCount: number;
  levelIndex: number;
  currentLevel: LevelDefinition;
  grid: TileDefinition[][];
  player: Position;
  rulePoints: number;
  gravity: "down" | "up";
  moveCount: number;
  moveLimit: number;
  activeSwitches: Record<string, boolean>;
  feedback: FeedbackState;
  won: boolean;
  failed: boolean;
  move: (dx: number, dy: number) => void;
  toggleGravity: () => void;
  restartLevel: () => void;
  nextLevel: () => void;
  selectLevel: (index: number) => void;
}

type Listener = () => void;

const listeners = new Set<Listener>();

let feedbackId = 0;
let currentState: GameState;

function createFeedback(kind: FeedbackState["kind"], message: string): FeedbackState {
  feedbackId += 1;
  return { id: feedbackId, kind, message };
}

function getLevelSnapshot(levelIndex: number) {
  const currentLevel = levels[levelIndex];
  return {
    levelIndex,
    currentLevel,
    grid: currentLevel.grid,
    player: currentLevel.start,
    rulePoints: currentLevel.rulePoints,
    gravity: "down" as const,
    moveCount: 0,
    moveLimit: currentLevel.moveLimit,
    activeSwitches: {},
    won: false,
    failed: false,
  };
}

function setState(partial: Partial<GameState>) {
  currentState = { ...currentState, ...partial };
  listeners.forEach((listener) => listener());
}

function getTile(position: Position, grid = currentState.grid) {
  return grid[position.y]?.[position.x];
}

function getMovementDirection(dx: number, dy: number): Direction {
  if (dx === 1) return "right";
  if (dx === -1) return "left";
  if (dy === 1) return "down";
  return "up";
}

function isTilePassable(tile: TileDefinition | undefined, gravity: "down" | "up", switches: Record<string, boolean>) {
  if (!tile) return false;
  if (tile.kind === "wall") return false;
  if (tile.kind === "door") return Boolean(tile.id && switches[tile.id]);
  if (tile.kind === "gateUp") return gravity === "up";
  if (tile.kind === "gateDown") return gravity === "down";
  return true;
}

function getTeleportDestination(tile: TileDefinition, from: Position, level: LevelDefinition) {
  if (tile.kind !== "teleport" || !tile.id) {
    return from;
  }

  for (let y = 0; y < level.grid.length; y += 1) {
    for (let x = 0; x < level.grid[y].length; x += 1) {
      const candidate = level.grid[y][x];
      if (candidate.kind === "teleport" && candidate.id === tile.id && (x !== from.x || y !== from.y)) {
        return { x, y };
      }
    }
  }

  return from;
}

function hasAnyLegalAction(
  player: Position,
  gravity: "down" | "up",
  switches: Record<string, boolean>,
  rulePoints: number,
  grid: TileDefinition[][],
) {
  const currentTile = getTile(player, grid);
  const directions: Array<[number, number]> = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];

  for (const [dx, dy] of directions) {
    const modified = ruleManager.apply(dx, dy);
    const direction = getMovementDirection(modified.dx, modified.dy);

    if (currentTile?.kind === "oneWay" && currentTile.direction !== direction) {
      continue;
    }

    const nextPosition = { x: player.x + modified.dx, y: player.y + modified.dy };
    if (isTilePassable(getTile(nextPosition, grid), gravity, switches)) {
      return true;
    }
  }

  return rulePoints > 0;
}

function loadLevel(levelIndex: number, message: string) {
  ruleManager.setRule(gravityDown);
  setState({
    ...getLevelSnapshot(levelIndex),
    feedback: createFeedback("level", message),
  });
}

currentState = {
  levels,
  unlockedLevelCount: 1,
  ...getLevelSnapshot(0),
  feedback: createFeedback("level", "Level 1 loaded. Every move matters now."),

  move: (dx: number, dy: number) => {
    const { currentLevel, failed, gravity, grid, moveCount, moveLimit, player, rulePoints, won } = currentState;

    if (won) {
      setState({ feedback: createFeedback("win", "Level cleared. Move to the next puzzle.") });
      return;
    }

    if (failed) {
      setState({ feedback: createFeedback("fail", "Run failed. Restart to try again.") });
      return;
    }

    const modified = ruleManager.apply(dx, dy);
    const direction = getMovementDirection(modified.dx, modified.dy);
    const currentTile = getTile(player, grid);

    if (currentTile?.kind === "oneWay" && currentTile.direction !== direction) {
      setState({ feedback: createFeedback("blocked", "One-way lane. You cannot exit that way.") });
      return;
    }

    const nextPosition = { x: player.x + modified.dx, y: player.y + modified.dy };
    const nextTile = getTile(nextPosition, grid);

    if (!isTilePassable(nextTile, gravity, currentState.activeSwitches)) {
      const message =
        nextTile?.kind === "door"
          ? "Door locked. Trigger its switch first."
          : nextTile?.kind === "gateUp"
            ? "Up gate locked. Gravity must be inverted."
            : nextTile?.kind === "gateDown"
              ? "Down gate locked. Restore standard gravity."
              : "Blocked. That route goes nowhere.";

      setState({ feedback: createFeedback("blocked", message) });
      return;
    }

    let newPlayer = nextPosition;
    let newSwitches = currentState.activeSwitches;
    let feedback = createFeedback("move", `Moved to ${nextPosition.x + 1}:${nextPosition.y + 1}.`);
    let didFail = false;
    let didWin = false;

    if (nextTile?.kind === "switch" && nextTile.id) {
      newSwitches = {
        ...newSwitches,
        [nextTile.id]: !newSwitches[nextTile.id],
      };
      feedback = createFeedback(
        "move",
        `${newSwitches[nextTile.id] ? "Opened" : "Closed"} door network ${nextTile.id.toUpperCase()}.`,
      );
    }

    if (nextTile?.kind === "teleport") {
      newPlayer = getTeleportDestination(nextTile, nextPosition, currentLevel);
      feedback = createFeedback("move", `Warped to ${newPlayer.x + 1}:${newPlayer.y + 1}.`);
    }

    const landedTile = getTile(newPlayer, grid);

    if (landedTile?.kind === "trap") {
      didFail = true;
      feedback = createFeedback("fail", "Trap triggered. Sequence collapsed.");
    }

    if (landedTile?.kind === "goal") {
      didWin = true;
      feedback = createFeedback("win", `${currentLevel.name} solved. That route was the key.`);
    }

    const nextMoveCount = moveCount + 1;

    if (!didWin && !didFail && nextMoveCount >= moveLimit) {
      didFail = true;
      feedback = createFeedback("fail", "Move limit exceeded. The puzzle state is lost.");
    }

    if (
      !didWin &&
      !didFail &&
      !hasAnyLegalAction(newPlayer, gravity, newSwitches, rulePoints, grid)
    ) {
      didFail = true;
      feedback = createFeedback("fail", "No legal actions remain. Restart the level.");
    }

    setState({
      player: newPlayer,
      activeSwitches: newSwitches,
      moveCount: nextMoveCount,
      won: didWin,
      failed: didFail,
      feedback,
      unlockedLevelCount: didWin
        ? Math.max(currentState.unlockedLevelCount, Math.min(levels.length, currentState.levelIndex + 2))
        : currentState.unlockedLevelCount,
    });
  },

  toggleGravity: () => {
    const { failed, rulePoints, won } = currentState;

    if (won) {
      setState({ feedback: createFeedback("win", "Level cleared. Continue to the next puzzle.") });
      return;
    }

    if (failed) {
      setState({ feedback: createFeedback("fail", "Run failed. Restart before changing rules.") });
      return;
    }

    if (rulePoints <= 0) {
      setState({ feedback: createFeedback("blocked", "No rule points left. Commit to the current plan.") });
      return;
    }

    const newGravity = currentState.gravity === "down" ? "up" : "down";
    ruleManager.setRule(newGravity === "down" ? gravityDown : gravityUp);

    if (
      !hasAnyLegalAction(currentState.player, newGravity, currentState.activeSwitches, rulePoints - 1, currentState.grid)
    ) {
      setState({
        gravity: newGravity,
        rulePoints: rulePoints - 1,
        failed: true,
        feedback: createFeedback("fail", "Gravity changed, but no path remains. Restart the puzzle."),
      });
      return;
    }

    setState({
      gravity: newGravity,
      rulePoints: rulePoints - 1,
      feedback: createFeedback(
        "gravity",
        newGravity === "up"
          ? "Gravity inverted. Up gates are live, but controls are mirrored vertically."
          : "Gravity restored. Down gates are active again.",
      ),
    });
  },

  restartLevel: () => {
    loadLevel(currentState.levelIndex, `${currentState.currentLevel.name} restarted.`);
  },

  nextLevel: () => {
    if (!currentState.won && currentState.levelIndex + 1 >= currentState.unlockedLevelCount) {
      setState({ feedback: createFeedback("blocked", "Solve the current level to unlock the next one.") });
      return;
    }

    const nextIndex = Math.min(levels.length - 1, currentState.levelIndex + 1);
    loadLevel(nextIndex, `Level ${levels[nextIndex].id}: ${levels[nextIndex].name}`);
  },

  selectLevel: (index: number) => {
    if (index >= currentState.unlockedLevelCount) {
      setState({ feedback: createFeedback("blocked", "That level is still locked.") });
      return;
    }

    loadLevel(index, `Level ${levels[index].id}: ${levels[index].name}`);
  },
};

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentState;
}

export function useGameStore(): GameState;
export function useGameStore<T>(selector: (store: GameState) => T): T;
export function useGameStore<T>(selector?: (store: GameState) => T) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return selector ? selector(snapshot) : snapshot;
}
