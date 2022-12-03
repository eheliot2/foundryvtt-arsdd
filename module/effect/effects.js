/* gestion des effets
  - les effets ont 
    - origine : la chaine Actor.id.OwnedItem.id, ou Item.id, ou Actor.id
    - sourcenanme : nom de l'item
    - parent : a qui l'effet est applique, activable
  - les effets sont drag&drop d'actor a actor mais pas de item a actor. ils sont transferables au moment de l'ownership, mais pas apres

  - duration
    - turns : limite a 100, commence a 0, index du combattant
    - les effets expirent en fin turn de leur round, des cibles dans les efets sans concent, de l'originactor si concentration


on passe les infos complementaires par flags
  - enableAutomation : autorise a etre activé/desactive par le systeme
  - isSelfTarget : cible le parent ou pas
  - enabledNextTurn : pour remettre automatiquement au debut de son tour
  - enabledPrevious : pour restaurer l'etat apres un jet
  - disabledAfterSkillRoll : pour 1 seul jet
  - disabledAfterDamageRoll : pour 1 seul jet
  - disabledNextTurn : pour desactiver au debut de son prochain tour, noramlementn on fait le controle en fin de tour, sur les durees 0
  - allowDelete : pour eviter de delete un effet donne par objet qu'on ne peut plus remettre
  - deleteOnExpiration : pour automatiser la suppression sans casser les effets temporairement desactives
  - isPermanent : pour bien maitriser les permanents
  - isTemporary : true pour duree longue >= 10min, false pour duree round
  - laterDefense : pour tester la défense en fin de tour
  - laterDefenseDiff : pour memoriser la difficulte
  - applyIfNoDefense : pour tester defense chaque tour (utilise laterDefenseDiff)
  - halfApplyIfSuccessDefense : transmission de la propriete moitie de l'item a l'effet
  - applyHalf : memorise defense reussie et appliquer moitié

l'originaActor met un effet, la cible (parent) qui intereagit dans une action (en tant que passif ou actif) avec un autre (target)

Aura : effet a autopropagation
  - isSourceAura : effet est une source d'aura
  - disabledAura : activation d'une source aura (à associer dans certains cas avec disable classique, à ne pas associer dans les disable sous condition)
  - fillColorAura : aura couleur
  - textureAura : aura texture
  - opacityAura : aura opacity
  - isTargetAura : effet est propagé par aura
  - sourceAuraEffectId : id de l'effet source
  - sourceAuraActorId : id de l'actor source


Systeme de condition
1 niveau sur l'action
  - conditionsAction : tableau des type d'action, ne s'applique que si l'action a le type
  - conditionsDamage : tableau des types de dommage, ne s'applique si l'action a le type
1 niveaux sur le parent
  - conditionsParentStatus : sur les états

3 niveaux de conditions sur l'autre partie prenante de l'action (target)
  - conditionsTargetRace : sur les groupe de race
  - conditionsTargetStatus : sur les états 
  - conditionsTargetTrait : sur les traits

  - properties : tableau de proprietes
  - traits : tableau de traits, on peut retrouver les usages avec un search sur testTrait("trait_, repertorie dans arsdd.effectTrait

  - originName : string pour l'origine complete
  - originActorId
  - originItemId

*/

import ItemArsDD from "../item/item.js";

export default class ActiveEffectArsDD extends ActiveEffect {

