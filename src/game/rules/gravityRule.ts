import type { Rule } from "./ruleTypes";

export const gravityDown: Rule = {
  name: "down",
  modifyMovement: (dx, dy) => ({ dx, dy }),
};

export const gravityUp: Rule = {
  name: "up",
  modifyMovement: (dx, dy) => ({ dx, dy: -dy }),
};
