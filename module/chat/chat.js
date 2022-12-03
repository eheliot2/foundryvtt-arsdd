//bibli de manip du DOM pour le chat
function mergeElement(child, type, parent, classes=[], content="", after=true ) {
  child = document.createElement(type);
  classes.forEach(c => child.classList.add(c));
  if (after) parent.append(child);
  else parent.prepend(child);
  if (content !== "" ) {
    child.append(content);
  }
  return child;
}

function iconFromImage(imgName, parent, tooltip='', after=true) {
  const imgElement = document.createElement('img');
  const size = 18;
  imgElement.src = imgName;
  imgElement.width = size;
  imgElement.height = size;
  imgElement.title = tooltip;
  imgElement.style.border = `none`;
  if (after) parent.append(imgElement);
  else parent.prepend(imgElement);
}

function damageIcon(damageType, parent, after=true){
  if (CONFIG.ARSDD.damageTypes.hasOwnProperty(damageType) ) iconFromImage(CONFIG.ARSDD.damageTypesIcon[damageType], parent, CONFIG.ARSDD.damageTypes[damageType], after);
  if (CONFIG.ARSDD.healingTypes.hasOwnProperty(damageType) ) iconFromImage(CONFIG.ARSDD.healingTypesIcon[damageType], parent, CONFIG.ARSDD.healingTypes[damageType], after);

}

/* -------------------------------------------- */

export const alterCard = function(message, html, data){
  const header = html.find('.message-header')[0];
  const speakerImg = ChatPortrait.prepareChatPortrait(message.speaker);
  if (speakerImg !== null) header.prepend(speakerImg); 
  
  const flavorElement = html.find('.flavor-text');
  if (flavorElement.length > 0) {
    const copiedElement = flavorElement[0].cloneNode(true);
    flavorElement.remove();
    const brElement = document.createElement('br');
    const senderElement = html.find('.message-sender')[0];
    senderElement.appendChild(brElement);
    senderElement.appendChild(copiedElement);    
  }


  if ( message.isRoll ) {
    const roll = message.rolls[0];
    const dice = roll.dice[0];
    const source = dice.options.source;
    const margin = dice.options.margin;
    const fumble = dice.options.fumble;
    const difficulty = dice.options.difficulty;
    const damageTypeRef = dice.options.damageTypeRef;
    const targetToken = dice.options.targetToken;

    const contentDiceResult = html.find('.dice-result')[0];
    html.find(".dice-total")[0].remove();

    const listToolTip = html.find(".dice-tooltip")[0];

    let contentDiceTotal, spanDiceTotal, spanDiceDiff, spanCrit, targetName;
    let sectionToolTip, divToolTip, headerToolTip, spanToolTipFormula, spanToolTipPart, olToolTip, liToolTip;

    contentDiceTotal = mergeElement(contentDiceTotal, 'div', contentDiceResult, ["dice-total"]);
    spanDiceTotal = mergeElement(spanDiceTotal, 'span', contentDiceTotal, ["total"], roll.total );

    if ( source === "action" ) {
      if ( margin >=0 ) contentDiceTotal.classList.add("success");
      else contentDiceTotal.classList.add("failure");
      //disaster : global for roll
      if (fumble > 0) contentDiceTotal.classList.add("fumble");
      for ( let i = 0; i < fumble; i++) spanCrit = mergeElement(spanCrit, 'i', contentDiceTotal, ["fas", "fa-skull-crossbones"] );

      spanDiceDiff = mergeElement(spanDiceDiff, 'span', contentDiceTotal, ["difficulty"], ' Diff: ' + difficulty );      
    }
    else if ( ["damage", "healing", "temphp"].includes(source) ) {
      spanDiceDiff = mergeElement(spanDiceDiff, 'span', contentDiceTotal, ["flex3", "difficulty"]);      
      for (let dmg in damageTypeRef) {
        if (damageTypeRef[dmg] >0 ) {
          spanDiceDiff.append(' +' + damageTypeRef[dmg] + ' ');
          damageIcon(dmg, spanDiceDiff);
        }
      }
      listToolTip.childNodes.forEach(function(sectionToolTip,index){
        if (sectionToolTip.childNodes.length > 0) {
          spanToolTipFormula = sectionToolTip.getElementsByClassName("part-formula")[0];
          spanToolTipFormula.append(' ');
          damageIcon(roll.terms[index-1].options.damageType, spanToolTipFormula);
        }
      });


      let rollextra = dice.options.rollextra;
      if (rollextra && rollextra.total > 0 ){
        let rollextraDice=rollextra.terms[0];
        sectionToolTip = mergeElement(sectionToolTip, 'section', listToolTip, ["tooltip-part"]);
        divToolTip = mergeElement(divToolTip, 'div', sectionToolTip, ["dice"]);
        headerToolTip = mergeElement(headerToolTip, 'header', divToolTip, ["part-header", "flexrow"]);
        spanToolTipFormula = mergeElement(spanToolTipFormula, 'span', headerToolTip, ["part-formula"], rollextra.formula + ' ');
        damageIcon(rollextraDice.options.damageType, spanToolTipFormula);
        spanToolTipFormula.append(' critique extra ');
        spanToolTipPart = mergeElement(spanToolTipPart, 'span', headerToolTip, ["part-total"], rollextra.total);
        olToolTip = mergeElement(olToolTip, 'ol', divToolTip, ["dice-rolls"]);
        for (let i = 0; i < rollextraDice.number; i++) {
          const result = rollextraDice.results[i].result;
          liToolTip = mergeElement(liToolTip, 'li', olToolTip, ["roll", "die", "d" + rollextraDice.faces], result);
          if (result === 1) liToolTip.classList.add("min");
          if (result === rollextraDice.faces ) liToolTip.classList.add("max");
        }
      }
    }
    if (targetToken) {
      if (targetToken.length === 0) {
        if ( source === "action" ) {
          if (dice.options.critical > 0) contentDiceTotal.classList.add("critical");
          for ( let i = 0; i < dice.options.critical; i++) spanCrit = mergeElement(spanCrit, 'i', contentDiceTotal, ["fas", "fa-check-circle"] );
        }
        
      }
      else {
        targetToken.forEach(function(target){
          const diceData = target.diceData;
          if ( source === "action" ) {
            if (targetToken.length === 1) {   
              //reuse the previous contentDiceTotal = > only one 
              contentDiceTotal.classList.add("flexrow");
              spanDiceDiff.append('+' + diceData.passiveTotal);
            }
            else {
              contentDiceTotal = mergeElement(contentDiceTotal, 'div', contentDiceResult, ["dice-total","flexrow"]);  
              spanDiceDiff = mergeElement(spanDiceDiff, 'span', contentDiceTotal, ["difficulty"], '+' + diceData.passiveTotal );      
            }
            if (diceData.critical > 0) contentDiceTotal.classList.add("critical");
            for ( let i = 0; i < diceData.critical; i++) spanCrit = mergeElement(spanCrit, 'i', contentDiceTotal, ["fas", "fa-check-circle"] );
            if ( source === "action" ) {
              if ( diceData.margin >= 0 ) contentDiceTotal.classList.add("success");
              else if ( margin >=0 ) contentDiceTotal.classList.add("halfsuccess");
              else contentDiceTotal.classList.add("failure");
            }

          }
          else if ( ["damage", "healing", "temphp"].includes(source) ) {
            contentDiceTotal = mergeElement(contentDiceTotal, 'div', contentDiceResult, ["dice-total","flexrow"]);
            spanDiceDiff = mergeElement(spanDiceDiff, 'span', contentDiceTotal, ["total"],  diceData.damageTotal);      
                  
            spanDiceDiff = mergeElement(spanDiceDiff, 'span', contentDiceTotal, ["difficulty"] );      
            for (let dmg in diceData.damage ) {
              if (diceData.damage[dmg] >0 ) {
                spanDiceDiff.append(' +' + diceData.damage[dmg] + ' ');
                damageIcon(dmg, spanDiceDiff);
              }
            }
          }

          targetName = mergeElement(targetName, 'span', contentDiceTotal, ["name"], target.actor.name, false );      
    
          const targetImg = ChatPortrait.prepareChatPortrait({scene:message.speaker.scene, actor:target.actor._id});
          if (targetImg !== null) contentDiceTotal.prepend(targetImg); 

        });
      }
    }
  }
}
 
