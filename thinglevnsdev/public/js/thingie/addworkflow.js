/** Add workflow popup UI */
ThingieApp.AddWorkflow = (function(ThingieApp, Backbone, $) {
  var AddWorkflow = {};
  var WorkflowModel = Backbone.Model.extend({});
  var AddWorkflowLayout = Backbone.Marionette.Layout.extend({

    template: "#addworkflow-template",
    prefix: "addworkflow:",
    model: null,
    regions: {
      main: "#addModal"
    },

    events: {
      "click .action": "clickActionDispatcher"
    },

    clickActionDispatcher: function(e){
      var ego = this, ev,
          $t = $(e.currentTarget),
          ac = $t.attr("ac");

      if (ac){
        ev = ego.prefix + ac;
        console.log(ev);
        ThingieApp.vent.trigger(ego.prefix + ac);
      }
    },

    initialize: function() {
      if(!this.model){
        this.model = new WorkflowModel({"header":"ADD"});
      }

      this.attachEvents();

    },
    attachEvents: function(){
      var ego = this;
      ThingieApp.vent.bind("addworkflow:createThing", ego.createThing,ego);
      ThingieApp.vent.bind("addworkflow:createDeck", ego.createDeck,ego);

     },
     createThing: function(){
       var ego = this;
       ego.main.show(new ThingieApp.upload({workflowmodel:ego.model, state:"createThing"}));


     },
     createDeck: function(){

     }



  });

  var workflow = Backbone.Marionette.View.extend({
    template: "#createthingieview-template",
    initializer:function(){
      UploadParameters = Backbone.Model.extend({
            url: '/api/things/pictures/upload'
        });

    }
  });



  var UploadParameters = Backbone.Model.extend({
            url: '/api/things/pictures/upload'
      });

  ThingieApp.upload = Backbone.Marionette.View.extend({
        auth: true,

        id: 'new-thing',
        uploadForm: 'form#s3-upload',
        thingForm: 'form#thing-form',

        events: {
            'click a.upload-btn': 'upload',
            'click a.submit-btn': 'save'
        },

        mimetypes: {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
        },
        upload: function() {
            var filename = $('input[type=file]', this.uploadForm).val();

            if (!filename) return alert('Choose the file to upload');

            var ext = filename.match(/[^\.]+$/)[0].toLowerCase(),
                self = this;

            this.filename = this.params.get('folder') + '/' + this.params.get('uid') + '.' + ext;
            $('input[name=key]', this.uploadForm).val(this.filename);

            var content_type = this.mimetypes[ext];
            if (!content_type) return alert('Wrong image type!');
            $('input[name="Content-Type"]', this.uploadForm).val(content_type);


            $(this.uploadForm).ajaxSubmit({
                success: function(response){
                    console.log(response);
                },
                complete: function(response, textStatus, errorThrown){
                    var img = $('<img />').attr({
                        src: self.params.get('action') + self.filename
                    });

                    img.error(function(){
                        alert('There was error while uploading your image. Reload the page and try again.');
                    });

                    img.load(function() {
                        $('.image', self.el).empty().append(this);

                        if ($(this).width() > 200) $(this).attr('width', 200);
                        self.showThingForm();
                    });
                }
            });
        },

        showThingForm: function() {
            $('.thing', this.el).show();
            this.thing = new ThingieApp.Models.Thingie();

            this.thing.set('pictures', [{fileName: this.filename}]);
        },

        save: function() {
            this.thing.set({
                title: $('[name=title]', this.thingForm).val(),
                description: $('[name=description]', this.thingForm).val(),
            });

            this.thing.save({}, {
                success: function(model, response){
                    alert('Saved!');
                }
            });
        },

        template: "#createthingieview-template",
        initialize: function(){

          this.template = Handlebars.compile($(this.template).html());
        },

        render: function() {
            var self = this;
            this.params = new UploadParameters()

            this.params.fetch({success: function(model, response){
                $(self.el).html(self.template(
                    model.toJSON()
                ));

                $(self.uploadForm).ajaxForm();
            }});
        }
    });

  ThingieApp.addInitializer(function() {
    ThingieApp.vent.bind("addworkflow:showPopup",
    function(){
      console.log('showPopup');
      var addView = new AddWorkflowLayout();
      ThingieApp.modal.show(addView);
    });
  });

  return AddWorkflow;
})(ThingieApp, Backbone, $);

