const fs = require('fs');
const axios = require('axios');

const filePath = '/Users/salmalik/Desktop/Salpal.png'; // Replace with the actual file path

const endpoint = 'https://5mrc28no5i.execute-api.us-east-1.amazonaws.com/prod/fileReceived';

const getFileName = (filePath) => {
    const arr = filePath.split('/')
    const fileName = arr[arr.length - 1]
    return fileName
}

const readFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const sendFile = async (filename, fileContent) => {
  try {
    const payload = {
      filename: filename,
      content: fileContent
    };

    const response = await axios.post(endpoint, payload);
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};

readFile(filePath)
  .then((fileContent) => {
    const encodedContent = fileContent.toString('base64');
    const filename = getFileName(filePath); // Replace with the desired filename
    sendFile(filename, encodedContent);
  })
  .catch((error) => console.error('Error:', error));
