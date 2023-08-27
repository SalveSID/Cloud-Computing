const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const port = 7000;
const dataDir = '../a1files';

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

    const results = [];
    const headers = [];
    const actualHeaders = ["product", "amount"];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (headerData) => headers.push(headerData))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        if (actualHeaders.toString() !== headers.toString()) {
          return res.json({ file, error: "Input file not in CSV format." });
        } else if (
          !results.every((obj) => obj.hasOwnProperty("product") && obj.hasOwnProperty("amount")) ||
          !results.every((obj) => Object.keys(obj).length === 2)
        ) {
          return res.json({ file, error: "Input file not in CSV format." });
        } else {
          // Calculate the sum of amounts for matching products
          const filteredRows = results
            .filter(record => record.product === product)
          let sum = 0;
          filteredRows.forEach((obj) => {
            console.log(obj);
            if (obj.amount === null) {
              return res.json({ file, error: "Input file not in CSV format." });
            }

            sum = sum + parseInt(obj.amount);
          })
          return res.json({ file, sum });
        }
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(port, () => {
  console.log(`Container 2 listening at http://localhost:${port}`);
});
