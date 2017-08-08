const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const {expect} = chai;

const Task = require('data.task');
const Async = require('control.async')(Task);
const when = require('when');
const task2Promise = Async.toPromise(when.promise);

const R = require('ramda');
const model = require('davis-model');
const {entity, attribute, variable, dataSet, folder, user} = model;
const querySort = model.query.sort;

const testConfig = require('../config.js'),
  knex = require('../../db/knex')(testConfig.db),
  catalog = testConfig.catalogs.source,
  entityStorage = require('../../src/entities/storage')(knex);

const testCreatedDate = new Date(2016,5,24,12,30,0,0),
  testModifiedDate = new Date(2016,5,25,10,25,4,20),
  dateProps = {
    created: testCreatedDate,
    modified: testModifiedDate
  };

describe('Read Methods', function(){

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

  it('should get all entities by type', function() {

    const folders = task2Promise(entityStorage.query(catalog, folder.entityType));
    
    return when.all([
      expect(folders).to.eventually.have.length(3),
      expect(when.map(folders, o => o.name)).to.eventually.deep.equal(['Demographics', 'Age', 'Cars'])
    ]);
  });

  it('should return rejected Task if bad entity type is requested', function(){
    const result = task2Promise(entityStorage.query(catalog, 'badEntity'));
    return expect(result).to.be.rejectedWith(/Bad Entity Type/);
  });

  it('should get multiple entites by id', function() {

    const dataSets = task2Promise(entityStorage.query(catalog, dataSet.entityType, ['in', 'id', [2, 4]]));

    return when.all([
      expect(dataSets).to.eventually.have.length(2),
      expect(when.map(dataSets, o => o.name)).to.eventually.deep.equal(['Population', 'Fuel Economy'])
    ]);
  });

  it('should get 0 entities with bad id', function(){
    const variables = task2Promise(entityStorage.query(catalog, variable.entityType, ['=', 'id', 5000]));

    return expect(variables).to.eventually.have.length(0);
  });

  it('should get only existing entities in list of ids', function(){
    const attributes = task2Promise(entityStorage.query(catalog, attribute.entityType, ['in', 'id', [5000,3,5,9888,9]]));
    return when.all([
      expect(attributes).to.eventually.have.length(3),
      expect(when.map(attributes, f => f.name)).to.eventually.deep.equal([
        'New York', 'Female', 'Civic'
      ])
    ]);
  });

  it('should get multiple entites by name', function(){
    const dataSets = task2Promise(entityStorage.query(catalog, dataSet.entityType, ['in', 'name', ['Fuel Economy', 'Population']]));
    return when.all([
      expect(dataSets).to.eventually.have.length(2),
      expect(when.map(dataSets, f => f.id)).to.eventually.deep.equal([2, 4])
    ]);
  });

  it('should get 2 entities with single name', function(){
    const variables = task2Promise(entityStorage.query(catalog, variable.entityType, ['=', 'name', 'Population Count']));
    return when.all([
      expect(variables).to.eventually.have.length(2),
      expect(when.map(variables, f => f.id)).to.eventually.deep.equal([
        3, 4
      ])
    ]);
  });

  it('should get 0 entities with bad name', function(){
    const variables = task2Promise(entityStorage.query(catalog, variable.entityType, ['=', 'name', 'Bad Name']));
    return expect(variables).to.eventually.have.length(0);
  });

  it('should get only existing entities in list of names', function(){
    const attributes = task2Promise(entityStorage.query(catalog, attribute.entityType, ['in', 'name', ['Bad', 'Honda', 'Female']]));
    return when.all([
      expect(attributes).to.eventually.have.length(2),
      expect(when.map(attributes, f => f.id)).to.eventually.deep.equal([5, 6])
    ]);
  });

  it('should get entites by multiple properties', function(){
    const variables = task2Promise(entityStorage.query(catalog, variable.entityType, ['and',
      ['=', 'name', 'Population Count'],
      ['in', 'scopedDataSet', [2, 3]]
    ]));
    return when.all([
      expect(variables).to.eventually.have.length(2),
      expect(when.map(variables, v => v.id)).to.eventually.deep.equal([3, 4])
    ]);
  });

  it('should use the > operator properly', function(){
    const dataSets = task2Promise(entityStorage.query(catalog, dataSet.entityType,
      ['>', 'modified', new Date(2016,7,25,0,0,0,0)]));
    return when.all([
      expect(dataSets).to.eventually.have.length(2),
      expect(when.map(dataSets, d => d.id)
        .then(d => d.sort())).to.eventually.deep.equal([5,6])
    ]);
  });

  it('should use the < operator properly', function(){
    const dataSets = task2Promise(entityStorage.query(catalog, dataSet.entityType, 
      ['<', 'id', 2]));
    return when.all([
      expect(dataSets).to.eventually.have.length(1),
      expect(when.map(dataSets, d => d.id)
        .then(d => d.sort())).to.eventually.deep.equal([1])
    ]);
  });

  it('should use the <= operator properly', function(){
    const dataSets = task2Promise(entityStorage.query(catalog, dataSet.entityType, 
      ['<=', 'id', 2]));
    return when.all([
      expect(dataSets).to.eventually.have.length(2),
      expect(when.map(dataSets, d => d.id)
        .then(d => d.sort())).to.eventually.deep.equal([1,2])
    ]);
  });

  it('should use the >= operator properly', function(){
    const dataSets = task2Promise(entityStorage.query(catalog, dataSet.entityType, 
      ['>=', 'id', 5]));
    return when.all([
      expect(dataSets).to.eventually.have.length(2),
      expect(when.map(dataSets, d => d.id)
        .then(d => d.sort())).to.eventually.deep.equal([5,6])
    ]);
  });

  it('should use the != operator properly', function(){
    const dataSets = task2Promise(entityStorage.query(catalog, dataSet.entityType, 
      ['!=', 'id', 6]));
    return when.all([
      expect(dataSets).to.eventually.have.length(5),
      expect(when.map(dataSets, d => d.id)
        .then(d => d.sort())).to.eventually.deep.equal([1,2,3,4,5])
    ]);
  });

  it('should use the notin operator properly', function(){
    const dataSets = task2Promise(entityStorage.query(catalog, dataSet.entityType, 
      ['notin', 'id', [5,6]]));
    return when.all([
      expect(dataSets).to.eventually.have.length(4),
      expect(when.map(dataSets, d => d.id)
        .then(d => d.sort())).to.eventually.deep.equal([1,2,3,4])
    ]);
  });

  it('should use the like operator properly', function(){
    const dataSets = task2Promise(entityStorage.query(catalog, dataSet.entityType, 
      ['like', 'name', '%Population%']));
    return when.all([
      expect(dataSets).to.eventually.have.length(2),
      expect(when.map(dataSets, d => d.id)
        .then(d => d.sort())).to.eventually.deep.equal([2,3])
    ]);
  });

  it('should use the nor logical operators properly', function(){
    const dataSets = task2Promise(entityStorage.query(catalog, dataSet.entityType, 
      ['nor',
        ['in', 'id', [1,2,3]],
        ['in', 'id', [5,6]]
      ]));
    return when.all([
      expect(dataSets).to.eventually.have.length(1),
      expect(when.map(dataSets, d => d.id)
        .then(d => d.sort())).to.eventually.deep.equal([4])
    ]);
  });

  it('should use the deep nesting of logical operators properly', function(){
    const dataSets = task2Promise(entityStorage.query(catalog, dataSet.entityType, 
      ['or',
        ['and',
          ['like', 'name', '%Population%'],
          ['like', 'name', '%Gender%']
        ],
        ['=', 'id', 5],
        ['not', ['<', 'id', 5]]
      ]));
    return when.all([
      expect(dataSets).to.eventually.have.length(3),
      expect(when.map(dataSets, d => d.id)
        .then(d => d.sort())).to.eventually.deep.equal([3,5,6])
    ]);
  });

  it('should sort ascending', function(){
    const dataSets = task2Promise(entityStorage.query(
      catalog,
      dataSet.entityType,
      [], // no query
      { sort: querySort.asc('name') }));

    return expect(dataSets.then(sets => sets.map(d => d.name))).to.eventually
      .deep.equal(['Fuel Economy', 'People', 'Population', 
        'Population by Gender', 'Published, changed', 'Un-published']);
  });

  it('should sort descending', function(){
    const dataSets = task2Promise(entityStorage.query(
      catalog,
      dataSet.entityType,
      [], // no query
      { sort: querySort.desc('name') }));

    return expect(dataSets.then(sets => sets.map(d => d.name))).to.eventually
      .deep.equal(['Un-published', 'Published, changed', 'Population by Gender',
        'Population', 'People', 'Fuel Economy']);
  });

  it('should take only some results', function(){
    const dataSets = task2Promise(entityStorage.query(
      catalog,
      dataSet.entityType,
      [], // no query
      { take: 2 }));

    return expect(dataSets.then(sets => sets.map(d => d.name))).to.eventually
      .deep.equal(['People', 'Population']);
  });

  it('should skip some results', function(){
    const dataSets = task2Promise(entityStorage.query(
      catalog,
      dataSet.entityType,
      [], // no query
      { skip: 4 }));

    return expect(dataSets.then(sets => sets.map(d => d.name))).to.eventually
      .deep.equal(['Published, changed', 'Un-published']);
  });

  it('should combine all options', function(){
    const dataSets = task2Promise(entityStorage.query(
      catalog,
      dataSet.entityType,
      ['>', 'id', 1], 
      { 
        sort: querySort.asc('name'),
        skip: 1,
        take: 2
      }));

    return expect(dataSets.then(sets => sets.map(d => d.name))).to.eventually
      .deep.equal(['Population', 'Population by Gender']);
  });
});

