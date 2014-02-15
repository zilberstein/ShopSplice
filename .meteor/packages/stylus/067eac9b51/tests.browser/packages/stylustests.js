(function () {

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/stylus/stylus_tests.js                                   //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
                                                                     // 1
Tinytest.add("stylus - presence", function(test) {                   // 2
                                                                     // 3
  var d = OnscreenDiv(Meteor.render(function() {                     // 4
    return '<p class="stylus-dashy-left-border"></p>'; }));          // 5
  d.node().style.display = 'block';                                  // 6
                                                                     // 7
  var p = d.node().firstChild;                                       // 8
  var leftBorder = getStyleProperty(p, 'border-left-style');         // 9
  test.equal(leftBorder, "dashed");                                  // 10
                                                                     // 11
  d.kill();                                                          // 12
                                                                     // 13
});                                                                  // 14
                                                                     // 15
///////////////////////////////////////////////////////////////////////

}).call(this);
