"use strict";
let gulp = require("gulp");
let wiredep = require("wiredep").stream;
let inject = require('gulp-inject');
let browserSync = require('browser-sync').create();
let runSequence = require('run-sequence');
let eslint = require('gulp-eslint');
let useref = require('gulp-useref');
let minifyCss = require('gulp-minify-css');
let concat = require('gulp-concat');
let mainBowerFiles = require('main-bower-files');
let gulpFilter = require('gulp-filter');
let uglify = require('gulp-uglify');
let babel = require('gulp-babel');
let less = require('gulp-less');
let path = require('path');
let urlAdjuster = require('gulp-css-url-adjuster');
let templateCache = require('gulp-angular-templatecache');
let minifyHTML = require('gulp-minify-html');
//Очистка папки
let rimraf = require('gulp-rimraf');

let rename = require('gulp-rename');
let sourcemaps = require('gulp-sourcemaps');

gulp.task('bower', function () {
    return gulp.src('./index.html')
        .pipe(wiredep({directory: "./bower_components"}))
        .pipe(gulp.dest('./'));
});

gulp.task('inject', function () {
    var sources = gulp.src(['./app.js', './Scripts/**/*.{js,css}', './blocks/**/*.{js,css}', '.Content/**/*.{js,css}', './environmental/development/**/*.js'], {read: false});
    return gulp.src('./index.html')
        .pipe(inject(sources, {relative: true}))
        .pipe(gulp.dest('./'));
});
gulp.task('bower-build', function () {
    var jsFilter = gulpFilter('**/*.js', {restore: true});  //отбираем только  javascript файлы
    var cssFilter = gulpFilter('**/*.css');  //отбираем только css файлы
    let bower = mainBowerFiles();
    bower.push('./Scripts/visioglobe/vg.mapviewer.web.js');
    return gulp.src(bower)
    // собираем js файлы , склеиваем и отправляем в нужную папку
        .pipe(jsFilter)
        .pipe(concat('vendor.min.js'))
        .pipe(uglify({outSourceMap: true}))
        .pipe(gulp.dest('dist'))
        .pipe(jsFilter.restore)
        // собраем css файлы, склеиваем и отправляем их под синтаксисом css
        .pipe(cssFilter)
        .pipe(concat('vendor.min.css'))
        //processImport - игонорировать @import
        .pipe(minifyCss({processImport: false}))
        .pipe(gulp.dest('dist'));
});

gulp.task('js-prod', function () {
    return gulp.src(['app.js', './Scripts/**/*.js', './blocks/**/*.js', './environmental/production/**/*.js', '!Scripts/bowser/bowser.js', '!./Scripts/visioglobe/vg.mapviewer.web.js'])
        .pipe(concat('script.js'))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(uglify({outSourceMap: true}))
        .pipe(gulp.dest('dist'));
});
gulp.task('js-client', function () {
    return gulp.src(['app.js', './Scripts/**/*.js', './blocks/**/*.js', './environmental/client/**/*.js', '!Scripts/bowser/bowser.js', '!./Scripts/visioglobe/vg.mapviewer.web.js'])
        .pipe(concat('script.js'))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(uglify({outSourceMap: true}))
        .pipe(gulp.dest('dist'));
});

gulp.task('less-prod', function () {
    return gulp.src(['style.less', './blocks/**/*.{css,less}', './Scripts/Keyboard/jsKeyboard.css'])
        .pipe(concat('client.less'))
        .pipe(less({
            paths: [path.join(__dirname, 'less', 'includes')]
        })).pipe(urlAdjuster({
            replace: ['Content', 'Content'],
        }))
        .pipe(gulp.dest('dist'));
});

function log(error) {
    console.log([
        '',
        "----------ERROR MESSAGE START----------",
        ("[" + error.name + " in " + error.plugin + "]"),
        error.message,
        "----------ERROR MESSAGE END----------",
        ''
    ].join('\n'));
    this.end();
}

gulp.task('template', function () {
    return gulp.src(['./blocks/**/*.html', './Views/*.html'])
        .pipe(minifyHTML({quotes: true}))
        .pipe(templateCache({root: "blocks", module: "app", filename: "templates.js"}))
        .pipe(gulp.dest('dist'))
        .on('error', log);
});
//Очистка - удаляет папку
gulp.task('build:clean', function () {
    return gulp.src('./dist/', {read: false})
        .pipe(rimraf({force: true}))
        .on('error', log);
});
gulp.task('build:content', function () {
    return gulp.src(['./Content/**/*.*', './web.config', './demoPage.html'], {read: true, base: '.'})
        .pipe(gulp.dest('dist'))
        .on('error', log);
});
gulp.task('build:index', function () {
    return gulp.src('index.prod.html', {read: true})
        .pipe(rename('index.html'))
        .pipe(gulp.dest('dist'))
        .on('error', log);
});

gulp.task('prod', function (callback) {
    runSequence('build:clean', ['template', 'js-prod', 'less-prod', 'bower-build', 'build:content', 'build:index'], callback);
});
gulp.task('client', function (callback) {
    runSequence('build:clean', ['template', 'js-client', 'less-prod', 'bower-build', 'build:content', 'build:index'], callback);
});
gulp.task('build', function (callback) {
    runSequence('bower', 'inject', callback);
});
gulp.task('lint', function () {
    return gulp.src(['./Scripts/**/*.js', './blocks/**/*.js', './blocks/**/*.less', '.Content/**/*.js', '!./Scripts/**/leaflet.js '])
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console. 
        // Alternatively use eslint.formatEach() (see Docs). 
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on 
        // lint error, return the stream and pipe to failAfterError last. 
        .pipe(eslint.failAfterError());
});
gulp.task('less-serve', function () {
    return gulp.src(['style.less', './blocks/**/*.{css,less}', './Scripts/Keyboard/jsKeyboard.css'])
        .pipe(sourcemaps.init())
        .pipe(less({
            paths: [path.join(__dirname, 'less', 'includes')]
        }))
        .pipe(concat('client.css'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.stream())
        .on('error', log);
});
gulp.task('js-serve', function () {
    return gulp.src(['app.js', './Scripts/**/*.js', './blocks/**/*.js', './environmental/development/**/*.js'])
        .pipe(sourcemaps.init())
        .pipe(concat('script.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.stream())
        .on('error', log);
});
gulp.task('server', ['less-serve', 'js-serve'], function () {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });
    gulp.watch(['./blocks/**/*.{css,less}', './style.less', './Scripts/Keyboard/jsKeyboard.css'], ['less-serve']);
    gulp.watch(['app.js', './Scripts/**/*.js', './blocks/**/*.js', './environmental/development/**/*.js'], ['js-serve']);
    browserSync.watch(['./Scripts/**/*.{html}', './blocks/**/*.{html}']).on('change', browserSync.reload);
});