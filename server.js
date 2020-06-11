'use strict';

const superagent = require('superagent');

const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors());

require('dotenv').config();

// bring in the PORT by using process.env variable name
const PORT = process.env.PORT || 3003;

// initiate and require Postgres SQL
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

// Don't start server unless database is connected - turns on database
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  })

// Create function to check database for location info
app.get('/', (request, response) => {
  console.log('I am alive on the back end');
  response.status(200).send('I am alive on the front end');
});


// App.get functions
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailHandler);
app.get('/movies', movieHandler);
app.get('/yelp', restaurantHandler);
app.use('*', handleNotFound);

// constructor for location
function Location(searchQuery, obj) {
  this.search_query = searchQuery;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}

// Handler for location endpoint
function locationHandler(request, response) {
  let city = request.query.city;
  //Replace local location file with URL and GeoData Key
  let locationURL = `https://us1.locationiq.com/v1/search.php?key=${process.env.GEO_DATA_API_KEY}&q=${city}&format=json`;
  let safeValue = [city];
  // Check database for existing information
  let sqlQuery = 'SELECT * FROM city WHERE search_query LIKE ($1)';
  client.query(sqlQuery, safeValue)
    .then(sqlResults => {
      if (sqlResults.rowCount !== 0) {
        console.log(sqlResults);
        response.status(200).send(sqlResults.rows[0]);
      } else {
        superagent.get(locationURL)
          .then(resultsFromSuperAgent => {
            console.log('api route', resultsFromSuperAgent.body)
            let returnObj = new Location(city, resultsFromSuperAgent.body[0]);
            console.log(returnObj);
            let sqlQuery = 'INSERT INTO city (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';
            let safeValue = [returnObj.search_query, returnObj.formatted_query, returnObj.latitude, returnObj.longitute];
            client.query(sqlQuery, safeValue)
            response.status(200).send(returnObj);
          })
          .catch(err => console.log(err))
      }
    }).catch(err => console.log(err));
}

// constructor for weather
function Weather(obj) {
  this.forecast = obj.weather.description;
  this.time = obj.valid_date;
}

// Handler for weather endpoint
function weatherHandler(request, response){
  // let weatherArray = [];
  let search_query = request.query.search_query;
  console.log('stuff I got from the front end on the weather route', search_query)
  let weatherURL = `https://api.weatherbit.io/v2.0/forecast/daily?city=${search_query}&key=${process.env.WEATHER_DATA_API_KEY}`
  superagent.get(weatherURL)
    .then(results => {
      let returnObj = results.body.data.map(day => new Weather(day))
      // console.log(results.body.data)
      response.status(200).send(returnObj);
    }).catch(err => console.log(err));
}

// constructor for trails
function Trail(obj) {
  this.name = obj.name;
  this.location = obj.location;
  this.length = obj.length;
  this.star_votes = obj.starsVotes;
  this.votes = obj.votes;
  this.trail_url = obj.url;
  this.conditions = `${obj.conditionStatus} ${obj.conditionDetails}`;
  this.condition_date = obj.conditionDate.slice(0, 10);
  this.condition_date = obj.conditionDate.slice(12, 19);
}

// Handler for trails endpoint
function trailHandler(request, response){
  let {
    latitude,
    longitude
  } = request.query;
  //Replace local location file with URL and GeoData Key
  let trailsURL = `https://www.hikingproject.com/data/get-trails`;
  superagent.get(trailsURL)
    .query({
      lat: latitude,
      lon: longitude,
      maxDistance: 200,
      key: process.env.HIKING_DATA_API_KEY,
    })
    .then(resultsFromSuperAgent => {
      const trailResult = resultsFromSuperAgent.body.trails.map(trail => {
        return new Trail(trail);
      })
      response.status(200).send(trailResult);
    }).catch(err => console.log(err));
}

// constructor for movies
function Movie(obj) {
  this.title = obj.title;
  this.overview = obj.overview;
  this.average_votes = obj.average;
  this.total_votes = obj.total;
  this.image_url = `https://image.tmdb.org/t/p/w500${obj.poster_path}`;
  this.popularity = obj.popularity;
  this.release_on = obj.release;
}

function movieHandler(request, response) {
  let movieQuery = request.query.search_query;
  console.log('stuff I got from the front end on the movies route', movieQuery)

  let key = process.env.MOVIE_API_KEY;

  let movieURL = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${movieQuery}`;

  superagent.get(movieURL)
    .then(resultsFromSuperAgent => {
      let returnObj = resultsFromSuperAgent.body.results.map(movie => new Movie(movie));
      // console.log(results.body.data)
      response.status(200).send(returnObj);
    }).catch(err => console.log(err));
}

// Constructor for restaurant endpoint
function Restaurant(obj) {
  this.name= obj.name;
  this.image_url = obj.image_url;
  this.price = obj.price;
  this.rating = obj.rating;
  this.url = obj.url
}

// // Handler for restaurant endpoint
function restaurantHandler(request, response) {
  const { latitude, longitude} = request.query;
  console.log('this is our restaurant route', request.query);
  const page = request.query.page;
  const numPerPage = 5;
  const start = (page -1) * numPerPage;

  const queryParams = {
    // latitude: request.query.latitude,
    // longitude: request.query.longitude,
    categories: 'restaurants'
  }

  let yelpURL = `https://api.yelp.com/v3/businesses/search?latitude=${latitude}&longitude=${longitude}`;

  superagent.get(yelpURL, queryParams)
    .set({'Authorization': `Bearer ${process.env.YELP_API_KEY}`})
    .then(resultsFromSuperAgent => {
      console.log('data from superagent', resultsFromSuperAgent.body);
      let restaurantArray = resultsFromSuperAgent.body.businesses.map (restaurant => {return new Restaurant(restaurant);
      })
      response.status(200).send(restaurantArray);
    }) .catch (err => console.log(err));
}

// Error handler
function handleNotFound(request, response) {
  response.status(404).send('this route does not exist');
}

app.get('*', (request, response) => {
  response.status(404).send('sorry, this route does not exist');
})



// Anytime you make changes to schema run this in terminal
// psql -d city_explorer -f schema.sql