  /** @override */
  _prepareDuration() {
    const duration = this.duration;
    const flags = this.flags;
    if (flags.isPermanent) {
      return {
        type: "perm",
        duration: null,
        remaining: null,
        label: this._getDurationLabel()
      }
    }
    // Time-based duration
    else if ( flags.isTemporary ) {
      const start = (duration.startTime || game.time.worldTime);
      const elapsed = game.time.worldTime - start;
      const remaining = this.disabled ? duration.seconds : duration.seconds - elapsed;
      return {
        type: "seconds",
        duration: duration.seconds,
        remaining: remaining,
        label: this._getDurationLabel(remaining)
      };
    }

    // Turn-based duration
    else { 
      // Determine the current combat duration
      const combat = game.combat;
      if (this.disabled || combat === null || combat === undefined || combat.round <= duration.startRound) {
        return {
          type: "turns",
          duration: duration.rounds,
          remaining: duration.rounds,
          label: this._getDurationLabel(duration.rounds)
        }
      }

      // Some number of remaining rounds and turns (possibly zero)
      const remaining = Math.max(duration.startRound + duration.rounds - combat.round, 0);
      const remainingRounds = Math.floor(remaining);
      return {
        type: "turns",
        duration: duration.rounds,
        remaining: remaining,
        label: this._getDurationLabel(remainingRounds)
      }
    }
  }

  /** @override */
  _getDurationLabel(remaining) {
    const flags = this.flags;
    if (flags.isPermanent) return "Perm";
    if (flags.isTemporary) {
      if ( remaining / 2419200 > 1) return Math.round(remaining / 2419200) + " mois";
      else if  ( remaining / 86400 > 1) return Math.round(remaining / 86400) + " jours"; 
      else if  ( remaining / 3600 > 1) return Math.round(remaining / 3600) + " heures"; 
      else return Math.round(remaining / 60) + " minutes"; 
    }
    return remaining + " rounds";
  }

  prepareData(){
    super.prepareData();
  }

  static onManageActiveEffect(event, owner) {
    event.preventDefault();
    const a = event.currentTarget;
    const li = a.closest("li");
    let effect;
    if (owner instanceof ItemArsDD && owner.isOwned) effect = li.dataset.effectId ? owner.parent.effects.get(li.dataset.effectId) : null;
    else effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;

    switch ( a.dataset.action ) {
      case "create":
        if (owner.isOwned) {
          return owner.actor.createEmbeddedDocuments("ActiveEffect", [{
            label: "New Effect",
            icon: "icons/svg/aura.svg",
            origin: owner.uuid,
            flags: {
              isPermanent: li.dataset.effectType === "passive",
              isTemporary: li.dataset.effectType === "temporary",
              isSelfTarget : !(li.dataset.effectType === "totarget")
            },
            disabled: li.dataset.effectType === "inactive"
          }]);
        }
        return owner.createEmbeddedDocuments("ActiveEffect", [{
          label: "New Effect",
          icon: "icons/svg/aura.svg",
          origin: owner.uuid,
          flags: {
            isPermanent: li.dataset.effectType === "passive",
            isTemporary: li.dataset.effectType === "temporary",
            isSelfTarget : !(li.dataset.effectType === "totarget")
          },
          disabled: li.dataset.effectType === "inactive"
        }]);
      case "edit":
        return effect.sheet.render(true);
      case "delete":
        return effect.delete();
      case "toggle":
        return effect.update({disabled: !effect.disabled});
      case "toggleAura":
        const updateData = {};
        updateData["flags.disabledAura"]=!effect.flags.disabledAura
        return effect.update(updateData);
    }
  }

  get originInfo(){
    if ( this.origin === null || this.origin === undefined) return "";
    let name = this.origin.split(".");
    let originData = {
      originActorId:"",
      originItemId:"",
      originType:""
    };
    if (name.length === 4) {
      originData.originType = "ActorItem";
      originData.originActorId=name[1];
      originData.originItemId=name[3];
    }
    else if (name[0] === "Actor") {
      originData.originType = "Actor";
      originData.originActorId=name[1];
    }
    else if (name[0] === "Item") {
      originData.originType = "Item";
      originData.originItemId=name[1];
    }
    return originData;
  }

  get source() {
    const origin = this.originInfo;
    if (origin.originType === "Item") return {type:"Item", actor:null, item:game.items.get(origin.originItemId) ?? null};
    else if (origin.originType === "Actor") return {type:"Actor", actor:game.actors.get(origin.originActorId) ?? null, item:null};
    else if (origin.originType === "ActorItem") {
      const sourceActor = game.actors.get(origin.originActorId);
      if (sourceActor === undefined) return {type:"", actor:null, item:null};
      if (sourceActor.items === undefined) return {type:"", actor:null, item:null};
      return {type:"ActorItem", actor:sourceActor, item:sourceActor.items.get(origin.originItemId) ?? null} 
    }
    else return {type:"", actor:null, item:null};
  }

