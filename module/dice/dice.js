

export async function StressRoll({data={}, event={}, template=null, title=null, speaker=null, difficulty=6, defense=false,
  flavor=null, fastForward=null, dialogOptions, chatMessage=true, messageData={}, targetToken=[]}={}) {
  
  let parts = [];
  const options = data.options = {};
  options.fumble = 1;
  options.bonus = "0";
  options.passiveBonus = "0";
  options.opposition = data.item.action.actionType !== "skill" || defense;
  options.spontaneous = false;

  // Define the inner roll function
  const _roll = async function (parts, form) {
    const actor = data.actor
    const action = data.item.action;
    const properties = data.item.properties;
    const options = data.options;
    const sourceTokens = actor.getActiveTokens();
    const sourceToken = sourceTokens.length > 0 ? sourceTokens[0] : null;
    let flavor = "";

    // analyse form
    if ( form ) {
      if ( form.ability.value ) action.ability = form.ability.value;
      if ( form.skill2.value && form.skill2.value !== "-1" ) action.skill2 = form.skill2.value; 
      if ( form.bonus.value ) options.bonus = form.bonus.value; 
      if ( form.fumble.value ) options.fumble = form.fumble.value;
      if ( form.level.value ) action.level = parseInt(form.level.value);
      options.spontaneous = form.spontaneous.checked;

      if (data.opposition) {
        if ( form.passiveAbility.value ) action.passiveAbility = form.passiveAbility.value; 
        if ( form.passiveSkill.value ) action.passiveSkill = form.passiveSkill.value; 
        if ( form.passiveBonus.value ) options.passiveBonus = form.passiveBonus.value;   
      }
    }
    if (action.level === undefined || action.level === null ) action.level = 0;

    //check effect
    if ( targetToken.length === 1 && targetToken[0].actor) await actor.checkEffect(action, targetToken[0].actor);
    else await actor.checkEffect(action, null);
    for (const target of targetToken) {
      if (target.actor) await target.actor.checkEffect(action, actor);
    }

    const abilities = actor.system.abilities;
    const skills = actor.system.skills;
    const effectAttributes = actor.system.effectAttributes;
    const attributes = actor.system.attributes;

    //ability
    if ( abilities[action.ability].value !==0 ) {
      data['ability'] = abilities[action.ability].value;
      flavor = CONFIG.ARSDD.abilities[action.ability];

      //finesse
      if ( properties && properties["fin"] && action.ability === "str" && data.abilities["str"].value < data.abilities["dex"].value ) {
        data['ability'] = data.abilities["dex"].value;
        flavor = CONFIG.ARSDD.abilities["dex"];
      }
      parts = parts.concat(["@ability"]);  
    }

    //skill
    flavor += " + " + CONFIG.ARSDD.skills[action.skill1]; 
    const skill1 = skills[action.skill1];
    if ( action.skill2 === "" || action.skill2 === null ) {
      if ( skill1.value + skill1.bonus !== 0) {
        data['skill']=skill1.value + skill1.bonus; 
        parts = parts.concat(["@skill"]);
      } 
    }
    else {
      const skill2 = skills[action.skill2];
      flavor += " + " + CONFIG.ARSDD.skills[action.skill2]; 

      let sklTotal = Math.max(skill1.value + skill1.bonus, skill2.value + skill2.bonus) + Math.min(skill1.rank, skill2.rank);
      if ( sklTotal > 0) {
        data['skill']=sklTotal;
        parts = parts.concat(["@skill"]);
      } 
    }

    if (!defense && !["skill","other"].includes(action.actionType) && effectAttributes.attack[action.actionType] !== 0 ) {
      data['bonusatk']=effectAttributes.attack[action.actionType];
      parts = parts.concat(["@bonusatk"]);           
    }
    else if (defense && !["skill","other"].includes(action.actionType) && effectAttributes.defense[action.actionType] !== 0 ) {
      data['bonusdef']=effectAttributes.defense[action.actionType];
      parts = parts.concat(["@bonusdef"]);           
    }

    if (!defense && action.attackBonus !== 0) {
      data['bonusatk2']=action.attackBonus;
      parts = parts.concat(["@bonusatk2"]);         
    }


    let adv = 0
    for (let [status, value] of Object.entries(effectAttributes.status)) {
      adv += advStatus(status, value, action.actionType, true);
    }
    //cas particulier cover pour discretion
    if (effectAttributes.status.cover >0 && ["ste"].includes(action.skill1)) adv += effectAttributes.status.cover*3
    //cas particulier cocnetration : discipline + other => concentration
    if ( action.actionType !== "other" && action.skill1 === "disc" && effectAttributes.other.concentrationBonus !== 0) {
      data['bonusconcentration']=effectAttributes.other.concentrationBonus;
      parts = parts.concat(["@bonusconcentration"]);   
    }
    if (adv !== 0) {
      data['adv']=adv;
      parts = parts.concat(["@adv"]);      
    }
    if (attributes.encumbrance.mod >0) {
      data['encumbrance']=attributes.encumbrance.mod*(attributes.encumbrance.mod+1)/2;
      parts = parts.concat(["@encumbrance"]);   
    }
    if (effectAttributes.other.all >0) {
      data['all']=effectAttributes.other.all;
      parts = parts.concat(["@all"]);   
    }    
    if (options.bonus !== "0") {
      data['bonus']=options.bonus;
      parts = parts.concat(["@bonus"]);   
    }
    if (sourceToken !== null && ["shoot"].includes(action.actionType) && sourceToken.tokenAdjacent()) {
      data['adajcent'] = -3;
      parts = parts.concat(["@adjacent"]);
    }
    let formula = parts.join(" + ");

    if (options.spontaneous) formula = "floor((1da +" + formula + ")/2)";
    else formula = options.fumble.toString() + "da + " + formula;

    let rollstress = new Roll(formula, data);
    try {
      rollstress.evaluate({ async: false });
    } catch (err) {
      console.error(err);
      ui.notifications.error(`Dice roll fix evaluation failed: ${err.message}`);
      return null;
    }

    const diceOptions = rollstress.dice[0].options;
    diceOptions.fumble=rollstress.dice[0].total < 0 ? Math.abs(rollstress.dice[0].total): 0;
    diceOptions.actionType = action.actionType;
    diceOptions.opposition = options.opposition;
    diceOptions.source = "action";
    diceOptions.allowCritical = !(properties["half"] || properties["nocritic"]);
    diceOptions.difficulty = difficulty + action.level;
    diceOptions.margin = rollstress.total - diceOptions.difficulty;

    if (properties["activedefense"]) {
      const updateData={};
      updateData["data.effectAttributes.temporary.selfrawmargin"] = diceOptions.margin;
      actor.update(updateData);
    }

    //opposition
    for( const target of targetToken){
      const passiveActor = target.actor ?? target ;
      const passiveData = passiveActor.system;
      const passiveEffectAttributes = passiveData.effectAttributes;
      const passiveTemporary = passiveEffectAttributes.temporary;
      const passiveSkills = passiveData.skills;
      const passiveAbilities = passiveData.abilities;
      const passiveAttributes = passiveData.attributes;
      target.diceData = {};
      const passiveDiceData = target.diceData;
      const passiveToken = passiveActor.getToken();

      passiveTemporary.defense = action.actionType;
      passiveTemporary.current = diceOptions.margin >= 0;
      let criticalStatus = false;
      passiveDiceData.passiveTotal =0;
      if (options.opposition) {
        passiveTemporary.ability = action.passiveAbility;
        passiveDiceData.passiveBonusRoll = new Roll(options.passiveBonus);
        passiveDiceData.passiveBonusRoll.evaluate({ async: false });
        passiveDiceData.passiveTotal = passiveAbilities[action.passiveAbility].value + passiveDiceData.passiveBonusRoll.total;
        


        if (action.actionType !== "other" ) passiveDiceData.passiveTotal += passiveEffectAttributes.defense[action.actionType];
        
        let passiveSkill1 = passiveSkills[action.passiveSkill];
        passiveTemporary.skill1 = action.passiveSkill;
        if (action.actionType === "melee" && passiveSkill1.value + passiveSkill1.bonus < passiveSkills["ath"].value + passiveSkills["ath"].bonus) {
          passiveSkill1 = passiveSkills["ath"];
          passiveTemporary.skill1 = "ath";
        }

        if ( action.skill2 === "" ) passiveDiceData.passiveTotal += passiveSkill1.value + passiveSkill1.bonus;
        else {
          const passiveSkill2 = passiveSkills[action.skill2];
          passiveDiceData.passiveTotal += Math.max(passiveSkill1.value + passiveSkill1.bonus, passiveSkill2.value + passiveSkill2.bonus) + Math.min(passiveSkill1.rank, passiveSkill2.rank);
          passiveTemporary.skill2 = passiveSkill2;         
        }

        let dis = 0;
        for (let [status, value] of Object.entries(passiveEffectAttributes.status)) {
          dis += advStatus(status, value, action.actionType, false);
        }
        if (["melee","shoot"].includes(action.actionType)) {
          //cas particulier invi et aveugle
          if (effectAttributes.status.invisible > 0 && passiveEffectAttributes.status.blinded > 0) dis +=3;
          if (effectAttributes.status.blinded > 0 && passiveEffectAttributes.status.invisible > 0) dis -=3;         
          //cas particulier pas de vision adapte, et adversaire pas illumine
          if (effectAttributes.status.blinded === 0 && attributes.senses.distance === 0 && passiveToken && !passiveToken.isIlluminated() ) dis +=3;
          if (passiveEffectAttributes.status.blinded === 0 && passiveAttributes.senses.distance === 0 && sourceToken && !sourceToken.isIlluminated()) dis -=3;
        }

        //cas particulier de caché (non cumulable avec invi et aveuglé) + verif perception passive
        if (effectAttributes.status.invisible === 0 && effectAttributes.status.hidden > 0 && passiveEffectAttributes.status.blinded === 0 && ["melee","shoot"].includes(action.actionType)) {
          let flagSeen = false;
          //a peaufiner plus tard
          let distance = 100;
          let light = 3;
          if (effectAttributes.status.cover === 0) {
            if (passiveAttributes.senses.truesight > distance) flagSeen = true;
            if (passiveAttributes.senses.dimvision > distance && light > 3) flagSeen = true;
            if (passiveAttributes.senses.darkvision > distance && light > 0) flagSeen = true;
          }
          if (passiveAttributes.senses.touchsight > distance) flagSeen = true;

          let pp = passiveAbilities.wis.value + passiveSkills.prc.value + passiveSkills.prc.bonus +6
          if (effectAttributes.status.hidden < pp) flagSeen = true
          if (!flagSeen) dis+=3;
        }
        //cas particulier de charmé
        if (passiveEffectAttributes.status.charmed && ["cha"].includes(action.ability) ){
          //a traiter plus tard
        }

        //canvas

        if (passiveToken !== null && sourceToken !== null) {
          if (["shoot","dex"].includes(action.actionType)) {
            let cover = sourceToken.tokenLos(passiveToken);
            passiveDiceData.passiveTotal += cover.cover *3;
          }
          if ( ["shoot"].includes(action.actionType) && action.range.long && ["case"].includes(action.range.units) && actor.testTrait("trait_longRange")) {
            let distance = sourceToken.tokenDistance(passiveToken);
            if (distance > range ) passiveDiceData.passiveTotal += 3;
          }
        }

        passiveDiceData.passiveTotal += dis;
        if (passiveAttributes.encumbrance.mod >0) passiveDiceData.passiveTotal += passiveAttributes.encumbrance.mod*(passiveAttributes.encumbrance.mod+1)/2; 
        criticalStatus = passiveEffectAttributes.status.paralyzed > 0 || passiveEffectAttributes.status.petrified > 0 || passiveEffectAttributes.status.unconscious > 0;
      }
      //a passer en update un jour
      passiveDiceData.margin = diceOptions.margin - passiveDiceData.passiveTotal;
      passiveDiceData.critical = diceOptions.allowCritical ? Math.max(0, Math.floor(passiveDiceData.margin/10)) : 0;
      if (passiveDiceData.margin >=0 && criticalStatus && diceOptions.allowCritical) passiveDiceData.critical++;

      passiveTemporary.success = passiveTemporary.current && passiveDiceData.margin >= 0;
      passiveTemporary.rawMargin = diceOptions.margin;
      passiveTemporary.critical = passiveDiceData.critical;   
    };
    if ( targetToken.length === 0 ) diceOptions.critical = Math.max(0, Math.floor(diceOptions.margin/10));
    diceOptions.flavor = flavor;
    
    //restore effect,
    await actor.restoreAfterRoll("skill");
    for(const target of targetToken) {
      if (target.actor) await target.actor.restoreAfterRoll("skill");
    }
    return rollstress;
  };

  // Create the Roll instance
  const roll = fastForward ? await _roll(parts) : await _StressRollDialog({template, title, parts, data, dialogOptions, roll: _roll});

  if ( roll ) {
    // pass data over the roll
    roll.dice[0].options.data = data;
    roll.dice[0].options.targetToken = targetToken;
    
    // Prepare Message Data
    messageData.flavor = flavor || title;
    messageData.speaker = speaker || ChatMessage.getSpeaker();
    const messageOptions = {rollMode: "roll"};
    
    // Create a Chat Message
    if ( chatMessage ) roll.toMessage(messageData, messageOptions);
  }
  return roll;
}

