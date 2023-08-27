const AWS = require("aws-sdk");
const unzipper = require("unzipper");
const textract = new AWS.Textract();
const s3 = new AWS.S3();
const sns = new AWS.SNS();

let processedData = "";

exports.handler = async (event, context) => {
  const sourceBucket = "reviewbuddybucket";
  const destinationBucket = "reviewbuddyresultsbucket";
  const outputTextFile = "output.txt";

  const res = await emptyOutputFile(destinationBucket, outputTextFile);

  if (res) {
    try {
      const listObjectsResponse = await s3
        .listObjectsV2({ Bucket: sourceBucket })
        .promise();

      const zipPromises = [];

      for (const object of listObjectsResponse.Contents) {
        const sourceKey = object.Key;

        if (sourceKey.endsWith(".zip")) {
          const zipPromise = processZipFile(
            sourceBucket,
            destinationBucket,
            sourceKey
          );
          zipPromises.push(zipPromise);
        }
      }

      await Promise.all(zipPromises);

      const outputUrl = await generatePresignedUrl(
        destinationBucket,
        outputTextFile
      );

      await sendSnsEmail(outputUrl);

      return {
        statusCode: 200,
        body: "Files extracted and processed successfully!",
      };
    } catch (err) {
      console.error("Error:", err);
      return {
        statusCode: 500,
        body: "An error occurred during processing.",
      };
    }
  }
};

async function processZipFile(sourceBucket, destinationBucket, sourceKey) {
  return new Promise((resolve, reject) => {
    const s3ReadStream = s3
      .getObject({ Bucket: sourceBucket, Key: sourceKey })
      .createReadStream();

    const pdfPromises = [];

    s3ReadStream
      .pipe(unzipper.Parse())
      .on("entry", async (entry) => {
        if (entry.type === "File" && entry.path.endsWith(".pdf")) {
          const fileName = entry.path;
          const s3Key = `${sourceKey.replace(".zip", "")}/${fileName}`;

          const params = {
            Bucket: destinationBucket,
            Key: s3Key,
            Body: entry,
          };
          await s3.upload(params).promise();

          const textPromise = processPdfAndAppendText(destinationBucket, s3Key);
          pdfPromises.push(textPromise);
        } else {
          entry.autodrain();
        }
      })
      .on("error", (err) => reject(err))
      .on("finish", async () => {
        try {
          await Promise.all(pdfPromises);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
  });
}

async function emptyOutputFile(bucket, key) {
  const params = {
    Bucket: bucket,
    Key: key,
  };

  try {
    const headObjectResponse = await s3.headObject(params).promise();
    if (headObjectResponse) {
      await s3.deleteObject(params).promise();
      console.log(`Emptied ${key}`);
      return true;
    } else {
      console.log(`${key} not found. Skipping deletion.`);
      return true; // Return true even if the file was not found, to continue with the rest of the processing.
    }
  } catch (err) {
    if (err.code === "NotFound") {
      console.log(`${key} not found. Skipping deletion.`);
      return true; // Return true even if the file was not found, to continue with the rest of the processing.
    } else {
      console.error(`Error emptying ${key}:`, err);
      return false;
    }
  }
}

async function processPdfAndAppendText(bucket, key) {
  try {
    const text = await runTextract(bucket, key);
    const textWithNewLines = text.replace(/\n/g, "\n\n");

    if (!processedData.includes(textWithNewLines)) {
      await appendToTextFile(textWithNewLines, "output.txt", bucket);
      console.log(`Appended text to output.txt`);
      processedData += textWithNewLines;
    }
  } catch (err) {
    console.error("Error processing PDF:", err);
  }
}

async function runTextract(bucket, key) {
  const params = {
    Document: {
      S3Object: {
        Bucket: bucket,
        Name: key,
      },
    },
  };

  try {
    const response = await textract.detectDocumentText(params).promise();
    const extractedText = response.Blocks.map((block) => block.Text).join(" ");
    const textWithNewLines = extractedText.replace(/\n/g, "\n\n");
    return textWithNewLines;
  } catch (err) {
    console.error("Textract Error:", err);
    return "";
  }
}

async function appendToTextFile(text, outputFileName, bucket) {
  const params = {
    Bucket: bucket,
    Key: outputFileName,
  };

  try {
    let existingText = "";
    try {
      const existingFile = await s3.getObject(params).promise();
      existingText = existingFile.Body.toString();
    } catch (err) {}

    const updatedText = existingText + text + "\n";

    const uploadParams = {
      Bucket: bucket,
      Key: outputFileName,
      Body: updatedText,
    };
    await s3.upload(uploadParams).promise();
  } catch (err) {
    console.error("Error appending text to the file:", err);
  }
}

async function generatePresignedUrl(bucket, key) {
  const params = {
    Bucket: bucket,
    Key: key,
    Expires: 3600,
  };

  try {
    const url = await s3.getSignedUrlPromise("getObject", params);
    console.log("Presigned URL:", url);
    return url;
  } catch (err) {
    console.error("Error generating presigned URL:", err);
    return "";
  }
}

async function sendSnsEmail(outputUrl) {
  const snsTopicArn = process.env.SNS_TOPIC_ARN;
  const emailSubject = "Output.txt File Ready for Download";
  const emailMessage = `The output.txt file is ready for download. Click the link below to access it:\n\n${outputUrl}`;

  const params = {
    TopicArn: snsTopicArn,
    Subject: emailSubject,
    Message: emailMessage,
  };

  try {
    await sns.publish(params).promise();
    console.log("SNS email sent successfully.");
  } catch (err) {
    console.error("Error sending SNS email:", err);
  }
}
