export class WallArsDD extends Wall {
  createDoorControl() {
    if ((this.document.door === CONST.WALL_DOOR_TYPES.SECRET) && !game.user.isGM) return null;
    this.doorControl = canvas.controls.doors.addChild(new DoorControlArsDD(this));
    this.doorControl.draw();
    return this.doorControl;
  }
}

export class WallDocumentArsDD extends WallDocument  {
  async _preUpdate(updateData, options, user) {
    if((this.door === CONST.WALL_DOOR_TYPES.DOOR || this.door === CONST.WALL_DOOR_TYPES.SECRET) && updateData.ds !== undefined ) { 

      const soundDefault = CONFIG.ARSDD.doorSoundDefault;
      let doorData = this.flags.door?.sound ? this.flags.door?.sound : soundDefault;
      const states = CONST.WALL_DOOR_STATES;
      let path = doorData.locked;   
      if(this.ds === states.LOCKED) path = doorData.unlock;
      else if(updateData.ds === states.CLOSED) path = doorData.close;
      else if(updateData.ds === states.OPEN) path = doorData.open;
      else if(updateData.ds === states.LOCKED) path = doorData.lock;
      if (options.stealth === undefined || !options.stealth) AudioHelper.play({src: path, volume: doorData.level, autoplay: true, loop: false}, true); 

      if (this.flags.group) {
        for( const door of canvas.scene.walls) {
          const doorDoc = door.document
          if ((doorDoc.door === CONST.WALL_DOOR_TYPES.DOOR || doorDoc.door === CONST.WALL_DOOR_TYPES.SECRET) && doorDoc.flags.group === this.flags.group) {
            const updateDoorGroup = {};
            if(this.ds !== states.LOCKED && doorDoc.ds !== states.LOCKED && updateData.ds !== states.LOCKED ) {
              if(updateDoorGroup.ds === states.CLOSED) updateDoorGroup.ds = states.OPEN;
              else updateDoorGroup.ds = states.CLOSED
            }
            if (Object.keys(updateDoorGroup).length) doorDoc.update(updateDoorGroup,options, user);
          }
        }
      }
    }

    await super._preUpdate(updateData, options, user);
  }

  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    const updateData = {};
    const flags = this.flags;
    const soundDefault = CONFIG.ARSDD.doorSoundDefault;
    const iconDefault = CONFIG.controlIcons;

    const noDoor = flags.door === undefined;
    const noSound = noDoor ? flags.door.sound === undefined : true;
    if ( noDoor || noSound || flags.door.sound.level === undefined ) updateData["flags.door.sound.level"] = soundDefault.level;
    if ( noDoor || noSound || flags.door.sound.close === undefined ) updateData["flags.door.sound.close"] = soundDefault.close;
    if ( noDoor || noSound || flags.door.sound.open === undefined ) updateData["flags.door.sound.open"] = soundDefault.open;
    if ( noDoor || noSound || flags.door.sound.unlock === undefined ) updateData["flags.door.sound.unlock"] = soundDefault.unlock;
    if ( noDoor || noSound || flags.door.sound.locked === undefined ) updateData["flags.door.sound.locked"] = soundDefault.locked;

    const noIcon = noDoor ? flags.door.icon === undefined : true;
    if ( noDoor || noIcon || flags.door.icon.closed === undefined ) updateData["flags.door.icon.closed"] = iconDefault.doorClosed;
    if ( noDoor || noIcon || flags.door.icon.open === undefined ) updateData["flags.door.icon.open"] = iconDefault.doorOpen;
    if ( noDoor || noIcon || flags.door.icon.locked === undefined ) updateData["flags.door.icon.locked"] = iconDefault.doorLocked;
    if ( noDoor || noIcon || flags.door.icon.secret === undefined ) updateData["flags.door.icon.secret"] = iconDefault.doorSecret;

    if ( noDoor || flags.door.group === undefined ) updateData["flags.door.group"] = "";
    if ( noDoor || flags.door.trapped === undefined ) updateData["flags.door.trapped"] = ARSDD.WALL_DOOR_TRAPPED.NONE;
    if ( noDoor || flags.door.trapId === undefined ) updateData["flags.door.trapId"] = "";

    const noThreshold = noDoor ? flags.door.threshold === undefined : true;
    if ( noDoor || noThreshold || flags.door.threshold.open === undefined ) updateData["flags.door.threshold.open"] = 100;
    if ( noDoor || noThreshold || flags.door.threshold.detect === undefined ) updateData["flags.door.threshold.detect"] = 100;
    if ( noDoor || noThreshold || flags.door.threshold.disarm === undefined ) updateData["flags.door.threshold.disarm"] = 100;
    if ( noDoor || noThreshold || flags.door.threshold.stealth === undefined ) updateData["flags.door.threshold.stealth"] = 100;

    if (Object.keys(updateData).length) this.update(updateData);
  }


}

