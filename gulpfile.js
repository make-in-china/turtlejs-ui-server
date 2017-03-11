
var gulp = require('gulp');
gulp.task('default', function () {
    console.log(`任务列表：
    vm        构建 uihelper.js`);
});
var tsconfig = {
    // outFile:,
    // "noImplicitAny": true,
    // "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "target": "es5",
    "experimentalDecorators": true,
    "skipLibCheck": true,
    declaration: true
    // "noUnusedParameters":true,
    // "noUnusedLocals":true
}
//virtual

var fs
var moment
var sourcemaps
var ts
var merge
var del
var doTSC
function init() {
    fs = require('fs');
    moment = require('moment');
    sourcemaps = require('gulp-sourcemaps');
    ts = require('gulp-typescript');
    merge = require('merge2');  // Requires separate installation
    del = require('del');
    doTSC = function (path, outFile) {
        tsconfig.outFile = outFile;
        var tsResult = gulp.src(path)
            // .pipe(sourcemaps.init())
            .pipe(ts(tsconfig)
            );
        // tsResult.pipe(sourcemaps.init()).pipe(sourcemaps.write('../maps', {addComment: false}))
        merge([
            tsResult.js.pipe(gulp.dest('dist')),
            tsResult.dts.pipe(gulp.dest('dist'))])
    }
}

gulp.task('vm', function () {
    init();
    del(['dist/*']);
    doTSC('src/viewHelper/main.ts', 'UIHelper.0.1.js')
});