const R = require('ramda');
const model = require('davis-model');
const parse = model.query.parse;
const Either = require('data.either');

const changeProperty = R.curry((name, expression) => R.adjust(() => name, 1, expression));

const mapProperty = R.curry((mappings, property) => R.propOr(property, property, mappings));

const mapPropertyForExpression = (mappings, expression) => {
  const property = expression[1];
  const mappedProperty = mapProperty(mappings, property); 
  return changeProperty(mappedProperty, expression);
};

// Returns an Either
const preProcessExpression = R.curry((propertyMappings, expression) => {
  const op = parse.op(expression);

  // No preprocessing needed for logical ops. Recurse into child expressions
  if(op.type === 'logical') {
    
    const subExpressions = R.tail(expression);
    
    return R.traverse(Either.of, preProcessExpression(propertyMappings), subExpressions)
      // Reassemble them
      .map(processedSubExps => [op.symbol, ...processedSubExps]);
  }
  else {
    const preProcessedExpression = mapPropertyForExpression(propertyMappings, expression);
    if(!preProcessedExpression){
      return Either.Left(`Error pre-processing expression: ${JSON.stringify(expression)}`);
    }
    return Either.Right(preProcessedExpression);
  }
});

// Takes a callback and recursively builds an knex query object from
// the query definition.
//    
// Examples
// 
// Exp: ["=", "id", 1]
// SQL:  (id = 1)
// Knex: queryObj.where('id', 1)
// 
// Exp: ["and",
//   ["=", "foo", "bar"],
//   [">", "date", "1/2017"]
// ]
// SQL:  (foo = 'bar') AND (date > '1/2017')
// Knex: queryObj.where('foo', '=', 'bar').andWhere('date', '>', 1/2017)
// 
// Exp: ["or", 
//   ["and",
//     ["=", "foo", "bar"],
//     [">", "date", "1/2017"]
//   ],
//   ["<", "date", "1/2016"]
// ]
// SQL: ((foo = 'bar') AND (date > '1/2017')) OR (date < '1/2016')
// Knex: queryObj.where(function(){
//   this.where('foo', '=', 'bar').andWhere('date', '>', 1/2017);
// }).orWhere('date', '>', 1/2016)
const buildKnexQuery = R.curry((expression, knexObj) => {

  const op = parse.op(expression);

  if(op.type === 'logical') {
  
    const args = R.tail(expression);

    args.forEach((arg, i) => {
      if(op.symbol === 'not'){
        knexObj.whereNot(parseSubExpression(arg));
      }
      else if(i === 0){
        if(op.symbol === 'nor'){
          knexObj.whereNot(parseSubExpression(arg));
        }
        else{
          knexObj.where(parseSubExpression(arg));
        }
      }
      else if(op.symbol === 'nor'){
        knexObj.andWhereNot(parseSubExpression(arg));
      }
      else if(op.symbol === 'and'){
        knexObj.andWhere(parseSubExpression(arg));
      }
      else if(op.symbol === 'or'){
        knexObj.orWhere(parseSubExpression(arg));
      }
    });
  }
  // special case
  else if(op.symbol === 'notin'){
    knexObj.whereNot(function(){
      this.whereIn(expression[1], expression[2]);
    });
  }
  else {
    knexObj.where(expression[1], expression[0], expression[2]);
  }

  return knexObj;
});

const parseSubExpression = subExpression => function(){
  buildKnexQuery(subExpression, this);
};

module.exports = {
  mapProperty,
  preProcessExpression,
  buildKnexQuery
};
