(function () {

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/preserve-inputs/preserve-inputs.js                       //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
var inputTags = 'input textarea button select option'.split(' ');    // 1
                                                                     // 2
var selector = _.map(inputTags, function (t) {                       // 3
  return t.replace(/^.*$/, '$&[id], $&[name]');                      // 4
}).join(', ');                                                       // 5
                                                                     // 6
Spark._addGlobalPreserve(selector, Spark._labelFromIdOrName);        // 7
                                                                     // 8
///////////////////////////////////////////////////////////////////////

}).call(this);
