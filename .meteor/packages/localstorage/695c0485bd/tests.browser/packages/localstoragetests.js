(function () {

/////////////////////////////////////////////////////////////////////////////
//                                                                         //
// packages/localstorage/localstorage_tests.js                             //
//                                                                         //
/////////////////////////////////////////////////////////////////////////////
                                                                           //
Tinytest.add("localStorage", function (test) {                             // 1
  // Doesn't actually test preservation across reloads since that is hard. // 2
  // userData should do that for us so it's unlikely this wouldn't work.   // 3
  Meteor._localStorage.setItem("key", "value");                            // 4
  test.equal(Meteor._localStorage.getItem("key"), "value");                // 5
  Meteor._localStorage.removeItem("key");                                  // 6
  test.equal(Meteor._localStorage.getItem("key"), null);                   // 7
});                                                                        // 8
                                                                           // 9
/////////////////////////////////////////////////////////////////////////////

}).call(this);
