const gulp = require('gulp');
const tasks = require('davis-shared').build;
const config = require('./gulp.config')();
const testConfig = require('./test/config.js');
const knex = require('./db/knex')(testConfig.db);
const argv = require('yargs').argv;

const drillPath = argv.drill;
const allJs = config.allJs(drillPath);
const testFiles = config.testFiles(drillPath);

gulp.task('test', tasks.test(testFiles));

gulp.task('lint', tasks.lint(allJs));

gulp.task('watch', function() {
  gulp.watch(allJs, ['lint', 'test']);
});

gulp.task('migrate:latest', function() {
  console.log('Migrating TEST Database....');
  return knex.migrate.latest()
    .then(function() {
      return knex.migrate.currentVersion();
    })
    .then(function(version) {
      console.log('Migrated TEST database to version: ' + version);
      knex.destroy();
    })
    .catch(function(err) {
      console.error(err);
      knex.destroy();
    });
});

gulp.task('migrate:rollback', function() {
  console.log('Rolling Back TEST Database....');
  return knex.migrate.rollback()
    .then(function() {
      return knex.migrate.currentVersion();
    })
    .then(function(version) {
      console.log('Rolled back TEST database to version: ' + version);
      knex.destroy();
    })
    .catch(function(err) {
      console.error(err);
      knex.destroy();
    });
});

gulp.task('bump', tasks.bump(['./package.json'], argv.level || 'patch'));

gulp.task('default', ['watch', 'lint', 'test']);
