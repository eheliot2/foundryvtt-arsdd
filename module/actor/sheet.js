import TraitSelector from "./trait-selector.js";
import ActorMovementConfig from "./movement-config.js";
import ActorSensesConfig from "./senses-config.js";
import ActorSkillsConfig from "./skills-config.js";
import ActiveEffectArsDD from "../effect/effects.js";

export default class ActorSheetArsDD extends ActorSheet {
  constructor(...args) {
    super(...args);

    /**
     * Track the set of item filters which are applied
     * @type {Set}
     */
    this._filters = {
      inventory: new Set(),
      spellbook: new Set(),
      features: new Set(),
      effects: new Set()
    };
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      scrollY: [
        ".inventory .inventory-list",
        ".features .inventory-list",
        ".spellbook .inventory-list",
        ".effects .inventory-list"
      ],
      tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description"}],
      classes: ["arsdd", "sheet", "actor", "character", "npc"],
      width: 720,
      height: 780
    });
  }

  get isReallyOwner() {
    return game.user.isGM || this.actor.system.isFollower || this.actor.flags.isPC;
  }

  /** @override */
  get template() {
    if ( !this.isReallyOwner ) return "systems/arsdd/templates/actors/limited-sheet.html";
    return `systems/arsdd/templates/actors/character-sheet.html`;
  }

  /** @override */
  async getData() {

    // Basic data
    const context = {
      limited: !this.isReallyOwner,
      options: this.options,
      editable: this.isEditable,
      cssClass: "editable",
      isPC: this.actor.flags.isPC,
      config: CONFIG.ARSDD,
    };

    // The Actor and its Items
    const actorData = this.actor.toObject(false);
    // target
    context.targetEligibility = this.actor.checkTarget();

    context.actor = actorData;
    context.items = actorData.items;

    context.items = this.actor.items.map(i => {
       i.system.labels = i.labels;
       return i;
    });
    for ( let i of context.items ) {
      const item = this.actor.items.get(i._id);
      i.labels = item.flags.labels;
    }

    context.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.system = context.actor.system;
    context.flags = context.actor.flags;
    context.labels = this.actor.labels || {};
    context.filters = this._filters;

    // Ability Scores
    for ( let [a, abl] of Object.entries(context.system.abilities)) {
      abl.label = CONFIG.ARSDD.abilities[a];
    }

    // Skills
    if (context.system.skills) {
      for ( let [s, skl] of Object.entries(context.system.skills)) {
        skl.label = CONFIG.ARSDD.skills[s];
        //colonne affichage
        skl.isCol1 = (skl.type == 1) || (skl.type == 2);
        skl.isCol2 = (skl.type == 3) || (skl.type == 4) || (skl.type == 5) || (skl.type == 8);
        skl.isCol3 = (skl.type == 6) || (skl.type == 7);
        skl.isBase = skl.base !== 5;
        skl.isRenamed = skl.label2 !== "";
        skl.isBonus = skl.bonus !== 0;
      }
    }

    context.movement = this._getMovementSpeed(context.actor);
    context.senses = this._getSenses(context.actor);

    //race visu
    if (context.system.attributes.groupRace.value !== undefined) {
      context.system.attributes.groupRace.selected = context.system.attributes.groupRace.value.reduce((obj, t) => {
        obj[t] = CONFIG.ARSDD.groupRaces[t];
        return obj;
      }, {});
    }
    if ( context.system.attributes.groupRace.custom ) {
      context.system.attributes.groupRace.custom.split(";").forEach((c, i) => context.system.attributes.groupRace.selected[`custom${i+1}`] = c.trim());
    }
  
    // Prepare owned items
    this._prepareItems(context);

    // Prepare active effects
    context.effects = ActiveEffectArsDD.prepareActiveEffects(this.actor.effects);
    // icon
    context.icon = {};

    if(this.actor.system.effectAttributes.temporary.current) context.icon.temporary = {title : "Action en cours", img: "systems/arsdd/icons/svg/checklist-blue.svg", class:"reset-temporary"};

    const concentration = this.actor.system.effectAttributes.other.concentration;
    if (concentration !== undefined) {
      if ( concentration.length === 1 ) context.icon.concentrated = {title : "Concentré", img: "systems/arsdd/icons/svg/wisdom-blue.svg", class:"reset-concentration"};
      else if ( concentration.length === 2 && this.actor.testTrait("trait_twiceConcentration")) context.icon.concentrated = {title : "Concentré", img: "systems/arsdd/icons/svg/wisdom-blue.svg", class:"reset-concentration"};
      else if ( concentration.length >1 ) context.icon.concentrated = {title : "Concentré", img: "systems/arsdd/icons/svg/wisdom-red.svg", class:"reset-concentration"};
    }

    context.icon.hands = {title : CONFIG.ARSDD.weaponHands[this.actor.hands], img: CONFIG.ARSDD.weaponHandsIcon[this.actor.hands], class:""};
    context.icon.armor = {title : CONFIG.ARSDD.armorSubtypes[this.actor.armor], img: CONFIG.ARSDD.armorSubtypesIcon[this.actor.armor], class:""};
    context.icon.attune = {title : game.i18n.localize("ARSDD.Attuned"), img: CONFIG.ARSDD.attune[this.actor.attune], class:""};
    if (context.system.attributes.encumbrance ) {
      context.icon.encumbered = {title : context.system.attributes.encumbrance.value + "/" + context.system.attributes.encumbrance.max, img: CONFIG.ARSDD.encumbranceIcon[context.system.attributes.encumbrance.mod], class:""};
    }

    if (!this.actor.flags.isPC) {
      context.biographyHTML = await TextEditor.enrichHTML(context.system.biography.value, {
        secrets: this.actor.isOwner,
        rollData: context.rollData,
        async: true,
        relativeTo: this.actor
      });
    }

    //prepa donnee pour export pdf eventuel
    //this.actor.preparePdf();

    // Return data to the sheet
    return context;
  }

  _getMovementSpeed(actorData) {
    const movement = actorData.system.attributes.movement || {};
    const tags = {};
    for ( let [k, label] of Object.entries(CONFIG.ARSDD.movementTypes) ) {
      const v = movement[k] ?? 0
      if ( v === 0 ) continue;
      tags[k] = `${game.i18n.localize(label)} ${v}`;
    }
    return tags;
  }

  _getSenses(actorData) {
    const senses = actorData.system.attributes.senses || {};
    const tags = {};
    for ( let [k, label] of Object.entries(CONFIG.ARSDD.senses) ) {
      const v = senses[k] ?? 0
      if ( v === 0 ) continue;
      tags[k] = `${game.i18n.localize(label)} ${v}`;
    }
    if ( !!senses.special ) tags["special"] = senses.special;
    return tags;
  }

  _prepareItems(context) {
    // Partition items by category
    let [items, spells, feats] = context.items.reduce((arr, item) => {
      // Classify items into types
      if ( item.flags.isSpell ) arr[1].push(item);
      else if ( item.flags.isFeat ) arr[2].push(item);
      else arr[0].push(item);
      return arr;
    }, [[], [], [], []]);
    
    // Apply active item filters
    items = this._filterItems(items, this._filters.inventory);
    spells = this._filterItems(spells, this._filters.spellbook);
    feats = this._filterItems(feats, this._filters.features);

    // Organize items
    const inventory = {
      weapon: { label: "ARSDD.ItemTypeWeaponPl", items: [], dataset: {type: "weapon"} },
      armor: { label: "ARSDD.ItemTypeArmorPl", items: [], dataset: {type: "armor"} },
      equipment: { label: "ARSDD.ItemTypeEquipmentPl", items: [], dataset: {type: "equipment"} },
      consumable: { label: "ARSDD.ItemTypeConsumablePl", items: [], dataset: {type: "consumable"} },
      backpack: { label: "ARSDD.ItemTypeContainerPl", items: [], dataset: {type: "backpack"} },
      loot: { label: "ARSDD.ItemTypeLootPl", items: [], dataset: {type: "loot"} }
    };
    for ( let i of items ) {
      inventory[i.type].items.push(i);
      i.flags.labels.use = i.system.action.uses.max > 0 ? "(" + i.system.action.uses.value + "/" + i.system.action.uses.max + ")" : "";
      i.flags.isOwned = true;
      if (i.effects.size > 0) {
        i.flags.effectsActor = this.actor.getEffectByItem(i._id);
        i.flags.effectsActor.forEach( e => e.setClassImgAction() );
      }
      this.checkTarget(i, context.targetEligibility);
    }
    for (const [key, value] of Object.entries(inventory)) {
      if (inventory[key].items.length ===0) delete inventory[key];
    }
    context.inventory = Object.values(inventory);

    //organize spells
    const spellbook = {
      spell: { label: "ARSDD.SpellSpell", items: [], dataset: {subtype: "spell"} },
      maneuver: { label: "ARSDD.SpellManeuver", items: [], dataset: {subtype: "maneuver"} },
      aura: { label: "ARSDD.SpellAura", items: [], dataset: {subtype: "aura"} },
      canalisation: { label: "ARSDD.SpellCanalisationr", items: [], dataset: {subtype: "canalisation"} },
      shout: { label: "ARSDD.SpellShout", items: [], dataset: {subtype: "shout"} },
      trap: { label: "ARSDD.SpellTrap", items: [], dataset: {subtype: "trap"} },
      stance: { label: "ARSDD.SpellStance", items: [], dataset: {subtype: "stance"} },
      ritual: { label: "ARSDD.SpellRitual", items: [], dataset: {subtype: "ritual"} },
      craft: { label: "ARSDD.SpellCraft", items: [], dataset: {subtype: "craft"} },
      power: { label: "ARSDD.SpellPower", items: [], dataset: {subtype: "power"} },
      other: { label: "Divers", items: [], dataset: {subtype: ""} }
    };
    for ( let i of spells ) {
      if (Object.keys(CONFIG.ARSDD.spellSubtypes).includes(i.system.subtype)) spellbook[i.system.subtype].items.push(i);
      else spellbook["other"].items.push(i);
      i.flags.isUsable = ( i.system.action.mpcost <= context.actor.system.attributes.mp.value + context.actor.system.attributes.mp.temp ) && i.system.learning.learnt;
      i.flags.isOwned = true;
      if (i.effects.size > 0) {
        i.flags.effectsActor = this.actor.getEffectByItem(i._id);
        i.flags.effectsActor.forEach( e => e.setClassImgAction() );
      }
      this.checkTarget(i, context.targetEligibility);
    }
    for (const [key, value] of Object.entries(spellbook)) {
      if (spellbook[key].items.length ===0) delete spellbook[key];
    }
    context.spellbook = Object.values(spellbook);

    const features = {
      feat: { label: "", items: feats, dataset: {subtype: "vv"} },
    }
    for ( let i of feats ) {
      if (i.effects.size > 0) {
        i.flags.effectsActor = this.actor.getEffectByItem(i._id);
        i.flags.effectsActor.forEach( e => e.setClassImgAction() );
      }
    }
    context.features = Object.values(features);

  }

  checkTarget(item, targetEligibility) {
    const action = item.system.action;
    const labels = item.flags.labels;
    if (!targetEligibility.target || action.actionType === null) {
      labels.actionIcon = "black";
      labels.actionToolTip = "Pas de cible";
      return;
    }

    labels.actionToolTip = "" 
    let warningColor = false;
    let stopColor = false;

    if (["shoot"].includes(action.actionType) && targetEligibility.adjacentSource) {
      warningColor = true;
      labels.actionToolTip += "Adversaire adjacent, "
    }
    if (!targetEligibility.los) {
      stopColor = true;
      labels.actionToolTip += "Adversaire hors los, "
    }
    else if (["shoot"].includes(action.actionType) && targetEligibility.cover > 0) {
      warningColor = true;
      labels.actionToolTip += "Adversaire à couvert (" + targetEligibility.cover + "), "
    }

    let distance = targetEligibility.distance;
    let range = 0;
    if (["case"].includes(action.range.units)) range += action.range.value;
    else if (["touch"].includes(action.range.units)) range += 1;
    else if (["battle"].includes(action.range.units)) range += 200;
    if (action.target.value !== null) distance += action.target.value;

    if ((distance > range && !action.range.long) || (distance > range *2 && action.range.long) ) {
      stopColor = true;
      labels.actionToolTip += "Adversaire hors de portée, "        
    }
    else if (distance > range && distance <= range *2 && action.range.long) {
      warningColor = true;
      labels.actionToolTip += "Adversaire en portée longue, "
    }

    if (stopColor) labels.actionIcon = "red";
    else if (warningColor) labels.actionIcon = "orange";    
    else labels.actionIcon = "green";
  }

  _filterItems(items, filters) {
    return items.filter(item => {
      const physicalItem = item.system.physicalItem;

      if ( filters.has("attuned") ) {
        if (physicalItem.attuned !== true) return false;
      }
      // Equipment-specific filters
      if ( filters.has("equipped") ) {
        if (physicalItem.equipped !== true ) return false;
      }
      return true;
    });
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers
  /* -------------------------------------------- */

  activateListeners(html) {
    // Activate Item Filters
    const filterLists = html.find(".filter-list");
    filterLists.each(this._initializeFilterItemList.bind(this));
    filterLists.on("click", ".filter-item", this._onToggleFilter.bind(this));

    // Editable Only Listeners
    if ( this.isEditable ) {
      // Input focus and update
      const inputs = html.find("input");
      inputs.focus(ev => ev.currentTarget.select());
      inputs.addBack().find('[data-dtype="Number"]').change(this._onChangeInputDelta.bind(this));

      // Trait Selector
      html.find('.trait-selector').click(this._onTraitSelector.bind(this));

      html.find('.delay-add1').click(this._onDelayAdd1.bind(this));      
      html.find('.delay-sub1').click(this._onDelaySubstract1.bind(this)); 

      html.find('.reset-concentration').click(this._onResetConcentration.bind(this)); 
      html.find('.reset-temporary').click(this._onResetTemporary.bind(this)); 

      // Configure Special Flags
      html.find('.config-button').click(this._onConfigMenu.bind(this));

      // Owned Item management
      html.find('.item-create').click(this._onItemCreate.bind(this));
      html.find('.item-edit').click(this._onItemEdit.bind(this));
      html.find('.item-delete').click(this._onItemDelete.bind(this));
      html.find('.item-toggle-home').click(this._onToggleItemHome.bind(this));
      html.find('.item-toggle-equipped').click(this._onToggleItemEquipped.bind(this));

      // Active Effect management
      html.find(".effect-control").click(ev => ActiveEffectArsDD.onManageActiveEffect(ev, this.document));

      // Rollable sheet actions
      html.find(".rollable[data-action]").click(this._onSheetAction.bind(this));
    }

    // Roll Skill Checks
    html.find('.skill-name').click(this._onRollSkillCheck.bind(this));

    // Item Rolling
    html.find('.item .item-action').click(event => this._onItemRollAction(event));
    html.find('.item .item-damage').click(event => this._onItemRollDamage(event));
    html.find('.item .item-healing').click(event => this._onItemRollHeal(event));
    html.find('.item .item-effect').click(event => this._onItemRollEffect(event));
    html.find('.item .item-area').click(event => this._onItemRollArea(event));

    // Handle default listeners last so system listeners are triggered first
    super.activateListeners(html);
  }

  _initializeFilterItemList(i, ul) {
    const set = this._filters[ul.dataset.filter];
    const filters = ul.querySelectorAll(".filter-item");
    for ( let li of filters ) {
      if ( set.has(li.dataset.filter) ) li.classList.add("active");
    }
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  _onChangeInputDelta(event) {
    const input = event.target;
    const value = input.value;
    if ( ["+", "-"].includes(value[0]) ) {
      let delta = parseFloat(value);
      input.value = getProperty(this.actor.data, input.name) + delta;
    } else if ( value[0] === "=" ) {
      input.value = value.slice(1);
    }
  }

  _onConfigMenu(event) {
    event.preventDefault();
    const button = event.currentTarget;
    switch ( button.dataset.action ) {
      case "movement":
        new ActorMovementConfig(this.object).render(true);
        break;
      case "senses":
        new ActorSensesConfig(this.object).render(true);
        break;
      case "skills":
        new ActorSkillsConfig(this.object).render(true);
        break;
      case "groupRace":
        const a = event.currentTarget;
        const label = a.parentElement.querySelector("label");
        const choices = CONFIG.ARSDD[a.dataset.options];
        const options = { name: a.dataset.target, title: label.innerText, choices };
        new TraitSelector(this.actor, options).render(true);
        break;
    }


  }

  /** @override */
  async _onDropItemCreate(itemData) {

    // Create the owned item as normal
    return super._onDropItemCreate(itemData);
  }

  async _onDropActiveEffect(event, data) {
    let effect =  super._onDropActiveEffect(event, data);
    return effect;
  }

  async _onItemRollAction(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    const targets = game.user.targets;
    await item.rollAction({event, targets});
  }

  async _onItemRollDamage(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    const targets = game.user.targets;
    await item.rollDamage({event, targets});
  }

  async _onItemRollHeal(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    const targets = game.user.targets;
    await item.rollDamage({event, targets});
  }

  async _onItemRollEffect(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const effectId = event.currentTarget.closest(".item-effect").dataset.itemId;
    const actor = this.actor;
    const effect = actor.effects.get(effectId);
    const flags = effect.flags;
    const targets = game.user.targets;

    if (flags.isSourceAura) {
      const updateData = {};
      updateData["flags.disabledAura"] = !flags.disabledAura;
      effect.update(updateData);
    }
    else if (targets.size > 0) {
      targets.forEach(function(target){ 
        let tgt = target.actor ?? target;
        if (tgt.id === actor.id) effect.update({disabled:!effect.disabled});
        else ActiveEffect.create(effect, {parent: tgt});
      });
    }
    else effect.update({disabled:!effect.disabled});
  }

  async _onItemRollArea(event) {
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    const template = game.arsdd.canvas.AbilityTemplate.fromItem(item);
    if ( template ) template.drawPreview();
  }

  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const itemData = {
      name: game.i18n.format("ARSDD.ItemNew", {type: game.i18n.localize(`ARSDD.ItemType${type.capitalize()}`)}),
      type: type,
      data: foundry.utils.deepClone(header.dataset)
    };
    delete itemData.type;
    return this.actor.createEmbeddedDocuments("Item", [itemData]);

  }

  _onItemEdit(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    item.sheet.render(true);
  }

  _onItemDelete(event) {
    event.preventDefault();
    const li = event.currentTarget.closest(".item");
    const item = this.actor.items.get(li.dataset.itemId);
    if ( item ) return item.delete();
  }

  _onRollSkillCheck(event) {
    event.preventDefault();
    const skill = event.currentTarget.parentElement.dataset.skill;
    this.actor.rollSkill(skill, {event: event});
  }

  _onToggleFilter(event) {
    event.preventDefault();
    const li = event.currentTarget;
    const set = this._filters[li.parentElement.dataset.filter];
    const filter = li.dataset.filter;
    if ( set.has(filter) ) set.delete(filter);
    else set.add(filter);
    this.render();
  }

  _onTraitSelector(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const label = a.parentElement.querySelector("label");
    const choices = CONFIG.ARSDD[a.dataset.options];
    const options = { name: a.dataset.target, title: label.innerText, choices };
    new TraitSelector(this.actor, options).render(true)
  }

  _onSheetAction(event) {
    event.preventDefault();
    const button = event.currentTarget;
    switch( button.dataset.action ) {
      case "exemple":
        return 0;
    }
  }

  _onToggleItemEquipped(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    const attr = "system.physicalItem.equipped";
    this.actor.addDelay(1);
    return item.update({[attr]: !getProperty(item, attr)});
  }

  _onToggleItemHome(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    const attr = "system.physicalItem.home";
    return item.update({[attr]: !getProperty(item, attr)});
  }

  _onDelayAdd1(event) {
    event.preventDefault();
    return this.actor.addDelay(1);
  }

  _onDelaySubstract1(event) {
    event.preventDefault();
    return this.actor.addDelay(-1);
  }

  _onResetConcentration(event) {
    event.preventDefault();
    const actor = this.actor;
    const cb = async function (actor) {
      return actor.resetConcentration();
    }

    let d = Dialog.confirm({
      title: "Concentration",
      content: "<p>Souhaitez vous mettre fin à vos effets à concentration ?</p>",
      yes: () => cb(actor),
      defaultYes: true
     });
  }

  _onResetTemporary(event) {
    event.preventDefault();
    const actor = this.actor;
    const cb = async function (actor) {
      return actor.resetTemporary();
    }

    let d = Dialog.confirm({
      title: "Action en 2 temps",
      content: "<p>Souhaitez vous mettre fin à une action en plusieurs temps et remettre à zéro les données temporaires  ?</p>",
      yes: () => cb(actor),
      defaultYes: true
     });
  }

}

