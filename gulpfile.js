const {src, dest, parallel, watch, series} = require('gulp')
const sass = require('gulp-sass')
const notify = require('gulp-notify')
const sourcemaps = require('gulp-sourcemaps')
const rename = require('gulp-rename')
const autoprefixer = require('gulp-autoprefixer')
const cleanCSS = require('gulp-clean-css')
const browserSync = require('browser-sync').create()
const fileInclude = require('gulp-file-include')
const svgSprite = require('gulp-svg-sprite')
const ttf2woff = require('gulp-ttf2woff')
const ttf2woff2 = require('gulp-ttf2woff2')
const webpack = require('webpack')
const webpackStream = require('webpack-stream')
const uglify = require('gulp-uglify-es').default

// node module
const fs = require('fs')
const del = require('del')

//build
const tinypngFree = require('gulp-tinypng-free');

//deploy
const ghPages = require('gulp-gh-pages');

// handler styles
const styles = () => {
    return src('./src/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: 'expanded'
        })).on('error', notify.onError())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(autoprefixer({
            cascade: false,
        }))
        .pipe(cleanCSS({
            level: 2
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(dest('./app/css/'))
        .pipe(browserSync.stream())
}

//html template
const htmlInclude = () => {
    return src(['./src/index.html'])
        .pipe(fileInclude({
            prefix: '@',
            basepath: '@file'
        }))
        .pipe(dest('./app'))
        .pipe(browserSync.stream())
}

// images
const imgToApp = () => {
    return src(['./src/img/**.jpg', './src/img/**.png', './src/img/**.jpeg'])
        .pipe(dest('./app/img'))
}

//svg sprite
const svgSprites = () => {
    return src('./src/img/**.svg')
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../sprite.svg'
                }
            }
        }))
        .pipe(dest('./app/img'))
}

const resource = () => {
    return src('./src/resource/**')
            .pipe(dest('./app'))
}

//fonts
const fonts = () => {
    src('./src/fonts/**.ttf')
        .pipe(ttf2woff())
        .pipe(dest('./app/fonts'))

    return src('./src/fonts/**.ttf')
        .pipe(ttf2woff2())
        .pipe(dest('./app/fonts'))
}

const cb = () => {}

let srcFonts = './src/scss/fonts/module.scss';
let appFonts = './app/fonts/';

const fontsStyle = (done) => {
    let file_content = fs.readFileSync(srcFonts);

    fs.writeFile(srcFonts, '', cb);
    fs.readdir(appFonts, function (err, items) {

        if (items) {
            let c_fontname;
            for (var i = 0; i < items.length; i++) {
                let fontname = items[i].split('.');
                fontname = fontname[0];
                if (c_fontname != fontname) {
                    fs.appendFile(srcFonts, '@import \'fonts\';\n @include font-face("' + fontname + '", "' + fontname + '", 400);\r\n', cb);
                }
                c_fontname = fontname;
            }
        }
    })

    done();
}

// cleaner
const clean = () => {
    return del(['./app'])
}


//webpack streaming
const scripts = () => {
    return src('./src/js/main.js')
        .pipe(webpackStream({
            output: {
                filename: 'main.js'
            },
            module: {
                rules: [
                    {
                        test: /\.m?js$/,
                        exclude: /node_modules/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    ['@babel/preset-env', { targets: "defaults" }]
                                ]
                            }
                        }
                    }
                ]
            }
        }))
        .pipe(sourcemaps.init())
        .pipe(uglify().on('error', notify.onError()))
        .pipe(sourcemaps.write('.'))
        .pipe(dest('./app/js'))
        .pipe(browserSync.stream())
}

//watching
const watchFiles = () => {
   browserSync.init({
        server: {
            baseDir: "./app"
        },

       tunnel: true,
       open: 'external'
    });

    watch('./src/scss/**/*.scss', styles)
    watch('./src/index.html', htmlInclude)
    watch('./src/img/**.jpg', imgToApp)
    watch('./src/img/**.png', imgToApp)
    watch('./src/img/**.jpeg', imgToApp)
    watch('./src/img/**.svg', svgSprites)
    watch('./src/resource/**', resource)
    watch('./src/fonts/**.ttf', fonts)
    watch('./src/fonts/**.ttf', fontsStyle)
    watch('./src/js/**/*.js', scripts)
}

//exports
exports.styles = styles
exports.watchFiles = watchFiles
exports.default = series(clean, parallel( htmlInclude, scripts, fonts, imgToApp, svgSprites, resource), fontsStyle, styles, watchFiles)

const tinypng = () => {
    return src(['./src/img/**.jpeg', './src/img/**.jpg', './src/img/**.png'])
        .pipe(tinypngFree())
        .pipe(dest('./app/img/'))
}

const stylesBuild = () => {
    return src('./src/scss/**/*.scss')
        .pipe(sass({
            outputStyle: 'expanded'
        })).on('error', notify.onError())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(autoprefixer({
            cascade: false,
        }))
        .pipe(cleanCSS({
            level: 2
        }))
        .pipe(dest('./app/css/'))

}

const scriptsBuild = () => {
    return src('./src/js/main.js')
        .pipe(webpackStream({
            output: {
                filename: 'main.js'
            },
            module: {
                rules: [
                    {
                        test: /\.m?js$/,
                        exclude: /node_modules/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: [
                                    ['@babel/preset-env', { targets: "defaults" }]
                                ]
                            }
                        }
                    }
                ]
            }
        }))
        .pipe(uglify().on('error', notify.onError()))
        .pipe(dest('./app/js'))
}

exports.build = series(clean, parallel( htmlInclude, scriptsBuild, fonts, imgToApp, tinypng, svgSprites, resource), fontsStyle, stylesBuild, watchFiles)

// deploy to Github
const deploy = () => {
    return src('./app/**/*')
            .pipe(ghPages({
                remoteUrl: 'https://github.com/DRyzhkovProd/Gulp.git',
                branch: 'build'
            }))
}

exports.deploy = deploy