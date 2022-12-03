
// Namespace Configuration Values
export const ARSDD = {};

// ASCII Artwork
ARSDD.ASCII = `ARSDD6`;

//ability
ARSDD.abilities = {
  "str": "ARSDD.AbilityStr",
  "dex": "ARSDD.AbilityDex",
  "con": "ARSDD.AbilityCon",
  "int": "ARSDD.AbilityInt",
  "wis": "ARSDD.AbilityWis",
  "cha": "ARSDD.AbilityCha"
};

ARSDD.abilityAbbreviations = {
  "str": "ARSDD.AbilityStrAbbr",
  "dex": "ARSDD.AbilityDexAbbr",
  "con": "ARSDD.AbilityConAbbr",
  "int": "ARSDD.AbilityIntAbbr",
  "wis": "ARSDD.AbilityWisAbbr",
  "cha": "ARSDD.AbilityChaAbbr"
};

// Creature Sizes
ARSDD.tokenSizes = {
  "-4": 1,
  "-3": 1,
  "-2": 1,
  "-1": 1,  
  "0": 1,
  "1": 1,
  "2": 2,
  "3": 2,
  "4": 3,
  "5": 3,
  "6": 4,
  "7": 4,
  "8": 5,
  "9": 5,
  "10": 6
};

//statusSocial
ARSDD.socialStatus = {
  "-1" : "Pauvre",
  "0" : "Normal",
  "1" : "Bourgeois",
  "2" : "Noble"
}

//skills
ARSDD.skills = {
  "ath": "ARSDD.SkillAth",
  "ste": "ARSDD.SkillSte",
  "mel": "ARSDD.SkillMel",
  "prc": "ARSDD.SkillPrc",
  "sho": "ARSDD.SkillSho",
  "dea": "ARSDD.SkillDea",
  "sur": "ARSDD.SkillSur",
  "inv": "ARSDD.SkillInv",
  "med": "ARSDD.SkillMed",
  "cra": "ARSDD.SkillCra",
  "wri": "ARSDD.SkillWri",
  "arl": "ARSDD.SkillArl",
  "art": "ARSDD.SkillArt",
  "hun": "ARSDD.SkillHun",
  "ani": "ARSDD.SkillAni",
  "prf": "ARSDD.SkillPrf",
  "slt": "ARSDD.SkillSlt",
  "nav": "ARSDD.SkillNav",
  "taw": "ARSDD.SkillTaw",
  "arc": "ARSDD.SkillArc",
  "eru": "ARSDD.SkillEru",
  "for": "ARSDD.SkillFor",
  "nat": "ARSDD.SkillNat",
  "dis": "ARSDD.SkillDis",
  "ins": "ARSDD.SkillIns",
  "per": "ARSDD.SkillPer",
  "dec": "ARSDD.SkillDec",
  "cre": "ARSDD.SkillCre",
  "int": "ARSDD.SkillInt",
  "mut": "ARSDD.SkillMut",
  "ped": "ARSDD.SkillPed",
  "reg": "ARSDD.SkillReg",
  "sum": "ARSDD.SkillSum",
  "aqu": "ARSDD.SkillAqu",
  "aur": "ARSDD.SkillAur",
  "ign": "ARSDD.SkillIgn",
  "ter": "ARSDD.SkillTer",
  "lum": "ARSDD.SkillLum",
  "ima": "ARSDD.SkillIma",
  "noc": "ARSDD.SkillNoc",
  "cor": "ARSDD.SkillCor",
  "fat": "ARSDD.SkillFat",
  "men": "ARSDD.SkillMen",
  "spi": "ARSDD.SkillSpi",
  "vim": "ARSDD.SkillVim",
  "ats": "ARSDD.SkillAts",
  "bos": "ARSDD.SkillBos",
  "chf": "ARSDD.SkillChf",
  "chd": "ARSDD.SkillChd",
  "itm": "ARSDD.SkillItm",
  "lg1": "ARSDD.SkillLg1",
  "lg2": "ARSDD.SkillLg2",
  "lg3": "ARSDD.SkillLg3",
  "lg4": "ARSDD.SkillLg4",
  "er1": "ARSDD.SkillEr1",
  "er2": "ARSDD.SkillEr2",
  "er3": "ARSDD.SkillEr3",
  "er4": "ARSDD.SkillEr4",
  "re1": "ARSDD.SkillRe1",
  "re2": "ARSDD.SkillRe2",
  "re3": "ARSDD.SkillRe3",
  "re4": "ARSDD.SkillRe4",
  "re5": "ARSDD.SkillRe5",
  "re6": "ARSDD.SkillRe6",
  "re7": "ARSDD.SkillRe7",
  "re8": "ARSDD.SkillRe8"
};

//actions parameters
ARSDD.activationTypes = {
  "none": "ARSDD.None",
  "action": "ARSDD.Action",
  "bonus": "ARSDD.BonusAction",
  "reaction": "ARSDD.Reaction",
  "attack": "ARSDD.Attack",
  "movement": "ARSDD.Movement",
  "minute": "ARSDD.TimeMinute1",
  "hour": "ARSDD.TimeHour8",
  "rest" : "ARSDD.Rest",
  "special": "ARSDD.Special",
  "legendary": "ARSDD.LegAct",
  "lair": "ARSDD.LairAct"
};

