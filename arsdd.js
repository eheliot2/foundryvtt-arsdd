/**
 * The ArsDD game system for Foundry Virtual Tabletop
 * Software License: GNU GPLv3
 */

// Import Modules
import { ARSDD } from "./module/config.js";
import { registerSystemSettings } from "./module/settings.js";
import { preloadHandlebarsTemplates } from "./module/templates.js";
import * as iCanvas  from "./module/canvas/canvas.js";
import * as iCombattant  from "./module/canvas/combattant.js";

// Import Doc
import ActorArsDD from "./module/actor/actor.js";
import ItemArsDD from "./module/item/item.js";
import JournalEntryArsDD from "./module/journal/journal.js";
import CombatArsDD from "./module/canvas/combat.js";

// Import Object
import TokenArsDD from "./module/canvas/token.js";
import {WallDocumentArsDD, WallArsDD, WallConfigArsDD} from "./module/canvas/wall.js";

import DieArsDD from "./module/dice/diceterm.js";

// Import Applications
import AbilityTemplate from "./module/pixi/ability-template.js";
import ActorSheetArsDD from "./module/actor/sheet.js";
import JournalSheetArsDD from "./module/journal/sheet.js";
import ItemSheetArsDD from "./module/item/sheet.js";
import TraitSelector from "./module/actor/trait-selector.js";
import ActorMovementConfig from "./module/actor/movement-config.js";
import ActorSensesConfig from "./module/actor/senses-config.js";
import ActiveEffectArsDD from "./module/effect/effects.js";
import ActiveEffectConfigArsDD from "./module/effect/sheet.js";

