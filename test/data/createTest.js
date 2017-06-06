const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const {expect} = require('chai');

const Task = require('data.task');
const Async = require('control.async')(Task);
const when = require('when');
const task2Promise = Async.toPromise(when.promise);

const {individual, fact} = require('davis-model');

const testConfig = require('../config.js');
const knex = require('../../db/knex')(testConfig.db);
const catalog = testConfig.catalogs.source;
const create = require('../../src/data/create')(knex);

const R = require('ramda');

function readFacts(dataSheet){
  return knex('facts').withSchema(catalog).where('data_set_id', '=', dataSheet)
      .orderBy('individual_id', 'asc')
      .orderBy('variable_id', 'asc')
      .then(R.map(R.evolve({value: v => !R.isNil(v)? +v : v})));
}

describe('Data Create', function(){

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

  it('should write a single individual', function(){
    const data = task2Promise(create(catalog, [
      individual.new(1, 1, [
        fact.newCategorical(9, 12),  // John
        fact.newQuantitative(10, 56) // 56 years old
      ])
    ]));

    const facts = data.then(() => readFacts(1));

    return when.all([
      expect(data).to.eventually.equal(1),
      expect(facts).to.eventually.have.length(2),
      expect(facts.then(results => results[0])).to.eventually.contain({
        individual_id: 1,
        variable_id: 9,
        attribute_id: 12,
        value: null
      }),
      expect(facts.then(results => results[1])).to.eventually.contain({
        individual_id: 1,
        variable_id: 10,
        attribute_id: null,
        value: 56
      })
    ]);
  });

  it('should write multiple individuals', function(){
    const data = task2Promise(create(catalog, [
      individual.new(1, 1, [
        fact.newCategorical(9, 12),  // John
        fact.newQuantitative(10, 56) // 56 years old
      ]),
      individual.new(2, 1, [
        fact.newCategorical(9, 13),  // Mary
        fact.newQuantitative(10, 25) // 25 years old
      ])
    ]));

    const facts = data.then(() => readFacts(1));

    return when.all([
      expect(data).to.eventually.equal(2),
      expect(facts).to.eventually.have.length(4),
      expect(facts.then(results => results[0])).to.eventually.contain({
        individual_id: 1,
        variable_id: 9,
        attribute_id: 12,
        value: null
      }),
      expect(facts.then(results => results[1])).to.eventually.contain({
        individual_id: 1,
        variable_id: 10,
        attribute_id: null,
        value: 56
      }),
      expect(facts.then(results => results[2])).to.eventually.contain({
        individual_id: 2,
        variable_id: 9,
        attribute_id: 13,
        value: null
      }),
      expect(facts.then(results => results[3])).to.eventually.contain({
        individual_id: 2,
        variable_id: 10,
        attribute_id: null,
        value: 25 
      })
    ]);
  });

  it('should write null for empty quantitative facts', function(){
    
    const individuals = [
      individual.new(1, 1, [
        fact.newCategorical(9, 12),  // John
        fact.newQuantitative(10, '') 
      ])
    ];
    
    const createdIndividuals = task2Promise(create(catalog, individuals));
    
    const results = createdIndividuals.then(() => readFacts(1));

    return when.all([
      expect(createdIndividuals).to.eventually.equal(1),
      expect(results).to.eventually.have.length(2),
      expect(results.then(r => r[1].value)).to.eventually.be.null
    ]);
  });

  it('should write null for non-numerical quantitative facts', function() {
    var individuals = [
      individual.new(1, 1, [
        fact.newCategorical(9, 12),  // John
        fact.newQuantitative(10, 'garbage')
      ])
    ];
    var createdIndividuals = task2Promise(create(catalog, individuals));

    var results = createdIndividuals.then(() => readFacts(1));

    return when.all([
      expect(createdIndividuals).to.eventually.equal(1),
      expect(results).to.eventually.have.length(2),
      expect(results.then(r => r[1].value)).to.eventually.be.null
    ]);
  });

});
