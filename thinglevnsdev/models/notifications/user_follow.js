var fs = require('fs'),
    ejs = require('ejs');

module.exports = function (params) {
    var text = (params.sender.firstName || "User") + " " + (params.sender.lastName || "") + " started following you.",
        activity = (params.sender.firstName || "User") + " " + (params.sender.lastName || "") + " started <b>following</b> you.",
        htmlTplPath = global.approot + '/views/notification/' + params.type + '.html.ejs',
        str = fs.readFileSync(htmlTplPath, 'utf8'),
        html = ejs.render(str, params);

    return {
        text: text,
        html: html,
        activity: activity,
        user: params.user
    };
};