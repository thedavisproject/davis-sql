const types = require('davis-model').variable.types;

exports.seed = function(knex, Promise) {

  const util = require('../util/seed')(knex, Promise);

  const data = [
    /*
    id, name, type, key, data_set_id
     */
    [ 1  , 'Location'         , types.categorical , 'Location'         , null ] ,
    [ 2  , 'Gender'           , types.categorical , 'Gender'           , null ] ,
    [ 3  , 'Population Count' , types.numerical   , 'Population Count' , 2 ]    ,
    [ 4  , 'Population Count' , types.numerical   , 'Population Count' , 3 ]    ,
    [ 5  , 'Vehicle Make'     , types.categorical , 'Vehicle Make'     , 4 ]    ,
    [ 6  , 'Vehicle Model'    , types.categorical , 'Vehicle Model'    , 4 ]    ,
    [ 7  , 'Horsepower'       , types.numerical   , 'Horsepower'       , 4 ]    ,
    [ 8  , 'Average MPG'      , types.numerical   , 'Average MPG'      , 4 ]    ,
    [ 9  , 'Name'             , types.categorical , 'Name'             , 1 ]    ,
    [ 10 , 'Age'              , types.numerical   , 'Age'              , 1 ]    ,
    [ 11 , 'Count'            , types.numerical   , 'Count'            , 5 ]    ,
    [ 12 , 'CarId'            , types.text        , 'Count'            , 5 ]
  ];

  const map = row => ({
    name: row[1],
    type: row[2],
    key: row[3],
    data_set_id: row[4],
    created: '2016-06-24T16:30:00.000Z',
    modified: '2016-06-24T16:30:00.000Z'
  });

  return Promise.all([
    util.insertSequentially(data, map, 'master.variables'),
    util.insertSequentially(data, map, 'web.variables')
  ]);
};