describe('Create Methods', function(){

  // Before the write tests 
  // run migrations and seed the test database
  beforeEach(function(done){
    knex.migrate.latest()
      .then(function(){
        knex.seed.run()
          .then(function(){
            done();
          });
      });
  });

  it('should reject for bad entity type', function(){
    const bogusEntity = entity.new('Bad Type', null, 'Foo');
    const result = task2Promise(entityStorage.create(catalog, [bogusEntity]));
    return expect(result).to.be.rejectedWith(/Bad Entity Type/);
  });

  it('should reject if id is set', function(){
    const f = folder.new(567, 'Foo Folders');
    const result = task2Promise(entityStorage.create(catalog, [f]));
    return expect(result).to.be.rejectedWith(/Database records must have empty id/);
  });

  it('should create single entity in proper table', function(){
    const entity = dataSet.new(null, 'My Data Set', dateProps);
    const results = task2Promise(entityStorage.create(catalog, [entity]));
    return when.all([
      expect(results).to.eventually.have.length(1),
      expect(results.then(R.head)).to.eventually.include({id: 7, name: 'My Data Set'})
    ]);
  });

  it('should create multiple entities in proper table', function(){
    const entities = [
      attribute.new(null, 'Ford', 5, dateProps),
      attribute.new(null, 'Mazda', 5, dateProps)
    ];

    const results = task2Promise(entityStorage.create(catalog, entities));
    return when.all([
      expect(results).to.eventually.have.length(2),

      expect(results.then(r => r[0])).to.eventually.include({id: 15, name: 'Ford', variable: 5}),
      expect(results.then(r => r[1])).to.eventually.include({id: 16, name: 'Mazda', variable: 5})
    ]);
  });

  it('should create multiple entities of different types in proper tables', function(){
    const entities = [
      variable.newCategorical(null, 'Year', dateProps),
      variable.newNumerical(null, 'Height', Object.assign({}, dateProps, {
        scopedDataSet: 1
      })),
      dataSet.new(null, 'Foo Set', Object.assign({}, dateProps, {
        folder: 2
      }))
    ];

    const results = task2Promise(entityStorage.create(catalog, entities));

    return when.all([
      expect(results).to.eventually.have.length(3),

      expect(results.then(r => r[0])).to.eventually.include({
        id: 13, 
        name: 'Year', 
        type: variable.types.categorical,
        scopedDataSet: null
      }),

      expect(results.then(r => r[1])).to.eventually.include({
        id: 14, 
        name: 'Height', 
        type: variable.types.numerical,
        scopedDataSet: 1
      }),

      expect(results.then(r => r[2])).to.eventually.include({
        id: 7, 
        name: 'Foo Set', 
        folder: 2
      })
    ]);
  });

  it('should reject when creating attribute with no variable id', function(){
    const attr = attribute.new(null, 'My Attribute', null);
    const result = task2Promise(entityStorage.create(catalog, [attr]));
    return expect(result).to.be.rejected;
  });
});

