var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

var srcDir = 'src';
var libDir = 'lib';
var testDir = 'test';
var poweredTestDir = 'powered-test';

gulp.task('build', function(){
  return gulp.src([srcDir + '/**/*.js'])
    .pipe($.sourcemaps.init())
    .pipe($.babel({ presets: ['es2015', 'stage-0'] }))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(libDir));
});

gulp.task('powered-test', function () {
  return gulp.src([testDir + '/**/*.js'])
    .pipe($.sourcemaps.init())
    .pipe($.babel({ presets: ['es2015', 'stage-0'] }))
    .pipe($.espower())
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('./' + poweredTestDir + '/'));
});

gulp.task('test', ['build', 'powered-test'], function () {
  return gulp.src([poweredTestDir + '/**/*.js'])
    .pipe($.mocha({
      reporter: 'spec',
      timeout: 100 * 1000
    }));
});

gulp.task('default', ['build']);
