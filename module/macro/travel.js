/*
gestion de game.settings.get("arsdd", "travelGroup")

    //mode rando - options de groupes
      //principalTravel, secundaryTravel, restTravel : definir si on voyage ou pas sur les 3 parties de la journee
      //distanceMode : mode de calcul en distance ou en temps
      //dayMode : en jour ou en semaine
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
          virtus: {aqu: {value: 0,home:0}, ...
        },
        items:[]
        actors : []
*/


export default class TravelArsDD {
  constructor() {
    this.data = game.settings.get("arsdd", "travelGroup");
  }

  get data() {
    return this.data;
  }

  async set(){
    await game.settings.set("arsdd", "travelGroup", this.data);
  }

}
