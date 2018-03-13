// Publish entity type
//  - entity type is mapped to table(s) and they are truncated in the target and then recopied
// Publish data for a list of data sets
//  - This is more performance intensive
//  - core can figure out what datasets to publish since last full publish
//  - This code will delete all dps in target for data set and recopy
const modelMappingFn = require('../entities/mapping');
const Task = require('data.task');
const Async = require('control.async')(Task);
const when = require('when');
const R = require('ramda');
const shared = require('davis-shared');
const {toArray} = shared.array;
const {thread} = shared.fp;

module.exports = (db, storageConfig) => {

  const modelMapping = modelMappingFn(storageConfig);

  const publishEntities = (sourceSchema, targetSchema, types) => {

    const typesAsArray = toArray(types);
    const tableNames = typesAsArray.map(t => modelMapping[t].table);
    const fullyQualifiedTableNames = schema => tableNames.map(t => `${schema}.${t}`);

    return thread(
      db.raw(`truncate ${fullyQualifiedTableNames(targetSchema).join(',')} RESTART IDENTITY`)
        .then(() => when.all(R.reverse(tableNames).map(t =>
          db.raw(
          `insert into ${targetSchema}.${t}
           (select * from ${sourceSchema}.${t})`)))),
      Async.fromPromise,
      R.map(R.T)
    );
  };

  const publishFacts = (sourceSchema, targetSchema, dataSetIds) => {
    const tableName = 'facts';

    const dataSetIdsAsArray = toArray(dataSetIds);
    return thread(
      db(tableName).withSchema(targetSchema).where('data_set_id', 'in', dataSetIdsAsArray).del()
        .then(() => db.raw(
          `insert into ${targetSchema}.${tableName}
           (select * from ${sourceSchema}.${tableName} where data_set_id in (${dataSetIdsAsArray.join(',')}))`)),
      Async.fromPromise,
      R.map(R.T));
  };

  return {
    publishEntities,
    publishFacts
  };
};