function advStatus(status, value, actionType, active=true){
  if (value ===0) return 0;
  if (value < 0 && !["adv", "dis", "all"].includes(status)) return 0;
  switch(status) {
    case "exhaustion": 
    case "adv": 
    case "pained":
      return value*3;    
    case "dis":
      return -value*3;
    case "all":
      return value;
    case "withdrawal": 
      return -value ;
    case "frightened": 
      return -3;
    //["skill","melee","shoot","str","dex","con","wis","int","cha","other"]
    case "blinded":
      if (["melee","shoot"].includes(actionType)) return -3;
      if (!active && ["dex"].includes(actionType)) return -3;
      return 0;
    case "invisible": 
      if (["melee","shoot"].includes(actionType)) return 3;
      return 0;
    case "clumsy":
      if (active && ["melee","shoot"].includes(actionType)) return -3;
      return 0;
    case "prone": 
      if (active && ["melee","shoot"].includes(actionType)) return -3;
      if (!active && ["melee"].includes(actionType)) return -3;
      if (!active && ["shoot"].includes(actionType)) return 3;
      return 0;
    case "paralyzed": 
    case "petrified":
      if (!active && ["melee","shoot","dex"].includes(actionType)) return -9;    
      return 0;
    case "unconscious":
      if (!active && ["melee","dex"].includes(actionType)) return -12;
      if (!active && ["shoot"].includes(actionType)) return -6;
      return 0;
    case "restrained": 
      if (active && ["melee", "shoot"].includes(actionType)) return -6;
      if (!active && ["dex"].includes(actionType)) return -3;
      return 0;
    case "stunned": 
      if (!active && ["for","dex"].includes(actionType)) return -3; 
    case "cover":
      if (!active && ["melee","shoot","dex"].includes(actionType)) return value*3;    
    default:
      return 0;
  }
}

