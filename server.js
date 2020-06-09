'use strict';

// bring express library
const express = require('express');

// initialize express library
const app = express();

// access .env file and gets variable for use - Secrets we don't want to share
require('dotenv').config();

// bodyguard of our server - tells who is okay to send data to
const cors = require('cors');

// Hey cors, let everybody in
app.use(cors());

// bring in the PORT by using process.env variable name
const PORT = process.env.PORT || 3003;


app.get('/location', (request, response) => {
  try{
    console.log(request.query.city);
    const city = request.query.city;

    // Utilize data library from specified file
    const geoData = require('./data/location.json');

    // Create new object instance
    // Send GeoData at [0] to get first object
    const returnObj = new Location(city, geoData[0]);

    // console.log(returnObj);

    response.status(200).send(returnObj);

  } catch(err) {
    console.log('Error', err);
    response.status(500).send('sorry, something went wrong');
  }
});

function Location(searchQuery, obj) {
  this.search_query = searchQuery;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}


app.get('/weather', (request, response) => {
  try {   
    let search_query = request.query.search_query;
    let weatherArray = [];
    const weatherData = require('./data/weather.json');

    weatherData.data.forEach(day => {
      weatherArray.push(new Weather(day));
    })

    response.status(200).send(weatherArray);
  } catch(err) {
    console.log('Error', err);
    response.status(500).send('sorry, something went wrong');
  }
});

function Weather (obj) {
  this.forecast = obj.weather.description;
  this.time = obj.weather.valid_date;
}

app.get('*', (request, response) => {
  response.status(404).send('sorry, this route does not exist');
})

// turn on server and console log port
app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
})

