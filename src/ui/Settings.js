export class Settings { constructor(storage) { this.storage=storage; } get(key,fallback){return this.storage?.get(key,fallback)??fallback;} set(key,value){this.storage?.set(key,value);} }
