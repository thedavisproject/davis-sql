exports.up = function(knex, Promise) {

  const util = require('../util/migrate')(knex);

  return Promise.all(['master', 'web'].map(schema => 
    
    util.createEntityTable(schema, 'action_log', function(t){
      
      t.integer('user_id').notNullable();
      
      t.string('subject_type').notNullable();

      t.integer('subject_id').nullable();

      t.string('action').notNullable();
    })));
};

exports.down = function(knex) {
  return Promise.all(['master', 'web'].map(schema => 
    knex.schema.withSchema(schema).dropTable('action_log')));
};
