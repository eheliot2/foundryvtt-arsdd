/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Shared Partials
    "systems/arsdd/templates/effect/active-effects.html",

    // Actor Sheet Partials
    "systems/arsdd/templates/actors/actor-traits.html",
    "systems/arsdd/templates/actors/actor-inventory.html",
    "systems/arsdd/templates/actors/actor-features.html",
    "systems/arsdd/templates/actors/actor-spellbook.html",
    "systems/arsdd/templates/actors/actor-npc.html",

    // Item Sheet Partials
    "systems/arsdd/templates/items/item-action.html",
    "systems/arsdd/templates/items/item-description.html",
    "systems/arsdd/templates/items/item-description-physical.html",
    "systems/arsdd/templates/items/item-header.html",
    "systems/arsdd/templates/items/item-damage.html",

    "systems/arsdd/templates/chat/instructions.hbs"
  ]);
};
