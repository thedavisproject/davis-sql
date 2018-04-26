const gulp = require('gulp');
const tasks = require('davis-shared').build;
const argv = require('yargs').argv;

const drillPath = argv.drill;
const config = require('./gulp.config')();
const allJs = config.allJs(drillPath);
const testFiles = config.testFiles(drillPath);

const knex = require('./db/knex');
const testConfig = require('./test/config.js');
const {migrateLatest, migrateRollback} =
  require('./db/tools.js')(testConfig.knex);

gulp.task('test', tasks.test(testFiles, argv.ci, {
  timeout: 10000
}));

gulp.task('lint', tasks.lint(allJs, argv.ci));

gulp.task('watch', function() {
  gulp.watch(allJs, ['lint', 'test']);
});

gulp.task('migrate:latest', migrateLatest);

gulp.task('migrate:rollback', migrateRollback);

gulp.task('seed:run', function() {
  console.log('Seeding TEST Database....');
  const db = knex(testConfig.knex);
  return db.seed.run()
    .then(function() {
      console.log('Seeded TEST Database');
      db.destroy();
    })
    .catch(function(err) {
      console.error(err);
      db.destroy();
    });
});

gulp.task('bump', tasks.bump(['./package.json'], argv.level || 'patch'));

gulp.task('default', ['watch', 'lint', 'test']);
