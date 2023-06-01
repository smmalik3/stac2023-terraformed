const AWS = require('aws-sdk');
const s3 = new AWS.S3();

module.exports.getFile = async (event) => {
  try {
    // const { content, filename } = event;

    console.log("event =======>>>>> " + JSON.stringify(event))
    console.log("FILENAME =======>>>> " + event.body.filename)
    console.log("event BODY =====>>>> " + event.body)
    const filename = event.body.filename
    const content = event.body.content
    // Decode the base64-encoded file content
    const decodedContent = Buffer.from(content, 'base64');

    // Save the file to S3
    const bucketName = process.env.BUCKET_NAME;
    const key = filename;
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: decodedContent
    };

    await s3.putObject(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'File saved successfully to S3' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save file to S3' })
    };
  }
};