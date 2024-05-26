class Overlay{

    constructor(config){
        this.money = 0;
        this.element = null;
        this.overworld = null;

        this.overlay = new Image();
        // this.overlay.src = config.src;
        // this.overlay.offset = config.offset;
    }

    // drawOverlay(ctx){    
    //     ctx.drawImage(
    //       this.overlay,
    //       utils.withGrid(0 - this.overlay.offset) ,
    //       utils.withGrid(-7)
    //     );
    //   }    

    setMoney(object){

        if(object.event.qsnValue > 0){
            console.log(object.event.qsnValue);

            this.money += object.event.qsnValue;
            // this.overlay.offset += 2;
            object.event.qsnValue = 0;

            this.element.innerHTML = (`
            <p class="Hud">Points: ${this.money}</p> 
        `)
        }
        console.log(this.money);
    }

    init(container){

        //Create the element
        this.element = document.createElement("div");
        this.element.classList.add("Hud");

        this.element.innerHTML = (`
            <p class="Hud">Points: ${this.money}</p> 
        `)

        container.appendChild(this.element);

    }
}