/** Grid Model */
App.Models.Grid = Backbone.Model.extend({
    searchTerm:'',
    sort:null,
    items:null,
    cfg:{

    },

    initialize:function () {
        var ego = this;
        //this.set('items', []);
        //    this.items = new Backbone.Collection;
        this.items = new ThingieApp.Models.ThingieCollection;
        this.items.parse = function (resp) {
            return ego.massageApiData(resp);
        };
        return this;
    },


    requestData:function (opts, callback) {

    },


    load:function (data) {
        console.log('loading');

        var ego = this;
        if (App.cfg.mockdata) {
            data = mockthingies;
        }
        if (data) {
            ego.items.reset(ego.massageApiData(data));
            console.log(ego.items);
        } else {
            ego.items.fetch({
                success:function (collection) {
                    console.log(collection);
                }
            });
        }
    },
    massageApiData:function (apiData) {
        return _.map(apiData, function (v, k, l) {

            return {
                authorName:v.createdUser || "NoName",
                authorThumb:_.find(v.pictures[0].sizes,
                    function (pic) {
                        return pic.name == "thumb";
                    }).url,
                imgUrl:_.find(v.pictures[0].sizes,
                    function (pic) {
                        return pic.name == "medium";
                    }).url,
                srcWidth:null,
                srcHeight:null,
                dispWidth:null,
                dispHeight:null,

                title:v.title || "No Title",
                desc:v.description || "No Description"
            };
        });
    }

});

