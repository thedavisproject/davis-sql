const R = require('ramda');
const util = require('davis-shared');
const {thread} = util.fp;
const {entity, folder, dataSet, variable, attribute, user, action} = require('davis-model');
const {undefinedIfNil} = require('../util');
const Either = require('data.either');

const validateEntityName = (entity) =>{
  if(R.isNil(entity.name)){
    return Either.Left('Entity must have a valid name');
  }
  return Either.Right(entity);
};

// Default logic for creating a database record fron an entity
// Validation default is to return an an Either.Right
// Returns an Either
const configureRecord = ({props, validate = a => Either.Right(a)}) => entity => {
  
  // Validation. Each step should throw an exception if an error is encountered
  return thread(
    entity,
    validateEntityName,
    R.chain(validate),
    R.map(e => Object.assign({}, props(e), {
      id: undefinedIfNil(e.id),
      name: e.name,
      created: e.created,
      modified: e.modified
    })));
};

const addDates = R.curry((record, e) => {
  return thread(
    e,
    entity.setCreated(record.created),
    entity.setModified(record.modified)); 
});

module.exports = R.indexBy(R.prop('entityType'), [
  
  // *****************
  // Folder
  // *****************
  {
    entityType: folder.entityType,

    table: 'folders',

    buildEntity: record => { 
      const obj = folder.new(record.id, record.name, {
        parent: record.parent_id
      });
      return addDates(record, obj);
    },

    buildRecord: configureRecord({
      props: folder => ({
        parent_id: folder.parent
      })
    }),

    propertyMappings: {
      'id': 'id',
      'name': 'name',
      'parent': 'parent_id'
    }
  },


  // *****************
  // Data Set
  // *****************
  {
    entityType: dataSet.entityType,

    table: 'data_sets',

    buildEntity: record => {
      const obj = dataSet.new(record.id, record.name, {
        folder: record.folder_id,
        schema: record.schema
      });

      return thread(
        obj,
        dataSet.setDataModified(record.data_modified),
        addDates(record));
    },

    buildRecord: configureRecord({
      props: dataSet => ({
        schema: JSON.stringify(dataSet.schema),
        folder_id: dataSet.folder,
        data_modified: dataSet.dataModified
      })
    }),
    
    propertyMappings: { 
      'id': 'id',
      'name': 'name',
      'schema': 'schema',
      'folder': 'folder_id',
      'dataModified': 'data_modified'
    }
  },


  // *****************
  // Variable
  // *****************
  {
    entityType: variable.entityType,

    table: 'variables',

    buildEntity: record => {
      let ctor;
      if(record.type === variable.types.categorical){
        ctor = variable.newCategorical;
      }
      else if(record.type === variable.types.quantitative){
        ctor = variable.newQuantitative;
      }
      else{
        throw 'Invalid variable type: ' + record.type;
      }

      const props = {
        scopedDataSet: record.data_set_id,
        format: record.format
      };

      if(!R.isNil(record.key)) {
        props.key = record.key;
      }

      const obj = ctor(record.id, record.name, props);

      return addDates(record, obj);
    },

    buildRecord: configureRecord({
      props: variable => ({
        type: variable.type,
        key: variable.key,
        data_set_id: variable.scopedDataSet,
        format: JSON.stringify(variable.format)
      })
    }),

    propertyMappings: { 
      'id': 'id',
      'name': 'name',
      'type': 'type',
      'key': 'key',
      'scopedDataSet': 'data_set_id'
    }
  },


  // *****************
  // Attribute
  // *****************
  {
    entityType: attribute.entityType,

    table: 'attributes',

    buildEntity: record => {
      const props = {
        parent: record.parent_id
      };

      if(!R.isNil(record.key)){
        props.key = record.key;
      }

      const obj = attribute.new(record.id, record.name, record.variable_id, props);
      return addDates(record, obj);
    },

    buildRecord: configureRecord({
      props: attribute => ({
        key: attribute.key,
        variable_id: attribute.variable,
        parent_id: attribute.parent
      }),
      validate: attribute => {
        if(!entity.isValidId(attribute.variable)){
          return Either.Left(`Property "variable_id" must be a valid id: ${attribute.variable}`);
        }
        return Either.Right(attribute);
      }
    }),

    propertyMappings: { 
      'id': 'id',
      'name': 'name',
      'key': 'key',
      'variable': 'variable_id',
      'parent': 'parent_id'
    }
  },


  // *****************
  // User
  // *****************
  {
    entityType: user.entityType,

    table: 'users',

    buildEntity: record => {
      const obj = user.new(record.id, record.name, record.email, {
        admin: record.admin,
        password: record.password // The hashed password
      });
      return addDates(record, obj);
    },

    buildRecord: configureRecord({
      props: user => ({
        email: user.email,
        password: user.password, // The hashed password
        admin: user.admin
      }),
      validate: user => {
        if(!user.email){
          return Either.Left('Users may not be stored without a valid email'); 
        }

        if(!user.password){
          return Either.Left('Users may not be stored without a valid password');
        }

        return Either.Right(user);
      }
    }),

    propertyMappings: { 
      'id': 'id',
      'name': 'name',
      'email': 'email',
      'password': 'password',
      'admin': 'admin'
    }
  },

  // *****************
  // Action Log
  // *****************
  {
    entityType: action.entityType,

    table: 'action_log',

    buildEntity: record => {
      const obj = action.new(
        record.id,
        record.name,
        record.user_id,
        record.subject_type,
        record.subject_id,
        record.action);

      return addDates(record, obj);
    },

    buildRecord: configureRecord({
      props: action => ({
        user_id: action.user,
        subject_type: action.subjectType,
        subject_id: action.subjectId,
        action: action.action
      }),
      validate: action => {
        if(R.isNil(action.user)){
          return Either.Left('Property "user" must not be empty.');
        }
        if(R.isNil(action.subjectType)){
          return Either.Left('Property "subjectType" must not be empty.');
        }
        if(R.isNil(action.subjectId)){
          return Either.Left('Property "subjectId" must not be empty.');
        }
        if(R.isNil(action.action)){
          return Either.Left('Property "action" must not be empty.');
        }
        return Either.Right(action);
      }
    }),

    propertyMappings: { 
      'id': 'id',
      'name': 'name',
      'user': 'user_id',
      'subjectType': 'subject_type',
      'subjectId': 'subject_id',
      'action': 'action'
    }
  }
]);
