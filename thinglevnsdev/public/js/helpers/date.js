function fuzzyDate(date){
    var time_formats = [
        [60, 'just now', 1], // 60
        [120, '1 minute ago', '1 minute from now'], // 60*2
        [3600, 'minutes', 60], // 60*60, 60
        [7200, '1 hour ago', '1 hour from now'], // 60*60*2
        [86400, 'hours', 3600], // 60*60*24, 60*60
        [172800, 'yesterday', 'tomorrow'], // 60*60*24*2
        [604800, 'days', 86400], // 60*60*24*7, 60*60*24
        [1209600, 'last week', 'next week'], // 60*60*24*7*4*2
        [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
        [4838400, 'last month', 'next month'], // 60*60*24*7*4*2
        [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
        [58060800, 'last year', 'next year'], // 60*60*24*7*4*12*2
        [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
        [5806080000, 'last century', 'next century'], // 60*60*24*7*4*12*100*2
        [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
    ];
    var seconds = (new Date - date) / 1000;
    var token = 'ago', list_choice = 1;
    if (seconds < 0) {
        seconds = Math.abs(seconds);
        token = 'from now';
        list_choice = 2;
    }
    var i = 0, format;
    while (format = time_formats[i++])
        if (seconds < format[0]) {
            if (typeof format[2] == 'string')
                return format[list_choice];
            else
                return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
        }
    return time;
};
define({
    format: function (date, format) {
        var months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ];
        var days = [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday'

        ];

        date = typeof date != "object" ? new Date(date) : date;
        if (typeof format != 'string') {
            format = "%m/%d/%y";
        }

        var patterns = {};
        patterns['j'] = date.getDate();
        patterns['d'] = patterns['j'] < 10 ? "0"+patterns['j'] : patterns['j'];
        patterns['S'] = 'th';
        patterns['S'] = patterns['j'] == 1 ? 'st' : patterns['S'];
        patterns['S'] = patterns['j'] == 2 ? 'nd' : patterns['S'];
        patterns['S'] = patterns['j'] == 3 ? 'rd' : patterns['S'];
        patterns['F'] = months[date.getMonth()];
        patterns['n'] = date.getMonth()+1;
        patterns['m'] = patterns['n'] < 10 ? "0"+patterns['n'] : patterns['n'];
        patterns['Y'] = date.getFullYear();
        patterns['y'] = (""+patterns['Y'])[2]+(""+patterns['Y'])[3];
        patterns['w'] = date.getDay();
        patterns['l'] = days[patterns['w']];
        patterns['G'] = date.getHours();
        patterns['H'] = patterns['G'] < 10 ? "0"+patterns['G'] : patterns['G'];
        patterns['a'] = patterns['G'] < 12 ? 'am' : 'pm';
        patterns['A'] = patterns['a'].toUpperCase();
        patterns['g'] = patterns['G'] - 12;
        patterns['g'] += patterns['g'] < 1 ? 12 : 0;
        patterns['h'] = patterns['g'] < 10 ? "0"+patterns['g'] : patterns['g'];
        patterns['i'] = date.getMinutes();
        patterns['i'] = patterns['i'] < 10 ? "0"+patterns['i'] : patterns['i'];
        patterns['s'] = date.getSeconds();
        patterns['s'] = patterns['s'] < 10 ? "0"+patterns['s'] : patterns['s'];
        patterns['u'] = date.getTime();
        patterns['U'] = Math.round(patterns['u'] / 1000);
        patterns['J'] = fuzzyDate(date);

        for (var key in patterns) {
            regex = new RegExp('%' + key, "g");
            format = format.replace(regex, patterns[key]);
        }

        return format;
    }
});