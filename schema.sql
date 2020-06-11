DROP TABLE IF EXISTS city;

CREATE TABLE city (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude DECIMAL(12, 8),
  longitude DECIMAL(12, 8)
);

INSERT INTO city (search_query, formatted_query, latitude, longitude)VALUES ('seattle', 'Seattle', 47.8278656, -122.3053932 );
SELECT * FROM city;

