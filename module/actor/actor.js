import { StressRoll, damageRoll } from "../dice/dice.js";

export default class ActorArsDD extends Actor {

  /** @override */
  prepareDerivedData() {
    this.initFlags();

    this.setSkills();

    if (this.flags.isPC) {
      this.setLevelFeat();
      this.setHpMp();
      this.setFollower();

    }
    this.setEncumbrance();
    this.setInitiative();
    this.setMovement();
    this.setSenses();

    //this.setToken();
  }


  /** @override */
  getRollData() {
    const data = foundry.utils.deepClone(super.getRollData());
    data.actor = this; 
    return data;
  }

  /** @override */
  async updateEmbeddedDocuments(embeddedName, data, options={}) {
    const createItems = [];
    let updated = await super.updateEmbeddedDocuments(embeddedName, data, options);
    if ( createItems.length ) await this.createEmbeddedDocuments("Item", createItems);
    return updated;
  }

  /* -------------------------------------------- */
  /*  Data Preparation Helpers                    */
  /* -------------------------------------------- */
  initFlags() {
    const flags = this.flags;
    flags.labels = {};
    flags.isPC = this.type === "character";
    flags.isActor=true;
    flags.isItem=false;
  }

  setSkills() {
    // Prepare skills
    const skills = this.system.skills;
    this.system.attributes.skillXp = 0;
    for (let [id, skl] of Object.entries(skills)) {
      //rank
      skl.rank = Math.floor((Math.sqrt(1+(Math.max(skl.value+skl.bonus,0))*8)-1)/2);
      this.system.attributes.skillXp += skl.value*(skl.value+1)/2*skl.base+skl.xp;
    }
  }

  setEncumbrance() {
    const skills = this.system.skills;
    const abilities = this.system.abilities;
    const attributes = this.system.attributes;
    const items = this.items;
    attributes.encumbrance = {};

    // Get the total weight from items
    const physicalItemList = ["weapon", "equipment", "consumable", "armor", "backpack", "loot"];
    let weight = items.reduce((weight, i) => {
      if ( !physicalItemList.includes(i.type) ) return weight;   
      const physicalItem = i.system.physicalItem;
      if ( physicalItem.home ) return weight;
      const q = physicalItem.quantity || 0;
      const w = physicalItem.weight || 0;
      return weight + (q * w);
    }, 0);

    weight += attributes.resources.currency.value *0.002;
    for (const [key, v] of Object.entries(attributes.resources.virtus)) {
      weight += v.value *0.01;
    }
    attributes.encumbrance.value = weight.toNearest(0.1);

    // Determine the encumbrance size class
    attributes.encumbrance.max = (10 + abilities.str.value *2 + skills.ath.rank *2) * Math.pow(2,attributes.size);
    if ( this.testTrait("trait_powerfulBuild") ) attributes.encumbrance.max = attributes.encumbrance.max * 1.33;

    // Compute Encumbrance percentage
    const pct = Math.floor(attributes.encumbrance.value * 100 / attributes.encumbrance.max);
    if (pct >= 200 ) attributes.encumbrance.mod = 4;
    else if ( pct >= 150 ) attributes.encumbrance.mod = 3;
    else if ( pct >= 125 ) attributes.encumbrance.mod = 2;
    else if ( pct >= 100 ) attributes.encumbrance.mod = 1;
    else attributes.encumbrance.mod = 0;

    attributes.encumbrance.personnal = 20 * Math.pow(2,attributes.size);
  }

  setFollower() {
    const skills = this.system.skills;
    const abilities = this.system.abilities;
    const attributes = this.system.attributes;
    attributes.resources.follower.max=Math.max(1,abilities.cha.value+skills.per.rank) + attributes.resources.follower.bonus;
  }

  setLevelFeat() {
    const attributes = this.system.attributes;

    attributes.feat = {virtue:0, virtuemax:0, flaw:0, major:0, majormax:0};
    this.items.forEach( v => {
      if ( v.type ==="feat") {
          const val = parseInt(v.system.learning.value)*parseInt(v.system.learning.frequency);
          if (val < 0) attributes.feat.flaw += Math.abs(val);
          else attributes.feat.virtue += val;
          if (val === 3 ) attributes.feat.major ++;
      } 
    });
    if (attributes.feat.major > 0) attributes.feat.virtue += -3;
    
    attributes.level = Math.floor(attributes.xp / 100);
    attributes.tier = Math.ceil(attributes.level /4);
    attributes.feat.virtuemax = attributes.level +2*Math.floor(attributes.level /4);
    attributes.feat.virtuemax += Math.min(attributes.feat.flaw,10);

    attributes.feat.majormax = attributes.tier +2;
  }

