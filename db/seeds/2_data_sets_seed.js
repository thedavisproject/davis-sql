exports.seed = function(knex, Promise) {

  const util = require('../util/seed')(knex, Promise);

  const masterData = [
    /*
    id, name, folder_id
     */
    [ 1,               'People', null, '2016-06-24T16:30:00.000Z', '2016-06-24T16:30:00.000Z', '2016-06-24T16:30:00.000Z'],
    [ 2,           'Population',    1, '2016-06-24T16:30:00.000Z', '2016-04-24T16:30:00.000Z', '2016-06-24T16:30:00.000Z'],
    [ 3, 'Population by Gender',    2, '2016-06-24T16:30:00.000Z', '2016-06-24T16:30:00.000Z', '2016-06-24T16:30:00.000Z'],
    [ 4,         'Fuel Economy',    3, '2016-06-24T16:30:00.000Z', '2016-06-24T16:30:00.000Z', '2016-06-24T16:30:00.000Z'],
    [ 5,   'Published, changed', null, '2016-06-24T00:00:00.000Z', '2016-08-26T00:00:00.000Z', '2016-08-26T16:30:00.000Z', 
      JSON.stringify([{'variable': 2, 'attributes': [2,3]}])],
    [ 6,         'Un-published', null, '2016-08-26T00:00:00.000Z', '2016-08-26T00:00:00.000Z', '2016-06-24T16:30:00.000Z']
  ];

  // For testing publishing
  const webData = [
    /*
    id, name, folder_id
     */
    [ 1,               'People', null, '2016-06-24T16:30:00.000Z', '2016-06-24T16:30:00.000Z', '2016-06-24T16:30:00.000Z'],
    [ 2,           'Population',    1, '2016-06-24T16:30:00.000Z', '2016-04-24T16:30:00.000Z', '2016-06-24T16:30:00.000Z'],
    [ 3, 'Population by Gender',    2, '2016-06-24T16:30:00.000Z', '2016-06-24T16:30:00.000Z', '2016-06-24T16:30:00.000Z'],
    [ 4,         'Fuel Economy',    3, '2016-06-24T16:30:00.000Z', '2016-06-24T16:30:00.000Z', '2016-06-24T16:30:00.000Z'],
    [ 5,            'Published', null, '2016-06-24T00:00:00.000Z', '2016-06-24T00:00:00.000Z', '2016-06-24T16:30:00.000Z']
  ];

  const map = row => ({
    name: row[1],
    folder_id: row[2],
    created: row[3],
    modified: row[4],
    data_modified: row[5],
    schema: row[6]
  });

  return Promise.all([
    util.insertSequentially(masterData, map, 'master.data_sets'),
    util.insertSequentially(webData, map, 'web.data_sets')
  ]);
};
