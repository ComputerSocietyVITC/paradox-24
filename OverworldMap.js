class OverworldMap {
  constructor(config) {
    this.overworld = null;

    this.gameObjects = config.gameObjects;
    this.cutsceneSpaces = config.cutsceneSpaces || {};
    this.walls = config.walls || {};

    this.lowerImage = new Image();
    this.lowerImage.src = config.lowerSrc;

    this.upperImage = new Image();
    this.upperImage.src = config.upperSrc;

    this.isCutscenePlaying = false;
    this.initialCutscenePlayed = false; // Flag to track if the initial cutscene has been played
    this.secondCutscenePlayed = false; // Flag to track if the second cutscene has been played
  }

  drawLowerImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.lowerImage,
      utils.withGrid(10.5) - cameraPerson.x,
      utils.withGrid(6) - cameraPerson.y
    );
  }

  drawUpperImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.upperImage,
      utils.withGrid(10.5) - cameraPerson.x,
      utils.withGrid(6) - cameraPerson.y
    );
  }

  isSpaceTaken(currentX, currentY, direction) {
    const { x, y } = utils.nextPosition(currentX, currentY, direction);
    return this.walls[`${x},${y}`] || false;
  }

  mountObjects() {
    Object.keys(this.gameObjects).forEach((key) => {
      let object = this.gameObjects[key];
      object.id = key;

      //TODO: determine if this object should actually mount
      object.mount(this);
    });

    // Start initial cutscene only if it hasn't been played yet
    if (!this.initialCutscenePlayed) {
      this.startInitialCutscene();
      this.initialCutscenePlayed = true; // Set the flag to true after playing the initial cutscene
    }
  }

  async startCutscene(events) {
    this.isCutscenePlaying = true;

    for (let i = 0; i < events.length; i++) {
      const eventHandler = new OverworldEvent({
        event: events[i],
        map: this,
        overlay: this.overworld.overlay
      });
      await eventHandler.init();
    }

    this.isCutscenePlaying = false;

    // Reset NPCs to do their idle behavior
    Object.values(this.gameObjects).forEach((object) =>
      object.doBehaviorEvent(this)
    );
  }

  startInitialCutscene() {
    const initialCutscene = this.cutsceneSpaces[utils.asGridCoord(5, 6)]; // Define the starting coordinates or a unique key
    if (initialCutscene) {
      this.startCutscene(initialCutscene[0].events);
    }
  }

  startSecondCutscene() {
    const secondCutscene = this.cutsceneSpaces[utils.asGridCoord(5, 6)]; // Define the coordinates for the second cutscene
    if (secondCutscene && !this.secondCutscenePlayed) {
      this.startCutscene(secondCutscene[0].events);
      this.secondCutscenePlayed = true; // Set the flag to true after playing the second cutscene
    }
  }

  checkForActionCutscene() {
    const hero = this.gameObjects["hero"];
    const nextCoords = utils.nextPosition(hero.x, hero.y, hero.direction);
    const match = Object.values(this.gameObjects).find((object) => {
      return `${object.x},${object.y}` === `${nextCoords.x},${nextCoords.y}`;
    });
    if (!this.isCutscenePlaying && match && match.talking.length) {
      this.startCutscene(match.talking[0].events);
    }
  }

  checkForFootstepCutscene() {
    const hero = this.gameObjects["hero"];
    const match = this.cutsceneSpaces[`${hero.x},${hero.y}`];
    if (!this.isCutscenePlaying && match) {
      this.startCutscene(match[0].events);
    }
  }

  addWall(x, y) {
    this.walls[`${x},${y}`] = true;
  }
  removeWall(x, y) {
    delete this.walls[`${x},${y}`];
  }
  moveWall(wasX, wasY, direction) {
    this.removeWall(wasX, wasY);
    const { x, y } = utils.nextPosition(wasX, wasY, direction);
    this.addWall(x, y);
  }
}

