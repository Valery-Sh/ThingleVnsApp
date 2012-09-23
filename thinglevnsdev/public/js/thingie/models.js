
var tm = ThingieApp.Models = ThingieApp.Models || {};

tm.Thingie = Backbone.Model.extend({
  url: "/api/things"
});

tm.ThingieCollection = ThingieApp.Collection.extend({
  url: "/api/things",
  model: tm.Thingie

});


