const sysId = current.getValue('sys_id'); // Replace with the Sys ID of the record
gs.info("sysId =======>>>>> " + sysId);
const resume_id = current.getValue("resume");
const attachment = getAttachment(resume_id);
sendFileToAWS(attachment);
action.setRedirectURL(current);

function getAttachment(sysId) {
    gs.info('Getting attachment for sys_id: ' + sysId); // Log the sys_id being queried

    const attachmentGR = new GlideRecord('sys_attachment');
    if (attachmentGR.get(sysId)) {
        gs.info(`Attachment found on Resume ${current.getValue("number")}: ${attachmentGR.file_name}`);

		const extensionRegExp = /.(jpe*g|png|pdf)/gi;

        const sysAttachment = new GlideSysAttachment();
        const attachmentBase64 = sysAttachment.getContentBase64(attachmentGR); // Get the content base64
		const [filename, extension] = attachmentGR.getValue("file_name").split(extensionRegExp);

		if (extension === undefined) {
			gs.addErrorMessage("Resume is not a valid file type.");
			return null;
		}

        return {
            content: attachmentBase64,
            filename: `${filename}-${current.getUniqueValue()}.${extension}`
        };
    }
    return null;
}

function sendFileToAWS(attachment) {
    if (!attachment) {
		gs.addErrorMessage("No attachment found");
        gs.error("No attachment found");
        return;
    }

    const restMessage = new sn_ws.RESTMessageV2();
    restMessage.setEndpoint('https://2j6znuejxl.execute-api.us-east-1.amazonaws.com/prod/receiveFromServiceNow');
    restMessage.setHttpMethod('POST');
    restMessage.setRequestHeader("Content-Type", "application/json");
    restMessage.setRequestBody(JSON.stringify(attachment));

    const response = restMessage.execute();
    const responseBody = response.getBody();
    const httpStatus = response.getStatusCode();

    if (httpStatus !== 200) {
		gs.addErrorMessage("Error sending file to AWS.");
        gs.error('Error sending file to AWS. HTTP Status: ' + httpStatus);
    } else {
		gs.addInfoMessage("File sent successfully!");
        gs.info('File sent successfully. Response: ' + responseBody);
    }
}