window.OverworldMaps = {
  // Overlay : {
  //   src: "/images/characters/people/npc2.png",
  //   offset: 0
  // },
  DemoRoom: {
    lowerSrc: "/images/maps/DemoLower.png",
    upperSrc: "/images/maps/DemoUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(6),
      }),
      npcA: new Person({
        x: utils.withGrid(7),
        y: utils.withGrid(9),
        src: "/images/characters/people/npc1.png",
        behaviorLoop: [
          { type: "stand", direction: "left", time: 800 },
          { type: "stand", direction: "up", time: 800 },
          { type: "stand", direction: "right", time: 1200 },
          { type: "stand", direction: "up", time: 300 },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "I'm busy...", faceHero: "npcA" },
              { type: "textMessage", text: "Go away!" },
            ],
          },
        ],
      }),
      npcB: new Person({
        x: utils.withGrid(8),
        y: utils.withGrid(5),
        src: "/images/characters/people/npc2.png",
        // behaviorLoop: [
        //   { type: "walk",  direction: "left" },
        //   { type: "stand",  direction: "up", time: 800 },
        //   { type: "walk",  direction: "up" },
        //   { type: "walk",  direction: "right" },
        //   { type: "walk",  direction: "down" },
        // ]
      }),
    },
    walls: {
      [utils.asGridCoord(7, 6)]: true,
      [utils.asGridCoord(8, 6)]: true,
      [utils.asGridCoord(7, 7)]: true,
      [utils.asGridCoord(8, 7)]: true,
      [utils.asGridCoord(1, 3)]: true,
      [utils.asGridCoord(2, 3)]: true,
      [utils.asGridCoord(3, 4)]: true,
      [utils.asGridCoord(4, 4)]: true,
      [utils.asGridCoord(5, 3)]: true,
      [utils.asGridCoord(6, 4)]: true,
      [utils.asGridCoord(8, 4)]: true,
      [utils.asGridCoord(9, 3)]: true,
      [utils.asGridCoord(10, 3)]: true,
      [utils.asGridCoord(11, 4)]: true,
      [utils.asGridCoord(11, 5)]: true,
      [utils.asGridCoord(11, 6)]: true,
      [utils.asGridCoord(11, 7)]: true,
      [utils.asGridCoord(11, 8)]: true,
      [utils.asGridCoord(11, 9)]: true,
      [utils.asGridCoord(10, 10)]: true,
      [utils.asGridCoord(9, 10)]: true,
      [utils.asGridCoord(8, 10)]: true,
      [utils.asGridCoord(7, 10)]: true,
      [utils.asGridCoord(6, 10)]: true,
      [utils.asGridCoord(4, 10)]: true,
      [utils.asGridCoord(3, 10)]: true,
      [utils.asGridCoord(2, 10)]: true,
      [utils.asGridCoord(1, 10)]: true,
      [utils.asGridCoord(0, 1)]: true,
      [utils.asGridCoord(0, 2)]: true,
      [utils.asGridCoord(0, 3)]: true,
      [utils.asGridCoord(0, 4)]: true,
      [utils.asGridCoord(0, 5)]: true,
      [utils.asGridCoord(0, 6)]: true,
      [utils.asGridCoord(0, 7)]: true,
      [utils.asGridCoord(0, 8)]: true,
      [utils.asGridCoord(0, 9)]: true,
      [utils.asGridCoord(5, 11)]: true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(7, 4)]: [
        {
          events: [
            { who: "npcB", type: "walk", direction: "left" },
            { who: "npcB", type: "stand", direction: "up", time: 500 },
            { type: "textMessage", text: "You can't be in there!" },
            { who: "npcB", type: "walk", direction: "right" },
            { who: "hero", type: "walk", direction: "down" },
            { who: "hero", type: "walk", direction: "left" },
          ],
        },
      ],
      [utils.asGridCoord(5, 10)]: [
        {
          events: [{ type: "changeMap", map: "Street" }],
        },
      ],
    },
  },
  Street: {
    lowerSrc: "/images/maps/StreetLower.png",
    upperSrc: "/images/maps/StreetUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(10),
      }),
      npcA: new Person({
        x: utils.withGrid(9),
        y: utils.withGrid(11),
        src: "/images/characters/people/npc1.png",
        behaviorLoop: [
          { type: "stand", direction: "left", time: 800 },
          { type: "stand", direction: "up", time: 800 },
          { type: "stand", direction: "right", time: 1200 },
          { type: "stand", direction: "up", time: 300 },
        ],
        talking: [
          {
            events: [
              {
                type: "textMessage",
                text: "to get your task proceed to the shop",
                faceHero: "npcA",
              },
              { type: "textMessage", text: "Go away!" },
            ],
          },
        ],
      }),
      npcB: new Person({
        x: utils.withGrid(19),
        y: utils.withGrid(9),
        src: "/images/characters/people/npc2.png",
        // behaviorLoop: [
        //   { type: "walk",  direction: "left" },
        //   { type: "stand",  direction: "up", time: 800 },
        //   { type: "walk",  direction: "up" },
        //   { type: "walk",  direction: "right" },
        //   { type: "walk",  direction: "down" },
        // ],
        talking: [
          {
            events: [
              {
                type: "questionMessage",
                question: "What is your name?",
                qsnValue: 10,
                answer: "Bob",
                faceHero: "npcB",
                onComplete: (isCorrect, userAnswer) => {
                  console.log("Your answer was: ", QuestionMessage.userAnswer);
                  console.log("Is correct: ", QuestionMessage.isCorrect);
                },
              },
            ],
          },
        ],
      }),
    },
    walls: {
      [utils.asGridCoord(3, 10)]: true,
      [utils.asGridCoord(3, 11)]: true,
      [utils.asGridCoord(3, 12)]: true,
      [utils.asGridCoord(3, 13)]: true,
      [utils.asGridCoord(3, 14)]: true,
      [utils.asGridCoord(3, 15)]: true,
      [utils.asGridCoord(3, 16)]: true,
      [utils.asGridCoord(3, 17)]: true,
      [utils.asGridCoord(3, 18)]: true,
      [utils.asGridCoord(4, 14)]: true,
      [utils.asGridCoord(5, 14)]: true,
      [utils.asGridCoord(6, 14)]: true,
      [utils.asGridCoord(7, 14)]: true,
      [utils.asGridCoord(8, 14)]: true,
      [utils.asGridCoord(9, 14)]: true,
      [utils.asGridCoord(10, 14)]: true,
      [utils.asGridCoord(11, 14)]: true,
      [utils.asGridCoord(12, 14)]: true,
      [utils.asGridCoord(13, 14)]: true,
      [utils.asGridCoord(14, 14)]: true,
      [utils.asGridCoord(15, 14)]: true,
      [utils.asGridCoord(16, 14)]: true,
      [utils.asGridCoord(17, 14)]: true,
      [utils.asGridCoord(18, 14)]: true,
      [utils.asGridCoord(19, 14)]: true,
      [utils.asGridCoord(20, 14)]: true,
      [utils.asGridCoord(21, 14)]: true,
      [utils.asGridCoord(22, 14)]: true,
      [utils.asGridCoord(23, 14)]: true,
      [utils.asGridCoord(24, 14)]: true,
      [utils.asGridCoord(25, 14)]: true,
      [utils.asGridCoord(26, 14)]: true,
      [utils.asGridCoord(27, 14)]: true,
      [utils.asGridCoord(28, 14)]: true,
      [utils.asGridCoord(29, 14)]: true,
      [utils.asGridCoord(30, 14)]: true,
      [utils.asGridCoord(31, 14)]: true,
      [utils.asGridCoord(32, 14)]: true,
      [utils.asGridCoord(33, 14)]: true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(5, 9)]: [
        {
          events: [
            { type: "changeMap", map: "DemoRoom" },
            { type: "textMessage", text: "Welcome back to the demo room!" },
          ],
        },
      ],
    },
  },

};
