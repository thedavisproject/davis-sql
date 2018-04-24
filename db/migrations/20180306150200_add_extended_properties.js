exports.up = function(knex, Promise) {
  return Promise.all([
    'master',
    'web'
  ].map(schema =>
    Promise.all([
      'folders',
      'data_sets',
      'variables',
      'attributes',
      'users',
      'action_log'
    ].map(tableName =>
      knex.schema.withSchema(schema).table(tableName, function(t){
        t.json('extended_properties').nullable();
      })))));
};

exports.down = function(knex, Promise) {
  return Promise.all([
    'master',
    'web'
  ].map(schema =>
    Promise.all([
      'folders',
      'data_sets',
      'variables',
      'attributes',
      'users',
      'action_log'
    ].map(tableName =>
      knex.schema.withSchema(schema).table(tableName, function(t){
        t.dropColumn('extended_properties');
      })))));
};
