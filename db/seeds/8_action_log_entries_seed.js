exports.seed = function(knex, Promise) {

  const util = require('../util/seed')(knex, Promise);

  const data = [
    /*
    id, name, user_id, subject_type, subject_id, action, created, modified
     */
    [  1, '', 1, 'folder',    1,  'UPDATE', '2016-09-14T16:30:00.000Z', '2016-09-14T16:30:00.000Z' ],
    [  2, '', 2, 'variable', 10,  'DELETE', '2016-10-14T17:30:00.000Z', '2016-10-14T17:30:00.000Z' ],
    [  3, '', 1, 'full',   null, 'PUBLISH', '2016-11-14T18:30:00.000Z', '2016-11-14T18:30:00.000Z' ],
    [  4, '', 3, 'variable', 11,  'CREATE', '2016-12-15T18:30:00.000Z', '2016-12-15T18:30:00.000Z' ]
    
  ];

  const map = row => ({
    name: row[1],
    user_id: row[2],
    subject_type: row[3],
    subject_id: row[4],
    action: row[5],
    created: row[6],
    modified: row[7]
  });

  return Promise.all([
    util.insertSequentially(data, map, 'master.action_log'),
    util.insertSequentially(data, map, 'web.action_log')
  ]);
};
