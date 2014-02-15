(function () {

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/minifiers/minifiers.js                                   //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
var CleanCss = Npm.require('clean-css');                             // 1
                                                                     // 2
CleanCSSProcess = function (source, options) {                       // 3
  var instance = new CleanCss(options);                              // 4
  return instance.minify(source);                                    // 5
};                                                                   // 6
                                                                     // 7
UglifyJSMinify = Npm.require('uglify-js').minify;                    // 8
                                                                     // 9
///////////////////////////////////////////////////////////////////////

}).call(this);
