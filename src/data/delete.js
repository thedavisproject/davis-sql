const Task = require('data.task');
const Async = require('control.async')(Task);
const shared = require('davis-shared');
const {thread} = shared.fp;
const {toArray} = shared.array;

module.exports = db => (catalog, {dataSet, variable, attribute}) => {
 
  const dataSetArr = toArray(dataSet);
  const variableArr = toArray(variable);
  const attributeArr = toArray(attribute);

  if(dataSetArr.length === 0 &&
    variableArr.length === 0 &&
    attributeArr.length === 0){
    // Safeguard against accidentally deleting all data
    return Task.rejected('No parameters provided to data delete.');
  }
  
  return  thread(db.transaction(function(trx){
    const query = db('facts').withSchema(catalog)
      .transacting(trx);
    
    if(dataSetArr > 0){
      query.where('data_set_id', 'in', dataSetArr);
    }
    if(variableArr > 0){
      query.where('variable_id', 'in', variableArr);
    }
    if(attributeArr > 0){
      query.where('attribute_id', 'in', attributeArr);
    }

    return query.del();
  }),
  Async.fromPromise);
};
