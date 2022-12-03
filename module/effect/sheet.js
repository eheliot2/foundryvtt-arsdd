export default class ActiveEffectConfigArsDD extends ActiveEffectConfig {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["sheet", "active-effect-sheet"],
        title: "EFFECT.ConfigTitle",
        template: "systems/arsdd/templates/effect/active-effect-config.html",
        width: 560,
        height: "auto",
        tabs: [{navSelector: ".tabs", contentSelector: "form", initial: "details"}]
        });
    } 

  /** @override */
  async getData(options) {
    const context = super.getData(options);
    context.config = CONFIG.ARSDD;
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".reset-duration").click(event => this._onResetDuration(event));
  }

  async _onResetDuration(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const effect = this.actor.effects.get(itemId);
    if (effect !== undefined) {
      const updateData = {};
      updateData["duration.startTime"] = game.time.worldTime;
      if (game.combats !== undefined && game.combat !== null ) {
        updateData["duration.startRound"] = game.combat.round;
      }
      await this.update(updateData);
    }
  }

}