import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getEvaluation from '@salesforce/apex/GetSaaSAssessmentController.getEvaluation';

export default class GetSaasEvaluation extends NavigationMixin(LightningElement) {
    @api recordId; // This will hold the recordId of the current record page the component is placed on
    isLoading = false;

    connectedCallback() {
        console.log('Record Id:', this.recordId);
    }

    // Call the Apex method on button click
    getSaasEvaluation() {
        this.isLoading = true; // turn on spinner
        getEvaluation({ evalId: this.recordId })
        .then(result => {
            // This will display a success message
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'SaaS Assessment Generated',
                    variant: 'success',
                }),
            );
            this.isLoading = false; // turn off spinner
            // refresh the page
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.recordId,
                    objectApiName: 'Evaluation__c', // object API name
                    actionName: 'view'
                },
            });
        })
        .catch(error => {
            // This will display an error message
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error generating SaaS assessment',
                    message: error.body.message,
                    variant: 'error',
                }),
            );
            this.isLoading = false;
        });
    }
}