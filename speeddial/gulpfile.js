var gulp = require('gulp');
var handlebars = require('gulp-handlebars');
var wrap = require('gulp-wrap');
var declare = require('gulp-declare');
var concat = require('gulp-concat');

gulp.task('handlebars', function(){
	gulp.src('public/templates/*.hbs')
		.pipe(handlebars())
		.pipe(wrap('Handlebars.template(<%= contents %>)'))
		.pipe(declare({
			namespace: 'SpeedDial.templates',
			noRedeclare: true // Avoid duplicate declarations
		}))
		.pipe(concat('templates.js'))
		//.pipe(gulp.dest('build/js/'));
		.pipe(gulp.dest('public/templates/'));
});