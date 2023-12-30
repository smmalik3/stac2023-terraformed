const AWS = require('aws-sdk');
const textract = new AWS.Textract();
// const {Configuration,OpenAIApi} = require("openai");
const OpenAI = require("openai");
const axios = require('axios');

module.exports.sendToServiceNow = async (event) => {

  // Get the name of the file to be processed from the event object
  const filename = event.Records[0].s3.object.key;
  console.log("filename ==========>>>>>> " + filename)
  const substrings = filename.split(".")
  console.log("filename substrings =============>>>>> " + substrings)
  const record_id = substrings[0].slice(substrings[0].length - 32, substrings[0].length)
  console.log("Application Record ID ===========>>>>> " + record_id)

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

        const resume = text;
        const jobDescription = "Software Engineer - FEMA Position Summary: We are seeking a motivated professional with a Bachelors degree or five years of experience to take on the role of Software Engineer for the Federal Emergency Management Agency (FEMA). This position offers a hybrid office/remote role and offers a salary range between $100,000 to $150,000. As FEMA’s Software Engineer, you will be responsible for protecting critical infrastructure and safeguarding national security by developing software solutions and improving the Agency’s security posture. Occasional travel may be required for this position. Primary Responsibilities: Design high-quality software solutions to address critical infrastructure needs, improve the Agency’s security posture, and increase operational efficiency. Develop full-scale software solutions to meet customer expectations and solve complex problems. Identify areas of improvement and develop strategies to correct software anomalies. Continually assess security threats and vulnerabilities across the Agency’s software architecture. Troubleshoot and resolve software issues in a timely and efficient manner. Research and identify emerging technologies to enhance current software solutions and ensure design scalability. Train other members of the software engineering team on current processes and techniques. Requirements: Bachelor’s degree in Computer Science, Software Engineering, or a related field. Five years of professional experience in software engineering or a related field. Experience in secure software development, information security, and risk management. Excellent problem-solving and critical-thinking skills. In-depth knowledge of programming languages such as Python, Golang, and Java. Ability to work collaboratively and independently in a deadline-driven environment. Ability and willingness to travel as occasionally required."

        const prompt = "This is the resume to consider: " + resume + "\n\n" + "Please compare the resume to the following job description: \n\n" + jobDescription + "\n\nDoes the candidate appear to have relevant experience for the above job description?";

        console.log("Initializing OPENAI API Baby");
        console.log("What is my API key? ====>>>> " + process.env.OPENAI_API_KEY)

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
        });

        const stream = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            stream: true,
        });

        let gpt_response = "";
        for await (const chunk of stream) {
            if (chunk.choices[0]?.delta?.content) {
                gpt_response += chunk.choices[0].delta.content;
                console.log('CHUNKY CHOICES =====>>>> ' + chunk.choices[0].delta.content);
            }
        }

        console.log("CHATGPT RESPONSE ==========>>>>>>> " + gpt_response);

        //send response back to SN
        console.log("MOVING ON TO SEND RESPONSE TO SN*********")
        const username = process.env.SN_USERNAME;
        const password = process.env.SN_PASSWORD;

        // console log response value
        console.log("Processing response back to ServiceNow: " + gpt_response);

        const TABLE = "x_1256160_resumeai_resume";
        const servicenow_endpoint = `${process.env.SN_PATCH_URL}/${TABLE}/${record_id}?sysparm_fields=resume_analysis`;

        let buf = Buffer.from(`${username}:${password}`);
        let base64EncodedString = buf.toString('base64');

        const credentials = base64EncodedString;
        const config = {
          headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/json",
          }
        };

        // data to post to ServiceNow
        const update_data = {
          resume_analysis: gpt_response,
        };
        console.log("DATA TO SEND TO SN================> " + update_data.resume_analysis);

        try {
          const sn_response = await axios.put(servicenow_endpoint, update_data, config);
          console.log('Value sent to ServiceNow successfully:', sn_response.data);
        } catch (error) {
          console.error('Failed to send data to ServiceNow:', error)
        }
      } catch (error) {
        console.error('Error processing request:', error);
        throw error;
    }
  } catch(error) {
    console.error('Error processing request:', error);
          throw error;
  }
}