  get labelInfo() {
    if (game.actors === undefined || game.items === undefined ) return this.origin;
    const {type, actor, item} = this.source;
    if (type === "ActorItem") {
        return (item?.name ? item.name + " par " : "") + ( actor?.name ?? "" ) ;
    }
    else if (type === "Actor" && actor) return actor.name;
    else if (type === "Item" && item) return  item.name;
    return this.origin;
  }

  get labelDuration() {
    const duration = this._prepareDuration()
    return duration.label;
  }

  static prepareActiveEffects(effects, isOwned=false) {
    // Define effect header categories
    const categories = {
      temporary: {type: "fight",label: "Effets (rounds)",effects: [], isOwned:isOwned},
      long: {type: "temporary",label: "Effets temporaire",effects: [], isOwned:isOwned},
      passive: {type: "passive",label: "Effects permanents",effects: [], isOwned:isOwned},
      totarget: {type: "totarget",label: "Effets à cibler",effects: [], isOwned:isOwned},
      inactive: {type: "inactive",label: "Effets inactifs",effects: [], isOwned:isOwned}
    };

    // Iterate over active effects, classifying them into categories
    for ( let e of effects ) {
      e._getSourceName(); // Trigger a lookup for the source name
      e.setUsableItem();
      e.checkTime();

      if ( e.disabled && e.flags.isSelfTarget) categories.inactive.effects.push(e);
      else if ( ! e.flags.isSelfTarget ) categories.totarget.effects.push(e);
      else if ( e.duration.rounds ) categories.temporary.effects.push(e);
      else if ( e.duration.seconds ) categories.long.effects.push(e);
      else categories.passive.effects.push(e);
    }
    return categories;
  }

  async _preDelete(options, user){
    await super._preDelete(options, user);
    if (this.isConcentrated && !this.disabled) await this.setConcentrated(false);
    options.source = this.source;
  }

