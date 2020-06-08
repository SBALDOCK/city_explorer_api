'use strict';

// bring express library
const express = require('express');

// initialize express library
const app = express();

// access .env file and gets variable for use
require('dotenv').config();

// bodyguard of our server - tells who is okay to send data to
const cors = require('cors');
app.use(cors());

// // express, find public folder and serve files
// app.use(express.static('./public'));

// bring in the PORT by using process.env variable name
const PORT = process.env.PORT || 3003;

// turn on server and console log port
app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});

app.get('/location', (request, response) => {
  try{
    console.log(request.query.city);
    let search_query = request.query.city;

    let geoData = require('./data/location.json');

    let returnObj = new Location(search_query, geoData[0]);

    console.log(returnObj);

    response.status(200).send(returnObj);
  } catch(err) {
    console.log('Error', err);
    response.status(500).send('sorry, we messed up');
  }

})

function Location(searchQuery, obj) {
  this.search_query = searchQuery;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}

app.get('*', (request, response) => {
  response.status(404).send('sorry, this route does not exist');
})

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
})

