exports.up = function(knex, Promise) {
  return Promise.all(['master', 'web'].map(schema => 
      knex.schema.withSchema(schema).table('facts', function(t){
        t.renameColumn('value', 'numerical_value');

        t.string('text_value')
          .nullable();
      })));
};

exports.down = function(knex, Promise) {
  return Promise.all(['master', 'web'].map(schema => 
      knex.schema.withSchema(schema).table('facts', function(t){
        t.renameColumn('numerical_value', 'value')
          .nullable();

        t.dropColumn('text_value');
      })));
};