  /** @override */
  async _preUpdate(updateData, options, user) {
    const flags = this.flags;
    if (options.rollDefense) {
      let roll = await this.parent.rollDefense(this);
      if (roll.dice[0].options.fumble === 0 && roll.dice[0].options.margin >= 0) {
        if (foundry.utils.getProperty(updateData,"flags.halfApplyIfSuccessDefense")) updateData["flags.applyHalf"]=true;        
        else return this.delete();
      }
    }

    //reecriture duree entre formulaire et duration + reinitialisation duree sur isTemporary et isPermanent
    if (foundry.utils.hasProperty(updateData,"flags.duration") && foundry.utils.getProperty(updateData,"flags.duration").length > 0) {
      updateData["duration.seconds"]=parseInt(foundry.utils.getProperty(updateData,"flags.duration"));
      updateData["duration.rounds"]=null;
    }
    if (foundry.utils.hasProperty(updateData,"flags.isPermanent") && foundry.utils.getProperty(updateData,"flags.isPermanent")) {
      updateData["duration.seconds"]=null;
      updateData["flags.duration"]="";
      updateData["duration.rounds"]=null;
      updateData["flags.isTemporary"]=false;
    }
    else if (foundry.utils.hasProperty(updateData,"flags.isPermanent")) {
      updateData["duration.seconds"]=null;
      updateData["flags.duration"]="";
      updateData["duration.rounds"]=10;
    }
    else if (foundry.utils.hasProperty(updateData,"flags.isTemporary") && foundry.utils.getProperty(updateData,"flags.isTemporary")) {
      updateData["duration.seconds"]=CONFIG.ARSDD.durationTime.hour1;
      updateData["flags.duration"]=CONFIG.ARSDD.durationTime.hour1.toString();
      updateData["duration.rounds"]=null;
    }
    else if (foundry.utils.hasProperty(updateData,"flags.isTemporary")) {
      updateData["duration.seconds"]=null;
      updateData["flags.duration"]="";
      updateData["duration.rounds"]=10;
    }


    //concentration
    if (this.isConcentrated && foundry.utils.hasProperty(updateData,"disabled") ) this.setConcentrated(!foundry.utils.getProperty(updateData,"disabled"));

    //deleteOnExpiration 
    if (foundry.utils.hasProperty(updateData,"disabled") && foundry.utils.getProperty(updateData,"disabled") ) {
      if (flags.enableAutomation && flags.deleteOnExpiration && !flags.enabledPrevious ) {
        this.delete();
        return;
      }
    }

    const {type, actor, item} = this.source;
    if (type === "ActorItem" && item !== null) {
      //activation avec defense ulterieur, ifnodefense => memoriser difficulte pour les adversaires
      let later = !flags.isSelfTarget && (flags.laterDefense || flags.applyIfNoDefense);
      later = later && foundry.utils.hasProperty(updateData,"disabled") && !foundry.utils.getProperty(updateData,"disabled")
      if (later) {
        updateData["flags.laterDefenseDiff"] = actor.system.effectAttributes.temporary.selfrawmargin +6;
      }

      //gestion aura
      let aura = flags.isSourceAura && foundry.utils.hasProperty(updateData,"flags.disabledAura");
      aura = aura && !(foundry.utils.hasProperty(updateData,"flags.isTargetAura") && foundry.utils.getProperty(updateData,"flags.isTargetAura"));
      if (aura) {
        const sourceToken = actor.getToken();
        if (sourceToken) await sourceToken.setSourceAura(this, foundry.utils.getProperty(updateData,"flags.disabledAura"));     
        if (flags.isSelfTarget) updateData["disabled"] = foundry.utils.getProperty(updateData,"flags.disabledAura");  
      }
    }

    let setTime = !flags.isPermanent && foundry.utils.hasProperty(updateData,"disabled") && !foundry.utils.getProperty(updateData,"disabled");
    setTime = setTime || (!flags.isPermanent && foundry.utils.hasProperty(updateData,"disabledAura") && !foundry.utils.getProperty(updateData,"disabledAura"));
    //activation d'un non permanent => initialisation temps
    if (setTime) {
      updateData["duration.startTime"] = game.time.worldTime;
      if (game.combats !== undefined && game.combat !== null ) {
        updateData["duration.startRound"] = game.combat.round;
      }
    }

    await super._preUpdate(updateData, options, user);
  }

    /** @override */
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    const updateData = {};

    const flags = this.flags;
    const source = this.source;

    if ( flags.isSelfTarget === undefined ) updateData["flags.isSelfTarget"] = true;
    if ( flags.allowDelete === undefined ) updateData["flags.allowDelete"] = false;
    if ( flags.allowDisable === undefined ) updateData["flags.allowDisable"] = true;
    if ( flags.isPermanent === undefined ) updateData["flags.isPermanent"] = true;
    if ( flags.isTemporary === undefined ) updateData["flags.isTemporary"] = true;
    if ( flags.duration === undefined ) updateData["flags.duration"] = "";
    if ( flags.enableAutomation === undefined ) updateData["flags.enableAutomation"] = true;
    if ( flags.deleteOnExpiration === undefined ) updateData["flags.deleteOnExpiration"] = false;
    if ( flags.enabledNextTurn === undefined ) updateData["flags.enabledNextTurn"] = false;
    if ( flags.enabledPrevious === undefined ) updateData["flags.enabledPrevious"] = false;
    if ( flags.disabledAfterSkillRoll === undefined ) updateData["flags.disabledAfterSkillRoll"] = false;
    if ( flags.disabledAfterDamageRoll === undefined ) updateData["flags.disabledAfterDamageRoll"] = false;
    if ( flags.disabledNextTurn === undefined ) updateData["flags.disabledNextTurn"] = false;
    if ( flags.laterDefense === undefined ) updateData["flags.laterDefense"] = false;
    if ( flags.laterDefenseDiff === undefined ) updateData["flags.laterDefenseDiff"] = 0;
    if ( flags.applyIfNoDefense === undefined ) updateData["flags.applyIfNoDefense"] = false;
    if ( flags.halfApplyIfSuccessDefense === undefined ) updateData["flags.halfApplyIfSuccessDefense"] = false;
    if ( flags.applyHalf === undefined ) updateData["flags.applyHalf"] = false;

