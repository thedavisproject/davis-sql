const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const {expect} = require('chai');

const Task = require('data.task');
const Async = require('control.async')(Task);
const when = require('when');
const task2Promise = Async.toPromise(when.promise);

const {variable} = require('davis-model');
const R = require('ramda');

const testConfig = require('../config.js'),
  knex = require('../../db/knex')(testConfig.db),
  catalog = testConfig.catalogs.source,
  query = require('../../src/data/query')(knex);

describe('Data Query', function(){

  // Before the read tests are run migrations and seed the test database
  before(function(done){
    knex.migrate.latest()
      .then(function(){
        knex.seed.run()
          .then(function(){
            done();
          });
      });
  });

  // Get all data for massachusetts
  const maFilter = [
    { variable: 1, attributes: [2], type: variable.types.categorical }
  ];

  const hondaFilter = [
    { variable: 5, attributes: [6], type: variable.types.categorical }
  ];

  const hondaCivicFilter = [
    hondaFilter[0],
    { variable: 6, attributes: [9], type: variable.types.categorical }
  ];

  it('should return data for all data sets when no data set filter is applied', function(){
    const results = query(catalog, maFilter);
    const dataSetIds = results.map(
      R.pipe(
        R.map(R.prop('dataSet')), 
        R.uniq));

    return expect(task2Promise(dataSetIds)).to.eventually.deep.equal([2,3,5]);
  });

  it('should return 1 data set for single attribute for Honda', function(){
    const results = query(catalog, hondaFilter);
    const dataSetIds = results.map(
      R.pipe(
        R.map(R.prop('dataSet')), 
        R.uniq));

    return expect(task2Promise(dataSetIds)).to.eventually.deep.equal([4]);
  });

  it('should filter by empty attributes', function(){
    const results = query(catalog, [
      { variable: 5, attributes: [7], type: variable.types.categorical },
      { variable: 6, attributes: [], type: variable.types.categorical }
    ]);

    const dataSetIds = results.map(R.pipe(
        R.map(R.prop('dataSet')),
        R.uniq));

    return expect(task2Promise(dataSetIds)).to.eventually.deep.equal([4]);
  });

  it('should return empty values', function(){
    const results = query(catalog, [
      { variable: 5, attributes: [7], type: variable.types.categorical },
      { variable: 6, attributes: [], type: variable.types.categorical }
    ]);
    
    return expect(task2Promise(results).then(r => r[0].facts[3].value)).to.eventually.be.Null;
  });

  it('should filter by data set', function(){
    const results = query(catalog, maFilter, 3);
    
    const dataSetIds = results.map(R.pipe(
      R.map(R.prop('dataSet')),
      R.uniq));

    return expect(task2Promise(dataSetIds)).to.eventually.deep.equal([3]);
  });

  it('should filter by quantitative set: <', function(){
    const results = query(catalog, [{
      variable: 7, // Horsepower
      type: variable.types.quantitative,
      value: 122,
      comparator: '<'
    }], 4);

    const resultsP = task2Promise(results);

    return when.all([
      expect(resultsP.then(r => r[0].facts)).to.eventually.have.length(4),
      expect(resultsP.then(r => r[0].facts[0])).to.eventually.contain({
        variable: 5,
        attribute: 6
      }),
      expect(resultsP.then(r => r[0].facts[1])).to.eventually.contain({
        variable: 6,
        attribute: 8
      }),
      expect(resultsP.then(r => r[0].facts[2])).to.eventually.contain({
        variable: 7,
        value: 120
      }),
      expect(resultsP.then(r => r[0].facts[3])).to.eventually.contain({
        variable: 8,
        value: 33
      })
    ]);
  });

  it('should filter by quantitative set: >', function(){
    const results = task2Promise(query(catalog, [{
      variable: 7, // Horsepower
      type: variable.types.quantitative,
      value: 170,
      comparator: '>'
    }], 4));

    return when.all([
      expect(results.then(r => r[0].facts)).to.eventually.have.length(4),
      expect(results.then(r => r[0].facts[0])).to.eventually.contain({
        variable: 5,
        attribute: 7
      }),
      expect(results.then(r => r[0].facts[1])).to.eventually.contain({
        variable: 6,
        attribute: 11
      }),
      expect(results.then(r => r[0].facts[2])).to.eventually.contain({
        variable: 7,
        value: 180
      }),
      expect(results.then(r => r[0].facts[3])).to.eventually.contain({
        variable: 8,
        value: 31
      })
    ]);
  });

  it('should filter by quantitative set: =', function(){
    const results = task2Promise(query(catalog, [{
      variable: 7, // Horsepower
      type: variable.types.quantitative,
      value: 130,
      comparator: '='
    }], 4));

    return when.all([
      expect(results.then(r => r[0].facts)).to.eventually.have.length(4),
      expect(results.then(r => r[0].facts[0])).to.eventually.contain({
        variable: 5,
        attribute: 6
      }),
      expect(results.then(r => r[0].facts[1])).to.eventually.contain({
        variable: 6,
        attribute: 9
      }),
      expect(results.then(r => r[0].facts[2])).to.eventually.contain({
        variable: 7,
        value: 130
      }),
      expect(results.then(r => r[0].facts[3])).to.eventually.contain({
        variable: 8,
        value: 37
      })
    ]);
  });

  it('should filter by quantitative set: <=', function(){
    const results = task2Promise(query(catalog, [{
      variable: 7, // Horsepower
      type: variable.types.quantitative,
      value: 130,
      comparator: '<='
    }], 4));

    return expect(results).to.eventually.have.length(3);
  });

  it('should filter by quantitative set: >=', function(){
    const results = task2Promise(query(catalog, [{
      variable: 7, // Horsepower
      type: variable.types.quantitative,
      value: 130,
      comparator: '>='
    }], 4));

    return expect(results).to.eventually.have.length(3);
  });

  it('should error for bad comparator', function(){
    const results = task2Promise(query(catalog, [{
      variable: 7, // Horsepower
      type: variable.types.quantitative,
      value: 130,
      comparator: '???'
    }], 4));

    return expect(results).to.be.rejectedWith(/Unsupported quantitative comparator/);
  });

  it('should return data points', function(){
    const results = task2Promise(query(catalog, hondaFilter));

    return when.all([
      expect(results).to.eventually.have.length(2),

      expect(results.then(r => r[0].facts)).to.eventually.have.length(4),
      expect(results.then(r => r[0].facts[0].variable)).to.eventually.equal(5),
      expect(results.then(r => r[0].facts[0].attribute)).to.eventually.equal(6),
      expect(results.then(r => r[0].facts[1].variable)).to.eventually.equal(6),
      expect(results.then(r => r[0].facts[1].attribute)).to.eventually.equal(8),
      expect(results.then(r => r[0].facts[2].variable)).to.eventually.equal(7),
      expect(results.then(r => r[0].facts[2].value)).to.eventually.equal(120),
      expect(results.then(r => r[0].facts[3].variable)).to.eventually.equal(8),
      expect(results.then(r => r[0].facts[3].value)).to.eventually.equal(33),

      expect(results.then(r => r[1].facts)).to.eventually.have.length(4),
      expect(results.then(r => r[1].facts[0].variable)).to.eventually.equal(5),
      expect(results.then(r => r[1].facts[0].attribute)).to.eventually.equal(6),
      expect(results.then(r => r[1].facts[1].variable)).to.eventually.equal(6),
      expect(results.then(r => r[1].facts[1].attribute)).to.eventually.equal(9),
      expect(results.then(r => r[1].facts[2].variable)).to.eventually.equal(7),
      expect(results.then(r => r[1].facts[2].value)).to.eventually.equal(130),
      expect(results.then(r => r[1].facts[3].variable)).to.eventually.equal(8),
      expect(results.then(r => r[1].facts[3].value)).to.eventually.equal(37)
    ]);
  });

  it('should filter by 2 variables', function(){
    const results = task2Promise(query(catalog, hondaCivicFilter));

    return when.all([
      expect(results).to.eventually.have.length(1),
      expect(results.then(r => r[0].facts)).to.eventually.have.length(4),
      expect(results.then(r => r[0].facts[0].variable)).to.eventually.equal(5),
      expect(results.then(r => r[0].facts[0].attribute)).to.eventually.equal(6),
      expect(results.then(r => r[0].facts[1].variable)).to.eventually.equal(6),
      expect(results.then(r => r[0].facts[1].attribute)).to.eventually.equal(9),
      expect(results.then(r => r[0].facts[2].variable)).to.eventually.equal(7),
      expect(results.then(r => r[0].facts[2].value)).to.eventually.equal(130),
      expect(results.then(r => r[0].facts[3].variable)).to.eventually.equal(8),
      expect(results.then(r => r[0].facts[3].value)).to.eventually.equal(37)
    ]);
  });
});
