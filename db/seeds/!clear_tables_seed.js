const tables = [
  'folders',
  'data_sets',
  'variables',
  'attributes',
  'facts',
  'users',
  'publish_history',
  'action_log'
];

exports.seed = function(knex) {

  const fullyQualifiedTables = schema => tables.map(t => `${schema}.${t}`);

  return Promise.all(
    ['master', 'web'].map(schema => 
      knex.raw(`truncate ${fullyQualifiedTables(schema).join(',')} RESTART IDENTITY`)));
};
