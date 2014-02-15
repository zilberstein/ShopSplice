(function () {

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/test-helpers/try_all_permutations.js                                      //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
// Given some functions, run them in every possible order.                            // 1
//                                                                                    // 2
// In simplest usage, takes one argument, an array of functions. Run                  // 3
// those functions in every possible order. Or, if the first element                  // 4
// of the array is an integer N, with the remaining elements being                    // 5
// functions (N <= the number of functions), run every permutation of                 // 6
// N functions from the array.                                                        // 7
//                                                                                    // 8
// Eg:                                                                                // 9
// try_all_permutations([A, B, C])                                                    // 10
// => runs A, B, C; A, C, B; B, A, C; B, C, A; C, A, B; C, B, A                       // 11
// (semicolons for clarity only)                                                      // 12
//                                                                                    // 13
// try_all_permutations([2, A, B, C])                                                 // 14
// => runs A, B; A, C; B, A; B, C; C, A; C, B                                         // 15
//                                                                                    // 16
// If more than one argument A_1, A_2 ... A_n is passed, each should                  // 17
// be an array as described above. Compute the possible orderings O_1,                // 18
// O_2 ... O_n per above, and run the Cartesian product of the                        // 19
// sets. (Except that unlike a proper Cartesian product, a set with                   // 20
// zero elements will simply be ignored.)                                             // 21
//                                                                                    // 22
// Eg:                                                                                // 23
// try_all_permutations([X], [A, B], [Y])                                             // 24
// => runs X, A, B, Y; X, B, A, Y                                                     // 25
// try_all_permutations([X], [A, B], [], [Y])                                         // 26
// => same                                                                            // 27
//                                                                                    // 28
// If a function is passed instead of an array, it will be treated as                 // 29
// an array with one argument. In other words, these are the same:                    // 30
// try_all_permutations([X], [A, B], [Y])                                             // 31
// try_all_permutations(X, [A, B], Y)                                                 // 32
                                                                                      // 33
try_all_permutations = function () {                                                  // 34
  var args = Array.prototype.slice.call(arguments);                                   // 35
                                                                                      // 36
  var current_set = 0;                                                                // 37
  var chosen = [];                                                                    // 38
                                                                                      // 39
  var expand_next_set = function () {                                                 // 40
    if (current_set === args.length) {                                                // 41
      _.each(chosen, function (f) { f(); });                                          // 42
    } else {                                                                          // 43
      var set = args[current_set];                                                    // 44
      if (typeof set === "function")                                                  // 45
        set = [set];                                                                  // 46
                                                                                      // 47
      current_set++;                                                                  // 48
      if (typeof set[0] === "number")                                                 // 49
        pick(set[0], set.slice(1));                                                   // 50
      else                                                                            // 51
        pick(set.length, set);                                                        // 52
      current_set--;                                                                  // 53
    }                                                                                 // 54
  };                                                                                  // 55
                                                                                      // 56
  var pick = function (how_many, remaining) {                                         // 57
    if (how_many === 0)                                                               // 58
      expand_next_set();                                                              // 59
    else {                                                                            // 60
      for (var i = 0; i < remaining.length; i++) {                                    // 61
        chosen.push(remaining[i]);                                                    // 62
        pick(how_many - 1,                                                            // 63
             remaining.slice(0, i).concat(remaining.slice(i + 1)));                   // 64
        chosen.pop();                                                                 // 65
      }                                                                               // 66
    }                                                                                 // 67
  };                                                                                  // 68
                                                                                      // 69
  expand_next_set();                                                                  // 70
};                                                                                    // 71
                                                                                      // 72
////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/test-helpers/async_multi.js                                               //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
// This depends on tinytest, so it's a little weird to put it in                      // 1
// test-helpers, but it'll do for now.                                                // 2
                                                                                      // 3
// Provides the testAsyncMulti helper, which creates an async test                    // 4
// (using Tinytest.addAsync) that tracks parallel and sequential                      // 5
// asynchronous calls.  Specifically, the two features it provides                    // 6
// are:                                                                               // 7
// 1) Executing an array of functions sequentially when those functions               // 8
//    contain async calls.                                                            // 9
// 2) Keeping track of when callbacks are outstanding, via "expect".                  // 10
//                                                                                    // 11
// To use, pass an array of functions that take arguments (test, expect).             // 12
// (There is no onComplete callback; completion is determined automatically.)         // 13
// Expect takes a callback closure and wraps it, returning a new callback closure,    // 14
// and making a note that there is a callback oustanding.  Pass this returned closure // 15
// to async functions as the callback, and the machinery in the wrapper will          // 16
// record the fact that the callback has been called.                                 // 17
//                                                                                    // 18
// A second form of expect takes data arguments to test for.                          // 19
// Essentially, expect("foo", "bar") is equivalent to:                                // 20
// expect(function(arg1, arg2) { test.equal([arg1, arg2], ["foo", "bar"]); }).        // 21
//                                                                                    // 22
// You cannot "nest" expect or call it from a callback!  Even if you have a chain     // 23
// of callbacks, you need to call expect at the "top level" (synchronously)           // 24
// but the callback you wrap has to be the last/innermost one.  This sometimes        // 25
// leads to some code contortions and should probably be fixed.                       // 26
                                                                                      // 27
// Example: (at top level of test file)                                               // 28
//                                                                                    // 29
// testAsyncMulti("test name", [                                                      // 30
//   function(test, expect) {                                                         // 31
//     ... tests here                                                                 // 32
//     Meteor.defer(expect(function() {                                               // 33
//       ... tests here                                                               // 34
//     }));                                                                           // 35
//                                                                                    // 36
//     call_something_async('foo', 'bar', expect('baz')); // implicit callback        // 37
//                                                                                    // 38
//   },                                                                               // 39
//   function(test, expect) {                                                         // 40
//     ... more tests                                                                 // 41
//   }                                                                                // 42
// ]);                                                                                // 43
                                                                                      // 44
var ExpectationManager = function (test, onComplete) {                                // 45
  var self = this;                                                                    // 46
                                                                                      // 47
  self.test = test;                                                                   // 48
  self.onComplete = onComplete;                                                       // 49
  self.closed = false;                                                                // 50
  self.dead = false;                                                                  // 51
  self.outstanding = 0;                                                               // 52
};                                                                                    // 53
                                                                                      // 54
_.extend(ExpectationManager.prototype, {                                              // 55
  expect: function (/* arguments */) {                                                // 56
    var self = this;                                                                  // 57
                                                                                      // 58
    if (typeof arguments[0] === "function")                                           // 59
      var expected = arguments[0];                                                    // 60
    else                                                                              // 61
      var expected = _.toArray(arguments);                                            // 62
                                                                                      // 63
    if (self.closed)                                                                  // 64
      throw new Error("Too late to add more expectations to the test");               // 65
    self.outstanding++;                                                               // 66
                                                                                      // 67
    return function (/* arguments */) {                                               // 68
      if (self.dead)                                                                  // 69
        return;                                                                       // 70
                                                                                      // 71
      if (typeof expected === "function") {                                           // 72
        try {                                                                         // 73
          expected.apply({}, arguments);                                              // 74
        } catch (e) {                                                                 // 75
          if (self.cancel())                                                          // 76
            self.test.exception(e);                                                   // 77
        }                                                                             // 78
      } else {                                                                        // 79
        self.test.equal(_.toArray(arguments), expected);                              // 80
      }                                                                               // 81
                                                                                      // 82
      self.outstanding--;                                                             // 83
      self._check_complete();                                                         // 84
    };                                                                                // 85
  },                                                                                  // 86
                                                                                      // 87
  done: function () {                                                                 // 88
    var self = this;                                                                  // 89
    self.closed = true;                                                               // 90
    self._check_complete();                                                           // 91
  },                                                                                  // 92
                                                                                      // 93
  cancel: function () {                                                               // 94
    var self = this;                                                                  // 95
    if (! self.dead) {                                                                // 96
      self.dead = true;                                                               // 97
      return true;                                                                    // 98
    }                                                                                 // 99
    return false;                                                                     // 100
  },                                                                                  // 101
                                                                                      // 102
  _check_complete: function () {                                                      // 103
    var self = this;                                                                  // 104
    if (!self.outstanding && self.closed && !self.dead) {                             // 105
      self.dead = true;                                                               // 106
      self.onComplete();                                                              // 107
    }                                                                                 // 108
  }                                                                                   // 109
});                                                                                   // 110
                                                                                      // 111
testAsyncMulti = function (name, funcs) {                                             // 112
  // XXX Tests on remote browsers are _slow_. We need a better solution.              // 113
  var timeout = 180000;                                                               // 114
                                                                                      // 115
  Tinytest.addAsync(name, function (test, onComplete) {                               // 116
    var remaining = _.clone(funcs);                                                   // 117
    var context = {};                                                                 // 118
                                                                                      // 119
    var runNext = function () {                                                       // 120
      var func = remaining.shift();                                                   // 121
      if (!func)                                                                      // 122
        onComplete();                                                                 // 123
      else {                                                                          // 124
        var em = new ExpectationManager(test, function () {                           // 125
          Meteor.clearTimeout(timer);                                                 // 126
          runNext();                                                                  // 127
        });                                                                           // 128
                                                                                      // 129
        var timer = Meteor.setTimeout(function () {                                   // 130
          if (em.cancel()) {                                                          // 131
            test.fail({type: "timeout", message: "Async batch timed out"});           // 132
            onComplete();                                                             // 133
          }                                                                           // 134
          return;                                                                     // 135
        }, timeout);                                                                  // 136
                                                                                      // 137
        try {                                                                         // 138
          func.apply(context, [test, _.bind(em.expect, em)]);                         // 139
        } catch (exception) {                                                         // 140
          if (em.cancel())                                                            // 141
            test.exception(exception);                                                // 142
          Meteor.clearTimeout(timer);                                                 // 143
          // Because we called test.exception, we're not to call onComplete.          // 144
          return;                                                                     // 145
        }                                                                             // 146
        em.done();                                                                    // 147
      }                                                                               // 148
    };                                                                                // 149
                                                                                      // 150
    runNext();                                                                        // 151
  });                                                                                 // 152
};                                                                                    // 153
                                                                                      // 154
// Call `fn` periodically until it returns true.  If it does, call                    // 155
// `success`.  If it doesn't before the timeout, call `failed`.                       // 156
simplePoll = function (fn, success, failed, timeout, step) {                          // 157
  timeout = timeout || 10000;                                                         // 158
  step = step || 100;                                                                 // 159
  var start = (new Date()).valueOf();                                                 // 160
  var helper = function () {                                                          // 161
    if (fn()) {                                                                       // 162
      success();                                                                      // 163
      return;                                                                         // 164
    }                                                                                 // 165
    if (start + timeout < (new Date()).valueOf()) {                                   // 166
      failed();                                                                       // 167
      return;                                                                         // 168
    }                                                                                 // 169
    Meteor.setTimeout(helper, step);                                                  // 170
  };                                                                                  // 171
  helper();                                                                           // 172
};                                                                                    // 173
                                                                                      // 174
pollUntil = function (expect, f, timeout, step, noFail) {                             // 175
  noFail = noFail || false;                                                           // 176
  step = step || 100;                                                                 // 177
  var expectation = expect(true);                                                     // 178
  simplePoll(                                                                         // 179
    f,                                                                                // 180
    function () { expectation(true) },                                                // 181
    function () { expectation(noFail) },                                              // 182
    timeout,                                                                          // 183
    step                                                                              // 184
  );                                                                                  // 185
};                                                                                    // 186
                                                                                      // 187
////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/test-helpers/event_simulation.js                                          //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
simulateEvent = function (node, event, args) {                                        // 1
  node = (node instanceof $ ? node[0] : node);                                        // 2
                                                                                      // 3
  if (document.createEvent) {                                                         // 4
    var e = document.createEvent("Event");                                            // 5
    e.initEvent(event, true, true);                                                   // 6
    _.extend(e, args);                                                                // 7
    node.dispatchEvent(e);                                                            // 8
  } else {                                                                            // 9
    var e = document.createEventObject();                                             // 10
    _.extend(e, args);                                                                // 11
    node.fireEvent("on" + event, e);                                                  // 12
  }                                                                                   // 13
};                                                                                    // 14
                                                                                      // 15
focusElement = function(elem) {                                                       // 16
  // This sequence is for benefit of IE 8 and 9;                                      // 17
  // test there before changing.                                                      // 18
  window.focus();                                                                     // 19
  elem.focus();                                                                       // 20
  elem.focus();                                                                       // 21
                                                                                      // 22
  // focus() should set document.activeElement                                        // 23
  if (document.activeElement !== elem)                                                // 24
    throw new Error("focus() didn't set activeElement");                              // 25
};                                                                                    // 26
                                                                                      // 27
blurElement = function(elem) {                                                        // 28
  elem.blur();                                                                        // 29
  if (document.activeElement === elem)                                                // 30
    throw new Error("blur() didn't affect activeElement");                            // 31
};                                                                                    // 32
                                                                                      // 33
clickElement = function(elem) {                                                       // 34
  if (elem.click)                                                                     // 35
    elem.click(); // supported by form controls cross-browser; most native way        // 36
  else                                                                                // 37
    simulateEvent(elem, 'click');                                                     // 38
};                                                                                    // 39
                                                                                      // 40
////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/test-helpers/seeded_random.js                                             //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
SeededRandom = function(seed) { // seed may be a string or any type                   // 1
  if (! (this instanceof SeededRandom))                                               // 2
    return new SeededRandom(seed);                                                    // 3
                                                                                      // 4
  seed = seed || "seed";                                                              // 5
  this.gen = Random.create(seed).alea; // from random.js                              // 6
};                                                                                    // 7
SeededRandom.prototype.next = function() {                                            // 8
  return this.gen();                                                                  // 9
};                                                                                    // 10
SeededRandom.prototype.nextBoolean = function() {                                     // 11
  return this.next() >= 0.5;                                                          // 12
};                                                                                    // 13
SeededRandom.prototype.nextIntBetween = function(min, max) {                          // 14
  // inclusive of min and max                                                         // 15
  return Math.floor(this.next() * (max-min+1)) + min;                                 // 16
};                                                                                    // 17
SeededRandom.prototype.nextIdentifier = function(optLen) {                            // 18
  var letters = [];                                                                   // 19
  var len = (typeof optLen === "number" ? optLen : 12);                               // 20
  for(var i=0; i<len; i++)                                                            // 21
    letters.push(String.fromCharCode(this.nextIntBetween(97, 122)));                  // 22
  var x;                                                                              // 23
  return letters.join('');                                                            // 24
};                                                                                    // 25
SeededRandom.prototype.nextChoice = function(list) {                                  // 26
  return list[this.nextIntBetween(0, list.length-1)];                                 // 27
};                                                                                    // 28
                                                                                      // 29
////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/test-helpers/canonicalize_html.js                                         //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
canonicalizeHtml = function(html) {                                                   // 1
  var h = html;                                                                       // 2
  // kill IE-specific comments inserted by Spark                                      // 3
  h = h.replace(/<!--IE-->/g, '');                                                    // 4
  // ignore exact text of comments                                                    // 5
  h = h.replace(/<!--.*?-->/g, '<!---->');                                            // 6
  // make all tags lowercase                                                          // 7
  h = h.replace(/<\/?(\w+)/g, function(m) {                                           // 8
    return m.toLowerCase(); });                                                       // 9
  // kill \n and \r characters                                                        // 10
  h = h.replace(/[\n\r]/g, '');                                                       // 11
  // make tag attributes uniform                                                      // 12
  h = h.replace(/<(\w+)\s+(.*?)\s*>/g, function(m, tagName, attrs) {                  // 13
    // Drop expando property used by Sizzle (part of jQuery) which leaks into         // 14
    // attributes in IE8. Note that its value always contains spaces.                 // 15
    attrs = attrs.replace(/sizcache[0-9]+="[^"]*"/g, ' ');                            // 16
    attrs = attrs.replace(/\s*=\s*/g, '=');                                           // 17
    attrs = attrs.replace(/^\s+/g, '');                                               // 18
    attrs = attrs.replace(/\s+$/g, '');                                               // 19
    attrs = attrs.replace(/\s+/g, ' ');                                               // 20
    var attrList = attrs.split(' ');                                                  // 21
    // put attributes in alphabetical order                                           // 22
    attrList.sort();                                                                  // 23
    var tagContents = [tagName];                                                      // 24
    for(var i=0; i<attrList.length; i++) {                                            // 25
      var a = attrList[i].split('=');                                                 // 26
      if (a.length < 2)                                                               // 27
        a.push(a[0]); // things like checked=checked, in theory                       // 28
      var key = a[0];                                                                 // 29
      // Drop another expando property used by Sizzle.                                // 30
      if (key === 'sizset')                                                           // 31
        continue;                                                                     // 32
      var value = a[1];                                                               // 33
      value = value.replace(/["'`]/g, '"');                                           // 34
      if (value.charAt(0) !== '"')                                                    // 35
        value = '"'+value+'"';                                                        // 36
      tagContents.push(key+'='+value);                                                // 37
    }                                                                                 // 38
                                                                                      // 39
    return '<'+tagContents.join(' ')+'>';                                             // 40
  });                                                                                 // 41
  return h;                                                                           // 42
};                                                                                    // 43
                                                                                      // 44
////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/test-helpers/onscreendiv.js                                               //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
// OnscreenDiv is an object that appends a DIV to the document                        // 1
// body and keeps track of it, providing methods that query it,                       // 2
// mutate, and destroy it.                                                            // 3
//                                                                                    // 4
// By default the DIV has style 'display: none'.                                      // 5
//                                                                                    // 6
// In general, methods of OnscreenDiv operate on the contents                         // 7
// of the DIV excluding the DIV itself.                                               // 8
                                                                                      // 9
// Constructor, with optional 'new':                                                  // 10
// var d = [new] OnscreenDiv([frag])                                                  // 11
OnscreenDiv = function(optFrag) {                                                     // 12
  if (! (this instanceof OnscreenDiv))                                                // 13
    return new OnscreenDiv(optFrag);                                                  // 14
                                                                                      // 15
  this.div = DomUtils.htmlToFragment(                                                 // 16
    '<div class="OnscreenDiv" style="display: none"></div>').firstChild;              // 17
  document.body.appendChild(this.div);                                                // 18
                                                                                      // 19
  if (optFrag)                                                                        // 20
    this.div.appendChild(optFrag);                                                    // 21
};                                                                                    // 22
                                                                                      // 23
// get the innerHTML of the DIV                                                       // 24
OnscreenDiv.prototype.rawHtml = function() {                                          // 25
  return this.div.innerHTML;                                                          // 26
};                                                                                    // 27
                                                                                      // 28
// get the innerHTML with some sanitization that tries                                // 29
// to produce predictable results across browsers.                                    // 30
OnscreenDiv.prototype.html = function() {                                             // 31
  return canonicalizeHtml(this.rawHtml());                                            // 32
};                                                                                    // 33
                                                                                      // 34
// get the text of the DIV                                                            // 35
OnscreenDiv.prototype.text = function() {                                             // 36
  return this.div.innerText || this.div.textContent;                                  // 37
};                                                                                    // 38
                                                                                      // 39
// get the DIV itself                                                                 // 40
OnscreenDiv.prototype.node = function() {                                             // 41
  return this.div;                                                                    // 42
};                                                                                    // 43
                                                                                      // 44
// remove the DIV from the document and trigger                                       // 45
// "fast GC" -- i.e., after the next Deps.flush()                                     // 46
// the DIV will be fully cleaned up by LiveUI.                                        // 47
OnscreenDiv.prototype.kill = function() {                                             // 48
  var self = this;                                                                    // 49
  if (self.div.parentNode)                                                            // 50
    self.div.parentNode.removeChild(self.div);                                        // 51
                                                                                      // 52
  Deps.afterFlush(function () {                                                       // 53
    Spark.finalize(self.div);                                                         // 54
  });                                                                                 // 55
};                                                                                    // 56
                                                                                      // 57
// remove the DIV from the document                                                   // 58
OnscreenDiv.prototype.remove = function() {                                           // 59
  this.div.parentNode.removeChild(this.div);                                          // 60
};                                                                                    // 61
                                                                                      // 62
// Show the div (which is otherwise display:none),                                    // 63
// for tests that require it or for debugging of tests.                               // 64
// If invisibly=true, make the div 0-height to obscure                                // 65
// the contents.                                                                      // 66
OnscreenDiv.prototype.show = function(invisibly) {                                    // 67
  this.div.style.display = "block";                                                   // 68
  if (invisibly) {                                                                    // 69
    this.div.style.height = 0;                                                        // 70
    this.div.style.overflow = 'hidden';                                               // 71
  }                                                                                   // 72
};                                                                                    // 73
                                                                                      // 74
////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/test-helpers/wrappedfrag.js                                               //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
// A WrappedFrag provides utility methods pertaining to a given                       // 1
// DocumentFragment that are helpful in tests.  For example,                          // 2
// WrappedFrag(frag).html() constructs a sort of cross-browser                        // 3
// innerHTML for the fragment.                                                        // 4
                                                                                      // 5
// Constructor, with optional 'new':                                                  // 6
// var f = [new] WrappedFrag([frag])                                                  // 7
WrappedFrag = function(frag) {                                                        // 8
  if (! (this instanceof WrappedFrag))                                                // 9
    return new WrappedFrag(frag);                                                     // 10
                                                                                      // 11
  this.frag = frag;                                                                   // 12
};                                                                                    // 13
                                                                                      // 14
WrappedFrag.prototype.rawHtml = function() {                                          // 15
  return DomUtils.fragmentToHtml(this.frag);                                          // 16
};                                                                                    // 17
                                                                                      // 18
WrappedFrag.prototype.html = function() {                                             // 19
  return canonicalizeHtml(this.rawHtml());                                            // 20
};                                                                                    // 21
                                                                                      // 22
WrappedFrag.prototype.hold = function() {                                             // 23
  // increments frag's GC protection reference count                                  // 24
  this.frag["_protect"] = (this.frag["_protect"] || 0) + 1;                           // 25
  return this;                                                                        // 26
};                                                                                    // 27
                                                                                      // 28
WrappedFrag.prototype.release = function() {                                          // 29
  var frag = this.frag;                                                               // 30
  // decrement frag's GC protection reference count                                   // 31
  // Clean up on flush, if hits 0.  Wait to decrement                                 // 32
  // so no one else cleans it up first.                                               // 33
  Deps.afterFlush(function () {                                                       // 34
    if (! --frag["_protect"]) {                                                       // 35
      Spark.finalize(frag);                                                           // 36
    }                                                                                 // 37
  });                                                                                 // 38
  return this;                                                                        // 39
};                                                                                    // 40
                                                                                      // 41
WrappedFrag.prototype.node = function() {                                             // 42
  return this.frag;                                                                   // 43
};                                                                                    // 44
                                                                                      // 45
////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/test-helpers/current_style.js                                             //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
// Cross-browser implementation of getting the computed style of an element.          // 1
getStyleProperty = function(n, prop) {                                                // 2
  if (n.currentStyle) {                                                               // 3
    // camelCase it for IE                                                            // 4
    return n.currentStyle[prop.replace(                                               // 5
      /-([a-z])/g,                                                                    // 6
      function(x,y) { return y.toUpperCase(); })];                                    // 7
  } else {                                                                            // 8
    return window.getComputedStyle(n, null).getPropertyValue(prop);                   // 9
  }                                                                                   // 10
};                                                                                    // 11
                                                                                      // 12
////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/test-helpers/reactivevar.js                                               //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
// ReactiveVar is like a portable Session var.  When you get it,                      // 1
// it registers a dependency, and when it's set, it invalidates                       // 2
// its dependencies.                                                                  // 3
//                                                                                    // 4
// When set to a primitive value, invalidation                                        // 5
// is only fired if the new value is !== the old one.  When set                       // 6
// to an object value, invalidation always happens.  Each behavior                    // 7
// may be desirable in different test scenarios.                                      // 8
// body and keeps track of it, providing methods that query it,                       // 9
// mutate, and destroy it.                                                            // 10
//                                                                                    // 11
// Constructor, with optional 'new':                                                  // 12
// var R = [new] ReactiveVar([initialValue])                                          // 13
                                                                                      // 14
ReactiveVar = function(initialValue) {                                                // 15
  if (! (this instanceof ReactiveVar))                                                // 16
    return new ReactiveVar(initialValue);                                             // 17
                                                                                      // 18
  this._value = (typeof initialValue === "undefined" ? null :                         // 19
                 initialValue);                                                       // 20
  this._deps = new Deps.Dependency;                                                   // 21
};                                                                                    // 22
                                                                                      // 23
ReactiveVar.prototype.get = function() {                                              // 24
  this._deps.depend();                                                                // 25
  return this._value;                                                                 // 26
};                                                                                    // 27
                                                                                      // 28
ReactiveVar.prototype.set = function(newValue) {                                      // 29
  // detect equality and don't invalidate dependers                                   // 30
  // when value is a primitive.                                                       // 31
  if ((typeof newValue !== 'object') && this._value === newValue)                     // 32
    return;                                                                           // 33
                                                                                      // 34
  this._value = newValue;                                                             // 35
                                                                                      // 36
  this._deps.changed();                                                               // 37
};                                                                                    // 38
                                                                                      // 39
ReactiveVar.prototype.numListeners = function() {                                     // 40
  // accesses private field (tests want to know)                                      // 41
  return _.keys(this._deps._dependentsById).length;                                   // 42
};                                                                                    // 43
                                                                                      // 44
////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/test-helpers/callback_logger.js                                           //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
// This file allows you to write tests that expect certain callbacks to be            // 1
// called in certain orders, or optionally in groups where the order does not         // 2
// matter.  It can be set up in either a synchronous manner, so that each             // 3
// callback must have already occured before you call expectResult & its ilk, or      // 4
// in an asynchronous manner, so that the logger yields and waits a reasonable        // 5
// timeout for the callback.  Because we're using Node Fibers to yield & start        // 6
// ourselves, the asynchronous version is only available on the server.               // 7
                                                                                      // 8
var Fiber = Meteor.isServer ? Npm.require('fibers') : null;                           // 9
                                                                                      // 10
var TIMEOUT = 1000;                                                                   // 11
                                                                                      // 12
// Run the given function, passing it a correctly-set-up callback logger as an        // 13
// argument.  If we're meant to be running asynchronously, the function gets its      // 14
// own Fiber.                                                                         // 15
                                                                                      // 16
withCallbackLogger = function (test, callbackNames, async, fun) {                     // 17
  var logger = new CallbackLogger(test, callbackNames);                               // 18
  if (async) {                                                                        // 19
    if (!Fiber)                                                                       // 20
      throw new Error("Fiber is not available");                                      // 21
    logger.fiber = Fiber(_.bind(fun, null, logger));                                  // 22
    logger.fiber.run();                                                               // 23
  } else {                                                                            // 24
    fun(logger);                                                                      // 25
  }                                                                                   // 26
};                                                                                    // 27
                                                                                      // 28
var CallbackLogger = function (test, callbackNames) {                                 // 29
  var self = this;                                                                    // 30
  self._log = [];                                                                     // 31
  self._test = test;                                                                  // 32
  self._yielded = false;                                                              // 33
  _.each(callbackNames, function (callbackName) {                                     // 34
    self[callbackName] = function () {                                                // 35
      var args = _.toArray(arguments);                                                // 36
      self._log.push({callback: callbackName, args: args});                           // 37
      if (self.fiber) {                                                               // 38
        setTimeout(function () {                                                      // 39
          if (self._yielded)                                                          // 40
            self.fiber.run(callbackName);                                             // 41
        }, 0);                                                                        // 42
      }                                                                               // 43
    };                                                                                // 44
  });                                                                                 // 45
};                                                                                    // 46
                                                                                      // 47
CallbackLogger.prototype._yield = function (arg) {                                    // 48
  var self = this;                                                                    // 49
  self._yielded = true;                                                               // 50
  var y = Fiber.yield(arg);                                                           // 51
  self._yielded = false;                                                              // 52
  return y;                                                                           // 53
};                                                                                    // 54
                                                                                      // 55
CallbackLogger.prototype.expectResult = function (callbackName, args) {               // 56
  var self = this;                                                                    // 57
  self._waitForLengthOrTimeout(1);                                                    // 58
  if (_.isEmpty(self._log)) {                                                         // 59
    self._test.fail(["Expected callback " + callbackName + " got none"]);             // 60
    return;                                                                           // 61
  }                                                                                   // 62
  var result = self._log.shift();                                                     // 63
  self._test.equal(result.callback, callbackName);                                    // 64
  self._test.equal(result.args, args);                                                // 65
};                                                                                    // 66
                                                                                      // 67
CallbackLogger.prototype.expectResultOnly = function (callbackName, args) {           // 68
  var self = this;                                                                    // 69
  self.expectResult(callbackName, args);                                              // 70
  self._expectNoResultImpl();                                                         // 71
}                                                                                     // 72
                                                                                      // 73
CallbackLogger.prototype._waitForLengthOrTimeout = function (len) {                   // 74
  var self = this;                                                                    // 75
  if (self.fiber) {                                                                   // 76
    var timeLeft = TIMEOUT;                                                           // 77
    var startTime = new Date();                                                       // 78
    var handle = setTimeout(function () {                                             // 79
      self.fiber.run(handle);                                                         // 80
    }, TIMEOUT);                                                                      // 81
    while (self._log.length < len) {                                                  // 82
      if (self._yield() === handle) {                                                 // 83
        break;                                                                        // 84
      }                                                                               // 85
    }                                                                                 // 86
    clearTimeout(handle);                                                             // 87
  }                                                                                   // 88
};                                                                                    // 89
                                                                                      // 90
CallbackLogger.prototype.expectResultUnordered = function (list) {                    // 91
  var self = this;                                                                    // 92
                                                                                      // 93
  self._waitForLengthOrTimeout(list.length);                                          // 94
                                                                                      // 95
  list = _.clone(list); // shallow copy.                                              // 96
  var i = list.length;                                                                // 97
  while (i > 0) {                                                                     // 98
    var found = false;                                                                // 99
    var dequeued = self._log.shift();                                                 // 100
    for (var j = 0; j < list.length; j++) {                                           // 101
      if (_.isEqual(list[j], dequeued)) {                                             // 102
        list.splice(j, 1);                                                            // 103
        found = true;                                                                 // 104
        break;                                                                        // 105
      }                                                                               // 106
    }                                                                                 // 107
    if (!found)                                                                       // 108
      self._test.fail(["Found unexpected result: " + JSON.stringify(dequeued)]);      // 109
    i--;                                                                              // 110
  }                                                                                   // 111
};                                                                                    // 112
                                                                                      // 113
CallbackLogger.prototype._expectNoResultImpl = function () {                          // 114
  var self = this;                                                                    // 115
  self._test.length(self._log, 0);                                                    // 116
};                                                                                    // 117
                                                                                      // 118
CallbackLogger.prototype.expectNoResult = function () {                               // 119
  var self = this;                                                                    // 120
  if (self.fiber) {                                                                   // 121
    var handle = setTimeout(function () {                                             // 122
      self.fiber.run(handle);                                                         // 123
    }, TIMEOUT);                                                                      // 124
    var foo = self._yield();                                                          // 125
    while (_.isEmpty(self._log) && foo !== handle) {                                  // 126
      foo = self._yield();                                                            // 127
    }                                                                                 // 128
    clearTimeout(handle);                                                             // 129
  }                                                                                   // 130
  self._expectNoResultImpl();                                                         // 131
};                                                                                    // 132
                                                                                      // 133
////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