describe('Update Methods', function(){

  // Before the update tests 
  // run migrations and seed the test database
  beforeEach(function(done){
    knex.migrate.latest()
      .then(function(){
        knex.seed.run()
          .then(function(){
            done();
          });
      });
  });

  it('should reject for bad entity type', function(){
    const bogusEntity = entity.new('Bad Type', null, 'Foo');
    const result = task2Promise(entityStorage.update(catalog, [bogusEntity]));
    return expect(result).to.be.rejectedWith(/Bad Entity Type/);
  });

  it('should reject if id is not set', function(){
    const f = folder.new(null, 'Foo Folders');
    const result = task2Promise(entityStorage.update(catalog, [f])); 
    expect(result).to.be.rejectedWith(/Database records must not have empty id/);
  });

  it('should update single entity in proper table', function(){
    const entity = dataSet.new(2, 'Population - Updated');
    const results = task2Promise(entityStorage.update(catalog, [entity]));

    return when.all([
      expect(results).to.eventually.have.length(1),
      expect(results.then(R.head)).to.eventually.contain({id: 2, name: 'Population - Updated'})
    ]);
  });

  it('should update multiple entities in proper table', function(){
    const entities = [
      attribute.new(6, 'Honda - New', 5),
      attribute.new(7, 'Toyota - New', 5)
    ];

    const results = task2Promise(entityStorage.update(catalog, entities));
    
    return when.all([
      expect(results).to.eventually.have.length(2),

      expect(results.then(r => r[0])).to.eventually.contain({
        id: 6,
        name: 'Honda - New',
        variable: 5
      }),

      expect(results.then(r => r[1])).to.eventually.contain({
        id: 7,
        name: 'Toyota - New',
        variable: 5
      })
    ]);
  });

  it('should update multiple entities of different types in proper tables', function(){
    const entities = [
      variable.newCategorical(5, 'Vehicle Make - Updated'),
      variable.newNumerical(3, 'Population Count - Updated', {
        scopedDataSet: 2
      }),
      dataSet.new(4, 'Fuel Economy - Updated')
    ];

    const results = task2Promise(entityStorage.update(catalog, entities));

    return when.all([
      expect(results).to.eventually.have.length(3),

      expect(results.then(r => r[0])).to.eventually.contain({
        id: 5,
        name: 'Vehicle Make - Updated',
        entityType: variable.entityType,
        type: variable.types.categorical,
        scopedDataSet: null
      }),      

      expect(results.then(r => r[1])).to.eventually.contain({
        id: 3,
        name: 'Population Count - Updated',
        entityType: variable.entityType,
        type: variable.types.numerical,
        scopedDataSet: 2
      }),      

      expect(results.then(r => r[2])).to.eventually.contain({
        id: 4,
        name: 'Fuel Economy - Updated',
        entityType: dataSet.entityType,
        folder: null
      })
    ]);
  });
});

