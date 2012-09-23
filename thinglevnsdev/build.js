var fs = require('fs');
var wrench = require('wrench');

function clean(dir) {
    if (dir.charAt(0) == '/') throw "disallow absolute path";
    wrench.rmdirSyncRecursive(dir);
}

function copy(src, dest, filter, process) {

    // create dest dir
    wrench.mkdirSyncRecursive(dest);

    var files = wrench.readdirSyncRecursive(src);
    for ( var i = 0; i < files.length; i++) {
        var filePath = files[i];
        if (fs.statSync(src + '/' + filePath).isFile()) {

            if (filter(filePath)) {
                var destFilePath = dest + '/' + filePath;

                // create file dir
                var destDirTokens = destFilePath.split('/')
                destDirTokens.pop();
                wrench.mkdirSyncRecursive(destDirTokens.join('/'));

                // process data
                var data = fs.readFileSync(src + '/' + filePath) + '';
                if (process instanceof Function) data = process(data);

                // copy data
                fs.writeFileSync(destFilePath, data);
            }
        }
    }
}

function process(src, filter, process) {
    var files = wrench.readdirSyncRecursive(src);
    for ( var i = 0; i < files.length; i++) {
        var filePath = files[i];
        if (fs.statSync(src + '/' + filePath).isFile()) {

            if (filter(filePath)) {
                var srcFilePath = src + '/' + filePath;

                // process data
                var data = fs.readFileSync(srcFilePath) + '';
                data = process(data);

                // write data
                fs.writeFileSync(srcFilePath, data);
            }
        }
    }
}

function filter(path, includes) {
    for (i = 0; i < includes.length; i++) {
        var regex = includes[i];
        if (regex.exec(path)) return true;
    }
    return false;
}

function replace(data, replaces) {
    for (i = 0; i < replaces.length; i++) {
        var regex = replaces[i][0];
        var replacement = replaces[i][1];
        data = data.replace(regex, replacement);
    }
    return data;
}

var build = module.exports = {
    clean : function(options) {
        clean(options.dist);
    },
    copy : function(options) {
        copy(options.src, options.dist, function(path) {
            return filter(path, options.include);
        });
    },
    replace : function(options) {
        process(options.dist, function(path) {
            return filter(path, options.include);
        }, function(data) {
            return replace(data, options.replace);
        });
    }
}

var args = global.process.argv;
if (args) {
    global.build = {};
    var optionsModule = null;
    var action = null;
    for ( var i = 0; i < args.length; i++) {
        if (args[i] == '-v') {
            global.build.version = args[i + 1];
        } else if (args[i] == '-o') {
            optionsModule = args[i + 1];
            action = args[i + 2];
            break;
        }
    }

    if (optionsModule && action) {
        var options = require(optionsModule);
        build[action](options);
    }
}