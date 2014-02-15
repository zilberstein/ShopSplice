(function () {

////////////////////////////////////////////////////////////////////////////////
//                                                                            //
// packages/coffeescript/coffeescript_test_setup.js                           //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
                                                                              //
sharedFromJavascript = 135;                                                   // 1
                                                                              // 2
////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////
//                                                                            //
// packages/coffeescript/tests/coffeescript_tests.coffee.js                   //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
                                                                              //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.__COFFEESCRIPT_PRESENT = true;

share.coffeeShared = 789;

Tinytest.add("coffeescript - compile", function(test) {
  return test.isTrue(true);
});
////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////
//                                                                            //
// packages/coffeescript/tests/coffeescript_strict_tests.coffee.js            //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
                                                                              //
'use strict';  __coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var x, y,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

x = 5;

y = [];

__indexOf.call(y, x) >= 0;

Tinytest.add("coffeescript - shared", function(test) {
  test.equal(share.coffeeShared, 789);
  return test.equal(sharedFromJavascript, 135);
});
////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////
//                                                                            //
// packages/coffeescript/tests/litcoffeescript_tests.litcoffee.js             //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
                                                                              //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.__LITCOFFEESCRIPT_PRESENT = true;

Tinytest.add("literate coffeescript - compile", function(test) {
  return test.isTrue(true);
});
////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////
//                                                                            //
// packages/coffeescript/tests/litcoffeescript_tests.coffee.md.js             //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
                                                                              //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.__COFFEEMDSCRIPT_PRESENT = true;

Tinytest.add("markdown coffeescript - compile", function(test) {
  return test.isTrue(true);
});
////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////
//                                                                            //
// packages/coffeescript/coffeescript_tests.js                                //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////
                                                                              //
Tinytest.add("coffeescript - presence", function(test) {                      // 1
  test.isTrue(Meteor.__COFFEESCRIPT_PRESENT);                                 // 2
});                                                                           // 3
Tinytest.add("literate coffeescript - presence", function(test) {             // 4
  test.isTrue(Meteor.__LITCOFFEESCRIPT_PRESENT);                              // 5
  test.isTrue(Meteor.__COFFEEMDSCRIPT_PRESENT);                               // 6
});                                                                           // 7
                                                                              // 8
Tinytest.add("coffeescript - exported variable", function(test) {             // 9
  test.equal(COFFEESCRIPT_EXPORTED, 123);                                     // 10
  test.equal(Package['coffeescript-test-helper'].COFFEESCRIPT_EXPORTED, 123); // 11
});                                                                           // 12
////////////////////////////////////////////////////////////////////////////////

}).call(this);
