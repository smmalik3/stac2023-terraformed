global class STAC_ChatGPTModelDropdownController extends VisualEditor.DynamicPickList{
    // TODO: INCOMPLETE CLASS
    private static final String ENDPOINT_URL ='https://api.openai.com/v1/models'; 
    private static final String API_KEY = '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';
    

    global override VisualEditor.DataRow getDefaultValue(){
        VisualEditor.DataRow defaultValue = new VisualEditor.DataRow('gpt-3.5-turbo', 'gpt-3.5-turbo');
        return defaultValue;
    }

    global override VisualEditor.DynamicPickListRows getValues() {

        VisualEditor.DynamicPickListRows  models = new VisualEditor.DynamicPickListRows();
        HttpRequest req = new HttpRequest();
        req.setEndpoint(ENDPOINT_URL);
        req.setMethod('GET');
        req.setTimeout(1000*120);
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Authorization', 'Bearer ' + API_KEY); // Add the API key to the request header
		
        Http http = new Http();
        HttpResponse res = http.send(req);
	
	  	Map<String, Object> responseBody = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
  		List<Object> data = (List<Object>)responseBody.get('data');

        for(Object model : data){
            Map<String,Object> rMap = (Map<String,Object>)model;
            String modelName = (String)rMap.get('id');
            models.addRow(new VisualEditor.DataRow(String.valueOf(modelName),  String.valueOf(modelName)));
        }

        return models;
    }
}