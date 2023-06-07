import { LightningElement, api, track } from 'lwc';
import getQueryData from '@salesforce/apex/STAC_ChatGPTController.getQueryData';

const temperatureMap = new Map([
  ['low', '0.3'],
  ['medium' , '0.7'],
  ['high', '1']
]);

export default class StacMiniChatGpt extends LightningElement {


    @api apiKey;
    @api introMessage;
    @api model;
    @api temperature;
    
    searchTerm = '';
    showSpinner = false;
    searchResults;

    responseData;
    responseTextLWCJS;
    showSpace = false;


    @track textBubbles = [];

    handleChange(event){
      this.searchTerm = event.target.value;
    }

    connectedCallback(){
      this.textBubbles.push({message: this.introMessage, sender: 'chatbot', key: `text bubble: ${new Date().getTime()}`});
      this.textBubbles = [...this.textBubbles];
    }

    handleKeyDown(event) {
        
        // Perform search when the Enter key is pressed
        if (event.keyCode === 13 && !this.isEmpty(this.searchTerm)) {
        
          this.textBubbles.push({message: this.searchTerm, sender: 'user', key: `text bubble: ${new Date().getTime()}`});
          this.textBubbles = [...this.textBubbles];
          this.showSpinner = true
          
          getQueryData({messageText:this.searchTerm, model : this.model, temperature: temperatureMap.get(this.temperature)})
           .then(result=>{
             this.showSpinner = false;
             // Blank out what the user types after the enter key was hit
             this.searchTerm = '';
             let response = result;
             
             let split = this.splitString(response);

             split.forEach( (x, index) => {
                let updatedString = x;

                if(x.charAt(0) === '\n'){
                  updatedString = updatedString.split(''); // Convert the string to an array of characters
                  updatedString.splice(0, 1, ''); // Replace the character at index 4 with ','
                  updatedString = updatedString.join(''); // Convert the array of characters back to a string
                }
                
                if(index % 2 === 1){
                  this.textBubbles.push({message: updatedString, sender: 'code', key: ` ${index} text bubble: ${new Date().getTime()}`});
                } else{
                  this.textBubbles.push({message: updatedString, sender: 'chatbot', key: `${index} - text bubble: ${new Date().getTime()}`});
                }
                
             });

            this.textBubbles = [...this.textBubbles];
           })
           .catch(error=>{
             this.showSpinner = false
             console.error('error is '+ JSON.parse(JSON.stringify(error)));
           })
      
          this.searchResults = results;
          if(this.searchResults.length > 0 )
            this.showSpace =false
        }
      
    }

    splitString(str){
      const seperator = /```/;
      let result = str.split(seperator);
      return result.filter( (x) => x.trim() !== "");
    }
    
    isEmpty(input){
      if (!input.trim().length) {
        return true;
      }

      return false;
    };  
}