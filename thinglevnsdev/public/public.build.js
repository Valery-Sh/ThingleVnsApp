module.exports = {
    src : 'public',
    dist : 'dist/public',
    include : [
            /^index\.html$/, /^bookmarklet\.html$/, /^js\/app\.js$/
    ],
    replace : [
            [
                    /href="(css\/\w+\.css)"/g, 'href="' + global.build.version + '/$1"'
            ],
            [
                    /href="(\w+\.ico)"/g, 'href="' + global.build.version + '/$1"'
            ],
            [
                    /src="(js\/[\w-\/]+\.js)"/g, 'src="' + global.build.version + '/$1"'
            ],
            [
                    /src="(tmp\/[\w-]+\.jpg)"/g, 'src="' + global.build.version + '/$1"'
            ],
            [
                    /data-main="js\/app"/g, 'data-main="' + global.build.version + '/js/app"'
            ],
            [
                    /require\.config\({baseUrl:"\/js"/,
                    'require\.config\({baseUrl:"/' + global.build.version + '/js"'
            ]
    ]
};