ARSDD.itemActionTypes = {
  "skill": "ARSDD.ActionSkill",
  "melee": "ARSDD.ActionMelee",
  "shoot": "ARSDD.ActionShoot",
  "str": "ARSDD.ActionStr",
  "dex": "ARSDD.ActionDex",
  "con": "ARSDD.ActionCon",
  "wis": "ARSDD.ActionWis",
  "int": "ARSDD.ActionInt",
  "cha": "ARSDD.ActionCha",
  "other": "ARSDD.ActionOther"
};

ARSDD.itemCapacityTypes = {
  "items": "ARSDD.ItemContainerCapacityItems",
  "weight": "ARSDD.ItemContainerCapacityWeight"
};

ARSDD.limitedUsePeriods = {
  "sr": "ARSDD.ShortRest",
  "lr": "ARSDD.LongRest",
  "r56": "ARSDD.FeatureRechargeR56",
  "r6": "ARSDD.FeatureRechargeR6"
};

/* -------------------------------------------- */
// Damage Types
ARSDD.damageTypes = {
  "physical": "ARSDD.DamagePhysical",
  "radiant": "ARSDD.DamageRadiant",
  "fire": "ARSDD.DamageFire",
  "lightning": "ARSDD.DamageLightning",
  "thunder": "ARSDD.DamageThunder",
  "acid": "ARSDD.DamageAcid",
  "cold": "ARSDD.DamageCold",
  "necrotic": "ARSDD.DamageNecrotic",
  "poison": "ARSDD.DamagePoison",
  "force": "ARSDD.DamageForce",
  "psychic": "ARSDD.DamagePsychic"
};

ARSDD.damageTypesIcon = {
  "physical": "systems/arsdd/icons/svg/sword-black.svg",
  "radiant": "systems/arsdd/icons/svg/sun-black.svg",
  "fire": "systems/arsdd/icons/svg/fire-black.svg",
  "lightning": "systems/arsdd/icons/svg/lightning-black.svg",
  "thunder": "systems/arsdd/icons/svg/rolling-energy.svg",
  "acid": "systems/arsdd/icons/svg/acid-black.svg",
  "cold": "systems/arsdd/icons/svg/frozen-black.svg",
  "necrotic": "systems/arsdd/icons/svg/skull-black.svg",
  "poison": "systems/arsdd/icons/svg/poison-black.svg",
  "force": "systems/arsdd/icons/svg/explosion-black.svg",
  "psychic": "systems/arsdd/icons/svg/stoned-black.svg"
};

// Healing Types
ARSDD.healingTypes = {
  "healing": "ARSDD.Healing",
  "temphp": "ARSDD.HPTemp",
  "maxhp": "ARSDD.HPMax",
  "tempmaxhp": "ARSDD.HPTempMaxMax",
  "healingmp": "ARSDD.HealingMP",
  "tempmp": "ARSDD.MPTemp",
  "maxmp": "ARSDD.MPMax",
  "tempmaxmp": "ARSDD.MPTempMaxMax",
};


ARSDD.healingTypesIcon = {
  "healing": "systems/arsdd/icons/svg/heal-black.svg",
  "temphp": "systems/arsdd/icons/svg/heal-blue.svg",
  "healingmp": "systems/arsdd/icons/svg/heal-green.svg"
};

//-------------------------------------------
//movement, range, target
ARSDD.movementTypes = {
  "burrow": "ARSDD.MovementBurrow",
  "climb": "ARSDD.MovementClimb",
  "fly": "ARSDD.MovementFly",
  "swim": "ARSDD.MovementSwim",
  "walk": "ARSDD.MovementWalk",
  "tactical": "ARSDD.MovementTactical",
  "travel":"ARSDD.MovementTravel"
}

ARSDD.distanceUnits = {
  "none": "ARSDD.None",
  "self": "ARSDD.DistSelf",
  "touch": "ARSDD.DistTouch",
  "case": "ARSDD.DistCase",
  "battle": "ARSDD.DistBattle",
  "world": "ARSDD.DistWorld",
  "spec": "ARSDD.Special"
};

ARSDD.targetTypes = {
  "none": "ARSDD.None",
  "self": "ARSDD.TargetSelf",
  "creature": "ARSDD.TargetCreature",
  "ally": "ARSDD.TargetAlly",
  "enemy": "ARSDD.TargetEnemy",
  "object": "ARSDD.TargetObject",
  "sphere": "ARSDD.TargetSphere",
  "cone": "ARSDD.TargetCone",
  "cube": "ARSDD.TargetCube",
  "line": "ARSDD.TargetLine",
  "wall": "ARSDD.TargetWall"
};

ARSDD.areaTargetTypes = {
  cone: "cone",
  cube: "rect",
  line: "ray",
  sphere: "circle",
  wall: "ray",
  ally: "circle",
  enemy: "circle"
};

