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

      const resume = text
      // The following var makes the prompt too complicated and ChatGPT doesn't know how to handle it, which leads to returning a previous response.
      // const gpt_error_check = "If the previous text is not a resume, please say that it is not a resume and stop generating, otherwise if it is, continue and"
      // const jobDescription = "Software Engineer (3 Years Experience) - Deloitte Digital Position Title: Software Engineer (3 Years Experience) Department: Deloitte Digital Position Summary: The Software Engineer will design, develop, test and maintain enterprise applications. This individual will work closely with other software engineers and other departments to ensure that all applications are built, maintained and deployed in a manner that meets customer requirements and business objectives. Responsibilities: Design, develop, test, and maintain software applications in accordance with customer requirements and business objectives. Analyze customer requirements and business objectives to create technical design documents. Develop and ensure quality assurance of software applications with a focus on scalability, performance, and reliability. Collaborate with other software engineers to ensure that applications are built, maintained and deployed in a manner that meets customer requirements and business objectives. Troubleshoot and debug applications to identify and resolve issues. Provide technical guidance and mentorship to junior software engineers. Stay up-to-date with developments in software engineering and related technologies. Qualifications: Bachelor’s degree in computer science, software engineering, or a related field. 3+ years of professional software engineering experience. Proficient in programming languages such as Java, Python, and JavaScript. Experience in developing web services and APIs. Knowledge of Agile development practices and software engineering principles. Knowledge of database technologies such as SQL and NoSQL. Strong problem-solving, analytical, and communication skills. Ability to work both independently and collaboratively in a fast-paced, customer-focused environment."

      const jobDescription = "Bia law enforcement officer job description position bia law enforcement officer location on-site at sioux falls, south dakota salary range $45,000 to $60,000 job summary the bia law enforcement officer performs law enforcement duties and maintains law and order within the jurisdictional limits of the bureau of indian affairs (bia) sioux falls agency. The officers primary responsibility is to enforce federal and tribal laws and regulations, protect life and property, and support the crimince system. Responsibilities - patrol assigned areas on foot, in a vehicle or on horseback and respond to calls for service - enforce federal and tribal laws and regulations related to criminal activity, traffic violations, or other public safety concerns - investigate crimes and incidents, collect evidence, interview witnesses, and prepare reports - arrest individuals suspected of breaking the law, complete paperwork, and testify in court - maintain order and intervene in events that may result in property damage, injury, or death - work with tribal and federal agencies to coordinate investigations and share information - participate in community policing activities and promote positive relationships with tribal members - conduct safety inspections of buildings and grounds, report deficiencies, and make recommendations for improvement - ensure compliance with bia policies and procedures and maintain accurate records - attend ongoing training and development to enhance job knowledge and skills qualifications - high school diploma or ged equivalent required - at least two years of experience in law enforcement preferred - must be 21 years of age or older - possess a valid drivers license and be insurable - ability to obtain a certification in law enforcement from a bia-approved academy - knowledge of federal and tribal laws and regulations regarding law enforcement - strong written and verbal communication skills - ability to exercise sound judgment and maintain confidentiality - physical ability to perform duties of the position, including running, walking, standing, and sitting for extended periods of time and lifting up to 50 pounds salary and benefits the salary range for this position is $45,000 to $60,000 per year, commensurate with experience. The bia offers a comprehensive benefits package, including medical and dental insurance, retirement plans, and paid time off. To apply to apply for this position, please submit a resume and cover letter highlighting your qualifications and experience to the bia sioux falls agency. Candidates who meet the qualifications and experience will be contacted for an interview."
      const prompt = "This is the resume to consider: " + resume + "\n\n" + "Please compare the resume to the following job description: \n\n" + jobDescription + "\n\nDoes the candidate appear to have relevant experience for the above job description?"

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
      });

      const creativity = 0.7 // change this between 0.0 and 1.0, 1.0 being most creative output
      console.log('creativity is currently set to ========>>>>>>> ' + creativity)
      console.log("Prompt sent to ChatGPT: ")
      console.log(prompt)
      console.log("Waiting for ChatGPT's response...")
      console.log("_________________________________")

      try {
        // let completion = await openai.createCompletion({
        const completion = await openai.completions.create({
          model: 'text-davinci-003',
          temperature: creativity,
          top_p: 0.9,
          max_tokens: 2048,
          frequency_penalty: 0.0,
          presence_penalty: 0,
          prompt: prompt,
        });
        // const gpt_response_0 = completion;
        // console.log("CHATGPT RESPONSE 0 ==========>>>>>>> " + JSON.stringify(gpt_response_0));

        const gpt_response = completion.choices[0].text
        console.log("CHATGPT RESPONSE ==========>>>>>>> " + gpt_response)

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