(function () {

//////////////////////////////////////////////////////////////////////////////
//                                                                          //
// packages/test-helpers/seeded_random_test.js                              //
//                                                                          //
//////////////////////////////////////////////////////////////////////////////
                                                                            //
// XXX SECTION: Meta tests                                                  // 1
                                                                            // 2
Tinytest.add("seeded random", function (test) {                             // 3
  // Test that two seeded PRNGs with the same seed produce the same values. // 4
  var seed = "I'm a seed";                                                  // 5
  var sr1 = new SeededRandom(seed);                                         // 6
  var sr2 = new SeededRandom(seed);                                         // 7
  var sr1vals = [];                                                         // 8
  var sr2vals = [];                                                         // 9
  for (var i = 0; i < 100; i++) {                                           // 10
    sr1vals.push(sr1.next());                                               // 11
    sr2vals.push(sr2.next());                                               // 12
  }                                                                         // 13
  test.equal(sr1vals, sr2vals);                                             // 14
});                                                                         // 15
                                                                            // 16
//////////////////////////////////////////////////////////////////////////////

}).call(this);
