var gulp   = require('gulp');
var jshint = require('gulp-jshint');
var mocha  = require('gulp-mocha');
var util   = require('gulp-util');

gulp.task('lint', function() {
  return gulp
    .src(['gulpfile.js', 'src/*.js', 'test/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('test', function() {
  var f = util.env.testFile ? util.env.testFile : '*';

  return gulp
    .src('test/' + f + '.js')
    .pipe(mocha());
});

gulp.task('default', ['lint', 'test'], function() {
  gulp.watch(['src/*.js', 'test/*.js'], function() {
    gulp.run('lint', 'test');
  });
});
