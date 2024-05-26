class QuestionMessage {
  constructor({ question, answer, qsnValue, onComplete }) {
    this.question = question;
    this.answer = answer;
    this.qsnValue = qsnValue;      // Points rewarded to each qsn
    this.onComplete = onComplete;
    this.element = null;
    this.isAnswered = false; // To prevent multiple submissions   
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.classList.add("QuestionMessage");

    this.element.innerHTML = `
      <p class="QuestionMessage_p"></p>
      <textarea class="QuestionMessage_textarea"></textarea>
      <button class="QuestionMessage_button">Submit</button>
    `;

    this.revealingText = new RevealingText({
      element: this.element.querySelector(".QuestionMessage_p"),
      text: this.question,
    });

    this.element.querySelector("button").addEventListener("click", () => {
      this.checkAnswer();
    });

    this.element
      .querySelector(".QuestionMessage_textarea")
      .addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault(); // Prevent the default action (newline)
          this.checkAnswer();
        }
      });
  }

  checkAnswer() {
    if (this.isAnswered) return; // Prevent multiple submissions

    const userAnswer = this.element.querySelector(
      ".QuestionMessage_textarea"
    ).value;
    const isCorrect = userAnswer === this.answer;
    this.isAnswered = true;

    this.element.remove();
    this.onComplete(isCorrect, userAnswer);
  }

  init(container) {
    this.createElement();
    container.appendChild(this.element);
    this.revealingText.init(); // Start the typewriter effect
  }
}
