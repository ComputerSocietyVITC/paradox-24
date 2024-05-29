class Overworld {
  constructor(config) {
    this.element = config.element;
    this.hud = null;
    this.canvas = this.element.querySelector(".game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.map = null;
    this.money = 0;         //money
    this.isPaused = false; // Track if the game is paused
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
    this.isPaused = false;
    this.startGameLoop();
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

  setMoney(object) {

    if (object.event.qsnValue > 0) {
      console.log(object.event.qsnValue);

      this.map.overworld.money += object.event.qsnValue;
      object.event.qsnValue = 0;

      this.element.innerHTML = (`
        <p class="Hud">Points: ${this.map.overworld.money}</p> 
    `)
    }
    console.log(this.money);
  }


  initMoney(container) {

    //Create the element
    this.element = document.createElement("div");
    this.element.classList.add("Hud");

    this.element.innerHTML = (`
      <p class="Hud">Points: ${this.money}</p> 
  `)


    container.appendChild(this.element);

    this.hud = document.querySelector(".Hud");
  }

  init() {
    this.startMap(window.OverworldMaps.DemoRoom);
    this.bindActionInput();
    this.bindHeroPositionCheck();

    this.directionInput = new DirectionInput();
    this.directionInput.init();

    this.initMoney(document.querySelector(".game-container"));

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

    // Initialize PauseMenu
    this.pauseMenu = new PauseMenu({ overworld: this });
    this.pauseMenu.init();

    // Make overworld globally accessible
    window.overworld = this;
  }
}


