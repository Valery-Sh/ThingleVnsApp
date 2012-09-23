define(function() {

    var dfd = $.Deferred();
    var apiKey = App.Config.get('gmaps');
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "http://maps.googleapis.com/maps/api/js?" + (apiKey ? "key=" + apiKey + "&" : "")
            + "callback=gMapsApiCB&sensor=false&libraries=places";
    window.gMapsApiCB = function() {
        dfd.resolve();
    }
    document.body.appendChild(script);
    return dfd;
});
