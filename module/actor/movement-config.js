/**
 * A simple form to set actor movement speeds
 * @implements {DocumentSheet}
 */
export default class ActorMovementConfig extends DocumentSheet {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
      classes: ["arsdd"],
      template: "systems/arsdd/templates/actors/movement-config.html",
      width: 300,
      height: "auto"
    });
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    return `${game.i18n.localize("ARSDD.MovementConfig")}: ${this.document.name}`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData(options) {
    const sourceMovement = foundry.utils.getProperty(this.document._source, "system.attributes.movement") || {};
    const data = {
      movement: foundry.utils.deepClone(sourceMovement)
    };
    for ( let [k, v] of Object.entries(data.movement) ) {
      if ( ["hover"].includes(k) ) continue;
      data.movement[k] = Number.isNumeric(v) ? v.toNearest(0.1) : 0;
    }
    return data;
  }
}
