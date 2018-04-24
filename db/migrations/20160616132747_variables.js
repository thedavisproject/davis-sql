exports.up = function(knex) {
  const util = require('../util/migrate')(knex);
  return util.createEntityTable('public', 'variables', function(t){

    t.integer('type').notNullable();

    t.string('key').notNullable();

    t.integer('data_set_id')
      .unsigned()
      .references('id')
      .inTable('data_sets')
      .onDelete('CASCADE')
      .index()
      .nullable();
  }, false);
};

exports.down = function(knex) {
  return knex.schema.withSchema('public').dropTable('variables');
};
