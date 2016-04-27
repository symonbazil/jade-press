
'use strict'

let
ugly = require('gulp-uglify')
,gulp = require('gulp')
,watch = require('gulp-watch')
,plumber = require('gulp-plumber')
,newer = require('gulp-newer')
,stylus = require('gulp-stylus')
,concat = require('gulp-concat')
,rename = require('gulp-rename')
,runSequence = require('run-sequence')
,_ = require('lodash')

let
cssFolder = __dirname + '/public/css'
,jsFolder = __dirname + '/public/js'
,onces = [
	__dirname + '/bower_components/blueimp-file-upload/js'
	,__dirname + '/bower_components/blueimp-file-upload/js/vendor'
]

,stylusOptions = {
	compress: true
}
,uglyOptions = {
	mangle: {
		except: ['exports', 'module', 'require']
	}
}

gulp.task('stylus', function() {

	gulp.src(cssFolder + '/*.styl')
		
		.pipe(newer({
			dest: cssFolder
			,map: function(path) {
				return path.replace(/\.styl$/, '.css')
			}
		}))
		.pipe(plumber())
		.pipe(stylus(stylusOptions))
		.pipe(gulp.dest(cssFolder))

})


gulp.task('ugly', function() {

		gulp.src(jsFolder + '/*.js')
			.pipe(newer({
				dest: jsFolder
				,map: function(path) {
					return path.replace(/\.dev.js$/, '.min.js')
				}
			}))
			.pipe(plumber())
			.pipe(rename(function (path) {
		    path.extname = path.extname.replace('.js', '.min.js')
		  }))
		  .pipe(gulp.dest(jsFolder))
			.pipe(ugly(uglyOptions))
			.pipe(gulp.dest(jsFolder))

})

gulp.task('ugly-vender', function() {

	onces.forEach(function(fpath) {
		console.log('x')
		gulp.src(fpath + '/*.js')
			.pipe(plumber())
			.pipe(rename(function (path) {
				console.log(path)
		    path.extname = path.extname.replace('.js', '.min.js')
		  }))
		  .pipe(gulp.dest(fpath))
			.pipe(ugly(uglyOptions))
			.pipe(gulp.dest(fpath))
	})

})

gulp.task('watch',  function () {

	watch(cssFolder + '/*.styl', function() {
		runSequence('stylus')
	})

	watch(jsFolder + '/*.dev.js', function() {
		runSequence('ugly')
	})

})

gulp.task('default', ['watch'])
gulp.task('dist', function() {
	runSequence('stylus', 'ugly')
})