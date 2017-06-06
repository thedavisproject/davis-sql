const {expect} = require('chai');
const queryParser = require('../../src/entities/queryParser');

describe('Preprocess expression', function(){

  it('should process top level comparisons', function(){
    const expression = ['=', 'foo', 'bar'];
    const propertyMappings = { 'foo': 'baz' };
    const result = queryParser.preProcessExpression(propertyMappings, expression);
    expect(result.isRight).to.be.true;
    expect(result.get()).to.deep.equal(['=', 'baz', 'bar']);
  });

  it('should process nested comparisons', function(){
    const expression = ['and',
      ['=', 'foo', 'bar'],
      ['>', 'fee', 'bar']];
    const propertyMappings = { 'foo': 'baz' };
    const result = queryParser.preProcessExpression(propertyMappings, expression);
    expect(result.isRight).to.be.true;
    expect(result.get()).to.deep.equal(['and',
      ['=', 'baz', 'bar'],
      ['>', 'fee', 'bar']]);
  });

});