describe('Delete Methods', function(){

  // Before the update tests 
  // run migrations and seed the test database
  beforeEach(function(done){
    knex.migrate.latest()
      .then(function(){
        knex.seed.run()
          .then(function(){
            done();
          });
      });
  });

  it('should reject for bad entity type', function(){
    const result = task2Promise(entityStorage.delete(catalog, 'bogus', [45]));
    return expect(result).to.be.rejectedWith(/Bad Entity Type/);
  });

  it('should delete single entity in proper table', function(){
    
    const deleteResult = entityStorage.delete(catalog, folder.entityType, [3]);
    
    const folderQuery = task2Promise(deleteResult.chain(() => 
      entityStorage.query(catalog, folder.entityType, ['=', 'id', 3])));

    return when.all([
      expect(folderQuery).to.eventually.have.length(0)
    ]);
  });

  it('should delete multiple entities in proper table', function(){
    
    const deleteResult = entityStorage.delete(catalog, attribute.entityType, [8, 9, 10, 11]);

    const attributeQuery = task2Promise(
      deleteResult.chain(() => 
        entityStorage.query(catalog, attribute.entityType, ['in', 'id', [8, 9, 10, 11]])));

    return expect(attributeQuery).to.eventually.have.length(0);
  });

  it('should ignore bad ids on delete', function(){
    
    const deleteResult = entityStorage.delete(catalog, attribute.entityType, ['', 8, null, 9, 56.7, {}]);

    const attributeQuery = task2Promise(
      deleteResult.chain(() => 
        entityStorage.query(catalog, attribute.entityType, ['in', 'id', [8, 9]])));

    return expect(attributeQuery).to.eventually.have.length(0);
  });
});

