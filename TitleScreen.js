class TitleScreen{

    constructor(well){
        this.element = null;
        this.open = false;
        this.overworld = well.overworld;
        this.pauseMenu = well.pauseMenu;
    }

    createMenu(){
        this.element = document.createElement("div");
        this.element.classList.add("title-screen");
        this.element.innerHTML = `
            <div class="title-screen">
              <h1>Title Screen :)</h1> 
              <button class="new-game-button">New Game</button> 
              <button class="load-button">Load Game</button>  
              <button class="sign-out-button">Sign Out</button>
            </div>
          `;
    
        document.body.appendChild(this.element);
        
        const newGameButton = this.element.querySelector(".new-game-button");
        newGameButton.addEventListener("click", () => {
          this.closeMenu();
          this.overworld.init();
        });
    
        const loadButton = this.element.querySelector(".load-button");
        loadButton.addEventListener("click", () => {
            if ((pauseMenu.loadGame(true))) {  
                this.closeMenu();
              }
        });
    
        const signOutButton = this.element.querySelector(".sign-out-button");
        signOutButton.addEventListener("click", () => {
          this.closeMenu();
          this.pauseMenu.signOutUser();
        });
    
    }

    closeMenu(){
        this.element.style.display = "none";
    }
}