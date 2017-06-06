exports.seed = function(knex, Promise) {

  const util = require('../util/seed')(knex, Promise);

  const data = [
    /*
    id, name, parent_id
     */
    [ 1, 'Demographics', null ],
    [ 2,          'Age',    1 ],
    [ 3,         'Cars', null ]
  ];

  const map = row => ({
    name: row[1],
    parent_id: row[2],
    created: '2016-06-24T16:30:00.000Z',
    modified: '2016-06-24T16:30:00.000Z'
  });

  return Promise.all([
    util.insertSequentially(data, map, 'master.folders'),
    util.insertSequentially(data, map, 'web.folders')
  ]);
};
