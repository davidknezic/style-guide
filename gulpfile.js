// FIXME: Merge docs & assets building tasks as much as possible!

var gulp = require('gulp');
var fs = require('fs');
var stream = require('stream');
var del = require('del');
var merge = require('merge-stream');
var iconfont = require('gulp-iconfont');
var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');
var livereload = require('gulp-livereload');
var coffee = require('gulp-coffee');
var concat = require('gulp-concat');
var runSequence = require('run-sequence');
var watch = require('gulp-watch');
var connect = require('connect');
var serveStatic = require('serve-static');
var gutil = require('gulp-util');
var template = require('gulp-template');
var rename = require("gulp-rename");

var docs = require('./tasks/docs');

function errorify(e) {
  gutil.beep();
  gutil.log(e);
}

function file(filename, contents) {
  var src = stream.Readable({ objectMode: true });
  src._read = function () {
    this.push(new gutil.File({
      cwd: "",
      base: "",
      path: filename,
      contents: contents
    }))

    this.push(null)
  }
  return src
}

gulp.task('clean', function (cb) {
  del(['./dist/**/*'], cb);
});

gulp.task('docs', docs({
  cwd: __dirname,
  src: './docs',
  dest: './dist/docs'
}));

gulp.task('icons', function (cb) {
  var n = 0;
  var end = function (err) {
    // Ignore this rule on error
    if (err) return cb(err);

    // Notify execution end on second call, when...
    // * icons.json file is written
    // * fonts are created
    if (++n >= 2) cb();
  }

  gulp.src(['./icons/*.svg'])
    .pipe(iconfont({
      fontName: 'style-guide-font',
      appendCodepoints: true
    }))
    .on('error', errorify)
    .on('codepoints', function (points) {
      var glyphs = [];

      points.forEach(function (point) {
        glyphs.push({
          name: point.name,
          codepoint: point.codepoint.toString(16).toUpperCase()
        });
      });

      var contents = new Buffer(JSON.stringify(glyphs, null, 2));

      file('icons.json', contents)
        .pipe(gulp.dest('./dist'))
        .on('end', end);
    })
    .pipe(gulp.dest('./dist/fonts'))
    .on('end', end);
});

gulp.task('styles-copy', function () {
  return gulp.src(['./less/**/*.less'], { base: './less' })
    .pipe(gulp.dest('./dist/less'));
});

gulp.task('styles-generate', function (cb) {
  gulp.src(['./icons/*.svg'])
    .pipe(iconfont({ fontName: 'temporary' }))
    .on('error', errorify)
    .on('codepoints', function (codepoints) {
      gulp.src('./less/style/blocks/icon.less.lodash', { base: './less' })
        .pipe(template({ glyphs: codepoints }))
        .on('error', errorify)
        .pipe(rename('style/blocks/icon.less'))
        .pipe(gulp.dest('./dist/less'))
        .on('end', function() {
          cb();
        });
    });
});

gulp.task('styles-compile', function () {
  return gulp.src(['./dist/less/{style,normalize}.less'])
    .pipe(sourcemaps.init())
    .pipe(less({
      paths: ['./dist/less']
    }))
    .on('error', errorify)
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('styles', function (cb) {
  runSequence('styles-copy', 'styles-generate', 'styles-compile', cb);
});

gulp.task('scripts-compile', function () {
  return gulp.src('./coffee/*.coffee')
    .pipe(sourcemaps.init())
    .pipe(coffee())
    .on('error', errorify)
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/js'));
});

gulp.task('scripts-combine', function () {
  return gulp.src('./dist/js/*.js')
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(concat('style.all.js'))
    .on('error', errorify)
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/js'));
});

gulp.task('scripts', function (cb) {
  runSequence('scripts-compile', 'scripts-combine', cb);
});

gulp.task('build', function (cb) {
  runSequence('icons', 'styles', 'scripts', 'docs', cb);
});

gulp.task('serve', function (next) {
  connect()
    .use(serveStatic('./dist/docs'))
    .listen(process.env.PORT || 3000, next);
});

gulp.task('dev', ['build', 'serve'], function () {
  livereload.listen();

  watch([
    './docs/**',
    './less/**',
    './icons/**',
    './coffee/**'
  ], function (files, callback) {
    runSequence('build', function (arguments) {
      livereload.changed();
      callback.apply(this, arguments);
    });
  });
});

gulp.task('default', ['build']);
