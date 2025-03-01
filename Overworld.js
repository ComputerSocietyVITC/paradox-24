class Overworld {
  constructor(config) {
    this.element = config.element;
    this.hud = null;
    this.canvas = this.element.querySelector(".game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.map = null;
    this.money = 0;         //money
    this.isPaused = false; // Track if the game is paused
    this.badges = [];      //badges
  }

  startGameLoop() {
    const step = () => {
      if (!this.isPaused) { // Only execute if the game is not paused
        // Clear off the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Establish the camera person
        const cameraPerson = this.map.gameObjects.hero;

        // Update all objects
        Object.values(this.map.gameObjects).forEach((object) => {
          object.update({
            arrow: this.directionInput.direction,
            map: this.map,
          });
        });

        // Draw Lower layer
        this.map.drawLowerImage(this.ctx, cameraPerson);

        // Draw Game Objects
        Object.values(this.map.gameObjects)
          .sort((a, b) => {
            return a.y - b.y;
          })
          .forEach((object) => {
            object.sprite.draw(this.ctx, cameraPerson);
          });

        // Draw Upper layer
        this.map.drawUpperImage(this.ctx, cameraPerson);

        requestAnimationFrame(step);
      }
    };
    step();
  }

  pauseGame() {
    this.isPaused = true;
  }

  resumeGame() {
    if (this.isPaused) {
      this.isPaused = false;
      this.startGameLoop(); // Call startGameLoop() only if the game was paused
    }
  }

  bindActionInput() {
    new KeyPressListener("Enter", () => {
      // Is there a person here to talk to?
      this.map.checkForActionCutscene();
    });
  }

  bindHeroPositionCheck() {  
    document.addEventListener("PersonWalkingComplete", (e) => {
      if (e.detail.whoId === "hero") {
        // Hero's position has changed
        this.map.checkForFootstepCutscene();
      }
    });
  }

  startMap(mapConfig) {
    this.map = new OverworldMap(mapConfig);
    this.map.overworld = this;
    this.cameraPerson = this.map.gameObjects.hero;
    this.map.mountObjects();
  }

  async updateAll(object) {

      this.hud.innerHTML = `
            <p class="points">Points: ${this.money}</p> 
        `;
        
      const moneyElement = window.pauseMenu.element.querySelector(".pause-menu-content p");       //Update PauseMenu
      moneyElement.textContent = `Points: ${this.money}`;

      const badgeElement = window.pauseMenu.element.querySelector(".badge-container");    //Update PauseMenu
      badgeElement.innerHTML = `
      ${this.badges.length > 0 ?
        this.badges.map(badgeObj => `
            <div style="display: flex; align-items: center; margin: 5px;">
              <img src="${badgeObj.badgeImgPath}" alt="Badge Image" style="height: 1em; margin-right: 5px;">
              <p style="margin: 0;">${badgeObj.badge}</p>
            </div>
          `).join('')
        :
        '<p>No Achievements :(</p>'
      }
    `;

  }

  initHud() {   

    //Create the element
    this.hud = document.createElement("p");
    this.hud.classList.add("points");

    //NOTE: make this into some decent thingS
    this.hud.innerHTML = (`              
      <p class="points">Points: ${this.money}</p> 
  `)

    this.element.appendChild(this.hud);
  }

  init() {
    this.startMap(window.OverworldMaps.DemoRoom);
    this.bindActionInput();
    this.bindHeroPositionCheck();

    this.directionInput = new DirectionInput();
    this.directionInput.init();

    this.initHud();

    this.startGameLoop();
    this.map.startCutscene([
      { who: "hero", type: "walk", direction: "down" },
      { who: "hero", type: "walk", direction: "down" },
      { who: "hero", type: "stand", direction: "right" },
      { who: "npcA", type: "walk", direction: "left" },
      { who: "npcA", type: "walk", direction: "up" },
      { who: "npcA", type: "stand", direction: "left" },
      { type: "textMessage", text: "Hello, Player! Welcome to Paradox..." },
      {
        type: "textMessage",
        text: "I am Harshit, I will explain you the mechanics and rules for the game...",
      },
    ]);

    // Make overworld globally accessible
    window.overworld = this;

  }
}

// NOTE: make initial_init() and load_game_init()
// a way to include cutscenes and play them (prolly just as events)
// refresh rate speed thing
// NOTE: player position in last map waala removeWall() hataa bhai
// update what is being saved and loaded
// update stuff using window.XYZ