const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const {expect} = chai;

const Task = require('data.task');
const Async = require('control.async')(Task);
const when = require('when');
const task2Promise = Async.toPromise(when.promise);

const {dataSet} = require('davis-model');
const {thread} = require('davis-shared').fp;
const R = require('ramda');

const testConfig = require('../config.js'),
  knex = require('../../db/knex')(testConfig.db),
  sourceCatalog = testConfig.catalogs.source,
  targetCatalog = testConfig.catalogs.target,
  publish = require('../../src/publish/publish')(knex),
  entityStorage = require('../../src/entities/storage')(knex);

function readFacts(schema, dataSheet){
  return thread(
   knex('facts').withSchema(schema).where('data_set_id', '=', dataSheet)
     .orderBy('individual_id', 'asc')
     .orderBy('variable_id', 'asc'),
   Async.fromPromise);
}

describe('Sql Publish', function(){

  // Before the read tests are run migrations and seed the test database
  beforeEach(function(done){
    knex.migrate.latest()
     .then(function(){
       knex.seed.run()
         .then(function(){
           done();
         });
     });
  });

  it('should publish new dataset', function(){
    const publishResult = publish.publishEntities(
      sourceCatalog, 
      targetCatalog, 
      [dataSet.entityType]);
    const results = task2Promise(
      publishResult.chain(() => 
        entityStorage.query(targetCatalog, dataSet.entityType)));

    return when.all([
      expect(results).to.eventually.have.length(6),
      expect(results.then(r => r[5])).to.eventually.contain({
        id: 6
      })
    ]);
  });

  it('should publish full dataset', function(){
    const publishResult = publish.publishEntities(
      sourceCatalog, 
      targetCatalog, 
      [dataSet.entityType]);

    const results = task2Promise(
      publishResult.chain(() => 
        R.sequence(
          Task.of, 
          [
            entityStorage.query(sourceCatalog, dataSet.entityType),
            entityStorage.query(targetCatalog, dataSet.entityType)
          ])));

    return results.then(r =>
      expect(r[0][5]).to.deep.equal(r[1][5]));
  });

  it('should publish data', function(){
    const publishResult = publish.publishFacts(
      sourceCatalog, 
      targetCatalog, 
      [5]);

    const results = task2Promise(publishResult.chain(() => 
      R.sequence(
        Task.of,
        [
          readFacts(sourceCatalog, 5),
          readFacts(targetCatalog, 5)
        ])));

    return results.then(r =>
      expect(r[0]).to.deep.equal(r[1]));
  });

});
