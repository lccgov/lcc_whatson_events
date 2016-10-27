var gulp = require('gulp');
var syncy = require('syncy');
var sass = require('gulp-sass');
var notify = require('gulp-notify');
var spsync = require('gulp-spsync-creds').sync;
var settings = require('./settings.json');

//Sync assets to public folder excluding SASS files
gulp.task('sync:assets', (done) => {
    syncy(['app/assets/**/*', '!app/assets/sass/**'], './dist/_catalogs/masterpage/public', {
            ignoreInDest: '**/stylesheets/**',
            base: 'app/assets',
            updateAndDelete: true
        }).then(() => { 
            done();
    }).catch((err) => { done(err);})
});

//Sync lcc_frontend_toolkit to lcc_modules to be used for SASS partial compilation
gulp.task('sync:lcc_frontend_toolkit', ['sync:assets'], (done) => {
    syncy(['node_modules/lcc_frontend_toolkit/**'], 'lcc_modules/lcc_frontend_toolkit', {
            base: 'node_modules/lcc_frontend_toolkit',
            updateAndDelete: true
        }).then(() => { 
            done();
    }).catch((err) => { done(err);})
});

//Sync lcc_templates_sharepoint/assets to dist/_catalogs/masterpages/public
gulp.task('sync:lcc_templates_sharepoint_assets', ['sync:lcc_frontend_toolkit'], (done) => {
    syncy(['node_modules/lcc_templates_sharepoint/assets/**/*'], 'dist/_catalogs/masterpage/public', {
            base: 'node_modules/lcc_templates_sharepoint/assets',
            updateAndDelete: true
        }).then(() => { 
            done();
    }).catch((err) => { done(err);})
})

//Sync lcc_templates_sharepoint/views to dist/_catalogs/masterpages
gulp.task('sync:lcc_templates_sharepoint_views', ['sync:lcc_templates_sharepoint_assets'], (done) => {
    syncy(['node_modules/lcc_templates_sharepoint/views/*'], 'dist/_catalogs/masterpage', {
            base: 'node_modules/lcc_templates_sharepoint/views',
            updateAndDelete: false
        }).then(() => { 
            done();
    }).catch((err) => { done(err);})
})

//Compile SASS into the application CSS and copy to public folder
gulp.task('sass', ['sync:lcc_templates_sharepoint_views'], (done) => {
    return gulp.src('./app/assets/sass/**/*.scss', {base:'./app/assets/sass'})
      .pipe(sass({includePaths: ['./app/assets/sass',
            'lcc_modules/lcc_frontend_toolkit/stylesheets/']}).on('error', function (err) {
          notify({ title: 'SASS Task' }).write(err.line + ': ' + err.message);
          this.emit('end');
      }))
      .pipe(gulp.dest('./dist/_catalogs/masterpage/public/stylesheets'))
});

gulp.task('sp-upload', ['sass'], (done) => {
    gulp.src('./dist/**/*').pipe(spsync({
        "username": settings.username,
        "password": settings.password,
        "site": settings.siteUrl,
        "publish": true
    }));
});

gulp.task('default',  ['sync:assets', 'sync:lcc_frontend_toolkit', 'sync:lcc_templates_sharepoint_assets', 'sync:lcc_templates_sharepoint_views', 'sass', 'sp-upload']);