ARSDD.senses = {
  "brightvision": "ARSDD.SenseBrightvision",
  "dimvision": "ARSDD.SenseDimvision",
  "darkvision": "ARSDD.SenseDarkvision",
  "hearingsight": "ARSDD.SenseHearing",
  "touchsight": "ARSDD.SenseTouch",
  "smellingsight": "ARSDD.SenseSmelling",
  "truesight": "ARSDD.SenseTruesight",
  "truesightlevel":"ARSDD.SenseTruesightLevel"
};

ARSDD.senses2 = {
  "darkvision": "ARSDD.SenseDarkvision",
  "hearingsight": "ARSDD.SenseHearing",
  "touchsight": "ARSDD.SenseTouch",
  "smellingsight": "ARSDD.SenseSmelling",
  "truesight": "ARSDD.SenseTruesight",
  "truesightlevel":"ARSDD.SenseTruesightLevel"
};

//time
ARSDD.timePeriods = {
  "inst": "ARSDD.TimeInst",
  "turn": "ARSDD.TimeTurn",
  "round": "ARSDD.TimeRound",
  "minute": "ARSDD.TimeMinute",
  "hour": "ARSDD.TimeHour",
  "day": "ARSDD.TimeDay",
  "month": "ARSDD.TimeMonth",
  "year": "ARSDD.TimeYear",
  "perm": "ARSDD.TimePerm",
  "spec": "ARSDD.Special"
};

ARSDD.duration = {
  "inst": "ARSDD.TimeInst",
  "round": "ARSDD.TimeRound",
  "minute10": "ARSDD.TimeMinute10",
  "hour1": "ARSDD.TimeHour1",
  "hour8": "ARSDD.TimeHour8",
  "day1": "ARSDD.TimeDay1",
  "month1": "ARSDD.TimeMonth1",
  "year1": "ARSDD.TimeYear1",
  "perm": "ARSDD.TimePerm",
  "spec": "ARSDD.Special"
};

ARSDD.durationTime = {
  "round":6,
  "minute1":60,
  "minute10": 600,
  "hour1": 3600,
  "hour4": 14400,
  "hour8": 28800,
  "day1": 86400,
  "week1": 604800,
  "month1": 2419200,
  "year1": 16934400
};

ARSDD.periodName = {
  1:"ARSDD.periodNameTer",
  2:"ARSDD.periodNameLum",
  3:"ARSDD.periodNameIgn",
  4:"ARSDD.periodNameAur",
  5:"ARSDD.periodNameAqu",
  6:"ARSDD.periodNameNoc",
  7:"ARSDD.periodNameIma"
}

ARSDD.periodIcon = {
  0:"mountain",
  1:"sun",
  2:"fire",
  3:"wind",
  4:"water",
  5:"star",
  6:"moon"
};

ARSDD.activityTravelIcon = {
  "restTravel":"campfire",
  "secundaryTravel":"eye",
  "principalTravel":"fa-person-hiking"
}
ARSDD.activityTravelName = {
  "restTravel":"Repos",
  "secundaryTravel":"Activités secondaires",
  "principalTravel":"Voyage/Travail"
}

ARSDD.effectDuration = {
  600: "ARSDD.TimeMinute10",
  3600: "ARSDD.TimeHour1",
  28800: "ARSDD.TimeHour8",
  86400: "ARSDD.TimeDay1",
  2419200: "ARSDD.TimeMonth1",
  16934400: "ARSDD.TimeYear1"
};

//-----------------------------------------------------------------
//spell
ARSDD.spellSubtypes = {
  "spell": "ARSDD.SpellSpell",
  "maneuver": "ARSDD.SpellManeuver",
  "aura": "ARSDD.SpellAura",
  "channel": "ARSDD.SpellCanalisation",
  "shout": "ARSDD.SpellShout",
  "trap": "ARSDD.SpellTrap",
  "stance": "ARSDD.SpellStance",
  "ritual": "ARSDD.SpellRitual",
  "craft": "ARSDD.SpellCraft",
  "power": "ARSDD.SpellPower",
};

ARSDD.spellProperties = {
  "half" : "ARSDD.SpellPropertiesHalf",
  "nocritic" : "ARSDD.SpellPropertiesNocritic",
  "tier" : "ARSDD.SpellPropertiesTier",
  "wall": "ARSDD.SpellPropertiesWall"
};

// Spell Components
ARSDD.spellComponents = {
  "V": "ARSDD.ComponentVerbal",
  "S": "ARSDD.ComponentSomatic"
};

