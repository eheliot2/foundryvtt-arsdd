import TokenArsDD from "./token.js";

export default class CombatArsDD extends Combat {
    /** @override */
  async nextRound() {
    //override : appliquer le retard
    for( const combatant of this.combatants) {
      const actorData = combatant.actor.system;
      let init = combatant.initiative;
      if ( init < 0) {
        let rollInitiative = new Roll(`10-1d4`);
        rollInitiative.evaluate({ async: false });
        init = rollInitiative.total;
      }
      const updateDataCombatant = {};
      init -= actorData.effectAttributes.status.delay + actorData.attributes.init.delay;
      updateDataCombatant["initiative"] = init;
      await combatant.update(updateDataCombatant);

      const updateDataActor = {};
      updateDataActor["system.attributes.init.delay"] = 0;
      await combatant.actor.update(updateDataActor);
    }
    this.setupTurns();

    let turn = await this.nextTurnFind(-1);
    if (turn === -1) {
      turn = 0;
      ui.notifications.warn("COMBAT.NoneRemaining", {localize: true});
    }
    let advanceTime = 6;
    return this.update({round: this.round + 1, turn}, {advanceTime});
  }

    /** @override */
  async nextTurn() {
    //pretraitement token
    for (const combatant of this.combatants) {
      const token = TokenArsDD.tokenDocumentToToken(combatant.token._id);
      token.setPosition();
    }

    if ( this.round === 0 ) return this.nextRound();

    let next = await this.nextTurnFind(this.turn ?? -1);

    if ( next === -1 ) return this.nextRound();
    else {
      // Update the encounter
      const advanceTime = 6;
      return this.update({round: this.round, turn: next}, {advanceTime});
    }


  }

  async nextTurnFind(turn) {
    const skipDefeated = this.settings.skipDefeated;
    const skipUncapacitated = false; //this.settings.skipUncapacitated;

    if ( turn > -1 && turn < this.turns.length ) await this.turns[turn].actor.endTurn(this);

    for (const combatant of this.combatants) {
      TokenArsDD.tokenDocumentToToken(combatant.token);
    }

    // Determine the next turn number
    for ( const [iTurn, combatant] of this.turns.entries() ) {
      if ( iTurn <= turn ) continue;
      if ( skipDefeated && combatant.isDefeated ) continue;
      //uncapacitated ne joue pas
      const status = combatant.actor.system.effectAttributes.status;
      if ( skipUncapacitated && (status.stunned > 0 || status.paralyzed > 0 || status.incapacitated > 0)) {
        await combatant.actor.startTurn();
        await combatant.actor.endTurn();
        continue;
      }

      //initiative <0 ne joue pas
      if ( combatant.initiative < 0) {
        await combatant.actor.startTurn();
        await combatant.actor.endTurn();
        continue;
      }
      await combatant.actor.startTurn();
      return iTurn;
    }
    return -1;
  }

    /** @override */
  prepareDerivedDataCombat() {
    if ( this.combatants.size && !this.turns?.length ) this.setupTurns();
    for( const combatant of this.combatants) {
      const actor = game.actors.get(combatant.actorId);
      actor.setSenses();
    }  
  }

  async _preDelete() {
    for( const combatant of this.combatants) {
      const actor = game.actors.get(combatant.actorId);
      actor.endCombat();
    }  
  }

}

