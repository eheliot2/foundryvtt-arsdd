/** @override */
export const _getInitiativeFormula = function() {
  const actor = this.actor;
  if ( !actor ) return "1da";
  const init = actor.system.attributes.init;
  const dex = actor.system.abilities.dex.value;
  const skill = actor.system.skills[init.skill];
  const skilltotal = skill.value + skill.bonus;

  const parts = [`1da`, dex, skilltotal, init.bonus];

  return parts.join(" + ");
};