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


// Lab 9 Setup----------------------------------------------------------------------------------------------

// MOVIES

// app.get('/movies', (request, response) =>
// try {
  //   // let movieArray = [];
  //   let search_query = request.query.search_query;
  //   console.log('stuff I got from the front end on the movies route', search_query)
  
  // let movieURL = `https://api.themoviedb.org/3/movie/550?city=${search_query}?api_key=${MOVIE_API_KEY}`;

//   superagent.get(movieURL)
//     .then(results => {
//       let returnObj = results.body.data.map(day => new Movie(day))
//       // console.log(results.body.data)
//       response.status(200).send(returnObj);
//     });
// } catch (err) {
//   console.log('Error', err);
//   response.status(500).send('sorry, something went wrong');
// }
// });

// function Movie(obj) {
//   this.title = obj.title;
//   this.overview = obj.overview;
//   this.average_votes = obj.average;
//   this.total_votes = obj.total;
//   this.image_url = obj.image;
//   this.popularity = obj.popularity;
//   this.release_on = obj.release;
// }


// YELP 
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailHandler);
// app.get('/restaurants', restaurantHandler); 
// app.use('*', handleNotFound);


// Handler for restaurant endpoint
function restaurantHandler(request, response) {
  // console.log('this is our restaurant route', request.query);
  // const page = request.query.page;
  // const numPerPage = 5;
  // const start = (page -1) * numPerPage;

  // const queryParams = {
    // lat: request.query.latitude,
    // start: start,
    // count: numPerPage,
    // lng: request.query.longitude
// }

// let yelpURL = `https://api.yelp.com/v3/businesses/?city=${search_query}&key=${YELP_API_KEY}`;

// superagent.get(yelpURL)
//   .set("Authorization: Bearer ", process.env.YELP_API_KEY)
//   .query(queryParams)
//   .then(data => {
//     console.log('data from superagent', data.body);
//     let restaurantArray = data.body.restaurants;
//     console.log('this is my restaurantArray', restaurantArray[0]);
//     const finalRestaurants = restaurantArray.map(eatery => {
//       return new Restaurant(eatery);
//     })

//    response.status(200).send(finalRestaurants);
//   }) catch (err) {
    // console.log('Error', err);
    // response.status(500).send('sorry, something went wrong');
}

// Constructor for restaurant endpoint
  // function Restaurant(obj) {
  //   this.restaurant = obj.restaurant.name;
  //   this.cuisine = obj.restaurant.cuisine;
  //   this.locality = obj.restaurant.location.locality;
  // }


// Error handler
// function handleNotFound(request, response) {
//   response.status(404).send('this route does not exist');
// }

// Lab 9 Setup---------------------------------------------------------------------------------------------------


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
              response.status(200).send(returnObj);
              console.log(returnObj);
              let sqlQuery = 'INSERT INTO city (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';
              let safeValue = [returnObj.search_query, returnObj.formatted_query, returnObj.latitude, returnObj.longitute];
              client.query(sqlQuery, safeValue)
                .then(() => {})
            })
            .catch(err => console.log(err))
        }
      })catch (err) {
        console.log('Error', err);
        response.status(500).send('sorry, something went wrong');
      }
};

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
      });catch (err) {
        console.log('Error', err);
        response.status(500).send('sorry, something went wrong');
      }
};

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
    .then(results => {
      const trailResult = results.body.trails.map(trail => {
        return new Trail(trail);
      })
      response.status(200).send(trailResult);
    }).catch(err => console.log(err))
}

// constructor for location
function Location(searchQuery, obj) {
  this.search_query = searchQuery;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}

// constructor for weather
function Weather(obj) {
  this.forecast = obj.weather.description;
  this.time = obj.valid_date;
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

app.get('*', (request, response) => {
  response.status(404).send('sorry, this route does not exist');
})



// Anytime you make changes to schema run this in terminal
// psql -d city_explorer -f schema.sql