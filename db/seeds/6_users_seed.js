const bcrypt = require('bcrypt-nodejs');

exports.seed = function(knex, Promise) {

  const util = require('../util/seed')(knex, Promise);

  const data = [
    /*
    id, name, email, password, admin, gui
     */
    [ 1,    'Admin',            'admin', bcrypt.hashSync('password', bcrypt.genSaltSync(8)), true, true ],
    [ 2, 'John Doe', 'john@example.com', bcrypt.hashSync('1234', bcrypt.genSaltSync(8)), false, false ]
  ];

  const map = row => ({
    name: row[1],
    email: row[2],
    password: row[3],
    admin: row[4],
    gui: row[5],
    created: '2016-06-24T16:30:00.000Z',
    modified: '2016-06-24T16:30:00.000Z'
  });

  return Promise.all([
    util.insertSequentially(data, map, 'master.users'),
    util.insertSequentially(data, map, 'web.users')
  ]);
};
