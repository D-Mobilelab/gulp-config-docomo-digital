var gulp = require('gulp');
var del = require('del');
var ngTemplate = require('gulp-ng-templates');
var filter = require('gulp-filter');
var replace = require('gulp-replace');
var useref = require('gulp-useref');
var removecode = require('gulp-remove-code');
var cleanCSS = require('gulp-clean-css');
var sourcemaps = require('gulp-sourcemaps');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-terser');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var lec = require('gulp-line-ending-corrector');
var gulpif = require('gulp-if');
var copy = require('gulp-copy');

var base = require('./base');

gulp.task('build:clean', ['lint'], function(done){
    del(['dist/**/*.*'], { force: true }).then(function(){ done(); });
});

gulp.task('build:html', ['build:clean', 'loadcustom'], function(){
    if(base.settings.mergeHtml){
        return gulp.src(['app/**/*.html', '!app/index*.html'])
        .pipe(ngTemplate({
            module: base.settings.mainAngularModule,
            standalone: false,
            filename: 'templates.js',
            path: function (path, pathBase) {
                return base.settings.jsPrefix + path.replace(pathBase, '');
            }
        }))
        .pipe(gulp.dest('dist/'));
    } else {
        return gulp.src(['app/**/*.html', '!app/index*.html'])
        .pipe(gulp.dest('dist/'));
    }
});

const transformJsRefs = require('useref/lib/refManager').transformJSRefs;

var userefOptions = {
    vendor: transformJsRefs,
    types: ['css', 'js', 'vendor']
};

gulp.task('build:source', ['build:html'], function() {
    var jsFilter = filter('**/*.js', { restore: true });
    var jsFilterMin = filter(['**/*.js', '!app/*.nomin.js'], { restore: true });
    var cssFilter = filter('**/*.css', { restore: true });
    var htmlFilter = filter('**/*.html', { restore: true });

    var PREFIX = '<TMPL_VAR NAME=JS_BUILD_URL>';

    return gulp.src(['app/index*.html', '!app/index-stage.html'])
        .pipe(replace('<TMPL_VAR NAME=JS_PREFIX_APPS>', ''))
        .pipe(replace('app/', ''))
        .pipe(replace('node_modules/', '../node_modules/'))
        .pipe(replace('<!--templates ', '<'))
        .pipe(replace(' templates-->', '>'))
        .pipe(useref(userefOptions))
        .pipe(removecode({ prod: true }))

        .pipe(cssFilter)
        .pipe(cleanCSS())
        .pipe(gulpif(base.settings.revCss, rev()))
        .pipe(cssFilter.restore)

        .pipe(jsFilter)

        .pipe(sourcemaps.init())
        .pipe(jsFilterMin)
        .pipe(ngAnnotate())
        .pipe(uglify())
        .pipe(jsFilterMin.restore)
        .pipe(rev())
        .pipe(sourcemaps.write('.'))
        .pipe(jsFilter.restore)

        .pipe(revReplace({
            prefix: PREFIX,
        }))

        .pipe(htmlFilter)
        .pipe(replace('.js.map', '.js'))
        .pipe(replace('app.js', PREFIX + 'app/app.js'))
        .pipe(replace('pages/', PREFIX + 'app/pages/'))
        .pipe(replace('modules/', PREFIX + 'app/modules/'))
        .pipe(replace('common/', PREFIX + 'app/common/'))
        .pipe(replace('api/', PREFIX + 'app/api/'))
        .pipe(lec({ verbose: false, eolc: 'LF', encoding: 'utf8' }))
        .pipe(htmlFilter.restore)

        .pipe(gulp.dest('dist/'))
});

gulp.task('build', ['build:source'], function() {
    return gulp
        .src(['app/**/*.js'])
        .pipe(copy('dist'));
});
