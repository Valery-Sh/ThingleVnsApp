ThingieApp.Routing = (function(ThingieApp, Backbone){
  var Routing = {};

  // Public API
  // ----------

  // The `showRoute` method is a private method used to update the
  // url's hash fragment route. It accepts a base route and an
  // unlimited number of optional parameters for the route:
  // `showRoute("foo", "bar", "baz", "etc");`.
  Routing.showRoute = function(){
    var route = getRoutePath(arguments);
    Backbone.history.navigate(route, false);
  };

  // Helper Methods
  // --------------

  // Creates a proper route based on the `routeParts`
  // that are passed to it.
  var getRoutePath = function(routeParts){
    var base = routeParts[0];
    var length = routeParts.length;
    var route = base;

    if (length > 1){
      for(var i = 1; i < length; i++) {
        var arg = routeParts[i];
        if (arg){
          route = route + "/" + arg;
        }
      }
    }

    return route;
  }

  return Routing;
})(ThingieApp, Backbone);





ThingieApp.Routing.GridRouting = (function(BBCloneMail, Backbone){
  var GridRouting = {};

  GridRouting.Router = Backbone.Marionette.AppRouter.extend({
    appRoutes: {
        ""             : "index",
        "search/:term" : "search"
    }
  });


  var initialController = {
    index: function() {
      ThingieApp.layout.showMock();//App.MainView.render();
    },
    search: function( term ) {
      App.MainView.fetch( term, {emptyFirst:true} );
    }
  };

  ThingieApp.addInitializer(function(){
    GridRouting.router = new GridRouting.Router({
      controller: initialController //ThingieApp.GridApp
    });
  });

  return GridRouting;
})(ThingieApp, Backbone);
