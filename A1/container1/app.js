const express = require('express');
const axios = require('axios');
const fs = require('fs');


const app = express();
const port = 6000;
const dataDir = '../a1files';
const container2URL = 'http://container2:7000';

app.use(express.json());

app.post('/calculate', async (req, res) => {
  try {
    const { file, product } = req.body;
    
    if (!file) {
      return res.status(200).json({ file: null, error: 'Invalid JSON input.' });
    }

    const filePath = `${dataDir}/${file}`;

    if (!fs.existsSync(filePath)) {
      return res.status(200).json({ file, error: 'File not found.' });
    }

    // Send the request to Container 2
    const response = await axios.post(`${container2URL}/calculate`, { file, product });

    return res.json(response.data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(port, () => {
  console.log(`Container 1 listening at http://localhost:${port}`);
});
