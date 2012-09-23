define([
        "maps", "text!tpl/things/show/map.html", "text!tpl/things/show/map/info.html",
        "text!tpl/things/show/map/edit.html"
], function(maps, html, infoHtml, editHtml) {

    var MARKER_ICON = "http://chart.googleapis.com/chart?chst=d_map_pin_letter_withshadow&chld={}|2A80C5|000000";
    var SELECTED_MARKER_ICON = "http://chart.googleapis.com/chart?chst=d_map_pin_letter_withshadow&chld={}|FF0000|000000";
        
    var EMPTY_LOCATION = {
        address : "",
        name : "",
        notes : ""
    }

    return Backbone.View.extend({
        id : 'map',
        events : {
            'click .edit' : '_openEdit',
            'click .close' : '_close',
            'click .map-resize' : '_resizeMap',
            'click .show' : '_showOnMap',
            'click .delete' : '_deleteLocation',
            'click .save' : '_saveLocation',
        },
        template : _.template(html),
        infoTemplate : _.template(infoHtml),
        editTemplate : _.template(editHtml),
        navigation : "Map",
        initialize : function() {
            this.$el = $('#' + this.id);
            this.el = this.$el[0];
            this._parent = this.options.parent;
            this._thing = this.options.thing;
            this._markers = new Array();
        },
        render : function() {
            var self = this;
            $.when(maps, this._loadLocations()).done(function() {
                self.$el.html(self.template({
                    locations : self._locations
                }));

                self.$el.find('.scroll-pane').jScrollPane();

                var map = self._renderMap();
                self._renderMarkers(map, self._locations);
            });
        },
        _loadLocations : function() {
            var self = this;
            var dfd = $.Deferred();
            this._thing.fetch({
                success : function(thing) {
                    self._locations = thing.get("locations") || new Array();
                    dfd.resolve();
                }
            });
            return dfd;
        },
        _renderMap : function(empty) {
            var self = this;
            var thingleIncNY = new google.maps.LatLng(40.7396534, -74.00642260000001);
            // render map
            this._map = new google.maps.Map($(".map", this.$el)[0], {
                scrollwheel: false,
                mapTypeId : google.maps.MapTypeId.ROADMAP,
                center : thingleIncNY,
                zoom : 12
            });
            // render Thingle Headquarter marker
            var marker = new google.maps.Marker({
                position : thingleIncNY,
                map : this._map
            });
            var infowindow = new google.maps.InfoWindow({
                content : "<h1>Thingle Inc</h1>" + "<p>1 Little West 12th Street, Suite 512"
                        + "<br>New York, NY 10014<br>US</p>"
            });
            google.maps.event.addListener(marker, 'click', function() {
                infowindow.open(self._map, marker);
            });
            return this._map;
        },
        _renderMarkers : function(map, locations) {
            var self = this;
            var bounds = new google.maps.LatLngBounds();
            for ( var i = 0; i < locations.length; i++) {
                var location = locations[i];
                var latLng = new google.maps.LatLng(location.latLng[0], location.latLng[1]);
                var marker = new google.maps.Marker({
                    position : latLng,
                    map : map,
                    title : location.name,
                    icon : MARKER_ICON.replace("{}", i + 1)
                });
                bounds.extend(latLng);
                self._addListenerInScope(marker, i);
                this._markers[i] = marker;
            }

            // position the map to show all markers
            if (locations.length == 1) {
                map.setCenter(bounds.getCenter());
                map.setZoom(12);
            } else if (locations.length > 1) {
                map.fitBounds(bounds);
            }
        },
        _addListenerInScope : function(marker, index) {
            var self = this;
            google.maps.event.addListener(marker, 'click', function() {
                self._openInfo(index);
            });
        },
        _openInfo : function(index) {
            this._close();

            var location = this._locations[index];
            $(".map-info", this.$el).html(this.infoTemplate({
                location : location,
                index : index
            })).show();
        },
        _openEdit : function(e) {
            this._close();

            var self = this;
            var index = $(e.target).attr("data-index") || "";
            var location = this._locations[index] || EMPTY_LOCATION;
            App.currentUser.checkAuth(function() {
                var $el = $(".map-edit", self.$el);
                $el.html(self.editTemplate({
                    location : location,
                    index : index
                })).show();

                // bind autocomplete
                var $autocompleteInput = $el.find('[name=location_address]');
                self._autocomplete = new google.maps.places.Autocomplete($autocompleteInput[0]);
                $autocompleteInput.focus();
                // prevent form submission when choosing location
                google.maps.event.addDomListener($autocompleteInput[0], 'keydown', function(e) {
                    if (e.keyCode == 13) {
                        if (e.preventDefault) e.preventDefault();
                    }
                    self._displayErrors($el);
                });

            }, true);
            return false;
        },
        _close : function(e) {
            $(".map-edit", this.$el).empty().hide();
            $(".map-info", this.$el).empty().hide();
            return false;
        },
        _resizeMap : function(e) {
            e.preventDefault();
            $('.b-map').toggleClass('expanded');
        },
        _showOnMap : function(e) {
            if (this._selection != undefined) {
                var oldMarker = this._markers[this._selection];
                oldMarker.setIcon(MARKER_ICON.replace("{}", this._selection + 1));
            }

            this._selection = parseInt($(e.target).attr("data-index") || $(e.target.parentElement).attr("data-index"));
            var marker = this._markers[this._selection];
            marker.setIcon(SELECTED_MARKER_ICON.replace("{}", this._selection + 1));
            this._map.panTo(marker.getPosition());
        },
        _saveLocation : function(e) {
            var self = this;
            var index = $(e.target).attr("data-index");

            var place = this._autocomplete.getPlace();
            if (!place && !index) {
                self._displayErrors($el, {
                    "location_address" : "Invalide address"
                });
                return false;
            } else if (!place) {
                place = {
                    formatted_address :  self._locations[index].address,
                    geometry : {
                        location : {
                            Xa : self._locations[index].latLng[0],
                            Ya : self._locations[index].latLng[1]
                        }
                    }
                }
            }

            var $el = $(".map-edit", this.$el);
            var name = $("[name=location_name]", $el).val();
            var notes = $("[name=location_notes]", $el).val();
            
            // formatted address might start with the name
            var address = place.formatted_address;
            if (address.substring(0, place.name.length) != place.name) address = place.name + ". " + address;
            
            var loc = {
                name : name,
                notes : notes,
                address : address,
                latLng : [
                        place.geometry.location.Xa, place.geometry.location.Ya
                ]
            };

            // hack to make mongoose happy
            var locations = new Array();
            for ( var i = 0; i < self._locations.length; i++) {
                locations.push({
                    _id : self._locations[i]._id
                });
            }

            if (index) {
                $.extend(locations[index], loc);
            } else {
                locations.push(loc);
            }

            self._thing.set("locations", locations);
            self._thing.save(null, {
                success : function() {
                    self._close();
                    self.render();
                }
            });

            return false;
        },
        _displayErrors : function($el, messages) {
            // remove messages
            $(".control-group", $el).removeClass("error");
            $(".control-group span", $el).empty();

            if (messages) {
                for (input in messages) {
                    $(".control-group." + input, $el).addClass("error");
                    $(".control-group." + input + " span", $el).html(messages[input]);
                }
            }
        },
        _deleteLocation : function(e) {
            var self = this;
            var index = $(e.target).attr("data-index");

            // hack to make mongoose happy
            var locations = new Array();
            for ( var i = 0; i < self._locations.length; i++) {
                locations.push({
                    _id : self._locations[i]._id
                });
            }

            locations.splice(index, 1);
            self._thing.set("locations", locations);
            self._thing.save(null, {
                success : function() {
                    self._close();
                    self.render();
                }
            });
            return false;
        },
        _geocode : function(address) {
            var dfd = $.Deferred();
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({
                'address' : address
            }, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    dfd.resolve({
                        latLng : [
                                results[0].geometry.location.Xa, results[0].geometry.location.Ya
                        ],
                        address : results[0].formatted_address
                    });
                } else {
                    dfd.reject();
                }
            });
            return dfd;
        }
    });
});