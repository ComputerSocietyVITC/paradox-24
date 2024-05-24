class QuestionMessage {
  constructor({ question, answer, onComplete }) {
    this.question = question;
    this.answer = answer;
    this.onComplete = onComplete;
    this.element = null;
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.classList.add("QuestionMessage");

    this.element.innerHTML = `
      <p class="QuestionMessage_p"></p>
      <textarea class="QuestionMessage_textarea"></textarea>
      <button class="QuestionMessage_button">Submit</button>
    `;

    // Init the typewriter effect for the question
    this.revealingText = new RevealingText({
      element: this.element.querySelector(".QuestionMessage_p"),
      text: this.question,
    });

    this.element.querySelector("button").addEventListener("click", () => {
      this.checkAnswer();
    });

    // Prevent "Enter" from creating a new line in the textarea
    this.element
      .querySelector(".QuestionMessage_textarea")
      .addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this.checkAnswer();
        }
      });
  }

  checkAnswer() {
    const userAnswer = this.element.querySelector(
      ".QuestionMessage_textarea"
    ).value;
    const isCorrect = userAnswer === this.answer;

    // Remove the question element
    this.element.remove();

    // Pass the user's answer to the onComplete function
    this.onComplete(isCorrect, userAnswer);
  }
  init(container) {
    this.createElement();
    container.appendChild(this.element);
    this.revealingText.init(); // Start the typewriter effect
  }
}
