'use strict';

// bring express library
const express = require('express');

// initialize express library
const app = express();

// access .env file and gets variable for use
require('dotenv').config();

// express, find public folder and serve files
app.use(express.static('./public'));

const PORT = process.env.PORT;

// turn on server and console log port
app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});

