function sendToChatGPT(requirements) {
    var prompt = constructPrompt(requirements);
    var response = callOpenAI(prompt);
	// response = JSON.stringify(response)
	response = response.choices[0].message.content;
	current.setValue('assessment', response);
	current.update();
    return response;
}

function constructPrompt(requirements) {
    // Construct your prompt using the fields of the requirements object
    // return 'Generate a job description for the following role:\nTitle: ' + requirements.title + '\nLocation: ' + requirements.location + '\nExperience: ' + requirements.yearsOfExperience + ' years\nSalary Range: ' + 'Minimum Salary=' + requirements.salaryMin + ' Maximum Salary=' + requirements.salaryMax + '\nAgency: ' + requirements.agency + '\nDescription:';
	// return 'Write a job description for a ' + requirements.agency + ' ' + requirements.title + ' with a ' + requirements.education + ' or ' + requirements.yearsOfExperience + ' years of experience. The job will pose a ' + requirements.sensitivity + ' risk to national security. The job is ' + requirements.classification + ' located in ' + requirements.location + ' with a salary range of ' + requirements.salaryMin + ' to ' + requirements.salaryMax + '. The position will require ' + requirements.travel + ' travel.';
    return 'These are my application requirements, ability to build custom objects:' +  requirements.customObjects + ' ability to build custom fields: ' + requirements.customFields + ' ability to build Data Integrations: ' + requirements.dataIntegrations + ' ability to have bi-directional transactions: ' + requirements.biDirectionalFlow + ' ability to create a custom frontend: ' + requirements.frontend + ' is Fedramped: ' + requirements.fedRamp + 'What SaaS platform would be best for this? Can you rate each of these platforms from 1 - 10, 1 being the worst or hardest platform to accomplish this and 10 being the best or easiest.' 
}

function callOpenAI(messageContent) {
    try {
        var requestBody = {
            'model': 'gpt-4', // Ensure this is the correct model identifier
            'messages': [{'role': 'user', 'content': messageContent}],
            'temperature': 0.7
        };

        var restMessage = new sn_ws.RESTMessageV2();
        // Update the endpoint URL to the Chat API
        restMessage.setEndpoint('https://api.openai.com/v1/chat/completions');
        restMessage.setHttpMethod('POST');
        restMessage.setRequestHeader('Authorization', 'Bearer <bruh, put your API key here>'); // Replace with your actual API key
        restMessage.setRequestHeader('Content-Type', 'application/json');
        restMessage.setRequestBody(JSON.stringify(requestBody));

        var response = restMessage.execute();
        var responseBody = response.getBody();
        var httpStatus = response.getStatusCode();

        if (httpStatus !== 200) {
            gs.error('Error in calling OpenAI Chat API. HTTP Status: ' + httpStatus);
            return 'Error in calling OpenAI Chat API. HTTP Status: ' + httpStatus;
        }

        var parsedResponse = JSON.parse(responseBody);
        return parsedResponse;
    } catch (ex) {
        gs.error('Error in callOpenAIChat: ' + ex.message);
        return null;
    }
}
// Example usage in a ServiceNow script
var requirements = {
    frontend: current.getValue('build_front_end'),
    customFields: current.getValue('custom_fields'),
    customObjects: current.getValue('custom_objects'),
	dataIntegrations: current.getValue('data_integrations'),
	biDirectionalFlow: current.getValue('bi_directional_transactions'),
    fedRamp: current.getValue('fedramp'),
};

var generatedDescription = sendToChatGPT(requirements);
gs.info(generatedDescription);
action.setRedirectURL(current);
