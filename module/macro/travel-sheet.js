import TravelArsDD from "./travel.js";
import pcList from "./macros.js";

export default class TravelSheetArsDD extends FormApplication {

  /** @override */
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
      classes: ["arsdd"],
      template: "systems/arsdd/template/apps/travel-sheet.html",
      width: 100,
      height: auto
    });
  }

  /** @override */
  getData(options) {
    const data = {};
    data.travel = new TravelArsDD();
    data.actors = pcList();

    return data;
  }

    /** @override */
  activateListeners(html) {


    // Handle default listeners last so system listeners are triggered first
    super.activateListeners(html);
  }

}