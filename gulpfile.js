const gulp = require('gulp');
const tasks = require('davis-shared').build;
const argv = require('yargs').argv;

const drillPath = argv.drill;
const config = require('./gulp.config')();
const allJs = config.allJs(drillPath);
const testFiles = config.testFiles(drillPath);

const loadKnex = () => {
  const testConfig = require('./test/config.js');
  const knex = require('./db/knex')(testConfig.knex);
  return {testConfig, knex};
};

gulp.task('test', tasks.test(testFiles, argv.ci, {
  timeout: 10000
}));

gulp.task('lint', tasks.lint(allJs, argv.ci));

gulp.task('watch', function() {
  gulp.watch(allJs, ['lint', 'test']);
});

gulp.task('migrate:latest', function() {
  console.log('Migrating TEST Database....');
  const {knex} = loadKnex();
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
  const {knex} = loadKnex();
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

gulp.task('seed:run', function() {
  console.log('Seeding TEST Database....');
  const {knex} = loadKnex();
  return knex.seed.run()
    .then(function() {
      console.log('Seeded TEST Database');
      knex.destroy();
    })
    .catch(function(err) {
      console.error(err);
      knex.destroy();
    });
});

gulp.task('bump', tasks.bump(['./package.json'], argv.level || 'patch'));

gulp.task('default', ['watch', 'lint', 'test']);
