public with sharing class STAC_ChatGPTController {
 
    private static final String API_KEY = System.Label.Chat_GPT_API_Key;
    private static final String ENDPOINT_URL ='https://api.openai.com/v1/chat/completions'; 
    
    /**
     * @description Method to generate response from ChatGPT
     */
    @AuraEnabled(cacheable=false)
    public static String getQueryData(String messageText, String model, String temperature) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(ENDPOINT_URL);
        req.setMethod('POST');
        req.setTimeout(1000*120);
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Authorization', 'Bearer ' + API_KEY); // Add the API key to the request header


        // Set the request body
        String prompt = 'You are a helpful assistant.\nUser: ' + messageText + '\nAssistant:';
        Map<String, Object> PromptBody = new Map<String, Object>();
        PromptBody.put('role','user');
        PromptBody.put('content',messageText);

        List<Object> lstPrompts = new List<Object>();
        lstPrompts.add(PromptBody);

        Map<String, Object> requestBody = new Map<String, Object>();
        requestBody.put('messages', lstPrompts);
        requestBody.put('model', model);
        requestBody.put('temperature',Decimal.valueOf(temperature));

        req.setBody(JSON.serialize(requestBody));

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            Map<String, Object> responseBody = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
            List<Object> choices = (List<Object>)responseBody.get('choices');
            if (choices.size() > 0) {
                Map<String, Object> choice = (Map<String, Object>)choices.get(0);
                Map<String,Object> mpMessages = (Map<String,Object>)choice.get('message');

                String responseText = (String)mpMessages.get('content');

                responseText = responseText != null ? responseText.trim() : '';
                return responseText;
            }
        } else {
            System.debug('Error: ' + res.getStatusCode() + ' ' + res.getStatus());
            throw new ChatGPTException('Error: Unable to generate response from ChatGPT.');
        }

        return '';
    }

    /**
     * @description Custom exception class
     */
    public class ChatGPTException extends Exception {}
}