//----------------------------------------------------------------
//active effect
ARSDD.effectPropertiesLabel = {
  "blinded": "ARSDD.EffectPropertiesBlinded",
  "charmed": "ARSDD.EffectPropertiesCharmed",
  "deafened": "ARSDD.EffectPropertiesDeafened",
  "diseased": "ARSDD.EffectPropertiesDiseased",
  "frightened": "ARSDD.EffectPropertiesFrightened",
  "grappled": "ARSDD.EffectPropertiesGrappled",
  "incapacitated": "ARSDD.EffectPropertiesIncapacitated",
  "invisible": "ARSDD.EffectPropertiesInvisible",
  "paralyzed": "ARSDD.EffectPropertiesParalyzed",
  "petrified": "ARSDD.EffectPropertiesPetrified",
  "poisoned": "ARSDD.EffectPropertiesPoisoned",
  "prone": "ARSDD.EffectPropertiesProne",
  "restrained": "ARSDD.EffectPropertiesRestrained",
  "stunned": "ARSDD.EffectPropertiesStunned",
  "unconscious": "ARSDD.EffectPropertiesUnconscious",
  "clumsy": "ARSDD.EffectPropertiesClumsy",
  "marked": "ARSDD.EffectPropertiesMarked",
  "pained": "ARSDD.EffectPropertiesPained",
  "slowed": "ARSDD.EffectPropertiesSlowed",
  "broken": "ARSDD.EffectPropertiesBroken",
  "stopped": "ARSDD.EffectPropertiesStopped",  
  "weaken": "ARSDD.EffectPropertiesWeaken",
  "mad": "ARSDD.EffectPropertiesMad",
  "drugged": "ARSDD.EffectPropertiesDrugged",
  "slept": "ARSDD.EffectPropertiesSlept",
  "infected": "ARSDD.EffectPropertiesInfected",
  "withdrawal": "ARSDD.EffectPropertiesWithdrawal",
  "cursed": "ARSDD.EffectPropertiesCursed",
  "adv": "ARSDD.EffectPropertiesAdv",
  "dis": "ARSDD.EffectPropertiesDis",
  "exhaustion": "ARSDD.EffectPropertiesExhaustion"
};

