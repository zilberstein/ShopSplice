(function () {

/////////////////////////////////////////////////////////////////////////////////
//                                                                             //
// packages/htmljs/html.js                                                     //
//                                                                             //
/////////////////////////////////////////////////////////////////////////////////
                                                                               //
/***                                                                           // 1
 * A convenient way to create DOM elements. ('cls' will be                     // 2
 * automatically expanded to 'class', since 'class' may not appear as          // 3
 * a key of an object, even in quotes, in Safari.)                             // 4
 *                                                                             // 5
 * DIV({cls: "mydiv", style: "color: blue;"}, [                                // 6
 *   "Some text",                                                              // 7
 *   A({href: "/some/location"}, ["A link"]),                                  // 8
 *   DIV({cls: "emptydiv"}),                                                   // 9
 *   // if an object is inserted, the value of its 'element'                   // 10
 *   // attribute will be used                                                 // 11
 *   myView,                                                                   // 12
 *   DIV([                                                                     // 13
 *     "Both the attributes and the contents are optional",                    // 14
 *     ["Lists", "are", "flattened"]                                           // 15
 *   })                                                                        // 16
 * ]);                                                                         // 17
 */                                                                            // 18
                                                                               // 19
// XXX find a place to document the contract for *View classes -- they         // 20
// should have an attribute named 'element'                                    // 21
                                                                               // 22
// XXX consider not requiring the contents to be wrapped in an                 // 23
// array. eg: DIV({stuff: 12}, "thing1", "thing2"). backwards                  // 24
// compatible with current behavior due to array flattening. could             // 25
// eliminate spurious wrapper div inserted by Layout.TwoColumnsFixedRight      // 26
                                                                               // 27
// XXX allow style to be set as an object                                      // 28
                                                                               // 29
var event_names = {                                                            // 30
  blur: true,                                                                  // 31
  change: true,                                                                // 32
  click: true,                                                                 // 33
  dblclick: true,                                                              // 34
  error: true,                                                                 // 35
  focus: true,                                                                 // 36
  focusin: true,                                                               // 37
  focusout: true,                                                              // 38
  keydown: true,                                                               // 39
  keypress: true,                                                              // 40
  keyup: true,                                                                 // 41
  load: true,                                                                  // 42
  mousedown: true,                                                             // 43
  mouseenter: true,                                                            // 44
  mouseleave: true,                                                            // 45
  mousemove: true,                                                             // 46
  mouseout: true,                                                              // 47
  mouseover: true,                                                             // 48
  mouseup: true,                                                               // 49
  resize: true,                                                                // 50
  scroll: true,                                                                // 51
  select: true,                                                                // 52
  submit: true                                                                 // 53
};                                                                             // 54
                                                                               // 55
var testDiv = document.createElement("div");                                   // 56
testDiv.innerHTML = '<a style="top:1px">a</a>';                                // 57
var styleGetSetSupport = /top/.test(testDiv.firstChild.getAttribute("style")); // 58
                                                                               // 59
// All HTML4 elements, excluding deprecated elements                           // 60
// http://www.w3.org/TR/html4/index/elements.html                              // 61
// also excluding the following elements that seem unlikely to be              // 62
// used in the body:                                                           // 63
// HEAD, HTML, LINK, MAP, META, NOFRAMES, NOSCRIPT, STYLE, TITLE               // 64
var tag_names =                                                                // 65
  ('A ABBR ACRONYM B BDO BIG BLOCKQUOTE BR BUTTON CAPTION CITE CODE COL ' +    // 66
   'COLGROUP DD DEL DFN DIV DL DT EM FIELDSET FORM H1 H2 H3 H4 H5 H6 HR ' +    // 67
   'I IFRAME IMG INPUT INS KBD LABEL LEGEND LI OBJECT OL OPTGROUP OPTION ' +   // 68
   'P PARAM PRE Q S SAMP SCRIPT SELECT SMALL SPAN STRIKE STRONG SUB SUP ' +    // 69
   'TABLE TBODY TD TEXTAREA TFOOT TH THEAD TR TT U UL VAR').split(' ');        // 70
                                                                               // 71
_.each(tag_names, function (tag) {                                             // 72
  var f = function (arg1, arg2) {                                              // 73
    var attrs, contents;                                                       // 74
    if (arg2) {                                                                // 75
      attrs = arg1;                                                            // 76
      contents = arg2;                                                         // 77
    } else {                                                                   // 78
      if (arg1 instanceof Array) {                                             // 79
        attrs = {};                                                            // 80
        contents = arg1;                                                       // 81
      } else {                                                                 // 82
        attrs = arg1;                                                          // 83
        contents = [];                                                         // 84
      }                                                                        // 85
    }                                                                          // 86
    var elt = document.createElement(tag);                                     // 87
    for (var a in attrs) {                                                     // 88
      if (a === 'cls')                                                         // 89
        elt.setAttribute('class', attrs[a]);                                   // 90
      else if (a === '_for')                                                   // 91
        elt.setAttribute('for', attrs[a]);                                     // 92
      else if (a === 'style' && ! styleGetSetSupport)                          // 93
        elt.style.cssText = String(attrs[a]);                                  // 94
      else if (event_names[a]) {                                               // 95
        if (typeof $ === "undefined")                                          // 96
          throw new Error("Event binding is supported only if " +              // 97
                          "jQuery or similar is available");                   // 98
        ($(elt)[a])(attrs[a]);                                                 // 99
      }                                                                        // 100
      else                                                                     // 101
        elt.setAttribute(a, attrs[a]);                                         // 102
    }                                                                          // 103
    var addChildren = function (children) {                                    // 104
      for (var i = 0; i < children.length; i++) {                              // 105
        var c = children[i];                                                   // 106
        if (!c && c !== '')                                                    // 107
          throw new Error("Bad value for element body: " + c);                 // 108
        else if (c instanceof Array)                                           // 109
          addChildren(c);                                                      // 110
        else if (typeof c === "string")                                        // 111
          elt.appendChild(document.createTextNode(c));                         // 112
        else if ('element' in c)                                               // 113
          addChildren([c.element]);                                            // 114
        else                                                                   // 115
          elt.appendChild(c);                                                  // 116
      };                                                                       // 117
    };                                                                         // 118
    addChildren(contents);                                                     // 119
    return elt;                                                                // 120
  };                                                                           // 121
  // Put the function onto the package-scope variable with this name.          // 122
  eval(tag + " = f;");                                                         // 123
});                                                                            // 124
                                                                               // 125
/////////////////////////////////////////////////////////////////////////////////

}).call(this);
