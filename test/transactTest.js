const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const {expect} = chai;

const Task = require('data.task');
const Async = require('control.async')(Task);
const when = require('when');
const task2Promise = Async.toPromise(when.promise);

const {variable} = require('davis-model');
const R = require('ramda');

const testConfig = require('./config.js'),
  knex = require('../db/knex')(testConfig.db),
  catalog = testConfig.catalogs.source,
  transact = require('../src/transact')(knex),
  entities = require('../src/entities/storage')(knex);

const testCreatedDate = new Date(2016,5,24,12,30,0,0),
  testModifiedDate = new Date(2016,5,25,10,25,4,20),
  dateProps = {
    created: testCreatedDate,
    modified: testModifiedDate
  };

describe('Transact', function(){

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

  it('should immediately invoke the scoped transaction function with the correct API', function(done){

    const resultIgnored = task2Promise(transact(function(storage, commit, rollbackIgnored){
      try {
        expect(storage).to.have.keys(['entities', 'publish', 'data', 'transact']);
        expect(storage.entities).to.have.keys(['query', 'create', 'update', 'delete']);
        expect(storage.data).to.have.keys(['query', 'create', 'delete']);
        done();
      } catch(e){
        done(e);
      }
      commit();
    }));

  });

  it('should commit the transaction', function(){

    const newVariable1 = variable.newCategorical(null, 'My New Variable 1', dateProps),
      newVariable2 = variable.newCategorical(null, 'My New Variable 2', dateProps);

    const result = task2Promise(transact(function(storage, commit, rollback){
      
      const insertTask = R.sequence(Task.of, [
        storage.entities.create(catalog, [newVariable1]),
        storage.entities.create(catalog, [newVariable2])
      ]).map(R.flatten);

      insertTask.fork(() => {
        rollback();
      }, () => {
        commit();
      });
    }));

    const checkInsert = result.then(() => task2Promise(
      entities.query(catalog, variable.entityType, ['in', 'id', [13,14]])));

    return when.all([
      expect(result).to.eventually.be.fulfilled,
      expect(checkInsert).to.eventually.have.length(2),
      expect(checkInsert.then(r => r.map(v => v.name))).to.eventually.deep.equal([
        'My New Variable 1',
        'My New Variable 2'
      ])
    ]);

  });

  it('should rollback the transaction', function(){

    const newVariable1 = variable.newCategorical(null, 'My New Variable 1', dateProps),
      newVariable2 = variable.newCategorical(null, 'My New Variable 2', dateProps);

    const result = task2Promise(transact(function(storage, commit, rollback){
      
      const insertTask = R.sequence(Task.of, [
        storage.entities.create(catalog, [newVariable1]),
        storage.entities.create(catalog, [newVariable2])
      ]).map(R.flatten);

      insertTask.fork(() => {
      }, () => {
        rollback(); // rollback after the insert is done
      });

    }));

    const checkInsert = result.catch(() => task2Promise(
      entities.query(catalog, variable.entityType, ['in', 'id', [13,14]])));

    return when.all([
      expect(result).to.eventually.be.rejected,
      expect(checkInsert).to.eventually.have.length(0)
    ]);

  });

  it('should correctly bubble up inner commits -- manual case', function(){

    const newVariable1 = variable.newCategorical(null, 'My New Variable 1', dateProps);

    const result = task2Promise(transact(function(storage, commit, rollback){
      
      const innerTrx = storage.transact(function(storageInner, commitInner){
        const innerInsertTask = storageInner.entities.create(catalog, [newVariable1]);

        innerInsertTask.fork(() => {
        }, () => {
          commitInner(); // commit after the insert is done
        });
      });

      innerTrx.fork(() => {
        rollback(); // manually hook up rollback/commit from inner trx
      }, () => {
        commit();
      });
    }));

    const checkInsert = result.then(() => task2Promise(
      entities.query(catalog, variable.entityType, ['in', 'id', [13]])));

    return when.all([
      expect(result).to.eventually.be.fulfilled,
      expect(checkInsert).to.eventually.have.length(1),
      expect(checkInsert.then(r => r.map(v => v.name))).to.eventually.deep.equal([
        'My New Variable 1'
      ])
    ]);
  });

  it('should correctly bubble up inner rollbacks -- manual case', function(){

    const newVariable1 = variable.newCategorical(null, 'My New Variable 1', dateProps);

    const result = task2Promise(transact(function(storage, commit, rollback){
      
      const innerTrx = storage.transact(function(storageInner, commitInner, rollbackInner){
        const innerInsertTask = storageInner.entities.create(catalog, [newVariable1]);

        innerInsertTask.fork(() => {
        }, () => {
          rollbackInner(); // rollback after the insert is done
        });
      });

      innerTrx.fork(() => {rollback();}, () => {commit();});
    }));

    const checkInsert = result.catch(() => task2Promise(
      entities.query(catalog, variable.entityType, ['in', 'id', [13]])));

    return when.all([
      expect(result).to.eventually.be.rejected,
      expect(checkInsert).to.eventually.have.length(0)
    ]);
  });

  it('should rollback inner transactions if outer transactions are rolled back - manual case', function(){

    const newVariable1 = variable.newCategorical(null, 'My New Variable 1', dateProps);

    const result = task2Promise(transact(function(storage, commit, rollback){
      
      const innerTrx = storage.transact(function(storageInner, commitInner, rollbackInnerIgnored){
        const innerInsertTask = storageInner.entities.create(catalog, [newVariable1]);

        innerInsertTask.fork(() => {
        }, () => {
          commitInner(); // Commit the inner transaction
        });
      });

      innerTrx.fork(() => {
      }, () => {
        rollback(); // rollback the outer transaction
      });
    }));

    const checkInsert = result.catch(() => task2Promise(
      entities.query(catalog, variable.entityType, ['in', 'id', [13]])));

    return when.all([
      expect(result).to.eventually.be.rejected,
      expect(checkInsert).to.eventually.have.length(0)
    ]);
  });

  it('should correctly roll up inner commits -- auto (Task) case', function(){

    const newVariable1 = variable.newCategorical(null, 'My New Variable 1', dateProps);

    const result = task2Promise(transact(function(storage){
      
      return storage.transact(function(storageInner){
        return storageInner.entities.create(catalog, [newVariable1]);
      });

    }));

    const checkInsert = result.catch(() => task2Promise(
      entities.query(catalog, variable.entityType, ['in', 'id', [13]])));

    return when.all([
      expect(result).to.eventually.be.fulfilled,
      expect(checkInsert).to.eventually.have.length(1),
      expect(checkInsert.then(r => r.map(v => v.name))).to.eventually.deep.equal([
        'My New Variable 1'
      ])
    ]);
  });

  it('should rollback inner transactions if inner transactions return a rejected task', function(){

    const newVariable1 = variable.newCategorical(null, 'My New Variable 1', dateProps);

    const result = task2Promise(transact(function(storage){
      
      return storage.transact(function(storageInner){
        return storageInner.entities.create(catalog, [newVariable1])
          .chain(() => Task.rejected()); 
      });

    }));

    const checkInsert = result.catch(() => task2Promise(
      entities.query(catalog, variable.entityType, ['in', 'id', [13]])));

    return when.all([
      expect(result).to.eventually.be.rejected,
      expect(checkInsert).to.eventually.have.length(0)
    ]);
  });

  it('should rollback inner transactions if outer transactions return a rejected task', function(){

    const newVariable1 = variable.newCategorical(null, 'My New Variable 1', dateProps);

    const result = task2Promise(transact(function(storage){
      
      return storage.transact(function(storageInner){
        return storageInner.entities.create(catalog, [newVariable1]);
      }).chain(() => Task.rejected());

    }));

    const checkInsert = result.catch(() => task2Promise(
      entities.query(catalog, variable.entityType, ['in', 'id', [13]])));

    return when.all([
      expect(result).to.eventually.be.rejected,
      expect(checkInsert).to.eventually.have.length(0)
    ]);
  });

  it('should rollback outer transactions if inner transactions return rejected task', function(){

    const newVariable1 = variable.newCategorical(null, 'My New Variable 1', dateProps);

    const result = task2Promise(transact(function(storage){
      
      return storage.entities.create(catalog, [newVariable1])
        .chain(() => storage.transact(function(){
          return Task.rejected();
        }));

    }));

    const checkInsert = result.catch(() => task2Promise(
      entities.query(catalog, variable.entityType, ['in', 'id', [13]])));

    return when.all([
      expect(result).to.eventually.be.rejected,
      expect(checkInsert).to.eventually.have.length(0)
    ]);
  });

  it('should timeout if rollback or commit are not called', function(){

    const newVariable1 = variable.newCategorical(null, 'My New Variable 1', dateProps);

    const result = task2Promise(transact(function(storage, commit, rollback){
      
      const insertTask = storage.entities.create(catalog, [newVariable1]);

      // Wait to kick this off until after the timeout
      setTimeout(function(){
        insertTask.fork(() => {
          rollback();
        }, () => {
          commit();
        });
      }, 500);

    }, 50));

    const checkInsert = result.catch(() => task2Promise(
      entities.query(catalog, variable.entityType, ['=', 'id', 13])));

    return when.all([
      expect(result).to.eventually.be.rejectedWith(/A transaction timeout occurred/),
      expect(checkInsert).to.eventually.have.length(0)
    ]);

  });

  it('should fail when rollback is manually called', function(){
    
    const results = task2Promise(transact(function(storage, commit, rollback){
      rollback('Failure');
    }));

    return expect(results).to.eventually.be.rejectedWith('Failure');
  });

  it('should resolve when commit is manually called', function(){
    
    const results = task2Promise(transact(function(storage, commit, rollbackIgnored){
      commit();
    }));

    return expect(results).to.eventually.be.fulfilled;
  });
  
  describe('should recognize Task returned', function(){ 

    it('and bubble up task error', function(){
      const result = task2Promise(transact(() => Task.rejected('error')));
      return expect(result).to.eventually.be.rejectedWith('error');
    });
    
    it('and bubble up task success', function(){
      const result = task2Promise(transact(() => Task.of('success')));
      return expect(result).to.eventually.be.fulfilled;
    });

    it('and rollback the transaction on the task error branch', function(){

      const newVariable1 = variable.newCategorical(null, 'My New Variable 1', dateProps);

      // Chain an insert with an error task
      const result = task2Promise(transact((storage) => 
        storage.entities.create(catalog, [newVariable1])
          .chain(() => Task.rejected('Some Error'))));

      const checkNoInsertHappened = result.catch(() => task2Promise(
        entities.query(catalog, variable.entityType, ['=', 'id', 13])));

      return when.all([
        expect(result).to.eventually.be.rejectedWith(/Some Error/),
        expect(checkNoInsertHappened).to.eventually.have.length(0)
      ]);
    });
  
    it('and commit the transaction on the task success branch', function(){

      const newVariable1 = variable.newCategorical(null, 'My New Variable 1', dateProps);

      // Chain an insert with an error task
      const result = task2Promise(transact((storage) => 
        storage.entities.create(catalog, [newVariable1])));

      const checkInsertHappened = result.then(() => task2Promise(
        entities.query(catalog, variable.entityType, ['=', 'id', 13])));

      return when.all([
        expect(result).to.eventually.be.fulfilled,
        expect(checkInsertHappened).to.eventually.have.length(1)
      ]);
    });
  });
});