ARSDD.effectProperties = {
  "system.abilities.str.value" : "Carac - for",
  "system.abilities.dex.value" : "Carac - dex",
  "system.abilities.con.value" : "Carac - con",
  "system.abilities.int.value" : "Carac - int",
  "system.abilities.wis.value" : "carac - sag",
  "system.abilities.cha.value" : "Carac - cha",
  "system.attributes.size" : "Carac - tai",
  "system.attributes.socialStatus" : "Carac - statut social",
  "system.attributes.hp.bonus": "Carac - PV",
  "system.attributes.hp.tempmax": "Carac - PV max",
  "system.attributes.hp.regen": "Carac - PV regen",
  "system.attributes.mp.bonus": "Carac - PM",
  "system.attributes.mp.tempmax": "Carac - PM max",
  "system.attributes.mp.regen": "Carac - PM regen",
  "system.attributes.init.bonus": "Combat - init",
  "system.effectAttributes.attack.melee": "Combat - att melee",
  "system.effectAttributes.defense.melee": "Combat - def melee",
  "system.effectAttributes.attack.shoot": "Combat - att tir",
  "system.effectAttributes.defense.shoot": "Combat - def tir",
  "system.effectAttributes.attack.dex": "Combat - att dex",
  "system.effectAttributes.defense.dex": "Combat - def dex",
  "system.effectAttributes.attack.con": "Combat - att con",
  "system.effectAttributes.defense.con": "Combat - def con",  
  "system.effectAttributes.attack.sag": "Combat - att sag",
  "system.effectAttributes.defense.sag": "Combat - def sag",
  "system.effectAttributes.attack.for": "Combat - att for",
  "system.effectAttributes.defense.for": "Combat - def for",
  "system.effectAttributes.attack.int": "Combat - att int",
  "system.effectAttributes.defense.int": "Combat - def int",
  "system.effectAttributes.attack.cha": "Combat - att cha",
  "system.effectAttributes.defense.cha": "Combat - def cha",
  "system.effectAttributes.other.healing": "Combat - soin",  
  "system.effectAttributes.other.concentrationBonus": "Combat - concentration",
  "system.effectAttributes.damage.physical": "Dégâts physique",
  "system.effectAttributes.damage.radiant": "Dégâts radiant",
  "system.effectAttributes.damage.fire": "Dégâts feu",
  "system.effectAttributes.damage.lightning": "Dégâts électrique",
  "system.effectAttributes.damage.thunder": "Dégâts tonnerre",
  "system.effectAttributes.damage.acid": "Dégâts acide",
  "system.effectAttributes.damage.cold": "Dégâts froid",
  "system.effectAttributes.damage.necrotic": "Dégâts nécrotique",
  "system.effectAttributes.damage.poison": "Dégâts poison",
  "system.effectAttributes.damage.force": "Dégâts force",
  "system.effectAttributes.damage.psychic": "Dégâts psychique",
  "system.effectAttributes.armor.physical": "Armure physique",
  "system.effectAttributes.armor.radiant": "Armure radiant",
  "system.effectAttributes.armor.fire": "Armure feu",
  "system.effectAttributes.armor.lightning": "Armure électrique",
  "system.effectAttributes.armor.thunder": "Armure tonnerre",
  "system.effectAttributes.armor.acid": "Armure acide",
  "system.effectAttributes.armor.cold": "Armure froid",
  "system.effectAttributes.armor.necrotic": "Armure nécrotique",
  "system.effectAttributes.armor.poison": "Armure poison",
  "system.effectAttributes.armor.force": "Armure force",
  "system.effectAttributes.armor.psychic": "Armure psychique",
  "system.effectAttributes.pierceArmor.physical": "Transpercer armure physique",
  "system.effectAttributes.pierceArmor.radiant": "Transpercer armure radiant",
  "system.effectAttributes.pierceArmor.fire": "Transpercer armure feu",
  "system.effectAttributes.pierceArmor.lightning": "Transpercer armure électrique",
  "system.effectAttributes.pierceArmor.thunder": "Transpercer armure tonnerre",
  "system.effectAttributes.pierceArmor.acid": "Transpercer armure acide",
  "system.effectAttributes.pierceArmor.cold": "Transpercer armure froid",
  "system.effectAttributes.pierceArmor.necrotic": "Transpercer armure nécrotique",
  "system.effectAttributes.pierceArmor.poison": "Transpercer armure poison",
  "system.effectAttributes.pierceArmor.force": "Transpercer armure force",
  "system.effectAttributes.pierceArmor.psychic": "Transpercer armure psychique",
  "system.effectAttributes.resistance.physical": "Résistance physique",
  "system.effectAttributes.resistance.radiant": "Résistance radiant",
  "system.effectAttributes.resistance.fire": "Résistance feu",
  "system.effectAttributes.resistance.lightning": "Résistance électrique",
  "system.effectAttributes.resistance.thunder": "Résistance tonnerre",
  "system.effectAttributes.resistance.acid": "Résistance acide",
  "system.effectAttributes.resistance.cold": "Résistance froid",
  "system.effectAttributes.resistance.necrotic": "Résistance nécrotique",
  "system.effectAttributes.resistance.poison": "Résistance poison",
  "system.effectAttributes.resistance.force": "Résistance force",
  "system.effectAttributes.resistance.psychic": "Résistance psychique",
  "system.effectAttributes.pierceResistance.physical": "Transpercer résistance physique",
  "system.effectAttributes.pierceResistance.radiant": "Transpercer résistance radiant",
  "system.effectAttributes.pierceResistance.fire": "Transpercer résistance feu",
  "system.effectAttributes.pierceResistance.lightning": "Transpercer résistance électrique",
  "system.effectAttributes.pierceResistance.thunder": "Transpercer résistance tonnerre",
  "system.effectAttributes.pierceResistance.acid": "Transpercer résistance acide",
  "system.effectAttributes.pierceResistance.cold": "Transpercer résistance froid",
  "system.effectAttributes.pierceResistance.necrotic": "Transpercer résistance nécrotique",
  "system.effectAttributes.pierceResistance.poison": "Transpercer résistance poison",
  "system.effectAttributes.pierceResistance.force": "Transpercer résistance force",
  "system.effectAttributes.pierceResistance.psychic": "Transpercer résistance psychique",  
  "system.effectAttributes.immunities.physical": "Immunité physique",
  "system.effectAttributes.immunities.radiant": "Immunité radiant",
  "system.effectAttributes.immunities.fire": "Immunité feu",
  "system.effectAttributes.immunities.lightning": "Immunité électrique",
  "system.effectAttributes.immunities.thunder": "Immunité tonnerre",
  "system.effectAttributes.immunities.acid": "Immunité acide",
  "system.effectAttributes.immunities.cold": "Immunité froid",
  "system.effectAttributes.immunities.necrotic": "Immunité nécrotique",
  "system.effectAttributes.immunities.poison": "Immunité poison",
  "system.effectAttributes.immunities.force": "Immunité force",
  "system.effectAttributes.immunities.psychic": "Immunité psychique",
  "system.effectAttributes.vulnerability.physical": "Vulnerabilité physique",
  "system.effectAttributes.vulnerability.radiant": "Vulnerabilité radiant",
  "system.effectAttributes.vulnerability.fire": "Vulnerabilité feu",
  "system.effectAttributes.vulnerability.lightning": "Vulnerabilité électrique",
  "system.effectAttributes.vulnerability.thunder": "Vulnerabilité tonnerre",
  "system.effectAttributes.vulnerability.acid": "Vulnerabilité acide",
  "system.effectAttributes.vulnerability.cold": "Vulnerabilité froid",
  "system.effectAttributes.vulnerability.necrotic": "Vulnerabilité nécrotique",
  "system.effectAttributes.vulnerability.poison": "Vulnerabilité poison",
  "system.effectAttributes.vulnerability.force": "Vulnerabilité force",
  "system.effectAttributes.vulnerability.psychic": "Vulnerabilité psychique",
  "system.effectAttributes.burning.physical": "Brûlure physique",
  "system.effectAttributes.burning.radiant": "Brûlure radiant",
  "system.effectAttributes.burning.fire": "Brûlure feu",
  "system.effectAttributes.burning.lightning": "Brûlure électrique",
  "system.effectAttributes.burning.thunder": "Brûlure tonnerre",
  "system.effectAttributes.burning.acid": "Brûlure acide",
  "system.effectAttributes.burning.cold": "Brûlure froid",
  "system.effectAttributes.burning.necrotic": "Brûlure nécrotique",
  "system.effectAttributes.burning.poison": "Brûlure poison",
  "system.effectAttributes.burning.force": "Brûlure force",
  "system.effectAttributes.burning.psychic": "Brûlure psychique",
  "system.effectAttributes.status.prone": "Etat à terre",
  "system.effectAttributes.status.weaken": "Etat affaibli",
  "system.effectAttributes.status.grappled": "Etat agrippé",
  "system.effectAttributes.status.deafened": "Etat assourdi",
  "system.effectAttributes.status.adv": "Etat avantage",
  "system.effectAttributes.status.blinded": "Etat aveuglé",
  "system.effectAttributes.status.all" : "Etat - bonus général",
  "system.effectAttributes.status.hidden": "Etat caché",
  "system.effectAttributes.status.charmed": "Etat charmé",
  "system.effectAttributes.status.cover": "Etat couvert",
  "system.effectAttributes.status.drugged": "Etat drogué",
  "system.effectAttributes.status.frightened": "Etat effrayé",
  "system.effectAttributes.status.poisoned": "Etat empoisonné",
  "system.effectAttributes.status.slept": "Etat endormi",
  "system.effectAttributes.status.restrained": "Etat entravé",
  "system.effectAttributes.status.withdrawal": "Etat en manque",
  "system.effectAttributes.status.exhaustion": "Etat épuisement",
  "system.effectAttributes.status.mad": "Etat fou",
  "system.effectAttributes.status.stopped": "Etat immobile",
  "system.effectAttributes.status.incapacited": "Etat incapable d'agir",
  "system.effectAttributes.status.unconscious": "Etat inconscient",
  "system.effectAttributes.status.infected": "Etat infecté",
  "system.effectAttributes.status.invisible": "Etat invisible",
  "system.effectAttributes.status.diseased": "Etat malade",
  "system.effectAttributes.status.clumsy": "Etat maladroit",
  "system.effectAttributes.status.marked": "Etat marqué",
  "system.effectAttributes.status.cursed": "Etat maudit",
  "system.effectAttributes.status.petrified": "Etat pétrifié",
  "system.effectAttributes.status.paralyzed": "Etat paralysé",  
  "system.effectAttributes.status.slowed": "Etat ralenti",
  "system.effectAttributes.status.delay": "Etat retard",
  "system.effectAttributes.status.stunned": "Etat sonné",
  "system.effectAttributes.status.pained": "Etat souffrant",
  "system.attributes.movement.walk": "Vitesse - marche",  
  "system.attributes.movement.swim": "Vitesse - nage",
  "system.attributes.movement.climb": "Vitesse - escalade",
  "system.attributes.movement.fly": "Vitesse - vol",
  "system.attributes.resources.follower.bonus": "Ressource - suivant max",
  "system.skills.ath.bonus": "Compétence - athlétisme",  
  "system.skills.ste.bonus": "Compétence - discrétion",
  "system.skills.mel.bonus": "Compétence - mêlée",
  "system.skills.prc.bonus": "Compétence - perception ",
  "system.skills.sho.bonus": "Compétence - tir",
  "system.skills.dea.bonus": "Compétence - décrépitude",
  "system.skills.sur.bonus": "Compétence - survie",
  "system.skills.inv.bonus": "Compétence - investigation",
  "system.skills.med.bonus": "Compétence - apothicaire",
  "system.skills.cra.bonus": "Compétence - artisanats",
  "system.skills.wri.bonus": "Compétence - arts graphiques",
  "system.skills.arl.bonus": "Compétence - arts libéraux",
  "system.skills.art.bonus": "Compétence - grand art",
  "system.skills.hun.bonus": "Compétence - chasse",
  "system.skills.ani.bonus": "Compétence - dressage",
  "system.skills.prf.bonus": "Compétence - arts scéniques",
  "system.skills.slt.bonus": "Compétence - doigts agiles",
  "system.skills.nav.bonus": "Compétence - navigation",
  "system.skills.taw.bonus": "Compétence - tawa",
  "system.skills.arc.bonus": "Compétence - arcanes",
  "system.skills.eru.bonus": "Compétence - culture générale",
  "system.skills.for.bonus": "Compétence - interdit",
  "system.skills.nat.bonus": "Compétence - nature",
  "system.skills.dis.bonus": "Compétence - discipline",
  "system.skills.ins.bonus": "Compétence - intuition",
  "system.skills.per.bonus": "Compétence - persuasion",
  "system.skills.dec.bonus": "Compétence - tromperie",
  "system.skills.cre.bonus": "Compétence - creo",
  "system.skills.int.bonus": "Compétence - intellego",
  "system.skills.mut.bonus": "Compétence - muto",
  "system.skills.ped.bonus": "Compétence - perdo",
  "system.skills.reg.bonus": "Compétence - rego",
  "system.skills.sum.bonus": "Compétence - summoneo",
  "system.skills.aqu.bonus": "Compétence - aquam",
  "system.skills.aur.bonus": "Compétence - auram",
  "system.skills.ign.bonus": "Compétence - ignem",
  "system.skills.ter.bonus": "Compétence - terram",
  "system.skills.lum.bonus": "Compétence - lumem",
  "system.skills.ima.bonus": "Compétence - imagonem",
  "system.skills.noc.bonus": "Compétence - noctem",
  "system.skills.cor.bonus": "Compétence - corporem",
  "system.skills.fat.bonus": "Compétence - fatum",
  "system.skills.men.bonus": "Compétence - mentem",
  "system.skills.spi.bonus": "Compétence - spiritum",
  "system.skills.vim.bonus": "Compétence - vim",
  "system.skills.ats.bonus": "Compétence - attaque sournoise",
  "system.skills.chf.bonus": "Compétence - change-forme",
  "system.skills.chd.bonus": "Compétence - chatiment divin",
  "system.skills.itm.bonus": "Compétence - intimidation",
  "system.skills.lg1.bonus": "Compétence - langue1",
  "system.skills.lg2.bonus": "Compétence - langue2",
  "system.skills.lg3.bonus": "Compétence - langue3",
  "system.skills.lg4.bonus": "Compétence - langue4",
  "system.skills.er1.bonus": "Compétence - érudition1",
  "system.skills.er2.bonus": "Compétence - érudition2",
  "system.skills.er3.bonus": "Compétence - érudition3",
  "system.skills.er4.bonus": "Compétence - érudition4",
  "system.skills.re1.bonus": "Compétence - renom1",
  "system.skills.re2.bonus": "Compétence - renom2",
  "system.skills.re3.bonus": "Compétence - renom3",
  "system.skills.re4.bonus": "Compétence - renom4",
  "system.skills.re5.bonus": "Compétence - renom5",
  "system.skills.re6.bonus": "Compétence - renom6",
  "system.skills.re7.bonus": "Compétence - renom7",
  "system.skills.re8.bonus": "Compétence - renom8"
}

