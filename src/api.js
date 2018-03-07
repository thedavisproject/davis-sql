module.exports = (db, storageConfig) => ({
  entities: require('./entities/storage')(db, storageConfig),
  data: {
    query: require('./data/query')(db, storageConfig),
    create: require('./data/create')(db, storageConfig),
    delete: require('./data/delete')(db, storageConfig)
  },
  publish: require('./publish/publish')(db, storageConfig)
});
