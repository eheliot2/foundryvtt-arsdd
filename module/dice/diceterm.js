export default class DieArsDD extends Die {
  static DENOMINATION = "a";

  constructor(termData) {
    termData.faces = 10;
    super(termData);
  }

  async evaluate() {
    this.options.ddd = this.number;
    this.number = 1;
    super.evaluate();
    if (this.results[0].result ===10 ){
      this.number=this.options.ddd;
      this._evaluated=false;
      this.modifiers=["cs=10"];
      super.evaluate();
      return this;
    }
    this.explode("x=1");
    return this;
  }

  get total() {
    if ( !this._evaluated ) return null;
    if (this.modifiers.length > 0) return 1-super.total;
    return this.results.reduce((t, r, i,a) => {
      if ( !r.active ) return t;
      if (i === 0 && r.result === 10) {
        return 0;
      }
      if (i === 0 && r.result === 1) return 2;
      if (i === 0 && r.result !== 10 && r.result !== 1) return r.result;
      if (r.result === 1) return t *2;
      return t * r.result; 
    }, 0);
  }
}