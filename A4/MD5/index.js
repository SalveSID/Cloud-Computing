const axios = require('axios');

exports.handler = async (event,context) => {
  try {
    const data = event.value;
    const crypto = require('crypto');

    const hashedValue = crypto.createHash('md5').update(data, 'utf8').digest('hex');

    const responsePayload = {
      banner: "B00934528",
      result: hashedValue,
      arn: context.invokedFunctionArn,
      action: 'md5',
      value: data
    };

   const res= await axios.post(event.course_uri, responsePayload);

  } catch (error) {
    console.error(error);
    throw new Error('An error occurred while performing MD5 hashing.');
  }
};