export class WallConfigArsDD extends WallConfig {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes : ["sheet wall"],
      template : "systems/arsdd/templates/canvas/wall-config.html",
      width : 500,
      height: "auto",
      tabs: [{navSelector: ".tabs", contentSelector: "form", initial: "wall"}]
    });
  }

   /** @override */
  getData(options={}) {
    const data = super.getData(options);
    const soundDefault = CONFIG.ARSDD.doorSoundDefault;
    const iconDefault = CONFIG.controlIcons;
    if (data.object.flags.door === undefined) {
      data.object.flags.door = {
        sound : {
          level : soundDefault.level,
          close : soundDefault.close,
          open : soundDefault.open,
          lock : soundDefault.lock,
          unlock : soundDefault.unlock,
          locked : soundDefault.locked          
        },
        icon : {
          closed : iconDefault.doorClosed,
          open : iconDefault.doorOpen,
          locked : iconDefault.doorLocked,
          secret : iconDefault.doorSecret
        },
        group : "",
        trapped : CONFIG.ARSDD.WALL_DOOR_TRAPPED.NONE,
        trapId : "",
        threshold : {
          open : 6,
          detect : 6,
          disarm : 6,
          stealth : 6
        }
      }
    }
    data.doorTrapped = Object.keys(CONFIG.ARSDD.WALL_DOOR_TRAPPED).reduce((obj, key) => {
      let k = CONFIG.ARSDD.WALL_DOOR_TRAPPED[key];
      obj[k] = key.titleCase();
      return obj;
    }, {});

    return data;
  }

/*   activateListeners(html) {
    super.activateListeners(html);
    html.find("img[data-edit]").click(ev => this._onEditImage(ev));
  }

  _onEditImage(event) {
    const attr = event.currentTarget.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const fp = new FilePicker({
      type: "image",
      current: current,
      callback: path => {
        event.currentTarget.src = path;
        this._onSubmit(event);
      },
      top: this.position.top + 40,
      left: this.position.left + 10
    });
    return fp.browse();
  } */

}

export class DoorControlArsDD extends DoorControl {
  /** @override */
  _getTexture() {
    // Determine displayed door state
    const states = CONST.WALL_DOOR_STATES;
    const state = this.wall.document.ds;

    // Determine texture path
    const iconDefault = CONFIG.controlIcons;
    let doorData = this.wall.document.flags.door?.icon ? this.wall.document.flags.door?.icon : { 
      closed : iconDefault.doorClosed,
      open : iconDefault.doorOpen,
      locked : iconDefault.doorLocked,
      secret : iconDefault.doorSecret
    }
    let path = doorData.open;  
    if ( (state === states.LOCKED) && !game.user.isGM ) path = doorData.closed;
    else if(state === states.LOCKED) path = doorData.locked;
    else if ( (state === states.CLOSED) && (this.wall.document.door === CONST.WALL_DOOR_TYPES.SECRET) ) path = doorData.secret;
    else if(state === states.CLOSED) path = doorData.closed;

    // Obtain the icon texture
    return getTexture(path);
  }

  /** @override */
  _onMouseDown (event) {
    if ( event.data.originalEvent.button !== 0 ) return; // Only support standard left-click
    event.stopPropagation();
    const state = this.wall.document.ds;
    const states = CONST.WALL_DOOR_STATES;

    // Determine whether the player can control the door at this time
    if ( !game.user.can("WALL_DOORS") ) return false;
    if ( game.paused && !game.user.isGM ) {
      ui.notifications.warn("GAME.PausedWarning", {localize: true});
      return false;
    }

    let stealth = false;
    if ( canvas.tokens.controlled.length === 1) {
      //test system pour discretion
      //to do
      //test system pour piege
      if ( this.wall.document.flags.door.trapped === CONFIG.ARSDD.WALL_DOOR_TRAPPED.TRAPPED) {
        //to do
      }
    }

    //check to see if the door is locked, otherwise use normal handler
    const doorSoundDefault = CONFIG.ARSDD.doorSoundDefault;
    if(state === states.LOCKED && !stealth) {
      const level = this.wall.document.flags.door?.sound ? this.wall.document.flags.door?.sound.level : doorSoundDefault.level;
      const path = this.wall.document.flags.door?.sound ? this.wall.document.flags.door?.sound.locked : doorSoundDefault.locked;
      AudioHelper.play({src: path, volume: level, autoplay: true, loop: false}, true);      
      return false;
    }
    else if (state === states.LOCKED) {
      const message = {};
      message.user = game.user.id;
      if (game.user.character) message.speaker = {actor: game.user.character};
      message.content = "Tentative d'ouverture silencieuse, mais la porte est verrouillée";
      ChatMessage.create(message);
    }
  
    // Toggle between OPEN and CLOSED states
    return this.wall.document.update({ds: state === states.CLOSED ? states.OPEN : states.CLOSED}, {stealth:stealth});
  }

  _onRightDown(event) {
    event.stopPropagation();
    let state = this.wall.document.ds;
    const states = CONST.WALL_DOOR_STATES;
    if ( state === states.OPEN ) return;
    let stealth = false;
    let unlock = false;
    if ( canvas.tokens.controlled.length === 1) {
      //test system pour discretion
      //to do
      //test system pour piege
      if ( this.wall.document.flags.door.trapped === CONFIG.ARSDD.WALL_DOOR_TRAPPED.TRAPPED) {
        //to do
      }
      //test deverouillage
    }
    else if ( game.user.isGM ) unlock = true;
    if (!unlock) return;

    state = state === states.LOCKED ? states.CLOSED : states.LOCKED;
    return this.wall.document.update({ds: state}, {stealth:stealth});
  }

}