    if ( flags.isSourceAura === undefined ) updateData["flags.isSourceAura"] = false;
    if ( flags.isTargetAura === undefined ) updateData["flags.isTargetAura"] = false;
    if ( flags.disabledAura === undefined ) updateData["flags.disabledAura"] = true;
    if ( flags.fillColorAura === undefined ) updateData["flags.fillColorAura"] = "#FF0000";
    if ( flags.opacityAura === undefined ) updateData["flags.opacityAura"] = 0.2;
    if ( flags.textureAura === undefined ) updateData["flags.textureAura"] = "";    

    if (flags.conditionsAction === undefined || Object.keys(flags.conditionsAction).length === 0) updateData["flags.conditionsAction"] = cloneTrue(CONFIG.ARSDD.itemActionTypes);
    else if ( allFalse(flags.conditionsAction) ) updateData["flags.conditionsAction"] = cloneTrue(CONFIG.ARSDD.itemActionTypes);
    if (flags.conditionsDamage === undefined || Object.keys(flags.conditionsDamage).length === 0) updateData["flags.conditionsDamage"] = cloneTrue(CONFIG.ARSDD.damageTypes);
    else if ( allFalse(flags.conditionsDamage) ) updateData["flags.conditionsDamage"] = cloneTrue(CONFIG.ARSDD.damageTypes);

    if (flags.conditionsParentStatus === undefined ) updateData["flags.conditionsParentStatus"] = {};
    if (flags.conditionsTargetRace === undefined || Object.keys(flags.conditionsTargetRace).length === 0) updateData["flags.conditionsTargetRace"] = cloneTrue(CONFIG.ARSDD.groupRaces);
    else if ( allFalse(flags.conditionsTargetRace)) updateData["flags.conditionsTargetRace"] = cloneTrue(CONFIG.ARSDD.groupRaces);
 
    if (flags.conditionsTargetStatus === undefined ) updateData["flags.conditionsTargetStatus"] = {};
    if (flags.conditionsTargetTrait === undefined ) updateData["flags.conditionsTargetTrait"] = "";

    if (flags.traits === undefined ) updateData["flags.traits"] = "";
    if (flags.properties === undefined ) updateData["flags.properties"] = []; 

