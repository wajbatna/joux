export class MainMenu { constructor(onStart=()=>{}) { this.onStart=onStart; document.getElementById('btn-singleplayer')?.addEventListener('click',()=>this.onStart()); } }
