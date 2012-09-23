var fs = require('fs'),
    ejs = require('ejs');

module.exports = function (params) {
    var text = (params.sender.firstName || "User") + " " + (params.sender.lastName || "") + " collected your Thingle.",
        activity = (params.sender.firstName || "User") + " " + (params.sender.lastName || "") + " <b>collected</b> your Thingle.",
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