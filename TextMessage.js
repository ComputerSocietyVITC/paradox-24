class TextMessage {
  constructor({ text, link, onComplete }) {
    this.text = text;
    this.onComplete = onComplete;
    this.element = null;
    this.link = link;
  }

  createElement() {
    //Create the element
    this.element = document.createElement("div");
    this.element.classList.add("TextMessage");

    if (this.link) {
      this.element.innerHTML = (`
        <p class="TextMessage_p"></p>
        <a href="${this.link}" target="_blank" class="TextMessage_a">Download</a>
        <button class="TextMessage_button">Next</button>
      `)
    } else {
      this.element.innerHTML = (`
        <p class="TextMessage_p"></p>
        <button class="TextMessage_button">Next</button>
      `)
    }
    
    //Init the typewriter effect
    this.revealingText = new RevealingText({
      element: this.element.querySelector(".TextMessage_p"),
      text: this.text
    })

    this.element.querySelector("button").addEventListener("click", () => {
      //Close the text message
      this.done();
    });

    this.actionListener = new KeyPressListener("Enter", () => {
      this.done();
    })

  }

  done() {

    if (this.revealingText.isDone) {
      this.element.remove();
      this.actionListener.unbind();
      this.onComplete();
    } else {
      this.revealingText.warpToDone();
    }
  }

  init(container) {
    this.createElement();
    container.appendChild(this.element);
    this.revealingText.init();
  }

}