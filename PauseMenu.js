class PauseMenu {
  constructor(config) {
    this.overworld = config.overworld;
    this.isOpen = false;
    this.element = null;
    this.supabase = config.supabase;
    this.userId = config.userId;
  }
  updateMoneyDisplay() {
    const moneyElement = this.element.querySelector(".pause-menu-content p");
    moneyElement.textContent = `Points: ${this.overworld.money}`;
  }
  createMenu() {

    if (this.element) {
      this.element.remove();
    }

    this.element = document.createElement("div");
    this.element.classList.add("pause-menu");
    this.element.innerHTML = `
        <div class="pause-menu-content">
          <h1>Pause Menu</h1>
          <p>Points: ${this.overworld.money}</p>
          <button class="save-button">Save Game</button>
          <button class="load-button">Load Game</button>
          <button class="achievements-button">Achievements</button>
          <button class="resume-button">Resume</button>
          <button class="sign-out-button">Sign Out</button>
        </div>
        <div class="achievements-content">
          <h1>Achievements</h1>
          <div class="badge-container" style="display: flex; flex-wrap: wrap;">
              ${this.overworld.badges.length > 0 ?

        this.overworld.badges.map(badgeObj => `
                  <div style="display: flex; align-items: center; margin: 5px;">
                    <img src="${badgeObj.badgeImgPath}" alt="Badge Image" style="height: 1em; margin-right: 5px;">
                    <p style="margin: 0;">${badgeObj.badge}</p>
                  </div>
                `).join('')
        :
        '<p>No Achievements :(</p>'
      }
            </div>
          <button class="back-button" >Back</button>
          <button class="resume-button achievements-resume-button">Resume Game</button>
        </div>
      `;

    this.overworld.element.appendChild(this.element);

    const saveButton = this.element.querySelector(".save-button");
    saveButton.addEventListener("click", () => {
      this.saveGame(false);
    });

    const loadButton = this.element.querySelector(".load-button");
    loadButton.addEventListener("click", () => {
      this.loadGame(false);
      this.toggleMenu();
    });

    const resumeButton = this.element.querySelector(".resume-button");
    resumeButton.addEventListener("click", () => {
      this.toggleMenu();
    });

    const signOutButton = this.element.querySelector(".sign-out-button");
    signOutButton.addEventListener("click", () => {
      this.signOutUser();
    });

    const achievementsButton = this.element.querySelector(".achievements-button");
    achievementsButton.addEventListener("click", () => {
      this.showAchievements();
    });

    const backButton = this.element.querySelector(".back-button");
    backButton.addEventListener("click", () => {
      this.showPauseMenu();
    });

    const achievementsResumeButton = this.element.querySelector(".achievements-resume-button");
    achievementsResumeButton.addEventListener("click", () => {
      this.toggleMenu();
    });
  }

  showAchievements() {
    const pauseMenuContent = this.element.querySelector(".pause-menu-content");
    const achievementsContent = this.element.querySelector(".achievements-content");

    pauseMenuContent.style.display = "none";
    achievementsContent.style.display = "flex";
  }

  showPauseMenu() {
    const pauseMenuContent = this.element.querySelector(".pause-menu-content");
    const achievementsContent = this.element.querySelector(".achievements-content");

    pauseMenuContent.style.display = "flex";
    achievementsContent.style.display = "none";
  }

  async signOutUser() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        throw error;
      }
      // Redirect to the login page
      window.location.href = "index.html";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  toggleMenu() {
    if (this.isOpen) {
      this.element.style.display = "none";   //close
      this.overworld.resumeGame();
    } else {
      this.overworld.pauseGame();
      this.element.style.display = "block";    //open
      this.updateMoneyDisplay();
    }
    this.isOpen = !this.isOpen;
  }

  async saveGame(flag) {
    if (!this.overworld) {
      console.error("Overworld is not defined.");
      return;
    }
    const overworld = this.overworld;
    const map = this.overworld.map;
    const gameObjects = map.gameObjects;
    const gameData = {
      mapName: map.mapName,
      money: overworld.money,
      badges: overworld.badges,
      progress: map.currentEventIndex || 0,
      gameObjects: Object.entries(gameObjects).reduce((acc, [key, obj]) => {
        acc[key] = {
          x: obj.x,
          y: obj.y,
          direction: obj.direction,
          behaviorLoop: obj.behaviorLoop,
          talking: obj.talking,
        };
        return acc;
      }, {}),
      cutsceneSpaces: map.cutsceneSpaces,
      walls: map.walls,
      ledges: map.ledges,
    };
    try {
      const { data, error } = await this.supabase
        .from('game_saves')
        .upsert([{ user_id: this.userId, game_data: gameData }], { onConflict: ['user_id'] });
      if (error) {
        throw error;
      }
      if (!flag) alert("Game saved successfully!");
    } catch (error) {
      console.error("Error saving game:", error);
      alert("Failed to save game.");
    }
  }

  async loadGame(initialLoad = false) {
    try {
      const { data, error } = await this.supabase
        .from('game_saves')
        .select('game_data')
        .eq('user_id', this.userId)
        .single();
      if (error) {
        throw error;
      }

      console.log("Check saved state: ", data.game_data ? true : false);
      if (!(data.game_data ? true : false)) {
        return false;
      }

      const gameData = data.game_data;
      if (gameData) {

        this.overworld.money = gameData.money;
        this.overworld.badges = gameData.badges;

        if (!initialLoad) {
          const hero = this.overworld.map.gameObjects.hero;
          this.overworld.map.removeWall(hero.x, hero.y);
        }

        const mapName = gameData.mapName;
        const mapConfig = window.OverworldMaps[mapName];
        this.overworld.startMap(mapConfig);
        this.overworld.bindActionInput();            //NOTE: Remove event listeners properly
        this.overworld.bindHeroPositionCheck();

        if (initialLoad) {
          this.overworld.directionInput = new DirectionInput();
          this.overworld.directionInput.init();
          this.overworld.initHud();
          this.overworld.startGameLoop();
        }

        window.overworld = this;

        const hero = this.overworld.map.gameObjects.hero;
        this.overworld.map.removeWall(hero.x, hero.y);

        const gameObjects = gameData.gameObjects;
        Object.entries(gameObjects).forEach(([key, obj]) => {
          const gameObject = this.overworld.map.gameObjects[key];
          if (gameObject) {
            gameObject.x = obj.x;
            gameObject.y = obj.y;
            gameObject.direction = obj.direction;
            gameObject.behaviorLoop = obj.behaviorLoop;
            gameObject.talking = obj.talking;
          }
        });
        hero.x = gameObjects.hero.x;
        hero.y = gameObjects.hero.y;

        //NOTE: do this properly
        // this.overworld.map.currentEventIndex = gameData.progress;    
        // this.overworld.map.cutsceneSpaces = gameData.cutsceneSpaces;


        if (!initialLoad) {
          alert("Game loaded successfully!");
        }

        return true;

      } else {
        if (!initialLoad) {
          alert("No saved game data found.");
        }
      }
    } catch (error) {
      console.error("Error loading game:", error);
      if (!initialLoad) {
        alert("Failed to load game.");
      }
    }
  }

  init() {

    this.createMenu();

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.toggleMenu();
      }
    });
  }
}