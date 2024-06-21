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
          events: [
            { type: "changeMap", map: "City1", heroX: 23, heroY: 11, direction: "down" },

          ],
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
                qsnValue: {
                  points: 10,
                  badge: "Explorer Badge",
                  image: "images/badges/explorer_badge.png"
                },
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
            { type: "changeMap", map: "DemoRoom", heroX: 5, heroY: 10, direction: "up" },
            { type: "textMessage", text: "Welcome back to the demo room!" },
          ],
        },
      ],
      [utils.asGridCoord(28, 20)]: [
        {
          events: [
            { type: "changeMap", map: "Route1", heroX: 8, heroY: 0, direction: "down" },
            { type: "textMessage", text: "You have taken the route 1" },
          ],
        },
      ],
      [utils.asGridCoord(29, 20)]: [
        {
          events: [
            { type: "changeMap", map: "Route1", heroX: 9, heroY: 0, direction: "down" },
            { type: "textMessage", text: "You have taken the route 1" },
          ],
        },
      ],
    },
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
    walls: {
      [utils.asGridCoord(1, 1)]: true,
      [utils.asGridCoord(1, 2)]: true,
      [utils.asGridCoord(1, 3)]: true,
      [utils.asGridCoord(1, 4)]: true,
      [utils.asGridCoord(1, 5)]: true,
      [utils.asGridCoord(1, 6)]: true,
      [utils.asGridCoord(1, 7)]: true,
      [utils.asGridCoord(1, 8)]: true,
      [utils.asGridCoord(1, 35)]: true,
      [utils.asGridCoord(2, 35)]: true,
      [utils.asGridCoord(2, 8)]: true,
      [utils.asGridCoord(3, 8)]: true,
      [utils.asGridCoord(4, 8)]: true,
      [utils.asGridCoord(5, 8)]: true,
      [utils.asGridCoord(6, 8)]: true,
      [utils.asGridCoord(7, 8)]: true,
      [utils.asGridCoord(8, 8)]: true,
      [utils.asGridCoord(9, 8)]: true,

      [utils.asGridCoord(9, 9)]: true,
      [utils.asGridCoord(9, 10)]: true,
      [utils.asGridCoord(9, 11)]: true,
      [utils.asGridCoord(9, 12)]: true,
      [utils.asGridCoord(9, 13)]: true,
      [utils.asGridCoord(9, 14)]: true,
      [utils.asGridCoord(9, 15)]: true,
      [utils.asGridCoord(9, 16)]: true,
      [utils.asGridCoord(9, 17)]: true,
      [utils.asGridCoord(9, 18)]: true,
      [utils.asGridCoord(3, 19)]: true,
      [utils.asGridCoord(4, 19)]: true,

      [utils.asGridCoord(1, 11)]: true,
      [utils.asGridCoord(2, 11)]: true,
      [utils.asGridCoord(3, 11)]: true,
      [utils.asGridCoord(4, 11)]: true,
      [utils.asGridCoord(5, 11)]: true,
      [utils.asGridCoord(6, 11)]: true,

      [utils.asGridCoord(6, 12)]: true,
      [utils.asGridCoord(6, 13)]: true,
      [utils.asGridCoord(6, 14)]: true,
      [utils.asGridCoord(6, 15)]: true,
      [utils.asGridCoord(6, 16)]: true,

      [utils.asGridCoord(5, 16)]: true,
      [utils.asGridCoord(3, 16)]: true,

      [utils.asGridCoord(2, 17)]: true,
      [utils.asGridCoord(2, 18)]: true,
      [utils.asGridCoord(2, 19)]: true,

      [utils.asGridCoord(4, 20)]: true,
      [utils.asGridCoord(4, 21)]: true,
      [utils.asGridCoord(5, 21)]: true,
      [utils.asGridCoord(6, 21)]: true,
      [utils.asGridCoord(7, 21)]: true,
      [utils.asGridCoord(8, 21)]: true,

      [utils.asGridCoord(9, 22)]: true,
      [utils.asGridCoord(10, 22)]: true,
      [utils.asGridCoord(11, 22)]: true,
      [utils.asGridCoord(12, 22)]: true,

      [utils.asGridCoord(12, 23)]: true,
      [utils.asGridCoord(12, 24)]: true,
      [utils.asGridCoord(12, 25)]: true,
      [utils.asGridCoord(12, 26)]: true,
      [utils.asGridCoord(12, 27)]: true,
      [utils.asGridCoord(12, 28)]: true,
      [utils.asGridCoord(12, 29)]: true,
      [utils.asGridCoord(12, 30)]: true,
      [utils.asGridCoord(12, 31)]: true,
      [utils.asGridCoord(12, 32)]: true,

      [utils.asGridCoord(12, 33)]: true,
      [utils.asGridCoord(13, 33)]: true,
      [utils.asGridCoord(14, 33)]: true,

      [utils.asGridCoord(14, 34)]: true,
      [utils.asGridCoord(14, 35)]: true,
      [utils.asGridCoord(14, 36)]: true,
      [utils.asGridCoord(14, 37)]: true,

      [utils.asGridCoord(15, 24)]: true,
      [utils.asGridCoord(15, 25)]: true,
      [utils.asGridCoord(15, 26)]: true,
      [utils.asGridCoord(15, 27)]: true,
      [utils.asGridCoord(15, 28)]: true,

      [utils.asGridCoord(17, 28)]: true,
      [utils.asGridCoord(17, 29)]: true,
      [utils.asGridCoord(17, 30)]: true,
      [utils.asGridCoord(17, 31)]: true,
      [utils.asGridCoord(17, 32)]: true,
      [utils.asGridCoord(17, 33)]: true,
      [utils.asGridCoord(17, 34)]: true,
      [utils.asGridCoord(17, 35)]: true,
      [utils.asGridCoord(17, 36)]: true,

      [utils.asGridCoord(11, 18)]: true,

      [utils.asGridCoord(12, 18)]: true,
      [utils.asGridCoord(12, 17)]: true,
      [utils.asGridCoord(12, 16)]: true,
      [utils.asGridCoord(12, 15)]: true,

      [utils.asGridCoord(13, 15)]: true,
      [utils.asGridCoord(14, 15)]: true,
      [utils.asGridCoord(15, 15)]: true,

      [utils.asGridCoord(15, 16)]: true,
      [utils.asGridCoord(16, 16)]: true,
      [utils.asGridCoord(17, 16)]: true,

      [utils.asGridCoord(17, 17)]: true,
      [utils.asGridCoord(17, 18)]: true,

      [utils.asGridCoord(20, 18)]: true,
      [utils.asGridCoord(21, 18)]: true,

      [utils.asGridCoord(26, 6)]: true,
      [utils.asGridCoord(3, 35)]: true,
      [utils.asGridCoord(3, 34)]: true,
      [utils.asGridCoord(3, 33)]: true,

      [utils.asGridCoord(4, 33)]: true,
      [utils.asGridCoord(5, 33)]: true,
      [utils.asGridCoord(6, 33)]: true,
      [utils.asGridCoord(7, 33)]: true,

      [utils.asGridCoord(7, 32)]: true,
      [utils.asGridCoord(7, 31)]: true,

      [utils.asGridCoord(5, 30)]: true,
      [utils.asGridCoord(6, 30)]: true,
      [utils.asGridCoord(7, 30)]: true,

      [utils.asGridCoord(3, 30)]: true,
      [utils.asGridCoord(3, 29)]: true,

      [utils.asGridCoord(4, 29)]: true,
      [utils.asGridCoord(5, 29)]: true,

      [utils.asGridCoord(5, 28)]: true,
      [utils.asGridCoord(5, 27)]: true,
      [utils.asGridCoord(5, 26)]: true,

      [utils.asGridCoord(1, 26)]: true,
      [utils.asGridCoord(2, 26)]: true,
      [utils.asGridCoord(3, 26)]: true,
      [utils.asGridCoord(4, 26)]: true,

      [utils.asGridCoord(16, 24)]: true,
      [utils.asGridCoord(17, 24)]: true,
      [utils.asGridCoord(18, 24)]: true,
      [utils.asGridCoord(19, 24)]: true,

      [utils.asGridCoord(2, 1)]: true,
      [utils.asGridCoord(3, 1)]: true,
      [utils.asGridCoord(4, 1)]: true,

      [utils.asGridCoord(4, 2)]: true,
      [utils.asGridCoord(4, 3)]: true,
      [utils.asGridCoord(5, 3)]: true,
      [utils.asGridCoord(6, 3)]: true,
      [utils.asGridCoord(6, 4)]: true,
      [utils.asGridCoord(6, 5)]: true,

      [utils.asGridCoord(7, 5)]: true,
      [utils.asGridCoord(8, 5)]: true,
      [utils.asGridCoord(9, 5)]: true,
      [utils.asGridCoord(10, 5)]: true,
      [utils.asGridCoord(11, 5)]: true,

      [utils.asGridCoord(11, 4)]: true,
      [utils.asGridCoord(11, 3)]: true,
      [utils.asGridCoord(11, 2)]: true,
      [utils.asGridCoord(11, 1)]: true,

      [utils.asGridCoord(12, 1)]: true,
      [utils.asGridCoord(13, 1)]: true,
      [utils.asGridCoord(14, 1)]: true,
      [utils.asGridCoord(15, 1)]: true,
      [utils.asGridCoord(16, 1)]: true,
      [utils.asGridCoord(17, 1)]: true,
      [utils.asGridCoord(18, 1)]: true,

      [utils.asGridCoord(22, 1)]: true,
      [utils.asGridCoord(22, 2)]: true,
      [utils.asGridCoord(22, 3)]: true,
      [utils.asGridCoord(22, 4)]: true,
      [utils.asGridCoord(22, 5)]: true,
      [utils.asGridCoord(22, 6)]: true,
      [utils.asGridCoord(22, 7)]: true,
      [utils.asGridCoord(22, 8)]: true,
      [utils.asGridCoord(22, 9)]: true,
      [utils.asGridCoord(22, 10)]: true,
      [utils.asGridCoord(22, 11)]: true,
      [utils.asGridCoord(22, 12)]: true,
      [utils.asGridCoord(22, 13)]: true,
      [utils.asGridCoord(22, 14)]: true,
      [utils.asGridCoord(22, 15)]: true,
      [utils.asGridCoord(22, 16)]: true,
      [utils.asGridCoord(22, 17)]: true,
      [utils.asGridCoord(22, 18)]: true,


      [utils.asGridCoord(19, 23)]: true,
      [utils.asGridCoord(20, 23)]: true,
      [utils.asGridCoord(21, 23)]: true,
      [utils.asGridCoord(22, 23)]: true,
      [utils.asGridCoord(23, 23)]: true,
      [utils.asGridCoord(24, 23)]: true,
      [utils.asGridCoord(25, 23)]: true,
      [utils.asGridCoord(26, 23)]: true,

      [utils.asGridCoord(26, 24)]: true,
      [utils.asGridCoord(26, 25)]: true,
      [utils.asGridCoord(26, 26)]: true,
      [utils.asGridCoord(26, 27)]: true,

      [utils.asGridCoord(24, 27)]: true,
      [utils.asGridCoord(24, 28)]: true,
      [utils.asGridCoord(24, 29)]: true,
      [utils.asGridCoord(24, 30)]: true,

      [utils.asGridCoord(20, 30)]: true,
      [utils.asGridCoord(20, 31)]: true,
      [utils.asGridCoord(20, 32)]: true,
      [utils.asGridCoord(20, 33)]: true,

      [utils.asGridCoord(21, 33)]: true,
      [utils.asGridCoord(22, 33)]: true,
      [utils.asGridCoord(23, 33)]: true,
      [utils.asGridCoord(24, 33)]: true,
      [utils.asGridCoord(25, 33)]: true,
      [utils.asGridCoord(26, 33)]: true,
      [utils.asGridCoord(27, 33)]: true,
      [utils.asGridCoord(28, 33)]: true,
      [utils.asGridCoord(29, 33)]: true,
      [utils.asGridCoord(30, 33)]: true,
      [utils.asGridCoord(31, 33)]: true,

      [utils.asGridCoord(31, 32)]: true,
      [utils.asGridCoord(32, 32)]: true,

      [utils.asGridCoord(33, 31)]: true,
      [utils.asGridCoord(34, 31)]: true,
      [utils.asGridCoord(35, 31)]: true,
      [utils.asGridCoord(36, 31)]: true,
      [utils.asGridCoord(37, 31)]: true,
      [utils.asGridCoord(38, 31)]: true,

      [utils.asGridCoord(38, 29)]: true,
      [utils.asGridCoord(38, 30)]: true,

      [utils.asGridCoord(39, 27)]: true,
      [utils.asGridCoord(39, 28)]: true,
      [utils.asGridCoord(39, 29)]: true,

      [utils.asGridCoord(31, 23)]: true,
      [utils.asGridCoord(31, 24)]: true,
      [utils.asGridCoord(31, 25)]: true,
      [utils.asGridCoord(31, 26)]: true,

      [utils.asGridCoord(32, 23)]: true,
      [utils.asGridCoord(33, 23)]: true,
      [utils.asGridCoord(34, 23)]: true,

      [utils.asGridCoord(33, 26)]: true,
      [utils.asGridCoord(34, 26)]: true,

      [utils.asGridCoord(27, 7)]: true,
      [utils.asGridCoord(27, 8)]: true,
      [utils.asGridCoord(27, 9)]: true,
      [utils.asGridCoord(27, 10)]: true,
      [utils.asGridCoord(27, 11)]: true,
      [utils.asGridCoord(27, 12)]: true,
      [utils.asGridCoord(27, 13)]: true,
      [utils.asGridCoord(27, 14)]: true,

      [utils.asGridCoord(29, 15)]: true,
      [utils.asGridCoord(29, 16)]: true,
      [utils.asGridCoord(29, 17)]: true,
      [utils.asGridCoord(29, 18)]: true,

      [utils.asGridCoord(21, 30)]: true,
      [utils.asGridCoord(16, 28)]: true,
      [utils.asGridCoord(23, 30)]: true,
      [utils.asGridCoord(25, 27)]: true,
      [utils.asGridCoord(35, 25)]: true,
      [utils.asGridCoord(36, 35)]: true,
      [utils.asGridCoord(37, 24)]: true,
      [utils.asGridCoord(38, 24)]: true,
      [utils.asGridCoord(39, 24)]: true,
      [utils.asGridCoord(40, 24)]: true,
      [utils.asGridCoord(28, 14)]: true,
      [utils.asGridCoord(32, 18)]: true,
      [utils.asGridCoord(33, 18)]: true,
      [utils.asGridCoord(33, 19)]: true,
      [utils.asGridCoord(33, 20)]: true,
      [utils.asGridCoord(34, 20)]: true,
      [utils.asGridCoord(34, 21)]: true,
      [utils.asGridCoord(35, 21)]: true,
      [utils.asGridCoord(36, 21)]: true,
      [utils.asGridCoord(37, 20)]: true,
      [utils.asGridCoord(38, 20)]: true,
      [utils.asGridCoord(38, 21)]: true,
      [utils.asGridCoord(38, 22)]: true,
      [utils.asGridCoord(38, 23)]: true,
      [utils.asGridCoord(35, 23)]: true,
      [utils.asGridCoord(36, 23)]: true,
      [utils.asGridCoord(37, 23)]: true,
      [utils.asGridCoord(18, 18)]: true,
      [utils.asGridCoord(30, 18)]: true,
      [utils.asGridCoord(25, 6)]: true,
      [utils.asGridCoord(27, 6)]: true,
      [utils.asGridCoord(23, 6)]: true,


      [utils.asGridCoord(36, 25)]: true,
      [utils.asGridCoord(40, 27)]: true,

      //boards
      [utils.asGridCoord(25, 9)]: true,
      [utils.asGridCoord(3, 27)]: true,
      [utils.asGridCoord(5, 31)]: true,
      [utils.asGridCoord(25, 21)]: true,
      [utils.asGridCoord(28, 18)]: true,
      [utils.asGridCoord(16, 18)]: true,


    },
    ledges: {
      [utils.asGridCoord(23, 8)]: true,
      [utils.asGridCoord(25, 8)]: true,
      [utils.asGridCoord(26, 8)]: true,
      [utils.asGridCoord(27, 25)]: true,
      [utils.asGridCoord(29, 25)]: true,
      [utils.asGridCoord(30, 25)]: true,
    },
    cutsceneSpaces: {

      [utils.asGridCoord(1, 9)]: [
        {
          events: [
            { type: "changeMap", map: "Route1", heroX: 8, heroY: 35, direction: "up" },
            { type: "textMessage", text: "You have taken route 1" },
          ]
        }
      ],
      [utils.asGridCoord(1, 10)]: [
        {
          events: [
            { type: "changeMap", map: "Route1", heroX: 9, heroY: 35, direction: "up" },
            { type: "textMessage", text: "You have taken route 1" },
          ]
        }
      ],
      [utils.asGridCoord(15, 36)]: [
        {
          events: [
            { type: "changeMap", map: "City3", heroX: 1, heroY: 3, direction: "right" },
            { type: "textMessage", text: "You have arrived in City 3" },
          ]
        }
      ],
      [utils.asGridCoord(16, 36)]: [
        {
          events: [
            { type: "changeMap", map: "City3", heroX: 1, heroY: 3, direction: "right" },
            { type: "textMessage", text: "You have arrived in City 3" },
          ]
        }
      ],
      [utils.asGridCoord(40, 25)]: [
        {
          events: [
            { type: "changeMap", map: "Route2", heroX: 0, heroY: 4, direction: "right" },
            { type: "textMessage", text: "You have taken route 2" },
          ]
        }
      ],
      [utils.asGridCoord(40, 26)]: [
        {
          events: [
            { type: "changeMap", map: "Route2", heroX: 0, heroY: 5, direction: "right" },
            { type: "textMessage", text: "You have taken route 2" },
          ]
        }
      ],
    }

  },
  City3: {
    mapName: "City3",
    lowerSrc: "images/maps/city/city3.png",
    upperSrc: "images/maps/city/0.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(1),
        y: utils.withGrid(3),
        direction: "right",
      }),
    },
    walls: {
      //fence
      [utils.asGridCoord(1, 4)]: true,
      [utils.asGridCoord(2, 4)]: true,
      [utils.asGridCoord(3, 4)]: true,
      [utils.asGridCoord(4, 4)]: true,
      [utils.asGridCoord(11, 6)]: true,
      [utils.asGridCoord(12, 6)]: true,
      [utils.asGridCoord(15, 6)]: true,
      [utils.asGridCoord(16, 6)]: true,
      [utils.asGridCoord(17, 6)]: true,
      [utils.asGridCoord(18, 6)]: true,
      [utils.asGridCoord(22, 6)]: true,
      [utils.asGridCoord(23, 6)]: true,
      [utils.asGridCoord(24, 6)]: true,
      [utils.asGridCoord(25, 6)]: true,
      [utils.asGridCoord(26, 6)]: true,
      [utils.asGridCoord(29, 6)]: true,
      [utils.asGridCoord(30, 6)]: true,
      [utils.asGridCoord(31, 6)]: true,
      [utils.asGridCoord(32, 6)]: true,
      [utils.asGridCoord(33, 6)]: true,
      [utils.asGridCoord(34, 6)]: true,
      [utils.asGridCoord(37, 6)]: true,
      [utils.asGridCoord(38, 6)]: true,

      [utils.asGridCoord(15, 22)]: true,
      [utils.asGridCoord(16, 22)]: true,
      [utils.asGridCoord(25, 22)]: true,
      [utils.asGridCoord(26, 22)]: true,

      [utils.asGridCoord(25, 30)]: true,
      [utils.asGridCoord(26, 30)]: true,


      //left wall
      [utils.asGridCoord(2, 6)]: true,
      [utils.asGridCoord(3, 6)]: true,
      [utils.asGridCoord(4, 6)]: true,
      [utils.asGridCoord(5, 6)]: true,
      [utils.asGridCoord(6, 6)]: true,
      [utils.asGridCoord(7, 6)]: true,
      [utils.asGridCoord(8, 6)]: true,
      [utils.asGridCoord(2, 34)]: true,
      [utils.asGridCoord(8, 5)]: true,
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

      [utils.asGridCoord(1, 27)]: true,
      [utils.asGridCoord(1, 28)]: true,
      [utils.asGridCoord(1, 29)]: true,
      [utils.asGridCoord(1, 30)]: true,
      [utils.asGridCoord(1, 31)]: true,
      [utils.asGridCoord(1, 32)]: true,
      [utils.asGridCoord(1, 33)]: true,
      [utils.asGridCoord(1, 34)]: true,
      [utils.asGridCoord(2, 24)]: true,
      [utils.asGridCoord(2, 27)]: true,

      //right wall
      [utils.asGridCoord(40, 5)]: true,
      [utils.asGridCoord(40, 6)]: true,
      [utils.asGridCoord(40, 7)]: true,
      [utils.asGridCoord(40, 8)]: true,
      [utils.asGridCoord(40, 9)]: true,
      [utils.asGridCoord(40, 10)]: true,
      [utils.asGridCoord(40, 11)]: true,
      [utils.asGridCoord(40, 12)]: true,
      [utils.asGridCoord(40, 13)]: true,
      [utils.asGridCoord(40, 14)]: true,
      [utils.asGridCoord(40, 15)]: true,
      [utils.asGridCoord(40, 16)]: true,
      [utils.asGridCoord(40, 17)]: true,
      [utils.asGridCoord(40, 18)]: true,
      [utils.asGridCoord(40, 19)]: true,
      [utils.asGridCoord(40, 20)]: true,
      [utils.asGridCoord(40, 21)]: true,
      [utils.asGridCoord(40, 22)]: true,
      [utils.asGridCoord(40, 25)]: true,
      [utils.asGridCoord(40, 26)]: true,
      [utils.asGridCoord(40, 27)]: true,
      [utils.asGridCoord(40, 28)]: true,
      [utils.asGridCoord(40, 29)]: true,
      [utils.asGridCoord(40, 30)]: true,
      [utils.asGridCoord(40, 31)]: true,
      [utils.asGridCoord(40, 32)]: true,
      [utils.asGridCoord(40, 33)]: true,

      [utils.asGridCoord(39, 33)]: true,
      [utils.asGridCoord(38, 33)]: true,
      [utils.asGridCoord(37, 33)]: true,
      [utils.asGridCoord(39, 25)]: true,
      [utils.asGridCoord(39, 22)]: true,

      //bottom-center wall
      [utils.asGridCoord(15, 33)]: true,
      [utils.asGridCoord(16, 33)]: true,
      [utils.asGridCoord(19, 33)]: true,
      [utils.asGridCoord(20, 33)]: true,
      [utils.asGridCoord(16, 34)]: true,
      [utils.asGridCoord(19, 34)]: true,

      //center house
      [utils.asGridCoord(5, 9)]: true,
      [utils.asGridCoord(6, 9)]: true,
      [utils.asGridCoord(7, 9)]: true,
      [utils.asGridCoord(8, 9)]: true,
      [utils.asGridCoord(9, 9)]: true,
      [utils.asGridCoord(10, 9)]: true,
      [utils.asGridCoord(11, 9)]: true,
      [utils.asGridCoord(12, 9)]: true,
      [utils.asGridCoord(13, 9)]: true,
      [utils.asGridCoord(14, 9)]: true,
      [utils.asGridCoord(15, 9)]: true,
      [utils.asGridCoord(16, 9)]: true,
      [utils.asGridCoord(5, 10)]: true,
      [utils.asGridCoord(6, 10)]: true,
      [utils.asGridCoord(16, 10)]: true,
      [utils.asGridCoord(5, 11)]: true,
      [utils.asGridCoord(16, 11)]: true,
      [utils.asGridCoord(5, 12)]: true,
      [utils.asGridCoord(6, 12)]: true,
      [utils.asGridCoord(7, 12)]: true,
      [utils.asGridCoord(8, 12)]: true,
      [utils.asGridCoord(9, 12)]: true,
      [utils.asGridCoord(11, 12)]: true,
      [utils.asGridCoord(12, 12)]: true,
      [utils.asGridCoord(13, 12)]: true,
      [utils.asGridCoord(14, 12)]: true,
      [utils.asGridCoord(15, 12)]: true,
      [utils.asGridCoord(16, 12)]: true,
      [utils.asGridCoord(25, 9)]: true,
      [utils.asGridCoord(26, 9)]: true,
      [utils.asGridCoord(27, 9)]: true,
      [utils.asGridCoord(28, 9)]: true,
      [utils.asGridCoord(29, 9)]: true,
      [utils.asGridCoord(30, 9)]: true,
      [utils.asGridCoord(31, 9)]: true,
      [utils.asGridCoord(32, 9)]: true,
      [utils.asGridCoord(33, 9)]: true,
      [utils.asGridCoord(34, 9)]: true,
      [utils.asGridCoord(35, 9)]: true,
      [utils.asGridCoord(36, 9)]: true,
      [utils.asGridCoord(25, 10)]: true,
      [utils.asGridCoord(36, 10)]: true,
      [utils.asGridCoord(25, 11)]: true,
      [utils.asGridCoord(36, 11)]: true,
      [utils.asGridCoord(25, 12)]: true,
      [utils.asGridCoord(27, 12)]: true,
      [utils.asGridCoord(28, 12)]: true,
      [utils.asGridCoord(29, 12)]: true,
      [utils.asGridCoord(30, 12)]: true,
      [utils.asGridCoord(31, 12)]: true,
      [utils.asGridCoord(32, 12)]: true,
      [utils.asGridCoord(33, 12)]: true,
      [utils.asGridCoord(34, 12)]: true,
      [utils.asGridCoord(35, 12)]: true,
      [utils.asGridCoord(36, 12)]: true,

      [utils.asGridCoord(7, 18)]: true,
      [utils.asGridCoord(14, 18)]: true,
      [utils.asGridCoord(7, 19)]: true,
      [utils.asGridCoord(14, 19)]: true,
      [utils.asGridCoord(7, 20)]: true,
      [utils.asGridCoord(14, 20)]: true,
      [utils.asGridCoord(7, 21)]: true,
      [utils.asGridCoord(14, 21)]: true,
      [utils.asGridCoord(7, 22)]: true,
      [utils.asGridCoord(14, 22)]: true,
      [utils.asGridCoord(7, 17)]: true,
      [utils.asGridCoord(7, 22)]: true,
      [utils.asGridCoord(8, 17)]: true,
      [utils.asGridCoord(8, 22)]: true,
      [utils.asGridCoord(9, 17)]: true,
      [utils.asGridCoord(9, 22)]: true,
      [utils.asGridCoord(10, 17)]: true,
      [utils.asGridCoord(10, 22)]: true,
      [utils.asGridCoord(11, 17)]: true,
      [utils.asGridCoord(11, 22)]: true,
      [utils.asGridCoord(12, 17)]: true,
      [utils.asGridCoord(12, 22)]: true,
      [utils.asGridCoord(13, 17)]: true,
      [utils.asGridCoord(13, 22)]: true,
      [utils.asGridCoord(14, 17)]: true,
      [utils.asGridCoord(14, 22)]: true,

      [utils.asGridCoord(27, 18)]: true,
      [utils.asGridCoord(34, 18)]: true,
      [utils.asGridCoord(27, 19)]: true,
      [utils.asGridCoord(34, 19)]: true,
      [utils.asGridCoord(27, 20)]: true,
      [utils.asGridCoord(34, 20)]: true,
      [utils.asGridCoord(27, 21)]: true,
      [utils.asGridCoord(34, 21)]: true,
      [utils.asGridCoord(27, 22)]: true,
      [utils.asGridCoord(34, 22)]: true,
      [utils.asGridCoord(27, 17)]: true,
      [utils.asGridCoord(27, 22)]: true,
      [utils.asGridCoord(28, 17)]: true,
      [utils.asGridCoord(28, 22)]: true,
      [utils.asGridCoord(29, 17)]: true,
      [utils.asGridCoord(29, 22)]: true,
      [utils.asGridCoord(30, 17)]: true,
      [utils.asGridCoord(30, 22)]: true,
      [utils.asGridCoord(31, 17)]: true,
      [utils.asGridCoord(31, 22)]: true,
      [utils.asGridCoord(32, 17)]: true,
      [utils.asGridCoord(32, 22)]: true,
      [utils.asGridCoord(33, 17)]: true,
      [utils.asGridCoord(33, 22)]: true,
      [utils.asGridCoord(34, 17)]: true,
      [utils.asGridCoord(34, 22)]: true,

      [utils.asGridCoord(17, 12)]: true,
      [utils.asGridCoord(24, 12)]: true,
      [utils.asGridCoord(17, 13)]: true,
      [utils.asGridCoord(24, 13)]: true,
      [utils.asGridCoord(17, 14)]: true,
      [utils.asGridCoord(24, 14)]: true,
      [utils.asGridCoord(17, 15)]: true,
      [utils.asGridCoord(24, 15)]: true,
      [utils.asGridCoord(17, 16)]: true,
      [utils.asGridCoord(24, 16)]: true,
      [utils.asGridCoord(17, 17)]: true,
      [utils.asGridCoord(24, 17)]: true,
      [utils.asGridCoord(17, 18)]: true,
      [utils.asGridCoord(24, 18)]: true,
      [utils.asGridCoord(17, 19)]: true,
      [utils.asGridCoord(24, 19)]: true,
      [utils.asGridCoord(17, 20)]: true,
      [utils.asGridCoord(24, 20)]: true,
      [utils.asGridCoord(17, 21)]: true,
      [utils.asGridCoord(24, 21)]: true,
      [utils.asGridCoord(17, 22)]: true,
      [utils.asGridCoord(24, 22)]: true,
      [utils.asGridCoord(17, 11)]: true,
      [utils.asGridCoord(17, 22)]: true,
      [utils.asGridCoord(18, 11)]: true,
      [utils.asGridCoord(18, 22)]: true,
      [utils.asGridCoord(19, 11)]: true,
      [utils.asGridCoord(20, 11)]: true,
      [utils.asGridCoord(20, 22)]: true,
      [utils.asGridCoord(21, 11)]: true,
      [utils.asGridCoord(21, 22)]: true,
      [utils.asGridCoord(22, 11)]: true,
      [utils.asGridCoord(22, 22)]: true,
      [utils.asGridCoord(23, 11)]: true,
      [utils.asGridCoord(23, 22)]: true,
      [utils.asGridCoord(24, 11)]: true,
      [utils.asGridCoord(24, 22)]: true,

      //map_boundary
      [utils.asGridCoord(0, 0)]: true,
      [utils.asGridCoord(0, 2)]: true,
      [utils.asGridCoord(0, 1)]: true,
      [utils.asGridCoord(1, 0)]: true,
      [utils.asGridCoord(2, 0)]: true,
      [utils.asGridCoord(3, 0)]: true,
      [utils.asGridCoord(4, 0)]: true,


      //top house
      [utils.asGridCoord(5, 2)]: true,
      [utils.asGridCoord(40, 2)]: true,
      [utils.asGridCoord(40, 3)]: true,
      [utils.asGridCoord(5, 4)]: true,
      [utils.asGridCoord(40, 4)]: true,
      [utils.asGridCoord(5, 1)]: true,
      [utils.asGridCoord(5, 4)]: true,
      [utils.asGridCoord(6, 1)]: true,
      [utils.asGridCoord(6, 4)]: true,
      [utils.asGridCoord(7, 1)]: true,
      [utils.asGridCoord(7, 4)]: true,
      [utils.asGridCoord(8, 1)]: true,
      [utils.asGridCoord(8, 4)]: true,
      [utils.asGridCoord(9, 1)]: true,
      [utils.asGridCoord(10, 1)]: true,
      [utils.asGridCoord(10, 4)]: true,
      [utils.asGridCoord(11, 1)]: true,
      [utils.asGridCoord(11, 4)]: true,
      [utils.asGridCoord(12, 1)]: true,
      [utils.asGridCoord(12, 4)]: true,
      [utils.asGridCoord(13, 1)]: true,
      [utils.asGridCoord(13, 4)]: true,
      [utils.asGridCoord(14, 1)]: true,
      [utils.asGridCoord(14, 4)]: true,
      [utils.asGridCoord(15, 1)]: true,
      [utils.asGridCoord(15, 4)]: true,
      [utils.asGridCoord(16, 1)]: true,
      [utils.asGridCoord(16, 4)]: true,
      [utils.asGridCoord(17, 1)]: true,
      [utils.asGridCoord(17, 4)]: true,
      [utils.asGridCoord(18, 1)]: true,
      [utils.asGridCoord(18, 4)]: true,
      [utils.asGridCoord(19, 1)]: true,
      [utils.asGridCoord(20, 1)]: true,
      [utils.asGridCoord(20, 4)]: true,
      [utils.asGridCoord(21, 1)]: true,
      [utils.asGridCoord(21, 4)]: true,
      [utils.asGridCoord(22, 1)]: true,
      [utils.asGridCoord(22, 4)]: true,
      [utils.asGridCoord(23, 1)]: true,
      [utils.asGridCoord(23, 4)]: true,
      [utils.asGridCoord(24, 1)]: true,
      [utils.asGridCoord(24, 4)]: true,
      [utils.asGridCoord(25, 1)]: true,
      [utils.asGridCoord(25, 4)]: true,
      [utils.asGridCoord(26, 1)]: true,
      [utils.asGridCoord(26, 4)]: true,
      [utils.asGridCoord(27, 1)]: true,
      [utils.asGridCoord(28, 1)]: true,
      [utils.asGridCoord(28, 4)]: true,
      [utils.asGridCoord(29, 1)]: true,
      [utils.asGridCoord(29, 4)]: true,
      [utils.asGridCoord(30, 1)]: true,
      [utils.asGridCoord(30, 4)]: true,
      [utils.asGridCoord(31, 1)]: true,
      [utils.asGridCoord(31, 4)]: true,
      [utils.asGridCoord(32, 1)]: true,
      [utils.asGridCoord(32, 4)]: true,
      [utils.asGridCoord(33, 1)]: true,
      [utils.asGridCoord(33, 4)]: true,
      [utils.asGridCoord(34, 1)]: true,
      [utils.asGridCoord(34, 4)]: true,
      [utils.asGridCoord(35, 1)]: true,
      [utils.asGridCoord(36, 1)]: true,
      [utils.asGridCoord(36, 4)]: true,
      [utils.asGridCoord(37, 1)]: true,
      [utils.asGridCoord(37, 4)]: true,
      [utils.asGridCoord(38, 1)]: true,
      [utils.asGridCoord(38, 4)]: true,
      [utils.asGridCoord(39, 1)]: true,
      [utils.asGridCoord(39, 4)]: true,
      [utils.asGridCoord(40, 1)]: true,
      [utils.asGridCoord(40, 4)]: true,

      //center bottom
      [utils.asGridCoord(5, 28)]: true,
      [utils.asGridCoord(24, 28)]: true,
      [utils.asGridCoord(5, 29)]: true,
      [utils.asGridCoord(24, 29)]: true,
      [utils.asGridCoord(5, 30)]: true,
      [utils.asGridCoord(24, 30)]: true,
      [utils.asGridCoord(5, 27)]: true,
      [utils.asGridCoord(5, 30)]: true,
      [utils.asGridCoord(6, 27)]: true,
      [utils.asGridCoord(6, 30)]: true,
      [utils.asGridCoord(7, 27)]: true,
      [utils.asGridCoord(7, 30)]: true,
      [utils.asGridCoord(8, 27)]: true,
      [utils.asGridCoord(8, 30)]: true,
      [utils.asGridCoord(9, 27)]: true,
      [utils.asGridCoord(9, 30)]: true,
      [utils.asGridCoord(10, 27)]: true,
      [utils.asGridCoord(11, 27)]: true,
      [utils.asGridCoord(11, 30)]: true,
      [utils.asGridCoord(12, 27)]: true,
      [utils.asGridCoord(12, 30)]: true,
      [utils.asGridCoord(13, 27)]: true,
      [utils.asGridCoord(13, 30)]: true,
      [utils.asGridCoord(14, 27)]: true,
      [utils.asGridCoord(14, 30)]: true,
      [utils.asGridCoord(15, 27)]: true,
      [utils.asGridCoord(15, 30)]: true,
      [utils.asGridCoord(16, 27)]: true,
      [utils.asGridCoord(16, 30)]: true,
      [utils.asGridCoord(17, 27)]: true,
      [utils.asGridCoord(17, 30)]: true,
      [utils.asGridCoord(18, 27)]: true,
      [utils.asGridCoord(18, 30)]: true,
      [utils.asGridCoord(19, 27)]: true,
      [utils.asGridCoord(19, 30)]: true,
      [utils.asGridCoord(20, 27)]: true,
      [utils.asGridCoord(20, 30)]: true,
      [utils.asGridCoord(21, 27)]: true,
      [utils.asGridCoord(21, 30)]: true,
      [utils.asGridCoord(22, 27)]: true,
      [utils.asGridCoord(22, 30)]: true,
      [utils.asGridCoord(23, 27)]: true,
      [utils.asGridCoord(23, 30)]: true,
      [utils.asGridCoord(24, 27)]: true,
      [utils.asGridCoord(24, 30)]: true,
      [utils.asGridCoord(27, 28)]: true,
      [utils.asGridCoord(34, 28)]: true,
      [utils.asGridCoord(27, 29)]: true,
      [utils.asGridCoord(34, 29)]: true,
      [utils.asGridCoord(27, 30)]: true,
      [utils.asGridCoord(34, 30)]: true,
      [utils.asGridCoord(27, 27)]: true,
      [utils.asGridCoord(27, 30)]: true,
      [utils.asGridCoord(28, 27)]: true,
      [utils.asGridCoord(29, 27)]: true,
      [utils.asGridCoord(29, 30)]: true,
      [utils.asGridCoord(30, 27)]: true,
      [utils.asGridCoord(30, 30)]: true,
      [utils.asGridCoord(31, 27)]: true,
      [utils.asGridCoord(31, 30)]: true,
      [utils.asGridCoord(32, 27)]: true,
      [utils.asGridCoord(32, 30)]: true,
      [utils.asGridCoord(33, 27)]: true,
      [utils.asGridCoord(33, 30)]: true,
      [utils.asGridCoord(34, 27)]: true,
      [utils.asGridCoord(34, 30)]: true,

      //bottom house
      [utils.asGridCoord(3, 34)]: true,
      [utils.asGridCoord(14, 34)]: true,
      [utils.asGridCoord(3, 35)]: true,
      [utils.asGridCoord(14, 35)]: true,
      [utils.asGridCoord(3, 36)]: true,
      [utils.asGridCoord(14, 36)]: true,
      [utils.asGridCoord(3, 33)]: true,
      [utils.asGridCoord(3, 36)]: true,
      [utils.asGridCoord(4, 33)]: true,
      [utils.asGridCoord(4, 36)]: true,
      [utils.asGridCoord(5, 33)]: true,
      [utils.asGridCoord(5, 36)]: true,
      [utils.asGridCoord(6, 33)]: true,
      [utils.asGridCoord(6, 36)]: true,
      [utils.asGridCoord(7, 33)]: true,
      [utils.asGridCoord(7, 36)]: true,
      [utils.asGridCoord(8, 33)]: true,
      [utils.asGridCoord(8, 36)]: true,
      [utils.asGridCoord(9, 33)]: true,
      [utils.asGridCoord(9, 36)]: true,
      [utils.asGridCoord(10, 33)]: true,
      [utils.asGridCoord(10, 36)]: true,
      [utils.asGridCoord(11, 33)]: true,
      [utils.asGridCoord(11, 36)]: true,
      [utils.asGridCoord(12, 33)]: true,
      [utils.asGridCoord(12, 36)]: true,
      [utils.asGridCoord(13, 33)]: true,
      [utils.asGridCoord(13, 36)]: true,
      [utils.asGridCoord(14, 33)]: true,
      [utils.asGridCoord(14, 36)]: true,
      [utils.asGridCoord(21, 34)]: true,
      [utils.asGridCoord(35, 34)]: true,
      [utils.asGridCoord(21, 35)]: true,
      [utils.asGridCoord(35, 35)]: true,
      [utils.asGridCoord(21, 36)]: true,
      [utils.asGridCoord(35, 36)]: true,
      [utils.asGridCoord(21, 33)]: true,
      [utils.asGridCoord(21, 36)]: true,
      [utils.asGridCoord(22, 33)]: true,
      [utils.asGridCoord(22, 36)]: true,
      [utils.asGridCoord(23, 33)]: true,
      [utils.asGridCoord(23, 36)]: true,
      [utils.asGridCoord(24, 33)]: true,
      [utils.asGridCoord(24, 36)]: true,
      [utils.asGridCoord(25, 33)]: true,
      [utils.asGridCoord(25, 36)]: true,
      [utils.asGridCoord(26, 33)]: true,
      [utils.asGridCoord(26, 36)]: true,
      [utils.asGridCoord(27, 33)]: true,
      [utils.asGridCoord(27, 36)]: true,
      [utils.asGridCoord(28, 33)]: true,
      [utils.asGridCoord(28, 36)]: true,
      [utils.asGridCoord(29, 33)]: true,
      [utils.asGridCoord(29, 36)]: true,
      [utils.asGridCoord(30, 33)]: true,
      [utils.asGridCoord(30, 36)]: true,
      [utils.asGridCoord(31, 33)]: true,
      [utils.asGridCoord(31, 36)]: true,
      [utils.asGridCoord(32, 33)]: true,
      [utils.asGridCoord(32, 36)]: true,
      [utils.asGridCoord(33, 33)]: true,
      [utils.asGridCoord(33, 36)]: true,
      [utils.asGridCoord(34, 33)]: true,
      [utils.asGridCoord(34, 36)]: true,
      [utils.asGridCoord(35, 33)]: true,
      [utils.asGridCoord(35, 36)]: true,
    },
    ledges: {

    },
    cutsceneSpaces: {
      [utils.asGridCoord(1, 3)]: [
        {
          events: [
            { type: "changeMap", map: "City2", heroX: 15, heroY: 36, direction: "up" },
            { type: "textMessage", text: "You are back in City 2" },
          ]
        }
      ],
      [utils.asGridCoord(1, 25)]: [
        {
          events: [
            { type: "changeMap", map: "Route6", heroX: 14, heroY: 17, direction: "up" },
            { type: "textMessage", text: "You have taken Route 6" },
          ]
        }
      ],
      [utils.asGridCoord(1, 26)]: [
        {
          events: [
            { type: "changeMap", map: "Route6", heroX: 13, heroY: 17, direction: "up" },
            { type: "textMessage", text: "You have taken Route 6" },
          ]
        }
      ],


    }
  },
  City4: {
    mapName: "City4",
    lowerSrc: "images/maps/city/city4.png",
    upperSrc: "images/maps/city/0.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(40),
        y: utils.withGrid(20),
        direction: "left",
      }),
    },
    walls: {

      //map boundary
      [utils.asGridCoord(0, 0)]: true,
      [utils.asGridCoord(0, 1)]: true,
      [utils.asGridCoord(0, 2)]: true,
      [utils.asGridCoord(1, 0)]: true,
      [utils.asGridCoord(2, 0)]: true,
      [utils.asGridCoord(3, 0)]: true,
      [utils.asGridCoord(4, 0)]: true,
      [utils.asGridCoord(5, 0)]: true,
      [utils.asGridCoord(6, 0)]: true,
      [utils.asGridCoord(7, 0)]: true,
      [utils.asGridCoord(8, 0)]: true,
      [utils.asGridCoord(9, 0)]: true,
      [utils.asGridCoord(10, 0)]: true,
      [utils.asGridCoord(11, 0)]: true,
      [utils.asGridCoord(12, 0)]: true,
      [utils.asGridCoord(13, 0)]: true,
      [utils.asGridCoord(14, 0)]: true,
      [utils.asGridCoord(15, 0)]: true,
      [utils.asGridCoord(16, 0)]: true,
      [utils.asGridCoord(17, 0)]: true,
      [utils.asGridCoord(18, 0)]: true,
      [utils.asGridCoord(19, 0)]: true,
      [utils.asGridCoord(20, 0)]: true,
      [utils.asGridCoord(21, 0)]: true,
      [utils.asGridCoord(22, 0)]: true,
      [utils.asGridCoord(23, 0)]: true,
      [utils.asGridCoord(24, 0)]: true,
      [utils.asGridCoord(25, 0)]: true,
      [utils.asGridCoord(26, 0)]: true,
      [utils.asGridCoord(27, 0)]: true,
      [utils.asGridCoord(28, 0)]: true,

      //house
      [utils.asGridCoord(11, 4)]: true,
      [utils.asGridCoord(18, 4)]: true,
      [utils.asGridCoord(11, 5)]: true,
      [utils.asGridCoord(18, 5)]: true,
      [utils.asGridCoord(11, 6)]: true,
      [utils.asGridCoord(18, 6)]: true,
      [utils.asGridCoord(11, 7)]: true,
      [utils.asGridCoord(18, 7)]: true,
      [utils.asGridCoord(11, 8)]: true,
      [utils.asGridCoord(18, 8)]: true,
      [utils.asGridCoord(11, 3)]: true,
      [utils.asGridCoord(11, 8)]: true,
      [utils.asGridCoord(12, 3)]: true,
      [utils.asGridCoord(12, 8)]: true,
      [utils.asGridCoord(13, 3)]: true,
      [utils.asGridCoord(13, 8)]: true,
      [utils.asGridCoord(14, 3)]: true,
      [utils.asGridCoord(14, 8)]: true,
      [utils.asGridCoord(15, 3)]: true,
      [utils.asGridCoord(15, 8)]: true,
      [utils.asGridCoord(16, 3)]: true,
      [utils.asGridCoord(16, 8)]: true,
      [utils.asGridCoord(17, 3)]: true,
      [utils.asGridCoord(17, 8)]: true,
      [utils.asGridCoord(18, 3)]: true,
      [utils.asGridCoord(18, 8)]: true,
      [utils.asGridCoord(17, 4)]: true,
      [utils.asGridCoord(22, 4)]: true,
      [utils.asGridCoord(17, 5)]: true,
      [utils.asGridCoord(22, 5)]: true,
      [utils.asGridCoord(17, 6)]: true,
      [utils.asGridCoord(22, 6)]: true,
      [utils.asGridCoord(17, 3)]: true,
      [utils.asGridCoord(17, 6)]: true,
      [utils.asGridCoord(18, 3)]: true,
      [utils.asGridCoord(18, 6)]: true,

      [utils.asGridCoord(19, 4)]: true,
      [utils.asGridCoord(24, 4)]: true,
      [utils.asGridCoord(19, 5)]: true,
      [utils.asGridCoord(24, 5)]: true,
      [utils.asGridCoord(19, 6)]: true,
      [utils.asGridCoord(24, 6)]: true,
      [utils.asGridCoord(19, 3)]: true,
      [utils.asGridCoord(19, 6)]: true,
      [utils.asGridCoord(20, 3)]: true,
      [utils.asGridCoord(20, 6)]: true,
      [utils.asGridCoord(21, 3)]: true,
      [utils.asGridCoord(21, 6)]: true,
      [utils.asGridCoord(22, 3)]: true,
      [utils.asGridCoord(22, 6)]: true,
      [utils.asGridCoord(23, 3)]: true,
      [utils.asGridCoord(23, 6)]: true,
      [utils.asGridCoord(24, 3)]: true,
      [utils.asGridCoord(24, 6)]: true,

      [utils.asGridCoord(29, 14)]: true,
      [utils.asGridCoord(32, 14)]: true,
      [utils.asGridCoord(29, 13)]: true,
      [utils.asGridCoord(29, 14)]: true,
      [utils.asGridCoord(30, 13)]: true,
      [utils.asGridCoord(31, 13)]: true,
      [utils.asGridCoord(31, 14)]: true,
      [utils.asGridCoord(32, 13)]: true,
      [utils.asGridCoord(32, 14)]: true,

      [utils.asGridCoord(23, 16)]: true,
      [utils.asGridCoord(26, 16)]: true,
      [utils.asGridCoord(23, 17)]: true,
      [utils.asGridCoord(26, 17)]: true,
      [utils.asGridCoord(23, 18)]: true,
      [utils.asGridCoord(26, 18)]: true,
      [utils.asGridCoord(23, 15)]: true,
      [utils.asGridCoord(23, 18)]: true,
      [utils.asGridCoord(24, 15)]: true,
      [utils.asGridCoord(25, 15)]: true,
      [utils.asGridCoord(25, 18)]: true,
      [utils.asGridCoord(26, 15)]: true,
      [utils.asGridCoord(26, 18)]: true,

      [utils.asGridCoord(13, 16)]: true,
      [utils.asGridCoord(18, 16)]: true,
      [utils.asGridCoord(13, 17)]: true,
      [utils.asGridCoord(18, 17)]: true,
      [utils.asGridCoord(13, 18)]: true,
      [utils.asGridCoord(18, 18)]: true,
      [utils.asGridCoord(13, 15)]: true,
      [utils.asGridCoord(13, 18)]: true,
      [utils.asGridCoord(14, 15)]: true,
      [utils.asGridCoord(14, 18)]: true,
      [utils.asGridCoord(15, 15)]: true,
      [utils.asGridCoord(15, 18)]: true,
      [utils.asGridCoord(16, 15)]: true,
      [utils.asGridCoord(16, 18)]: true,
      [utils.asGridCoord(17, 15)]: true,
      [utils.asGridCoord(18, 15)]: true,
      [utils.asGridCoord(18, 18)]: true,

      [utils.asGridCoord(13, 24)]: true,
      [utils.asGridCoord(16, 24)]: true,
      [utils.asGridCoord(13, 25)]: true,
      [utils.asGridCoord(16, 25)]: true,
      [utils.asGridCoord(13, 26)]: true,
      [utils.asGridCoord(16, 26)]: true,
      [utils.asGridCoord(13, 23)]: true,
      [utils.asGridCoord(13, 26)]: true,
      [utils.asGridCoord(14, 23)]: true,
      [utils.asGridCoord(15, 23)]: true,
      [utils.asGridCoord(15, 26)]: true,
      [utils.asGridCoord(16, 23)]: true,
      [utils.asGridCoord(16, 26)]: true,

      [utils.asGridCoord(7, 30)]: true,
      [utils.asGridCoord(10, 30)]: true,
      [utils.asGridCoord(7, 29)]: true,
      [utils.asGridCoord(7, 30)]: true,
      [utils.asGridCoord(8, 29)]: true,
      [utils.asGridCoord(9, 29)]: true,
      [utils.asGridCoord(9, 30)]: true,
      [utils.asGridCoord(10, 29)]: true,
      [utils.asGridCoord(10, 30)]: true,

      //walls
      [utils.asGridCoord(35, 12)]: true,
      [utils.asGridCoord(35, 13)]: true,
      [utils.asGridCoord(35, 14)]: true,
      [utils.asGridCoord(35, 15)]: true,
      [utils.asGridCoord(35, 16)]: true,
      [utils.asGridCoord(40, 16)]: true,
      [utils.asGridCoord(35, 11)]: true,
      [utils.asGridCoord(35, 16)]: true,
      [utils.asGridCoord(36, 11)]: true,
      [utils.asGridCoord(36, 16)]: true,
      [utils.asGridCoord(37, 11)]: true,
      [utils.asGridCoord(37, 16)]: true,
      [utils.asGridCoord(38, 11)]: true,
      [utils.asGridCoord(38, 16)]: true,
      [utils.asGridCoord(39, 11)]: true,
      [utils.asGridCoord(39, 16)]: true,
      [utils.asGridCoord(40, 11)]: true,
      [utils.asGridCoord(40, 16)]: true,

      [utils.asGridCoord(35, 22)]: true,
      [utils.asGridCoord(35, 23)]: true,
      [utils.asGridCoord(35, 24)]: true,
      [utils.asGridCoord(35, 25)]: true,
      [utils.asGridCoord(35, 26)]: true,
      [utils.asGridCoord(35, 21)]: true,
      [utils.asGridCoord(35, 26)]: true,
      [utils.asGridCoord(36, 21)]: true,
      [utils.asGridCoord(36, 26)]: true,
      [utils.asGridCoord(37, 21)]: true,
      [utils.asGridCoord(37, 26)]: true,
      [utils.asGridCoord(38, 21)]: true,
      [utils.asGridCoord(38, 26)]: true,
      [utils.asGridCoord(39, 21)]: true,
      [utils.asGridCoord(39, 26)]: true,
      [utils.asGridCoord(40, 21)]: true,
      [utils.asGridCoord(40, 26)]: true,


      [utils.asGridCoord(36, 27)]: true,
      [utils.asGridCoord(36, 28)]: true,
      [utils.asGridCoord(36, 29)]: true,
      [utils.asGridCoord(36, 30)]: true,
      [utils.asGridCoord(36, 31)]: true,
      [utils.asGridCoord(36, 32)]: true,

      [utils.asGridCoord(4, 31)]: true,
      [utils.asGridCoord(4, 32)]: true,
      [utils.asGridCoord(4, 32)]: true,
      [utils.asGridCoord(5, 2)]: true,
      [utils.asGridCoord(5, 33)]: true,
      [utils.asGridCoord(6, 2)]: true,
      [utils.asGridCoord(6, 33)]: true,
      [utils.asGridCoord(7, 2)]: true,
      [utils.asGridCoord(7, 33)]: true,
      [utils.asGridCoord(8, 2)]: true,
      [utils.asGridCoord(8, 33)]: true,
      [utils.asGridCoord(9, 2)]: true,
      [utils.asGridCoord(9, 33)]: true,
      [utils.asGridCoord(10, 2)]: true,
      [utils.asGridCoord(10, 33)]: true,
      [utils.asGridCoord(11, 2)]: true,
      [utils.asGridCoord(11, 33)]: true,
      [utils.asGridCoord(12, 2)]: true,
      [utils.asGridCoord(12, 33)]: true,
      [utils.asGridCoord(13, 2)]: true,
      [utils.asGridCoord(13, 33)]: true,
      [utils.asGridCoord(14, 2)]: true,
      [utils.asGridCoord(14, 33)]: true,
      [utils.asGridCoord(15, 2)]: true,
      [utils.asGridCoord(15, 33)]: true,
      [utils.asGridCoord(16, 2)]: true,
      [utils.asGridCoord(16, 33)]: true,
      [utils.asGridCoord(17, 2)]: true,
      [utils.asGridCoord(17, 33)]: true,
      [utils.asGridCoord(18, 2)]: true,
      [utils.asGridCoord(18, 33)]: true,
      [utils.asGridCoord(19, 2)]: true,
      [utils.asGridCoord(20, 2)]: true,
      [utils.asGridCoord(21, 2)]: true,
      [utils.asGridCoord(21, 33)]: true,
      [utils.asGridCoord(22, 2)]: true,
      [utils.asGridCoord(22, 33)]: true,
      [utils.asGridCoord(23, 2)]: true,
      [utils.asGridCoord(23, 33)]: true,
      [utils.asGridCoord(24, 2)]: true,
      [utils.asGridCoord(24, 33)]: true,
      [utils.asGridCoord(25, 2)]: true,
      [utils.asGridCoord(25, 33)]: true,
      [utils.asGridCoord(26, 2)]: true,
      [utils.asGridCoord(26, 33)]: true,
      [utils.asGridCoord(27, 2)]: true,
      [utils.asGridCoord(27, 33)]: true,
      [utils.asGridCoord(28, 2)]: true,
      [utils.asGridCoord(28, 33)]: true,
      [utils.asGridCoord(29, 2)]: true,
      [utils.asGridCoord(29, 33)]: true,
      [utils.asGridCoord(30, 2)]: true,
      [utils.asGridCoord(30, 33)]: true,
      [utils.asGridCoord(31, 2)]: true,
      [utils.asGridCoord(31, 33)]: true,
      [utils.asGridCoord(32, 2)]: true,
      [utils.asGridCoord(32, 33)]: true,
      [utils.asGridCoord(33, 2)]: true,
      [utils.asGridCoord(33, 33)]: true,
      [utils.asGridCoord(34, 2)]: true,
      [utils.asGridCoord(34, 33)]: true,
      [utils.asGridCoord(35, 2)]: true,
      [utils.asGridCoord(35, 33)]: true,
      [utils.asGridCoord(1, 3)]: true,
      [utils.asGridCoord(2, 3)]: true,
      [utils.asGridCoord(3, 3)]: true,

      [utils.asGridCoord(4, 4)]: true,
      [utils.asGridCoord(4, 5)]: true,
      [utils.asGridCoord(4, 6)]: true,
      [utils.asGridCoord(4, 7)]: true,
      [utils.asGridCoord(4, 8)]: true,
      [utils.asGridCoord(4, 9)]: true,
      [utils.asGridCoord(4, 10)]: true,
      [utils.asGridCoord(4, 11)]: true,
      [utils.asGridCoord(4, 12)]: true,
      [utils.asGridCoord(4, 13)]: true,
      [utils.asGridCoord(4, 14)]: true,
      [utils.asGridCoord(4, 15)]: true,
      [utils.asGridCoord(4, 16)]: true,
      [utils.asGridCoord(4, 17)]: true,
      [utils.asGridCoord(4, 18)]: true,
      [utils.asGridCoord(4, 19)]: true,
      [utils.asGridCoord(4, 20)]: true,
      [utils.asGridCoord(4, 21)]: true,
      [utils.asGridCoord(4, 22)]: true,
      [utils.asGridCoord(4, 23)]: true,
      [utils.asGridCoord(4, 24)]: true,
      [utils.asGridCoord(4, 25)]: true,
      [utils.asGridCoord(4, 26)]: true,
      [utils.asGridCoord(4, 27)]: true,
      [utils.asGridCoord(4, 28)]: true,
      [utils.asGridCoord(4, 29)]: true,
      [utils.asGridCoord(4, 30)]: true,

      //misc
      [utils.asGridCoord(34, 20)]: true,
      [utils.asGridCoord(5, 22)]: true,
      [utils.asGridCoord(6, 22)]: true,
      [utils.asGridCoord(7, 22)]: true,
      [utils.asGridCoord(8, 22)]: true,
      [utils.asGridCoord(9, 22)]: true,
      [utils.asGridCoord(10, 22)]: true,
      [utils.asGridCoord(11, 22)]: true,
      [utils.asGridCoord(12, 22)]: true,
      [utils.asGridCoord(13, 22)]: true,
      [utils.asGridCoord(14, 22)]: true,
      [utils.asGridCoord(15, 22)]: true,
      [utils.asGridCoord(16, 22)]: true,
      [utils.asGridCoord(17, 22)]: true,
      [utils.asGridCoord(18, 22)]: true,
      [utils.asGridCoord(19, 22)]: true,
      [utils.asGridCoord(19, 21)]: true,
      [utils.asGridCoord(19, 20)]: true,
      [utils.asGridCoord(19, 19)]: true,

      [utils.asGridCoord(3, 31)]: true,
      [utils.asGridCoord(3, 32)]: true,
      [utils.asGridCoord(3, 33)]: true,

      [utils.asGridCoord(23, 24)]: true,
      [utils.asGridCoord(24, 24)]: true,
      [utils.asGridCoord(25, 24)]: true,
      [utils.asGridCoord(26, 24)]: true,
      [utils.asGridCoord(27, 24)]: true,
      [utils.asGridCoord(28, 24)]: true,
      [utils.asGridCoord(29, 24)]: true,
      [utils.asGridCoord(30, 24)]: true,

      [utils.asGridCoord(20, 30)]: true,
      [utils.asGridCoord(12, 18)]: true,
      [utils.asGridCoord(16, 10)]: true,

      //forest
      [utils.asGridCoord(22, 25)]: true,
      [utils.asGridCoord(22, 26)]: true,
      [utils.asGridCoord(22, 27)]: true,
      [utils.asGridCoord(22, 28)]: true,
      [utils.asGridCoord(22, 29)]: true,
      [utils.asGridCoord(22, 30)]: true,
      [utils.asGridCoord(31, 25)]: true,
      [utils.asGridCoord(31, 26)]: true,
      [utils.asGridCoord(31, 27)]: true,
      [utils.asGridCoord(31, 28)]: true,
      [utils.asGridCoord(31, 29)]: true,
      [utils.asGridCoord(31, 30)]: true,

      [utils.asGridCoord(29, 1)]: true,
      [utils.asGridCoord(30, 1)]: true,
      [utils.asGridCoord(31, 1)]: true,
      [utils.asGridCoord(32, 1)]: true,
      [utils.asGridCoord(33, 1)]: true,
      [utils.asGridCoord(34, 1)]: true,
      [utils.asGridCoord(35, 1)]: true,
      [utils.asGridCoord(35, 3)]: true,
      [utils.asGridCoord(35, 4)]: true,
      [utils.asGridCoord(36, 2)]: true,
      [utils.asGridCoord(40, 2)]: true,
      [utils.asGridCoord(36, 3)]: true,
      [utils.asGridCoord(40, 3)]: true,
      [utils.asGridCoord(36, 4)]: true,
      [utils.asGridCoord(40, 4)]: true,
      [utils.asGridCoord(36, 5)]: true,
      [utils.asGridCoord(40, 5)]: true,
      [utils.asGridCoord(36, 6)]: true,
      [utils.asGridCoord(40, 6)]: true,
      [utils.asGridCoord(36, 7)]: true,
      [utils.asGridCoord(40, 7)]: true,
      [utils.asGridCoord(36, 8)]: true,
      [utils.asGridCoord(40, 8)]: true,
      [utils.asGridCoord(36, 9)]: true,
      [utils.asGridCoord(40, 9)]: true,
      [utils.asGridCoord(36, 10)]: true,
      [utils.asGridCoord(40, 10)]: true,
      [utils.asGridCoord(36, 1)]: true,
      [utils.asGridCoord(36, 10)]: true,
      [utils.asGridCoord(37, 1)]: true,
      [utils.asGridCoord(37, 10)]: true,
      [utils.asGridCoord(38, 1)]: true,
      [utils.asGridCoord(38, 10)]: true,
      [utils.asGridCoord(39, 1)]: true,
      [utils.asGridCoord(39, 10)]: true,
      [utils.asGridCoord(40, 1)]: true,
      [utils.asGridCoord(40, 10)]: true,

      [utils.asGridCoord(13, 34)]: true,
      [utils.asGridCoord(18, 34)]: true,
      [utils.asGridCoord(13, 35)]: true,
      [utils.asGridCoord(18, 35)]: true,
      [utils.asGridCoord(13, 36)]: true,
      [utils.asGridCoord(18, 36)]: true,
      [utils.asGridCoord(13, 33)]: true,
      [utils.asGridCoord(13, 36)]: true,
      [utils.asGridCoord(14, 33)]: true,
      [utils.asGridCoord(14, 36)]: true,
      [utils.asGridCoord(15, 33)]: true,
      [utils.asGridCoord(15, 36)]: true,
      [utils.asGridCoord(16, 33)]: true,
      [utils.asGridCoord(16, 36)]: true,
      [utils.asGridCoord(17, 33)]: true,
      [utils.asGridCoord(17, 36)]: true,
      [utils.asGridCoord(18, 33)]: true,
      [utils.asGridCoord(18, 36)]: true,

      [utils.asGridCoord(21, 35)]: true,
      [utils.asGridCoord(26, 35)]: true,
      [utils.asGridCoord(21, 36)]: true,
      [utils.asGridCoord(26, 36)]: true,
      [utils.asGridCoord(21, 34)]: true,
      [utils.asGridCoord(21, 36)]: true,
      [utils.asGridCoord(22, 34)]: true,
      [utils.asGridCoord(22, 36)]: true,
      [utils.asGridCoord(23, 34)]: true,
      [utils.asGridCoord(23, 36)]: true,
      [utils.asGridCoord(24, 34)]: true,
      [utils.asGridCoord(24, 36)]: true,
      [utils.asGridCoord(25, 34)]: true,
      [utils.asGridCoord(25, 36)]: true,
      [utils.asGridCoord(26, 34)]: true,
      [utils.asGridCoord(26, 36)]: true,
    },
    ledges: {
      [utils.asGridCoord(23, 31)]: true,
      [utils.asGridCoord(24, 31)]: true,
      [utils.asGridCoord(25, 31)]: true,
      [utils.asGridCoord(27, 31)]: true,
      [utils.asGridCoord(28, 31)]: true,
      [utils.asGridCoord(29, 31)]: true,
      [utils.asGridCoord(30, 31)]: true,

      [utils.asGridCoord(5, 9)]: true,
      [utils.asGridCoord(6, 9)]: true,
      [utils.asGridCoord(7, 9)]: true,
      [utils.asGridCoord(9, 9)]: true,
      [utils.asGridCoord(10, 9)]: true,

      [utils.asGridCoord(19, 9)]: true,
      [utils.asGridCoord(20, 9)]: true,
      [utils.asGridCoord(21, 9)]: true,
      [utils.asGridCoord(22, 9)]: true,
      [utils.asGridCoord(23, 9)]: true,
      [utils.asGridCoord(24, 9)]: true,
      [utils.asGridCoord(25, 9)]: true,
      [utils.asGridCoord(26, 9)]: true,
      [utils.asGridCoord(27, 9)]: true,
      [utils.asGridCoord(28, 9)]: true,
      [utils.asGridCoord(29, 9)]: true,
      [utils.asGridCoord(30, 9)]: true,
      [utils.asGridCoord(31, 9)]: true,
      [utils.asGridCoord(33, 9)]: true,
      [utils.asGridCoord(34, 9)]: true,
      [utils.asGridCoord(35, 9)]: true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(40, 17)]: [
        {
          events: [
            { type: "changeMap", map: "Route2", heroX: 6, heroY: 17, direction: "up" },
            { type: "textMessage", text: "You have taken route 2" },
          ]
        }
      ],
      [utils.asGridCoord(40, 18)]: [
        {
          events: [
            { type: "changeMap", map: "Route2", heroX: 6, heroY: 17, direction: "up" },
            { type: "textMessage", text: "You have taken route 2" },
          ]
        }
      ],
      [utils.asGridCoord(40, 19)]: [
        {
          events: [
            { type: "changeMap", map: "Route2", heroX: 7, heroY: 17, direction: "up" },
            { type: "textMessage", text: "You have taken route 2" },
          ]
        }
      ],
      [utils.asGridCoord(40, 20)]: [
        {
          events: [
            { type: "changeMap", map: "Route2", heroX: 6, heroY: 17, direction: "up" },
            { type: "textMessage", text: "You have taken route 2" },
          ]
        }
      ],
      [utils.asGridCoord(19, 36)]: [
        {
          events: [
            { type: "changeMap", map: "Route6", heroX: 6, heroY: 17, direction: "up" },
            { type: "textMessage", text: "You have taken route 6" },
          ]
        }
      ],
      [utils.asGridCoord(20, 36)]: [
        {
          events: [
            { type: "changeMap", map: "Route6", heroX: 7, heroY: 17, direction: "up" },
            { type: "textMessage", text: "You have taken route 6" },
          ]
        }
      ],
    }
  },
  City5: {
    mapName: "City5",
    lowerSrc: "images/map/city/city5.png",
    upperSrc: "images/maps/city/0.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(1),
        y: utils.withGrid(9),
        direction: "down",
      }),
    },
    walls: {

    },
    ledges: {

    },
    cutsceneSpaces: {

    }
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
            { type: "changeMap", map: "City1", heroX: 28, heroY: 20, direction: "up" },
            { type: "textMessage", text: "You are back in city 1" },
          ]
        }
      ],
      [utils.asGridCoord(9, 0)]: [

        {
          events: [
            { type: "changeMap", map: "City1", heroX: 29, heroY: 20, direction: "up" },
            { type: "textMessage", text: "You are back in city 1" },
          ]
        }
      ],
      [utils.asGridCoord(8, 35)]: [
        {
          events: [
            { type: "changeMap", map: "City2", heroX: 1, heroY: 9, direction: "right" },
            { type: "textMessage", text: "You have arrived in city 2 " },
          ]
        }
      ],
      [utils.asGridCoord(9, 35)]: [

        {
          events: [
            { type: "changeMap", map: "City2", heroX: 1, heroY: 10, direction: "right" },
            { type: "textMessage", text: "You have arrived in city 2" },
          ]
        }
      ],
    }

  },
  Route2: {
    mapName: "Route2",
    lowerSrc: "images/maps/routes/route2.png",
    upperSrc: "images/maps/city/0.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(0),
        y: utils.withGrid(4),
        direction: "right",
      }),
    },
    walls: {
      //house
      [utils.asGridCoord(4, 1)]: true,
      [utils.asGridCoord(9, 1)]: true,
      [utils.asGridCoord(4, 0)]: true,
      [utils.asGridCoord(4, 1)]: true,
      [utils.asGridCoord(5, 0)]: true,
      [utils.asGridCoord(5, 1)]: true,
      [utils.asGridCoord(6, 0)]: true,
      [utils.asGridCoord(7, 0)]: true,
      [utils.asGridCoord(7, 1)]: true,
      [utils.asGridCoord(8, 0)]: true,
      [utils.asGridCoord(8, 1)]: true,
      [utils.asGridCoord(9, 0)]: true,
      [utils.asGridCoord(9, 1)]: true,

      [utils.asGridCoord(16, 1)]: true,
      [utils.asGridCoord(19, 1)]: true,
      [utils.asGridCoord(16, 2)]: true,
      [utils.asGridCoord(19, 2)]: true,
      [utils.asGridCoord(16, 3)]: true,
      [utils.asGridCoord(19, 3)]: true,
      [utils.asGridCoord(16, 0)]: true,
      [utils.asGridCoord(16, 3)]: true,
      [utils.asGridCoord(17, 0)]: true,
      [utils.asGridCoord(18, 0)]: true,
      [utils.asGridCoord(18, 3)]: true,
      [utils.asGridCoord(19, 0)]: true,
      [utils.asGridCoord(19, 3)]: true,

      //walls
      [utils.asGridCoord(0, 10)]: true,
      [utils.asGridCoord(1, 10)]: true,
      [utils.asGridCoord(2, 10)]: true,
      [utils.asGridCoord(3, 10)]: true,
      [utils.asGridCoord(4, 10)]: true,
      [utils.asGridCoord(5, 10)]: true,
      [utils.asGridCoord(6, 10)]: true,
      [utils.asGridCoord(7, 10)]: true,
      [utils.asGridCoord(8, 10)]: true,
      [utils.asGridCoord(9, 10)]: true,
      [utils.asGridCoord(10, 10)]: true,
      [utils.asGridCoord(11, 10)]: true,
      [utils.asGridCoord(12, 10)]: true,
      [utils.asGridCoord(13, 10)]: true,
      [utils.asGridCoord(0, 11)]: true,
      [utils.asGridCoord(0, 12)]: true,
      [utils.asGridCoord(0, 13)]: true,
      [utils.asGridCoord(0, 14)]: true,
      [utils.asGridCoord(0, 15)]: true,
      [utils.asGridCoord(13, 11)]: true,
      [utils.asGridCoord(3, 12)]: true,
      [utils.asGridCoord(3, 13)]: true,
      [utils.asGridCoord(3, 14)]: true,
      [utils.asGridCoord(3, 15)]: true,

      [utils.asGridCoord(0, 16)]: true,
      [utils.asGridCoord(1, 16)]: true,
      [utils.asGridCoord(2, 16)]: true,
      [utils.asGridCoord(3, 16)]: true,
      [utils.asGridCoord(4, 16)]: true,
      [utils.asGridCoord(5, 16)]: true,
      [utils.asGridCoord(8, 16)]: true,
      [utils.asGridCoord(9, 16)]: true,
      [utils.asGridCoord(10, 16)]: true,
      [utils.asGridCoord(11, 16)]: true,
      [utils.asGridCoord(12, 16)]: true,
      [utils.asGridCoord(13, 16)]: true,
      [utils.asGridCoord(14, 16)]: true,
      [utils.asGridCoord(15, 16)]: true,
      [utils.asGridCoord(16, 16)]: true,
      [utils.asGridCoord(17, 16)]: true,
      [utils.asGridCoord(18, 16)]: true,
      [utils.asGridCoord(19, 16)]: true,
      [utils.asGridCoord(5, 17)]: true,
      [utils.asGridCoord(8, 17)]: true,

      //misc
      [utils.asGridCoord(19, 5)]: true,
    },
    ledges: {
      [utils.asGridCoord(0, 2)]: true,
      [utils.asGridCoord(1, 2)]: true,
      [utils.asGridCoord(2, 2)]: true,

      [utils.asGridCoord(10, 2)]: true,
      [utils.asGridCoord(11, 2)]: true,
      [utils.asGridCoord(12, 2)]: true,
      [utils.asGridCoord(14, 2)]: true,
      [utils.asGridCoord(15, 2)]: true,

      [utils.asGridCoord(0, 4)]: true,
      [utils.asGridCoord(1, 4)]: true,
      [utils.asGridCoord(2, 4)]: true,
      [utils.asGridCoord(3, 4)]: true,
      [utils.asGridCoord(4, 4)]: true,
      [utils.asGridCoord(5, 4)]: true,
      [utils.asGridCoord(6, 4)]: true,
      [utils.asGridCoord(8, 4)]: true,
      [utils.asGridCoord(9, 4)]: true,
      [utils.asGridCoord(10, 4)]: true,
      [utils.asGridCoord(11, 4)]: true,
      [utils.asGridCoord(12, 4)]: true,
      [utils.asGridCoord(13, 4)]: true,
      [utils.asGridCoord(14, 4)]: true,
      [utils.asGridCoord(15, 4)]: true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(0, 4)]: [
        {
          events: [
            { type: "changeMap", map: "City2", heroX: 40, heroY: 25, direction: "left" },
            { type: "textMessage", text: "You are back in city 2" },
          ]
        }
      ],
      [utils.asGridCoord(0, 5)]: [
        {
          events: [
            { type: "changeMap", map: "City2", heroX: 40, heroY: 26, direction: "left" },
            { type: "textMessage", text: "You are back in city 2" },
          ]
        }
      ],
      [utils.asGridCoord(6, 17)]: [
        {
          events: [
            { type: "changeMap", map: "City4", heroX: 40, heroY: 18, direction: "left" },
            { type: "textMessage", text: "You have arrived in city 4" },
          ]
        }
      ],
      [utils.asGridCoord(7, 17)]: [
        {
          events: [
            { type: "changeMap", map: "City4", heroX: 40, heroY: 19, direction: "left" },
            { type: "textMessage", text: "You have arrived in city 4" },
          ]
        }
      ],
    }
  },
  Route3: {
    mapName: "Route3",
    lowerSrc: "images/maps/routes/route3.png",
    upperSrc: "images/maps/city/0.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(1),
        y: utils.withGrid(9),
        direction: "down",
      }),
    },
    walls: {

    },
    ledges: {

    },
    cutsceneSpaces: {

    }
  },
  Route4: {
    mapName: "Route2",
    lowerSrc: "images/maps/routes/route4.png",
    upperSrc: "images/maps/city/0.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(1),
        y: utils.withGrid(9),
        direction: "down",
      }),
    },
    walls: {

    },
    ledges: {

    },
    cutsceneSpaces: {

    }
  },
  Route5: {
    mapName: "Route5",
    lowerSrc: "images/maps/routes/route5.png",
    upperSrc: "images/maps/city/0.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(1),
        y: utils.withGrid(9),
        direction: "down",
      }),
    },
    walls: {

    },
    ledges: {

    },
    cutsceneSpaces: {

    }
  },
  Route6: {
    mapName: "Route6",
    lowerSrc: "images/maps/routes/route6.png",
    upperSrc: "images/maps/city/0.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(15),
        y: utils.withGrid(17),
        direction: "down",
      }),
    },
    walls: {
      //map boundary

      //misc
      [utils.asGridCoord(5, 3)]: true,

      //forest
      [utils.asGridCoord(1, 0)]: true,
      [utils.asGridCoord(1, 17)]: true,
      [utils.asGridCoord(2, 0)]: true,
      [utils.asGridCoord(2, 17)]: true,
      [utils.asGridCoord(3, 0)]: true,
      [utils.asGridCoord(3, 17)]: true,
      [utils.asGridCoord(0, 0)]: true,
      [utils.asGridCoord(3, 0)]: true,
      [utils.asGridCoord(0, 1)]: true,
      [utils.asGridCoord(3, 1)]: true,
      [utils.asGridCoord(0, 2)]: true,
      [utils.asGridCoord(3, 2)]: true,
      [utils.asGridCoord(0, 3)]: true,
      [utils.asGridCoord(3, 3)]: true,
      [utils.asGridCoord(0, 4)]: true,
      [utils.asGridCoord(3, 4)]: true,
      [utils.asGridCoord(0, 5)]: true,
      [utils.asGridCoord(3, 5)]: true,
      [utils.asGridCoord(0, 6)]: true,
      [utils.asGridCoord(3, 6)]: true,
      [utils.asGridCoord(0, 7)]: true,
      [utils.asGridCoord(3, 7)]: true,
      [utils.asGridCoord(0, 8)]: true,
      [utils.asGridCoord(3, 8)]: true,
      [utils.asGridCoord(0, 9)]: true,
      [utils.asGridCoord(3, 9)]: true,
      [utils.asGridCoord(0, 10)]: true,
      [utils.asGridCoord(3, 10)]: true,
      [utils.asGridCoord(0, 11)]: true,
      [utils.asGridCoord(3, 11)]: true,
      [utils.asGridCoord(0, 12)]: true,
      [utils.asGridCoord(3, 12)]: true,
      [utils.asGridCoord(0, 13)]: true,
      [utils.asGridCoord(3, 13)]: true,
      [utils.asGridCoord(0, 14)]: true,
      [utils.asGridCoord(3, 14)]: true,
      [utils.asGridCoord(0, 15)]: true,
      [utils.asGridCoord(3, 15)]: true,
      [utils.asGridCoord(0, 16)]: true,
      [utils.asGridCoord(3, 16)]: true,
      [utils.asGridCoord(0, 17)]: true,
      [utils.asGridCoord(3, 17)]: true,
      [utils.asGridCoord(4, 14)]: true,
      [utils.asGridCoord(4, 15)]: true,
      [utils.asGridCoord(4, 16)]: true,
      [utils.asGridCoord(4, 17)]: true,
      [utils.asGridCoord(4, 1)]: true,
      [utils.asGridCoord(6, 1)]: true,
      [utils.asGridCoord(4, 0)]: true,
      [utils.asGridCoord(4, 1)]: true,
      [utils.asGridCoord(5, 0)]: true,
      [utils.asGridCoord(5, 1)]: true,
      [utils.asGridCoord(6, 0)]: true,
      [utils.asGridCoord(6, 1)]: true,

      [utils.asGridCoord(11, 2)]: true,
      [utils.asGridCoord(11, 7)]: true,
      [utils.asGridCoord(10, 2)]: true,
      [utils.asGridCoord(11, 2)]: true,
      [utils.asGridCoord(10, 3)]: true,
      [utils.asGridCoord(11, 3)]: true,
      [utils.asGridCoord(10, 4)]: true,
      [utils.asGridCoord(11, 4)]: true,
      [utils.asGridCoord(10, 5)]: true,
      [utils.asGridCoord(11, 5)]: true,
      [utils.asGridCoord(10, 6)]: true,
      [utils.asGridCoord(11, 6)]: true,
      [utils.asGridCoord(10, 7)]: true,
      [utils.asGridCoord(11, 7)]: true,
      [utils.asGridCoord(11, 15)]: true,
      [utils.asGridCoord(12, 8)]: true,
      [utils.asGridCoord(12, 15)]: true,
      [utils.asGridCoord(13, 8)]: true,
      [utils.asGridCoord(13, 15)]: true,
      [utils.asGridCoord(10, 8)]: true,
      [utils.asGridCoord(13, 8)]: true,
      [utils.asGridCoord(10, 9)]: true,
      [utils.asGridCoord(13, 9)]: true,
      [utils.asGridCoord(10, 10)]: true,
      [utils.asGridCoord(13, 10)]: true,
      [utils.asGridCoord(10, 11)]: true,
      [utils.asGridCoord(13, 11)]: true,
      [utils.asGridCoord(10, 12)]: true,
      [utils.asGridCoord(13, 12)]: true,
      [utils.asGridCoord(10, 13)]: true,
      [utils.asGridCoord(13, 13)]: true,
      [utils.asGridCoord(13, 14)]: true,
      [utils.asGridCoord(10, 15)]: true,
      [utils.asGridCoord(13, 15)]: true,
      [utils.asGridCoord(9, 14)]: true,
      [utils.asGridCoord(9, 15)]: true,

      [utils.asGridCoord(6, 11)]: true,
      [utils.asGridCoord(7, 11)]: true,
      [utils.asGridCoord(6, 10)]: true,
      [utils.asGridCoord(7, 10)]: true,

      [utils.asGridCoord(14, 3)]: true,
      [utils.asGridCoord(15, 3)]: true,
      [utils.asGridCoord(16, 3)]: true,
      [utils.asGridCoord(17, 3)]: true,
      [utils.asGridCoord(14, 0)]: true,
      [utils.asGridCoord(14, 1)]: true,
      [utils.asGridCoord(14, 2)]: true,
      [utils.asGridCoord(18, 4)]: true,
      [utils.asGridCoord(18, 5)]: true,
      [utils.asGridCoord(18, 6)]: true,
      [utils.asGridCoord(18, 7)]: true,
      [utils.asGridCoord(18, 8)]: true,
      [utils.asGridCoord(18, 9)]: true,
      [utils.asGridCoord(18, 10)]: true,
      [utils.asGridCoord(18, 11)]: true,
      [utils.asGridCoord(18, 12)]: true,
      [utils.asGridCoord(18, 13)]: true,
      [utils.asGridCoord(18, 14)]: true,
      [utils.asGridCoord(18, 15)]: true,
      [utils.asGridCoord(16, 16)]: true,
      [utils.asGridCoord(17, 16)]: true,
      [utils.asGridCoord(16, 17)]: true,
    },
    ledges: {
      [utils.asGridCoord(4, 8)]: true,
      [utils.asGridCoord(5, 8)]: true,
      [utils.asGridCoord(8, 8)]: true,
      [utils.asGridCoord(9, 8)]: true,

      [utils.asGridCoord(12, 4)]: true,
      [utils.asGridCoord(13, 4)]: true,

    },
    cutsceneSpaces: {
      [utils.asGridCoord(15, 17)]: [
        {
          events: [
            { type: "changeMap", map: "City3", heroX: 1, heroY: 25, direction: "right" },
            { type: "textMessage", text: "You are back in City 3" },
          ]
        }
      ],
      [utils.asGridCoord(14, 17)]: [
        {
          events: [
            { type: "changeMap", map: "City3", heroX: 1, heroY: 26, direction: "right" },
            { type: "textMessage", text: "You are back in City 3" },
          ]
        }
      ],
      [utils.asGridCoord(6, 17)]: [
        {
          events: [
            { type: "changeMap", map: "City4", heroX: 19, heroY: 36, direction: "up" },
            { type: "textMessage", text: "You are back in City 4" },
          ]
        }
      ],
      [utils.asGridCoord(7, 17)]: [
        {
          events: [
            { type: "changeMap", map: "City4", heroX: 20, heroY: 36, direction: "up" },
            { type: "textMessage", text: "You are back in City 4" },
          ]
        }
      ],
    }
  }
};
