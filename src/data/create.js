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
    else if(f.type === variable.types.quantitative){
      return {
        data_set_id: individual.dataSet,
        individual_id: individual.id,
        variable_id: f.variable,
        value: isNaN(f.value)? null: f.value
      };
    }
  });

module.exports = db => (catalog, individuals) => {
  const facts = R.chain(individualToFactRecords, individuals);

  return Async.fromPromise(db('facts').withSchema(catalog).insert(facts))
    .map(() => individuals.length);
};
