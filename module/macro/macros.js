

export async function groupShortRest() {
  let data = {};
  data.pc = pcList();
  data.hasSkill = false;
  data.hasNumber1 = false;
  data.number1Label = "";
  data.buttonTitle = "Lancer le repos court";
  data.title = "Repos court de groupe";

  const _toDo = async function (form) {
    if (form) {
      const ids = document.getElementsByName("names[]");
      for ( const id of ids) {
        if (id.checked) await game.actors.get(id.value).shortRest();
      }
      return true;
    }
    return false;
  }
  const result = simpleDialog({template:"systems/arsdd/templates/apps/choosePc-dialog.html", data, toDo: _toDo});
  if (isActivatedModule("foundryvtt-simple-calendar") && result) SimpleCalendar.api.changeDate({hour: 1});

}

export async function groupLongRest() {
  let data = {};
  data.pc = pcList();
  data.hasSkill = false;
  data.hasNumber1 = false;
  data.number1Label = "";
  data.buttonTitle = "Lancer le repos long";
  data.title = "Repos long de groupe";

  const _toDo = async function (form) {
    if (form) {
      const ids = document.getElementsByName("names[]");
      for ( const id of ids) {
        if (id.checked) await game.actors.get(id.value).longRest();
      }
      return true;
    }
    return false;
  }
  const result = await simpleDialog({template:"systems/arsdd/templates/apps/choosePc-dialog.html", data, toDo: _toDo});
  if (isActivatedModule("foundryvtt-simple-calendar") && result) SimpleCalendar.api.changeDate({hour: 8});
}

export async function groupRollSkill(){
  let data = {};
  data.pc = pcList();
  data.hasSkill = true;
  data.hasNumber1 = true;
  data.number1Label = "Difficulté";
  data.buttonTitle = "Lancer le test de compétence";
  data.title = "Jet de compétence de groupe";

  const _toDo = async function (form) {
    if (form) {
      const ids = document.getElementsByName("names[]");
      const skillId = form.skillId.value;
      const difficulty = form.number1.value;
      for (const id of ids) {
        if (id.checked) await game.actors.get(id.value).rollSkill(skillId, {difficulty:difficulty, fastForward:true});
      }
      return true;
    }
    return false;
  }
  const result = await simpleDialog({template:"systems/arsdd/templates/apps/choosePc-dialog.html", data, toDo: _toDo});
}

export async function groupAddXp(){
  let data = {};
  data.pc = pcList();
  data.hasSkill = false;
  data.hasNumber1 = true;
  data.number1Label = "PX";
  data.buttonTitle = "Ajouter les PX";
  data.title = "PX aventure de groupe";

  let names = [];
  let xp = 0;

  const _toDo = async function (form) {
    if (form) {
      const ids = document.getElementsByName("names[]");
      xp = parseInt(form.number1.value);
      for (const id of ids) {
        if (id.checked) {
          const actor = game.actors.get(id.value);
          await actor.addXp(xp);
          names.push(actor.name);
        }
      }
      return true;
    }
    return false;
  }
  const result = await simpleDialog({template:"systems/arsdd/templates/apps/choosePc-dialog.html", data, toDo: _toDo});
  if (result) {
    const chatData = {
      user: game.user._id,
      speaker: ChatMessage.getSpeaker(),
      content: "<p>" + names.join(", ") + " ont reçu " + xp +" px</p>"
    };
    ChatMessage.create(chatData, {});
  }
}

export async function groupFall() {
  let data = {};
  data.pc = pcList();
  data.hasSkill = false;
  data.hasNumber1 = true;
  data.number1Label = "Hauteur (en cases)";
  data.buttonTitle = "Lancer le test de chute";
  data.title = "Chute de groupe";

  const _toDo = async function (form) {
    if (form) {
      const ids = document.getElementsByName("names[]");
      let wound = Math.ceil(parseInt(form.number1.value)/2);
      for (const id of ids) {
        if (id.checked) {
          const actor = game.actors.get(id.value);
          let roll = await actor.rollSkill("ath", {ability:"dex", difficulty:0, fastForward:true});
          if (roll.dice[0].options.fumble === 0 ) wound -= Math.ceil(roll.dice[0].options.margin/6);
          else wound += roll.dice[0].options.fumble *5

          const rollData = this.getRollData();
          const item = rollData.item = {action:{}};;
          const action = item.action;
          action.actionType = "other";
          action.damage = {parts : [[wound+"d6", "physic"]]};
          item.properties = [];
    
          const rollConfig = mergeObject({
            data: rollData,
            title: "Chute",
            speaker: ChatMessage.getSpeaker({actor: this}),
            flavor: "Chute",
            targetToken:[{actor:actor, data:{}}]
          });

          await damageRoll(rollConfig);
        }
      }
      return true;
    }
    return false;
  }
  const result = await simpleDialog({template:"systems/arsdd/templates/apps/choosePc-dialog.html", data, toDo: _toDo});
}

export async function pcJump() {
  let data = {};
  if (canvas.tokens.controlled.length === 0) {
    Dialog.prompt({
      title: "Saut",
      content: `<p>Merci de sélectionner un token avant</p>`,
      callback: () => {},
      rejectClose: false
    });
    return;
  };
  data.title = "Sauter"
  data.buttonTitle = "Lancer le saut";
  let actor = game.actors.get(canvas.tokens.controlled[0].actor.id);

  const _toDo = async function (form) {
    let difficulty;
    if (form) {
      if (form.longJump.value) difficulty = 6 - actor.system.attributes.size *2 + parseInt(form.number1.value) *3;
      else difficulty = 6 - actor.system.attributes.size + parseInt(form.number1.value) *6;
      if (!form.runup.value) difficulty += 6;
      let roll = await actor.rollSkill("ath", {difficulty:difficulty, fastForward:true});
      return true;
    }
    return false;
  }
  const result = await simpleDialog({template:"systems/arsdd/templates/apps/jump-dialog.html", data, toDo: _toDo});

}

async function simpleDialog({template, data, toDo}={}) {
  let dialogData = {
    data: data,
    config: CONFIG.ARSDD
  };
  const html = await renderTemplate(template, dialogData);

  return new Promise(resolve => {
    new Dialog({
      title: data.title,
      content: html,
      buttons: {
        valid: {
          label: data.buttonTitle,
          callback: html => resolve(toDo(html[0].querySelector("form")))
        }
      },
      default: "valid",
      close: () => resolve(null)
    }, {}).render(true);
  });
}


export function pcList() {
  let pc = [];
  if (game.folders.getName("PJ") === undefined) ui.notifications.warn("Folder 'PJ' doesn't exist");
  pc = game.actors.filter(actor => actor.folder._id === game.folders.getName("PJ").id && actor.here);
  if (pc.length === 0) ui.notifications.warn("No PJ actor in the current scene");
  return pc;
}

export function isActivatedModule(name){
  if (game.modules.get(name)?.active) return true;
  ui.notifications.warn("Module "+name+" doesn't exist or isn't activated");
  return false;
}
