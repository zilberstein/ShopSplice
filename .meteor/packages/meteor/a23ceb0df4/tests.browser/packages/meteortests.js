(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/meteor/client_environment_test.js                                    //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
Tinytest.add("environment - client basics", function (test) {                    // 1
  test.isTrue(Meteor.isClient);                                                  // 2
  test.isFalse(Meteor.isServer);                                                 // 3
});                                                                              // 4
                                                                                 // 5
///////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/meteor/helpers_test.js                                               //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
Tinytest.add("environment - helpers", function (test) {                          // 1
  /*** ensure ***/                                                               // 2
  var x = {};                                                                    // 3
  var y = Meteor._ensure(x, "a", "b", "c");                                      // 4
  test.equal(x, {a: {b: {c: {}}}});                                              // 5
  test.equal(y, {});                                                             // 6
  y.d = 12;                                                                      // 7
  test.equal(x, {a: {b: {c: {d: 12}}}});                                         // 8
  test.equal(y, {d: 12});                                                        // 9
                                                                                 // 10
  y = Meteor._ensure(x, "a", "b", "c");                                          // 11
  test.equal(x, {a: {b: {c: {d: 12}}}});                                         // 12
  test.equal(y, {d: 12});                                                        // 13
  y.x = 13;                                                                      // 14
  test.equal(x, {a: {b: {c: {d: 12, x: 13}}}});                                  // 15
  test.equal(y, {d: 12, x: 13});                                                 // 16
                                                                                 // 17
  y = Meteor._ensure(x, "a", "n");                                               // 18
  test.equal(x, {a: {b: {c: {d: 12, x: 13}}, n: {}}});                           // 19
  test.equal(y, {});                                                             // 20
  y.d = 22;                                                                      // 21
  test.equal(x, {a: {b: {c: {d: 12, x: 13}}, n: {d: 22}}});                      // 22
  test.equal(y, {d: 22});                                                        // 23
                                                                                 // 24
  Meteor._ensure(x, "a", "q", "r")["s"] = 99                                     // 25
  test.equal(x, {a: {b: {c: {d: 12, x: 13}}, n: {d: 22}, q: {r: {s: 99}}}});     // 26
                                                                                 // 27
  Meteor._ensure(x, "b")["z"] = 44;                                              // 28
  test.equal(x, {a: {b: {c: {d: 12, x: 13}}, n: {d: 22}, q: {r: {s: 99}}},       // 29
                 b: {z: 44}});                                                   // 30
                                                                                 // 31
  /*** delete ***/                                                               // 32
                                                                                 // 33
  x = {};                                                                        // 34
  Meteor._delete(x, "a", "b", "c");                                              // 35
  test.equal(x, {});                                                             // 36
                                                                                 // 37
  x = {a: {b: {}}};                                                              // 38
  Meteor._delete(x, "a", "b", "c");                                              // 39
  test.equal(x, {});                                                             // 40
                                                                                 // 41
  x = {a: {b: {}, n: {}}};                                                       // 42
  Meteor._delete(x, "a", "b", "c");                                              // 43
  test.equal(x, {a: {n: {}}});                                                   // 44
                                                                                 // 45
  x = {a: {b: {}}, n: {}};                                                       // 46
  Meteor._delete(x, "a", "b", "c");                                              // 47
  test.equal(x, {n: {}});                                                        // 48
                                                                                 // 49
  x = {a: {b: 99}};                                                              // 50
  Meteor._delete(x, "a", "b", "c");                                              // 51
  test.equal(x, {});                                                             // 52
                                                                                 // 53
  x = {a: {b: 99}};                                                              // 54
  Meteor._delete(x, "a", "b", "c", "d");                                         // 55
  test.equal(x, {});                                                             // 56
                                                                                 // 57
  x = {a: {b: 99}};                                                              // 58
  Meteor._delete(x, "a", "b", "c", "d", "e", "f");                               // 59
  test.equal(x, {});                                                             // 60
                                                                                 // 61
  x = {a: {b: {c: {d: 99}}}, x: 12};                                             // 62
  Meteor._delete(x, "a", "b", "c", "d");                                         // 63
  test.equal(x, {x: 12});                                                        // 64
                                                                                 // 65
  x = {a: {b: {c: {d: 99}}, x: 12}};                                             // 66
  Meteor._delete(x, "a", "b", "c", "d");                                         // 67
  test.equal(x, {a: {x: 12}});                                                   // 68
                                                                                 // 69
  x = {a: 12, b: 13};                                                            // 70
  Meteor._delete(x, "a");                                                        // 71
  test.equal(x, {b: 13});                                                        // 72
                                                                                 // 73
  x = {a: 12};                                                                   // 74
  Meteor._delete(x, "a");                                                        // 75
  test.equal(x, {});                                                             // 76
});                                                                              // 77
                                                                                 // 78
///////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/meteor/dynamics_test.js                                              //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
var CurrentFoo = new Meteor.EnvironmentVariable;                                 // 1
                                                                                 // 2
Tinytest.add("environment - dynamic variables", function (test) {                // 3
  test.equal(CurrentFoo.get(), undefined);                                       // 4
                                                                                 // 5
  CurrentFoo.withValue(17, function () {                                         // 6
    test.equal(CurrentFoo.get(), 17);                                            // 7
                                                                                 // 8
    CurrentFoo.withValue(22, function () {                                       // 9
      test.equal(CurrentFoo.get(), 22);                                          // 10
    });                                                                          // 11
                                                                                 // 12
    test.equal(CurrentFoo.get(), 17);                                            // 13
  });                                                                            // 14
                                                                                 // 15
  test.equal(CurrentFoo.get(), undefined);                                       // 16
});                                                                              // 17
                                                                                 // 18
Tinytest.add("environment - bindEnvironment", function (test) {                  // 19
  var raised_f;                                                                  // 20
                                                                                 // 21
  var f = CurrentFoo.withValue(17, function () {                                 // 22
    return Meteor.bindEnvironment(function (flag) {                              // 23
      test.equal(CurrentFoo.get(), 17);                                          // 24
      if (flag)                                                                  // 25
        throw "test";                                                            // 26
      return 12;                                                                 // 27
    }, function (e) {                                                            // 28
      test.equal(CurrentFoo.get(), 17);                                          // 29
      raised_f = e;                                                              // 30
    });                                                                          // 31
  });                                                                            // 32
                                                                                 // 33
  var test_f = function () {                                                     // 34
    raised_f = null;                                                             // 35
                                                                                 // 36
    test.equal(f(false), 12);                                                    // 37
    test.equal(raised_f, null);                                                  // 38
                                                                                 // 39
    test.equal(f(true), undefined);                                              // 40
    test.equal(raised_f, "test");                                                // 41
  };                                                                             // 42
                                                                                 // 43
  // At top level                                                                // 44
                                                                                 // 45
  test.equal(CurrentFoo.get(), undefined);                                       // 46
  test_f();                                                                      // 47
                                                                                 // 48
  // Inside a withValue                                                          // 49
                                                                                 // 50
  CurrentFoo.withValue(22, function () {                                         // 51
    test.equal(CurrentFoo.get(), 22);                                            // 52
    test_f();                                                                    // 53
    test.equal(CurrentFoo.get(), 22);                                            // 54
  });                                                                            // 55
                                                                                 // 56
  test.equal(CurrentFoo.get(), undefined);                                       // 57
                                                                                 // 58
  // Multiple environment-bound functions on the stack (in the nodejs            // 59
  // implementation, this needs to avoid creating additional fibers)             // 60
                                                                                 // 61
  var raised_g;                                                                  // 62
                                                                                 // 63
  var g = CurrentFoo.withValue(99, function () {                                 // 64
    return Meteor.bindEnvironment(function (flag) {                              // 65
      test.equal(CurrentFoo.get(), 99);                                          // 66
                                                                                 // 67
      if (flag)                                                                  // 68
        throw "trial";                                                           // 69
                                                                                 // 70
      test_f();                                                                  // 71
      return 88;                                                                 // 72
    }, function (e) {                                                            // 73
      test.equal(CurrentFoo.get(), 99);                                          // 74
      raised_g = e;                                                              // 75
    });                                                                          // 76
  });                                                                            // 77
                                                                                 // 78
  var test_g = function () {                                                     // 79
    raised_g = null;                                                             // 80
                                                                                 // 81
    test.equal(g(false), 88);                                                    // 82
    test.equal(raised_g, null);                                                  // 83
                                                                                 // 84
    test.equal(g(true), undefined);                                              // 85
    test.equal(raised_g, "trial");                                               // 86
  };                                                                             // 87
                                                                                 // 88
  test_g();                                                                      // 89
                                                                                 // 90
  CurrentFoo.withValue(77, function () {                                         // 91
    test.equal(CurrentFoo.get(), 77);                                            // 92
    test_g();                                                                    // 93
    test.equal(CurrentFoo.get(), 77);                                            // 94
  });                                                                            // 95
                                                                                 // 96
  test.equal(CurrentFoo.get(), undefined);                                       // 97
});                                                                              // 98
                                                                                 // 99
Tinytest.addAsync("environment - bare bindEnvironment",                          // 100
                  function (test, onComplete) {                                  // 101
  // this will have to create a fiber in nodejs                                  // 102
  CurrentFoo.withValue(68, function () {                                         // 103
    var f = Meteor.bindEnvironment(function () {                                 // 104
      test.equal(CurrentFoo.get(), 68);                                          // 105
      onComplete();                                                              // 106
    }, function () {});                                                          // 107
                                                                                 // 108
    setTimeout(f, 0);                                                            // 109
  });                                                                            // 110
});                                                                              // 111
                                                                                 // 112
///////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/meteor/url_tests.js                                                  //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
Tinytest.add("absolute-url - basics", function(test) {                           // 1
                                                                                 // 2
  _.each(['', 'http://'], function (prefix) {                                    // 3
                                                                                 // 4
    test.equal(Meteor.absoluteUrl({rootUrl: prefix + 'asdf.com'}),               // 5
               'http://asdf.com/');                                              // 6
    test.equal(Meteor.absoluteUrl(undefined, {rootUrl: prefix + 'asdf.com'}),    // 7
               'http://asdf.com/');                                              // 8
    test.equal(Meteor.absoluteUrl(undefined, {rootUrl: prefix + 'asdf.com/'}),   // 9
               'http://asdf.com/');                                              // 10
                                                                                 // 11
    test.equal(Meteor.absoluteUrl('foo', {rootUrl: prefix + 'asdf.com/'}),       // 12
               'http://asdf.com/foo');                                           // 13
    test.equal(Meteor.absoluteUrl('/foo', {rootUrl: prefix + 'asdf.com'}),       // 14
               'http://asdf.com//foo');                                          // 15
    test.equal(Meteor.absoluteUrl('#foo', {rootUrl: prefix + 'asdf.com'}),       // 16
               'http://asdf.com/#foo');                                          // 17
                                                                                 // 18
    test.equal(Meteor.absoluteUrl('foo', {rootUrl: prefix + 'asdf.com',          // 19
                                          secure: true}),                        // 20
               'https://asdf.com/foo');                                          // 21
    test.equal(Meteor.absoluteUrl('foo', {rootUrl: 'https://asdf.com',           // 22
                                          secure: true}),                        // 23
               'https://asdf.com/foo');                                          // 24
    test.equal(Meteor.absoluteUrl('foo', {rootUrl: 'https://asdf.com',           // 25
                                          secure: false}),                       // 26
               'https://asdf.com/foo');                                          // 27
                                                                                 // 28
    test.equal(Meteor.absoluteUrl('foo', {rootUrl: prefix + 'localhost',         // 29
                                          secure: true}),                        // 30
               'http://localhost/foo');                                          // 31
    test.equal(Meteor.absoluteUrl('foo', {rootUrl: prefix + 'localhost:3000',    // 32
                                          secure: true}),                        // 33
               'http://localhost:3000/foo');                                     // 34
    test.equal(Meteor.absoluteUrl('foo', {rootUrl: 'https://localhost:3000',     // 35
                                          secure: true}),                        // 36
               'https://localhost:3000/foo');                                    // 37
    test.equal(Meteor.absoluteUrl('foo', {rootUrl: prefix + '127.0.0.1:3000',    // 38
                                          secure: true}),                        // 39
               'http://127.0.0.1:3000/foo');                                     // 40
                                                                                 // 41
    // test replaceLocalhost                                                     // 42
    test.equal(Meteor.absoluteUrl('foo', {rootUrl: prefix + 'localhost:3000',    // 43
                                          replaceLocalhost: true}),              // 44
               'http://127.0.0.1:3000/foo');                                     // 45
    test.equal(Meteor.absoluteUrl('foo', {rootUrl: prefix + 'localhost',         // 46
                                          replaceLocalhost: true}),              // 47
               'http://127.0.0.1/foo');                                          // 48
    test.equal(Meteor.absoluteUrl('foo', {rootUrl: prefix + '127.0.0.1:3000',    // 49
                                          replaceLocalhost: true}),              // 50
               'http://127.0.0.1:3000/foo');                                     // 51
    test.equal(Meteor.absoluteUrl('foo', {rootUrl: prefix + '127.0.0.1',         // 52
                                          replaceLocalhost: true}),              // 53
               'http://127.0.0.1/foo');                                          // 54
    // don't replace just any localhost                                          // 55
    test.equal(Meteor.absoluteUrl('foo', {rootUrl: prefix + 'foo.com/localhost', // 56
                                          replaceLocalhost: true}),              // 57
               'http://foo.com/localhost/foo');                                  // 58
    test.equal(Meteor.absoluteUrl('foo', {rootUrl: prefix + 'foo.localhost.com', // 59
                                          replaceLocalhost: true}),              // 60
               'http://foo.localhost.com/foo');                                  // 61
  });                                                                            // 62
});                                                                              // 63
                                                                                 // 64
                                                                                 // 65
Tinytest.add("absolute-url - environment", function(test) {                      // 66
  // make sure our test runner set the runtime configuration, and this           // 67
  // propagates to the client.                                                   // 68
  test.isTrue(/^http/.test(__meteor_runtime_config__.ROOT_URL));                 // 69
});                                                                              // 70
                                                                                 // 71
///////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/meteor/timers_tests.js                                               //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
Tinytest.addAsync('timers - defer', function (test, onComplete) {                // 1
  var x = 'a';                                                                   // 2
  Meteor.defer(function () {                                                     // 3
    test.equal(x, 'b');                                                          // 4
    onComplete();                                                                // 5
  });                                                                            // 6
  x = 'b';                                                                       // 7
});                                                                              // 8
                                                                                 // 9
Tinytest.addAsync('timers - nested defer', function (test, onComplete) {         // 10
  var x = 'a';                                                                   // 11
  Meteor.defer(function () {                                                     // 12
    test.equal(x, 'b');                                                          // 13
    Meteor.defer(function () {                                                   // 14
      test.equal(x, 'c');                                                        // 15
      onComplete();                                                              // 16
    });                                                                          // 17
    x = 'c';                                                                     // 18
  });                                                                            // 19
  x = 'b';                                                                       // 20
});                                                                              // 21
                                                                                 // 22
///////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/meteor/debug_test.js                                                 //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
Tinytest.add("core - debug", function (test) {                                   // 1
                                                                                 // 2
  // Just run a log statement and make sure it doesn't explode.                  // 3
  Meteor._suppress_log(3);                                                       // 4
  Meteor._debug();                                                               // 5
  Meteor._debug("test one arg");                                                 // 6
  Meteor._debug("this", "is", "a", "test");                                      // 7
  test.ok();                                                                     // 8
                                                                                 // 9
});                                                                              // 10
                                                                                 // 11
///////////////////////////////////////////////////////////////////////////////////

}).call(this);






///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/meteor/bare_test_setup.js                                            //
// This file is in bare mode and is not in its own closure.                      //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
// Normally, a var should be file-local, but this file is loaded with {bare:     // 1
// true}, so it should be readable by bare_tests.js                              // 2
var VariableSetByBareTestSetup = 1234;                                           // 3
                                                                                 // 4






(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/meteor/bare_tests.js                                                 //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
Tinytest.add("linker - bare", function (test) {                                  // 1
  test.equal(VariableSetByBareTestSetup, 1234);                                  // 2
});                                                                              // 3
                                                                                 // 4
///////////////////////////////////////////////////////////////////////////////////

}).call(this);
