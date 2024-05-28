class Overworld {
  constructor(config) {
    this.element = config.element;
    this.hud = null;
    this.canvas = this.element.querySelector(".game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.map = null;
    this.money = 0;         //money
    this.isPaused = false; // Track if the game is paused
    this.supabase = supabase.createClient('https://your-project-id.supabase.co', 'your-anon-key');
  }

  async authenticate(email, password, endpoint) {
    try {
      let response;
      if (endpoint === '/login') {
        response = await this.supabase.auth.signInWithPassword({ email, password });
      } else if (endpoint === '/signup') {
        response = await this.supabase.auth.signUp({ email, password });
      }

      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  init() {
    this.showLoginScreen();
  }

  showLoginScreen() {
    const container = document.querySelector(".game-container");
    container.innerHTML = `
      <div class="login-container">
        <h1>Login</h1>
        <form id="login-form">
          <input type="email" id="login-email" placeholder="Email" required>
          <input type="password" id="login-password" placeholder="Password" required>
          <button type="submit">Login</button>
        </form>
        <p>Don't have an account? <a href="#" id="show-signup">Sign up</a></p>
      </div>
      <div class="signup-container" style="display: none;">
        <h1>Sign Up</h1>
        <form id="signup-form">
          <input type="email" id="signup-email" placeholder="Email" required>
          <input type="password" id="signup-password" placeholder="Password" required>
          <button type="submit">Sign Up</button>
        </form>
        <p>Already have an account? <a href="#" id="show-login">Login</a></p>
      </div>
    `;

    document.getElementById("login-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      this.authenticate(email, password, '/login').then(data => {
        this.startGame();
      }).catch(error => {
        alert(error.message);
      });
    });

    document.getElementById("signup-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;
      this.authenticate(email, password, '/signup').then(data => {
        this.startGame();
      }).catch(error => {
        alert(error.message);
      });
    });

    document.getElementById("show-signup").addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector(".login-container").style.display = "none";
      document.querySelector(".signup-container").style.display = "block";
    });

    document.getElementById("show-login").addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelector(".signup-container").style.display = "none";
      document.querySelector(".login-container").style.display = "block";
    });
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


