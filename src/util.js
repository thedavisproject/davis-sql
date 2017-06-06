const R = require('ramda');
const Either = require('data.either');

exports.undefinedIfNil = x => R.isNil(x)? undefined : x;

exports.validateEmptyIds = objs => {
  if(R.any(o => !R.isNil(o.id), objs)){
    return Either.Left('Database records must have empty id properties when inserting new records.');
  }
  return Either.Right(objs);
};

exports.validateNoEmptyIds = objs => {
  if(R.any(o => R.isNil(o.id), objs)){
    return Either.Left('Database records must not have empty id properties when updating records.');
  }
  return Either.Right(objs);
};

exports.createPropertiesQuery = R.curry((properties, query) => {
  R.toPairs(properties).forEach(function([k, v]) {
    query.whereIn(k, v);
  });
  return query;
});
