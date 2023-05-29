const AWS = require('aws-sdk');
const textract = new AWS.Textract();
const {Configuration,OpenAIApi} = require("openai");
const axios = require('axios');

module.exports.readS3File = async (event) => {

  // Get the name of the file to be processed from the event object
  const filename = event.Records[0].s3.object.key;

  console.log("filename ==========>>>>>> " + filename)
  // Create an instance of the S3 client
  const s3 = new AWS.S3();

  // Set the parameters for the getObject method to retrieve the file from S3
  const params = {
    Bucket: event.Records[0].s3.bucket.name,
    Key: filename,
  };

  try {
    // Use the getObject method to retrieve the file from S3
    const s3Response = await s3.getObject(params).promise();
    
    // Send file to Amazon Textract
    // Set the parameters for the detectDocumentText method
    const textractParams = {
      Document: {
        Bytes: s3Response.Body,
      }
    };

    try {
      // Call the detectDocumentText method to start looking for text in the uplodaed file
      const response = await textract.detectDocumentText(textractParams).promise();
      
      // Extract the text from the response
      const text = response.Blocks.reduce((acc, block) => {
        if (block.BlockType === 'LINE') {
          acc += `${block.Text} `;
        }
        return acc;
      }, '');

      console.log("TEXT FROM TEXTRACT ======================>>>>>>>>>> " + text);

      const resume = text
      // The following var makes the prompt too complicated and ChatGPT doesn't know how to handle it, which leads to returning a previous response.
      // const gpt_error_check = "If the previous text is not a resume, please say that it is not a resume and stop generating, otherwise if it is, continue and"
      const jobDescription = "Software Engineer (3 Years Experience) - Deloitte Digital Position Title: Software Engineer (3 Years Experience) Department: Deloitte Digital Position Summary: The Software Engineer will design, develop, test and maintain enterprise applications. This individual will work closely with other software engineers and other departments to ensure that all applications are built, maintained and deployed in a manner that meets customer requirements and business objectives. Responsibilities: Design, develop, test, and maintain software applications in accordance with customer requirements and business objectives. Analyze customer requirements and business objectives to create technical design documents. Develop and ensure quality assurance of software applications with a focus on scalability, performance, and reliability. Collaborate with other software engineers to ensure that applications are built, maintained and deployed in a manner that meets customer requirements and business objectives. Troubleshoot and debug applications to identify and resolve issues. Provide technical guidance and mentorship to junior software engineers. Stay up-to-date with developments in software engineering and related technologies. Qualifications: Bachelor’s degree in computer science, software engineering, or a related field. 3+ years of professional software engineering experience. Proficient in programming languages such as Java, Python, and JavaScript. Experience in developing web services and APIs. Knowledge of Agile development practices and software engineering principles. Knowledge of database technologies such as SQL and NoSQL. Strong problem-solving, analytical, and communication skills. Ability to work both independently and collaboratively in a fast-paced, customer-focused environment."

      const prompt = resume + "\n\n" + "Please compare the resume to the following job description: \n\n" + jobDescription + "\n\nDoes the candidate appear to have relevant experience for the above job description?"
      
      configuration = new Configuration({
          apiKey: process.env.OPENAI_API_KEY,
      });

      openai = new OpenAIApi(configuration);
      const creativity = 0.7 // change this between 0.0 and 1.0, 1.0 being most creative output
      console.log('creativity is currently set to ========>>>>>>> ' + creativity)
      console.log("Prompt sent to ChatGPT: ")
      console.log(prompt)
      console.log("Waiting for ChatGPT's response...")
      console.log("_________________________________")

      try {
        let completion = await openai.createCompletion({
            model: 'text-davinci-003',
            temperature: creativity,
            top_p: 0.9,
            max_tokens: 2048,
            frequency_penalty: 0.0,
            presence_penalty: 0,
            prompt: prompt,
        });
        const gpt_response = completion.data.choices[0].text
        console.log("CHATGPT RESPONSE ==========>>>>>>> " + gpt_response)
        
        //send response back to SF
        console.log("MOVING ON TO SEND RESPONSE TO SF*********")
        const login_url = 'https://login.salesforce.com/services/oauth2/token';
        const client_id = process.env.CLIENT_ID;
        const client_secret = process.env.CLIENT_SECRET;
        const username = process.env.SF_USERNAME;
        const password = process.env.SF_PASSWORD;
        const security_token = process.env.SF_SECURITY_TOKEN;
        const request_body = new URLSearchParams();

        request_body.append('grant_type', 'password');
        request_body.append('client_id', client_id);
        request_body.append('client_secret', client_secret);
        request_body.append('username', username);
        request_body.append('password', password + security_token);
        
        try {
          const token = await axios.post(login_url, request_body)
          const access_token = token.data.access_token
        
          // Use the access token to make API requests to Salesforce

          // console log response value
          console.log("Processing response back to Salesforce: " + gpt_response);

          // record ID hardcoded for testing
          const salesforce_endpoint = process.env.SF_PATCH_URL;
          
          // Salesforce Credentials
          const salesforce_config = {
            headers: {
              Authorization: 'Bearer ' + access_token,
              'Content-Type': 'application/json',
            },
          };

          // data to post to Salesforce
          const update_data = {
            Resume_Evaluation_of_Fit__c: gpt_response,
          };
          console.log("DATA TO SEND TO SF================> " + update_data.Resume_Evaluation_of_Fit__c)

          try {
            const sf_response = await axios.patch(salesforce_endpoint, update_data, salesforce_config)
            console.log('Value sent to Salesforce successfully:', sf_response.data);

          } catch (error) {
            console.error('Failed to send data to Salesforce:', error)
          }
        } catch(error) {
          console.error('Failed to obtain access token:', error);
        };
      } catch (error) {
        console.error(error);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
};