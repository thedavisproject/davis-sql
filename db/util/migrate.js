module.exports = function(knex) {

  const createHierarchyColumns = function(schema, t, tableName){
    t.integer('parent_id')
      .unsigned()
      .references('id')
      .inTable(`${schema}.${tableName}`)
      .onDelete('CASCADE')
      .index()
      .nullable();
  };

  const createEntityTable = function(schema, name, callback){

    return knex.schema.withSchema(schema).createTable(name, function(t) {
      t.increments('id')
        .primary()
        .index();

      t.string('name').notNullable();

      t.dateTime('created').notNullable();

      t.dateTime('modified').notNullable();

      t.json('extended_properties')
        .nullable();

      if(callback){
        callback(t);
      }
    });

  };

  const createHierarchyEntityTable = function(schema, name, callback){

    return createEntityTable(schema, name, function(t){
      createHierarchyColumns(schema, t, name);
      if(callback){
        callback(t);
      }
    });

  };

  const runSequentially = function(queries) {
    return queries.reduce(function(p, query) {
      return p.then(() => query);
    }, Promise.resolve([]));
  };

  const runRawSequentially = function(statements) {
    return runSequentially(statements.map(s => knex.schema.raw(s)));
  };

  return {
    createEntityTable: createEntityTable,
    createHierarchyEntityTable: createHierarchyEntityTable,
    runSequentially: runSequentially,
    runRawSequentially: runRawSequentially
  };
};