// Import Helpers
import * as iChat from "./module/chat/chat.js";
import * as iDice from "./module/dice/dice.js";
import * as iMigrations from "./module/migration.js";
import * as iMacros from "./module/macro/macros.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", function() {
  console.log(`ArsDD | Initializing the ArsDD Game System\n${ARSDD.ASCII}`);

  // Create a namespace within the game global
  game.arsdd = {
    applications: {
      ActorSheetArsDD,
      ItemSheetArsDD,
      JournalSheetArsDD,
      TraitSelector,
      ActorMovementConfig,
      ActorSensesConfig
    },
    canvas: {
      AbilityTemplate,
      TokenArsDD
    },
    config: ARSDD,
    dice: iDice,
    documents: {
      ActorArsDD,
      ItemArsDD,
      JournalEntryArsDD,
      ActiveEffectArsDD,
      CombatArsDD,
      WallDocumentArsDD
    }
  };

  // Record Configuration Values
  CONFIG.ARSDD = ARSDD;
  CONFIG.Actor.documentClass = ActorArsDD;
  CONFIG.Item.documentClass = ItemArsDD;
  CONFIG.JournalEntry.documentClass = JournalEntryArsDD;
  CONFIG.ActiveEffect.documentClass = ActiveEffectArsDD;
  CONFIG.Token.objectClass = TokenArsDD;
  CONFIG.Combat.documentClass = CombatArsDD;
  CONFIG.Wall.documentClass = WallDocumentArsDD;
  CONFIG.Wall.objectClass = WallArsDD;

  CONFIG.time.roundTime = 6;
  CONFIG.Dice.terms[DieArsDD.DENOMINATION] = DieArsDD;
  CONFIG.Dice.types.push(DieArsDD);

  // 5e cone RAW should be 53.13 degrees
  CONFIG.MeasuredTemplate.defaults.angle = 53.13;

  // Register System Settings
  registerSystemSettings();

  // Patch Core Functions
  CONFIG.Combat.initiative.formula = "1da + @abilities.dex.value + @skill + @attributes.init.bonus";
  Combatant.prototype._getInitiativeFormula = iCombattant._getInitiativeFormula;
  Canvas.prototype._initializeTokenControl = iCanvas.canvasInitializeTokenControl

  //modif rendu token
  CONFIG.Canvas.dispositionColors = {
    HOSTILE: 0xDF0000,
    NEUTRAL: 0xF1D836,
    FRIENDLY: 0x00DF00,
    INACTIVE: 0x555555,
    PARTY: 0x33BC4E,
    CONTROLLED: 0xFF9829
  };
/*   dispositionColors: {
    HOSTILE: 0xE72124,
    NEUTRAL: 0xF1D836,
    FRIENDLY: 0x43DFDF,
    INACTIVE: 0x555555,
    PARTY: 0x33BC4E,
    CONTROLLED: 0xFF9829
  } */

  SquareGrid.prototype.measureDistances = iCanvas.measureDistances;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("arsdd", ActorSheetArsDD, {
    makeDefault: true,
    label: "ARSDD.SheetClassCharacter"
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("arsdd", ItemSheetArsDD, {
    makeDefault: true,
    label: "ARSDD.SheetClassItem"
  });
  Journal.unregisterSheet("core", JournalSheet);
  Journal.registerSheet("arsdd", JournalSheetArsDD, {
    makeDefault: true,
    label: "ARSDD.SheetClassJournal"
  });
  DocumentSheetConfig.registerSheet(ActiveEffect, "arsdd", ActiveEffectConfigArsDD, {makeDefault: true});
  DocumentSheetConfig.registerSheet(WallDocument, "arsdd", WallConfigArsDD, {makeDefault: true});



  // Preload Handlebars Templates
  preloadHandlebarsTemplates();

  let macros = game.macroArsDD = {}
  macros.groupShortRest = iMacros.groupShortRest;
  macros.groupLongRest = iMacros.groupLongRest;
  macros.groupRollSkill = iMacros.groupRollSkill;
  macros.groupAddXp = iMacros.groupAddXp;
  macros.groupFall = iMacros.groupFall;
  macros.pcJump = iMacros.pcJump;


});



/* -------------------------------------------- */
/*  Foundry VTT Setup                           */
/* -------------------------------------------- */

// This function runs after game data has been requested and loaded from the servers, so doc exist
Hooks.once("setup", function() {

  // Localize CONFIG objects once up-front
  const toLocalize = [
    "abilities", "abilityAbbreviations", "activationTypes", "armorSubtypes", 
    "consumableSubtypes", 
    "damageTypes", "distanceUnits", "duration", "targetTypes", "timePeriods", "periodName",
    "effectDuration", "effectConditions", "effectPropertiesLabel", 
    "equipmentSubtypes", 
    "featFrequency", "featValue", "groupRaces", 
    "healingTypes", "itemActionTypes", 
    "limitedUsePeriods", "movementTypes", "senses", "senses2", "skills",
    "spellComponents", "spellSubtypes", "spellProperties",     
    "weaponProperties", "weaponSubtypes", "weaponHands"
  ];

  // Exclude some from sorting where the default order matters
  const noSort = [
    "abilities", "abilityAbbreviations", "activationTypes", "armorSubtypes", "damageTypes", "distanceUnits", 
    "duration", "effectDuration", "periodName", "featFrequency", "featValue", "healingTypes", "senses", "senses2", 
    "itemActionTypes", "limitedUsePeriods", "skills", "spellComponents", "spellSubtypes", "spellProperties", "timePeriods", "targetTypes", 
    "weaponSubtypes", "weaponHands", "weaponProperties"
  ];

  // Localize and sort CONFIG objects
  for ( let o of toLocalize ) {
    const localized = Object.entries(CONFIG.ARSDD[o]).map(e => {
      return [e[0], game.i18n.localize(e[1])];
    });
    if ( !noSort.includes(o) ) localized.sort((a, b) => a[1].localeCompare(b[1]));
    CONFIG.ARSDD[o] = localized.reduce((obj, e) => {
      obj[e[0]] = e[1];
      return obj;
    }, {});
  }

});

//migration
Hooks.once("ready", function() {

  // Determine whether a system migration is required and feasible
  if ( !game.user.isGM ) return;
  const currentVersion = game.settings.get("arsdd", "systemMigrationVersion");
  const NEEDS_MIGRATION_VERSION = "2.00";
  const COMPATIBLE_MIGRATION_VERSION = 9;
  const totalDocuments = game.actors.size + game.scenes.size + game.items.size;
  if ( !currentVersion && totalDocuments === 0 ) return game.settings.set("arsdd", "systemMigrationVersion", game.system.version);
  const needsMigration = !currentVersion || isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion);
  if ( !needsMigration ) return;

  // Perform the migration
  if ( currentVersion && isNewerVersion(COMPATIBLE_MIGRATION_VERSION, currentVersion) ) {
    const warning = "migration data en cours";
    ui.notifications.error(warning, {permanent: true});
  }
  iMigrations.migrateWorld();
});


