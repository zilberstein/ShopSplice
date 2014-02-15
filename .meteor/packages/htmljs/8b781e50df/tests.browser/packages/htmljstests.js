(function () {

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/htmljs/htmljs_test.js                                    //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
                                                                     // 1
Tinytest.add("htmljs", function (test) {                             // 2
  // Make sure "style" works, which has to be special-cased for IE.  // 3
  test.equal(DIV({style:"display:none"}).style.display, "none");     // 4
});                                                                  // 5
                                                                     // 6
///////////////////////////////////////////////////////////////////////

}).call(this);
