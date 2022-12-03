/** @override */
export const measureDistances = function(segments, options={}) {
  if ( !options.gridSpaces ) return BaseGrid.prototype.measureDistances.call(this, segments, options);
  const gridPixel = canvas.dimensions.size;
  const gridUnits = canvas.scene.gridDistance;

  // Iterate over measured segments
  return segments.map(s => {
    let r = s.ray;
    // Determine the total distance traveled
    let nx = Math.abs(Math.ceil(r.dx / gridPixel) * gridUnits);
    let ny = Math.abs(Math.ceil(r.dy / gridPixel) * gridUnits);
    // Standard PHB Movement
    return Math.max(nx, ny);
  });
};

export function canvasInitializeTokenControl() {
  let isReload = this._reload.scene === this.scene.id;
  let panToken = null;

  // Initial tokens based on reload data
  let controlledTokens = isReload ? this._reload.controlledTokens.map(id => canvas.tokens.get(id)) : [];
  if ( !isReload && !game.user.isGM ) {

    // Initial tokens based on primary character
    controlledTokens = game.user.character?.getActiveTokens() || [];

    // Based on owned actors
/*     if (!controlledTokens.length) {
      controlledTokens = canvas.tokens.placeables.filter(t => t.actor?.testUserPermission(game.user, "OWNER"));
    }

    // Based on observed actors
     if (!controlledTokens.length) {
      const observed = canvas.tokens.placeables.filter(t => t.actor?.testUserPermission(game.user, "OBSERVER"));
      panToken = observed.shift() || null;
    }  */
  }

  // Initialize Token Control
  for ( let token of controlledTokens ) {
    if ( !panToken ) panToken = token;
    token.control({releaseOthers: false});
  }

  // Initialize Token targets
  const targetedTokens = isReload ? this._reload.targetedTokens : [];
  for ( let id of targetedTokens ) {
    const token = canvas.tokens.get(id);
    token.setTarget(true, {releaseOthers: false, groupSelection: true});
  }

  // Pan camera to controlled token
  if ( panToken && !isReload ) this.pan({x: panToken.center.x, y: panToken.center.y, duration: 250});
}







