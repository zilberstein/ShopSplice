(function () {

//////////////////////////////////////////////////////////////////////////////////
//                                                                              //
// packages/random/random_tests.js                                              //
//                                                                              //
//////////////////////////////////////////////////////////////////////////////////
                                                                                //
Tinytest.add('random', function (test) {                                        // 1
  // Deterministic with a specified seed, which should generate the             // 2
  // same sequence in all environments.                                         // 3
  //                                                                            // 4
  // For repeatable unit test failures using deterministic random               // 5
  // number sequences it's fine if a new Meteor release changes the             // 6
  // algorithm being used and it starts generating a different                  // 7
  // sequence for a seed, as long as the sequence is consistent for             // 8
  // a particular release.                                                      // 9
  var random = Random.create(0);                                                // 10
  test.equal(random.id(), "cp9hWvhg8GSvuZ9os");                                 // 11
  test.equal(random.id(), "3f3k6Xo7rrHCifQhR");                                 // 12
  test.equal(random.id(), "shxDnjWWmnKPEoLhM");                                 // 13
  test.equal(random.id(), "6QTjB8C5SEqhmz4ni");                                 // 14
});                                                                             // 15
                                                                                // 16
// node crypto and window.crypto.getRandomValues() don't let us specify a seed, // 17
// but at least test that the output is in the right format.                    // 18
Tinytest.add('random - format', function (test) {                               // 19
  var idLen = 17;                                                               // 20
  test.equal(Random.id().length, idLen);                                        // 21
  var numDigits = 9;                                                            // 22
  var hexStr = Random.hexString(numDigits);                                     // 23
  test.equal(hexStr.length, numDigits);                                         // 24
  parseInt(hexStr, 16); // should not throw                                     // 25
  var frac = Random.fraction();                                                 // 26
  test.isTrue(frac < 1.0);                                                      // 27
  test.isTrue(frac >= 0.0);                                                     // 28
});                                                                             // 29
                                                                                // 30
//////////////////////////////////////////////////////////////////////////////////

}).call(this);
