exports.up = function(knex) {
  return knex.schema.withSchema('public').createTable('facts', function(t) {
    
    t.integer('data_set_id')
      .unsigned()
      .references('id')
      .inTable('data_sets')
      .onDelete('CASCADE')
      .index()
      .notNullable();

    t.integer('individual_id')
      .unsigned()
      .index()
      .notNullable();

    t.integer('variable_id')
      .unsigned()
      .references('id')
      .inTable('variables')
      .onDelete('CASCADE')
      .index()
      .notNullable();

    // Compound Primary
    t.primary(['data_set_id', 'individual_id', 'variable_id']);

    // Used for categorical dimensions
    t.integer('attribute_id')
      .unsigned()
      .references('id')
      .inTable('attributes')
      .onDelete('CASCADE')
      .index()
      .nullable();

    // Used for quantitative dimensions
    t.decimal('value', 19, 5)
      .nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.withSchema('public').dropTable('facts');
};
