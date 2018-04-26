const R = require('ramda');
const knex = require('./knex');
const when = require('when');

module.exports = config => ({
  migrateLatest: () => {
    const db = knex(config);
    return db.migrate.latest()
      .then(function(){
        return db.migrate.currentVersion();
      })
      .then(function(version){
        console.log(`Migrated Database to Version: ${version}`);
        return db.destroy();
      })
      .catch(function(e){
        console.error(e);
        return db.destroy();
      });
  },
  migrateRollback: () => {
    const db = knex(config);
    return db.migrate.rollback()
      .then(function(){
        return db.migrate.currentVersion();
      })
      .then(function(version){
        console.log(`Migrated Database to Version: ${version}`);
        return db.destroy();
      })
      .catch(function(e){
        console.error(e);
        return db.destroy();
      });
  }
});
