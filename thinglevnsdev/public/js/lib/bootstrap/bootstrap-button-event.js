/* ============================================================
 * bootstrap-button.js v2.1.0
 * http://twitter.github.com/bootstrap/javascript.html#buttons
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* BUTTON PUBLIC CLASS DEFINITION
  * ============================== */

  var Button = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.button.defaults, options)
  }


  Button.prototype.toggle = function () {
    var $parent = this.$element.parent('[data-toggle="buttons-radio-event"]')
    var oldActive = false;
    if ( this.$element.hasClass('active')) {
        oldActive = true;
    }
    
    var childrens = $parent.children()
    var targetButton = this.$element.context          
    var targetIndex = -1
    //alert("o=" + o)
    childrens.each( function(i){
    //    alert(this.$element)
        if ( targetButton == childrens[i]) {
            targetIndex = i;
        }
    });
    //alert("targetIndex=" + targetIndex)
    childrens.each( function(i){
//        alert("idx=" + i + "; selIndex=" + selIdx)
        childrens[i].innerText = "_"}
        
    );       
    
    $parent && $parent
      .find('.active')
      .removeClass('active')

    if ( ! oldActive )  {
        this.$element.toggleClass('active')
        this.$element.context.innerText = "3"
    } else {
        this.$element.context.innerText = "_"
    }
    this.$element.trigger("change",targetIndex)
  }


 /* BUTTON PLUGIN DEFINITION
  * ======================== */

  $.fn.button = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('button')
        , options = typeof option == 'object' && option
      if (!data) $this.data('button', (data = new Button(this, options)))
      if (option == 'toggle') data.toggle()
      else if (option) data.setState(option)
    })
  }

  $.fn.button.defaults = {
    loadingText: 'loading...'
  }

  $.fn.button.Constructor = Button


 /* BUTTON DATA-API
  * =============== */

  $(function () {
    $('body').on('click.button.data-api', '[data-toggle^=button]', function ( e ) {
      var $btn = $(e.target)
      if (!$btn.hasClass('btn')) $btn = $btn.closest('.btn')
      $btn.button('toggle')
    })
  })

}(window.jQuery);