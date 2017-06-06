const {merge} = require('ramda');

module.exports = function(dbConfig){
  const config = merge({
    migrations: {
      directory: __dirname + '/migrations'
    },
    seeds: {
      directory: __dirname + '/seeds'
    }
  }, dbConfig);

  return require('knex')(config);
};
