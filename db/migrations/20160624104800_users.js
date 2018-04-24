const {user} = require('davis-model');

exports.up = function(knex) {
  const util = require('../util/migrate')(knex);
  return util.createEntityTable('public', 'users', function(t){
    t.string('email').notNullable().index();
    t.string('password').notNullable();
    t.boolean('admin').defaultTo(false).notNullable();
  }, false).then(function(){

    var u = user.new(null, 'admin', 'admin');
    u = user.setPassword('password', u);

    const now = new Date();

    return knex('users').withSchema('public').insert({
      name: u.name,
      email: u.email,
      password: u.password,
      admin: true,
      created: now,
      modified: now
    });
  });
};

exports.down = function(knex) {
  return knex.schema.withSchema('public').dropTable('users');
};