ARSDD.effectTrait = {
  "trait_powerfulBuild":"+30% capacité de charge",
  "trait_twiceConcentration":"concentration sur 2 capa",
  "trait_brutalCritical": "ajotue 1d en cas de critique",
  "trait_reroll12" : "relance les 1 et 2 sur dé d'effet",
  "trait_lightN" : "cree de la lumiere de rayon N",
  "trait_longRange" : "annule le malus de longue portée",
  "trait_pointBlank" : "annule le malus d'adjacent"
}

ARSDD.effectConditions = {
  "marked": "ARSDD.EffectPropertiesMarked",
  "cursed": "ARSDD.EffectPropertiesCursed",
  "wounded": "ARSDD.EffectPropertiesWounded",
  "bloodied": "ARSDD.EffectPropertiesBloodied",
  "critical":  "ARSDD.EffectPropertiesCritical",
};

ARSDD.encumbranceIcon = {
  0:"systems/arsdd/icons/svg/weight-grey.svg",
  1:"systems/arsdd/icons/svg/weight-black.svg",
  2:"systems/arsdd/icons/svg/weight-blue.svg",
  3:"systems/arsdd/icons/svg/weight-purple.svg",
  4:"systems/arsdd/icons/svg/weight-red.svg"
};

ARSDD.exhaustionIcon = {
  0:"systems/arsdd/icons/svg/weight-grey.svg",
  1:"systems/arsdd/icons/svg/weight-black.svg",
  2:"systems/arsdd/icons/svg/weight-blue.svg",
  3:"systems/arsdd/icons/svg/weight-purple.svg",
  4:"systems/arsdd/icons/svg/weight-red.svg"
};

