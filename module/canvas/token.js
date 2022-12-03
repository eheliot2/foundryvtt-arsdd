import {isActivatedModule} from "../macro/macros.js";

export default class TokenArsDD extends Token {

  //copie de la classe pour gerer les #private, recopie puis suppresion de totu ce qui n'utilise pas de private
    constructor(document) {
      super(document);
      this.#initialize();
    }
  
    #priorMovement;
    #adjustedCenter;
    #validPosition;
    #unlinkedVideo = false;
  
    #initialize() {
  
      // Initialize prior movement
      const {x, y, rotation} = this.document;
      const r = Ray.fromAngle(x, y, Math.toRadians(rotation + 90), canvas.dimensions.size);
  
      // Initialize valid position
      this.#validPosition = {x, y, rotation};
      this.#priorMovement = {dx: r.dx, dy: r.dy, ox: Math.sign(r.dx), oy: Math.sign(r.dy)};
      this.#adjustedCenter = this.getMovementAdjustedPoint(this.center);
    }
  
    set detectionFilter(filter) {
      // First removing the detection filter if it is defined
      if ( this.#detectionFilter ) this.mesh.filters.findSplice(o => o === this.#detectionFilter);
  
      // Assigning the new filter (or an undefined value)
      this.#detectionFilter = (filter && (filter instanceof PIXI.Filter)) ? filter : undefined;
      if ( !this.#detectionFilter ) return;
  
      // Install the filter disabled
      this.#detectionFilter.enabled = false;
      if ( this.mesh.filters ) this.mesh.filters.unshift(this.#detectionFilter);
      else this.mesh.filters = [this.#detectionFilter];
    }
  
    #detectionFilter;

    /** @inheritDoc */
    clone() {
      const clone = super.clone();
      clone.#priorMovement = this.#priorMovement;
      clone.#validPosition = this.#validPosition;
      return clone;
    }
  
    updateSource({defer=false, deleted=false}={}) {
      this.#adjustedCenter = this.getMovementAdjustedPoint(this.center);
      this.updateLightSource({defer, deleted});
      this.updateVisionSource({defer, deleted});
    }
  
    updateLightSource({defer=false, deleted=false}={}) {
  
      // Prepare data
      const origin = this.#adjustedCenter;
      const sourceId = this.sourceId;
      const d = canvas.dimensions;
      const isLightSource = this.emitsLight;
  
      // Initialize a light source
      if ( isLightSource && !deleted ) {
        const lightConfig = foundry.utils.mergeObject(this.document.light.toObject(false), {
          x: origin.x,
          y: origin.y,
          dim: Math.clamped(this.getLightRadius(this.document.light.dim), 0, d.maxR),
          bright: Math.clamped(this.getLightRadius(this.document.light.bright), 0, d.maxR),
          z: this.document.getFlag("core", "priority"),
          seed: this.document.getFlag("core", "animationSeed"),
          rotation: this.document.rotation
        });
        this.light.initialize(lightConfig);
        canvas.effects.lightSources.set(sourceId, this.light);
      }
  
      // Remove a light source
      else canvas.effects.lightSources.delete(sourceId);
  
      // Schedule a perception update
      if ( !defer && ( isLightSource || deleted ) ) {
        canvas.perception.update({
          refreshLighting: true,
          refreshVision: true
        }, true);
      }
    }
  
    updateVisionSource({defer=false, deleted=false}={}) {
  
      // Prepare data
      const origin = this.#adjustedCenter;
      const sourceId = this.sourceId;
      const d = canvas.dimensions;
      const isVisionSource = this._isVisionSource();
  
      // Initialize vision source
      if ( isVisionSource && !deleted ) {
        this.vision.initialize({
          x: origin.x,
          y: origin.y,
          radius: Math.clamped(this.sightRange, 0, d.maxR),
          externalRadius: Math.max(this.mesh.width, this.mesh.height) / 2,
          angle: this.document.sight.angle,
          contrast: this.document.sight.contrast,
          saturation: this.document.sight.saturation,
          brightness: this.document.sight.brightness,
          attenuation: this.document.sight.attenuation,
          rotation: this.document.rotation,
          visionMode: this.document.sight.visionMode,
          color: Color.from(this.document.sight.color),
          isPreview: !!this._original,
          blinded: this.document.hasStatusEffect(CONFIG.specialStatusEffects.BLIND)
        });
        canvas.effects.visionSources.set(sourceId, this.vision);
      }
  
      // Remove vision source
      else canvas.effects.visionSources.delete(sourceId);
  
      // Schedule a perception update
      if ( !defer && (isVisionSource || deleted) ) {
        canvas.perception.update({refreshVision: true, refreshLighting: true}, true);
      }
    }
  
    /** @override */
    render(renderer) {
      if ( this.#detectionFilter ) {
        this.#detectionFilter.enabled = true;
        this.mesh.pluginName = BaseSamplerShader.classPluginName;
        this.mesh.render(renderer);
        this.mesh.pluginName = null;
        this.#detectionFilter.enabled = false;
      }
      super.render(renderer);
    }
  
    /** @inheritdoc */
    _destroy(options) {
      canvas.primary.removeToken(this);           // Remove the TokenMesh from the PrimaryCanvasGroup
      this.border.destroy();                      // Remove the border Graphics from the GridLayer
      this.light.destroy();                       // Destroy the LightSource
      this.vision.destroy();                      // Destroy the VisionSource
      this.texture.destroy(this.#unlinkedVideo);  // Destroy base texture if the token has an unlinked video
      this.texture = undefined;
      this.#unlinkedVideo = false;
    }
  
    #animationAttributes;
  
    async animate(updateData, {name, duration, easing, movementSpeed=6, ontick}={}) {
      const a0 = this.#animationAttributes;
      const a1 = this.getDisplayAttributes();
      const animation = {};
      const attributes = {};
  
      // Regular numeric attributes
      for ( const k of ["x", "y", "alpha", "width", "height"] ) {
        if ( a1[k] !== a0[k] ) attributes[k] = {attribute: k, from: a0[k], to: a1[k], parent: animation};
      }
      for ( const k of ["scaleX", "scaleY"] ) {
        if ( a1.texture[k] !== a0.texture[k] ) {
          animation.texture ||= {};
          attributes[k] = {attribute: k, from: a0.texture[k], to: a1.texture[k], parent: animation.texture};
        }
      }
  
      // Special handling for rotation
      let dr = a1.rotation - a0.rotation;
      if ( dr !== 0 ) {
        let r = a1.rotation;
        if ( dr > 180 ) r -= 360;
        if ( dr < -180 ) r += 360;
        dr = r - a0.rotation;
        attributes.rotation = {attribute: "rotation", from: a0.rotation, to: r, parent: animation};
      }
  
      // Special handling for hidden state
      if ( "hidden" in updateData ) {
        const to = Math.min(a1.alpha, updateData.hidden ? .5 : 1);
        attributes.alpha = {attribute: "alpha", from: a0.alpha, to, parent: animation};
      }
  
      // Special handling for tint
      if ( !a1.texture?.tint.equals(a0.texture?.tint) ) {
        animation.texture ||= {};
        const targetRGB = a1.texture.tint.rgb;
        const currentRGB = a0.texture.tint.rgb;
        attributes.tintR = {attribute: "r", from: currentRGB[0], to: targetRGB[0], parent: animation.texture};
        attributes.tintG = {attribute: "g", from: currentRGB[1], to: targetRGB[1], parent: animation.texture};
        attributes.tintB = {attribute: "b", from: currentRGB[2], to: targetRGB[2], parent: animation.texture};
      }
  
      // Configure animation
      if ( foundry.utils.isEmpty(attributes) ) return;
      const emits = this.emitsLight;
      const isPerceptionChange = ["x", "y", "rotation"].some(k => k in updateData);
      const config = game.settings.get("core", "visionAnimation") && isPerceptionChange ? {
        animatePerception: this._isVisionSource() || emits,
        sound: this.observer,
        forceUpdateFog: emits && !this.controlled && (canvas.effects.visionSources.size > 0)
      } : {animatePerception: false};
  
      // Configure animation duration aligning movement and rotation speeds
      if ( !duration ) {
        const durations = [];
        const dx = a1.x - a0.x;
        const dy = a1.y - a0.y;
        if ( dx || dy ) durations.push((Math.hypot(dx, dy) * 1000) / (canvas.dimensions.size * movementSpeed));
        if ( dr ) durations.push((Math.abs(dr) * 1000) / (movementSpeed * 60));
        if ( durations.length ) duration = Math.max(...durations);
      }
  
      // Dispatch animation
      this._animation = CanvasAnimation.animate(Object.values(attributes), {
        name: name || this.animationName,
        context: this,
        duration: duration,
        easing: easing,
        priority: PIXI.UPDATE_PRIORITY.HIGH + 1,
        ontick: (dt, anim) => {
          this.#animateFrame(animation, config);
          if ( ontick ) ontick(dt, anim, animation, config);
        }
      });
      await this._animation;
      this._animation = null;
  
      // Render the completed animation
      config.animatePerception = config.forceUpdateFog = true;
      this.#animateFrame(animation, config);
    }
  
    #animateFrame(frame, {animatePerception, forceUpdateFog, sound}={}) {
  
      // Recover animation color
      if ( frame.texture?.tintR ) {
        const {tintR, tintG, tintB} = frame.texture;
        frame.texture.tint = Color.fromRGB([tintR, tintG, tintB]);
      }
  
      // Update the document
      frame = this.document.constructor.cleanData(frame, {partial: true});
      foundry.utils.mergeObject(this.document, frame, {insertKeys: false});
  
      // Record animation attributes
      this.#animationAttributes = this.getDisplayAttributes();
  
      // Refresh the Token and TokenMesh
      const changePosition = ("x" in frame) || ("y" in frame);
      const changeSize = ("width" in frame) || ("height" in frame);
      this.refresh({
        bars: changeSize,
        border: changePosition || changeSize,
        effects: changeSize,
        elevation: changeSize,
        nameplate: changeSize
      });
  
      // Animate perception changes
      if ( animatePerception ) {
        this.updateSource({defer: true});
        canvas.perception.update({
          refreshLighting: true,
          refreshVision: true,
          refreshTiles: true,
          forceUpdateFog: forceUpdateFog,
          refreshSounds: sound
        }, true);
      }
  
      // Otherwise, update visibility each frame
      else if (changeSize || changePosition) this.visible = this.isVisible;
    }
  
    checkCollision(destination, {origin, type="move", mode="any"}={}) {
  
      // The test origin is the last confirmed valid position of the Token
      const center = origin || this.getCenter(this.#validPosition.x, this.#validPosition.y);
      origin = this.getMovementAdjustedPoint(center);
  
      // The test destination is the adjusted point based on the proposed movement vector
      const dx = destination.x - center.x;
      const dy = destination.y - center.y;
      const offsetX = dx === 0 ? this.#priorMovement.ox : Math.sign(dx);
      const offsetY = dy === 0 ? this.#priorMovement.oy : Math.sign(dy);
      destination = this.getMovementAdjustedPoint(destination, {offsetX, offsetY});
  
      // Reference the correct source object
      let source;
      switch ( type ) {
        case "move":
          source = this.#getMovementSource(origin); break;
        case "sight":
          source = this.vision; break;
        case "light":
          source = this.light; break;
        case "sound":
          throw new Error("Collision testing for Token sound sources is not supported at this time");
      }
  
      // Create a movement source passed to the polygon backend
      return CONFIG.Canvas.losBackend.testCollision(origin, destination, {type, mode, source});
    }
  
    #getMovementSource(origin) {
      const movement = new MovementSource(this);
      movement.initialize({x: origin.x, y: origin.y, elevation: this.document.elevation});
      return movement;
    }

    updatePosition({recenter=true}={}) {
  
      // Record the new token position
      const origin = this._animation ? this.position : this.#validPosition;
      const destination = {x: this.document.x, y: this.document.y};
      this.#recordMovement(origin, destination);
  
      // Update visibility for a non-controlled token which may have moved into the field-of-view
      this.visible = this.isVisible;
  
      // If the movement took a controlled token off-screen, re-center the view
      if ( this.controlled && this.visible && recenter ) {
        const pad = 50;
        const sidebarPad = $("#sidebar").width() + pad;
        const rect = new PIXI.Rectangle(pad, pad, window.innerWidth - sidebarPad, window.innerHeight - pad);
        let gp = this.getGlobalPosition();
        if ( !rect.contains(gp.x, gp.y) ) canvas.animatePan(this.center);
      }
    }
  
    #recordMovement(origin, destination) {
      const ray = new Ray(origin, destination);
      const prior = this.#priorMovement;
      const ox = ray.dx === 0 ? prior.ox : Math.sign(ray.dx);
      const oy = ray.dy === 0 ? prior.oy : Math.sign(ray.dy);
      foundry.utils.mergeObject(this.#validPosition, destination);
      return this.#priorMovement = {dx: ray.dx, dy: ray.dy, ox, oy};
    }


    /* -------------------------------------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------------------------------------- */
    /*  ArsDD start
    /* -------------------------------------------- */
  
    /** @override */
    _onUpdate(data, options, userId) {
      const keys = Object.keys(foundry.utils.flattenObject(data));
      const changed = new Set(keys);
      const positionChange = ["x", "y"].some(c => changed.has(c));
      const shapeChange = ["width", "height"].some(k => changed.has(k));
      const perceptionUpdate = {};
  
      // Update token appearance
      // noinspection ES6MissingAwait
      this._onUpdateAppearance(data, changed, options);
  
      // Record cached attributes
      this.#animationAttributes = this.getDisplayAttributes();
      if ( positionChange ) this.updatePosition(options);
      if ( changed.has("rotation") ) this.#validPosition.rotation = this.document.rotation;


      if ( userId === game.user.id && !foundry.utils.hasProperty(data,"flags.position.movement") && ["x", "y", "elevation"].some(c => changed.has(c))) {
        const unitsPixel = canvas.dimensions.size / canvas.dimensions.distance;
        const x0 = this.x; 
        const y0 = this.y;
        const z0 = this.document.elevation;
        let dx, dy, dz = 0;
        let movement = 0;
        let [x, y, z] = [x0, y0, z0];
        if (foundry.utils.hasProperty(data,"x")) x = data.x; 
        if (foundry.utils.hasProperty(data,"y")) y = data.y; 
        if (foundry.utils.hasProperty(data,"elevation")) z = data.elevation
        dx = Math.floor(Math.abs(x0 - x) / unitsPixel); 
        dy = Math.floor(Math.abs(y0 - y) / unitsPixel); 
        dz = Math.abs(z0 - z);
    
        //terrain speciaux
        if (isActivatedModule("enhanced-terrain-layer")) {
          const terrain = canvas.terrain.listAllTerrain({}); 
          let terrainRulerVisitedSpaces = [{x:Math.floor(x + unitsPixel/2), y:Math.floor(y + unitsPixel/2)}]
          if ( Math.max(dx,dy) > 1) {      
            const ruler = canvas.controls.rulers.children.find( r => r.user.id === game.user.id);
            const lastSegment = ruler.segments.slice(-1);
            //[0] arrivee, [n] origine => splice
            terrainRulerVisitedSpaces = lastSegment[0].ray.terrainRulerVisitedSpaces.slice(0,-1);
            for ( const gridCase of terrainRulerVisitedSpaces) {
              delete gridCase.distance;
              gridCase.x = Math.floor((gridCase.x + 1/2) * unitsPixel);
              gridCase.y = Math.floor((gridCase.y + 1/2) * unitsPixel);
            }
          }
          for (const pt of terrainRulerVisitedSpaces) {
            const ptTerrain = terrain.filter((t) =>
              t.shape.contains(pt.x - t.object.x, pt.y - t.object.y)
            );

            if (ptTerrain.length > 0) {
              let cost = 0;
              for (const terrainInfo of ptTerrain) {
                cost = Math.max(terrainInfo.cost, cost);
              }
              movement += cost;
            }
            else movement += 1;
          }
        }
        else movement = Math.max(dx,dy)+dz;
        const updateData = {};
        updateData["flags.position.movement"] = this.document.flags.position.movement + movement;
        this.document.update(updateData, options, userId);
        const actor = this.actor;
        const tactical = actor.system.attributes.movement.tactical;
        const before = Math.floor(this.document.flags.position.movement/tactical);
        const after = Math.floor((this.document.flags.position.movement + movement)/tactical);
        if ( before !== after && after === 1) actor.setActiveEffectByAction("movement");
        else if ( before !== after && after === 2) actor.setActiveEffectByAction("action");
      }
  
      // Update quadtree position
      if ( shapeChange || positionChange ) this.layer.quadtree.update({r: this.bounds, t: this});
  
      // Handle changes to the visibility state of the token
      const visibilityChange = changed.has("hidden");
      if ( visibilityChange ) {
        if ( !game.user.isGM ) {
          if ( this.controlled && data.hidden ) this.release();
          else if ( !data.hidden && !canvas.tokens.controlled.length ) this.control({pan: true});
        }
        this.visible = this.isVisible;
      }
  
      // Sort parent container
      if ( changed.has("elevation") ) {
        canvas.primary.sortChildren();
        perceptionUpdate.refreshTiles = perceptionUpdate.refreshVision = true;
      }
  
      // Determine whether the token's perspective has changed
      const rotationChange = changed.has("rotation") && this.hasLimitedSourceAngle;
      const perspectiveChange = visibilityChange || positionChange || rotationChange;
      const visionChange = ("sight" in data) || (this.hasSight && perspectiveChange) || ("detectionModes" in data);
      const lightChange = ("light" in data) || (this.emitsLight && perspectiveChange);
      if ( visionChange || lightChange ) {
        this.updateSource({defer: true});
        foundry.utils.mergeObject(perceptionUpdate, {
          initializeVision: changed.has("sight.enabled") || changed.has("sight.visionMode"),
          forceUpdateFog: this.hasLimitedSourceAngle,
          refreshLighting: true,
          refreshVision: true,
          refreshSounds: true,
          refreshTiles: true
        });
      }
  
      // Update tile occlusion
      if ( shapeChange || ["texture.scaleX", "texture.scaleY"].some(r => changed.has(r)) ) {
        this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);
        perceptionUpdate.refreshTiles = true;
      }
  
      // Update the Token HUD
      if ( this.hasActiveHUD ) {
        if ( positionChange || shapeChange ) this.layer.hud.clear();
      }
  
      // Process Combat Tracker changes
      if ( this.inCombat ) {
        if ( changed.has("name") ) {
          canvas.addPendingOperation("Combat.setupTurns", game.combat.setupTurns, game.combat);
        }
        if ( ["effects", "name", "overlayEffect"].some(k => changed.has(k)) ) {
          canvas.addPendingOperation("CombatTracker.render", ui.combat.render, ui.combat);
        }
      }
  
      // Schedule perception updates
      canvas.perception.update(perceptionUpdate, true);
    }

    /** @override */
    async toggleCombat(combat) {
    
      // If the token is not in combat, add it without a warning
      if (!this.inCombat) {
        await this.layer.toggleCombat(!this.inCombat, combat, {token: this});
      }
      else {
        // Warn that only the GM can remove a combatant
        if (!game.user.isGM) {
          return ui.notifications.warn(game.i18n.localize(`${LANG_NAME}.onlyGmRemoveCombatant`));
        }
    
        // If the token is in combat, warn before removing it
        return Dialog.confirm({
          title: game.i18n.localize("COMBAT.CombatantRemove"),
          content: game.i18n.format("voulez-vous retirer " + this.name + " ?"),
          yes: () =>  this.layer.toggleCombat(!this.inCombat, combat, {token: this})
        });

      }
 
    }



  /** @override */
  async _draw() {
    this._cleanData();

    // Draw the token as invisible, so it will be safely revealed later
    this.visible = false;

    // Load token texture
    let texture;
    if ( this.isPreview ) texture = this._original.texture?.clone();
    else texture = await loadTexture(this.document.texture.src, {fallback: CONST.DEFAULT_TOKEN});

    // Manage video playback
    let video = game.video.getVideoSource(texture);
    this.#unlinkedVideo = video && !this._original;
    if ( video ) {
      const playOptions = {volume: 0};
      if ( this.#unlinkedVideo ) {
        texture = await game.video.cloneTexture(video);
        video = game.video.getVideoSource(texture);
        if ( this.document.getFlag("core", "randomizeVideo") !== false ) {
          playOptions.offset = Math.random() * video.duration;
        }
      }
      game.video.play(video, playOptions);
    }
    this.texture = texture;

    // Draw the TokenMesh in the PrimaryCanvasGroup  
    this.mesh = canvas.primary.addToken(this);
    this.#animationAttributes = this.getDisplayAttributes();    

    // Draw the border frame in the GridLayer
    this.border ||= canvas.grid.borders.addChild(new PIXI.Graphics());

    // Draw Token interface components
    this.bars = this.addChild(this._drawAttributeBars());
    this.tooltip = this.addChild(this._drawTooltip());
    this.effects = this.addChild(new PIXI.Container());

    this.target = this.addChild(new PIXI.Graphics());
    this.nameplate = this.addChild(this._drawNameplate());

    //ARSDD - ajout aura
    this.aura = this.addChildAt(new PIXI.Container(),0);

    // Draw elements
    this.drawBars();
    await this.drawEffects();

    // Define initial interactivity and visibility state
    this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);
    this.buttonMode = true;
  }

  /** @override */
  _refreshBorder() {
    this.border.clear();
    if ( !this.visible ) return;
    const borderColor = this._getBorderColor();
    if ( !borderColor ) return;
    //ARSDD *2
    const t = CONFIG.Canvas.objectBorderThickness *2;
    this.border.position.set(this.document.x, this.document.y);

    // Draw Hex border for size 1 tokens on a hex grid
    if ( canvas.grid.isHex ) {
      const polygon = canvas.grid.grid.getBorderPolygon(this.document.width, this.document.height, t);
      if ( polygon ) {
        this.border.lineStyle(t, 0x000000, 0.8).drawPolygon(polygon);
        this.border.lineStyle(t/2, borderColor, 1.0).drawPolygon(polygon);
        return;
      }
    }

    // Otherwise, draw square border
    const h = Math.round(t/2);
    const o = Math.round(h/2);
    this.border.lineStyle(t, 0x000000, 0.8).drawRoundedRect(-o, -o, this.w+h, this.h+h, 3);
    this.border.lineStyle(h, borderColor, 1.0).drawRoundedRect(-o, -o, this.w+h, this.h+h, 3);

  }

  /** @override */
  _getBorderColor() {
    const colors = CONFIG.Canvas.dispositionColors;
    if ( this.controlled ) return colors.CONTROLLED;
    //else if ( (hover ?? this.hover) || canvas.tokens._highlight ) {
      let d = parseInt(this.document.disposition);
      //if ( !game.user.isGM && this.isOwner ) return colors.CONTROLLED;
      //else if ( this.actor?.hasPlayerOwner ) return colors.PARTY;
      if ( d === CONST.TOKEN_DISPOSITIONS.FRIENDLY ) return colors.FRIENDLY;
      else if ( d === CONST.TOKEN_DISPOSITIONS.NEUTRAL ) return colors.NEUTRAL;
      else return colors.HOSTILE;
    //}
    //else return null;
  }

  _canControlArsDD() {
    const updateData = {};
    if (this.actor.system.isFollower != (this.document.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY)) {  
      updateData["system.isFollower"] = this.document.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY;
      this.actor.update(updateData);
    }
    return game.user.isGM || this.actor.flags.isPC || this.document.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY;
  }

  /** @override */
  _canControl(user, event) {
    if ( canvas.controls.ruler.active ) return false;
    const tool = game.activeTool;
    if ( tool === "target" ) return true;
    return this._canControlArsDD() ;
  }

  /** @override */
  _isVisionSource() {
    if ( !canvas.effects.visibility.tokenVision || !this.hasSight ) return false;

    // Only display hidden tokens for the GM
    const isGM = game.user.isGM;
    if (this.document.hidden && !isGM) return false;

    // Always display controlled tokens which have vision
    if ( this.controlled ) return true;

    // Otherwise vision is ignored for GM users
    if ( isGM ) return false;

    // If a non-GM user controls no other tokens with sight, display sight anyways
    //const canObserve = this.actor?.testUserPermission(game.user, "OBSERVER") ?? false;
    if ( !this._canControlArsDD() ) return false;
    const others = this.layer.controlled.filter(t => !t.document.hidden && t.hasSight);
    return !others.length;

  }

  /** @override */
  _onCreate(options, userId) {
      // Start by drawing the newly created token
      this.draw().then(() => {

        // Draw vision for the new token
        const refreshVision = this.document.sight.enabled && this._canControlArsDD();
        const refreshLighting = this.emitsLight;
        if ( refreshVision || refreshLighting ) {
          this.updateSource({defer: true});
          canvas.perception.update({refreshVision, refreshLighting}, true);
        }

        // Assume token control
        if ( !game.user.isGM && this.isOwner && !this.document.hidden ) this.control({pan: true});

        // Update visibility of objects in the Scene
        if ( !refreshVision ) canvas.effects.visibility.restrictVisibility();

        //ajout au combat en cours
        if (game.combat) this.layer.toggleCombat(true, game.combat, {token: this});

        
      });
  }

  /** @override */
  _canDrag(user, event) {
    if ( !this.controlled || this._animation ) return false;
    const tool = game.activeTool;
    if ( ( tool !== "select" ) || game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.CONTROL) ) return false;
    return game.user.isGM || (!game.paused && !game.settings.get("arsdd", "movementByGrid"));
  }

  //calcul distance : centre à centre ou bord à bord le plus pres, en distance euclidienne ou classique grid, arrondi ou pas case
  //ne pas utiliser en bord a bord et euclidein. 
  tokenDistance(targetToken, center = true, euclidean = false, round=true){
    const pixelUnits = 1 / canvas.dimensions.size * canvas.dimensions.distance;
    let x = Math.abs((targetToken.center.x - this.center.x) * pixelUnits);
    let y = Math.abs((targetToken.center.y - this.center.y) * pixelUnits);
    let z = Math.abs((targetToken.document.elevation - this.document.elevation) * pixelUnits);    

    if (!center) {
      x = Math.max(0,x - Math.abs((targetToken.document.width + this.document.width) /2 )); // se rapproche de la moitie de leur width
      y = Math.max(0,y - Math.abs((targetToken.document.height + this.document.height)  /2 )); // se rapproche de la moitie de leur height
      z = Math.max(0,z - Math.abs((targetToken.document.width + this.document.width + targetToken.document.height + this.document.height) /4 )); // se rapproche de la moitie de leur height      
    }

    if (euclidean && round) return Math.round(Math.sqrt(x*x + y*y + z*z));
    else if (euclidean) return Math.round(Math.sqrt(x*x + y*y + z*z)*100)/100;
    else if (round) return Math.round(Math.max(x, y, z));
    else return Math.round(Math.max(x, y, z)*100)/100;
  }

  tokenLos(targetToken) {
    if (!this.document.sight.enabled) return {los:false, cover:0};
    let corner = 0;
    const unitsPixel = canvas.dimensions.size / canvas.dimensions.distance;
    const wt = targetToken.document.width * unitsPixel;
    const ht = targetToken.document.height * unitsPixel;
    const st = (targetToken.document.width + targetToken.document.height)/2;
    const zt = targetToken.document.elevation;
    const xt = targetToken.x;
    const yt = targetToken.y;
    const xs = this.center.x;
    const ys = this.center.y;
    const zs = this.document.elevation;

    //partie los via pixi
    //on prend a la meilleure case (pour les gros token)
    for(let wi = 0; wi < Math.min(wt, 6*unitsPixel) ; wi+= unitsPixel) {
      for(let hi = 0; hi < Math.min(ht, 6*unitsPixel); hi+= unitsPixel) {
        let ci = 0;
        //decalage +1 ou -1 pour ramener à l'interieur de la case, pb pixi sur les bords, avec les murs
        if (this.vision.containsPoint({x:targetToken.center.x, y:targetToken.center.y})) ci++;
        if (this.vision.containsPoint({x:xt+wi+1, y:yt+hi+1})) ci++;
        if (this.vision.containsPoint({x:xt+wi-1 + unitsPixel, y:yt+hi+1})) ci++;
        if (this.vision.containsPoint({x:xt+wi+1, y:yt+hi-1 + unitsPixel})) ci++; 
        if (this.vision.containsPoint({x:xt+wi-1 + unitsPixel, y:yt+hi-1 + unitsPixel})) ci++; 
        corner = Math.max(corner,ci);
      }
    }
    if (corner === 0) return {los:false, cover:0}

    //partie les tokens
    //cone (2droite) de centre de sourcetoken et tangent a targertoken. si tokenn intersecte 
    // - 0 droite : ras
    // - 1 droite : cover augmente de 1
    // - 2 droites et taille token <= taille target : cover augmente de 2
    // - 2 droites et taille token > taille target : cover augmente de 3

    let a1,a2,b1,b2;
    let v1 = false;
    let v2 = false;
    let targetQuarter = this.tokenQuarter(targetToken);

    if ((xt < xs && yt < ys) || (xt > xs && yt > ys)) {
      if (xt+wt - xs === 0) v1 = true;
      else {
        a1 = (yt - ys) / (xt+wt - xs);
        b1 = ys - a1 * xs;
      }
      a2 = (yt+ht - ys) / (xt - xs)
      b2 = ys - a2 * xs
    }
    else {
      if (xt - xs === 0) v1 =true;
      else {
        a1 = (yt - ys) / (xt - xs);
        b1 = ys - a1 * xs;
      }
      if (xt+wt - xs === 0) v2 = true;
      else {
        a2 = (yt+ht - ys) / (xt+wt - xs);
        b2 = ys - a2 * xs;
      }
    }
    if (v1) {
      a1 = xs;
      b1 = 0;
    }
    if (v2) {
      a2 = xs;
      b2 = 0;
    }
    let cover = 0;
    let cover1, cover2;
    let distance = this.tokenDistance(targetToken, true, true, false);

    for( const token of canvas.tokens.placeables) {
      //un token implique ou dans un quarter different ne gene pas
      if ( token.id === this.id || token.id === targetToken.id || !this.tokenTestQuarter(token, targetQuarter) ) continue;
      const w = token.document.width * unitsPixel;
      const h = token.document.height * unitsPixel;    
      const s = ( token.document.width + token.document.height ) / 2;
      //un token plus petit ne peut gener
      if ( s < st ) continue;
      //un token pas globalement entre les 2 plans d'elecvation ne peut gener
      const z = token.document.elevation;
      if (z < Math.min(zs, zt) || z > Math.max(zs, zt) ) continue; 
      if ( this.tokenDistance(token, true, true, false) > distance) continue;

      const x = token.x;
      const y = token.y;    
      cover1 = 0;
      cover2 = 0;
      if ( TokenArsDD.lineGridIntersection(x, y, w, false, a1, b1, v1) ) cover1++;
      if ( TokenArsDD.lineGridIntersection(x, y, w, false, a2, b2, v2) ) cover2++;
      if ( TokenArsDD.lineGridIntersection(x, y, h, true, a1, b1, v1) ) cover1++;
      if ( TokenArsDD.lineGridIntersection(x, y, h, true, a2, b2, v2) ) cover2++;
      if ( TokenArsDD.lineGridIntersection(x+w, y, h, true, a1, b1, v1) ) cover1++;
      if ( TokenArsDD.lineGridIntersection(x+w, y, h, true, a2, b2, v2) ) cover2++;
      if ( TokenArsDD.lineGridIntersection(x, y+h, w, false, a1, b1, v1) ) cover1++;
      if ( TokenArsDD.lineGridIntersection(x, y+h, w, false, a2, b2, v2) ) cover2++;
      if ( cover1 && cover2 && s > st) cover = Math.max(cover,2); 
      else if ( cover1 && cover2 ) cover = Math.max(cover,1);
      else if ( (cover1 || cover2) && st === 1 ) cover = Math.max(cover,1);
    } 

    if (corner >= 4 ) return {los:true, cover:0+cover};
    else if (corner >= 2 ) return {los:true, cover:1+cover};
    else return {los:true, cover:3+cover}; //corner ===1
  }

  // pour la grille xy : coordonnee x/y, wh : largeur/longueur, v : boolen verticale
  // pour la droite : a, b, v
  static lineGridIntersection(xGrid, yGrid, wGrid, vGrid, aLine, bLine, vLine) {
    let y1, y2;
    if (!vLine && !vGrid) {
      y1 = xGrid * aLine + bLine;
      y2 = (xGrid+wGrid) * aLine + bLine;
      if (y1 >= yGrid && y2 <= yGrid) return 1;
      else if (y1 <= yGrid && y2 >= yGrid) return 1;
    }
    else if (!vLine) {
      y1 = xGrid * aLine + bLine;
      if (y1 >= yGrid && y1 <= yGrid+wGrid) return 1;
    }
    else {
      if (vGrid && xGrid === aLine ) return 1;
      else if (!vGrid && xGrid >= aLine && xGrid+wGrid >= aLine) return 1;
    }
    return 0;
  }

  tokenQuarter(targetToken) {
    const xt = targetToken.center.x;
    const yt = targetToken.center.y;
    const xs = this.center.x;
    const ys = this.center.y; 

    if (xt < xs && yt < ys) return 1;
    else if (xt >= xs && yt >= ys) return 3;
    else if (xt < xs && yt >= ys) return 2;
    else return 4;

  }

  tokenTestQuarter(targetToken, quarter) {
    const unitsPixel = canvas.dimensions.size / canvas.dimensions.distance;
    const wt = targetToken.document.width * unitsPixel;
    const ht = targetToken.document.height * unitsPixel;
    const xt = targetToken.x;
    const yt = targetToken.y;
    const xs = this.center.x;
    const ys = this.center.y; 
    switch (quarter) {
      case 1:
        if (xt <= xs && yt <= ys) return true;
        return false;
      case 2:
        if (xt >= xs && yt+ht >= ys) return true;
        return false;
      case 3:
        if (xt+wt >= xs && yt+ht >= ys) return true;
        return false;
      case 4:
        if (xt+wt >= xs && yt <= ys) return true;
        return false;
    }
  }

  tokenAdjacent(sourceToken=null, ennemy = true) {
    if (game.scenes.active === undefined || canvas.tokens.placeables === undefined ) return false;
    for( const token of canvas.tokens.placeables) {
      if ( sourceToken !== null && token.id === sourceToken.id ) continue;
      if ( token.id === this.id ) continue;
      if ( this.tokenDistance(token, false, false, true) === 0  && token.document.disposition === this.tokenDisposition(ennemy) ) return true;
    }
    return false;
  }

  tokenDisposition(ennemy = true) {
    if (this.document.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY && ennemy ) return CONST.TOKEN_DISPOSITIONS.HOSTILE;
    if (this.document.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE && ennemy ) return CONST.TOKEN_DISPOSITIONS.FRIENDLY;
    if (this.document.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY ) return CONST.TOKEN_DISPOSITIONS.FRIENDLY;
    if (this.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE  ) return CONST.TOKEN_DISPOSITIONS.HOSTILE;
    return CONST.TOKEN_DISPOSITIONS.NEUTRAL;  
  }

  async setSourceAura(effect, disabledAura) {
    const {actor, item} = effect.source;
    const range = item ? item.system.action.target.value : 4;
    const targetType = item.system.action.target.type;

    const updateDataSource = {};
    if (!disabledAura) {
      updateDataSource["flags.aura.isSource"] = true;
      if (targetType === "ennemy") updateDataSource["flags.aura.disposition"] = this.tokenDisposition(true);
      else if (targetType === "ally") updateDataSource["flags.aura.disposition"] = this.tokenDisposition(false);
      else updateDataSource["flags.aura.disposition"] = CONST.TOKEN_DISPOSITIONS.NEUTRAL;
      updateDataSource["flags.aura.effect"] = effect.id;
      updateDataSource["flags.aura.range"] = range;   
      updateDataSource["flags.aura.fillColor"] = effect.flags.fillColorAura;
      updateDataSource["flags.aura.texture"] = effect.flags.textureAura;
      updateDataSource["flags.aura.opacity"] = effect.flags.opacityAura;    
    }
    else {
      updateDataSource["flags.aura.disposition"] = null;
      updateDataSource["flags.aura.range"] = null;  
      updateDataSource["flags.aura.fillColor"] = null;
      updateDataSource["flags.aura.texture"] = null;
      updateDataSource["flags.aura.opacity"] = null;
    } 
    await this.document.update(updateDataSource);
    await TokenArsDD.tokenCheckAura();

    if (disabledAura) {
      //disabled en 2 temps pour setTargetAura
      const updateDataSource2 = {};
      updateDataSource2["flags.aura.isSource"] = false;    
      updateDataSource2["flags.aura.effect"] = null;  
      await this.document.update(updateDataSource2);
    }
  }

  async setTargetAura(sourceToken, disabled) {
    const aura = sourceToken.document.flags.aura;
    const sourceEffects = sourceToken.actor.effects.filter(e => e.id === aura.effect);
    if (sourceEffects.length === 0) return;
    const effectAura = sourceEffects[0];
    const targetEffects = this.actor.effects.filter( e => e.originInfo.originItemId === effectAura.originInfo.originItemId );

    if ( disabled && targetEffects.length > 0) await targetEffects[0].delete(); 
    else if ( !disabled && targetEffects.length === 0) return await ActiveEffect.create(effectAura, {parent: this.actor});
    else if ( !disabled ) await targetEffects[0].update({disabled:false});
  }

  async checkSourceAura() {
    const aura = this.document.flags.aura;
    for( const token of canvas.tokens.placeables) {
      if ( token.id === this.id ) continue;
      let disabled = false;
      if (aura.disposition === null || aura.range === null) disabled = true;
      if (token.document.disposition !== aura.disposition && aura.disposition !== CONST.TOKEN_DISPOSITIONS.NEUTRAL) disabled = true;
      if (this.tokenDistance(token, true, true, false) > aura.range) disabled = true;
      await token.setTargetAura(this, disabled);
    }
  }

  isIlluminated() {
    //pas tout a fait, mais si un token est "aveugle" mais que tokenIsIlluminated repond true, c'est bien qu'il est illuminated
    const unitsPixel = canvas.dimensions.size / canvas.dimensions.distance;
    let c=0;
    for(let wi=1; wi <= this.document.width; wi++) {
      for(let hi=1; hi <= this.document.height; hi++) {
        if (canvas.effects.visibility.testVisibility({x:(this.document.x), y:(this.document.y)})) c++;
        if (canvas.effects.visibility.testVisibility({x:(this.document.x + wi * unitsPixel), y:(this.document.y)})) c++;
        if (canvas.effects.visibility.testVisibility({x:(this.document.x), y:(this.document.y + hi * unitsPixel)})) c++;
        if (canvas.effects.visibility.testVisibility({x:(this.document.x + wi * unitsPixel), y:(this.document.y + hi * unitsPixel)})) c++;
      }
    }
    return c>=3;
  }

  async drawAura() {
    if (this.document.flags.aura === undefined) return;
    const aura = this.document.flags.aura;
    if (aura.isSource !== undefined && aura.isSource) {
      
      this.aura.removeChildren().forEach(c => c.destroy());
      const gfx = this.aura.addChild(new PIXI.Graphics());
      const unitsPixel = canvas.dimensions.size / canvas.dimensions.distance;
      const radius = aura.range * unitsPixel;
      if ( aura.texture && aura.texture !=="" ) aura.texturePixi = await loadTexture(aura.texture, {fallback: 'icons/svg/hazard.svg'});
      else aura.texturePixi = null;
    
      if ( aura.texturePixi ) gfx.beginTextureFill({texture: aura.texturePixi});
      else gfx.beginFill(Color.from(aura.fillColor), aura.opacity);
      gfx.drawCircle(this.document.width * unitsPixel /2, this.document.height * unitsPixel /2, radius);
      gfx.endFill(); 
    }
  }

  //hors class token => static
  static async tokenCheckAura() {
    for ( const sourceToken of canvas.tokens.placeables ) {
      if (sourceToken.document.flags.aura !== undefined && sourceToken.document.flags.aura.isSource) await sourceToken.checkSourceAura();
    }
  }

  static tokenDocumentToToken(tokenDocumentId){
    for( const token of canvas.tokens.placeables) {
      if (token.id === tokenDocumentId) return token;
    }
    return null;
  }


  async setPosition(){
    const updateData = {};
    updateData["flags.position.x"] = this.document.x;
    updateData["flags.position.y"] = this.document.y;
    updateData["flags.position.elevation"] = this.document.elevation;
    updateData["flags.position.movement"] = 0;
    await this.document.update(updateData);
    const updateData2 = {flags:{movement:0}};
    this.actor.update(updateData2);
  }

  async resetPosition(){
    const updateData = {};
    const position = this.document.flags.position;
    updateData["x"] = position.x;
    updateData["y"] = position.y;
    updateData["elevation"] = position.elevation;
    updateData["flags.position.movement"] = 0;
    await this.document.update(updateData);
  }


}


