define(function() {

    if (App.Config.get('ga')) {
        // load GA script
        var ga = document.createElement('script');
        ga.type = 'text/javascript';
        ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www')
                + '.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(ga, s);

        // set tracking code
        window._gaq = window._gaq || [];
        window._gaq.push([ '_setAccount', App.Config.get('ga') ]);

        // track outbound links
        $(document).on("click",
                "a[href*='http://']:not([href*='" + window.location.hostname + "'])", function() {
                    window._gaq.push([ '_trackEvent', 'outbound_links', 'click', this.href ]);
                });

    }
    
    // see /public/js/backbone-override.js for the tracking implementation
});
