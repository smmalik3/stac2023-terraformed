function sendToChatGPT(jobDescription) {
    var prompt = constructPrompt(jobDescription);
    var response = callOpenAI(prompt);
	// response = JSON.stringify(response)
	response = response.choices[0].message.content;
	current.setValue('generated_job_description', response);
	current.update();
    return response;
}

function constructPrompt(jobDescription) {
    // Construct your prompt using the fields of the jobDescription object
    // return 'Generate a job description for the following role:\nTitle: ' + jobDescription.title + '\nLocation: ' + jobDescription.location + '\nExperience: ' + jobDescription.yearsOfExperience + ' years\nSalary Range: ' + 'Minimum Salary=' + jobDescription.salaryMin + ' Maximum Salary=' + jobDescription.salaryMax + '\nAgency: ' + jobDescription.agency + '\nDescription:';
	return 'Write a job description for a ' + jobDescription.agency + ' ' + jobDescription.title + ' with a ' + jobDescription.education + ' or ' + jobDescription.yearsOfExperience + ' years of experience. The job will pose a ' + jobDescription.sensitivity + ' risk to national security. The job is ' + jobDescription.classification + ' located in ' + jobDescription.location + ' with a salary range of ' + jobDescription.salaryMin + ' to ' + jobDescription.salaryMax + '. The position will require ' + jobDescription.travel + ' travel.';
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
        restMessage.setRequestHeader('Authorization', 'Bearer <ADD API KEY HERE>'); // Replace with your actual API key
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
var jobDescription = {
    title: current.getValue('job_title'),
    location: current.getValue('job_location'),
    yearsOfExperience: current.getValue('years_of_experience'),
	salaryMin: current.getValue('minimum_salary'),
	salaryMax: current.getValue('maximum_salary'),
    agency: current.getValue('agency'),
	travel: current.getValue('travel_required'),
	sensitivity: current.getValue('position_sensitivity_and_risk'),
	education: current.getValue('preferred_education_level'),
	classification: current.getValue('position_classfication')
};

var generatedDescription = sendToChatGPT(jobDescription);
gs.info(generatedDescription);
action.setRedirectURL(current);