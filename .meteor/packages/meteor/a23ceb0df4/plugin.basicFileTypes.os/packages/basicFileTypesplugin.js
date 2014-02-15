(function () {

(function () {

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// plugin/basic-file-types.js                                          //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
/* "js" handler is now hardcoded in packages.js.. necessarily, because // 1
   we can't exactly define the *.js source file handler in a *.js      // 2
   source file. */                                                     // 3
                                                                       // 4
Plugin.registerSourceHandler("css", function (compileStep) {           // 5
  // XXX annoying that this is replicated in .css, .less, and .styl    // 6
  if (! compileStep.archMatches('browser')) {                          // 7
    // XXX in the future, might be better to emit some kind of a       // 8
    // warning if a stylesheet is included on the server, rather than  // 9
    // silently ignoring it. but that would mean you can't stick .css  // 10
    // at the top level of your app, which is kind of silly.           // 11
    return;                                                            // 12
  }                                                                    // 13
                                                                       // 14
  compileStep.addStylesheet({                                          // 15
    data: compileStep.read().toString('utf8'),                         // 16
    path: compileStep.inputPath                                        // 17
  });                                                                  // 18
});                                                                    // 19
                                                                       // 20
/////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.basicFileTypes = {};

})();
