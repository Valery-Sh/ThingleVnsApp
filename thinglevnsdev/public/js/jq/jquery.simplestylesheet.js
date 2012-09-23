/*
 * Simple Stylesheet jQuery Plugin
 * Version: 0.0.1
 *
 * Enables CSS modification that uses a 'global' stylesheet, rather than inline CSS.
 *
 *  Copyright (c) 2012  Joachim Larsen (joe.d.developer@gmail.com)
 *
 * Builds on structure suggested by GlobalStyleSheet
 * Which is Copyright (c) 2009 Jeremy Shipman (http://www.burnbright.co.nz)
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * INSTRUCTIONS:
 * use in the same way as the jQuery css function. Eg:
 *  $("some selector").simplecss("style","value");
 *
 * use the simplesetylesheet.print() function to return a string of the global stylesheet
 */
(function($) {

  //global singleton class for
  simplestylesheet = new function simpleStylesheet() {

    var sheet = null,
        setrules = []; // rule cache
    //set up a dummy noded
    var cssNode = document.createElement('style');
    cssNode.type = 'text/css';
    cssNode.rel = 'stylesheet';
    cssNode.media = 'screen';
    cssNode.title = 'simpleStyleSheet';
    cssNode.id = 'simplestylesheet';

    sheet = $(cssNode).appendTo($('head'));
    //		document.getElementsByTagName("head")[0].appendChild(cssNode);

    //set a CSS rule
    this.setRule = function setRule(selector, ruleText) {
      if (setrules[selector] != undefined) {
        return setrules[selector];
      } else {
        if (sheet.addRule) { // IE
          sheet.addRule(selector, ruleText, 0);
        } else {
          sheet.insertRule(selector + '{' + ruleText + '}', 0);
        }
        setrules[selector] = this.getRule(selector);
      }
      return setrules[selector];
    }

    //get a saved CSS rule
    this.getRule = function getRule(selector) {
      if (setrules[selector] != undefined) {
        return setrules[selector];
      } else {
        var rules = allRules();
        for (var i = 0; i < rules.length; i++) {
          if (rules[i].selectorText == selector) {
            return rules[i];
          }
        }
      }
      return false;
    }

    //Set / Get all rules

    this.allRules = function allRules(text) {

      return sheet.text(text);
    }

    //print out the stylesheet
    this.print = function print() {
      var rules = allRules();
      return rules;
    }

    //use jQuery's css selector function to set the style object
    this.css = function css(jquery, rawcss) {
      sheet.append(jquery.selector + " {\n  " + rawcss.replace(/[\s;]+$/,"") + ";" + "\n }\n\n");
      //			rule = this.setRule(jquery.selector,key+":"+value+";");
      //		jQuery(rule).css(key,value);
    }

  }
  //hook new function into jQuery
  jQuery.fn.extend({
    simplecss: function simplecss(key, value) {
      simplestylesheet.css(this, key, value);
    }
  });

})(jQuery);