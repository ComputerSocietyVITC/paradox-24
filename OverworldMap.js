class OverworldMap {
  constructor(config) {
    this.overworld = null;
    this.mapName = config.mapName;

    this.gameObjects = config.gameObjects;
    this.cutsceneSpaces = config.cutsceneSpaces || {};
    this.walls = config.walls || {};
    this.ledges = config.ledges || {};

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

    // Check if the space is a wall
    const isWall = this.walls[`${x},${y}`] || false;

    // Special case for ledges
    const isLedge = this.ledges[`${currentX},${currentY}`];
    if (isLedge && direction !== "down") {
      return true; // Block movement unless it's downward
    }

    return isWall;
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
  DemoRoom: {
    mapName: "DemoRoom",
    lowerSrc: "/images/maps/rooms/DemoLower.png",
    upperSrc: "/images/maps/rooms/DemoUpper.png",
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
    mapName: "Street",
    lowerSrc: "images/maps/city/city1.png",
    upperSrc: "images/maps/city/0.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(22),
        y: utils.withGrid(10),
        direction: "down",
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
      //outer border 
      //sign board 
      [utils.asGridCoord(16, 1)]: true,
      //mart 
      [utils.asGridCoord(27, 0)]: true,
      [utils.asGridCoord(28, 0)]: true,
      [utils.asGridCoord(29, 0)]: true,
      [utils.asGridCoord(30, 0)]: true,
      [utils.asGridCoord(27, 1)]: true,
      [utils.asGridCoord(27, 2)]: true,
      [utils.asGridCoord(27, 3)]: true,
      [utils.asGridCoord(29, 1)]: true,
      [utils.asGridCoord(29, 2)]: true,
      [utils.asGridCoord(29, 3)]: true,
      [utils.asGridCoord(30, 1)]: true,
      [utils.asGridCoord(30, 2)]: true,
      [utils.asGridCoord(30, 3)]: true,
      //poke
      [utils.asGridCoord(21, 6)]: true,
      [utils.asGridCoord(22, 6)]: true,
      [utils.asGridCoord(23, 6)]: true,
      [utils.asGridCoord(24, 6)]: true,

      [utils.asGridCoord(21, 7)]: true,
      [utils.asGridCoord(21, 8)]: true,
      [utils.asGridCoord(21, 9)]: true,
      [utils.asGridCoord(23, 7)]: true,
      [utils.asGridCoord(23, 8)]: true,
      [utils.asGridCoord(23, 9)]: true,
      [utils.asGridCoord(24, 7)]: true,
      [utils.asGridCoord(24, 8)]: true,
      [utils.asGridCoord(24, 9)]: true,




      //top forest 
      [utils.asGridCoord(7, 0)]: true,
      [utils.asGridCoord(8, 0)]: true,
      [utils.asGridCoord(9, 0)]: true,
      [utils.asGridCoord(10, 0)]: true,
      [utils.asGridCoord(11, 0)]: true,
      [utils.asGridCoord(12, 0)]: true,
      [utils.asGridCoord(13, 0)]: true,
      [utils.asGridCoord(14, 0)]: true,

      //mid forest
      [utils.asGridCoord(7, 6)]: true,
      [utils.asGridCoord(7, 7)]: true,
      [utils.asGridCoord(8, 7)]: true,


      // Right border forest 
      [utils.asGridCoord(35, 0)]: true,
      [utils.asGridCoord(35, 1)]: true,
      [utils.asGridCoord(35, 2)]: true,
      [utils.asGridCoord(35, 3)]: true,
      [utils.asGridCoord(35, 4)]: true,
      [utils.asGridCoord(35, 5)]: true,
      [utils.asGridCoord(35, 6)]: true,
      [utils.asGridCoord(35, 7)]: true,

      [utils.asGridCoord(35, 8)]: true,
      [utils.asGridCoord(35, 9)]: true,
      [utils.asGridCoord(35, 10)]: true,
      [utils.asGridCoord(35, 11)]: true,
      [utils.asGridCoord(35, 12)]: true,
      [utils.asGridCoord(35, 13)]: true,
      [utils.asGridCoord(35, 14)]: true,
      [utils.asGridCoord(35, 15)]: true,
      //fence bottom  
      [utils.asGridCoord(34, 15)]: true,
      [utils.asGridCoord(33, 15)]: true,
      [utils.asGridCoord(32, 15)]: true,
      [utils.asGridCoord(31, 15)]: true,
      [utils.asGridCoord(30, 15)]: true,
      [utils.asGridCoord(29, 15)]: true,
      /////////// 26 and 27 are the path opening 
      [utils.asGridCoord(26, 15)]: true,
      [utils.asGridCoord(25, 15)]: true,
      [utils.asGridCoord(24, 15)]: true,
      [utils.asGridCoord(23, 15)]: true,
      [utils.asGridCoord(22, 15)]: true,
      [utils.asGridCoord(21, 15)]: true,
      [utils.asGridCoord(20, 15)]: true,
      [utils.asGridCoord(19, 15)]: true,
      [utils.asGridCoord(18, 15)]: true,
      [utils.asGridCoord(17, 15)]: true,
      [utils.asGridCoord(16, 15)]: true,
      [utils.asGridCoord(15, 15)]: true,
      [utils.asGridCoord(14, 15)]: true,
      [utils.asGridCoord(13, 15)]: true,
      [utils.asGridCoord(12, 15)]: true,
      [utils.asGridCoord(11, 15)]: true,
      [utils.asGridCoord(10, 15)]: true,
      [utils.asGridCoord(9, 15)]: true,
      [utils.asGridCoord(8, 15)]: true,
      [utils.asGridCoord(7, 15)]: true,
      [utils.asGridCoord(6, 15)]: true,
      [utils.asGridCoord(5, 15)]: true,
      [utils.asGridCoord(4, 15)]: true,
      [utils.asGridCoord(3, 15)]: true,

      //left mountain
      [utils.asGridCoord(0, 2)]: true,
      [utils.asGridCoord(1, 2)]: true,
      [utils.asGridCoord(2, 15)]: true,
      [utils.asGridCoord(2, 14)]: true,
      [utils.asGridCoord(2, 13)]: true,
      [utils.asGridCoord(2, 12)]: true,
      [utils.asGridCoord(2, 11)]: true,
      [utils.asGridCoord(2, 10)]: true,
      [utils.asGridCoord(2, 9)]: true,
      [utils.asGridCoord(2, 8)]: true,
      [utils.asGridCoord(2, 7)]: true,
      [utils.asGridCoord(2, 6)]: true,
      [utils.asGridCoord(2, 5)]: true,
      [utils.asGridCoord(2, 4)]: true,
      [utils.asGridCoord(2, 3)]: true,
      [utils.asGridCoord(2, 2)]: true,

      //stone border
      [utils.asGridCoord(3, 5)]: true,
      [utils.asGridCoord(4, 5)]: true,
      [utils.asGridCoord(5, 5)]: true,
      [utils.asGridCoord(6, 5)]: true,

      [utils.asGridCoord(29, 16)]: true,
      [utils.asGridCoord(29, 17)]: true,
      [utils.asGridCoord(29, 18)]: true,
      [utils.asGridCoord(29, 19)]: true,

      [utils.asGridCoord(26, 16)]: true,
      [utils.asGridCoord(26, 17)]: true,
      [utils.asGridCoord(26, 18)]: true,
      [utils.asGridCoord(26, 19)]: true,


    },
    ledges: {
      [utils.asGridCoord(3, 11)]: true,
      [utils.asGridCoord(4, 11)]: true,
      [utils.asGridCoord(5, 11)]: true,
      [utils.asGridCoord(6, 11)]: true,
      [utils.asGridCoord(7, 11)]: true,
      [utils.asGridCoord(7, 10)]: true,
      [utils.asGridCoord(7, 9)]: true,
      [utils.asGridCoord(7, 8)]: true,
      [utils.asGridCoord(8, 8)]: true,
      [utils.asGridCoord(9, 8)]: true,
      [utils.asGridCoord(10, 8)]: true,
      [utils.asGridCoord(11, 8)]: true,
      [utils.asGridCoord(12, 8)]: true,
      [utils.asGridCoord(12, 9)]: true,
      [utils.asGridCoord(12, 10)]: true,
      [utils.asGridCoord(12, 11)]: true,
      [utils.asGridCoord(13, 11)]: true,
      [utils.asGridCoord(15, 11)]: true,
      [utils.asGridCoord(16, 11)]: true,
      [utils.asGridCoord(17, 11)]: true,
      [utils.asGridCoord(19, 11)]: true,
      [utils.asGridCoord(20, 11)]: true,
      [utils.asGridCoord(21, 11)]: true,
      [utils.asGridCoord(22, 11)]: true,
      [utils.asGridCoord(23, 11)]: true,
      [utils.asGridCoord(24, 11)]: true,
      [utils.asGridCoord(25, 11)]: true,
      [utils.asGridCoord(26, 11)]: true,
      [utils.asGridCoord(27, 11)]: true,
      [utils.asGridCoord(28, 11)]: true,
      [utils.asGridCoord(29, 11)]: true,
      [utils.asGridCoord(30, 11)]: true,
      [utils.asGridCoord(31, 11)]: true,
      [utils.asGridCoord(32, 11)]: true,
      [utils.asGridCoord(33, 11)]: true,
      [utils.asGridCoord(34, 11)]: true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(22, 9)]: [
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
