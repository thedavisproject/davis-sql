const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const {expect} = require('chai');

const Task = require('data.task');
const Async = require('control.async')(Task);
const when = require('when');
const task2Promise = Async.toPromise(when.promise);

const testConfig = require('../config.js'),
  knex = require('../../db/knex')(testConfig.knex),
  catalog = testConfig.catalogs.source,
  del = require('../../src/data/delete')(knex, testConfig);

function readFacts(dataSet, variable, attribute){
  const query = knex('facts').withSchema(catalog);

  if(dataSet){
    query.where('data_set_id', '=', dataSet);
  }
  if(variable){
    query.where('variable_id', '=', variable);
  }
  if(attribute){
    query.where('attribute_id', '=', attribute);
  }

  query
    .orderBy('individual_id', 'asc')
    .orderBy('variable_id', 'asc');

  return query;
}

describe('Data Delete', function(){

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

  it('should clear facts table when passed a data set id', function(){
    const deleteSuccess = task2Promise(del(catalog, {dataSet: 2}));
    const results = deleteSuccess.then(() => readFacts(2));
    return expect(results).to.eventually.have.length(0);
  });

  it('should clear facts table when passed a variable id', function(){
    const deleteSuccess = task2Promise(del(catalog, {variable: 2}));
    const results = deleteSuccess.then(() => readFacts(null, 2));
    return expect(results).to.eventually.have.length(0);
  });

  it('should clear facts table when passed an attribute id', function(){
    const deleteSuccess = task2Promise(del(catalog, {attribute: 2}));
    const results = deleteSuccess.then(() => readFacts(null, null, 2));
    return expect(results).to.eventually.have.length(0);
  });

  it('safeguard against deleting all data when no params are passed in', function(){
    const results = task2Promise(del(catalog, {}));
    return expect(results).to.be.rejectedWith(/No parameters provided/);
  });
});
