import type { Rule } from "./ruleTypes";

export class RuleManager {
  activeRule: Rule;

  constructor(defaultRule: Rule) {
    this.activeRule = defaultRule;
  }

  setRule(rule: Rule) {
    this.activeRule = rule;
  }

  apply(dx: number, dy: number) {
    return this.activeRule.modifyMovement(dx, dy);
  }
}
