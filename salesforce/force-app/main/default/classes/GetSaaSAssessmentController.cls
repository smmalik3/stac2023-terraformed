public with sharing class GetSaaSAssessmentController {

    private static ChatGPTKey__c customSetting = ChatGPTKey__c.getOrgDefaults();
    private static final String ENDPOINT_URL ='https://api.openai.com/v1/chat/completions'; 
    private static final String API_KEY = System.Label.Chat_GPT_API_Key;

    @AuraEnabled
    public static String getEvaluation(String evalId) {
        Evaluation__c evaluation;
        try {
            evaluation = [SELECT Id, Bi_directional_Transactions__c, Build_Front_End__c, Custom_Fields__c, Custom_Objects__c, Data_Integrations__c, Describe_your_use_case__c, FedRamp__c, Priority_1__c, Priority_2__c, Priority_3__c, Priority_4__c, Priority_Flexibility__c
                        FROM Evaluation__c
                        WHERE Id = :evalId 
                        LIMIT 1];
        } catch (QueryException e) {
            System.debug('Error fetching evaluation record: ' + e.getMessage());
            throw new AuraHandledException('Error fetching evaluation record: ' + e.getMessage());
        }
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint(ENDPOINT_URL);
        req.setMethod('POST');
        req.setTimeout(1000*120);
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Authorization', 'Bearer ' + API_KEY); // Add the API key to the request header

        // Set the request body
        String prompt = evaluation.Evaluation_Prompt__c;
        // String prompt = "These are my application requirements, ability to build custom objects:" + IF(Custom_Objects__c, "True", "False") + " ability to build custom fields: " + IF(Custom_Fields__c, "True", "False") + " ability to build Data Integrations: " + IF(Data_Integrations__c, "True", "False") + " ability to have bi-directional transactions: " + IF(Bi_directional_Transactions__c, "True", "False") + " ability to create a custom frontend: " + IF(Build_Front_End__c, "True", "False") + " is Fedramped: " + IF(FedRamp__c, "True", "False") + "The ranking for functionality is set by the following, with priority 1 being the most important and priority 4 being the least important, priority 1 = " + TEXT(Priority_1__c) + " priority 2 = " + TEXT(Priority_2__c) + " priority 3 = " + TEXT(Priority_3__c) + " priority 4 = " + TEXT(Priority_4__c) + "The level of flexibility on the priorities is equal to " + TEXT(Priority_Flexibility__c) + "The use case is " + LEFT(Describe_your_use_case__c, 200) + "What SaaS platform, limited to Salesforce, ServiceNow, Oracle, and Outsystems, would be best for this? Can you give an overall rating for each of these platforms from 1 - 10, do not break it down by anything, 1 being the worst or hardest platform to accomplish this and 10 being the best or easiest, and share your reasoning for the scores."
        System.debug(prompt);

        Map<String, Object> PromptBody = new Map<String, Object>();
        PromptBody.put('role','system');
        PromptBody.put('content',prompt);

        List<Object> lstPrompts = new List<Object>();
        lstPrompts.add(PromptBody);

        Map<String, Object> requestBody = new Map<String, Object>();
        requestBody.put('messages', lstPrompts);
        requestBody.put('model', 'gpt-4');

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
                evaluation.Assessment__c = responseText; 
                update evaluation; 
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