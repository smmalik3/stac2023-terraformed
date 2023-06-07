public class CustomButtonController {
    private ApexPages.StandardController standardController;
    private static final String ENDPOINT_URL = System.Label.AWS_Upload_URL;

    public CustomButtonController (ApexPages.StandardController controller) {
        this.standardController = controller;
    }
    
     public void customAction() {

    //Get Application Record so we can get ID
    Application__c app = (Application__c) standardController.getRecord();

    //Query for the Content Document Link where Application ID = Current Record
    List<ContentDocumentLink> links=[SELECT ContentDocumentId,LinkedEntityId FROM ContentDocumentLink where LinkedEntityId=:app.Id];
    
    //Set the New ID
    Set<Id> ids=new Set<Id>();
    for(ContentDocumentLink link:links)
    {
    ids.add(link.ContentDocumentId);
    }

    ////Query for the ContentVersion where the ID = ContentDocumentID
    List<ContentVersion> versions=[SELECT VersionData,Title,ContentDocumentId,FileExtension FROM ContentVersion WHERE ContentDocumentId = :ids AND IsLatest = true];
    
    //If you get data back, attach the query contents to paramters which will be used in the HTTP Request
    if (versions.size() > 0) {
        String attachmentBody = EncodingUtil.base64Encode(versions[0].VersionData);
        //Blob attachmentBody = versions[0].VersionData;
        system.debug('file:'+ versions[0]);
        String formattedDateString = Datetime.now().formatGMT('EEE, dd MMM yyyy HH:mm:ss z');
        String filename = versions[0].Title + '.' + versions[0].FileExtension;
    
    //String url = 'callout: Connect_to_S3';
    String url = ENDPOINT_URL;
    
        
    Map<String, Object> payload = new Map<String, Object>();
    payload.put('filename', filename);
    payload.put('content', attachmentBody);
    
    //Instatite the HTTP Request and Response
    HttpRequest req  = new HttpRequest();
    HttpResponse res  = new HttpResponse();
    
    //Create the HTTP Request
    req.setMethod('PUT');
    req.setEndpoint(url);
    req.setBody(JSON.serialize(payload));

    Http http = new Http();
    res = http.send(req);
    system.debug(res.getStatusCode());
    system.debug(res.getBody());
}
}
}