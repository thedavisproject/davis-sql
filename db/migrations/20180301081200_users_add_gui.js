exports.up = function(knex) {
  return Promise.all(['master', 'web'].map(schema =>
      knex.schema.withSchema(schema).table('users', function(t){
        t.boolean('gui').defaultTo(false).notNullable();
      }).then(function(){
        return knex('users').withSchema(schema).where('admin', '=', true).update('gui', true);
      })));
};

exports.down = function(knex, Promise) {
  return Promise.all(['master', 'web'].map(schema =>
      knex.schema.withSchema(schema).table('users', function(t){
        t.dropColumn('gui');
      })));
};
