(function (w, d) {
    var bookmarkletPostPageUrl = "/bookmarklet.html";
    var bookmarkletPostPageController = "#bookmarklet";
    var uniqueNumber = Math.floor((Math.random() * 100000000) + 1);
    var config = {
        minWidth:220,
        minHeight:100,
        selectionBoxSize:70
    };

    var css = [
        '.##overlay { position: absolute; background-color: #ffffff; z-index: 9999;}',
        '.##overlay-mask { position: fixed; background-color: #ffffff; z-index: 9999; left: 0px; top: 0px; display: none; opacity: 0.9; filter: alpha(opacity=90);  width: 100%;height: 100%;}',
        '.##overlay-form {position: fixed;top: 40%;left: 50%;z-index: 10000;overflow: auto;width: 560px;margin: -250px 0 0 -280px;background-color: white;-webkit-box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3);-moz-box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3);box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3);-webkit-background-clip: padding-box;-moz-background-clip: padding-box;background-clip: padding-box;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;-ms-box-sizing: border-box;box-sizing: border-box;}',
        '.##header { padding: 9px 22px;background: #63A2D5;border-style: solid;border-width: 1px;border-color: #3178B2 #3178B2 #2D597C #3178B2;color: white;font-family:arial,sans-serif;font-size: 20px;font-weight: normal;line-height: 34px; text-align: left !important;-webkit-box-sizing: border-box;-moz-box-sizing: border-box;-ms-box-sizing: border-box;box-sizing: border-box;}',
        '.##header a { width: 15px;height: 15px;margin: 10px -1px 0 0;padding: 0;cursor: pointer;float: right;background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAFpJREFUeNpi+P///3sgTgBiBhIwSP17GOM/CQbA1WMIEKsRxMcpQUgjumZ8BmAVJ8YGnC4i5Lf5+LyCL3DmIxnAQIpmsm0m289khzbZ8Ux2CqMobZOdqwACDAC0w9GbaYoUiwAAAABJRU5ErkJggg==) no-repeat 0 0;}',
        '.##overlay-selection { position: relative;min-height: 30px;overflow: hidden;padding: 20px 140px 10px 20px;border-style: solid;border-width: 0 1px 0 1px;border-color: #7a7a7a;}',
        '.##overlay-selection .##btn {position: absolute;right: 40px;}',
        '.##overlay-selection .##crop { width: 70px;height: 70px; overflow: hidden;float: left;margin:0 10px 10px 0}',
        '.##overlay-content { overflow-x: hidden;overflow-y:auto;max-height: 550px;padding: 20px 10px 10px 20px;border-style: solid;border-width: 0 1px 1px;border-color: #7a7a7a;text-align: left;}',
        '.##overlay-content img { max-width: 504px;margin:0 10px 10px 0}',
        '.##overlay-content img:hover { cursor: pointer; }',
        '.##wrapper { }',
        '.##thingle { float: left; width: ' + config.minWidth + 'px; height' + config.minHeight + 'px; }',
        '.##thingle-image { width: ' + config.minWidth + 'px; height' + config.minHeight + 'px; }',
        '.##form { margin-left: ' + (parseInt(config.minWidth) + 20) + 'px; }',
        '.##form-item { padding-bottom: 10px; }',
        '.##form-item span { display: block; padding-bottom: 5px; }',
        '.##validator { color: red; display: inline-block;}',
        '.##btn {min-width: 120px;background: #3F3F3F;color: white;text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.25);padding: 10px 27px;border-color: #141414;font: italic bold 14px Asap,"Trebuchet MS",Tahoma,Arial,FreeSans,sans-serif;border-radius: 5px;}'
    ];

    var strings = {
        imagesNotFound:'No suitable images were found on this page',
        selectorTitle:'Choose image:'
    };

    if (typeof JSON == "undefined") {
        JSON = {
            stringify:function (data) {
            }
        };
    }

    if (Thingle.document) d = Thingle.document;

    function setSize(element, size) {
        element.style.width = size.width;
        element.style.height = size.height;
    }

    function setPos(element, pos) {
        element.style.left = pos.left;
        element.style.top = pos.top;
    }

    function buildStyles(b) {
        var style = b.make({ style:{ type:'text/css'} });
        var rules = css.join('\n').replace(/\.##/g, '.a' + uniqueNumber);
        if (style.styleSheet) {
            style.styleSheet.cssText = rules;
        } else {
            style.appendChild(b.makeText(rules));
        }

        return style;
    }

    function makeClass(clazz) {
        return 'a' + uniqueNumber + clazz;
    }

    function ajax(options) {
        if (typeof XMLHttpRequest == 'undefined') {
            XMLHttpRequest = function () {
                try {
                    return new ActiveXObject('Msxml2.XMLHTTP.6.0');
                } catch (e) {
                }
                try {
                    return new ActiveXObject('Msxml2.XMLHTTP.3.0');
                } catch (e) {
                }
                try {
                    return new ActiveXObject('Microsoft.XMLHTTP');
                } catch (e) {
                }
                throw new Error('This browser does not support XMLHttpRequest.');
            };
        }

        var request = new XMLHttpRequest();
        options.method = options.method || 'GET';
        request.open(options.method, options.url);
        if (typeof options.contentType != 'undefined') {
            request.setRequestHeader('Content-Type', options.contentType);
        }
        request.onreadystatechange = function () {
            switch (this.readyState) {
                case 4:
                {
                    if (this.status == 200 && options.success) {
                        options.success(this.responseText);
                    } else if (this.status != 200 && options.error) {
                        options.error(this.status, this.statusText);
                    }
                }

                    break;
            }
        };

        if (options.method == 'GET') {
            request.send(null);
        } else {
            var val = JSON.stringify(options.data);
            request.send(val);
        }
    }

    function Builder(window) {
        var self = this;

        self.elements = {
            d:window.document,
            b:window.document.body,
            h:window.document.getElementsByTagName('HEAD')[0],
            w:window
        };

        self.support = {
            isIe:window.navigator.userAgent.indexOf('MSIE ') > 0
        };

        self.make = function (desc) {
            var items = new Array();
            for (var tag in desc) {
                var properties = desc[tag];
                var item = self.elements.d.createElement(tag);
                for (var key in properties) {
                    var value = properties[key];

                    if (key == 'class' && self.support.isIe) {
                        key = 'className';
                    }

                    if (key == 'class' || key == 'className') {
                        value = makeClass(value);
                    }

                    item.setAttribute(key, value);
                }

                items.push(item);
            }

            return items.length == 1 ? items[0] : items;
        };

        self.makeText = function (text) {
            return self.elements.d.createTextNode(text);
        };

        self.attach = function (what, to) {
            to.appendChild(what);
            return to;
        };

        self.attachBody = function (element) {
            return self.attach(element, self.elements.b);
        };

        self.attachHead = function (element) {
            return self.attach(element, self.elements.h || self.elements.b);
        };
        
        self.detach = function (what, to) {
            to.removeChild(what);
            return to;
        };

        self.detachBody = function (element) {
            return self.detach(element, self.elements.b);
        };
    }

    function WindowBase() {
        var self = this;
        self.visible = false;
        self.builder = new Builder(window);
    }

    WindowBase.prototype.empty = function (item) {
        while (item.firstChild) {
            item.removeChild(item.firstChild);
        }
    };

    WindowBase.prototype.getWindowSize = function (win) {
        var size = {
            width:0,
            height:0
        };

        if (typeof (win.innerWidth) == 'number') {
            //Non-IE
            size.width = win.innerWidth;
            size.height = win.innerHeight;
        } else if (win.document.documentElement && (win.document.documentElement.clientWidth || win.document.documentElement.clientHeight)) {
            //IE 6+ in 'standards compliant mode'
            size.width = win.document.documentElement.clientWidth;
            size.height = win.document.documentElement.clientHeight;
        } else if (win.document.body && (win.document.body.clientWidth || win.document.body.clientHeight)) {
            //IE 4 compatible
            size.width = win.document.body.clientWidth;
            size.height = win.document.body.clientHeight;
        }

        return size;
    };

    WindowBase.prototype.show = function () {
        var self = this;
        self.visible = true;
    };

    WindowBase.prototype.close = function () {
        var self = this;
        self.visible = false;
    };

    WindowBase.prototype.get = function (id, parent) {
        parent = parent || window.document;
        return parent.getElementById(id);
    };

    function Overlay(images, win, onSubmit, onClose) {
        var self = this;
        self.base.constructor.call(this, win);

        self.images = images;
        self.onSubmit = onSubmit;
        var viewport = self.getWindowSize(win);

        self.maskDiv = self.builder.make({ div:{ 'class':'overlay-mask'} });
        self.maskDiv.style.width = viewport.width;
        self.maskDiv.style.height = viewport.height;
        self.builder.attachBody(self.maskDiv);

        var w = viewport.width / 1.5;
        var h = viewport.height / 1.5;
        self.formDiv = self.builder.make({ div:{ 'class':'overlay-form'} });
//        setSize(self.formDiv, { width: w, height: h });
//        setPos(self.formDiv, { left: (viewport.width - w) * 0.5, top: (viewport.height - h) * 0.5 });
        self.builder.attachBody(self.formDiv);

        var closeLink = self.builder.make({ a:{ 'href':'javascript:void(0);'} });
        //closeLink.appendChild(self.builder.makeText('X'));
        closeLink.onclick = function () {
            self.close();
            onClose(self);
        };

        self.titleContainer = self.builder.make({ span:{} });
        self.headerContainer = self.builder.make({ div:{ 'class':'header'} });
        self.headerContainer.appendChild(self.titleContainer);
        self.headerContainer.appendChild(closeLink);
        self.formDiv.appendChild(self.headerContainer);

        self.submitButton = self.builder.make({ button:{'class':'btn'} });
        self.submitButton.style.visibility = "hidden";
        var submitButtonText = self.builder.makeText("Submit");
        self.submitButton.appendChild(submitButtonText);
        self.submitButton.onclick = function() {
            var images = new Array();
            var cropDivs = self.selectionDiv.childNodes;
            for (var i = 0 ; i < cropDivs.length ; i++) {
                if (cropDivs[i] instanceof HTMLDivElement && cropDivs[i].__ref) {
                    images.push(cropDivs[i].__ref);
                }
            }
            onSubmit(images);
        };
        
        self.selectionDiv = self.builder.make({ div:{ 'class':'overlay-selection'} });
        self.selectionDiv.appendChild(self.submitButton);
        self.formDiv.appendChild(self.selectionDiv);
        
        self.contentDiv = self.builder.make({ div:{ 'class':'overlay-content'} });
        //setSize(self.contentDiv, { width:w, height:h - 23 });
        self.formDiv.appendChild(self.contentDiv);

        self.onImageDeselected = function (e) {
            var cropDiv = this;
            self.selectionDiv.removeChild(cropDiv);
            cropDiv.__ref.style.display = "inline";
            
            // hide button
            if (self.selectionDiv.childNodes.length < 2) {
                self.submitButton.style.visibility = "hidden";
            }
        };
        
        self.onImageSelected = function (e) {
            var image = this;
            var cropDiv = self.cropImage(image, config.selectionBoxSize);
            self.selectionDiv.appendChild(cropDiv);
            
            cropDiv.__ref = image;
            cropDiv.onclick = self.onImageDeselected;
            image.style.display = "none";
            
            //show button
            self.submitButton.style.visibility = "visible";
        };

        for (var i = 0; i < self.images.length; i++) {
            var item = self.images[i];
            var img = self.builder.make({ img:{ 'src':item.src} });
            self.contentDiv.appendChild(img);

            img.onclick = self.onImageSelected;
        }

        self.cropImage = function(image, boxSize) {
            var aspectRatio = image.width / image.height;
            var scaleWidth = aspectRatio > 1 ? Math.round(boxSize * aspectRatio) : boxSize;
            var marginLeft = aspectRatio > 1 && Math.round((boxSize - scaleWidth) / 2);
            var scaleHeight = aspectRatio < 1 ? Math.round(boxSize / aspectRatio) : boxSize;
            var marginTop = aspectRatio < 1 && Math.round((boxSize - scaleHeight) / 2);
            
            var imgDiv = self.builder.make({ img:{'src':image.src, 'width':scaleWidth + 'px', 'height':scaleHeight + 'px',
                'style':(marginTop && "margin-top: " + marginTop + 'px') || (marginLeft && "margin-left: " + marginLeft + 'px')} });
            var cropDiv = self.builder.make({ div:{'class':'crop'} });
            cropDiv.appendChild(imgDiv);
            return cropDiv;
        };
        
        self.show = function () {
            var self = this;

            self.maskDiv.style.display = 'block';
            self.formDiv.style.display = 'block';

            self.base.show.call(self);
        };

        self.close = function () {
            var self = this;

            self.maskDiv.style.display = 'none';
            self.formDiv.style.display = 'none';

            self.base.close.call(self);
        };
        
        self.destroy = function () {
            var self = this;

            self.builder.detachBody(self.maskDiv);
            self.builder.detachBody(self.formDiv);
        };

        self.setTitle = function (title) {
            var self = this;

            self.empty(self.titleContainer);
            var child = self.builder.makeText(title);
            self.titleContainer.appendChild(child);
        };
    }

    Overlay.prototype = new WindowBase();
    Overlay.prototype.constructor = Overlay;
    Overlay.prototype.base = WindowBase.prototype;

    function Engine() {
        var self = this;
        self.modal = null;
        self.builder = new Builder(window);

        var style = buildStyles(self.builder);
        self.builder.attachHead(style);

        function grabImages() {
            var images = new Array();
            var elements = d.getElementsByTagName('img');
            for (var i = 0; i < elements.length; i++) {
                var image = elements[i];
                if (!/^data:image/.test(image.src)) {
                	var acceptedImage = null;
                    if (image.parentNode.tagName == "A" && /\.(jpg|jpeg|gif|png|bmp)/i.test(image.parentNode.href)) {
                    	// first try to grab the image from the parent <a> element
                        var src = image.parentNode.href
                        var aImage = new Image();
                        aImage.src = src;
                        acceptedImage = acceptImage(aImage);
                    }
                    if (!acceptedImage && acceptImage(image)) {
                    	// fallback to the img element
                        acceptedImage = acceptImage(image);
                    }
                    
                    if (acceptedImage) {
                    	images.push(acceptedImage);
                    }
                }
            }

            return images;
        }
        
        function acceptImage(image) {
            if (image.width >= config.minWidth && image.height >= config.minHeight) {
            	return image
            }
        }

        self.callback = function(imageUrls, sourceUrl) {
            var url = d.location.protocol + "//" + Thingle.host + bookmarkletPostPageUrl + bookmarkletPostPageController;
            url += "?source=" + encodeURIComponent(sourceUrl);
            for (var i = 0 ; i < imageUrls.length ; i++) {
                url += "&image=" + encodeURIComponent(imageUrls[i]);
            }
            
            window.open(url, 'PIN', 'menubar=yes,resizable=yes,scrollbars=yes,status=yes,width=700,height=570');
        };

        if (Thingle.callback) self.callback = Thingle.callback;

        self.onImageSelected = function (images) {
            self.modal.destroy();
            self.modal = null;
            var imageUrls = new Array();
            for (var i = 0 ; i < images.length ; i++) {
                imageUrls.push(images[i].getAttribute("src"));
            }
            var sourceUrl = d.location.href;
            self.callback(imageUrls, sourceUrl);
        };
        
        self.onClose = function () {
            self.modal.destroy();
            self.modal = null;
        };

        self.run = function () {
            var images = grabImages();
            if (!images.length) {
                alert(strings.imagesNotFound);
            } else {
                self.modal = new Overlay(images, window, self.onImageSelected, self.onClose);
                self.modal.setTitle(strings.selectorTitle);
                self.modal.show();
            }
        };
    }

    if (!w.__pinEngine) {
        var e = new Engine();
        w.__pinEngine = e;
    }

    w.__pinEngine.run();
})(window, document);
