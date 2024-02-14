import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getJobDescription from '@salesforce/apex/STAC_JobDescriptionController.getJobDescription';

export default class JobDescriptionGenerator extends NavigationMixin(LightningElement) {
    @api recordId; // This will hold the recordId of the current record page the component is placed on
    isLoading = false;

    connectedCallback() {
        console.log('Record Id:', this.recordId);
    }

    // Call the Apex method on button click
    generateJobDescription() {
        this.isLoading = true; // turn on spinner
        getJobDescription({ jobId: this.recordId })
        .then(result => {
            // This will display a success message
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Job description generated',
                    variant: 'success',
                }),
            );
            this.isLoading = false; // turn off spinner
            // refresh the page
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.recordId,
                    objectApiName: 'Posting__c', // object API name
                    actionName: 'view'
                },
            });
        })
        .catch(error => {
            // This will display an error message
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error generating job description',
                    message: error.body.message,
                    variant: 'error',
                }),
            );
            this.isLoading = false;
        });
    }

}