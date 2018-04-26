module.exports = function(storageConfig){

  const storageApi = () => {
    const db = require('./db/knex')(storageConfig.knex);
    return Object.assign({}, {
      transact: require('./src/transact')(db, storageConfig)
    }, require('./src/api')(db, storageConfig));
  };

  return {
    tools: require('./db/tools')(storageConfig.knex),
    storageApi
  };
};
