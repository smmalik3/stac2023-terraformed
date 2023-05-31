const AWS = require('aws-sdk');
const s3 = new AWS.S3();

module.exports.getFile = async (event) => {

    try {
        // Get the file content from the event
        const fileContent = event.body;
        console.log("EVENT BODY =========>>>>>> " + event.body)
        
        // Save the file to S3 bucket
        const bucketName = 'resumeuploads4';
        const fileKey = 'uploaded_file.txt'; // Change the file key/name as needed
        
        await s3.putObject({
          Bucket: bucketName,
          Key: fileKey,
          Body: fileContent
        }).promise();
        
        return {
          statusCode: 200,
          body: 'File uploaded successfully to S3'
        };
      } catch (error) {
        return {
          statusCode: 500,
          body: `Error: ${error.message}`
        };
      }
};