module.exports = db => ({
  entities: require('./entities/storage')(db),
  data: {
    query: require('./data/query')(db),
    create: require('./data/create')(db),
    delete: require('./data/delete')(db)
  },
  publish: require('./publish/publish')(db)
});
