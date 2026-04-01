export type Direction = "up" | "right" | "down" | "left";

export type TileKind =
  | "empty"
  | "wall"
  | "goal"
  | "trap"
  | "gateUp"
  | "gateDown"
  | "oneWay"
  | "switch"
  | "door"
  | "teleport";

export interface Position {
  x: number;
  y: number;
}

export interface TileDefinition {
  kind: TileKind;
  direction?: Direction;
  id?: string;
  label?: string;
}

export interface LevelDefinition {
  id: number;
  name: string;
  start: Position;
  rulePoints: number;
  moveLimit: number;
  grid: TileDefinition[][];
}

export interface FeedbackState {
  id: number;
  kind: "idle" | "move" | "blocked" | "gravity" | "win" | "level" | "fail";
  message: string;
}
