exports.up = function(knex) {
  const util = require('../util/migrate')(knex);
  return util.createEntityTable('public', 'data_sets', function(t){
    
    t.json('schema')
      .nullable();

    t.integer('folder_id')
      .unsigned()
      .references('id')
      .inTable('folders')
      .onDelete('CASCADE')
      .index()
      .nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.withSchema('public').dropTable('data_sets');
};