  setHpMp() {
    const abilities = this.system.abilities;
    const attributes = this.system.attributes;
    const status = this.system.effectAttributes.status;
    attributes.hp.max = (5 + abilities.con.value) * (5 + attributes.size) + 5*attributes.level + attributes.hp.tempmax;
    if ( attributes.hp.value > attributes.hp.max ) attributes.hp.value = attributes.hp.max;
    attributes.mp.max = 9 + 3*Math.max(0,abilities.con.value) +3*Math.max(0,abilities.wis.value) + 3*attributes.level + attributes.mp.tempmax;
    if ( status.exhaustion > 0) attributes.mp.max = Math.max(0,attributes.mp.max - 5*status.exhaustion);
    if ( attributes.mp.value > attributes.mp.max ) attributes.mp.value = attributes.mp.max;

    status.wounded = attributes.hp.max > attributes.hp.value ? 1 : 0;
    status.bloodied = attributes.hp.max*0.5 > attributes.hp.value ? 1 : 0;
    status.critical = attributes.hp.max*0.25 > attributes.hp.value ? 1 : 0;
  }

  setInitiative() {
    const abilities = this.system.abilities;
    const attributes = this.system.attributes;
    const skills = this.system.skills;
    const init = attributes.init;
    const initSkill = skills[init.skill];
    init.value = abilities.dex.value + initSkill.value + initSkill.bonus + init.bonus;
    init.label = initSkill.isRenamed ? initSkill.label2 : CONFIG.ARSDD.skills[init.skill];
    if(init.delay === undefined || init.delay === null) init.delay = 0;
  }

  setMovement() {
    const movement = this.system.attributes.movement;
    const status = this.system.effectAttributes.status;
    const enc = this.system.attributes.encumbrance.mod;
    
    //traiter le swim en fonction de la scene
    if (status.stopped > 0 || status.restrained > 0 || status.grappled > 0) {
      movement.tactical = 0;
      movement.travel = 0;
      return;
    }

    movement.tactical = Math.max(movement.walk,movement.fly) - status.exhaustion - enc;
    if (status.slowed >0) movement.tactical = Math.floor(movement.tactical/2);
    movement.tactical = Math.max(1, movement.tactical);

    //travel
    const str = this.system.abilities.str.value >0 ? this.system.abilities.str.value /5 : 0;
    const ath = (this.system.skills.ath.value + this.system.skills.ath.bonus) /5;
    const tai = this.system.attributes.size > 0 ? this.system.attributes.size /2 : 0;
    movement.travel = movement.tactical + str + ath + tai ;
    if (movement.fly > 0 && status.exhaustion === 0) movement.travel +=2;
    movement.travel = movement.travel.toNearest(0.1);
  }

  setSenses() {
    const senses = this.system.attributes.senses;
    const status = this.system.effectAttributes.status;
    const skills = this.system.skills;
    const abilities = this.system.abilities;
    const baseSight = abilities.wis.value+skills.prc.rank;
    senses.brightvision = 36 + baseSight;
    senses.dimvision = 3 + baseSight;
    senses.passivePerception = 6 + abilities.wis.value + skills.prc.value + skills.prc.bonus ;

    const darkness = game.scenes ? game.scenes.active?.darkness : 0;

    const token = this.getToken();
    const updateData = {}; 
    const light = this.valueTrait("trait_light");
    updateData.light = {
      dim: light *2,
      bright: light,
      color: "#f9af2f",
      coloration: 1,
      angle: 360,
      gradual: true,
      alpha: 0.6,
      animation: {
        intersity: 5,
        speed: 4,
        type: "torch"
      }
    };

    senses.allowBrightvision = senses.brightvision > 0 && status.blinded === 0 && status.unconscious === 0 && darkness < CONFIG.ARSDD.LIGHT_SCENE.DIM;
    senses.allowDimvision = senses.dimvision > 0 && status.blinded === 0 && status.unconscious === 0 && darkness < CONFIG.ARSDD.LIGHT_SCENE.DARK;
    senses.allowDarkvision = senses.darkvision > 0 && status.blinded === 0 && status.unconscious === 0;

    if (senses.allowBrightvision) senses.distance = senses.brightvision;
    else if (senses.allowDimvision) senses.distance = senses.dimvision;
    else senses.distance = 0;

    senses.allowHearingsight = senses.hearingsight > 0 && status.deafened === 0 && status.unconscious === 0;
    senses.allowSmellingsight = senses.smellingsight > 0 && status.poisoned === 0 && status.unconscious === 0;
    senses.allowTouchsight = senses.touchsight > 0 && status.paralyzed === 0 && status.petrified === 0;   
    senses.allowTruesight = senses.truesight > 0 && status.unconscious === 0;

    if (senses.allowDarkvision && darkness >= CONFIG.ARSDD.LIGHT_SCENE.DIM && darkness < 1 ) senses.distance = Math.max(senses.distance, senses.darkvision);
    if (senses.allowTouchsight) senses.distance = Math.max(senses.distance, senses.touchsight);
    if (senses.allowTruesight) senses.distance = Math.max(senses.distance, senses.truesight);
    updateData.sight = {range:senses.distance};

 
    if (token) token.document.update(updateData);
  }

