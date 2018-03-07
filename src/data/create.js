const {variable} = require('davis-model');
const Task = require('data.task');
const Async = require('control.async')(Task);
const R = require('ramda');

const individualToFactRecords = individual =>
  individual.facts.map(function(f){
    if(f.type === variable.types.categorical){
      return {
        data_set_id: individual.dataSet,
        individual_id: individual.id,
        variable_id: f.variable,
        attribute_id: f.attribute
      };
    }
    else if(f.type === variable.types.numerical){
      return {
        data_set_id: individual.dataSet,
        individual_id: individual.id,
        variable_id: f.variable,
        numerical_value: isNaN(f.value)? null: f.value
      };
    }
    else if(f.type === variable.types.text){
      return {
        data_set_id: individual.dataSet,
        individual_id: individual.id,
        variable_id: f.variable,
        text_value: f.value.toString()
      };
    }
  });

module.exports = (db, storageConfigIgnored) => (catalog, individuals) => {
  const facts = R.chain(individualToFactRecords, individuals);

  return Async.fromPromise(db('facts').withSchema(catalog).insert(facts))
    .map(() => individuals.length);
};
