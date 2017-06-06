exports.seed = function(knex, Promise) {
  return knex('publish_history').withSchema('master')
    .insert({
      target: 'web',
      last_publish: '2016-07-24T16:30:00.000Z'
    });
};
