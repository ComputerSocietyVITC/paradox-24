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
    if (isLedge && direction == "up") {
      return true; // Block movement if upward 
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
          events: [{ type: "changeMap", map: "City1" }],
        },
      ],
    },
  },
  City1: {
    mapName: "City1",
    lowerSrc: "images/maps/city/city1.png",
    upperSrc: "images/maps/city/0.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(23),
        y: utils.withGrid(11),
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
      [utils.asGridCoord(17, 2)]: true,
      //mart
      [utils.asGridCoord(28, 1)]: true,
      [utils.asGridCoord(29, 1)]: true,
      [utils.asGridCoord(30, 1)]: true,
      [utils.asGridCoord(31, 1)]: true,
      [utils.asGridCoord(28, 2)]: true,
      [utils.asGridCoord(28, 3)]: true,
      [utils.asGridCoord(28, 4)]: true,
      [utils.asGridCoord(30, 2)]: true,
      [utils.asGridCoord(30, 3)]: true,
      [utils.asGridCoord(30, 4)]: true,
      [utils.asGridCoord(31, 2)]: true,
      [utils.asGridCoord(31, 3)]: true,
      [utils.asGridCoord(31, 4)]: true,

      //poke
      [utils.asGridCoord(22, 7)]: true,
      [utils.asGridCoord(23, 7)]: true,
      [utils.asGridCoord(24, 7)]: true,
      [utils.asGridCoord(25, 7)]: true,

      [utils.asGridCoord(22, 8)]: true,
      [utils.asGridCoord(22, 9)]: true,
      [utils.asGridCoord(22, 10)]: true,
      [utils.asGridCoord(24, 8)]: true,
      [utils.asGridCoord(24, 9)]: true,
      [utils.asGridCoord(24, 10)]: true,
      [utils.asGridCoord(25, 8)]: true,
      [utils.asGridCoord(25, 9)]: true,
      [utils.asGridCoord(25, 10)]: true,


      //top forest
      [utils.asGridCoord(8, 1)]: true,
      [utils.asGridCoord(9, 1)]: true,
      [utils.asGridCoord(10, 1)]: true,
      [utils.asGridCoord(11, 1)]: true,
      [utils.asGridCoord(12, 1)]: true,
      [utils.asGridCoord(13, 1)]: true,
      [utils.asGridCoord(14, 1)]: true,
      [utils.asGridCoord(15, 1)]: true,

      //mid forest
      [utils.asGridCoord(8, 7)]: true,
      [utils.asGridCoord(8, 8)]: true,
      [utils.asGridCoord(9, 8)]: true,


      // Right border forest
      [utils.asGridCoord(36, 1)]: true,
      [utils.asGridCoord(36, 2)]: true,
      [utils.asGridCoord(36, 3)]: true,
      [utils.asGridCoord(36, 4)]: true,
      [utils.asGridCoord(36, 5)]: true,
      [utils.asGridCoord(36, 6)]: true,
      [utils.asGridCoord(36, 7)]: true,
      [utils.asGridCoord(36, 8)]: true,
      [utils.asGridCoord(36, 9)]: true,
      [utils.asGridCoord(36, 10)]: true,
      [utils.asGridCoord(36, 11)]: true,
      [utils.asGridCoord(36, 12)]: true,
      [utils.asGridCoord(36, 13)]: true,
      [utils.asGridCoord(36, 14)]: true,
      [utils.asGridCoord(36, 15)]: true,
      [utils.asGridCoord(36, 16)]: true,

      //fence bottom
      [utils.asGridCoord(35, 16)]: true,
      [utils.asGridCoord(34, 16)]: true,
      [utils.asGridCoord(33, 16)]: true,
      [utils.asGridCoord(32, 16)]: true,
      [utils.asGridCoord(31, 16)]: true,
      [utils.asGridCoord(30, 16)]: true,
      /////////// 28 and 29 are the path opening
      [utils.asGridCoord(27, 16)]: true,
      [utils.asGridCoord(26, 16)]: true,
      [utils.asGridCoord(25, 16)]: true,
      [utils.asGridCoord(24, 16)]: true,
      [utils.asGridCoord(23, 16)]: true,
      [utils.asGridCoord(22, 16)]: true,
      [utils.asGridCoord(21, 16)]: true,
      [utils.asGridCoord(20, 16)]: true,
      [utils.asGridCoord(19, 16)]: true,
      [utils.asGridCoord(18, 16)]: true,
      [utils.asGridCoord(17, 16)]: true,
      [utils.asGridCoord(16, 16)]: true,
      [utils.asGridCoord(15, 16)]: true,
      [utils.asGridCoord(14, 16)]: true,
      [utils.asGridCoord(13, 16)]: true,
      [utils.asGridCoord(12, 16)]: true,
      [utils.asGridCoord(11, 16)]: true,
      [utils.asGridCoord(10, 16)]: true,
      [utils.asGridCoord(9, 16)]: true,
      [utils.asGridCoord(8, 16)]: true,
      [utils.asGridCoord(7, 16)]: true,
      [utils.asGridCoord(6, 16)]: true,
      [utils.asGridCoord(5, 16)]: true,
      [utils.asGridCoord(4, 16)]: true,

      //left mountain
      [utils.asGridCoord(1, 3)]: true,
      [utils.asGridCoord(2, 3)]: true,
      [utils.asGridCoord(3, 16)]: true,
      [utils.asGridCoord(3, 15)]: true,
      [utils.asGridCoord(3, 14)]: true,
      [utils.asGridCoord(3, 13)]: true,
      [utils.asGridCoord(3, 12)]: true,
      [utils.asGridCoord(3, 11)]: true,
      [utils.asGridCoord(3, 10)]: true,
      [utils.asGridCoord(3, 9)]: true,
      [utils.asGridCoord(3, 8)]: true,
      [utils.asGridCoord(3, 7)]: true,
      [utils.asGridCoord(3, 6)]: true,
      [utils.asGridCoord(3, 5)]: true,
      [utils.asGridCoord(3, 4)]: true,
      [utils.asGridCoord(3, 3)]: true,

      //stone border
      [utils.asGridCoord(4, 6)]: true,
      [utils.asGridCoord(5, 6)]: true,
      [utils.asGridCoord(6, 6)]: true,
      [utils.asGridCoord(7, 6)]: true,

      [utils.asGridCoord(30, 17)]: true,
      [utils.asGridCoord(30, 18)]: true,
      [utils.asGridCoord(30, 19)]: true,
      [utils.asGridCoord(30, 20)]: true,

      [utils.asGridCoord(27, 17)]: true,
      [utils.asGridCoord(27, 18)]: true,
      [utils.asGridCoord(27, 19)]: true,
      [utils.asGridCoord(27, 20)]: true,

      //water
      [utils.asGridCoord(10, 9)]: true,
      [utils.asGridCoord(11, 9)]: true,
      [utils.asGridCoord(12, 9)]: true,
      [utils.asGridCoord(13, 9)]: true,
      [utils.asGridCoord(13, 10)]: true,
      [utils.asGridCoord(13, 11)]: true,
      [utils.asGridCoord(13, 12)]: true,
      [utils.asGridCoord(8, 12)]: true,
      [utils.asGridCoord(9, 12)]: true,
      [utils.asGridCoord(10, 12)]: true,
      [utils.asGridCoord(11, 12)]: true,
      [utils.asGridCoord(12, 12)]: true,
      [utils.asGridCoord(13, 12)]: true,


      // map boundaries
      [utils.asGridCoord(0, 0)]: true,
    },
    ledges: {
      [utils.asGridCoord(5, 14)]: true,
      [utils.asGridCoord(6, 14)]: true,
      [utils.asGridCoord(7, 14)]: true,
      [utils.asGridCoord(8, 14)]: true,
      [utils.asGridCoord(8, 12)]: true,
      [utils.asGridCoord(8, 11)]: true,
      [utils.asGridCoord(8, 10)]: true,
      [utils.asGridCoord(9, 10)]: true,
      [utils.asGridCoord(10, 10)]: true,
      [utils.asGridCoord(11, 10)]: true,
      [utils.asGridCoord(12, 10)]: true,
      [utils.asGridCoord(13, 10)]: true,
      [utils.asGridCoord(13, 11)]: true,
      [utils.asGridCoord(13, 12)]: true,
      [utils.asGridCoord(13, 13)]: true,
      [utils.asGridCoord(14, 13)]: true,
      [utils.asGridCoord(16, 13)]: true,
      [utils.asGridCoord(17, 13)]: true,
      [utils.asGridCoord(18, 13)]: true,
      [utils.asGridCoord(20, 13)]: true,
      [utils.asGridCoord(21, 13)]: true,
      [utils.asGridCoord(22, 13)]: true,
      [utils.asGridCoord(23, 13)]: true,
      [utils.asGridCoord(24, 13)]: true,
      [utils.asGridCoord(25, 13)]: true,
      [utils.asGridCoord(26, 13)]: true,
      [utils.asGridCoord(27, 13)]: true,
      [utils.asGridCoord(28, 13)]: true,
      [utils.asGridCoord(29, 13)]: true,
      [utils.asGridCoord(30, 13)]: true,
      [utils.asGridCoord(31, 13)]: true,
      [utils.asGridCoord(32, 13)]: true,
      [utils.asGridCoord(33, 13)]: true,
      [utils.asGridCoord(34, 13)]: true,
      [utils.asGridCoord(35, 13)]: true,
    }
    ,
    cutsceneSpaces: {
      [utils.asGridCoord(23, 10)]: [
        {
          events: [
            { type: "changeMap", map: "DemoRoom" },
            { type: "textMessage", text: "Welcome back to the demo room!" },
          ],
        },
      ],
      [utils.asGridCoord(28, 20)]: [
        {
          events: [
            { type: "changeMap", map: "Route1" },
            { type: "textMessage", text: "You have taken the route 1" },
          ],
        },
      ],
      [utils.asGridCoord(29, 20)]: [
        {
          events: [
            { type: "changeMap", map: "Route1" },
            { type: "textMessage", text: "You have taken the route 1" },
          ],
        },
      ],
    },
  },
  Route1: {
    mapName: "Route1",
    lowerSrc: "images/maps/routes/route1.png",
    upperSrc: "images/maps/city/0.png",
    gameObjects: {


      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(8),
        y: utils.withGrid(0),
        direction: "down",
      }),
    },
    walls: {
      //left 
      [utils.asGridCoord(1, 0)]: true,
      [utils.asGridCoord(1, 1)]: true,
      [utils.asGridCoord(1, 2)]: true,
      [utils.asGridCoord(1, 3)]: true,
      [utils.asGridCoord(1, 4)]: true,
      [utils.asGridCoord(1, 5)]: true,
      [utils.asGridCoord(1, 6)]: true,
      [utils.asGridCoord(1, 7)]: true,
      [utils.asGridCoord(1, 8)]: true,
      [utils.asGridCoord(1, 9)]: true,
      [utils.asGridCoord(1, 10)]: true,
      [utils.asGridCoord(1, 11)]: true,
      [utils.asGridCoord(1, 12)]: true,
      [utils.asGridCoord(1, 13)]: true,
      [utils.asGridCoord(1, 14)]: true,
      [utils.asGridCoord(1, 15)]: true,
      [utils.asGridCoord(1, 16)]: true,
      [utils.asGridCoord(1, 17)]: true,
      [utils.asGridCoord(1, 18)]: true,
      [utils.asGridCoord(1, 19)]: true,
      [utils.asGridCoord(1, 20)]: true,
      [utils.asGridCoord(1, 21)]: true,
      [utils.asGridCoord(1, 22)]: true,
      [utils.asGridCoord(1, 23)]: true,
      [utils.asGridCoord(1, 24)]: true,
      [utils.asGridCoord(1, 25)]: true,
      [utils.asGridCoord(1, 26)]: true,
      [utils.asGridCoord(1, 27)]: true,
      [utils.asGridCoord(1, 28)]: true,
      [utils.asGridCoord(1, 29)]: true,
      [utils.asGridCoord(1, 30)]: true,
      [utils.asGridCoord(1, 31)]: true,
      [utils.asGridCoord(1, 32)]: true,
      [utils.asGridCoord(1, 33)]: true,
      [utils.asGridCoord(1, 34)]: true,
      [utils.asGridCoord(1, 35)]: true,

      //right
      [utils.asGridCoord(16, 0)]: true,
      [utils.asGridCoord(16, 1)]: true,
      [utils.asGridCoord(16, 2)]: true,
      [utils.asGridCoord(16, 3)]: true,
      [utils.asGridCoord(16, 4)]: true,
      [utils.asGridCoord(16, 5)]: true,
      [utils.asGridCoord(16, 6)]: true,
      [utils.asGridCoord(16, 7)]: true,
      [utils.asGridCoord(16, 8)]: true,
      [utils.asGridCoord(16, 9)]: true,
      [utils.asGridCoord(16, 10)]: true,
      [utils.asGridCoord(16, 11)]: true,
      [utils.asGridCoord(16, 12)]: true,
      [utils.asGridCoord(16, 13)]: true,
      [utils.asGridCoord(16, 14)]: true,
      [utils.asGridCoord(16, 15)]: true,
      [utils.asGridCoord(16, 16)]: true,
      [utils.asGridCoord(16, 17)]: true,
      [utils.asGridCoord(16, 18)]: true,
      [utils.asGridCoord(16, 19)]: true,
      [utils.asGridCoord(16, 20)]: true,
      [utils.asGridCoord(16, 21)]: true,
      [utils.asGridCoord(16, 22)]: true,
      [utils.asGridCoord(16, 23)]: true,
      [utils.asGridCoord(16, 24)]: true,
      [utils.asGridCoord(16, 25)]: true,
      [utils.asGridCoord(16, 26)]: true,
      [utils.asGridCoord(16, 27)]: true,
      [utils.asGridCoord(16, 28)]: true,
      [utils.asGridCoord(16, 29)]: true,
      [utils.asGridCoord(16, 30)]: true,
      [utils.asGridCoord(16, 31)]: true,
      [utils.asGridCoord(16, 32)]: true,
      [utils.asGridCoord(16, 33)]: true,
      [utils.asGridCoord(16, 34)]: true,
      [utils.asGridCoord(16, 35)]: true,

      //mid forest and mid stones 

      [utils.asGridCoord(7, 4)]: true,
      [utils.asGridCoord(7, 5)]: true,
      [utils.asGridCoord(7, 6)]: true,
      [utils.asGridCoord(7, 7)]: true,
      [utils.asGridCoord(7, 8)]: true,
      [utils.asGridCoord(7, 9)]: true,

      [utils.asGridCoord(2, 23)]: true,
      [utils.asGridCoord(3, 23)]: true,
      [utils.asGridCoord(4, 23)]: true,
      [utils.asGridCoord(5, 23)]: true,
      [utils.asGridCoord(6, 23)]: true,
      [utils.asGridCoord(7, 23)]: true,
      [utils.asGridCoord(8, 23)]: true,
      [utils.asGridCoord(9, 23)]: true,

      [utils.asGridCoord(2, 13)]: true,
      [utils.asGridCoord(3, 13)]: true,
      [utils.asGridCoord(8, 13)]: true,
      [utils.asGridCoord(9, 13)]: true,
      [utils.asGridCoord(10, 13)]: true,
      [utils.asGridCoord(11, 13)]: true,

      //stones 

      ///////////top
      [utils.asGridCoord(7, 0)]: true,
      [utils.asGridCoord(10, 0)]: true,

      [utils.asGridCoord(2, 1)]: true,
      [utils.asGridCoord(3, 1)]: true,
      [utils.asGridCoord(4, 1)]: true,
      [utils.asGridCoord(5, 1)]: true,
      [utils.asGridCoord(6, 1)]: true,
      [utils.asGridCoord(7, 1)]: true,

      [utils.asGridCoord(10, 1)]: true,
      [utils.asGridCoord(11, 1)]: true,
      [utils.asGridCoord(12, 1)]: true,
      [utils.asGridCoord(13, 1)]: true,
      [utils.asGridCoord(14, 1)]: true,
      [utils.asGridCoord(15, 1)]: true,

      //////////bottom 
      [utils.asGridCoord(2, 32)]: true,
      [utils.asGridCoord(3, 32)]: true,
      [utils.asGridCoord(4, 32)]: true,
      [utils.asGridCoord(5, 32)]: true,
      [utils.asGridCoord(6, 32)]: true,
      [utils.asGridCoord(7, 32)]: true,

      [utils.asGridCoord(10, 32)]: true,
      [utils.asGridCoord(11, 32)]: true,
      [utils.asGridCoord(12, 32)]: true,
      [utils.asGridCoord(13, 32)]: true,
      [utils.asGridCoord(14, 32)]: true,
      [utils.asGridCoord(15, 32)]: true,

      [utils.asGridCoord(7, 33)]: true,
      [utils.asGridCoord(7, 34)]: true,
      [utils.asGridCoord(7, 35)]: true,
      [utils.asGridCoord(10, 33)]: true,
      [utils.asGridCoord(10, 34)]: true,
      [utils.asGridCoord(10, 35)]: true,
      //board 
      [utils.asGridCoord(7, 27)]: true,


    },
    ledges: {
      [utils.asGridCoord(2, 6)]: true,
      [utils.asGridCoord(3, 6)]: true,
      [utils.asGridCoord(4, 6)]: true,
      [utils.asGridCoord(5, 6)]: true,
      [utils.asGridCoord(6, 6)]: true,

      [utils.asGridCoord(8, 6)]: true,
      [utils.asGridCoord(9, 6)]: true,
      [utils.asGridCoord(10, 6)]: true,
      [utils.asGridCoord(11, 6)]: true,

      [utils.asGridCoord(2, 10)]: true,
      [utils.asGridCoord(3, 10)]: true,
      [utils.asGridCoord(4, 10)]: true,
      [utils.asGridCoord(5, 10)]: true,
      [utils.asGridCoord(6, 10)]: true,

      [utils.asGridCoord(4, 14)]: true,
      [utils.asGridCoord(5, 14)]: true,
      [utils.asGridCoord(6, 14)]: true,
      [utils.asGridCoord(7, 14)]: true,

      [utils.asGridCoord(2, 20)]: true,

      [utils.asGridCoord(4, 20)]: true,
      [utils.asGridCoord(5, 20)]: true,
      [utils.asGridCoord(6, 20)]: true,

      [utils.asGridCoord(8, 20)]: true,
      [utils.asGridCoord(9, 20)]: true,
      [utils.asGridCoord(10, 20)]: true,
      [utils.asGridCoord(11, 20)]: true,
      [utils.asGridCoord(12, 20)]: true,
      [utils.asGridCoord(13, 20)]: true,
      [utils.asGridCoord(14, 20)]: true,
      [utils.asGridCoord(15, 20)]: true,

      [utils.asGridCoord(14, 24)]: true,
      [utils.asGridCoord(15, 24)]: true,

      [utils.asGridCoord(2, 28)]: true,
      [utils.asGridCoord(3, 28)]: true,

      [utils.asGridCoord(8, 28)]: true,
      [utils.asGridCoord(9, 28)]: true,
      [utils.asGridCoord(10, 28)]: true,
      [utils.asGridCoord(11, 28)]: true,
      [utils.asGridCoord(12, 28)]: true,
      [utils.asGridCoord(13, 28)]: true,
      [utils.asGridCoord(14, 28)]: true,
      [utils.asGridCoord(15, 28)]: true,

    },
    cutsceneSpaces: {
      [utils.asGridCoord(8, 0)]: [
        {
          events: [
            { type: "changeMap", map: "City1" },
            { type: "textMessage", text: "You are back in city 1" },
          ]
        }
      ],
      [utils.asGridCoord(9, 0)]: [

        {
          events: [
            { type: "changeMap", map: "City1" },
            { type: "textMessage", text: "You are back in city 1" },
          ]
        }
      ],
      [utils.asGridCoord(8, 35)]: [
        {
          events: [
            { type: "changeMap", map: "City2" },
            { type: "textMessage", text: "You have arrived in city 2 " },
          ]
        }
      ],
      [utils.asGridCoord(9, 35)]: [

        {
          events: [
            { type: "changeMap", map: "City2" },
            { type: "textMessage", text: "You have arrived in city 2" },
          ]
        }
      ],
    }

  },
  City2: {
    mapName: "City2",
    lowerSrc: "images/maps/city/city2.png",
    upperSrc: "images/maps/city/0.png",
    gameObjects: {


      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(1),
        y: utils.withGrid(9),
        direction: "down",
      }),
    },
    cutsceneSpaces: {

      [utils.asGridCoord(1, 9)]: [
        {
          events: [
            { type: "changeMap", map: "Route1" },
            { type: "textMessage", text: "You have taken route 1" },
          ]
        }
      ],
      [utils.asGridCoord(1, 10)]: [

        {
          events: [
            { type: "changeMap", map: "Route1" },
            { type: "textMessage", text: "You have taken route 1" },
          ]
        }
      ],
    }

  }
};
