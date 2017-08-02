module.exports = function(dbConfig){

  const db = require('./db/knex')(dbConfig);

  return Object.assign({}, {
    transact: require('./src/transact')(db)
  }, require('./src/api')(db));
};