describe('Property tests', function(){

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

  describe('User', function(){

    let goodUser = user.new(null, 'Mr. Jones', 'jones@example.com', dateProps);

    goodUser = user.setPassword('myPassword123', goodUser);

    it('should map the user correctly on insert and read', function(){
      
      const results = entityStorage.create(catalog, [goodUser]);
      
      const users = task2Promise(
        results.chain(() => 
          entityStorage.query(catalog, user.entityType, ['=', 'name', 'Mr. Jones'])));
      
      return when.all([
        expect(users).to.eventually.have.length(1),
        expect(users.then(R.head)).to.eventually.contain({
          name: 'Mr. Jones',
          email: 'jones@example.com'
        }),
        expect(users.then(R.head).then(user.comparePassword('myPassword123'))).to.eventually.be.true
      ]);
    });
  });

  describe('Data Set', function(){

    const schema = [
      {
        variable: 5,
        attributes: [1,2,3]
      }
    ];

    const setWithSchema = dataSet.new(null, 'Set With Schema', Object.assign({}, dateProps, {
        schema
      })),
      setWithoutSchema = dataSet.new(null, 'Set Without Schema', dateProps);

    it('should set and retrieve the valid schema', function(){
      const results = entityStorage.create(catalog, [setWithSchema]);
      const dataSets = task2Promise(
        results.chain(() => 
          entityStorage.query(catalog, dataSet.entityType, ['=', 'name', 'Set With Schema'])));

      return when.all([
        expect(dataSets).to.eventually.have.length(1),
        expect(dataSets.then(R.head)).to.eventually.have.property('schema').that.deep.equals(schema)
      ]);
    });

    it('should set and retrieve null schema', function(){
      const results = entityStorage.create(catalog, [setWithoutSchema]);
      const dataSets = task2Promise(
        results.chain(() => 
          entityStorage.query(catalog, dataSet.entityType, ['=', 'name', 'Set Without Schema'])));
      
      return when.all([
        expect(dataSets).to.eventually.have.length(1),
        expect(dataSets.then(R.head)).to.eventually.have.property('schema').that.is.null
      ]);
    });      
  });

  describe('Variable', function(){

    const format = [
      {
        type: 'percent',
        options: {foo: 'bar'}
      }
    ];

    const varWithFormat = variable.newNumerical(null, 'Var. With Format', Object.assign({}, {
        format: format
      }, dateProps)),
      varWithoutFormat = variable.newNumerical(null, 'Var. Without Format', dateProps);

    it('should set and retrieve the valid format', function(){
      const results = entityStorage.create(catalog, [varWithFormat]);
      const variables = task2Promise(
        results.chain(() =>
          entityStorage.query(catalog, variable.entityType, ['=', 'name', 'Var. With Format'])));

      return when.all([
        expect(variables).to.eventually.have.length(1),
        expect(variables.then(R.head)).to.eventually.have.property('format').that.deep.equals(format)
      ]);
    });

    it('should set and retrieve null format', function(){
      const results = entityStorage.create(catalog, [varWithoutFormat]);
      const variables = task2Promise(
        results.chain(() =>
          entityStorage.query(catalog, variable.entityType, ['=', 'name', 'Var. Without Format'])));
            
      return when.all([
        expect(variables).to.eventually.have.length(1),
        expect(variables.then(R.head)).to.eventually.have.property('format').that.is.null
      ]);
    });
  });
});
