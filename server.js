'use strict';

// bring express library
const express = require('express');
// Initiate Superagent library
const superagent = require('superagent');
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

// Location .Get Function
app.get('/location', (request, response) => {
  try{
    let city = request.query.city;

    //Replace local location file with URL and GeoData Key
    let locationURL = `https://us1.locationiq.com/v1/search.php?key=${process.env.GEO_DATA_API_KEY}&q=${city}&format=json`;

    // Use Superagent get function
    superagent.get(locationURL)
      .then(resultsFromSuperAgent => {
        let returnObj = new Location(city, resultsFromSuperAgent.body[0]);
        response.status(200).send(returnObj);
        console.log(returnObj);
      })
  } catch(err) {
    console.log('Error', err);
    response.status(500).send('sorry, something went wrong');
  }
});

// Weather .Get Function
app.get('/weather', (request, response) => {
  try {
    // let weatherArray = [];
    let search_query = request.query.search_query;
    console.log('stuff I got from the front end on the weather route', search_query)

    let weatherURL = `https://api.weatherbit.io/v2.0/forecast/daily?city=${search_query}&key=${process.env.WEATHER_DATA_API_KEY}`

    superagent.get(weatherURL)
      .then(results => {
        let returnObj = results.body.data.map(day => new Weather(day))
        console.log(results.body.data)
        response.status(200).send(returnObj);
      });
  } catch(err) {
    console.log('Error', err);
    response.status(500).send('sorry, something went wrong');
  }
});


app.get('/trails', (request, response) => {

  let {latitude, longitude} = request.query;

  //Replace local location file with URL and GeoData Key
  let trailsURL = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&key=${process.env.HIKING_DATA_API_KEY}`;

  superagent.get(trailsURL)
    .then(results => {
      const trailResult = results.body.trails.map(trail => {
        return new Trail(trail);
      })
      response.status(200).send(trailResult);
    }).catch(err => console.log(err))
})

function Location(searchQuery, obj) {
  this.search_query = searchQuery;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}

function Weather (obj) {
  this.forecast = obj.weather.description;
  this.time = obj.valid_date;
}

function Trail (obj) {
  this.name = obj.name;
  this.location = obj.location;
  this.length = obj.length;
  this.star_votes = obj.starsVotes;
  this.votes = obj.votes;
  // this.summary = obj.summary;
  this.trail_url = obj.url;
  this.conditions = `${obj.conditionStatus} ${obj.conditionDetails}`;
  this.condition_date = obj.conditionDate.slice(0,10);
  this.condition_date = obj.conditionDate.slice(12,19);
  // this.condition_time = obj.conditiontime;
  // this.latitude = obj.lat;
  // this.longitude = obj.lon;
}

app.get('*', (request, response) => {
  response.status(404).send('sorry, this route does not exist');
})

// turn on server and console log port
app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
})

