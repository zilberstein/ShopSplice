(function () {

(function () {

////////////////////////////////////////////////////////////////////////
//                                                                    //
// plugin/compile-stylus.js                                           //
//                                                                    //
////////////////////////////////////////////////////////////////////////
                                                                      //
var fs = Npm.require('fs');                                           // 1
var stylus = Npm.require('stylus');                                   // 2
var nib = Npm.require('nib');                                         // 3
var Future = Npm.require('fibers/future');                            // 4
                                                                      // 5
Plugin.registerSourceHandler("styl", function (compileStep) {         // 6
  // XXX annoying that this is replicated in .css, .less, and .styl   // 7
  if (! compileStep.archMatches('browser')) {                         // 8
    // XXX in the future, might be better to emit some kind of a      // 9
    // warning if a stylesheet is included on the server, rather than // 10
    // silently ignoring it. but that would mean you can't stick .css // 11
    // at the top level of your app, which is kind of silly.          // 12
    return;                                                           // 13
  }                                                                   // 14
                                                                      // 15
  var f = new Future;                                                 // 16
  stylus(compileStep.read().toString('utf8'))                         // 17
    .use(nib())                                                       // 18
    .set('filename', compileStep.inputPath)                           // 19
    .render(f.resolver());                                            // 20
                                                                      // 21
  try {                                                               // 22
    var css = f.wait();                                               // 23
  } catch (e) {                                                       // 24
    compileStep.error({                                               // 25
      message: "Stylus compiler error: " + e.message                  // 26
    });                                                               // 27
    return;                                                           // 28
  }                                                                   // 29
  compileStep.addStylesheet({                                         // 30
    path: compileStep.inputPath + ".css",                             // 31
    data: css                                                         // 32
  });                                                                 // 33
});                                                                   // 34
                                                                      // 35
////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.compileStylus = {};

})();
