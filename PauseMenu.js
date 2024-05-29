class PauseMenu {
    constructor(config) {
        this.overworld = config.overworld;
        this.isOpen = false;
        this.element = null;
        this.supabase = config.supabase;
        this.userId = config.userId;
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
                    overworld.hud.innerHTML = `
              <p class="Hud">Points: ${overworld.money}</p>
            `;
                    this.overworld.map.overworld = overworld;
                    this.overworld.map.mountObjects();

                    alert("Game loaded successfully!");
                } else {
                    console.error("Map configuration not found for map name:", mapName);
                }
            } else {
                alert("No saved game data found.");
            }
        } catch (error) {
            console.error("Error loading game:", error);
            alert("Failed to load game.");
        }
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
    const supabase = createSupabaseClient('https://elyjkbpahblqfdfmkjck.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVseWprYnBhaGJscWZkZm1ramNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY5MDgxNzAsImV4cCI6MjAzMjQ4NDE3MH0.SBe4n-q37RrcTA4CtYO9K2AZiZwLnp4mHmOqpxbt5Uc');
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const userId = session.user.id;
        const overworld = new Overworld({
            element: document.querySelector(".game-container")
        });
        overworld.init();

        const pauseMenu = new PauseMenu({ overworld, supabase, userId });
        pauseMenu.init();
    } else {
        console.error("User is not authenticated.");
    }
});

// Supabase client creation
function createSupabaseClient(url, key) {
    return {
        auth: {
            signInWithOAuth: async ({ provider }) => {
                return await fetch(`${url}/auth/v1/oauth/authorize?provider=${provider}`, {
                    method: 'GET',
                    headers: {
                        'apikey': key,
                        'Content-Type': 'application/json'
                    }
                }).then(res => res.json());
            },
            getSession: async () => {
                const session = localStorage.getItem('supabase.auth.token');
                return { data: { session: session ? JSON.parse(session) : null } };
            },
            onAuthStateChange: (callback) => {
                window.addEventListener('storage', () => {
                    const session = localStorage.getItem('supabase.auth.token');
                    callback(null, session ? JSON.parse(session) : null);
                });
            }
        },
        from: (table) => {
            return {
                select: async (columns) => {
                    return await fetch(`${url}/rest/v1/${table}?select=${columns}`, {
                        headers: {
                            'apikey': key,
                            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
                        }
                    }).then(res => res.json());
                },
                upsert: async (data, options) => {
                    return await fetch(`${url}/rest/v1/${table}`, {
                        method: 'POST',
                        headers: {
                            'apikey': key,
                            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'resolution=merge-duplicates'
                        },
                        body: JSON.stringify(data)
                    }).then(res => res.json());
                },
                eq: (column, value) => {
                    return {
                        single: async () => {
                            return await fetch(`${url}/rest/v1/${table}?${column}=eq.${value}`, {
                                headers: {
                                    'apikey': key,
                                    'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
                                }
                            }).then(res => res.json());
                        }
                    }
                }
            }
        }
    }
}