  //prepare pour export via pdf sheet 
  preparePdf() {
    if (!this.flags.isPC) return;
    const abilities = this.system.abilities;
    const skills = this.system.skills;
    const custom = ["ats", "bos", "chf", "chd", "itm"].filter(s => skills[s].value >0).slice(0,1);


    if (custom[0]) {
      this.flags.skillCustom1 = skills[custom[0]];
      this.flags.skillCustom1.label2 = game.i18n.localize(CONFIG.ARSDD.skills[custom[0]]);
    }
    if (custom[1]) {
      this.flags.skillCustom2 = skills[custom[0]];
      this.flags.skillCustom2.label2 = game.i18n.localize(CONFIG.ARSDD.skills[custom[0]]);
    }


    const items = this.items;
    for( const i of items) {
      const itemData = i.system;
      const flags = i.flags;
      const action = itemData.action ?? null;
      flags.pdf = {};
      if (i.type === "feat") {
        flags.pdf.description = i.name + " : " + itemData.description.value ? itemData.description.value.replace(/(<([^>]+)>)/ig, "") : "";
        flags.pdf.cost = itemData.learning.value * itemData.learning.frequency;
      }
      else if (i.type === "spell") {
        flags.pdf.name= i.name;
        flags.pdf.ability = action?.ability ?? "";
        flags.pdf.skill1 = action?.skill1 ?? "";
        flags.pdf.skill2 = action?.skill2 ?? "";
        flags.pdf.passiveability = action?.passiveAbility ?? "";
        flags.pdf.passiveskill = action?.passiveSkill ?? ""
        flags.pdf.mp = action?.mpcost ?? "";
        flags.pdf.delay = action?.delay ?? "";
        flags.pdf.description = itemData.description.value ? itemData.description.value.replace(/(<([^>]+)>)/ig, "") : "";
        flags.pdf.action = action?.activation ?? "";
        if (action?.uses.max > 0) flags.pdf.action += " (" + action.uses.max + " " + action.uses.per + ")";
        if (!action?.range || action?.range.units === "") flags.pdf.rang = "";
        else if (action?.range.units === "case") flags.pdf.range = action?.range.value;
        else flags.pdf.range = game.i18n.localize(CONFIG.ARSDD.distanceUnits[action.range.units]);
        if (action?.range.long) flags.pdf.range += " (L)";
        if (!action?.target || action?.target.type === "" || !["ennemy","ally","sphere","cone","cube","line","wall"].includes(action.target.type)) flags.pdf.area= "";
        else flags.pdf.target = game.i18n.localize(CONFIG.ARSDD.targetTypes[action.target.type]) + action.target.value ;
        if (action?.target.type === "line") flags.pdf.area += " (L " + action.target.width + ")";    
        if (!action?.duration || action?.duration.units === "") flags.pdf.duration = "";
        else if (action?.duration.units === "round") flags.pdf.duration = action.duration.value;
        else flags.pdf.duration = game.i18n.localize(CONFIG.ARSDD.timePeriods[action.duration.units]);
        flags.pdf.concentration = action?.duration.concentration ? "X" : "";
        flags.pdf.verbal = itemData.components.verbal ? "X" : "";
        flags.pdf.somatic = itemData.components.somatic ? "X" : "";
        flags.pdf.material = itemData.components.quantity >0 ? itemData.components.quantity + " pions" : "";
        flags.pdf.score = itemData.learning?.score;

        let difficulty = 6;
        if (action?.level > 0) difficulty += action.level;
        if (action?.attackBonus !== 0) difficulty -= action.attackBonus;
        flags.pdf.threshold = difficulty;

        let total = abilities[action.ability].value;
        const skill1 = skills[action.skill1];
        if ( action.skill2 === "" || action.skill2 === null ) {
          total += skill1.value + skill1.bonus;
        }
        else {
          const skill2 = skills[action.skill2];
          total += Math.max(skill1.value + skill1.bonus, skill2.value + skill2.bonus) + Math.min(skill1.rank, skill2.rank);
        }
        flags.pdf.total = total;
        flags.pdf.margin = total - difficulty;
      }
      else {
        flags.pdf.description = i.name + " : " + itemData.description.value ? itemData.description.value.replace(/(<([^>]+)>)/ig, "") : "";
      }
    }
  }


  /* -------------------------------------------- */
  /*  Socket Listeners and Handlers
  /* -------------------------------------------- */

