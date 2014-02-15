(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/meteor/server_environment_test.js                                    //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
Tinytest.add("environment - server basics", function (test) {                    // 1
  test.isFalse(Meteor.isClient);                                                 // 2
  test.isTrue(Meteor.isServer);                                                  // 3
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
// packages/meteor/fiber_helpers_test.js                                         //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
var Fiber = Npm.require('fibers');                                               // 1
                                                                                 // 2
Tinytest.add("fibers - synchronous queue", function (test) {                     // 3
  var q = new Meteor._SynchronousQueue;                                          // 4
  var output = [];                                                               // 5
  var pusher = function (n) {                                                    // 6
    return function () {                                                         // 7
      output.push(n);                                                            // 8
    };                                                                           // 9
  };                                                                             // 10
  var outputIsUpTo = function (n) {                                              // 11
    test.equal(output, _.range(1, n+1));                                         // 12
  };                                                                             // 13
                                                                                 // 14
  // Queue a task. It cannot run until we yield.                                 // 15
  q.queueTask(pusher(1));                                                        // 16
  outputIsUpTo(0);                                                               // 17
                                                                                 // 18
  // Run another task. After queueing it, the fiber constructed here will yield  // 19
  // back to this outer function. No task can have run yet since the main test   // 20
  // fiber still will not have yielded.                                          // 21
  var runTask2Done = false;                                                      // 22
  Fiber(function () {                                                            // 23
    q.runTask(pusher(2));                                                        // 24
    runTask2Done = true;                                                         // 25
  }).run();                                                                      // 26
  outputIsUpTo(0);                                                               // 27
  test.isFalse(runTask2Done);                                                    // 28
                                                                                 // 29
  // Queue a third task. Still no outer yields, so still no runs.                // 30
  q.queueTask(function () {                                                      // 31
    output.push(3);                                                              // 32
    // This task gets queued once we actually start running functions, which     // 33
    // isn't until the runTask(pusher(4)), so it gets queued after Task #4.      // 34
    q.queueTask(pusher(5));                                                      // 35
  });                                                                            // 36
  outputIsUpTo(0);                                                               // 37
  test.isFalse(runTask2Done);                                                    // 38
                                                                                 // 39
  // Run a task and block for it to be done. All queued tasks up to this one     // 40
  // will now be run.                                                            // 41
  q.runTask(pusher(4));                                                          // 42
  outputIsUpTo(4);                                                               // 43
  test.isTrue(runTask2Done);                                                     // 44
                                                                                 // 45
  // Task #5 is still in the queue. Run another task synchronously.              // 46
  q.runTask(pusher(6));                                                          // 47
  outputIsUpTo(6);                                                               // 48
                                                                                 // 49
  // Queue a task that throws. It'll write some debug output, but that's it.     // 50
  Meteor._suppress_log(1);                                                       // 51
  q.queueTask(function () {                                                      // 52
    throw new Error("bla");                                                      // 53
  });                                                                            // 54
  // let it run.                                                                 // 55
  q.runTask(pusher(7));                                                          // 56
  outputIsUpTo(7);                                                               // 57
                                                                                 // 58
  // Run a task that throws. It should throw from runTask.                       // 59
  Meteor._suppress_log(1);                                                       // 60
  test.throws(function () {                                                      // 61
    q.runTask(function () {                                                      // 62
      throw new Error("this is thrown");                                         // 63
    });                                                                          // 64
  });                                                                            // 65
});                                                                              // 66
                                                                                 // 67
///////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/meteor/wrapasync_test.js                                             //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
var asyncFunction1 = function (x, cb) {                                          // 1
  setTimeout(function () { cb(null, x); }, 5);                                   // 2
};                                                                               // 3
var asyncFunction2 = function (x, opt, cb) {                                     // 4
  if (! cb && opt instanceof Function) {                                         // 5
    cb = opt;                                                                    // 6
    opt = null;                                                                  // 7
  }                                                                              // 8
  asyncFunction1(x, cb);                                                         // 9
};                                                                               // 10
var asyncFunction3 = function (opt, cb) {                                        // 11
  if (! cb && opt instanceof Function) {                                         // 12
    cb = opt;                                                                    // 13
    opt = null;                                                                  // 14
  }                                                                              // 15
  asyncFunction1(3, cb);                                                         // 16
};                                                                               // 17
var asyncFunction4 = function (cb) {                                             // 18
  asyncFunction1(3, cb);                                                         // 19
};                                                                               // 20
var wrapped1 = Meteor._wrapAsync(asyncFunction1);                                // 21
var wrapped2 = Meteor._wrapAsync(asyncFunction2);                                // 22
var wrapped3 = Meteor._wrapAsync(asyncFunction3);                                // 23
var wrapped4 = Meteor._wrapAsync(asyncFunction4);                                // 24
                                                                                 // 25
Tinytest.add("environment - wrapAsync sync", function (test) {                   // 26
  // one required arg and callback                                               // 27
  test.equal(wrapped1(3), 3);                                                    // 28
  test.equal(wrapped1(3, undefined), 3);                                         // 29
  // one required arg, optional second arg, callback                             // 30
  test.equal(wrapped2(3), 3);                                                    // 31
  test.equal(wrapped2(3, {foo: "bar"}), 3);                                      // 32
  test.equal(wrapped2(3, undefined, undefined), 3);                              // 33
  test.equal(wrapped2(3, {foo: "bar"}, undefined), 3);                           // 34
  // optional first arg, callback                                                // 35
  test.equal(wrapped3(3), 3);                                                    // 36
  test.equal(wrapped3(3, undefined), 3);                                         // 37
  test.equal(wrapped3(), 3);                                                     // 38
  test.equal(wrapped3(undefined), 3);                                            // 39
  // only callback                                                               // 40
  test.equal(wrapped4(), 3);                                                     // 41
  test.equal(wrapped4(undefined), 3);                                            // 42
});                                                                              // 43
                                                                                 // 44
testAsyncMulti("environment - wrapAsync async", [                                // 45
  function (test, expect) {                                                      // 46
    var cb = function (result) {                                                 // 47
      return expect(null, result);                                               // 48
    };                                                                           // 49
    // one required arg and callback                                             // 50
    test.equal(wrapped1(3, cb(3)), undefined);                                   // 51
    // one required arg, optional second arg, callback                           // 52
    test.equal(wrapped2(3, cb(3)), undefined);                                   // 53
    test.equal(wrapped2(3, {foo: "bar"}, cb(3)), undefined);                     // 54
    test.equal(wrapped2(3, undefined, cb(3)), undefined);                        // 55
    // optional first arg, callback                                              // 56
    test.equal(wrapped3(3, cb(3)), undefined);                                   // 57
    test.equal(wrapped3(cb(3)), undefined);                                      // 58
    test.equal(wrapped3(undefined, cb(3)), undefined);                           // 59
    // only callback                                                             // 60
    test.equal(wrapped4(cb(3)), undefined);                                      // 61
  }                                                                              // 62
]);                                                                              // 63
                                                                                 // 64
Tinytest.addAsync("environment - wrapAsync callback is " +                       // 65
                  "in fiber", function (test, onComplete) {                      // 66
                    var cb = function (err, result) {                            // 67
                      if (Meteor.isServer) {                                     // 68
                        var Fiber = Npm.require('fibers');                       // 69
                        test.isTrue(Fiber.current);                              // 70
                      }                                                          // 71
                      onComplete();                                              // 72
                    };                                                           // 73
                    wrapped1(3, cb);                                             // 74
                  });                                                            // 75
                                                                                 // 76
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