    if (source.type === "Item") {
      if (this.parent.type === "spell" ){
        const action = this.parent.system.action;
        updateData["flags.isSelfTarget"] = !["self", "none"].includes(action.target.type);
        updateData["duration.combat"] = null;
        updateData["duration.turns"] = null;
        updateData["duration.startRound"] = null;
        updateData["duration.startTurn"] = null;
        updateData["duration.seconds"] = null; 
        updateData["duration.rounds"] = null;
        if (["minute10", "hour1", "hour8", "day1", "month1", "year1"].includes(action.duration.units)) {
          updateData["flags.isPermanent"] = false;
          updateData["flags.isTemporary"] = true;
          updateData["duration.seconds"] = CONFIG.ARSDD.durationTime[action.duration.units];
          updateData["flags.duration"] = CONFIG.ARSDD.durationTime[action.duration.units].toString();
        }
        else if (["round"].includes(action.duration.units)){
          updateData["flags.isPermanent"] = false;
          updateData["flags.isTemporary"] = false;
          updateData["duration.rounds"] = action.duration.value;
        }
        if (["aura"].includes(this.parent.system.subtype)) updateData["flags.isSourceAura"] = true;       
      }
    }
    else if (source.type === "ActorItem") {
      //objet dans le personnage,  
      if (this.parent.id === source.actor.id) {
        ["spell"].includes(source.item.type);
        if (["spell"].includes(source.item.type)){
          updateData["flags.allowDisable"] = true;
          updateData["disabled"] = true;
          //aurasource
          if (["aura"].includes(source.item.system.subtype)) {
            updateData["flags.isSourceAura"] = true;
            updateData["flags.disabledAura"] = true;
          }
        }
        this.setUsableItem();
        this.source.item.sheet.render(false);
      }
      //objet hors personnage, donc via ciblage
      else {
        updateData["disabled"]=false;
        updateData["flags.allowDisable"] = true;
        updateData["flags.isSelfTarget"] = true;
        updateData["flags.allowDelete"] = true;
        updateData["flags.deleteOnExpiration"] = true;

        if (source.item !== null) {
          if (["aura"].includes(source.item.system.subtype)) {
            updateData["flags.isSourceAura"] = false;
            updateData["flags.isTargetAura"] = true;  
            updateData["flags.disabledAura"] = false;   
          }
          if ((flags.laterDefense || flags.applyIfNoDefense || source.item.system.properties["wall"]) && flags.laterDefenseDiff === 0) {
            const sourceUpdateData = {};
            const sourceEffect = source.actor.getEffectBySource(source.actor.id, source.item._id, this.label);
            const difficulty = source.actor.system.effectAttributes.temporary.selfrawmargin +6;
            if (difficulty >= 6 ) {
              sourceUpdateData["flags.laterDefenseDiff"] = difficulty;
              sourceEffect.update(sourceUpdateData);
              updateData["flags.laterDefenseDiff"] = difficulty;
            }
            else {
              updateData["flags.laterDefenseDiff"] = sourceEffect.flags.laterDefenseDiff;
            }
          }
          if (source.item.system.properties["wall"]) options.rollDefense = true;
        }
      }
      //transmission trait moitie
      if (source.item.system.properties["half"]) updateData["flags.halfApplyIfSuccessDefense"] = true;

    }

