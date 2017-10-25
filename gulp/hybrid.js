var gulp = require('gulp');
var del = require('del');
var fs = require('fs');
var exec = require('child_process').exec;
var removecode = require('gulp-remove-code');
var replace = require('gulp-replace');
var ejs = require('gulp-ejs');
var filter = require('gulp-filter');
var rename = require('gulp-rename');
var ngTemplate = require('gulp-ng-templates');
var useref = require('gulp-useref');
var cleanCSS = require('gulp-clean-css');
var sourcemaps = require('gulp-sourcemaps');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');

var base = require('./base');

gulp.task('hybrid:clean', function(done){
    del(['hybrid/www/*'], { force: true }).then(function(){ done(); });
});

gulp.task('hybrid:initpath', ['hybrid:clean'], function(done){
    var dir = 'hybrid/www';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    done();
});

gulp.task('hybrid:copyappfiles', ['hybrid:initpath'], function(){
    return gulp.src(['app/**/*.*', '!app/index*.html', '!app/user30test.html'], {        
        base: './'    
    })
    .pipe(gulp.dest('hybrid/www/'));
});

gulp.task('hybrid:copymanifest', ['hybrid:initpath'], function(){
    return gulp.src('hybrid/manifest.json') 
    .pipe(gulp.dest('hybrid/www/'));
});

gulp.task('hybrid:installnpmmodules', ['hybrid:initpath'], function(done){
    exec('cp package.json hybrid/www/ && cd hybrid/www && npm i --only=production', function (err, stdout, stderr) {
        if(stderr) {
            console.error(stderr);
        }
        done(err);
    })
    .stdout.pipe(process.stdout)
    .on('exit', function() {
        done();
    });
});

gulp.task('hybrid:transformindex', ['loadconfig', 'loaddict', 'loadfooter', 'hybrid:copymanifest'], function(){
    return gulp.src('app/' + base.indexPage)
    .pipe(removecode({ stage: true, hybrid: true }))
    .pipe(replace('<TMPL_VAR NAME=CONFIG>', JSON.stringify(base.vhost)))
    .pipe(replace('<TMPL_VAR NAME=CONFIGOVERRIDEHYBRID>', JSON.stringify(base.vhostCustom.config)))
    .pipe(replace('<TMPL_VAR NAME=DICTIONARY>', JSON.stringify(base.dict)))
    .pipe(replace('<TMPL_VAR NAME=FOOTER_LINKS>', JSON.stringify(base.footer)))
    .pipe(replace(/<TMPL_VAR NAME="?'?(.*?)"?'?>/gim, '<%= config.$1 %>'))
    .pipe(replace(/<TMPL_IF NAME="?'?(.*?)"?'?>/gim, '<% if (config.$1) { %>'))
    .pipe(replace(/<TMPL_UNLESS NAME="?'?(.*?)"?'?>/gim, '<% if (!config.$1) { %>'))
    .pipe(replace(/<TMPL_ELSE>/gim, '<% } else { %>'))
    .pipe(replace(/<\/TMPL_IF>/gim, '<% } %>'))
    .pipe(replace(/<\/TMPL_UNLESS>/gim, '<% } %>'))
    .pipe(replace(/<\/TMPL_ELSE>/gim, '<% } %>'))
    .pipe(ejs({ config: base.vhost }))
    .pipe(rename('index-stage.html'))
    .pipe(gulp.dest('app/'));
});

gulp.task('hybrid:copyindex', ['hybrid:transformindex'], function(){
    return gulp.src('app/index-stage.html')
    .pipe(rename('index.html'))
    .pipe(gulp.dest('hybrid/www/'));
});

gulp.task('hybrid:stage', ['hybrid:copyindex', 'hybrid:copyappfiles', 'hybrid:installnpmmodules'], function(done){
    exec('cd hybrid/ && cordova prepare && cordova run android -device || true', function (err, stdout, stderr) {
        if(stderr) {
            console.error(stderr);
        }
        done(err);
    })
    .stdout.pipe(process.stdout)
    .on('exit', function() {
        done();
    });
});

gulp.task('hybrid:mergehtml', function(){
    return gulp.src(['app/**/*.html', '!app/bower_components/**/*.html', '!app/index*.html'])
    .pipe(ngTemplate({
        module: 'news',
        standalone: false,
        filename: 'templates.js',
        path: function (path, base) {
            return 'app/' + path.replace(base, '');
        }
    }))
    .pipe(gulp.dest('hybrid/www/'));
});

gulp.task('hybrid:build:single', ['hybrid:transformindex', 'hybrid:mergehtml'], function () {
    var jsFilter = filter('**/*.js', { restore: true });
    var cssFilter = filter('**/*.css', { restore: true });
    var htmlFilter = filter('**/*.html', { restore: true });

    return gulp.src('app/index-stage.html')
    .pipe(rename('index.html'))
    .pipe(replace('<TMPL_VAR NAME=JS_PREFIX_APPS>', ''))
    .pipe(replace('app/', ''))
    .pipe(replace('node_modules/', '../node_modules/'))
    .pipe(replace('<!--templateshybrid ', '<'))
    .pipe(replace(' templateshybrid--> ', '>'))
    .pipe(useref())
    .pipe(cssFilter)
    .pipe(cleanCSS())
    .pipe(cssFilter.restore)
    .pipe(jsFilter)
    .pipe(sourcemaps.init())
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(rev())
    .pipe(sourcemaps.write())
    .pipe(jsFilter.restore)
    .pipe(revReplace())
    .pipe(htmlFilter)
    .pipe(replace('.js.map', '.js'))
    .pipe(htmlFilter.restore)
    .pipe(gulp.dest('hybrid/www'));
});

gulp.task('hybrid:build', ['hybrid:build:single'], function(done){
    exec('cd hybrid/ && cordova prepare && cordova run android -device || true', function (err, stdout, stderr) {
        if(stderr){
            console.error(stderr);
        }  
        done(err);
    })
    .stdout.pipe(process.stdout)
    .on('exit', function() {
        done();
    });
});