class PauseMenu {
  constructor(config) {
    this.overworld = config.overworld;
    this.isOpen = false;
    this.element = null;
    this.supabase = config.supabase;
    this.userId = config.userId;
    this.load = 0;
  }

  createMenu() {
    this.element = document.createElement("div");
    this.element.classList.add("pause-menu");
    this.element.innerHTML = `
        <div class="pause-menu-content">
          <h1>Pause Menu</h1>
          <p>Points: ${this.overworld.money}</p>
          <button class="save-button">Save Game</button>
          <button class="load-button">Load Game</button>
          <button class="resume-button">Resume</button>
          <button class="sign-out-button">Sign Out</button>
        </div>
      `;

    document.body.appendChild(this.element);

    const saveButton = this.element.querySelector(".save-button");
    saveButton.addEventListener("click", () => {
      this.saveGame();
    });

    const loadButton = this.element.querySelector(".load-button");
    loadButton.addEventListener("click", () => {
      this.loadGame();
      this.closeMenu();
      this.overworld.resumeGame();
    });

    const resumeButton = this.element.querySelector(".resume-button");
    resumeButton.addEventListener("click", () => {
      this.closeMenu();
      this.overworld.resumeGame();
    });

    const signOutButton = this.element.querySelector(".sign-out-button");
    signOutButton.addEventListener("click", () => {
      this.signOutUser();
    });
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
      this.closeMenu();
      this.overworld.resumeGame();
    } else {
      this.openMenu();
      this.overworld.pauseGame();
    }
  }

  openMenu() {
    this.createMenu();
    this.isOpen = true;
    this.element.style.display = "block";
  }

  closeMenu() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.isOpen = false;
  }

  async saveGame() {
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
      alert("Game saved successfully!");
    } catch (error) {
      console.error("Error saving game:", error);
      alert("Failed to save game.");
    }
  }


  async loadGame() {

    try {
      const { data, error } = await this.supabase
        .from('game_saves')
        .select('game_data')
        .eq('user_id', this.userId)
        .single();
      if (error) {
        throw error;
      }
      const gameData = data.game_data;
      if (gameData) {
        const overworld = this.overworld;
        const mapName = gameData.mapName;
        const mapConfig = window.OverworldMaps[mapName];
        if (mapConfig) {
          this.overworld.map = new OverworldMap(mapConfig);
          const hero = this.overworld.map.gameObjects.hero;
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
          overworld.money = gameData.money;
          this.overworld.map.currentEventIndex = gameData.progress;
          this.overworld.map.cutsceneSpaces = gameData.cutsceneSpaces;
          this.overworld.map.walls = gameData.walls;
          this.overworld.map.ledges = gameData.ledges;
          overworld.hud.innerHTML = `
        <p class="Hud">Points: ${overworld.money}</p>
      `;
          this.overworld.map.overworld = overworld;
          this.overworld.map.mountObjects();
          if (this.load === 1) {
            alert("Game loaded successfully!");
          } else {
            return 1;
          }
        } else {
          console.error("Map configuration not found for map name:", mapName);
        }
      } else {
        if (this.load === 1) alert("No saved game data found.");
      }
    } catch (error) {
      console.error("Error loading game:", error);
      alert("Failed to load game.");
    }
    this.load = 1;

  }


  init() {

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.toggleMenu();
      }
    });
  }
}

// Initialize PauseMenu when the window loads
window.addEventListener("load", async () => {
  const SUPABASE_URL = "https://ddctemysdgslailkedsw.supabase.co";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkY3RlbXlzZGdzbGFpbGtlZHN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY5NjI4NzYsImV4cCI6MjAzMjUzODg3Nn0.eqTP9vbO-JnyF42oZuf4EMUwOXbTT9pgqRb2uH21X_U";
  const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const {
    data: { session },
  } = await _supabase.auth.getSession();
  if (session) {
    const userId = session.user.id;

    const overworld = new Overworld({
      element: document.querySelector(".game-container"),
    });
    overworld.init();
    const pauseMenu = new PauseMenu({ overworld, supabase: _supabase, userId });
    pauseMenu.loadGame()

    pauseMenu.init();
  } else {
    console.error("User is not authenticated.");
    window.location.href = "index.html";
  }
});
