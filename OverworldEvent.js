class OverworldEvent {
  constructor({ map, event }) {
    this.map = map;
    this.event = event;
  }

  stand(resolve) {
    const who = this.map.gameObjects[this.event.who];
    who.startBehavior(
      {
        map: this.map,
      },
      {
        type: "stand",
        direction: this.event.direction,
        time: this.event.time,
      }
    );

    const completeHandler = (e) => {
      if (e.detail.whoId === this.event.who) {
        document.removeEventListener("PersonStandComplete", completeHandler);
        resolve();
      }
    };
    document.addEventListener("PersonStandComplete", completeHandler);
  }

  walk(resolve) {
    const who = this.map.gameObjects[this.event.who];
    who.startBehavior(
      {
        map: this.map,
      },
      {
        type: "walk",
        direction: this.event.direction,
        retry: true,
      }
    );

    const completeHandler = (e) => {
      if (e.detail.whoId === this.event.who) {
        document.removeEventListener("PersonWalkingComplete", completeHandler);
        resolve();
      }
    };
    document.addEventListener("PersonWalkingComplete", completeHandler);
  }

  textMessage(resolve) {
    if (this.event.faceHero) {
      const obj = this.map.gameObjects[this.event.faceHero];
      obj.direction = utils.oppositeDirection(
        this.map.gameObjects["hero"].direction
      );
    }

    const message = new TextMessage({
      text: this.event.text,
      onComplete: () => resolve(),
    });
    message.init(document.querySelector(".game-container"));
  }

  questionMessage(resolve) {
    if (this.event.faceHero) {
      const obj = this.map.gameObjects[this.event.faceHero];
      obj.direction = utils.oppositeDirection(
        this.map.gameObjects["hero"].direction
      );
    }

    const question = new QuestionMessage({
      map: this.map,
      question: this.event.question,
      answer: this.event.answer,
      qsnValue: this.event.qsnValue,     // Points to be rewarded for correct answer
      onComplete: (isCorrect, userAnswer) => {
        console.log(`User answered correctly: ${isCorrect}`);

        if (isCorrect) {
          this.map.overworld.setMoney(this);

        }

        const feedbackMessage = new TextMessage({
          text: isCorrect ? "Correct!" : "Incorrect, try again!",
          onComplete: () => resolve(isCorrect),
        });
        feedbackMessage.init(document.querySelector(".game-container"));
      },
    });
    question.init(document.querySelector(".game-container"));
  }

  changeMap(resolve) {
    this.map.removeWall(this.map.gameObjects.hero.x, this.map.gameObjects.hero.y);

    window.OverworldMaps[this.event.map].gameObjects.hero.x = utils.withGrid(this.event.heroX);
    window.OverworldMaps[this.event.map].gameObjects.hero.y = utils.withGrid(this.event.heroY);
    window.OverworldMaps[this.event.map].gameObjects.hero.direction = this.event.direction;

    const sceneTransition = new SceneTransition();

    sceneTransition.init(document.querySelector(".game-container"), () => {
      this.map.overworld.startMap(window.OverworldMaps[this.event.map],);
      resolve();

      sceneTransition.fadeOut();
    });

  }

  init() {
    console.log(`Event type: ${this.event.type}`);
    return new Promise((resolve) => {
      this[this.event.type](resolve);
    });
  }
}