//*************************************************************************** */
//equipement

ARSDD.equipmentSubtypes = {
  "clothing": "ARSDD.EquipmentClothing",
  "ring": "ARSDD.EquipmentRing",
  "amulet": "ARSDD.EquipmentAmulet",
  "belt": "ARSDD.EquipmentBelt",
  "boots": "ARSDD.EquipmentBoots",
  "gloves": "ARSDD.EquipmentGloves",
  "cloak": "ARSDD.EquipmentCloak",
  "helmet": "ARSDD.EquipmentHelmet"
};

ARSDD.consumableSubtypes = {
  "potion": "ARSDD.ConsumablePotion",
  "poison": "ARSDD.ConsumablePoison",
  "food": "ARSDD.ConsumableFood",
  "scroll": "ARSDD.ConsumableScroll"
};

ARSDD.attune = {
  0: "systems/arsdd/icons/svg/stars-stack-grey.svg",
  1: "systems/arsdd/icons/svg/stars-stack-black1.svg",
  2: "systems/arsdd/icons/svg/stars-stack-black2.svg",
  3: "systems/arsdd/icons/svg/stars-stack-black3.svg",
  4: "systems/arsdd/icons/svg/star-formation-black4.svg",
  5: "systems/arsdd/icons/svg/star-formation-black5.svg",  
  6: "systems/arsdd/icons/svg/star-formation-black6.svg",
  "ano": "systems/arsdd/icons/svg/stars-stack-red.svg"
};

//armor
ARSDD.armorSubtypes = {
  "noa": "ARSDD.ArmorNoa",
  "nat": "ARSDD.ArmorNat",
  "lig": "ARSDD.ArmorLight",
  "int": "ARSDD.ArmorIntermediare",
  "hea": "ARSDD.ArmorHeavy",
  "ano": "ARSDD.Ano"
};

