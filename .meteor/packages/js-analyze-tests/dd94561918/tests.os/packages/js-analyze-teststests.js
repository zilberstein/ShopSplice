(function () {

//////////////////////////////////////////////////////////////////////////////////
//                                                                              //
// packages/js-analyze-tests/js_analyze_tests.js                                //
//                                                                              //
//////////////////////////////////////////////////////////////////////////////////
                                                                                //
Tinytest.add("js-analyze - findAssignedGlobals", function (test) {              // 1
                                                                                // 2
  var run = function (source, expected) {                                       // 3
    test.equal(JSAnalyze.findAssignedGlobals(source), expected);                // 4
  };                                                                            // 5
                                                                                // 6
  run('x', {});                                                                 // 7
  run('x + y', {});                                                             // 8
  run('x = y', {x: true});                                                      // 9
  run('var x; x = y', {});                                                      // 10
  run('var y; x = y', {x: true});                                               // 11
  run('var x,y; x = y', {});                                                    // 12
  run('for (x in y);', {x: true});                                              // 13
  run('for (var x in y);', {});                                                 // 14
  // Update operators cause ReferenceError if the left-hand is not defined.     // 15
  run('x++', {});                                                               // 16
  run('x += 5', {});                                                            // 17
  run('var x = y', {});                                                         // 18
  run('a.b[c.d]', {});                                                          // 19
  run('foo.bar[baz][c.d].z = 3', {});                                           // 20
  run('foo.bar(baz)[c.d].z = 3', {});                                           // 21
  run('var x = y.z; x.a = y; z.b;', {});                                        // 22
  run('Foo.Bar', {});                                                           // 23
  run('Foo.Bar = 3', {});                                                       // 24
  run(                                                                          // 25
    '(function (a, d) { var b = a, c; return f(a.z, b.z, c.z, d.z, e.z); })()', // 26
    {});                                                                        // 27
  // catch clause declares a name                                               // 28
  run('try { Foo } catch (e) { e = 5 }', {});                                   // 29
  run('try { Foo } catch (e) { Foo }', {});                                     // 30
  run('try { Foo } catch (Foo) { Foo }', {});                                   // 31
  run('try { e } catch (Foo) { Foo }', {});                                     // 32
  run('var x = function y () { return String(y); }', {});                       // 33
  run('a[b=c] = d', {b: true});                                                 // 34
  run('a.a.a[b.b.b=c.c.c] = d.d.d', {});                                        // 35
  // esprima ignores parentheses                                                // 36
  run('((((x)))) = 5', {x: true});                                              // 37
  // esprima ignores comments                                                   // 38
  run('x /* foo */ = 5', {x: true});                                            // 39
                                                                                // 40
  // Without ignoreEval, this thinks J is global.                               // 41
  run('function x(){var J;J=3;eval("foo");}', {});                              // 42
                                                                                // 43
  test.throws(function (){JSAnalyze.findAssignedGlobals("x = ");},              // 44
              function (e) { return e.$ParseError; });                          // 45
});                                                                             // 46
                                                                                // 47
                                                                                // 48
//////////////////////////////////////////////////////////////////////////////////

}).call(this);
