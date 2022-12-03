export const migrateWorld = async function() {
  ui.notifications.info(`Arsdd System Migration version ${game.system.version}. `, {permanent: true});

  // Migrate World Actors
  for ( let a of game.actors ) {
    try {
      const updateData = migrateActorData(a.Object());
      if ( !foundry.utils.isObjectEmpty(updateData) ) {
        console.log(`Migrating Actor document ${a.name}`);
        await a.update(updateData, {enforceTypes: false});
      }
    } catch(err) {
      err.message = `Failed arsdd system migration for Actor ${a.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Items
  for ( let i of game.items ) {
    try {
      const updateData = migrateItemData(i.Object()); 
      if ( !foundry.utils.isObjectEmpty(updateData) ) {
        console.log(`Migrating Item document ${i.name}`);
        await i.update(updateData, {enforceTypes: false});
      }
    } catch(err) {
      err.message = `Failed arsdd system migration for Item ${i.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Macros
  for ( const m of game.macros ) {
    try {
      const updateData = migrateMacroData(m.Object()); 
      if ( !foundry.utils.isObjectEmpty(updateData) ) {
        console.log(`Migrating Macro document ${m.name}`);
        await m.update(updateData, {enforceTypes: false});
      }
    } catch(err) {
      err.message = `Failed arsdd system migration for Macro ${m.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate Actor Override Tokens
  for ( let s of game.scenes ) {
    try {
      const updateData = migrateSceneData(s.data);
      if ( !foundry.utils.isObjectEmpty(updateData) ) {
        console.log(`Migrating Scene document ${s.name}`);
        await s.update(updateData, {enforceTypes: false});
        // If we do not do this, then synthetic token actors remain in cache
        // with the un-updated actorData.
        s.tokens.forEach(t => t._actor = null);
      }
    } catch(err) {
      err.message = `Failed arsdd system migration for Scene ${s.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Compendium Packs
  for ( let p of game.packs ) {
    if ( p.metadata.package !== "world" ) continue;
    if ( !["Actor", "Item", "Scene"].includes(p.documentName) ) continue;
    await migrateCompendium(p);
  }

  // Set the migration as complete
  game.settings.set("arsdd", "systemMigrationVersion", game.system.version);
  ui.notifications.info(`arsdd System Migration to version ${game.system.version} completed!`, {permanent: true});
};

export const migrateCompendium = async function(pack) {
  const documentName = pack.documentName;
  if ( !["Actor", "Item", "Scene"].includes(documentName) ) return;

  // Unlock the pack for editing
  const wasLocked = pack.locked;
  await pack.configure({locked: false});

  // Begin by requesting server-side data model migration and get the migrated content
  await pack.migrate();
  const documents = await pack.getDocuments();

  // Iterate over compendium entries - applying fine-tuned migration functions
  for ( let doc of documents ) {
    let updateData = {};
    try {
      switch (documentName) {
        case "Actor":
          updateData = migrateActorData(doc.Object()); 
          break;
        case "Item":
          updateData = migrateItemData(doc.Object()); 
          break;
        case "Scene":
          updateData = migrateSceneData(doc.data);
          break;
      }

      // Save the entry, if data was changed
      if ( foundry.utils.isObjectEmpty(updateData) ) continue;
      await doc.update(updateData);
      console.log(`Migrated ${documentName} document ${doc.name} in Compendium ${pack.collection}`);
    }

    // Handle migration failures
    catch(err) {
      err.message = `Failed arsdd system migration for document ${doc.name} in pack ${pack.collection}: ${err.message}`;
      console.error(err);
    }
  }

  // Apply the original locked status for the pack
  await pack.configure({locked: wasLocked});
  console.log(`Migrated all ${documentName} documents from Compendium ${pack.collection}`);
};

/* -------------------------------------------- */
/*  Document Type Migration Helpers             */
/* -------------------------------------------- */

export const migrateActorData = function(actor) {
  const updateData = {};

  // Actor Data Updates
  if (actor.data ) {
    //news


    updateData["attributes.movement.travelRole"]= [];
    updateData["attributes.movement.travelSpeedOption"]=0;
    updateData["attributes.resources.ration.value"]=0;
    updateData["attributes.resources.ration.home"]=0;

  }

  // Migrate Owned Items
  if ( !actor.items ) return updateData;
  const items = actor.items.reduce((arr, i) => {
    // Migrate the Owned Item
    const itemData = i instanceof CONFIG.Item.documentClass ? i.Object() : i; 
    let itemUpdate = migrateItemData(itemData);
    // Update the Owned Item
    if ( !isObjectEmpty(itemUpdate) ) {
      itemUpdate._id = itemData._id;
      arr.push(expandObject(itemUpdate));
    }
    return arr;
  }, []);
  if ( items.length > 0 ) updateData.items = items;
  return updateData;
};


export const migrateItemData = function(item) {
  const updateData = {};

  return updateData;
};

export const migrateMacroData = function(macro) {
  const updateData = {};

  return updateData;
};

export const migrateSceneData = function(scene) {
  const tokens = scene.tokens.map(token => {
    const t = token.toObject(); 
    const update = {};
    if ( Object.keys(update).length ) foundry.utils.mergeObject(t, update);
    if ( !t.actorId || t.actorLink ) {
      t.actorData = {};
    }
    else if ( !game.actors.has(t.actorId) ) {
      t.actorId = null;
      t.actorData = {};
    }
    else if ( !t.actorLink ) {
      const actorData = duplicate(t.actorData);
      actorData.type = token.actor?.type;
      const update = migrateActorData(actorData);
      ["items", "effects"].forEach(embeddedName => {
        if (!update[embeddedName]?.length) return;
        const updates = new Map(update[embeddedName].map(u => [u._id, u]));
        t.actorData[embeddedName].forEach(original => {
          const update = updates.get(original._id);
          if (update) mergeObject(original, update);
        });
        delete update[embeddedName];
      });

      mergeObject(t.actorData, update);
    }
    return t;
  });
  return {tokens};
};



