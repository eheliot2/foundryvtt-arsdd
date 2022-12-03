import {StressRoll, damageRoll} from "../dice/dice.js";

export default class ItemArsDD extends Item {

  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    this.update({permission: {default: CONST.DOCUMENT_PERMISSION_LEVELS.OWNER}});
  }

  _onUpdate(data, options, userId)  {
    super._onUpdate(data, options, userId);
    //action bonus sur changement equipement
    if (foundry.utils.hasProperty(data,"system.physicalItem.equipped")) this.actor.setActiveEffectByAction("bonus");
  }


  /* -------------------------------------------- */
  /*	Data Preparation														*/
  /* -------------------------------------------- */

  prepareData() {
    super.prepareData();
    const flags = this.flags;
    this.initFlags();
    const labels = flags.labels;
    //properties activation depuis proprio

    flags.isPhysical = this.system.physicalItem !== undefined;
    const physicalItem = flags.isPhysical ? this.system.physicalItem : {};

    //typ, subtype
    flags.isSpell = this.type === "spell";  
    flags.isFeat = this.type === "feat";
    flags.isEquipment = this.type === "equipment";
    flags.isWeapon = this.type === "weapon";
    flags.isArmor = this.type === "armor";
    flags.isConsumable = this.type === "consumable";
    flags.isLoot = this.type === "loot";
    flags.isBackpack = this.type === "backpack";
    flags.isStack = Number.isNumeric(physicalItem.quantity) && (physicalItem.quantity !== 1);
    flags.isEquipable = ["weapon", "equipment", "armor"].includes(this.type);
    labels.itemType = game.i18n.localize(`ARSDD.ItemType${this.type.titleCase()}`);
    const subtype = CONFIG.ARSDD[this.type+"Subtypes"];
    labels.subType = subtype ? subtype[this.system.subtype] : "";
    labels.img = this.img || DEFAULT_TOKEN;

    //action
    flags.isUsable = true;
    flags.allowAction = this.system.action !== undefined;
    const action =  flags.allowAction ? this.system.action : {};
    flags.hasAction = flags.allowAction && (action.actionType !== undefined) && (action.actionType !== null) && (action.actionType !== "");
    if (flags.hasAction) {
      flags.allowActivation = true;
      flags.hasActivation = (action.activation !== null) && (action.activation !== "") && (action.activation !== "none");
      switch (action.actionType) {
        case "skill":
          action.passiveAbility = null;
          action.passiveSkill = null;
          break;
        case "melee": 
          if (action.ability === null || action.ability === "") action.ability = "str";
          if (action.skill1 === null || action.skill1 === "") action.skill1 = "mel";
          action.passiveAbility = "dex";
          action.passiveSkill = "mel";
          break;   
        case "shoot": 
          if (action.ability === null || action.ability === "") action.ability = "dex";
          if (action.skill1 === null || action.skill1 === "") action.skill1 = "sho";
          action.passiveAbility = "dex";
          action.passiveSkill = "ath";
          break;  
        case "str": 
          action.passiveAbility = "str";
          action.passiveSkill = "ath";
          break;    
        case "dex": 
          action.passiveAbility = "dex";
          action.passiveSkill = "ath";
          break;
        case "con": 
          action.passiveAbility = "con";
          action.passiveSkill = "sur";
          break;   
        case "wis": 
          action.passiveAbility = "wis";
          action.passiveSkill = "dis";
          break;     
        case "int":
          action.passiveAbility = "int";
          action.passiveSkill = "dis";
          break;
        case "cha": 
          action.abilitypassive = "cha";
          action.passiveSkill = "dis";
          break;
        default:
          this.resetAction();
          break;
      }
      flags.hasSpecificDefense = action.actionType === "other";
    }
    else this.resetAction();

    // Damage
    let dam = action.damage || {};
    if ( dam.parts ) {
      labels.damageTypes = dam.parts.map(d => CONFIG.ARSDD.damageTypes[d[1]]).join(", ");
      labels.damageTypes = labels.damageTypes === ", " ? "" : labels.damageTypes;
      labels.healingTypes = dam.parts.map(d => CONFIG.ARSDD.healingTypes[d[1]]).join(", ");
      labels.healingTypes = labels.healingTypes === ", " ? "" : labels.healingTypes;  
    }
    flags.hasDamage = labels.damageTypes.length > 0 ;
    flags.hasHealing = labels.healingTypes.length > 0 ;

    //usage & activation
    if (flags.hasActivation) {
      flags.hasUses = action.uses.max > 0;
      if (flags.hasUses && action.uses.value === 0) flags.isUsable = false;
      flags.hasMp = action.mpcost > 0;
      flags.hasVirtus = flags.isSpell && (this.system.components.quantity > 0);
      flags.hasCost = flags.hasUses || flags.hasMp || flags.hasVirtus; 
      flags.hasTarget = !!action.target && !(["none",""].includes(action.target.type));
      flags.hasArea = action.target && (action.target.type in CONFIG.ARSDD.areaTargetTypes) ;
      flags.hasAreaTemplate = flags.hasArea && !["aura"].includes(this.system.subtype);
      flags.isLine = ["line"].includes(action.target?.type);
      flags.isCase = action.range?.units === "case";
      flags.isRound = action.duration?.units === "round";
      flags.allowConcentration = ["round", "minute10", "hour1", "hour8"].includes(action.duration?.units);
      flags.hasFormula = action.formula?.length > 0;      
    }
    else this.resetActivation();
        
    //nettoyage champ complementaire
    if (flags.hasAction && !flags.hasArea) action.target.value = null;
    if (flags.hasAction && !flags.isLine) action.range.width = null;
    if (flags.hasAction && !flags.isCase ) action.range.value = null;
    if (flags.hasAction && !flags.isRound) action.duration.value = null;
    if (flags.hasAction && !flags.allowConcentration) action.duration.concentration = false; 

    //active effect
    flags.allowEffect = !flags.isLoot && !flags.isBackpack;
    flags.hasActiveEffect = this.effects.size > 0;

    //qualite, prix, equipable
    if ( flags.isPhysical ) {
      physicalItem.quality.total = physicalItem.quality.craft + physicalItem.quality.material + physicalItem.quality.magie;
      if (physicalItem.quality.total > 0) physicalItem.price = this.qualityPrice();
    }
    if ( !physicalItem.attunement) physicalItem.attuned = false;

    if ( physicalItem.home ) flags.isUsable = false;
    else if (flags.isConsumable && physicalItem.quantity === 0) flags.isUsable = false;
    else if ( flags.isEquipable && !physicalItem.equipped ) flags.isUsable = false;
    else if ( physicalItem.attunement && !physicalItem.attuned ) flags.isUsable = false;
    if ( flags.isEquipable ) {
      labels.toggleEquippedClass = physicalItem.equipped ? "active" : "";
      labels.toggleEquippedTitle = game.i18n.localize(physicalItem.equipped ? "ARSDD.Equipped" : "ARSDD.Unequipped");
      labels.toggleHomeClass = physicalItem.home ? "active" : "";
      labels.toggleHomeTitle = game.i18n.localize(physicalItem.home ? "ARSDD.Home" : "ITEM.TypeBackpack");
    }
    if ( physicalItem.attunement ) {
      if ( physicalItem.attuned ) {
        labels.attunement = {
          icon: "fa-sun",
          cls: "attuned",
          title:  game.i18n.localize("ARSDD.AttunementAttuned")  
        };
      }
      else {
        labels.attunement = {
          icon: "fa-sun",
          cls: "not-attuned",
          title:  game.i18n.localize("ARSDD.AttunementRequired")
        };
      }
    } 
    //v&v
    if (flags.isFeat) {
      const learning = this.system.learning;
      if (learning.frequency === 0) learning.frequency = 1;
      if (learning.frequency > 1) flags.isMultiple=true;
      else flags.isMultiple=false;
    }

  }

  initFlags() {
    const flags = this.flags;
    flags.labels = {};
    flags.labels.damageTypes = "";
    flags.labels.healingTypes = "";
    if (flags.allowDelete === undefined) flags.allowDelete = false;

    flags.isItem = true;
    flags.isActor = false;
    flags.isSpell = false;  
    flags.isFeat = false;
    flags.isEquipment = false;
    flags.isWeapon = false;
    flags.isArmor = false;
    flags.isConsumable = false;
    flags.isLoot = false;
    flags.isBackpack = false;
    flags.isStack = false;
    flags.isEquipable = false;

    flags.allowAction = false;
    flags.hasAction = false;

    flags.allowActivation = false;
    flags.hasActivation = false;

    flags.allowEffect = false;
    flags.hasActiveEffect = false;

    flags.hasUses = false;
    flags.hasMp = false;
    flags.hasVirtus = false
    flags.hasCost = false;
    flags.hasTarget = false;
    flags.hasArea = false;
    flags.isLine = false;
    flags.isCase = false;
    flags.isRound = false;
    flags.allowConcentration = false; 
    flags.hasSpecificDefense = false;
    flags.hasFormula = false;
    flags.hasDamage = false ;
    flags.hasHealing = false;

    flags.isUsable = false;
  }

  resetAction() {
    const flags = this.flags;
    if (flags.allowAction) {
      const action =  this.system.action;
      action.activation = "";
      action.ability = null;
      action.skill1 = null;
      action.skill2 = null;
      action.passiveAbility = null;
      action.passiveSkill = null;
      action.attackBonus = 0;
      action.actionType = null;
      action.passiveAbility = null;
      action.passiveSkill = null;
    }
    flags.allowActivation = false;
    flags.hasActivation = false;
    this.resetActivation();
  }

  resetActivation() {
    const flags = this.flags;
    if (flags.allowAction) {
      const action =  this.system.action;
      action.delay= 0;
      action.uses.max= 0;
    }
    if (flags.isSpell) {
      const components = this.system.components;
      components.vocal = false;
      components.somatic = false;
      components.quantity = 0;
    }
  }

  _getUsageUpdates() {
    // Reference item data
    const actorUpdates = {};
    const itemUpdates = {};
    const flags = this.flags;

    if ( !flags.hasCost ) return true;
    const action = flags.hasAction ? this.system.action : {} ;

    if (flags.hasMp ) {
      const mpcost = action.mpcost
      const actorMp = this.actor.system.attributes.mp;
      const mpavailable = actorMp.value + actorMp.temp;
      if ( mpavailable < mpcost ) {
        ui.notifications.warn(game.i18n.format("ARSDD.ConsumeWarningNoSource", {name: this.name, type: "PM"}));
        return false;
      }      
      let mptemp = Math.min(mpcost, actorMp.temp);
      actorUpdates[`system.attributes.mp.temp`] = actorMp.temp - mptemp;
      actorUpdates[`system.attributes.mp.value`] = actorMp.value - (mpcost - mptemp);
    }

    if (flags.hasUses) {
      if ( action.uses.value === 0 )  {
        ui.notifications.warn(game.i18n.format("ARSDD.ConsumeWarningNoSource", {name: this.name, type: "Charge"}));
        return false;
      }
      itemUpdates["system.action.uses.value"] = action.uses.value - 1;
    }

    //conso virtus
    if (flags.hasVirtus ) {
      const virtus = this.system.components.quantity;
      const form = action.skill2;
      const virtusPack = this.actor.system.attributes.resources;
      let virtusavailable = 0;
      if ( form ) virtusavailable = virtusPack[form] ? virtusPack[form].value : 0;
      if ( virtusavailable < virtus ) {
        ui.notifications.warn(game.i18n.format("ARSDD.ConsumeWarningNoSource", {name: this.name, type: "virtus" + form}));
        return false;
      }
      actorUpdates[`system.attributes.resources.virtus[form].value`] =  virtusPack[form].value - virtus;
    }

    //resource particuliere reconnue
    if (flags.isSpell) {
      let resource = "";
      if (this.system.subtype === "channel") resource = "Canalisation";

      if (resource !== "") {
        const resources = this.actor.system.attributes.resources;
        let r;
        if (resource === resources.custom4.name) r = "custom4";
        else if (resource === resources.custom3.name) r = "custom3";
        else if (resource === resources.custom2.name) r = "custom2";
        else r = "custom1";
        if ( resources[r].value === 0 ) {
          ui.notifications.warn(game.i18n.format("ARSDD.ConsumeWarningNoSource", {name: this.name, type: resources.custom2.name}));
          return false;
        }
        actorUpdates[`system.attributes.resources[r].value`] =  resources[r].value - 1;
      }
    }

    // Return the configured usage
    if ( Object.keys(itemUpdates).length > 0 ) this.update(itemUpdates);
    if ( Object.keys(actorUpdates).length > 0) this.actor.update(actorUpdates);
    return true;
  }

  qualityPrice() {
    const quality = this.system.physicalItem.quality.total;
    if (quality <= 0 ) return 10;
    else if (quality === 1 ) return 100;
    else if (quality === 2 ) return 500;
    else if (quality === 3 ) return 1500;
    else if (quality === 4 ) return 3000;
    else if (quality <= 8 ) return ((quality - 4) *5000);
    else if (quality <= 12 ) return ((quality - 6) *10000);
    else if (quality <= 16 ) return ((quality - 9) *20000);
    else return ((quality - 14) * (quality - 14 +1) /2 *10000 + 110000);
  }

  async rollAction(options={}) {
    // const flags = this.actor.flags.arsdd || {};
    const title = `${this.name} - ${game.i18n.localize(this.system.action.actionType)}`;

    // get the parts and rollData for this item's attack
    const rollData = this.getRollData();
  
    // Define Roll bonuses
    const parts = [];

    // Compose roll options
    const rollConfig = mergeObject({
      actor: this.actor,
      data: rollData,
      title: title,
      flavor: title,
      event: options.event,
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      dialogOptions: {
        width: 400,
        top: options.event ? options.event.clientY - 80 : null,
        left: window.innerWidth - 710
      },
      messageData: {"flags.arsdd.roll": {type: "attack", itemId: this.id }},
      targetToken: []
    });

    const targetIterator = options.targets.values();
    for(const t of targetIterator) {
      var target = {actor:t.actor};
      rollConfig.targetToken.push(target);
    }

    const roll = await StressRoll(rollConfig);
    if ( roll === false || roll === null ) return null;
    this._getUsageUpdates();
    if (this.system.action !== undefined && this.system.action.delay > 0 ) this.actor.addDelay(this.system.action.delay);
    this.actor.setActiveEffectByAction(this.system.action.activation);
    return roll;
  }

  async rollDamage(options={}) {
    const messageData = {"flags.arsdd.roll": {type: "damage", itemId: this.id }};

    // Get roll data
    const rollData = this.getRollData();

    // if ( spellLevel ) rollData.item.level = spellLevel;

    // Configure the damage roll
    const actionFlavor = game.i18n.localize(this.system.action.actionType === "heal" ? "ARSDD.Healing" : "ARSDD.DamageRoll");
    const title = `${this.name} - ${actionFlavor}`;
    const rollConfig = {
      data: rollData,
      event: options.event,
      title: title,
      flavor: title,
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      dialogOptions: {
        width: 400,
        top: options.event ? options.event.clientY - 80 : null,
        left: window.innerWidth - 710
      },
      messageData: messageData,
      targetToken: []
    };
    const targetIterator = options.targets.values();
    for(const t of targetIterator) {
      var target = {actor:t.actor};
      rollConfig.targetToken.push(target);
    }

    // Call the roll helper utility
    return damageRoll(rollConfig);
  }

  async rollFormula(options={}) {
    if ( !this.system.action.formula ) {
      throw new Error("This Item does not have a formula to roll!");
    }

    // Define Roll Data
    const rollData = this.getRollData();
    if ( options.spellLevel ) rollData.item.level = options.spellLevel;
    const title = `${this.name} - ${game.i18n.localize("ARSDD.OtherFormula")}`;

    // Invoke the roll and submit it to chat
    const roll = new Roll(rollData.item.formula, rollData).roll();
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      flavor: title,
      rollMode: "roll",
      messageData: {"flags.arsdd.roll": {type: "other", itemId: this.id }}
    });
    return roll;
  }

  getRollData() {
    if ( !this.actor ) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.system);
    return rollData;
  }

  /* -------------------------------------------- */
  /*  Chat Message Helpers                        */
  /* -------------------------------------------- */

  static chatListeners(html) {
  //   html.on('click', '.card-buttons button', this._onChatCardAction.bind(this));
  //   html.on('click', '.item-name', this._onChatCardToggleContent.bind(this));
  }

  static _onChatCardToggleContent(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const card = header.closest(".chat-card");
    const content = card.querySelector(".card-content");
    content.style.display = content.style.display === "none" ? "block" : "none";
  }

  static _getChatCardActor(card) {

    // Case 1 - a synthetic actor from a Token
    const tokenKey = card.dataset.tokenId;
    if (tokenKey) {
      const [sceneId, tokenId] = tokenKey.split(".");
      const scene = game.scenes.get(sceneId);
      if (!scene) return null;
      const tokenData = scene.getEmbeddedDocuments("Token", tokenId);
      if (!tokenData) return null;
      const token = new Token(tokenData);
      return token.actor;
    }

    // Case 2 - use Actor ID directory
    const actorId = card.dataset.actorId;
    return game.actors.get(actorId) || null;
  }

}
