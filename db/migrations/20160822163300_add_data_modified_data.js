exports.up = function(knex) {
  return knex.schema.withSchema('public').table('data_sets', function(t) {
    
    t.dateTime('data_modified').nullable();

  });
};

exports.down = function(knex) {
  return knex.schema.withSchema('public').table('data_sets', function(t){
    t.dropColumn('data_modified');
  });
};
