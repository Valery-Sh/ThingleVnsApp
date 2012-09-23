/** Main UI */
(function(ThingieApp, Backbone, $) {
  var Layout = Backbone.Marionette.Layout.extend({

    template: "#layout-template",

    regions: {
      grid: "#main",
      shelf: "#rightpanel",
      topbar: "#topbar"
    },

    events: {
      "click a.fav": "addFave",
      "click a.thing-it": "repin",
      "click .action": "clickActionDispatcher"
    },

    clickActionDispatcher: function(e){
      var ego = this, ev,
          $t = $(e.currentTarget),
          ac = $t.attr("ac");

      if (ac){
        ev = ac;
        console.log(ev);
        ThingieApp.vent.trigger(ev);
      }
    },



    initialize: function() {

    },

    showMock: function(e) {
      this.subViews = {
        grid: new App.Views.GridView(),
        sideShelf: new App.Views.Shelf(),
        topBar: new App.Views.TopBar()
      };

      _.each(this.subViews, function(subView) {
        subView.render();
      });

    },



    addFave: function(e) {
      console.log(e);

    },

    repin: function(e) {
      console.log(e);

    }

  });

  // Initialize the application layout and when the layout has
  // been rendered and displayed, then start the rest of the
  // application
  ThingieApp.addInitializer(function() {
    // Render the layout and get it on the screen, first
    ThingieApp.layout = new Layout();

    ThingieApp.layout.on("show", function() {
      $('#thingie').removeClass('loading');

      ThingieApp.vent.trigger("layout:rendered");
    });

    ThingieApp.content.show(ThingieApp.layout);
  });


})(ThingieApp, Backbone, $);


/** For now we can let multiple components sit in the same file */

/** Shelf */
App.Models.Shelf = Backbone.Model.extend({
  highlights: null,
  decks: null,

  initialize: function() {
    this.set('decks', []);
    //    this.decks = new Backbone.Collection;
    return this;
  },

  mockData: function() {
    console.log('shelf mock');
    var ego = this,
        thingies = ThingieApp.layout.subViews.grid.model.items.toJSON(),
        tLength = thingies.length,
        item = null,
        decks = ego.get("decks");
    if (tLength) {
      _(20).times(function() {
        item = thingies[ThingieApp.layout.subViews.grid.getRand(0, tLength)];
        decks.push({
          coverImgUrl: item.imgUrl,
          name: item.title
        });
      });
    }
  }


}),

App.Views.Shelf = Backbone.View.extend({

  el: '#rightpanel',
  tmpl: '#shelf-template',
  partials: ['shelfdeck', 'shelfhighlights'],
  subViews: {},
  model: {},

  events: {
    "click .toggleshelf": "toggleShelf",
    "click .viewprofile": "showProfile",
    "click .createdeck": "showCreateDeck"
  },


  initialize: function() {
    var ego = this;
    _.each(this.partials, function(partial) {
      Handlebars.registerPartial(partial, $("#" + partial + "-template").html())
    });
    ego.tmpl = Handlebars.compile($(ego.tmpl).html());

    this.model = new App.Models.Shelf();

    this.subViews = {};
    //Just for mocking purposes
    ThingieApp.vent.bind('grid:rendered', function(){ego.render();});

    ThingieApp.vent.bind('shelf:toggle', ego.toggleShelf, ego);


  },

  render: function() {
    var ego = this;
    ego.model.mockData();
    var data = this.model.attributes || {};
    $(this.el).html(this.tmpl(data));

  },

  /** Toggle Show panel */
  toggleShelf: function(e) {
    $('#thingie').toggleClass('showright');
    setTimeout(function() {
      ThingieApp.vent.trigger("grid:applyMasonry", $(".masonry"));
    }, 350);

  },

  showProfile: function(e) {
    console.log(e);

  },

  showCreateDeck: function(e) {
    console.log(e);

  }

});


/** Top Bar */

App.Views.TopBar = Backbone.View.extend({

  el: '#topbar',
  tmpl: '#topbar-template',
  subViews: {},
  model: {},

  events: {
    "click .search": "showSearch",
    "click .invite": "showInvite",
    "click .add": "showAdd"
  },

  initialize: function() {
    var ego = this;

    this.subViews = {};

    ego.tmpl = Handlebars.compile($(ego.tmpl).html());
  },

  render: function() {
    var data = this.model.attributes || {};

    $(this.el).html(this.tmpl(data));
  },

  showSearch: function(e) {
    console.log(e);
  },

  showInvite: function(e) {
    console.log(e);
  },

  showAdd: function(e) {
    console.log(e);

  }
});


/** Super UserInterface */

App.Views.SU = Backbone.View.extend({

  el: 'body',
  tmpl: '#su-template',
  subViews: {},
  model: {},

  events: {
    "click .with .save": "doSave",
    "click .invite": "showInvite",
    "click .add": "showAdd"
  },

  initialize: function() {
    var ego = this;

    this.subViews = {};

    ego.tmpl = Handlebars.compile($(ego.tmpl).html());

    return this;

  },

  render: function() {
    var data = this.model.attributes || App.cfg;

    var dataStr = JSON.stringify(data);

    // regex
    var regex = /[{},]+(?=([^"]*"[^"]*")*[^"]*$)/gi;
    // the replace
    var final = dataStr.replace(regex, function(c) {
      // test the particular character being passed in
      if (c == "{" || c == "}" || c == ",") {
        return c + "\n";
      }
      return "\n" + c + "\n";
    });


    var content = this.tmpl({
      raw: data,
      json: final
    });

    $(this.el).find('#su-panel').remove();

    $(this.el).prepend(content);

    return this;
  },

  doSave: function(e) {
    var doEl = $(e.target),
        withEl = doEl.parents('.with'),
        rawdata = withEl.find('textarea').val(),
        data = JSON.parse(rawdata);

    saveCfg(data);
    console.log(data);


  },

  showInvite: function(e) {
    console.log(e);

  },

  showAdd: function(e) {
    console.log(e);

  }



});