/* -------------------------------------------- */
//merge chat portrait
class ChatPortrait {
  static prepareChatPortrait(speaker) {
    if (!speaker.token && !speaker.actor) return null;
    let info = this.findToken(speaker);
    const imgElement = document.createElement('img');
    if (info.imgPath) {
      imgElement.src = info.imgPath;
      imgElement.width = 36;
      imgElement.height = 36;
      imgElement.style.border = `2px solid ${info.borderColor}`;
    }
    return imgElement;
  }

  static findToken(speaker) {
    let token, actor;
    if (speaker.scene) {
      const scene = game.scenes.get(speaker.scene);
      const tokensScene = scene.tokens ? scene.tokens : {};
      token = tokensScene.find(t => t._id === speaker.token);
      if (token) return {imgPath:token.texture.src, borderColor:this.colorToken(token.disposition)};
    }
    if (speaker.token && game.actors.tokens[speaker.token] ) {
      token = game.actors.tokens[speaker.token] ;
      return {imgPath:token.texture.src, borderColor:this.colorToken(token.disposition)};
    }
    if (speaker.actor) {
      actor = game.actors.get(speaker.actor);
      if (actor && actor.img) return {imgPath:actor.img, borderColor:this.colorToken(actor.prototypeToken.disposition)};
    }
    return {imgPath:null, borderColor:'black'};
  }

  static colorToken(disposition){
    if (disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE) return 'red';
    else if (disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY) return 'green';
    else if (disposition === CONST.TOKEN_DISPOSITIONS.NEUTRAL) return 'yellow';
    return 'black'
  }
  

}

