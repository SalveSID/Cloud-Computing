const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
app.use(bodyParser.json());

// DB configuration
const dbConfig = {
  host: 'database-1-instance-1.cehoyo4s7hon.us-east-1.rds.amazonaws.com',//'<your-db-host>'
  user: 'admin',//'<your-db-username>'
  password: '#IamGr00t',//'<your-db-password>'
  database: 'bc'//'<your-db-name>'
};

// Create a DB connection
const pool = mysql.createPool(dbConfig);

// POST request to /store-products
app.post('/store-products', (req, res) => {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      res.status(400).send('Invalid JSON format. "products" should be an array of JSON.');
      return;
    }
  
    // Execute the insert queries
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error connecting to DB:', err);
        res.status(500).send('Error connecting to DB.');
        return;
      }
  
      req.body.products.forEach(element => {
        const { name, price, availability } = element;
  
        connection.query('INSERT INTO products (name, price, availability) VALUES (?, ?, ?)', [name, price, availability], (error, results) => {
          if (error) {
            console.error('Error inserting records:', error);
            res.status(500).send('Error inserting records into the DB.');
            return;
          }
        });
      });
  
      connection.release();
      res.status(200).json({ message: 'Success.' });
    });
  });
    

// GET request to /list-products
app.get('/list-products', (req, res) => {
  // Query the database to get all products
  pool.getConnection((err, connection) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error connecting to the DB.');
      return;
    }

    connection.query('SELECT * FROM products', (error, results) => {
      connection.release();
      if (error) {
        res.status(500).send('Error fetching products from the DB.');
        return;
      }

      const products = results.map(result => ({
        name: result.name,
        price: result.price,
        availability: result.availability
      }));

      res.status(200).json({ products });
    });
  });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
  });

// Start the server
const port = 80;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
