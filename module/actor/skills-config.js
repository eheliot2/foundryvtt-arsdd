/**
 * A simple form to set actor movement speeds
 * @implements {DocumentSheet}
 */
export default class ActorSkillsConfig extends DocumentSheet {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
      classes: ["arsdd"],
      template: "systems/arsdd/templates/actors/skills-config.html",
      width: 500,
      height: "auto"
    });
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    return `${game.i18n.localize("ARSDD.SkillsConfig")}: ${this.document.name}`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData(options) {
    const skillset = foundry.utils.getProperty(this.document._source, "system.skills") || {};
    const initset = foundry.utils.getProperty(this.document._source, "system.attributes.init") || {};
    const data = {
      skills: foundry.utils.deepClone(skillset),      
      init: foundry.utils.deepClone(initset)
    };

    for ( let [s, skl] of Object.entries(data.skills)) {
      skl.label = CONFIG.ARSDD.skills[s];
      skl.init = data.init.skill === s;
      skl.allowinit = skl.type === 1 || skl.type === 6 || skl.type === 8;
    }
    return data;
  }
}