  /** @override */
  async _preUpdate(updateData, options, user) {
    super._preUpdate(updateData, options, user);
    const skillUpdate = foundry.utils.getProperty(updateData, "system.skills");
    if (skillUpdate) {
      for ( let [newSkill, obj] of Object.entries(skillUpdate) ) {
        let newXp = foundry.utils.getProperty(obj, "xp");
        if (!newXp ) continue;
        const oldSkill = this.system.skills[newSkill];
        let newValue = foundry.utils.getProperty(obj, "value");
        if (!newValue) newValue = oldSkill.value;
        let newBase = foundry.utils.getProperty(obj, "base");
        if (!newBase) newBase = oldSkill.base;
        while (newXp >= (newValue +1) * newBase) {
          newValue ++;
          newXp -= newValue * newBase;
        }
        updateData.skills[newSkill].xp = newXp;
        updateData.skills[newSkill].value = newValue;
      }
    }

    // Apply changes in Actor size to Token width/height
    const newSize = foundry.utils.hasProperty(updateData, "system.attributes.size") ? foundry.utils.getProperty(updateData, "system.attributes.size") : this.system.attributes.size;
    const newName = foundry.utils.hasProperty(updateData, "name") ? foundry.utils.getProperty(updateData, "name") : this.nme;
    const newImg = foundry.utils.hasProperty(updateData, "img") ? foundry.utils.getProperty(updateData, "img") : this.img;

    if ( (newSize !== this.system.attributes?.size) || (newName !== this.nme) || (newImg !== this.img) ) {
      const size = CONFIG.ARSDD.tokenSizes[newSize];
      updateData["prototypeToken.height"] = size;
      updateData["prototypeToken.width"] = size;
      updateData["prototypeToken.name"] = newName;
      updateData["prototypeToken.texture.src"] = newImg;
      
      const tokens = this.getActiveTokens();
      if (tokens.length > 0) {
        for (const token of tokens) {
          token.document.update({height : size, width : size, name: newName, texture : {src:newImg}});
        }
      } 
    }
  }

  /** @override */
  async createEmbeddedDocuments(embeddedName, itemData, options={}) {

    // Pre-creation steps for owned items
    if ( embeddedName === "OwnedItem" ) this._preCreateOwnedItem(itemData, options);

    // Standard embedded doc creation
    return super.createEmbeddedDocuments(embeddedName, itemData, options);
  }

