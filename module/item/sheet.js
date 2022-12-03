import TraitSelector from "../actor/trait-selector.js";
import ActiveEffectArsDD from "../effect/effects.js";

export default class ItemSheetArsDD extends ItemSheet {
  constructor(...args) {
    super(...args);

    this.options.width = this.position.width =  720;
    this.options.height = this.position.height = 680;

  }

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
      width: 560,
      height: 400,
      classes: ["arsdd", "sheet", "item"],
      resizable: true,
      scrollY: [".tab.details"],
      tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description"}]
    });
  }

  /** @override */
  get template() {
    return `systems/arsdd/templates/items/item.html`;
  }

  /** @override */
  async getData(options) {
    const context = await super.getData(options);
    const item = context.item;
    const source = item.toObject();
    context.source = source;
    context.system = item.system;
    context.flags = item.flags;
    context.labels = context.flags.labels;
    context.config = CONFIG.ARSDD;
    context.itemProperties = this._getItemProperties(context.item);
    if (!item.isOwned) context.effects = ActiveEffectArsDD.prepareActiveEffects(item.effects, item.isOwned);
    else if (item.isOwned && item.effects.size > 0) {
      const effectsActor = this.actor.getEffectByItem(item.id);
      context.effects = ActiveEffectArsDD.prepareActiveEffects(effectsActor, item.isOwned);
    }
    context.descriptionHTML = await TextEditor.enrichHTML(item.system.description.value, {
      secrets: item.isOwner,
      async: true,
      relativeTo: item
    });

    return context;
  }

  _getItemProperties(item) {
    const props = [];
    const labels = this.item.flags.labels;

    if ( item.type === "weapon" ) {
      props.push(...Object.entries(item.system.properties)
        .filter(e => e[1] === true)
        .map(e => CONFIG.ARSDD.weaponProperties[e[0]]));
    }
    else if ( item.type === "spell" ) {
      props.push(labels.components);
      if (item.action && item.action.duration.concentration) props.push(game.i18n.localize("ARSDD.Concentration"));
    }

    // Action type
    if ( item.flags.hasAction ) {
      props.push(CONFIG.ARSDD.itemActionTypes[item.system.action.actionType]);
    }

    return props.filter(p => !!p);
  }

  /** @override */
  setPosition(position={}) {
    if ( !(this._minimized  || position.height) ) {
      position.height = (this._tabs[0].active === "details") ? "auto" : this.options.height;
    }
    return super.setPosition(position);
  }

  /* -------------------------------------------- */
  /*  Form Submission                             */
	/* -------------------------------------------- */

  /** @override */
  _getSubmitData(updateData={}) {
    const formData = foundry.utils.expandObject(super._getSubmitData(updateData));
    const damage = formData.system?.action?.damage;
    if ( damage ) damage.parts = Object.values(damage?.parts || {}).map(d => [d[0] || "", d[1] || ""]);
    return foundry.utils.flattenObject(formData);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    if ( this.isEditable ) {
      html.find(".damage-control").click(this._onDamageControl.bind(this));
      html.find(".effect-control").click(ev => {
        // if ( this.item.isOwned ) return ui.notifications.warn("Managing Active Effects within an Owned Item is not currently supported and will be added in a subsequent update.")
        ActiveEffectArsDD.onManageActiveEffect(ev, this.item)
      });
    }
  }

  async _onDamageControl(event) {
    event.preventDefault();
    const a = event.currentTarget;

    // Add new damage component
    if ( a.classList.contains("add-damage") ) {
      await this._onSubmit(event);  // Submit any unsaved changes
      const damage = this.item.system.action.damage;
      return this.item.update({"data.action.damage.parts": damage.parts.concat([["", ""]])});
    }

    // Remove a damage component
    if ( a.classList.contains("delete-damage") ) {
      await this._onSubmit(event);  // Submit any unsaved changes
      const li = a.closest(".damage-part");
      const damage = foundry.utils.deepClone(this.item.system.action.damage);
      damage.parts.splice(Number(li.dataset.damagePart), 1);
      return this.item.update({"data.action.damage.parts": damage.parts});
    }
  }

  /** @override */
  async _onSubmit(...args) {
    if ( this._tabs[0].active === "details" ) this.position.height = "auto";
    await super._onSubmit(...args);
  }
}
