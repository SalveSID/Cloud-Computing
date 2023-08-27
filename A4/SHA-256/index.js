const axios = require('axios');
const crypto = require('crypto');

exports.handler = async (event, context) => {
  try {
    const data = event.value;

    const hashedValue = crypto.createHash('sha256').update(data, 'utf8').digest('hex');

    const responsePayload = {
      banner: "B00934528",
      result: hashedValue,
      arn: context.invokedFunctionArn,
      action: 'sha256',
      value: data
    };

  const res= await axios.post(event.course_uri, responsePayload);
  console.log(res.data)

  } catch (error) {
    console.error(error);
    throw new Error('An error occurred while performing SHA-256 hashing.');
  }
};
