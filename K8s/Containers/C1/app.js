const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 6000;
const dataDir = '../sid_PV_dir/';
const container2URL = 'http://container-connector:7000';

// Ensure the data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

app.use(express.json());


//container 1  code
app.post('/store-file', async (req, res) => {
  try {
    const { file, data } = req.body;

    if (!file) {
      return res.status(400).json({ file: null, error: 'Invalid JSON input.' });
    }

    const filePath = `${dataDir}${file}`;
    const trimmedData = data.replace(/[^\S\n]+/g, '');

    fs.writeFile(filePath, trimmedData, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ file, error: 'Error while storing the file to the storage.' });
      }
      return res.json({ file, message: 'Success.' });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


app.post('/calculate', async (req, res) => {
  try {
    const { file, product } = req.body;

    if (!file) {
      return res.status(400).json({ file: null, error: 'Invalid JSON input.' });
    }

    const filePath = path.join(dataDir, file);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ file, error: 'File not found.' });
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
