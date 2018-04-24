const R = require('ramda');

const sourceTables = [
  {name: 'folders', isEntity: true},
  {name: 'data_sets', isEntity: true},
  {name: 'variables', isEntity: true},
  {name: 'attributes', isEntity: true},
  {name: 'facts', isEntity: false},
  {name: 'users', isEntity: true}
];

const newSchemaQueries = function(knex, schemaName){

  const util = require('../util/migrate')(knex);

  return [
    util.createHierarchyEntityTable(schemaName, 'folders', null, false),
    util.createEntityTable(schemaName, 'data_sets', function(t){
      t.json('schema')
        .nullable();
      t.integer('folder_id')
        .unsigned()
        .references('id')
        .inTable(`${schemaName}.folders`)
        .onDelete('CASCADE')
        .index()
        .nullable();
      t.dateTime('data_modified').nullable();
    }, false),
    util.createEntityTable(schemaName, 'variables', function(t){
      t.integer('type').notNullable();
      t.string('key').notNullable();
      t.integer('data_set_id')
        .unsigned()
        .references('id')
        .inTable(`${schemaName}.data_sets`)
        .onDelete('CASCADE')
        .index()
        .nullable();
      t.json('format')
        .nullable();
    }, false),
    util.createHierarchyEntityTable(schemaName, 'attributes', function(t){
      t.string('key').notNullable();
      t.integer('variable_id')
        .unsigned()
        .references('id')
        .inTable(`${schemaName}.variables`)
        .onDelete('CASCADE')
        .index()
        .notNullable();
    }, false),
    knex.schema.withSchema(schemaName).createTable('facts', function(t) {
      t.integer('data_set_id')
        .unsigned()
        .references('id')
        .inTable(`${schemaName}.data_sets`)
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
        .inTable(`${schemaName}.variables`)
        .onDelete('CASCADE')
        .index()
        .notNullable();
      // Compound Primary
      t.primary(['data_set_id', 'individual_id', 'variable_id']);
      // Used for categorical dimensions
      t.integer('attribute_id')
        .unsigned()
        .references('id')
        .inTable(`${schemaName}.attributes`)
        .onDelete('CASCADE')
        .index()
        .nullable();

      // Used for quantitative dimensions
      t.decimal('value', 19, 5)
        .nullable();
    }),
    util.createEntityTable(schemaName, 'users', function(t){
      t.string('email').notNullable().index();
      t.string('password').notNullable();
      t.boolean('admin').notNullable();
    }, false)
  ];
};

exports.up = function(knex) {
  const util = require('../util/migrate')(knex);

  const queries = R.flatten([
    // Create master schema
    knex.schema.raw('create schema master'),

    // Create web schema
    knex.schema.raw('create schema web'),

    newSchemaQueries(knex, 'master'),

    newSchemaQueries(knex, 'web'),

    // Copy data from public -> master
    sourceTables.map(t =>
      knex.schema.raw(`insert into master.${t.name} (select * from public.${t.name})`)),

    // Copy data from public -> web
    sourceTables.map(t =>
      knex.schema.raw(`insert into web.${t.name} (select * from public.${t.name})`)),

    // Drop tables from public (reverse order to avoid constraint issues)
    R.reverse(sourceTables).map(t =>
      knex.schema.raw(`drop table public.${t.name}`))
  ]);

  return util.runSequentially(queries);
};

exports.down = function(knex) {
  const util = require('../util/migrate')(knex);

  const queries = R.flatten([

    // Copy tables from master -> public
    newSchemaQueries(knex, 'public'),

    // Copy data from master -> public
    sourceTables.map(t =>
      knex.schema.raw(`insert into public.${t.name} (select * from master.${t.name})`)),

    // Create master schema
    knex.schema.raw('drop schema master CASCADE'),

    // Create web schema
    knex.schema.raw('drop schema web CASCADE')

  ]);

  return util.runSequentially(queries);
};
