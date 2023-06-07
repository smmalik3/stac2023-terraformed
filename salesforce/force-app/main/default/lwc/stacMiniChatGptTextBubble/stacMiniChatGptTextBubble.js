import { LightningElement, api } from 'lwc';

export default class StacMiniChatGptTextBubble extends LightningElement {

    // object with two things message and sender
    @api textBubble;


    get textBubbleStyle(){
        return `text-bubble ${this.textBubble.sender}`;
    }

    get textBubbleAlignment(){
        return `text-container text-container-${this.textBubble.sender}`;
    }

}