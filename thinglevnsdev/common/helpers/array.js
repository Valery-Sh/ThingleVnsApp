module.exports = {
    unique: function (arr) {
        var unique = {};
        for (var i = 0; i < arr.length; i++) unique[arr[i]] = arr[i];
        var newValues = [];
        for (var i in unique) newValues.push(i);
        return newValues;
    }
};