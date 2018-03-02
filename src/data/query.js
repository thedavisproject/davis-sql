const Task = require('data.task');
const Either = require('data.either');
const R = require('ramda');
const shared = require('davis-shared');
const { toArray } = shared.array;
const { compare, ascending, composeComparators } = shared.compare;
const { thread, either2Task } = shared.fp;
const Async = require('control.async')(Task);
const { variable, fact, individual } = require('davis-model');

module.exports = db => {

  const validNumericalComparators = ['<', '<=', '=', '>=', '>'];

  const isCategoricalFilter = f => f.type === variable.types.categorical,
    isNumericalFilter = f => f.type === variable.types.numerical,
    isTextFilter = f => f.type === variable.types.text,
    isCategoricalFact = fact => fact.variable_type === variable.types.categorical,
    isNumericalFact = fact => fact.variable_type === variable.types.numerical,
    isTextFact = fact => fact.variable_type === variable.types.text;

  const categoricalFilterClause = f =>
    Either.Right(function filterClause(){
      if(f.attributes.length === 0){
        this.whereNull('attribute_id')
          .andWhere('variable_id', '=', f.variable);
      }
      else{
        this.where('attribute_id', 'in', toArray(f.attributes))
          .andWhere('variable_id', '=', f.variable);
      }
    });

  const numericalFilterClause = f => {
    return !R.contains(f.comparator, validNumericalComparators) ?
      Either.Left(`Unsupported numerical comparator: ${f.comparator}. Valid comparators include: ${validNumericalComparators.join(',')}`) :
      Either.Right(function filterClause(){
        this.where('variable_id', '=', f.variable)
          .andWhere('numerical_value', f.comparator, f.value);
      });
  };

  const textFilterClause = f => {
    return Either.Right(function filterClause(){
      this.where('variable_id', '=', f.variable)
        .andWhere('text_value', '=', f.value);
    });
  };

  const dataSetFilterClause = R.pipe(
    toArray,
    R.cond([
      [R.isEmpty, () => function(){}], // nop
      [R.T, ids => function(){
        this.whereIn('f.data_set_id', toArray(ids));
      }]
    ]));

  const filterClause = R.cond([
    [isCategoricalFilter, categoricalFilterClause],
    [isNumericalFilter, numericalFilterClause],
    [isTextFilter, textFilterClause]
  ]);

  const filterSubQuery = R.curry((catalog, f) =>
    thread(
      f,
      filterClause,
      R.map(filt =>
        db('facts').withSchema(catalog)
          .select('data_set_id', 'individual_id')
          .where(filt))));

  const addFilters = R.curry((catalog, filters, dataSetIds, query) => {

    const subQueryModifierFns = R.traverse(Either.of, filterSubQuery(catalog), filters);

    return subQueryModifierFns.map(modifierFns => {
      query.where(dataSetFilterClause(dataSetIds));

      modifierFns.forEach(function(f){
        // Follow:  https://github.com/tgriesser/knex/pull/1390 to change this raw query
        // to a knex supported whereIn after this feature is implemented
        query.whereRaw('(f.data_set_id, f.individual_id) in (?)', f);
      });

      return query;
    });
  });

  const queryFacts = (catalog, filters, dataSetIds, limit) => {

    var query = db.withSchema(catalog).select(
      'f.data_set_id',
      'f.individual_id',
      'v.id as variable_id',
      'v.type as variable_type',
      'f.attribute_id as attribute_id',
      'numerical_value',
      'text_value')
      .from('facts as f')
      .join('variables as v', 'f.variable_id', '=', 'v.id');

    if(limit){
      query.where('f.individual_id', '<=', limit);
    }

    return thread(
      query,
      addFilters(catalog, filters, dataSetIds),
      R.map(Async.fromPromise),
      either2Task,
      R.chain(R.identity));
  };

  const createCategoricalFact = row =>
    fact.newCategorical(row.variable_id, row.attribute_id);

  const createNumericalFact = row =>
    fact.newNumerical(row.variable_id, row.numerical_value);

  const createTextFact = row =>
    fact.newText(row.variable_id, row.text_value);

  const createFact = R.cond([
    [isCategoricalFact, createCategoricalFact],
    [isNumericalFact, createNumericalFact],
    [isTextFact, createTextFact],
    [R.T, factRecord => { throw `Invalid variable type ${factRecord.variable_type}`; }]]);

  const orderByDataSetId = compare(R.prop('data_set_id'), ascending),
    orderByIndividualId = compare(R.prop('individual_id'), ascending),
    orderByVariableId = compare(R.prop('variable_id'), ascending),
    factOrder = composeComparators([
      orderByDataSetId,
      orderByIndividualId,
      orderByVariableId]);

  const buildIndividuals = R.pipe(
    R.groupBy(R.prop('data_set_id')),
    R.map(R.groupBy(R.prop('individual_id'))),
    R.map(R.map(R.map(createFact))),
    R.mapObjIndexed((groupedFacts, dataSetId) =>
        R.mapObjIndexed((facts, individualId) =>
          individual.new(+individualId, +dataSetId, facts),
        groupedFacts)),
    R.map(R.values),
    R.values,
    R.flatten);

  // (catalog, filters, dataSetIds) => Task [Individual]
  const query = R.pipe(
      queryFacts,
      R.map(R.sort(factOrder)),
      R.map(buildIndividuals));

  return query;
};
