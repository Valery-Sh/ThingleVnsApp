define(function (require) {

    require('lib/bootstrap/bootstrap-modal');
    require('lib/bootstrap/bootstrap-transition');
    require('lib/jquery.jscrollpane.min');

    var SelectHelper = require("./select");

    return App.Helpers.ViewHelper.extend({
        shelf_scroll:null,
        events:{
            'click .shelf-toggle':'toggleShelf',
            'mouseenter .profile-item dd a':'hoverProfileDt',
            'mouseleave .profile-item dd a':'hoverProfileDt',
            // 'mouseenter .subnav':'hoverSubnav',
            // 'mouseleave .subnav':'closeSubnav',
            // 'mouseenter header nav li':'closeSubnav',
            // 'mouseenter #content':'closeSubnav',
            // 'mouseenter .b-deck .inner':'showScroll',
            // 'mouseleave .b-deck .inner':'hideScroll',
            // 'mouseenter #content .jspContainer':'showScroll',
            // 'mouseleave #content .jspContainer':'hideScroll',
            'click [data-toggle=modal]':'openPopup',
            'click #error': function(e){$(e.target).hide()}
        },

        initialize:function () {
            var self = this;
                // subnav_status = 0;

            App.on('unauthorized', function () {
                App.popup('login');
            });
            
            App.on('auth', function() {
                self.openShelf();
            });

            $("form#search-form", 'header').submit(function () {
                var input = $("input[name='search']", $(this));
                var query = input.val();
                if (query) {
                    input.val("");
                    App.router.navigate("?q=" + encodeURIComponent(query), {trigger:true});
                }
                return false;
            });

			$('.logo').click(function(){
								var el = this;
								window.location.href = ("http://" + location.host + "#") ;
							});


            // $('.things-item, .people-item, .filter-item, .about', 'header').mouseenter(function () {
            //     var el = this,
            //         sub_name = el.className.split('-')[0];
                
            //     self.showSubnav(el, '.'+sub_name+'-subnav');
            // });

            // $('.scroll-pane','#content').jScrollPane({
            //     autoReinitialise:true,
            //     mouseWheelSpeed:100
            // });

            // $(window).resize(function(){
            //     self.reinitContentScroll();
            // });

            SelectHelper.customize("body");

            this.$('#error').ajaxError(function(event, request){
                var popup = this;
                if (/*request.status != 0 && */request.status.toString()[0] != '5') return;
                $(this).empty()
                    .append('<h2>Oops</h2>')
                    .append('Something went wrong on our server. Please try again.')
                    .show()
                ;

                setTimeout(function() {
                    $(popup).hide();
                }, 5000);
            });
        },
        
        toggleShelf:function (open) {
            var self = this,
                shelf = $('#shelf'),
                shelfOpened = shelf.hasClass('opened'),
                toggle = $(open.target);
            
            if (shelf.is(':animated')) return false;
            if (open === shelfOpened) return false;
            
            var list = $('#things-list'),
                width = shelfOpened ? 0 :221;

            shelf.animate({
                width:width
            }, (App.isMobile ? 0 : 'fast'), 'linear', function () {
                shelf.toggleClass('opened');
                list.masonry && list.masonry('reload');
                $(window).resize();
            });

            $('.details-title, .scrollable-outer, .details-nav').each(function(){
                var fixed_elem = $(this);

                if (fixed_elem.css('position') == 'fixed') {
                    fixed_elem.css({
                        'right': parseInt(fixed_elem.css('right')) + (shelfOpened ? -221 : 221)
                    })
                }
            })

            toggle.toggleClass('opened');

            return false;
        },

        openShelf:function() {
            var self = this;
            self.toggleShelf(true);
        },
        
        // reinitContentScroll:function() {
        //     var wh = $(window).height();

        //     $('.scroll-pane','#content').height(wh - $('header').outerHeight());
        // },

        // showScroll:function (evt) {
        //     var el = $(evt.target).parents('.scroll-pane').eq(0);
        //     $('.jspDrag',el).stop(false, true).show();
        // },

        // hideScroll:function (evt) {
        //     var el = $(evt.target).parents('.scroll-pane').eq(0);
        //     $('.jspDrag',el).fadeOut("normal");
        // },

        // showSubnav:function (e, pname) {
        //     var subnav = $(pname);
        //     subnav_status = 1;

        //     subnav.css({
        //         top:$(e).offset().top,
        //         left:$(e).offset().left
        //     }).fadeIn("fast");
        // },

        // closeSubnav:function () {
        //     subnav_status = 0;
        //     setTimeout(function () {
        //         if (!subnav_status)
        //             $('.subnav:not(:animated)').fadeOut("fast")
        //     }, 100);
        // },

        // hoverSubnav:function () {
        //     subnav_status = 1;
        // },

        hoverProfileDt:function (e) {
            var target = $(e.target);
            target.parent().prev('dt').toggleClass('hover')
        },

        openPopup:function (e) {
            App.popup($(e.currentTarget).attr('href').replace('#popup-', ''));
        }
    });
});