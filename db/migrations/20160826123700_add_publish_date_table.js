exports.up = function(knex, Promise) {
  return Promise.all(['master', 'web'].map(schema => 

    knex.schema.withSchema(schema).createTable('publish_history', function(t) {
    
      t.string('target')
        .primary()
        .index()
        .notNullable();

      t.dateTime('last_publish').notNullable();
    })));
};

exports.down = function(knex) {
  
  return Promise.all(['master', 'web'].map(schema => 
    knex.schema.withSchema(schema).dropTable('publish_history')));
};
