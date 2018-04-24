exports.up = function(knex) {
  const util = require('../util/migrate')(knex);
  return util.createHierarchyEntityTable('public', 'folders', null, false);
};

exports.down = function(knex) {
  return knex.schema.withSchema('public').dropTable('folders');
};
