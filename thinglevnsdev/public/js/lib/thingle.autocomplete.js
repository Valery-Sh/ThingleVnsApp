(function ($) {
    var _keys = {
        UP:38,
        DOWN:40,
        ENTER:13,
        UC_Z:90,
        DIGIT_0:48,
        BACKSPACE:8
    };

    function AC(options) {
        var self = this;

        this.options = _.defaults(options, {
            dropdownClass:'combo-list',
            param:'name',
            searchParam:'q'
        });

        this.$input = $(this.options.input);

        this.$input
            .attr('autocomplete', 'off')
            .bind({
                keydown:function (e) {
                    self._moveSel(e);
                },
                keyup:function (e) {
                    self._keyup(e)
                },
                blur:function (e) {
                    self._blur(e)
                }
            })
        ;

        this.$dropdown = $('<ul class="' + this.options.dropdownClass + '" />');

        var pos = this.$input.offset();
        this.$dropdown.hide().appendTo('body');

        this._runningRequest = null;

        this.$dropdown
            .on('click mousedown', 'li', function (e) {
                self._clickSelection(e);
            })
            .on('mouseover', 'li', function () {
                $(this).addClass('hover')
            })
            .on('mouseout', 'li', function () {
                $(this).removeClass('hover')
            })
        ;
    }

    AC.prototype._keyup = function (e) {
        e.preventDefault();

        if ((e.which > _keys.UC_Z || e.which < _keys.DIGIT_0) && (e.which != _keys.BACKSPACE)) {
            return;
        }

        this.pull();
    };

    AC.prototype._blur = function (e) {
        this.$dropdown.hide();
    };

    AC.prototype._moveSel = function (e) {
        if (!this.$dropdown.is(':visible')) return;

        var key = e.which,
            $selected = $('li.hover', this.$dropdown),
            $new_selected = $();

        switch (key) {
            case _keys.DOWN:
                e.preventDefault();
                $new_selected = $selected.length == 0 ? $('li:first', this.$dropdown) : $selected.next();
                break;
            case _keys.UP:
                e.preventDefault();
                $new_selected = $selected.prev();
                break;
            case _keys.ENTER:
                e.preventDefault();
                $selected.click();
                break;
        }

        if ($new_selected.length > 0) {
            $selected.mouseout();
            $new_selected.mouseover();
        }

    };

    AC.prototype._showDropdown = function () {
        var pos = this.$input.offset();
        this.$dropdown.css({
            position:'absolute',
            width:this.$input.width() + parseInt(this.$input.css('padding-right')) + parseInt(this.$input.css('padding-left')),
            left:pos.left,
            top:pos.top + this.$input.height() + parseInt(this.$input.css('padding-bottom')) + parseInt(this.$input.css('padding-top'))
        })
            .show()
        ;
    };

    AC.prototype._clickSelection = function (e) {
        this.$input.val($(e.target).text());
        this.$dropdown.hide();
    };

    AC.prototype.pull = function () {
        var self = this;

        this.fetch(function (res) {
            self.$dropdown.empty();

            _.each(res, function (doc) {
                var text = doc.get(self.options.param).replace(self.$input.val(), '<strong>$&</strong>');
                self.$dropdown.append($('<li />').html(text));
            });

            self._showDropdown();
        });
    };

    AC.prototype.fetch = function (cb) {
        var self = this,
            params = {},
            term = params[this.options.searchParam] = this.$input.val();

        if (term == '') return;

        if (!this.options.collection) throw 'Collection was not set';

        if (this._runningRequest !== null) this._runningRequest.abort();


        this._runningRequest = this.options.collection.fetch({
            data:params,
            success:function (collection, response) {
                self._runningRequest = null;

                if (typeof cb == 'function') cb(collection.models);
            }
        });
    };


    $.fn.autocomplete = function (options) {
        if (typeof $(this).data('autocomplete') == 'undefined') {
            options.input = this;
            $(this).data('autocomplete', new AC(options));
        }

        return this;
    };
})(jQuery);