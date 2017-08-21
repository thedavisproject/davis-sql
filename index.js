module.exports = function(storageConfig){

  const db = require('./db/knex')(storageConfig.knex);

  return Object.assign({}, {
    transact: require('./src/transact')(db, storageConfig['transaction-timeout'])
  }, require('./src/api')(db));
};