/* -------------------------------------------- */
/*  Canvas Initialization                       */
/* -------------------------------------------- */

Hooks.on("canvasInit", function() {
  
});

Hooks.on("canvasReady", function() {
  for ( const sourceToken of canvas.tokens.placeables ) {
    if (sourceToken.document.flags.aura !== undefined && sourceToken.document.flags.aura.isSource)  sourceToken.drawAura(); //v10
    sourceToken.actor.setSenses();
    sourceToken._refreshBorder();
  }
});



/* -------------------------------------------- */
/*  Other Hooks                                 */
/* -------------------------------------------- */


Hooks.on("renderChatMessage", (app, html, data) => {
  iChat.alterCard(app, html, data);
});
Hooks.on("renderChatLog", (app, html, data) => ItemArsDD.chatListeners(html));
Hooks.on("renderChatPopout", (app, html, data) => ItemArsDD.chatListeners(html));

Hooks.on('renderSidebarDirectory', function() {
  $('.sidebar-tab').each(function() {
    let list = $(this).find('.directory-list');
    if (list.length) {
      list.children().each(function() {
        if(($(this).hasClass('folder')) && !$(this).hasClass('colored-background')) {
          colorBackground($(this));
          if($(this).find('.folder')) $(this).find('.folder').each(function() {colorBackground($(this));});
        }
      });
    }
  });

  function colorBackground(el) {
    let bgColor = el.find('.folder-header').css('background-color');
    el.css('background-color', bgColor);
    el.find('.subdirectory').css('border-color', bgColor);
    el.addClass('colored-background');
    let ftColor = el.find('h3').css('color');
    el.find('h4').css('color', ftColor);
  }
});

Hooks.on('targetToken', (user, token, flag) => {
  if (user === game.user) {
    let sourceToken = canvas.tokens.controlled[0];
    if (sourceToken) sourceToken.actor.sheet.render(false);
  }
});

Hooks.on('updateToken', (tokenDocument, data, options, userId) => {
  const token = TokenArsDD.tokenDocumentToToken(tokenDocument.id);
  if ( foundry.utils.getProperty(data,"flags.aura")) token.drawAura(); 

  setTimeout(function(){
    if ( userId === game.user.id && (foundry.utils.hasProperty(data,"x") || foundry.utils.hasProperty(data,"y"))) {
      TokenArsDD.tokenCheckAura();
      const updateData ={flags:{movement: token.document.flags.position.movement}};
      //updateData["flags.movement"] = token.document.flags.position.movement;
      token.actor.update(updateData);
    }
    let controlledToken = canvas.tokens.controlled[0];
    if (controlledToken) controlledToken.actor.sheet.render(false);
  },500);
});

Hooks.on("updateScene", (sceneDocument, data, options, userId) => {
  if (data.darkness != undefined && game.user.isGM) {
    sceneDocument.tokens.forEach(token => {
      token._actor.setSenses();
    })
  }
});

Hooks.on("sightRefresh", (canvasVis) => {
  canvas.tokens.placeables.forEach(token => {
    token._refreshBorder();
  })
});

Hooks.on("getSceneControlButtons", (controls) => {
    const bar = controls.find(c => c.name === "token");
    bar.tools.push({
        name: "RM Tool",
        title: "Reinitialisation Mouvement",
        icon: "fas fa-rotate-left",
        onClick: () => {
          for (const token of canvas.tokens.controlled) {
            token.resetPosition();
            for (const effect of token.actor.effects) {
              if (effect.label === game.i18n.localize(CONFIG.ARSDD.activationTypes["movement"])) effect.deleteOnExpiration();
            }
          }
          if (game.modules.get("drag-ruler")?.active) dragRuler.resetMovementHistory(game.combat, game.combat.current.combatantId);
        },
        button: true
    });
});

/*refresh door pour chaque token : secret, trapped => 
for (door of canvas.controls.doors) {
  if (door.wall.document.flags.door.trapped === CONFIG.ARSDD.WALL_DOOR_TRAPPED.TRAPPED || this.wall.document.door === CONST.WALL_DOOR_TYPES.SECRET ) {
    //test perception
    let perception = false;
    if (perception) {
    if (door.wall.document.flags.door.trapped === CONFIG.ARSDD.WALL_DOOR_TRAPPED.TRAPPED ) door.icon.tint =  0xff0000
    else door.icon.tint = 0x888888
    }

  }
} 
*/
