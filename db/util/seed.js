module.exports = function(knex, Promise) {

  return {
    insertSequentially: function(rows, interpret, table) {
      return rows.reduce(function(p, row) {
        return p.then(() => knex(table).insert(interpret(row)));
      }, Promise.resolve([]));
    }
  };
};
