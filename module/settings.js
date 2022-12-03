export const registerSystemSettings = function() {

    // Internal System Migration Version
    game.settings.register("arsdd", "systemMigrationVersion", {
      name: "System Migration Version",
      scope: "world",
      config: false,
      type: String,
      default: ""
    });

    game.settings.register("arsdd", "movementByGrid", {
      name: "Mouvement case par case",
      scope: "world",
      config: true,
      type: Boolean,
      default: false
    });

    game.settings.register("arsdd", "travelGroup", {
      name: "Terrain de voyage",
      scope: "world",
      config: false,
      type: Object,
      default: {
        principalTravel:false,
        secundaryTravel:false,
        restTravel:false,
        distanceMode:true,
        dayMode:true,
        forcedMalus:0,
        travelStage : {
          distance:0,
          difficulty:0,
          properties:[]
        },
        knowledge:[],
        resources:{
          currency: {
            value: 0,
            home:0
          },
          ration: {
            value: 0,
            home:0
          },
          virtus: {
            aqu: {
              value: 0,
              home:0
            },
            aur: {
              value: 0,
              home:0
            },	
            ign: {
              value: 0,
              home:0
            },
            ima: {
              value: 0,
              home:0
            },
            lum: {
              value: 0,
              home:0
            },		
            noc: {
              value: 0,
              home:0
            },		
            ter: {
              value: 0,
              home:0
            },		
            cor: {
              value: 0,
              home:0
            },		
            fat: {
              value: 0,
              home:0
            },		
            men: {
              value: 0,
              home:0
            },		
            spi: {
              value: 0,
              home:0
            },		
            vim: {
              value: 0,
              home:0
            }		
          }
        },
        items:[],
        actors:[]
      }
    });


    game.keybindings.register("arsdd", "sneakyDoor", {
      name: "Quiet Door hotkey",
      hint: "Use this key when opening/closing or locking/unlocking a door ",
      editable: [
        {
        key: "AltLeft"
        }
      ],
      precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
    });
  


};
