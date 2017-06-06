exports.up = function(knex) {
  return knex.schema.withSchema('public').table('variables', function(t) {
    
    t.json('format')
      .nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.withSchema('public').table('variables', function(t){
    t.dropColumn('format');
  });
};
