module.exports = {
    src : 'config',
    dist : 'dist/config',
    include : [
        /^build-info\.js$/
    ],
    replace : [
        [
                /version\s*:\s*''/, 'version : "' + global.build.version + '"'
        ]
    ]
};