    if (Object.keys(updateData).length) this.update(updateData, options);
  }

  _onUpdate(data, options, userId) {
    super._onUpdate(data, options, userId);
    if (this.source.type === "ActorItem") this.source.item.sheet.render(false);
  }

  _onDelete(options, userId){
    super._onDelete(options, userId);
    if (options.source && options.source.type === "ActorItem") {
      game.actors.get(options.source.actor._id)?.items.get(options.source.item._id)?.sheet.render(false);
    }
  }

  async checkTime() {
    const updateData = {};
    const duration = this._prepareDuration();
    if (this.flags.isTemporary && duration.remaining <= 0) {
      updateData["disabled"] = true;
      if (this.flags.isSourceAura) updateData["flags.disabledAura"] = true;
      await this.update(updateData);
    }
  }

  get isConcentrated() {
    const {type, item} = this.source;
    if ( type !== "ActorItem" || item === null || item.system.action === undefined ) return false;
    return item.system.action.duration.concentration;  
  }

  async setConcentrated(status) {
    const flags = this.flags;
    const {type, actor, item} = this.source;
    if ( type !== "ActorItem") return;
    const concentration = foundry.utils.deepClone(actor.system.effectAttributes.other.concentration);
    const effectData = {actorId: this.parent._id, effectId: this._id};

    const items = concentration.filter(element => element.itemId === item.id);
    if (status) {
    //concentration : [{ itemId : itemid, effects : [{actorId : actorid, effectId, effectid}]}]
      if (items.length > 0) {
        const index = items[0].effects.findIndex(e => e.actorId === effectData.actorId && e.effectId === effectData.effectId);
        if (index === -1) items[0].effects.push(effectData);
      }
      else concentration.push({itemId:item.id, effects:[effectData]});
    } 
    else if (items.length > 0) {
      if (items[0].effects.length > 1) {
        const index = items[0].effects.findIndex(e => e.actorId === effectData.actorId && e.effectId === effectData.effectId);
        if (index > -1) items[0].effects.splice(index,1);
      }
      else {
        const index = concentration.findIndex(i => i.itemId === item.id);
        if (index > -1) concentration.splice(index,1);
      }
    }
    const updateData = {};
    updateData["data.effectAttributes.other.concentration"] = concentration;
    actor.update(updateData);
  }

  async setUsableItem() {
    const origin = this.originInfo;   

    if (origin.originType !== "ActorItem") return;
    const items = this.parent.items.filter(item => item.id === origin.originItemId);
    if (items.length === 1 && ["weapon", "equipment", "armor", "consumable"].includes(items[0].type) && this.flags.isPermanent && this.disabled === items[0].flags.isUsable) {
      await this.update({disabled:!this.disabled});
    }
  }

  async setForRoll(action, actor) {
    const flags = this.flags;
    if (this.disabled || !flags.enableAutomation) {
      flags.enabledPrevious = false;
      return;
    }

    if (!flags.conditionsAction[action.actionType]) {
      await this.setPrevious(true);
      return;
    }
    
    let dam = action.damage.parts.flat();
    if (dam.length > 0) {
      let test = false;
      dam.forEach(function (value, index){
        if (index %2 !== 0 ){
          test = test || flags.conditionsDamage[value];
        }
      });

      if (!test) {
        await this.setPrevious(true);
        return;
      }
    }

    const statusParent = this.parent.system.effectAttributes.status;
    for (const [status, value] of Object.entries(flags.conditionsParentStatus)) {
      if ( value && statusParent[status] === 0 ) {
        await this.setPrevious(true);
        return;
      }
    }

    if (actor !== null) {
      const raceTarget = actor.system.attributes.groupRace.value;
      if (raceTarget.length > 0) {
        let c=0;
        for (const [race, value] of Object.entries(flags.conditionsTargetRace)) {
          if ( value && raceTarget.includes(race) ) c+=1;
        }
        if (c === 0) {
          await this.setPrevious(true);
          return;
        }
      }


      const statusTarget = actor.system.effectAttributes.status;
      for (const [status, value] of Object.entries(flags.conditionsTargetStatus)) {
        if ( value && statusTarget[status] === 0 ) {
          await this.setPrevious(true);
          return;
        }
      }

      if (flags.conditionsTargetTrait.length > 0) {
        for (let trait of flags.conditionsTargetTrait.split(",")) {
          trait = trait.trim();
          if ( !actor.testTrait(trait) ) {
            await this.setPrevious(true);
            return;
          }
        }
      }

    }
  }
  
  async restoreAfterRoll(rollType) {
    const flags = this.flags;
    const disabled = this.disabled;
    if (disabled && !flags.enabledPrevious) return;
    if (disabled && flags.enabledPrevious) await this.setPrevious(false);
    //necessairement !disabled
    if ( (rollType === "skill" && flags.disabledAfterSkillRoll) || (!disabled && rollType === "damage" && flags.disabledAfterDamageRoll) ) await this.update({disabled:true});
  }

  async setPrevious(previous){
    const updateData = {};
    updateData["disabled"]=previous;
    updateData["flags.enabledPrevious"]=previous;
    await this.update(updateData);  
  }

  async deleteOnExpiration(){
    const flags = this.flags;
    if (flags.enableAutomation && flags.deleteOnExpiration && !flags.enabledPrevious) await this.delete();
    else await this.update({disabled: true});
  }
  
  //actorsheet
  setClassImgAction() {
    const flags = this.flags;
    const disabled =  this.disabled;
    if (!disabled && flags.isSelfTarget) flags.class = "effectSelfActive";
    else if (disabled && flags.isSelfTarget) flags.class = "effectSelfDisabled";
    else if (!disabled && !flags.isSelfTarget) flags.class = "effectTargetSelfActive";
    else flags.class = "effectTargetSelfDisabled";
  }

}

function allFalse(obj) {
  let values = Object.values(obj);
  let test = values.some(value => value);
  return !test; 
}

function cloneTrue(config){
  let obj = Object.assign({},config);
  for (let [key, value] of Object.entries(obj)) {
    obj[key] = true;
  } 
  return obj;
}



