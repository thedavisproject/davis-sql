const {thread} = require('davis-shared').fp;
const {expect} = require('chai');
const {attribute, variable, dataSet, folder, user, action} = require('davis-model');
const mapper = require('../../src/entities/mapping')({
  customProperties: {
    folder: ['foo'],
    dataset: ['foo'],
    variable: ['foo'],
    attribute: ['foo'],
    user: ['foo'],
    action: ['foo']
  }
});

const testCreatedDate = new Date(2016,5,24,12,30,0,0),
  testModifiedDate = new Date(2016,5,25,10,25,4,20),
  testDataModifiedDate = new Date(2016,6,1,10,25,4,20),
  dateProps = {
    created: testCreatedDate,
    modified: testModifiedDate
  },
  dataSetDateProps = Object.assign(dateProps, {
    dataModified: testDataModifiedDate
  });

describe('Entity Mapping and Validation', function(){

  describe('Folder', function(){

    it('should fail for bad entity for no entity type', function(){
      const result = mapper[folder.entityType].buildRecord({});
      expect(result.isLeft).to.be.true;
      expect(result.merge()).to.match(/Entity must have a valid entityType/);
    });

    it('should fail for bad entity for no name', function(){
      const result = mapper[folder.entityType].buildRecord({entityType: folder.entityType});
      expect(result.isLeft).to.be.true;
      expect(result.merge()).to.match(/Entity must have a valid name/);
    });

    it('should map the folder to record', function(){
      const f = folder.new(null, 'F. Foo', Object.assign({}, { parent: 5 }, dateProps));
      const folderRecord = mapper[folder.entityType].buildRecord(f);
      expect(folderRecord.isRight).to.be.true;
      expect(folderRecord.get()).to.deep.equal({
        id: undefined,
        name: 'F. Foo',
        parent_id: 5,
        extended_properties: '{}',
        created: testCreatedDate,
        modified: testModifiedDate
      });
    });

    it('should map the record back to a folder entity', function(){
      const dbRecord = {
        id: 34,
        name: 'Foo Folders',
        parent_id: 5,
        created: '2016-06-24 12:30:00-04',
        modified: '2016-07-24 12:30:00-04'
      };

      const folderRecord = mapper[folder.entityType].buildEntity(dbRecord);

      expect(folderRecord).to.deep.include({
        id: 34,
        name: 'Foo Folders',
        parent: 5
      });
      expect(folderRecord.created).to.be.a('Date');
      expect(folderRecord.created.toString()).to.match(/Fri Jun 24 2016 12:30:00 GMT-0400/);
      expect(folderRecord.modified).to.be.a('Date');
      expect(folderRecord.modified.toString()).to.match(/Sun Jul 24 2016 12:30:00 GMT-0400/);
    });

    it('should map generic properties to extended properties', function(){
      const f = folder.new(null, 'F. Foo', {foo: 'baz'});
      const folderRecord = mapper[folder.entityType].buildRecord(f);
      expect(folderRecord.get()).to.deep.include({
        extended_properties: JSON.stringify({
          foo: 'baz'
        })
      });
    });

    it('should map the extended properties back to an entity property', function(){
      const dbRecord = {
        extended_properties: {
          foo: 'buzz'
        }
      };

      const folderRecord = mapper[folder.entityType].buildEntity(dbRecord);

      expect(folderRecord).to.deep.include({
        foo: 'buzz'
      });
    });

  });

  describe('Data set', function(){

    it('should fail for bad entity for no entity type', function(){
      const result = mapper[dataSet.entityType].buildRecord({});
      expect(result.isLeft).to.be.true;
      expect(result.merge()).to.match(/Entity must have a valid entityType/);
    });

    it('should fail for bad entity for no name', function(){
      const result = mapper[dataSet.entityType].buildRecord({entityType: dataSet.entityType});
      expect(result.isLeft).to.be.true;
      expect(result.merge()).to.match(/Entity must have a valid name/);
    });

    it('should map the data set to record', function(){
      const ds = dataSet.new(null, 'D. Set', Object.assign({}, { folder: 5, schema: [1,2] }, dataSetDateProps));
      const dataSetRecord = mapper[dataSet.entityType].buildRecord(ds);
      expect(dataSetRecord.isRight).to.be.true;
      expect(dataSetRecord.get()).to.deep.equal({
        id: undefined,
        name: 'D. Set',
        folder_id: 5,
        extended_properties: '{}',
        created: testCreatedDate,
        modified: testModifiedDate,
        data_modified: testDataModifiedDate,
        schema: '[1,2]' // should be converted to JSON string
      });
    });

    it('should map the record back to a data set entity', function(){
      const dbRecord = {
        id: 34,
        name: 'Data Set',
        folder_id: 5,
        schema: [1,2,3],
        created: '2016-06-24 12:30:00-04',
        modified: '2016-07-24 12:30:00-04',
        data_modified: '2016-08-24 12:30:00-04'
      };

      const dataSetRecord = mapper[dataSet.entityType].buildEntity(dbRecord);

      expect(dataSetRecord.id).to.equal(34);
      expect(dataSetRecord.name).to.equal('Data Set');
      expect(dataSetRecord.folder).to.equal(5);
      expect(dataSetRecord.schema).to.deep.equal([1,2,3]);
      expect(dataSetRecord.created).to.be.a('Date');
      expect(dataSetRecord.created.toString()).to.match(/Fri Jun 24 2016 12:30:00 GMT-0400/);
      expect(dataSetRecord.modified).to.be.a('Date');
      expect(dataSetRecord.modified.toString()).to.match(/Sun Jul 24 2016 12:30:00 GMT-0400/);
      expect(dataSetRecord.dataModified).to.be.a('Date');
      expect(dataSetRecord.dataModified.toString()).to.match(/Wed Aug 24 2016 12:30:00 GMT-0400/);
    });

    it('should map generic properties to extended properties', function(){
      const f = dataSet.new(null, 'F. Foo', {foo: 'baz'});
      const dataSetRecord = mapper[dataSet.entityType].buildRecord(f);
      expect(dataSetRecord.get()).to.deep.include({
        extended_properties: JSON.stringify({
          foo: 'baz'
        })
      });
    });

    it('should map the extended properties back to an entity property', function(){
      const dbRecord = {
        extended_properties: {
          foo: 'buzz'
        }
      };

      const dataSetRecord = mapper[dataSet.entityType].buildEntity(dbRecord);

      expect(dataSetRecord).to.deep.include({
        foo: 'buzz'
      });
    });

  });

  describe('Variable', function(){

    it('should fail for bad entity for no entity type', function(){
      const result = mapper[variable.entityType].buildRecord({});
      expect(result.isLeft).to.be.true;
      expect(result.merge()).to.match(/Entity must have a valid entityType/);
    });

    it('should fail for bad entity for no name', function(){
      const result = mapper[variable.entityType].buildRecord({entityType: variable.entityType});
      expect(result.isLeft).to.be.true;
      expect(result.merge()).to.match(/Entity must have a valid name/);
    });

    it('should map the variable to record', function(){
      const v = variable.newCategorical(null, 'Cat. Var.', Object.assign({
        scopedDataSet: 10,
        key: 'k',
        format: {
          type: 'percent'
        }
      }, dateProps));
      const variableRecord = mapper[variable.entityType].buildRecord(v);
      expect(variableRecord.isRight).to.be.true;
      expect(variableRecord.get()).to.deep.equal({
        id: undefined,
        name: 'Cat. Var.',
        key: 'k',
        type: variable.types.categorical,
        data_set_id: 10,
        format: '{\"type\":\"percent\"}',
        extended_properties: '{}',
        created: testCreatedDate,
        modified: testModifiedDate
      });
    });

    it('should throw for bad variable type', function(){
      expect(() => mapper[variable.entityType].buildEntity({ type: 10 }))
        .to.throw(/Invalid variable type/);
    });

    it('should map the record to a variable entity', function(){
      const dbRecord = {
        id: 34,
        name: 'Var.',
        key: 'k',
        data_set_id: 12,
        type: variable.types.categorical,
        created: '2016-06-24 12:30:00-04',
        modified: '2016-07-24 12:30:00-04'
      };

      const variableRecord = mapper[variable.entityType].buildEntity(dbRecord);

      expect(variableRecord.id).to.equal(34);
      expect(variableRecord.name).to.equal('Var.');
      expect(variableRecord.key).to.equal('k');
      expect(variableRecord.scopedDataSet).to.equal(12);
      expect(variableRecord.created).to.be.a('Date');
      expect(variableRecord.created.toString()).to.match(/Fri Jun 24 2016 12:30:00 GMT-0400/);
      expect(variableRecord.modified).to.be.a('Date');
      expect(variableRecord.modified.toString()).to.match(/Sun Jul 24 2016 12:30:00 GMT-0400/);
    });

    it('should map generic properties to extended properties', function(){
      const f = variable.newCategorical(null, 'F. Foo', {foo: 'baz'});
      const variableRecord = mapper[variable.entityType].buildRecord(f);
      expect(variableRecord.get()).to.deep.include({
        extended_properties: JSON.stringify({
          foo: 'baz'
        })
      });
    });

    it('should map the extended properties back to an entity property', function(){
      const dbRecord = {
        type: variable.types.categorical,
        extended_properties: {
          foo: 'buzz'
        }
      };

      const variableRecord = mapper[variable.entityType].buildEntity(dbRecord);

      expect(variableRecord).to.deep.include({
        foo: 'buzz'
      });
    });

    it('should map the format settings', function(){
      const dbRecord = {
        id: 34,
        name: 'Var.',
        type: variable.types.numerical,
        format: {
          type: 'percent',
          options: {foo: 'bar'}
        }
      };

      const variableRecord = mapper[variable.entityType].buildEntity(dbRecord);

      expect(variableRecord.id).to.equal(34);
      expect(variableRecord.name).to.equal('Var.');
      expect(variableRecord.format).to.deep.equal({
        type: 'percent',
        options: {foo: 'bar'}
      });
    });

    it('should map key to variable entity only if exists', function(){
      const dbRecord = {
        id: 34,
        name: 'Var.',
        type: variable.types.categorical
      };

      const variableRecord = mapper[variable.entityType].buildEntity(dbRecord);

      expect(variableRecord.key).to.equal('Var.'); // should default to the name
    });

    it('should map categorical variable records', function(){
      const dbRecord = {
        id: 34,
        name: 'Var.',
        type: variable.types.categorical
      };

      const variableRecord = mapper[variable.entityType].buildEntity(dbRecord);

      expect(variableRecord.type).to.equal(variable.types.categorical);
    });

    it('should map numerical variable records', function(){
      const dbRecord = {
        id: 34,
        name: 'Var.',
        type: variable.types.numerical
      };

      const variableRecord = mapper[variable.entityType].buildEntity(dbRecord);

      expect(variableRecord.type).to.equal(variable.types.numerical);
    });

  });

  describe('Attribute', function(){

    it('should fail for bad entity for no entity type', function(){
      const result = mapper[attribute.entityType].buildRecord({});
      expect(result.isLeft).to.be.true;
      expect(result.merge()).to.match(/Entity must have a valid entityType/);
    });

    it('should fail for bad entity for no name', function(){
      const result = mapper[attribute.entityType].buildRecord({entityType: attribute.entityType});
      expect(result.isLeft).to.be.true;
      expect(result.merge()).to.match(/Entity must have a valid name/);
    });

    it('should map the attribute to record', function(){
      const attr = attribute.new(null, 'Attr.', 45, Object.assign({}, { parent: 40, key: 'k' }, dateProps));
      const attrRecord = mapper[attribute.entityType].buildRecord(attr);
      expect(attrRecord.isRight).to.be.true;
      expect(attrRecord.get()).to.deep.equal({
        id: undefined,
        name: 'Attr.',
        key: 'k',
        variable_id: 45,
        parent_id: 40,
        extended_properties: '{}',
        created: testCreatedDate,
        modified: testModifiedDate
      });
    });

    it('should map the record back to an attribute entity', function(){
      const dbRecord = {
        id: 34,
        name: 'Attr.',
        key: 'k',
        variable_id: 5,
        parent_id: 6,
        created: '2016-06-24 12:30:00-04',
        modified: '2016-07-24 12:30:00-04'
      };

      const dataSetRecord = mapper[attribute.entityType].buildEntity(dbRecord);

      expect(dataSetRecord.id).to.equal(34);
      expect(dataSetRecord.name).to.equal('Attr.');
      expect(dataSetRecord.key).to.equal('k');
      expect(dataSetRecord.variable).to.equal(5);
      expect(dataSetRecord.parent).to.equal(6);
      expect(dataSetRecord.created).to.be.a('Date');
      expect(dataSetRecord.created.toString()).to.match(/Fri Jun 24 2016 12:30:00 GMT-0400/);
      expect(dataSetRecord.modified).to.be.a('Date');
      expect(dataSetRecord.modified.toString()).to.match(/Sun Jul 24 2016 12:30:00 GMT-0400/);
    });

    it('should map generic properties to extended properties', function(){
      const f = attribute.new(null, 'F. Foo', 45, {foo: 'baz'});
      const attributeRecord = mapper[attribute.entityType].buildRecord(f);
      expect(attributeRecord.get()).to.deep.include({
        extended_properties: JSON.stringify({
          foo: 'baz'
        })
      });
    });

    it('should map the extended properties back to an entity property', function(){
      const dbRecord = {
        extended_properties: {
          foo: 'buzz'
        }
      };

      const attributeRecord = mapper[attribute.entityType].buildEntity(dbRecord);

      expect(attributeRecord).to.deep.include({
        foo: 'buzz'
      });
    });

    it('should map key to attribute entity only if exists', function(){
      const dbRecord = {
        id: 34,
        name: 'Attr.',
        variable_id: 55
      };

      const attrEntity = mapper[attribute.entityType].buildEntity(dbRecord);

      expect(attrEntity.key).to.equal('Attr.'); // should default to the name
    });

    it('should error for no variable_id', function(){
      const attr = attribute.new(null, 'Attr.', 'bad id', { parent: 40 });
      const result = mapper[attribute.entityType].buildRecord(attr);
      expect(result.isLeft).to.be.true;
      expect(result.merge()).to.match(/Property "variable_id" must be a valid id/);
    });

  });

  describe('User', function(){

    const noEmail = user.new(null, 'Mr. Jones', null, dateProps),
      noPassword = user.new(null, 'Mr. Jones', 'jones@example.com', dateProps);

    let goodUser = user.new(null, 'Mr. Jones', 'jones@example.com', dateProps);
    goodUser = user.setPassword('myPassword123', goodUser);

    it('should fail for bad entity for no entity type', function(){
      const result = mapper[user.entityType].buildRecord({});
      expect(result.isLeft).to.be.true;
      expect(result.merge()).to.match(/Entity must have a valid entityType/);
    });

    it('should fail for bad entity for no name', function(){
      const result = mapper[user.entityType].buildRecord({entityType: user.entityType});
      expect(result.isLeft).to.be.true;
      expect(result.merge()).to.match(/Entity must have a valid name/);
    });

    it('should fail for no email', function(){
      const result = mapper[user.entityType].buildRecord(noEmail);
      expect(result.isLeft).to.be.true;
      expect(result.merge()).to.match(/Users may not be stored without a valid email/);
    });

    it('should fail for no password', function(){
      const result = mapper[user.entityType].buildRecord(noPassword);
      expect(result.isLeft).to.be.true;
      expect(result.merge()).to.match(/Users may not be stored without a valid password/);
    });

    it('should map the user to record', function(){
      const userRecord = mapper[user.entityType].buildRecord(goodUser);
      expect(userRecord.isRight).to.be.true;
      expect(userRecord.get()).to.deep.equal({
        id: undefined,
        name: 'Mr. Jones',
        email: 'jones@example.com',
        admin: false,
        gui: false,
        password: goodUser.password,
        extended_properties: '{}',
        modified: testModifiedDate,
        created: testCreatedDate
      });
    });

    it('should map the record back to a user entity', function(){
      const dbRecord = {
        id: 34,
        name: 'Foo',
        email: 'foo@bar.com',
        admin: true,
        gui: true,
        password: 'hashed...password',
        created: '2016-06-24 12:30:00-04',
        modified: '2016-07-24 12:30:00-04'
      };

      const userRecord = mapper[user.entityType].buildEntity(dbRecord);

      expect(userRecord.id).to.equal(34);
      expect(userRecord.name).to.equal('Foo');
      expect(userRecord.email).to.equal('foo@bar.com');
      expect(userRecord.admin).to.be.true;
      expect(userRecord.gui).to.be.true;
      expect(userRecord.password).to.equal('hashed...password');
      expect(userRecord.created).to.be.a('Date');
      expect(userRecord.created.toString()).to.match(/Fri Jun 24 2016 12:30:00 GMT-0400/);
      expect(userRecord.modified).to.be.a('Date');
      expect(userRecord.modified.toString()).to.match(/Sun Jul 24 2016 12:30:00 GMT-0400/);
    });

    it('should map generic properties to extended properties', function(){
      const f = thread(
        user.new(null, 'Mr. Jones', 'jones@example.com', {foo: 'baz'}),
        user.setPassword('myPassword123'));

      const userRecord = mapper[user.entityType].buildRecord(f);
      expect(userRecord.get()).to.deep.include({
        extended_properties: JSON.stringify({
          foo: 'baz'
        })
      });
    });

    it('should map the extended properties back to an entity property', function(){
      const dbRecord = {
        extended_properties: {
          foo: 'buzz'
        }
      };

      const userRecord = mapper[user.entityType].buildEntity(dbRecord);

      expect(userRecord).to.deep.include({
        foo: 'buzz'
      });
    });
  });

  describe('Action Log', function(){

    it('should fail for bad entity for no entity type', function(){
      const result = mapper[action.entityType].buildRecord({});
      expect(result.isLeft).to.be.true;
      expect(result.merge()).to.match(/Entity must have a valid entityType/);
    });

    it('should fail for bad entity for no name', function(){
      const result = mapper[action.entityType].buildRecord({entityType: action.entityType});
      expect(result.isLeft).to.be.true;
      expect(result.merge()).to.match(/Entity must have a valid name/);
    });

    it('should map the action to record', function(){
      const actionEntry = action.new(null, '', 1, 'dataset', 2, 'update', dateProps);
      const actionRecord = mapper[action.entityType].buildRecord(actionEntry);
      expect(actionRecord.isRight).to.be.true;
      expect(actionRecord.get()).to.deep.equal({
        id: undefined,
        name: '',
        user_id: 1,
        subject_type: 'dataset',
        subject_id: 2,
        action: 'update',
        extended_properties: '{}',
        created: testCreatedDate,
        modified: testModifiedDate
      });
    });

    it('should map the record back to an action entity', function(){
      const dbRecord = {
        id: 34,
        name: '',
        user_id: 1,
        subject_type: 'dataset',
        subject_id: 2,
        action: 'update',
        created: '2016-06-24 12:30:00-04',
        modified: '2016-07-24 12:30:00-04'
      };

      const actionRecord = mapper[action.entityType].buildEntity(dbRecord);

      expect(actionRecord.id).to.equal(34);
      expect(actionRecord.name).to.equal('');
      expect(actionRecord.user).to.equal(1);
      expect(actionRecord.subjectType).to.equal('dataset');
      expect(actionRecord.subjectId).to.equal(2);
      expect(actionRecord.action).to.equal('update');
      expect(actionRecord.created).to.be.a('Date');
      expect(actionRecord.created.toString()).to.match(/Fri Jun 24 2016 12:30:00 GMT-0400/);
      expect(actionRecord.modified).to.be.a('Date');
      expect(actionRecord.modified.toString()).to.match(/Sun Jul 24 2016 12:30:00 GMT-0400/);
    });

    it('should map generic properties to extended properties', function(){
      const f = action.new(null, '', 1, 'dataset', 2, 'update', {foo: 'baz'});
      const actionRecord = mapper[action.entityType].buildRecord(f);
      expect(actionRecord.get()).to.deep.include({
        extended_properties: JSON.stringify({
          foo: 'baz'
        })
      });
    });

    it('should map the extended properties back to an entity property', function(){
      const dbRecord = {
        extended_properties: {
          foo: 'buzz'
        }
      };

      const actionRecord = mapper[action.entityType].buildEntity(dbRecord);

      expect(actionRecord).to.deep.include({
        foo: 'buzz'
      });
    });
  });
});