  _preCreateOwnedItem(itemData, options) {
    const isNPC = this.type === 'npc';
    const createData = {};
    if (isNPC) {
      if (["weapon", "equipment", "armor"].includes(itemData.type)) {
        createData["system.physicalItem.equipped"] = true;
        if (itemData.physicalItem.attunement) createData["system.physicalItem.attuned"] = true;
      }
      else if (["spell"].includes(itemData.type)) createData["system.learning.learnt"] = true;
    }
    mergeObject(itemData, createData);
  }

  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    const updateData = {}
    updateData.prototypeToken = {actorLink : true};
    if ( this.type === "character" ) {
      updateData.prototypeToken.disposition = CONST.TOKEN_DISPOSITIONS.FRIENDLY;
    }
    updateData.permission = {default: CONST.DOCUMENT_PERMISSION_LEVELS.OWNER};
    this.update(updateData);
  }


  /* -------------------------------------------- */
  /*  Gameplay Mechanics                          */
  /* -------------------------------------------- */

  async rollSkill(skillId, options={}) {
    const skills = this.system.skills
    // Compose roll parts and data
    const rollData = this.getRollData();
    const item = rollData.item = {};
    item.properties = [];
    const action = rollData.item.action = {};
    action.ability = options.ability ? options.ability : this.system.skills[skillId].ability;
    action.skill1 = skillId;
    action.skill2 = options.skill2 ?? "";
    action.actionType = options.actionType ?? "skill";
    action.passiveAbility = options.passiveAbility ?? null; 
    action.passiveSkill = options.passiveAbility ?? null; 
    action.damage = {parts:[]};

    // Roll and return
    const rollConfig = mergeObject({
      data: rollData,
      title: options.title ?? CONFIG.ARSDD.skills[skillId],
      speaker: ChatMessage.getSpeaker({actor: this}),
      fastForward: options.fastForward ?? null,
      event: options.event ?? {},
      difficulty: options.difficulty ?? 6,
      messageData: {"flags.arsdd.roll": {type: "skill", skillId }}

    });
    return StressRoll(rollConfig);
  }

  /** @override */
  async modifyTokenAttribute(attribute, value, isDelta, isBar) {
    if ( attribute === "attributes.hp" ) {
      const hp = getProperty(this.system, attribute);
      const delta = isDelta ? (-1 * value) : (hp.value + hp.temp) - value;
      return this.applyDamage(delta);
    }
    return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
  }

  async applyDamage(amount=0, dmgHealType="damage") {
    //amount = Math.max(0, amount);
    const hp = this.system.attributes.hp;
    const mp = this.system.attributes.mp;
    const hptmp = parseInt(hp.temp) || 0;
    const mptmp = parseInt(mp.temp) || 0;
    let newhptmp, newmptmp, newhp, newmp;


    if (dmgHealType == "healing") {
      newhptmp = hptmp;
      newhp = Math.max(0, Math.min(hp.value + amount, hp.max));
      newmptmp = mptmp;
      newmp = mp.value;
    }
    else if (dmgHealType == "temphp") {
      newhptmp = Math.max(hptmp, amount);
      newhp = hp.value;
      newmptmp = mptmp;
      newmp = mp.value;
    }
    else if (dmgHealType == "healingmp") {
      newhptmp = hptmp;
      newhp = hp.value;
      newmptmp = mptmp;
      newmp = Math.max(0, Math.min(mp.value + amount, mp.max));
    }
    else if (dmgHealType == "tempmp") {
      newhptmp = hptmp;
      newhp = hp.value;
      newmptmp = Math.max(mptmp, amount);
      newmp = mp.value;
    }  
    else {
      newmptmp = mptmp;
      newmp = mp.value;
      // Deduct damage from temp HP first
      newhptmp = hptmp - Math.min(hptmp, amount);
      
      // Remaining goes to health
      newhp = Math.max(0, Math.min(hp.value - (amount - Math.min(hptmp, amount)), hp.max));
    }

    // Update the Actor
    const updateData = {
      "system.attributes.hp.temp": newhptmp,
      "system.attributes.hp.value": newhp,
      "system.attributes.mp.temp": newmptmp,
      "system.attributes.mp.value": newmp
    };
    
    //jet de concentration
    if (((dmgHealType === "damage" && amount > 0) || amount <0) && this.system.effectAttributes.other.concentration.length > 0) {
      const malus = this.system.effectAttributes.other.concentrationRound ?? 0;
      const diff = Math.max(6, Math.floor(Math.abs(amount)/2)) + malus;  
      let roll = await this.rollSkill("dis",{fastForward:true,difficulty:diff,actionType:"other", title:"Concentration "});
      if (roll.dice[0].options.fumble > 0 || roll.dice[0].options.margin < 0) await this.resetConcentration();
      else updateData["system.effectAttributes.other.concentrationRound"] = malus + 1;
    }

    return this.update(updateData);
  }

  async shortRest() {
    let roll = await this.rollSkill("dis",{fastForward:true});
    if (roll.dice[0].options.fumble === 0 && roll.dice[0].options.margin >= 0) {
      const temporary = this.system.effectAttributes.temporary;
      const abilities = this.system.abilities;
      temporary.current = true;
      temporary.success = true;
      temporary.rawmargin = roll.dice[0].options.margin;
      temporary.critical = roll.dice[0].options.critical;
      const rollData = this.getRollData();
      const item = rollData.item = {action:{}};;
      const action = item.action;
      action.actionType = "other";
      action.damage = {parts : [["2d6+"+abilities.wis.value, "healingmp"]]};
      item.properties = [];

      const rollConfig = mergeObject({
        data: rollData,
        title: game.i18n.format("ARSDD.ShortRest"),
        speaker: ChatMessage.getSpeaker({actor: this}),
        flavor: game.i18n.format("ARSDD.ShortRest"),
        targetToken:[{actor:this, data:{}}]
      });

      await damageRoll(rollConfig);
    }

    // Recover character resources
    const updateData = {};
    const resources = this.system.attributes.resources;
    if (resources.custom1.max > 0 && resources.custom1.recoverShortRest) updateData["system.attributes.resources.custom1.value"]=resources.custom1.max;
    if (resources.custom2.max > 0 && resources.custom2.recoverShortRest) updateData["system.attributes.resources.custom2.value"]=resources.custom2.max;
    if (resources.custom3.max > 0 && resources.custom3.recoverShortRest) updateData["system.attributes.resources.custom3.value"]=resources.custom3.max;
    if (resources.custom4.max > 0 && resources.custom4.recoverShortRest) updateData["system.attributes.resources.custom4.value"]=resources.custom4.max;
    if (updateData.length) this.update(updateData);

    // Recover item uses
    const items = this.items.filter(item => item.system.uses && ["sr"].includes(item.system.uses.per));
    const updateItems = items.map(item => {
      return {
        _id: item._id,
        "system.uses.value": item.system.uses.max
      };
    });
    if ( updateItems.length ) await this.updateEmbeddedDocuments("Item", updateItems);
  }

  async longRest() {
    const attributes = this.system.attributes;
    const resources = this.system.attributes.resources;

    // Recover hit points to full, and eliminate any existing temporary HP
    const updateData = {
      "system.attributes.mp.value": attributes.mp.max,
      "system.attributes.hp.temp": 0,
      "system.attributes.mp.temp": 0,
      "system.attributes.resources.inspiration": true,
      "system.attributes.resources.confidence.value": attributes.resources.confidence.max,
      "system.attributes.resources.custom1.value": resources.custom1.max,
      "system.attributes.resources.custom2.value": resources.custom2.max,
      "system.attributes.resources.custom3.value": resources.custom3.max,
      "system.attributes.resources.custom4.value": resources.custom4.max,
    };
    await this.update(updateData);

    let roll = await this.rollSkill("sur",{fastForward:true});
    if (roll.dice[0].options.fumble === 0 && roll.dice[0].options.margin >= 0) {
      const temporary = this.system.effectAttributes.temporary;
      const abilities = this.system.abilities;
      temporary.current = true;
      temporary.success = true;
      temporary.rawmargin = roll.dice[0].options.margin;
      temporary.critical = roll.dice[0].options.critical;
      const rollData = this.getRollData();
      const item = rollData.item = {action:{}};
      const action = item.action;
      action.actionType = "other";
      action.damage = {parts: [["2d6+"+abilities.con.value, "healing"]]};
      item.properties = [];

      const rollConfig = mergeObject({
        data: rollData,
        title: game.i18n.format("ARSDD.LongRest"),
        speaker: ChatMessage.getSpeaker({actor: this}),
        flavor: game.i18n.format("ARSDD.LongRest"),
        targetToken:[{actor:this, data:{}}]
      });

      await damageRoll(rollConfig);
    }

    // Iterate over owned items, restoring uses per day and recovering Hit Dice
    const items = this.items.filter(item => item.system.uses && ["sr", "lr"].includes(item.system.uses.per));
    const updateItems = items.map(item => {
      return {
        _id: item._id,
        "system.uses.value": item.system.uses.max
      };
    });
    if ( updateItems.length ) await this.updateEmbeddedDocuments("Item", updateItems);
  }

  //effect
  testTrait(trait) {
    for (let e of this.effects){
      if (e.disabled || e.flags.traits === undefined ) continue;
      if (e.flags.traits.indexOf(trait) > -1 ) return true;
    }
    return false;
  } 

  countTrait(trait) {
    let c = 0;
    for (let e of this.effects){
      if (e.disabled || e.flags.traits ===undefined || e.flags.traits ==="" ) continue;  
      let traits = e.flags.traits.split(";"); 
      traits.forEach((value) => {
        if (value === trait ) c++;
      });
    }
    return c;
  } 

  valueTrait(trait) {
    let value=0;
    for (let e of this.effects){
      if (e.disabled || e.flags.traits === undefined ) continue;
      if (e.flags.traits.indexOf(trait) > -1 ) {
        for (let t of e.flags.traits.split(";")) {
          if (t.indexOf(trait) > -1 ) {
            let v = parseInt(t.replace(trait,''),10);
            value = Math.max(value, v);
          }
        }
      }
    }
    return value;
  }

  async checkEffect(action, actor) {
    for (let e of this.effects){
      if (e.flags.enableAutomation) await e.setForRoll(action, actor);
    }
  }

  async restoreAfterRoll(rollType) {
    for (let e of this.effects){
      if (e.flags.enableAutomation) await e.restoreAfterRoll(rollType);
    }    
  }

  //concentration : [{ itemId : itemid, effects : [{actorId : actorid, effectId, effectid}]}]
  async resetConcentration(dueOnly = false) {
    const concentration=this.system.effectAttributes.other.concentration;
    if (concentration.length === 0) return;
    //effets orphelins
    for (const itemData of concentration) {
      for( const effectData of itemData.effects) {
        const actorTarget = game.actors.get(effectData.actorId);
        if (actorTarget === undefined) {
          if (itemData.effects.length <= 1) {
            const index = concentration.findIndex(item => item.itemId === itemData.itemId);
            if (index > -1) concentration.splice(index,1);
          }
          else {
            const index = itemData.effects.findIndex(effect => effect.actorId === effectData.actorId && effect.effectId === effectData.effectId);
            if (index > -1) itemData.effects.splice(index,1);
          }
        }
        else {
          const effectTarget = actorTarget.effects.get(effectData.effectId);
          if (effectTarget === undefined) {
            if (itemData.effects.length <= 1) {            
              const index = concentration.findIndex(item => item.itemId === itemData.itemId);
              if (index > -1) concentration.splice(index,1);
            }
            else {
              const index = itemData.effects.findIndex(effect => effect.actorId === effectData.actorId && effect.effectId === effectData.effectId);
              if (index > -1) itemData.effects.splice(index,1);
            }          
          } 
        }
      }
    }
    const updateData = {};
    updateData["system.effectAttributes.other.concentration"] = concentration;
    await this.update(updateData);

    //effets normaux
    const concentration2=this.system.effectAttributes.other.concentration;
    for (const itemData of concentration2) {
      for( const effectData of itemData.effects) {
        const actorTarget = game.actors.get(effectData.actorId);
        const effectTarget = actorTarget.effects.get(effectData.effectId);
        const duration = effectTarget._prepareDuration();
        if ( (dueOnly && duration.remaining <= 0) || !dueOnly) await effectTarget.deleteOnExpiration();
      }
    }
  }

  //remet data.temporary dans son etat initial
  resetTemporary() {
    const updateData = {};
    updateData["system.effectAttributes.temporary.current"] = false;
    updateData["system.effectAttributes.temporary.success"] = false;
    updateData["system.effectAttributes.temporary.rawmargin"] = 0;
    updateData["system.effectAttributes.temporary.critical"] = 0;
    updateData["system.effectAttributes.temporary.ability"] = "";
    updateData["system.effectAttributes.temporary.skill1"] = "";
    updateData["system.effectAttributes.temporary.skill2"] = "";
    this.update(updateData);  
  }

  //equipement - status 
  get hands() {
    const one = this.items.filter(item => item.flags.isWeapon && item.system.physicalItem.equipped && !item.system.properties["two"] ).length; 
    const two = this.items.filter(item => item.flags.isWeapon && item.system.physicalItem.equipped && item.system.properties["two"] ).length;
    const ver = this.items.filter(item => item.flags.isWeapon && item.system.physicalItem.equipped && item.system.properties["ver"] ).length;
    const lgt = this.items.filter(item => item.flags.isWeapon && item.system.physicalItem.equipped && item.system.properties["lgt"] ).length;

    if (one === 0 && two === 0) return "zero";
    if (one === 1 && ver === 1 && two === 0) return "ver";
    if (one === 1 && two === 0) return "one";
    if (one === 2 && lgt > 0 && two === 0) return "two";
    if (one === 0 && two === 1) return "hea";
    return "ano";
  }

  get armor() {
    const armor = this.items.filter(item => item.flags.isArmor && item.system.physicalItem.equipped);
    if (armor.length > 1) return "ano";
    if (armor.length === 0) return "noa";
    return armor[0].system.subtype;
  }

  get attune() {
    const attuned = this.items.filter(item => item.flags.isPhysical && item.system.physicalItem.attuned).length;
    if (attuned > 3) return "ano";
    return attuned;
  }

  //combat
  async startTurn() {
    //reactivation effet flags.enabledNextTurn = true; gestion activation via applyIfNoDefense
    for (let effect of this.effects){
      if (effect.flags.isSelfTarget && effect.flags.enabledNextTurn && effect.disabled) await effect.update({disabled:false});
      if (effect.flags.isSelfTarget && effect.flags.applyIfNoDefense ) {
        let roll = await this.rollDefense(effect);
        const updateData = {};
        if (roll.dice[0].options.fumble === 0 && roll.dice[0].options.margin >= 0) {
          if (effectData.flags.halfApplyIfSuccessDefense ) {
            updateData["disabled"]=false;
            updateData["flags.applyHalf"]=true;        
            await effect.update(updateData);
          }
          else await effect.deleteOnExpiration();
        }
        else {
          updateData["disabled"]=false;
          updateData["flags.applyHalf"]=false;        
          await effect.update(updateData);
        }
      }
      if (effect.flags.isSelfTarget && effect.flags.disabledNextTurn) await effect.deleteOnExpiration()
    }

    const updateDataActor = {};
    const attributes = this.system.attributes;
    const effectAttributes = this.system.effectAttributes;
    updateDataActor["system.effectAttributes.other.concentrationRound"] = 0; //reset concentration
    if (effectAttributes.status.stunned ===0 && effectAttributes.status.paralyzed ===0 && effectAttributes.status.incapacitated ===0 ) {
      updateDataActor["system.attributes.resources.action.reaction.value"] = attributes.resources.action.reaction.max;
      if (this.type === "npc") {
        updateDataActor["system.attributes.resources.legact.value"] = attributes.resources.legact.max;
        updateDataActor["system.attributes.resources.lair.value"] = attributes.resources.lair.max;
      }
    }
    this.update(updateDataActor);

    //recharge pouvoir
    const items = this.items.filter(item => item.system.uses && ["r5", "r56"].includes(item.system.uses.per));
    const updateItems = items.map(item => {
      let value = item.system.uses.max;
      if (item.system.uses.valuevalue < item.system.uses.max) {
        let roll;
        if (item.system.uses.per === "r6") roll = new Roll(`1d6cs6`);
        else if (item.system.uses.per === "r5")  roll = new Roll(`1d6cs>=5`);
        roll.evaluate({ async: false });
        if (roll.total > 0) value = item.system.uses.value +1;
      }
      return {
        _id: item._id,
        "system.uses.value": value
      };
    });
    if ( updateItems.length ) await this.updateEmbeddedDocuments("Item", updateItems);   

    //regen
    if ( attributes.hp.regen > 0 ) await this.applyDamage(attributes.hp.regen, "healing");
    if ( attributes.mp.regen > 0 ) await this.applyDamage(attributes.mp.regen, "healingmp");

    //burning
    for( const [dmgType, dmgValue] of Object.entries(effectAttributes.burning)) {
      if (dmgValue !== "" ) {
        const noHalf = this.effects.some( e => e.changes.some( c => c.key === "system.effectAttributes.burning." + dmgType) && !e.flags.applyHalf);
        const half = !noHalf && this.effects.some( e => e.changes.some( c => c.key === "system.effectAttributes.burning." + dmgType) && e.flags.applyHalf);

        const temporary = this.system.effectAttributes.temporary;
        temporary.current = true;
        temporary.success = !half;
        const rollData = this.getRollData();
        const item = rollData.item;
        //delete item.properties;
        //item.properties = [];
        item.properties = {half:half};
        const action = item.action;
        action.actionType = "other";
        action.damage = {parts : [[dmgValue, dmgType]]};
        const rollConfig = mergeObject({
          data: rollData,
          title: game.i18n.format("ARSDD.DamageContinuous"),
          speaker: ChatMessage.getSpeaker({actor: this}),
          flavor: game.i18n.format("ARSDD.DamageContinuous"),
          targetToken:[{actor:this, data:{}}]
        });
        await damageRoll(rollConfig);
      }
    }
  }

  async endTurn() {
    for (let effect of this.effects){
      if (effect.disabled) continue;
      if (effect.flags.isPermanent || effect.flags.isTemporary) continue;
      const duration = effect._prepareDuration();
      if (duration.remaining <= 0 && !effect.isConcentrated) {
        await effect.deleteOnExpiration();
        continue;
      }
      if (effect.flags.isSelfTarget && effect.flags.laterDefense) await this.rollDefense(e, "delete");
    }
    await this.resetConcentration(true);
  }

  async endCombat() {
    for (let effect of this.effects){
      if (effect.disabled) continue;
      if (!effect.flags.isTemporary) await effect.deleteOnExpiration();
    }
    await this.resetConcentration(true);    
  }

  async rollDefense(effect) {
    const {type, actor, item} = effect.source;
    if (type !== "ActorItem" || actor === null | item === null ) return;
    const action = item.system.action;
    const difficulty = effect.flags.laterDefenseDiff > 0 ? effect.flags.laterDefenseDiff : actor.system.effectAttributes.temporary.selfrawmargin +6;
    const options = {
      actionType: action.actionType,
      difficulty: difficulty,
      ability: action.passiveAbility,
      skill2: action.skill2,
      defense: true,
      fastForward:true,
      title: "Défense - " + effect.label
    };
    return await this.rollSkill(action.passiveSkill, options);
  }


  async addDelay(delay) {
    if (delay === 0) return;
    if (game.combats === undefined || game.combat === null || !game.combat.getCombatantByActor(this.id)) return
    const updateData = {};
    updateData["system.attributes.init.delay"] = this.system.attributes.init.delay + delay ;
    this.update(updateData);
  }

  async addXp(xp) {
    const updateData = {};
    updateData["system.attributes.xp"] = this.system.attributes.xp + xp ;
    this.update(updateData);
  }

  get here() {
    for( const token of canvas.tokens.placeables) {
      if ( token.document.actorId === this.id ) return true;
    }
    return false;
  }

  checkTarget() {
    let result = {
      target : false,
      los : false,
      cover : 0,
      distance : 0,
      adjacentSource : false,
      adjacentTarget : false
    }
  
    const sourceTokens = this.getActiveTokens();
    if (game.user.targets.size === 0 || sourceTokens.length === 0 ) return result;
    result.target = true;
    const sourceToken = sourceTokens[0];
    result.adjacentSource = sourceToken.tokenAdjacent();

    for (const target of game.user.targets){
      let cover = sourceToken.tokenLos(target);
      result.los = result.los || cover.los;
      result.cover = Math.max(result.cover, cover.cover);
      result.distance = Math.max(result.distance, sourceToken.tokenDistance(target));
      result.adjacentTarget = result.adjacentTarget || target.tokenAdjacent(sourceToken);
    }
    return result;
  }

  getToken() {
    const sourceTokens = this.getActiveTokens();
    if (sourceTokens.length > 0 ) return sourceTokens[0];
    return null;
  }

  async setToken() { 
    this.prototypeToken.update({name: this.name, img: this.img});
    const tokens = this.getActiveTokens();
    if (tokens.length > 0) { 
      for(const token of tokens) {
        if (token.document.name !== this.name || token.document.texture !== this.img) {
          token.document.update({name: this.name, texture : this.img});
        }
      }
    }
  }

  getEffectByItem(itemId) {
    return this.effects.filter( e => e.originInfo.originItemId === itemId );
  }

  getEffectBySource(actorId, itemId, label) {
    for (let e of this.effects){
      const {originType, originActorId, originItemId} = e.originInfo;
      if (originType === "ActorItem" && originActorId === actorId && originItemId === itemId && e.label === label) return e;
    }
  }


  setActiveEffectByAction(actionActivation){
    if (!["action", "bonus", "reaction", "attack", "movement", "legendary"].includes(actionActivation)) return;
    if (!this.inCombat) return;
    if (!this.inTurn && ["action", "bonus", "attack", "movement"].includes(actionActivation)) actionActivation = "reaction";
    const effect = {
      label: game.i18n.localize(CONFIG.ARSDD.activationTypes[actionActivation]),
      icon: "systems/arsdd/icons/svg/" + actionActivation + ".svg",
      origin: this.uuid,
      flags: {
        isPermanent: false,
        isTemporary: false,
        isSelfTarget : true,
        deleteOnExpiration : true,
        enableAutomation : true
      },
      disabled: false
    }
    effect.duration = {}
    effect["duration.rounds"] = 1;
    effect.flags.disabledNextTurn = true;
    this.createEmbeddedDocuments("ActiveEffect", [effect]);
  }

  get combatant() {
    return game.combat?.getCombatantByActor(this.id) || null;
  }

  get inCombat() {
    return !!this.combatant;
  }

  get inTurn() {
    return this.id === game.combat?.combatant.actorId;
  }

}
