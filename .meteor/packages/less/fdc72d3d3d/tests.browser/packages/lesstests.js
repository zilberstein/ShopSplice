(function () {

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/less/less_tests.js                                       //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
                                                                     // 1
Tinytest.add("less - presence", function(test) {                     // 2
                                                                     // 3
  var d = OnscreenDiv(Meteor.render(function() {                     // 4
    return '<p class="less-dashy-left-border"></p>'; }));            // 5
  d.node().style.display = 'block';                                  // 6
                                                                     // 7
  var p = d.node().firstChild;                                       // 8
  test.equal(getStyleProperty(p, 'border-left-style'), "dashed");    // 9
                                                                     // 10
  // test @import                                                    // 11
  test.equal(getStyleProperty(p, 'border-right-style'), "dotted");   // 12
                                                                     // 13
  d.kill();                                                          // 14
});                                                                  // 15
                                                                     // 16
///////////////////////////////////////////////////////////////////////

}).call(this);
