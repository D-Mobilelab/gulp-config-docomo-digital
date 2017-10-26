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
var uglify = require('gulp-uglify');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var lec = require('gulp-line-ending-corrector');
var gulpif = require('gulp-if');

var base = require('./base');

gulp.task('build:clean', ['lint'], function(done){
    del(['dist/**/*.*'], { force: true }).then(function(){ done(); });
});
 
gulp.task('build:html', ['build:clean', 'loadcustom'], function(){
    if(base.vhostCustom.mergeHtml){
        return gulp.src(['app/**/*.html', '!app/index*.html'])
        .pipe(ngTemplate({
            module: base.vhostCustom.mainAngularModule,
            standalone: false,
            filename: 'templates.js',
            path: function (path, base) {
                return base.vhostCustom.jsPrefix + path.replace(base, '');
            }
        }))
        .pipe(gulp.dest('dist/'));
    } else {
        return gulp.src(['app/**/*.html', '!app/index*.html'])
        .pipe(gulp.dest('dist/'));
    }    
});
 
gulp.task('build', ['build:html'], function () {
    var jsFilter = filter('**/*.js', { restore: true });
    var cssFilter = filter('**/*.css', { restore: true });
    var htmlFilter = filter('**/*.html', { restore: true });
    return gulp.src(['app/index*.html', '!app/index-stage.html'])
    .pipe(replace('<TMPL_VAR NAME=JS_PREFIX_APPS>', ''))
    .pipe(replace('app/', ''))
    .pipe(replace('node_modules/', '../node_modules/'))
    .pipe(replace('<!--templates ', '<'))
    .pipe(replace(' templates--> ', '>'))
    .pipe(useref())
    .pipe(removecode({ prod: true }))
    
    .pipe(cssFilter)
    .pipe(cleanCSS())
    .pipe(gulpif(base.vhostCustom.revCss, rev()))
    .pipe(cssFilter.restore)
 
    .pipe(jsFilter)
    .pipe(sourcemaps.init())
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(rev())
    .pipe(sourcemaps.write('.'))
    .pipe(jsFilter.restore)
 
    .pipe(revReplace({
        prefix: '<TMPL_VAR NAME=JS_BUILD_URL>'
    }))
 
    .pipe(htmlFilter)
    .pipe(replace('.js.map', '.js'))
    .pipe(lec({ verbose: false, eolc: 'LF', encoding: 'utf8' }))
    .pipe(htmlFilter.restore)
    
    .pipe(gulp.dest('dist/'));
});