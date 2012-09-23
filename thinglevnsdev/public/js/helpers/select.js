define(['lib/jquery.combobox'], function(combobox) {
    return {
        customize:function (container) {
            $('select', $(container)).each(function () {
                var select = $(this),
                    list_index = $('select').index(select);

                if (!select.hasClass('with-add-line')) {
                    select.combobox({
                        height:38
                    })
                } else {
                    select.combobox({
                        height:38
                    }).bind('before_show',
                        function () {
                            var combo_list = $('body').children('.combo-list').eq(list_index);
                            if (combo_list.find('.new-deck-field').length <= 0) {
                                combo_list.append('<li><div class="inline new-deck-field">' +
                                    '<input type="text">' +
                                    '<button class="btn btn-primary">Create</button>' +
                                    '</div></li>')
                                    .addClass('bigscroll');
                            }
                        })
                        // .bind('before_hide', function () {
                        //     var combo_list = $('body').children('.combo-list').eq(list_index);
                        //     combo_list.children('li:last').remove();
                        // });
                }
            });
        }
    };
});