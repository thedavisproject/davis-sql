const R = require('ramda');
const Task = require('data.task');
const baseApi = require('./api');

// transactionScopedFn takes 3 args: storageApi, commit, rollback
//   commit and rollback are optional. If they are not supplied, the 
//   fn is expected to return a Task, which will commit on success
//   or rollback on failure.
//   If a task is returned AND commit/rollback are used, the following events
//   will be observed (which ever happens first, the rest will be ignored)
//      a) Task is rejected (rollback is called)
//      b) Task is fulfilled (commit is called)
//      c) rollback is manually called
//      d) commit is manually called
function createTransaction(
  trxFn,
  timeout,
  reject,
  resolve,
  rollback,
  commit,
  dbTrx) {

  let transactionFinished = false;

  const wait = setTimeout(function(){
    if(transactionFinished){
      return;
    }
    // TODO: Log this
    rollback();
    transactionFinished = true;
    reject(`A transaction timeout occurred after ${timeout} ms`);
  }, timeout);

  const success = result => {
    if(transactionFinished){
      return;
    }
    clearTimeout(wait);
    commit();
    transactionFinished = true;
    resolve(result);
  };

  const fail = error => {
    if(transactionFinished){
      return;
    }
    clearTimeout(wait);
    rollback();
    transactionFinished = true;
    reject(error || 'An unspecified error occurred');
  };

  const transactBaseApi = baseApi(dbTrx);
  
  // Create a new transaction scope that just passes through the original 
  // Knex transaction object. This allows for composing multiple small transactions
  // into a large transaction. Each inner transaction will just roll up to the 
  // outer transaction.
  const transactPassThrough = (transactionScopedFn, timeout = 10000) => {
    return new Task((reject, resolve) => {
      createTransaction(
        transactionScopedFn,
        timeout,
        reject,
        resolve,
        () => {}, // Do nothing on rollback for inner transaction. This must be handled at the next level up
        () => {}, // Do nothing on commit for inner transaction. This must be handled at the next level up
        dbTrx);
    });
  };

  const trxApi = Object.assign({}, transactBaseApi, {
    // Provide a transact method, but it does not open a new transaction
    // it reuses the current transaction
    transact: transactPassThrough
  });

  const result = trxFn(
    trxApi,
    success,
    fail
  );

  // If the fn returns a Task, fork it and pass through results to the outer Task
  if(!R.isNil(result) && result.constructor.name === 'Task'){
    result.fork(fail, success);          
  }

}

module.exports = db => (transactionScopedFn, timeout = 10000) => {

  return new Task((reject, resolve) => {
    
    db.transaction(trx => 
      createTransaction(
        transactionScopedFn, 
        timeout,
        reject,
        resolve,
        trx.rollback,
        trx.commit,
        trx))
    // Swallow errors at this level, because Bluebird throws up false
    // positives when manually rolling the transaction back
    .catch(() => {});
  });
};
