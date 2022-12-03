export default class JournalSheetArsDD extends JournalSheet {
  /** @override */
  get template() {
    if ( this._sheetMode === "image" ) return ImagePopout.defaultOptions.template;
    return "templates/journal/sheet.html";
  }
}