const AWS = require('aws-sdk');
const fs = require('fs');
const textract = new AWS.Textract();
const {Configuration,OpenAIApi} = require("openai");
const { config } = require('process');

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
      // console.log(response);
      
      // Extract the text from the response
      const text = response.Blocks.reduce((acc, block) => {
        if (block.BlockType === 'LINE') {
          acc += `${block.Text}\n`;
        }
        return acc;
      }, '');

      console.log("TEXT FROM TEXTRACT ======================>>>>>>>>>> " + text);

      const resume = text
      const jobDescription = "Software Engineer (3 Years Experience) - Deloitte Digital Position Title: Software Engineer (3 Years Experience) Department: Deloitte Digital Position Summary: The Software Engineer will design, develop, test and maintain enterprise applications. This individual will work closely with other software engineers and other departments to ensure that all applications are built, maintained and deployed in a manner that meets customer requirements and business objectives. Responsibilities: Design, develop, test, and maintain software applications in accordance with customer requirements and business objectives. Analyze customer requirements and business objectives to create technical design documents. Develop and ensure quality assurance of software applications with a focus on scalability, performance, and reliability. Collaborate with other software engineers to ensure that applications are built, maintained and deployed in a manner that meets customer requirements and business objectives. Troubleshoot and debug applications to identify and resolve issues. Provide technical guidance and mentorship to junior software engineers. Stay up-to-date with developments in software engineering and related technologies. Qualifications: Bachelor’s degree in computer science, software engineering, or a related field. 3+ years of professional software engineering experience. Proficient in programming languages such as Java, Python, and JavaScript. Experience in developing web services and APIs. Knowledge of Agile development practices and software engineering principles. Knowledge of database technologies such as SQL and NoSQL. Strong problem-solving, analytical, and communication skills. Ability to work both independently and collaboratively in a fast-paced, customer-focused environment."

      const prompt = resume + "Compare the resume above to this job description:" + jobDescription + "Does the candidate appear to have relevant experience for the above job description?"

      const configuration = new Configuration({
          apiKey: process.env.OPENAI_API_KEY,
      });

      console.log("Bruh, do we have the API KEY ??? ====>>>> " + configuration.apiKey)
      const openai = new OpenAIApi(configuration);
      const userPrompt = prompt
      const creativity = 0.0 // change this between 0.0 and 1.0, 1.0 being most creative output
      console.log('creativity is currently set to ========>>>>>>> ' + creativity)
      console.log("Prompt sent to ChatGPT: ")
      console.log(userPrompt)
      console.log("Waiting for ChatGPT's response...")
      console.log("_________________________________")
      console.log("BRUHHHHHHHHHHHH")
      try {
        const completion = await openai.createCompletion({
            model: 'text-davinci-003',
            temperature: creativity,
            max_tokens: 2048,
            frequency_penalty: 0.0,
            presence_penalty: 0,
            prompt: userPrompt,
        });
        const response = completion.data.choices[0].text
        console.log("CHATGPT RESPONSE ==========>>>>>>> " + response)
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