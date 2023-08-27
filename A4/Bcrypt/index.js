const axios = require('axios');
const bcrypt = require('bcryptjs');

exports.handler = async (event,context) => {
  try {
    const data = event.value;
    const saltRounds = 10;

    const hashedValue = await bcrypt.hash(data, saltRounds);

    const responsePayload = {
      banner: "B00934528",
      result: hashedValue,
      arn: context.invokedFunctionArn,
      action: 'bcrypt',
      value: data
    };

   const res= await axios.post(event.course_uri, responsePayload);
  
  } catch (error) {
    console.error(error);
    throw new Error('An error occurred while performing Bcrypt hashing.');
  }
};
