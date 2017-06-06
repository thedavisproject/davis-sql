exports.seed = function(knex, Promise) {

  const util = require('../util/seed')(knex, Promise);

  const sharedData = [
    /*
    data_set_id, individual_id, variable_id, attribute_id, value
     */
    
    // Population Data Set (Location, Population Count)
    [2, 1, 1, 2,        null], // Row 1, Location = Massachusetts
    [2, 2, 1, 3,        null], // Row 2, Location = New York
    [2, 1, 3, null,  6547000], // Row 1, Population Count = 6.547 million
    [2, 2, 3, null, 19378000], // Row 2, Population Count = 19.378 million
     
    // Population by Gender Data Set (Location, Gender, Population Count)
    [3, 1, 1, 2,        null], // Row 1, Location = Massachusetts
    [3, 1, 2, 4,        null], // Row 1, Gender = Male
    [3, 1, 4, null,  3166000], // Row 1, Population Count = 3.166 million
    [3, 2, 1, 2,        null], // Row 2, Location = Massachusetts
    [3, 2, 2, 5,        null], // Row 2, Gender = Female
    [3, 2, 4, null,  3381000], // Row 2, Population Count = 3.381 million
    [3, 3, 1, 3,        null], // Row 3, Location = New York
    [3, 3, 2, 4,        null], // Row 3, Gender = Male
    [3, 3, 4, null,  9377000], // Row 3, Population Count = 9.377 million
    [3, 4, 1, 3,        null], // Row 4, Location = New York
    [3, 4, 2, 5,        null], // Row 4, Gender = Female
    [3, 4, 4, null, 10000000], // Row 4, Population Count = 10.000 million

    
    // Fuel Economy Data Set (Vehicle Make, Vehicle Model, Horsepower, Average MPG)
    [4, 1, 5,  6,  null], // Row 1, Make = Honda
    [4, 1, 6,  8,  null], // Row 1, Model = Accord
    [4, 1, 7, null, 120], // Row 1, Horsepower = 120
    [4, 1, 8, null,  33], // Row 1, MPG = 33
    [4, 2, 5,  6,  null], // Row 2, Make = Honda
    [4, 2, 6,  9,  null], // Row 2, Model = Civic
    [4, 2, 7, null, 130], // Row 2, Horsepower = 130
    [4, 2, 8, null,  37], // Row 2, MPG = 37
    [4, 3, 5,  7,  null], // Row 3, Make = Toyota
    [4, 3, 6, 10,  null], // Row 3, Model = Corolla
    [4, 3, 7, null, 125], // Row 3, Horsepower = 125
    [4, 3, 8, null,  36], // Row 3, MPG = 36
    [4, 4, 5,  7,  null], // Row 4, Make = Toyota
    [4, 4, 6, 11,  null], // Row 4, Model = Camry
    [4, 4, 7, null, 180], // Row 4, Horsepower = 180
    [4, 4, 8, null,  31], // Row 4, MPG = 31
    [4, 5, 5,  7,  null], // Row 5, Make = Toyota
    [4, 5, 6, null,  null], // Row 5, Model = None
    [4, 5, 7, null, 10000], // Row 5, Horsepower = 10000
    [4, 5, 8, null,  null] // Row 5, MPG = .5    
  ];

  const masterData = sharedData.concat([
    // Publish test data
    [5, 1, 1,     2, null], // Row 1, Location = Massachusetts
    [5, 2, 1,    13, null], // Row 2, Location = Vermont
    [5, 1, 11, null,   30], // Row 1, Count
    [5, 2, 11, null,   25]  // Row 2, Count
  ]);

  const webData = sharedData.concat([
    // Publish test data
    [5, 1, 1,     2, null], // Row 1, Location = Massachusetts
    [5, 2, 1,     3, null], // Row 2, Location = New York
    [5, 1, 11, null,   10], // Row 1, Count
    [5, 2, 11, null,   11]  // Row 2, Count
  ]);


  const map = row => ({
    data_set_id: row[0],
    individual_id: row[1],
    variable_id: row[2],
    attribute_id: row[3],
    value: row[4]
  });

  return Promise.all([
    util.insertSequentially(masterData, map, 'master.facts'),
    util.insertSequentially(webData, map, 'web.facts')
  ]);
};
