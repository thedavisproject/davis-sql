const R = require('ramda');
const Task = require('data.task');
const Either = require('data.either');
const Async = require('control.async')(Task);
const shared = require('davis-shared');
const {thread, either2Task} = shared.fp;
const model = require('davis-model');
const modelMapping = require('./mapping');
const queryParser = require('./queryParser');
const querySort = model.query.sort;
const {validateEmptyIds, validateNoEmptyIds} = require('../util');

module.exports = db => {

  const validateEntityType = (entityType) => {
    if(!modelMapping[entityType]){
      return Either.Left(`Bad Entity Type: ${entityType}. Must be of type ${R.keys(modelMapping).join(', ')}`);
    }
    return Either.Right(entityType);
  };

  const queryEntities = (entityType, query) => {

    // Returns Either
    const tableConfig = validateEntityType(entityType)
      .map(eType => modelMapping[eType]);

    // Takes config (either) and returns a Task Wrapped in an Either
    const buildQuery = R.lift(config => 
      thread(
        db(config.table),
        query,
        Async.fromPromise,
        R.map(R.map(config.buildEntity))));

    return thread(
      buildQuery(tableConfig),
      either2Task, // Convert the outer Either wrapper to a Task
      R.chain(R.identity)); // Flatten the Task stack
  };

  const insertEntities = (catalog, entityType, entities) => {

    // Returns Either
    const tableConfig = validateEntityType(entityType)
      .map(eType => modelMapping[eType]);

    // Returns Either
    const records = tableConfig
      .chain(config => thread(
        validateEmptyIds(entities),
        R.chain(
          // Build record for each entity, convert [Either(record)] into 
          // Either([record])
          R.traverse(Either.of, config.buildRecord))));

    // Takes config, recs (eithers) and returns a Task Wrapped in an Either
    const buildQuery = R.lift((config, recs) => 
      thread(
        db(config.table),
        t => t.withSchema(catalog).returning('id').insert(recs),
        Async.fromPromise,
        R.chain(queryById(catalog, entityType))));

    return thread(
      buildQuery(tableConfig, records),
      either2Task, // Convert the outer Either wrapper to a Task
      R.chain(R.identity)); // Flatten the Task stack
  };

  const updateEntity = R.curry((catalog, entity) => {

    // Returns Either
    const tableConfig = validateEntityType(entity.entityType)
      .map(eType => modelMapping[eType]);

    // Returns Either
    const record = tableConfig
      .chain(config => thread(
        validateNoEmptyIds([entity]),
        R.chain(() => config.buildRecord(entity))));

    // Takes config, rec (eithers) and returns a Task Wrapped in an Either
    const buildQuery = R.lift((config, rec) =>
      thread(
        db(config.table),
        t => t.withSchema(catalog).returning('id')
          .where('id', entity.id)
          .update(rec),
        Async.fromPromise,
        R.chain(queryById(catalog, entity.entityType))));

    return thread(
      buildQuery(tableConfig, record),
      either2Task, // Convert the outer Either wrapper to a Task
      R.chain(R.identity)); // Flatten the Task stack
  });

  const deleteEntities = (catalog, entityType, ids) => {

    const idArray = ids.filter(model.entity.isValidId);

    // Returns Either
    const tableConfig = validateEntityType(entityType)
      .map(eType => modelMapping[eType]);

    // Takes config (either) and returns a Task Wrapped in an Either
    const buildQuery = R.lift(config => 
      thread(
        db(config.table),
        t => t.withSchema(catalog).whereIn('id', idArray).del(),
        Async.fromPromise));

    return thread(
      buildQuery(tableConfig),
      either2Task, // Convert the outer Either wrapper to a Task
      R.chain(R.identity)); // Flatten the Task stack
  };

  const query = (catalog, entityType, query = [], options = {}) => {
    return thread(
      validateEntityType(entityType),
      either2Task,
      R.chain(validatedType => {

        const mapping = modelMapping[validatedType];

        const addQueryOptions = q => {
          if(options.sort){
            const mappedSortProperty = queryParser.mapProperty(mapping.propertyMappings, options.sort.property);
            q.orderBy(mappedSortProperty, options.sort.direction === querySort.direction.descending ? 'desc' : 'asc');
          }
          if(options.take){
            q.limit(options.take);
          }
          if(options.skip){
            q.offset(options.skip);
          }
          return q;
        };

        if(!query || query.length === 0){
          return queryEntities(
            validatedType, 
            t => addQueryOptions(t.withSchema(catalog).select()));
        }

        return thread(
          model.query.validate(query),
          R.chain(queryParser.preProcessExpression(mapping.propertyMappings)),
          either2Task,
          R.chain(q => queryEntities(
            validatedType,
            t => queryParser.buildKnexQuery(
              q,
              addQueryOptions(t.withSchema(catalog).select())))));
      }));
  };
  
  const queryById = R.curry((catalog, entityType, ids) => 
    query(catalog, entityType, model.query.build.in('id', ids)));

  const create = (catalog, entities) => thread(
    entities,
    R.groupBy(R.prop('entityType')),
    R.toPairs,
    R.map(([key, value]) => insertEntities(catalog, key, value)),
    R.sequence(Task.of), // Convert array of tasks to task of arrays
    R.map(R.flatten)); // Flatten inner array

  const update = (catalog, entities) => thread(
    entities,
    R.map(updateEntity(catalog)),
    R.sequence(Task.of), // Convert array of tasks to task of arrays
    R.map(R.flatten)); // Flatten inner array

  return {
    query,
    create,
    update,
    delete: deleteEntities
  };
};