ARSDD.armorSubtypesIcon = {
  "noa": "systems/arsdd/icons/svg/robe-black.svg",
  "nat": "systems/arsdd/icons/svg/stegosaurus-scales-black.svg",
  "lig": "systems/arsdd/icons/svg/leather-armor-black.svg",
  "int": "systems/arsdd/icons/svg/plastron-black.svg",
  "hea": "systems/arsdd/icons/svg/breastplate-black.svg",
  "ano": "systems/arsdd/icons/svg/breastplate-red.svg"
};

//weapons
ARSDD.weaponSubtypes = {
  "melee": "ARSDD.WeaponMelee",
  "sword": "ARSDD.WeaponSword",
  "axe": "ARSDD.WeaponAxe",
  "mace": "ARSDD.WeaponMace",
  "spear": "ARSDD.WeaponSpear",
  "shield": "ARSDD.WeaponShield",
  "shoot": "ARSDD.WeaponShoot",
  "arc": "ARSDD.WeaponArc",
  "cross": "ARSDD.WeaponCrossbow",
  "magic": "ARSDD.WeaponMagic",
  "siege": "ARSDD.WeaponSiege"
};

ARSDD.weaponHands = {
  "zero": "ARSDD.WeaponHandsZero",
  "one": "ARSDD.WeaponHandsOne",
  "two": "ARSDD.WeaponHandsTwo",
  "hea": "ARSDD.WeaponHandsHea",
  "ver": "ARSDD.WeaponHandsVer",
  "ano": "ARSDD.Ano"
};

ARSDD.weaponHandsIcon = {
  "zero": "systems/arsdd/icons/svg/gloves-grey.svg",
  "one": "systems/arsdd/icons/svg/gloves1-black.svg",
  "two": "systems/arsdd/icons/svg/gloves-blueblack.svg",
  "hea": "systems/arsdd/icons/svg/gloves-black.svg",
  "ver": "systems/arsdd/icons/svg/gloves1-blue.svg",
  "ano": "systems/arsdd/icons/svg/gloves-red.svg"
};

ARSDD.weaponProperties = {
  "fin": "ARSDD.WeaponPropertiesFin",
  "two": "ARSDD.WeaponPropertiesTwo",
  "lgt": "ARSDD.WeaponPropertiesLgt",
  "ver": "ARSDD.WeaponPropertiesVer",
  "thr": "ARSDD.WeaponPropertiesThr"
};

//feat
ARSDD.featFrequency = {
  0: "ARSDD.FeatFrequencyNo",
  1: "ARSDD.FeatFrequencyOnce",
  2: "ARSDD.FeatFrequencyThree",
  3: "ARSDD.FeatFrequencyTier",
  4: "ARSDD.FeatFrequencyYes"
};

ARSDD.featValue = {
  "3": "ARSDD.FeatValueVirtueMajor",
  "1": "ARSDD.FeatValueVirtueMinor",
  "0": "ARSDD.FeatValueVirtueFree",
  "-1": "ARSDD.FeatValueFlawMinor",
  "-3": "ARSDD.FeatValueFlawMajor"
};

//***************************************************************** */
ARSDD.groupRaces = {
  "human":"ARSDD.RaceHuman",
  "humanoid":"ARSDD.RaceHumanoid",
  "fiend":"ARSDD.RaceFiend",
  "celestial":"ARSDD.RaceCelestial",
  "fey":"ARSDD.RaceFey",
  "beast":"ARSDD.RaceBeast",
  "plant":"ARSDD.RacePlant",
  "ooze":"ARSDD.RaceOoze",
  "elemental":"ARSDD.RaceElemental",
  "dragon":"ARSDD.RaceDragon",
  "giant":"ARSDD.RaceGiant",
  "monstrosity":"ARSDD.RaceMonstrosity",
  "undead":"ARSDD.RaceUndead",
  "construct":"ARSDD.RaceConstruct",
  "aberration":"ARSDD.RaceAberration",
  "shapechnager":"ARSDD.RaceShapechnnager"
}

// Configure Optional Character Flags
ARSDD.characterFlags = {
};

//scene
ARSDD.LIGHT_SCENE = {
  "DIM":0.5,
  "DARK":0.8
}

//****************************************** */
ARSDD.travelRoles = {
  "guide": "ARSDD.travelRolesGuide",
  "scout": "ARSDD.travelRolesScout",
  "cook": "ARSDD.travelRolesCook",
  "hunt": "ARSDD.travelRolesHunt",
  "explorer": "ARSDD.travelRolesExplorer",
  "cartographer": "ARSDD.travelRolesCartographer",
};

ARSDD.doorSoundDefault = {
  "close" : "systems/arsdd/sounds/DoorCloseSound.wav",
  "level" :  0.8,
  "open" : "systems/arsdd/sounds/DoorOpenSound.wav",
  "lock" : "systems/arsdd/sounds/DoorLockSound.wav",
  "unlock" : "systems/arsdd/sounds/DoorUnlockSound.wav",
  "locked": "sounds/lock.wav"
};

ARSDD.WALL_DOOR_TRAPPED = {
  "NONE" : 0,
  "TRAPPED" : 1,
  "DISARMED" : 2,
  "TRIGGED" : 3
};

ARSDD.WALL_DOOR_TRAPPED = {
  "NONE" : 0,
  "TRAPPED" : 1,
  "DISARMED" : 2,
  "TRIGGED" : 3
};



