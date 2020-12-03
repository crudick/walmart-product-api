
// Require dependencies
const logger = require('morgan');
const express = require('express');

// Create an Express application
const app = express();

// Configure the app port
const port = process.env.PORT || 3000;
app.set('port', port);

// Load middlewares
app.use(logger('dev'));

// Start the server and listen on the preconfigured port
app.listen(port, () => console.log(`App started on port ${port}.`));

// Require the needed functions
const { sendResponse } = require('./helpers');
const { fetchProductDetails } = require('./walmart');

// Add the walmart product details route
app.get('/api/walmart/products/:id', (req, res, next) => {
  let id = req.params.id;
  let location = {
    zip: req.query.zip,
    city: req.query.city,
    state: req.query.state
  }
  sendResponse(res)(fetchProductDetails(id,location));
});
