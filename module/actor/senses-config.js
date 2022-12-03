/**
 * A simple form to set actor movement speeds
 * @implements {DocumentSheet}
 */
export default class ActorSensesConfig extends DocumentSheet {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
      classes: ["arsdd"],
      template: "systems/arsdd/templates/actors/senses-config.html",
      width: 300,
      height: "auto"
    });
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    return `${game.i18n.localize("ARSDD.SensesConfig")}: ${this.document.name}`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData(options) {
    const senses = foundry.utils.getProperty(this.document._source, "system.attributes.senses") || {};
    const data = {
      senses: {},
    };
    for ( let [name, label] of Object.entries(CONFIG.ARSDD.senses2) ) {
      const v = senses[name];
      data.senses[name] = {
        label: game.i18n.localize(label),
        value: Number.isNumeric(v) ? v.toNearest(0.1) : 0
      }
    }
    return data;
  }
}
