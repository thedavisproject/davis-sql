exports.up = function(knex) {
  const util = require('../util/migrate')(knex);
  return util.createHierarchyEntityTable('public', 'attributes', function(t){

    t.string('key').notNullable();
  
    t.integer('variable_id')
      .unsigned()
      .references('id')
      .inTable('variables')
      .onDelete('CASCADE')
      .index()
      .notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.withSchema('public').dropTable('attributes');
};
