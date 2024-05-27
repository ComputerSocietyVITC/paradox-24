class PauseMenu {
    constructor(config) {
        this.overworld = config.overworld;
        this.isOpen = false;
        this.element = null;
    }

    createMenu() {
        this.element = document.createElement("div");
        this.element.classList.add("pause-menu");
        this.element.innerHTML = `
        <div class="pause-menu-content">
          <h1>Pause Menu</h1>
          <p>Points: ${this.overworld.overlay.money}</p>
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

    saveGame() {
        if (!this.overworld) {
            console.error("Overworld is not defined.");
            return;
        }

        const overlay = this.overworld.overlay;
        const map = this.overworld.map;
        const hero = map.gameObjects.hero;

        const gameData = {
            money: overlay.money,
            progress: map.currentEventIndex || 0, // Assuming currentEventIndex tracks the progress of the game
            userPosition: { x: hero.x, y: hero.y }, // Assuming position is stored in the hero object
            // Add other game data you want to save here
        };

        localStorage.setItem('gameData', JSON.stringify(gameData));
        const jsonData = JSON.stringify(gameData);
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "game-save.json";
        a.click();
        URL.revokeObjectURL(url);


        alert("Game saved successfully!");
    }

    loadGame() {
        const gameData = JSON.parse(localStorage.getItem('gameData'));
        if (gameData) {
            const overlay = this.overworld.overlay;
            const map = this.overworld.map;
            const hero = map.gameObjects.hero;

            overlay.money = gameData.money;
            map.currentEventIndex = gameData.progress;
            hero.x = gameData.userPosition.x;
            hero.y = gameData.userPosition.y;

            overlay.element.innerHTML = `
          <p class="Hud">Points: ${overlay.money}</p>
        `;

            alert("Game loaded successfully!");
        } else {
            alert("No saved game data found.");
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
window.addEventListener("load", () => {
    const overworld = window.overworld;
    if (overworld) {
        const pauseMenu = new PauseMenu({ overworld: overworld });
        pauseMenu.init();
    } else {
        console.error("Overworld is not defined on window.");
    }
});
