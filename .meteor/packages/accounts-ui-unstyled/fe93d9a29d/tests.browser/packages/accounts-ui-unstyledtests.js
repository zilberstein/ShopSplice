(function () {

////////////////////////////////////////////////////////////////////////////////////
//                                                                                //
// packages/accounts-ui-unstyled/accounts_ui_tests.js                             //
//                                                                                //
////////////////////////////////////////////////////////////////////////////////////
                                                                                  //
// XXX Most of the testing of accounts-ui is done manually, across                // 1
// multiple browsers using examples/unfinished/accounts-ui-helper. We             // 2
// should *definitely* automate this, but Tinytest is generally not               // 3
// the right abstraction to use for this.                                         // 4
                                                                                  // 5
                                                                                  // 6
// XXX it'd be cool to also test that the right thing happens if options          // 7
// *are* validated, but Accouns.ui._options is global state which makes this hard // 8
// (impossible?)                                                                  // 9
Tinytest.add('accounts-ui - config validates keys', function (test) {             // 10
  test.throws(function () {                                                       // 11
    Accounts.ui.config({foo: "bar"});                                             // 12
  });                                                                             // 13
                                                                                  // 14
  test.throws(function () {                                                       // 15
    Accounts.ui.config({passwordSignupFields: "not a valid option"});             // 16
  });                                                                             // 17
                                                                                  // 18
  test.throws(function () {                                                       // 19
    Accounts.ui.config({requestPermissions: {facebook: "not an array"}});         // 20
  });                                                                             // 21
});                                                                               // 22
                                                                                  // 23
////////////////////////////////////////////////////////////////////////////////////

}).call(this);
