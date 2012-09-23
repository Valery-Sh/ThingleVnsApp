define(function(require) {
    var blockHtml = require('text!tpl/things/show/comments.html'),
        formHtml = require('text!tpl/things/show/comments/form.html'),
        listHtml = require('text!tpl/things/show/comments/list.html'),
        DateHelper = require('helpers/date'),
        TextHelper = require('helpers/text'),
        Comment = App.Models.Comment,
        Comments = App.Collections.Comments;

    return Backbone.View.extend({
        id: 'comments',
        navigation: "Comments",
        blockTemplate: _.template(blockHtml),
        formTemplate: _.template(formHtml),
        listTemplate: _.template(listHtml),
        events: {
            'focusin .comment-new textarea': '_extendTextArea',
            'click .comment-new .close': '_collapseTextArea',
            'submit #add-comment-form': '_onFormSubmit'
        },

        initialize: function() {
            this.$el = $('#' + this.id);
            this.el = this.$el[0];
            this._parent = this.options.parent;
            this._thing = this.options.thing;
            this._comments = new Comments(this._thing.get("_id"));
        },

        render: function() {
            this.$el.html(this.blockTemplate({
                title: this.navigation
            }));
            var self = this;
            App.currentUser.checkAuth(function () {
                self._displayForm();
            });
            this._displayList();
        },

        _displayForm: function () {
            $('#comments-form', this.$el).html(this.formTemplate({user: App.currentUser}));
            this.$form = $('form', this.$el);
            this.form = this.$form[0];
        },

        _displayList: function () {
            var self = this;
            this._comments.fetch({
                success: function (collection) {
                    self._putComments(collection);
                }
            });
        },

        _putComments: function (collection) {
            var data = _.extend({comments: collection.models, DateHelper: DateHelper}, TextHelper);
            $('#comments-list', this.$el).html(this.listTemplate(data))
            $('.scrollable', this.$el).scrollable();
        },

        _extendTextArea: function () {
            $('.comment-new', this.$el).removeClass('collapsed');
        },

        _collapseTextArea: function () {
            $('.comment-new', this.$el).addClass('collapsed');
            this.$form.find('textarea').val('');
        },

        _onFormSubmit: function () {
            var text = this.$form.find('textarea').val();
            var self = this;
            if (text) {
                var comment = new Comment({
                    text: text,
                    thing: this._thing.get("_id")
                });
                comment.save(null, {
                    success: function () {
                        var author = {
                            _id: App.currentUser.get('_id'),
                            firstName: App.currentUser.get('firstName'),
                            lastName: App.currentUser.get('lastName')
                        };
                        comment.set('author', author);
                        self._comments.unshift(comment);
                        self._putComments(self._comments);
                    }
                });
                this._collapseTextArea();
            }
            return false;
        }
    });
});