async function _StressRollDialog({template, title, parts, data, dialogOptions, roll}={}) {

  // Render modal dialog
  template = template || "systems/arsdd/templates/apps/skillroll-dialog.html";
  let dialogData = {
    data: data,
    config: CONFIG.ARSDD
  };
  const html = await renderTemplate(template, dialogData);

  // Create the Dialog window
  return new Promise(resolve => {
    new Dialog({
      title: title,
      content: html,
      buttons: {
        normal: {
          label: game.i18n.localize("ARSDD.Roll"),
          callback: html => resolve(roll(parts, html[0].querySelector("form")))
        }
      },
      default: "normal",
      close: () => resolve(null)
    }, dialogOptions).render(true);
  });
}

export async function damageRoll({data, event={}, template, title, speaker, flavor,
  dialogOptions={}, chatMessage=true, messageData={}, targetToken=[]}={}) {

  const parts = [];
  const damageType = [];
  const action = data.item.action;
  const properties = data.item.properties;
  const itemSubtype = data.item.subtype;
  const actor = data.actor;

  //check effect
  if ( targetToken.length === 1 && targetToken[0].actor) await actor.checkEffect(action, targetToken[0].actor);
  else await actor.checkEffect(action, null);
  for( const target of targetToken){
    if (target.actor) target.actor.checkEffect(action, actor);
  };

  const effectAttributes = actor.system.effectAttributes;
  const abilities = actor.system.abilities;
  const skills = actor.system.skills;
  const attributes = actor.system.attributes;

  let hasDamage = false;
  let hasHealing = false;
  //compose parts et track damagetype
  action.damage.parts.forEach(function(damage){
    if (CONFIG.ARSDD.damageTypes.hasOwnProperty(damage[1]) ) {
      const damageSingle = damage[0].split('+');
      damageSingle.forEach(function(element){
        parts.push(element);
        damageType.push(damage[1]);
      });
      hasDamage = true;
    }
  });

  //bonus of ability for melee & shoot
  if ( Object.keys(CONFIG.ARSDD.weaponSubtypes).includes(itemSubtype)) {
    if( action.actionType === "shoot") {
      parts.push(abilities["dex"].value);
      damageType.push(damageType[0]);
    }
    else if (action.actionType === "melee" && properties["fin"]) {
      parts.push(Math.max(abilities["str"].value, abilities["dex"].value));
      damageType.push(damageType[0]);
    }
    else if (action.actionType === "melee") {
      parts.push(abilities["str"].value);
      damageType.push(damageType[0]);
    }
    //versatile : add 2 to faces of the 1st dice
    if (actor.hands === "ver" && properties["ver"]) {
      const dice = parts[0].split('d');
      dice[1] = parseInt(dice[1]) < 12 ? parseInt(dice[1]) +2 : parseInt(dice[1]);
      parts[0] = dice.join('d');
    }
  }
  //effet boost degat
  for ( const [e, d] of Object.entries(effectAttributes.damage) ) {
    let effectDmg = d.split('+');
    effectDmg.forEach(function(element){
      if (element !== "") {
        parts.push(element);
        damageType.push(e);
      }
    });  
  }

  if (actor.testTrait("trait_reroll12")) {
    parts.forEach(function(element, index, array) {
      if (element.toString().indexOf('d') !== -1 ) array[index] += "r<3";     
    });
  }

  //soin
  action.damage.parts.forEach(function(damage){
    if (CONFIG.ARSDD.healingTypes.hasOwnProperty(damage[1]) ) {
      const damageSingle = damage[0].split('+');
      damageSingle.forEach(function(element){
        parts.push(element);
        damageType.push(damage[1]);
      });
      hasHealing = true;
    }
  });
  //effet boost soin
  if (hasHealing && effectAttributes.other.healing !==0 ){
    parts.push(effectAttributes.other.healing);
    damageType.push(damageType[0]);
  }

  // Create the damage roll and execute
  let roll = new Roll(parts.join("+"), data);

  try {
    roll.evaluate({ async: false });
  } catch(err) {
    console.error(err);
    ui.notifications.error(`Dice roll evaluation failed: ${err.message}`);
    return null;
  }

  //type damage et armor

  const configDamageType = Object.keys(CONFIG.ARSDD.damageTypes).map( dam => [dam, 0]).concat(Object.keys(CONFIG.ARSDD.healingTypes).map( dam => [dam, 0]));
  const damageTypeRef = Object.fromEntries(configDamageType);
  const damageOnlyTypeRef = Object.keys(CONFIG.ARSDD.damageTypes);

  let diceOptions = roll.dice[0].options;
  let k = 1;
  let i = 0;
  roll.terms.forEach(function(element, index){
    if (element.operator === "+") {
      k=1;
      i++;
    }
    else if (element.operator === "-") {
      k=-1;
      i++;
    }
    else {
      if (element.options) {
        element.options.damageType=damageType[index-i];
        damageTypeRef[damageType[index-i]] += k * element.total;
      }
      else damageTypeRef[damageType[index-i]] += k * element;
    }
  });

  //opposition
  for( const target of targetToken){
    let tgt = target.actor ?? target;
    const passiveEffectAttributes = tgt.system.effectAttributes;
    let total = {damage:0, healing:0, healingmp:0, healingtemphp:0, healingtempmp:0};
    const passiveDiceData = target.diceData = {};
    passiveDiceData.damage = {};

    //process by damagetype
    for (let dmgType in damageTypeRef) {
      let dmgValue = damageTypeRef[dmgType];

      if (passiveEffectAttributes.temporary.current){
        //cas mot cle moitie
        if (!passiveEffectAttributes.temporary.success && properties["half"] ) dmgValue = Math.floor(dmgValue /2);
        else if (!passiveEffectAttributes.temporary.success) dmgValue = 0;
        //critical management
        else if ( passiveEffectAttributes.temporary.critical > 0 ) {
          let criticalBonusDice = 0;
          if (damageType[0] === dmgType && ["melee", "shoot"].includes(action.actionType) && actor.testTrait("trait_brutalCritical")) {
            criticalBonusDice = actor.countTrait("trait_brutalCritical");
            const faces = roll.terms[0].faces;
            let element = criticalBonusDice + `d` + faces
            if (element.indexOf('d') !== -1 && actor.testTrait("trait_reroll12")) element +="r<3";
            let rollextra = new Roll(element);
            rollextra.evaluate({ async: false });
            rollextra.dice[0].options.damageType=roll.dice[0].options.damageType;
            dmgValue += rollextra.total;
            diceOptions.rollextra = rollextra;
          }
          // Modify the damage formula +50% per critic
          dmgValue = Math.floor(dmgValue * (1 +  passiveEffectAttributes.temporary.critical*0.5));
        }
      }

      //armor, resistance
      if (damageOnlyTypeRef.includes(dmgType)) {
        //weaken
        if (effectAttributes.status.weaken > 0 && ["melee","shoot"].includes(action.actionType) ) dmgValue = Math.max(dmgValue/2);
        //armure
        dmgValue = Math.max(dmgValue - Math.max(passiveEffectAttributes.armor[dmgType] - effectAttributes.pierceArmor[dmgType]), 0);
        if (passiveEffectAttributes.resistance[dmgType] > effectAttributes.pierceResistance[dmgType]) dmgValue = Math.floor(dmgValue /2);
        if (passiveEffectAttributes.immunities[dmgType] > effectAttributes.pierceImmunity[dmgType]) dmgValue = 0;             
        if (passiveEffectAttributes.vulnerability[dmgType] >0) dmgValue *= 2;
        total.damage += dmgValue;
      }
      else total[dmgType] += dmgValue;
      passiveDiceData.damage[dmgType] = dmgValue;
    }
    passiveDiceData.damageTotal = 0;
    for ( let [key, value] of Object.entries(total)) {
      if (value > 0 || value < 0) {
        tgt.applyDamage(value, key);
        passiveDiceData.damageTotal += value;
      }     
    }
    passiveDiceData.critical = effectAttributes.temporary.critical;

  }

  // pass data over the roll
  diceOptions.actionType = data.item.actionType;
  if (hasDamage) diceOptions.source = "damage";
  else if (hasHealing) diceOptions.source = "healing";
  diceOptions.damageTypeRef = damageTypeRef;
  diceOptions.data = data;
  diceOptions.targetToken = targetToken;
  
  // Prepare Create a Chat Message
  if ( chatMessage ) {
    messageData.flavor = flavor || title;
    messageData.speaker = speaker || ChatMessage.getSpeaker();
    const messageOptions = {rollMode: "roll"};
    roll.toMessage(messageData, messageOptions);
  }

  //restore effect, stop temporary
  await actor.restoreAfterRoll("damage");
  for( const target of targetToken){
    if (target.actor) {
      target.actor.restoreAfterRoll("damage");
      target.actor.resetTemporary();
    }
  }
  return roll;
}

