(function () {

(function () {

/////////////////////////////////////////////////////////////////////////////
//                                                                         //
// plugin/compile-less.js                                                  //
//                                                                         //
/////////////////////////////////////////////////////////////////////////////
                                                                           //
var fs = Npm.require('fs');                                                // 1
var path = Npm.require('path');                                            // 2
var less = Npm.require('less');                                            // 3
var Future = Npm.require('fibers/future');                                 // 4
                                                                           // 5
Plugin.registerSourceHandler("less", function (compileStep) {              // 6
  // XXX annoying that this is replicated in .css, .less, and .styl        // 7
  if (! compileStep.archMatches('browser')) {                              // 8
    // XXX in the future, might be better to emit some kind of a           // 9
    // warning if a stylesheet is included on the server, rather than      // 10
    // silently ignoring it. but that would mean you can't stick .css      // 11
    // at the top level of your app, which is kind of silly.               // 12
    return;                                                                // 13
  }                                                                        // 14
                                                                           // 15
  var source = compileStep.read().toString('utf8');                        // 16
  var options = {                                                          // 17
    // Use fs.readFileSync to process @imports. This is the bundler, so    // 18
    // that's not going to cause concurrency issues, and it means that (a) // 19
    // we don't have to use Futures and (b) errors thrown by bugs in less  // 20
    // actually get caught.                                                // 21
    syncImport: true,                                                      // 22
    paths: [path.dirname(compileStep._fullInputPath)] // for @import       // 23
  };                                                                       // 24
                                                                           // 25
  var f = new Future;                                                      // 26
  var css;                                                                 // 27
  try {                                                                    // 28
    less.render(source, options, f.resolver());                            // 29
    css = f.wait();                                                        // 30
  } catch (e) {                                                            // 31
    // less.render() is supposed to report any errors via its              // 32
    // callback. But sometimes, it throws them instead. This is            // 33
    // probably a bug in less. Be prepared for either behavior.            // 34
    compileStep.error({                                                    // 35
      message: "Less compiler error: " + e.message,                        // 36
      sourcePath: e.filename || compileStep.inputPath,                     // 37
      line: e.line - 1,  // dunno why, but it matches                      // 38
      column: e.column + 1                                                 // 39
    });                                                                    // 40
    return;                                                                // 41
  }                                                                        // 42
                                                                           // 43
  compileStep.addStylesheet({                                              // 44
    path: compileStep.inputPath + ".css",                                  // 45
    data: css                                                              // 46
  });                                                                      // 47
});;                                                                       // 48
                                                                           // 49
// Register lessimport files with the dependency watcher, without actually // 50
// processing them.                                                        // 51
Plugin.registerSourceHandler("lessimport", function () {                   // 52
  // Do nothing                                                            // 53
});                                                                        // 54
                                                                           // 55
/////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.compileLess = {};

})();
