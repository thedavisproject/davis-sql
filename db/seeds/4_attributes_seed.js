exports.seed = function(knex, Promise) {

  const util = require('../util/seed')(knex, Promise);

  const data = [
    /*
    id, name, key, parent_id, variable_id
     */
    [  1, 'United States', 'United States', null, 1 ],
    [  2, 'Massachusetts', 'Massachusetts',    1, 1 ],
    [  3,      'New York',      'New York',    1, 1 ],
    [  4,          'Male',          'Male', null, 2 ],
    [  5,        'Female',        'Female', null, 2 ],
    [  6,         'Honda',         'Honda', null, 5 ],
    [  7,        'Toyota',        'Toyota', null, 5 ],
    [  8,        'Accord',        'Accord', null, 6 ],
    [  9,         'Civic',         'Civic', null, 6 ],
    [ 10,       'Corolla',       'Corolla', null, 6 ],
    [ 11,         'Camry',         'Camry', null, 6 ],
    [ 12,          'John',          'John', null, 9 ],
    [ 12,          'Mary',          'Mary', null, 9 ],
    [ 13,       'Vermont',       'Vermont',    1, 1 ]
    
  ];

  const map = row => ({
    name: row[1],
    key: row[2],
    parent_id: row[3],
    variable_id: row[4],
    created: '2016-06-24T16:30:00.000Z',
    modified: '2016-06-24T16:30:00.000Z'   
  });

  return Promise.all([
    util.insertSequentially(data, map, 'master.attributes'),
    util.insertSequentially(data, map, 'web.attributes')
  ]);
};
