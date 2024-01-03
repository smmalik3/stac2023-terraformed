public with sharing class STAC_JobDescriptionController {

    private static ChatGPTKey__c customSetting = ChatGPTKey__c.getOrgDefaults();
    private static final String ENDPOINT_URL ='https://api.openai.com/v1/chat/completions'; 
    private static final String API_KEY = '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';

    @AuraEnabled
    public static String getJobDescription(String jobId) {
        Posting__c jobPosting;
        try {
            jobPosting = [SELECT Id, Title__c, Preferred_Education_Level__c, Years_Of_Experience__c, Position_Classification__c, Location__c, Minimum_Salary__c, Maximum_Salary__c, Job_DescriptionPrompt__c
                        FROM Posting__c
                        WHERE Id = :jobId 
                        LIMIT 1];
        } catch (QueryException e) {
            System.debug('Error fetching job posting record: ' + e.getMessage());
            throw new AuraHandledException('Error fetching job posting record: ' + e.getMessage());
        }
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint(ENDPOINT_URL);
        req.setMethod('POST');
        req.setTimeout(1000*120);
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Authorization', 'Bearer ' + API_KEY); // Add the API key to the request header

        // Set the request body
        String prompt = jobPosting.Job_DescriptionPrompt__c;
        // String prompt = 'Write a Job Description for a ' + jobPosting.Title__c + ' with a ' +
        //     jobPosting.Preferred_Education_Level__c + ' education or ' + jobPosting.Years_Of_Experience__c +
        //     '. The job is ' + jobPosting.Position_Classification__c + ' located at ' + jobPosting.Location__c +
        //     ' with a salary range of ' + jobPosting.Minimum_Salary__c + ' to ' + jobPosting.Maximum_Salary__c;

        System.debug(prompt);

        Map<String, Object> PromptBody = new Map<String, Object>();
        PromptBody.put('role','system');
        PromptBody.put('content',prompt);

        List<Object> lstPrompts = new List<Object>();
        lstPrompts.add(PromptBody);

        Map<String, Object> requestBody = new Map<String, Object>();
        requestBody.put('messages', lstPrompts);
        requestBody.put('model', 'gpt-3.5-turbo');

        req.setBody(JSON.serialize(requestBody));
        System.debug('Request Body: ' + req.getBody());

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            System.debug(res.getBody());
            Map<String, Object> responseBody = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
            List<Object> choices = (List<Object>)responseBody.get('choices');
            if (choices.size() > 0) {
                Map<String, Object> choice = (Map<String, Object>)choices.get(0);
                Map<String,Object> mpMessages = (Map<String,Object>)choice.get('message');

                String responseText = (String)mpMessages.get('content');

                responseText = responseText != null ? responseText.trim() : '';
                System.debug('Response Text: ' + responseText);
                jobPosting.Job_Description__c = responseText; 
                update jobPosting; 
                return responseText;
            }
        } else {
            System.debug('Error: ' + res.getStatusCode() + ' ' + res.getStatus());
            throw new ChatGPTException('Error: Unable to generate response from ChatGPT.');
        }
        return '';
    }
    
    public class ChatGPTException extends Exception {}
    
}