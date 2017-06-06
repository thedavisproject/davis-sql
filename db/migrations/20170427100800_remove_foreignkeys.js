exports.up = function(knex, Promise) {
  return Promise.all(['master', 'web'].map(schema => 
    Promise.all([
      knex.schema.withSchema(schema).table('data_sets', function(t){
        t.dropForeign('folder_id');
      }),
      knex.schema.withSchema(schema).table('variables', function(t){
        t.dropForeign('data_set_id');
      }),
      knex.schema.withSchema(schema).table('attributes', function(t){
        t.dropForeign('variable_id');
      }),
      knex.schema.withSchema(schema).table('facts', function(t){
        t.dropForeign('data_set_id');
        t.dropForeign('variable_id');
        t.dropForeign('attribute_id');
      }),
    ])));
};

exports.down = function(knex, Promise) {
  return Promise.all(['master', 'web'].map(schema => 
    Promise.all([
      knex.schema.withSchema(schema).table('data_sets', function(t){
        t.foreign('folder_id')
          .references('id')
          .inTable(`${schema}.folders`)
          .onDelete('CASCADE');
      }),
      knex.schema.withSchema(schema).table('variables', function(t){
        t.foreign('data_set_id')
          .references('id')
          .inTable(`${schema}.data_sets`)
          .onDelete('CASCADE');
      }),
      knex.schema.withSchema(schema).table('attributes', function(t){
        t.foreign('variable_id')
          .references('id')
          .inTable(`${schema}.variables`)
          .onDelete('CASCADE');
      }),
      knex.schema.withSchema(schema).table('facts', function(t){
        t.foreign('data_set_id')
          .references('id')
          .inTable(`${schema}.data_sets`)
          .onDelete('CASCADE');

        t.foreign('variable_id')
          .references('id')
          .inTable(`${schema}.variables`)
          .onDelete('CASCADE');

        t.foreign('attribute_id')
          .references('id')
          .inTable(`${schema}.attributes`)
          .onDelete('CASCADE');
      })
    ])));
};
