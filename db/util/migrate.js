module.exports = function(knex) {

  const _createHierarchyColumns = function(schema, t, tableName){
    t.integer('parent_id')
      .unsigned()
      .references('id')
      .inTable(`${schema}.${tableName}`)
      .onDelete('CASCADE')
      .index()
      .nullable();
  };

  const _createEntityTable = function(schema, name, callback){

    return knex.schema.withSchema(schema).createTable(name, function(t) {
      t.increments('id')
        .primary()
        .index();
    
      t.string('name').notNullable();

      t.dateTime('created').notNullable();

      t.dateTime('modified').notNullable();

      if(callback){
        callback(t);
      }
    });

  };

  const _createHierarchyEntityTable = function(schema, name, callback){

    return _createEntityTable(schema, name, function(t){
      _createHierarchyColumns(schema, t, name);
      if(callback){
        callback(t);
      }
    });

  };

  const _runSequentially = function(queries) {
    return queries.reduce(function(p, query) {
      return p.then(() => query);
    }, Promise.resolve([]));
  };

  const _runRawSequentially = function(statements) {
    return _runSequentially(statements.map(s => knex.schema.raw(s)));
  };

  return {
    createEntityTable: _createEntityTable,
    createHierarchyEntityTable: _createHierarchyEntityTable,
    runSequentially: _runSequentially,
    runRawSequentially: _runRawSequentially
  };
};
