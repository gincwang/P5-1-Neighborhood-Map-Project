var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    minCSS = require('gulp-minify-css');

gulp.task('minifyJS', function() {
    return gulp.src('js/*.js')
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('dist/scripts'))
});

gulp.task('minifyCSS', function(){
    return gulp.src('css/*.css')
        .pipe(rename({suffix: '.min'}))
        .pipe(minCSS())
        .pipe(gulp.dest('dist/css'))
});
