define(function() {

    var defaultMeta = {
        title : document.title,
        description : $('meta[name=description]').attr("content"),
        keywords : $('meta[name=keywords]').attr("content"),
        robots : $('meta[name=robots]').attr("content")
    }

    function update(meta) {
        var title = (meta.title && (meta.title.slice(0, 8) == "Thingle " || meta.title.slice(meta.title.length - 8) == " Thingle" ? meta.title
                : meta.title + " - Thingle"))
                || "Thingle";
        var description = meta.description || "";
        var keywords = (meta.keywords && meta.keywords instanceof Array && meta.keywords.join(","))
                || meta.keywords || "";
        var robots = meta.robots || "";

        document.title = title;
        $('meta[name=description]').attr("content", description);
        $('meta[name=keywords]').attr("content", keywords);
        $('meta[name=robots]').attr("content", robots);
    }

    App.on("meta:reset", function() {
        update(defaultMeta);
    });

    App.on("meta:change", function(meta) {
        update(meta);
    });
});