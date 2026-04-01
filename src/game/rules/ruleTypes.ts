export interface Rule {
  name: string;
  modifyMovement: (dx: number, dy: number) => { dx: number; dy: number };
}