App.Views.GridView = Backbone.View.extend({

    el:'#main',
    tmpl:'#grid-template',
    partials:["thingie"],
    rendered:null,
    subViews:{},

    events:{
        "click .action":"actionDispatcher"
    },

    initialize:function () {
        var ego = this;

        _.each(this.partials, function (partial) {
            Handlebars.registerPartial(partial, $("#" + partial + "-template").html())
        });
        ego.tmpl = Handlebars.compile($(ego.tmpl).html());


        this.model = new App.Models.Grid();
        ThingieApp.bindTo(ego.model.items, 'reset', this.normalizeItems, ego);
        ThingieApp.vent.bind("grid:ready", ego.renderGrid, ego);
        this.model.load();

        ThingieApp.vent.bind("grid:attachEvents", ego.attachEvents, ego);

        return this;
    },

    normalizeItems:function () {
        console.log('normalizing');
        this.resizeAll();
        this.optimizeGrid(App.cfg.maxImgW, App.cfg.space, App.cfg.steps);
        ThingieApp.vent.trigger("grid:ready");
    },


    attachEvents:function () {
        console.log('attaching Events');
        var ego = this;
        ThingieApp.vent.bind("grid:applyMasonry", ego.applyMasonry, ego)
        if (App.cfg.masonry) {
            ego.applyMasonry($('#main>ul'));
        }

        $('img.lazy').lazyload({
            event:"scrollstop",
            effect:"fadeIn",
            skip_invisible:false,
            threshold:300
        });

        $('.item a[rel="gallery"]').click(function (e) {
            e.preventDefault();
        });

    },

    applyMasonry:function (con, cfg) {
        cfg = cfg || {};
        var defcfg = App.cfg.masonryCfg;

        _.defaults(cfg, defcfg);
        console.log(cfg);
        var $con = $(con);
        $con.hasClass('masonry') ? con.masonry() : $con.masonry(cfg);
    },
    showGrid:function () {
        var ego = this;
        console.log('Show Grid');

        //Render Thingies
        $('#main').append(ego.rendered);
        ThingieApp.vent.trigger('grid:rendered');

        //Due to the lack of height data, the UI needs a timeout to allow it to compose itself
        setTimeout(function () {
            ThingieApp.vent.trigger("grid:attachEvents");
        }, 350);

    },
    renderGrid:function () {
        var ego = this;

        var thingies = ego.model.items,
            tsorted;

        if (App.cfg.sortW) {
            thingies = _.sortBy(thingies, function (t) {
                return t.dispWidth;
            });
        }

        if (thingies.length) {
            //Render Thingies
            ego.rendered = ego.tmpl({
                thingies:thingies.toJSON()
            });
        } else {
            ego.rendered = "<h1 style='text-align:center;'>No Thingles loaded?!</h1>";
        }
        ego.showGrid();

    },

    render:function () {

        _.each(this.subViews, function (subView) {
            subView.render();
        });

        if (App.cfg.interstitialmask) {
            $('#main').addClass('interstitial-mask');
        }
        if (App.cfg.menuslide) {
            $('#main').addClass('menuslide');
        }


    },
    getRenderedSize:function (data) {
        var ego = this;
        var tEl = $(ego.tmpl({
            thingies:[data]
        })).appendTo('body'),
            fc = tEl.find('.item:first-child'),
            bw = fc.outerWidth(),
            cm = (fc.outerWidth(true) - bw) / 2;
        tEl.remove();
        return {
            trueW:bw,
            currMargin:cm
        };

    },
    calcSizes:function (maxImgW, space, steps) {
        steps = steps || 2;
        var iDim = {},
            mCfg = {},
            nMargin = space / 2,
            mock = {
                srcWidth:maxImgW,
                dispWidth:maxImgW
            };

        iDim.maxDim = this.getRenderedSize(mock);
        iDim.decoW = iDim.maxDim.trueW - maxImgW;


        mCfg.gutterWidth = space;
        mCfg.colWidth = iDim.maxDim.trueW / steps;

        var stepsDims = []
        _(steps).times(function (step) {
            var sDim = {};
            step = step + 1;
            sDim.imgW = (maxImgW / step) - (((iDim.decoW) / 2 + (space / 2)) * (step - 1));
            console.log(sDim);
            stepsDims.push(sDim);

        });
        iDim.stepsDims = stepsDims;
        iDim.colWidth = _.last(stepsDims).imgW + iDim.decoW; //+ (space /2);//(iDim.maxDim.trueW / steps) - (space / 2);

        return iDim;
    },
    steppedResize:function (thingies, stepsDims) {
        var stepDim = {},
            ego = this,
            srcW, srcH, dispW;
        thingies.each(function (thingie) {
            srcW = thingie.get("dispWidth"), srcH = thingie.get("dispHeight"), dispW = null;

            stepDim = _.find(stepsDims, function (step) {
                return srcW >= step.imgW
            });

            stepDim = stepDim || _.last(stepsDims);

            ego.setWidth(thingie, stepDim.imgW);

        });

    },
    optimizeGrid:function (maxImgW, space, steps) {
        var iDim = {},
            ego = this;
        steps = steps || 2;

        iDim = App.cfg.iDims = this.calcSizes(maxImgW, space, steps);

        this.steppedResize(this.model.items, iDim.stepsDims);

        App.cfg.masonryCfg.columnWidth = iDim.colWidth;
        App.cfg.masonryCfg.gutterWidth = space;

        $('.grid li.item').simplecss('margin-top: ' + space + 'px;');
    },

    getRand:function (min, max) {
        return min + Math.floor(Math.random() * (max - min));
    },

    setWidth:function (thingie, dispW) {
        console.log(thingie);
        if (dispW) {
            var aspect = thingie.get("srcWidth") / thingie.get("srcHeight");
            thingie.set("aspect", aspect);
            thingie.set("dispWidth", dispW);
            //thingie.dispHeight = dispW / aspect;
        }
        return thingie;
    },

    resizeAll:function () {
        console.log('resizing');
        var acfg = App.cfg,
            ego = this;

        if (acfg.randomW) {
            var minW = acfg.minW,
                maxW = acfg.maxW;

            ego.model.items.each(function (item) {
                this.setWidth(item, this.getRand(minW, maxW));
            }, this);
        }

    },

    actionDispatcher:function (e) {
        console.log(e);
    }


});