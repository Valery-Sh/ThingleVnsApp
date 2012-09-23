
var App = window.App = {

  Views:    {},
  Models:   {},
  Routers:  {},

  MainView: null,

/**
 * ?minW=130&maxW=480&interval=240&colWidth=240
 *
 * minW is set low to get a good population of small imgs
 * interval=240 ensures that the smallest img is 240
 *
 * These settings force just 2 sizes, 240w and 480w
 * this serves to minimize empty space and encourage 'nesting'
 */


  defaults : {
      sortW     : false,
      normalize : false, // This is whether image widths should be constrained by maxW and minW, only images outside those parameters are resized.
      randomW   : true, // This is whether all image widths should be randomized, using minW and maxW as bounds.

      minW      : 130,  // Minimum Width, used by normalize and randomW
      maxW      : 650,  // Maximum Width, used by normalize and randomW
      maxImgW   : 500,  // Max Img Width, used by grid optimization algo
      space     : 20,   //spacing between grid elements
      steps     : 2,    //sizing steps
      masonry   : true, // use masonry layout
      mockdata  : false,  // Use actual api call.
      css       : "",
      masonryCfg:{
        gutterWidth : 0,
        columnWidth  : 261,   // This is the width Masonry uses for its columns.
        isFitWidth: true
      }
    },
    cfg : {}
}, arr;


/** This is development only dirty-hack
 *  Allows passing app config settings via url params
 */
var wls = decodeURIComponent(window.location.search.replace('?',''));
_.each(wls.split('&'), function(v){
  arr = v.split('=');
  if(arr[0] != "css"){arr[1] = eval(arr[1]);} // Evil but ..
  console.log(arr[1]);
  App.cfg[arr[0]] = arr[1] /*|| true*/;
});

/** This is development only dirty-hack
 *  Allows saving app config settings to localStorage (kizzy)
 */
var save;
if( save = App.cfg.save ) { App.cfg.save = false; }
var cfgC = window.cfgCache = kizzy('cfg');
savedCfg = cfgC.get('prevCfg') || cfgC.set('prevCfg',App.defaults);
_.defaults(App.cfg, savedCfg);
_.defaults(App.cfg, App.defaults);
cfgC.set('currCfg', App.cfg);
console.log(App.cfg);
/** This is development only dirty-hack
 *  Allows setting CSS rules from App config
 */
if(App.cfg.css){
  simplestylesheet.allRules(App.cfg.css);
}
function saveCfg(cfg){cfgC.set('prevCfg', cfg || App.cfg);}

if(save){saveCfg();}

/**
 * Marionette; on-demand loading of Handlebars templates
 */
Backbone.Marionette.TemplateCache.loadTemplate = function(templateId, callback){
  var tmpId = "templates";//templateId.replace("#", "");
  var url = "/templates/" + tmpId + ".html";
  var promise = $.trafficCop(url);
  promise.done(function(templateFile){
    var tf = $(templateFile);
    var template = tf.find(templateId);
    callback.call(this, Handlebars.compile(template.html()));
  });
};

// Replace the default underscore.js templating with HandleBars templates.
Backbone.Marionette.Renderer.renderTemplate = function(template, data){
  var html = template(data);
  return html;
};

// Provide a guaranteed execution of a "reset" event for
// collections so I can find an item in the collection after
// the collection has been loaded.
ThingieApp.Collection = Backbone.Collection.extend({
  constructor: function(){
    var args = Array.prototype.slice.call(arguments);
    Backbone.Collection.prototype.constructor.apply(this, args);

    this.onResetCallbacks = new Backbone.Marionette.Callbacks();
    this.on("reset", this.runOnResetCallbacks, this);
  },

  onReset: function(callback){
    this.onResetCallbacks.add(callback);
  },

  runOnResetCallbacks: function(){
    this.onResetCallbacks.run(this, this);
  }
});

ThingieApp.ModalRegion = Backbone.Marionette.Region.extend({
    el: "#modal",

    constructor: function(){
      _.bindAll(this);
      Backbone.Marionette.Region.prototype.constructor.apply(this, arguments);
      this.on("view:show", this.showModal, this);
    },

    getEl: function(selector){
      var $el = $(selector);
      $el.on("hidden", this.close);
      return $el;
    },

    showModal: function(view){
      view.on("close", this.hideModal, this);
      this.$el.modal('show');
    },

    hideModal: function(){
      this.$el.modal('hide');
    }
  });

