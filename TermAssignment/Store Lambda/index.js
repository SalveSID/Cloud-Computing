const AWS = require("aws-sdk");
const fs = require("fs");
const os = require("os");
const path = require("path");

exports.handler = async (event, context) => {
  try {
    const destinationBucket = "reviewbuddybucket";
    const reviewTextractLambdaName = "reviewTextractLambda";

    const lambda = new AWS.Lambda();
    const invokeParams = {
      FunctionName: reviewTextractLambdaName,
      InvocationType: "RequestResponse",
    };

    if (!event.body) {
      return {
        statusCode: 400,
        body: "Invalid request: Request body is missing.",
      };
    }

    const requestBody = event.body;

    const base64ToBuffer = (base64Data) => {
      return Buffer.from(base64Data, "base64");
    };

    const inputBuffer = base64ToBuffer(requestBody);

    const uniqueFileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.zip`;

    const createTempFile = (data, callback) => {
      const tempFilePath = path.join(os.tmpdir(), uniqueFileName);
      fs.writeFile(tempFilePath, data, (err) => {
        if (err) {
          return callback(err);
        }
        callback(null, tempFilePath);
      });
    };

    const uploadFileToS3 = (bucket, key, filePath) => {
      return new Promise((resolve, reject) => {
        const s3 = new AWS.S3();

        const fileStream = fs.createReadStream(filePath);
        fileStream.on("error", (err) => {
          reject(err);
        });

        const putObjectParams = {
          Bucket: bucket,
          Key: key,
          Body: fileStream,
          ContentType: "application/zip",
        };

        s3.upload(putObjectParams, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    };

    const tempFilePath = await new Promise((resolve, reject) => {
      createTempFile(inputBuffer, (err, filePath) => {
        if (err) {
          reject(err);
        } else {
          resolve(filePath);
        }
      });
    });

    await uploadFileToS3(destinationBucket, "filename.zip", tempFilePath);

    fs.unlinkSync(tempFilePath);

    await lambda.invoke(invokeParams).promise();

    return {
      statusCode: 200,
      body: "Base64 ZIP file upload and reviewTextractLambda invocation successful!",
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: "An error occurred while processing the file.",
    };
  }
};
