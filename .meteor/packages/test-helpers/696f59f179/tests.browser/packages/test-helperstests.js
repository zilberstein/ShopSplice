(function () {

//////////////////////////////////////////////////////////////////////////////
//                                                                          //
// packages/test-helpers/try_all_permutations_test.js                       //
//                                                                          //
//////////////////////////////////////////////////////////////////////////////
                                                                            //
// XXX SECTION: Meta tests                                                  // 1
                                                                            // 2
Tinytest.add("try_all_permutations", function (test) {                      // 3
  // Have a good test of try_all_permutations, because it would suck        // 4
  // if try_all_permutations didn't actually run anything and so none       // 5
  // of our other tests actually did any testing.                           // 6
                                                                            // 7
  var out = "";                                                             // 8
  try_all_permutations(                                                     // 9
    function () {out += ":";},                                              // 10
    [                                                                       // 11
      function () {out += "A";},                                            // 12
      function () {out += "B";},                                            // 13
      function () {out += "C";}                                             // 14
    ],                                                                      // 15
    function () {out += ".";}                                               // 16
  );                                                                        // 17
                                                                            // 18
  test.equal(out, ":ABC.:ACB.:BAC.:BCA.:CAB.:CBA.");                        // 19
                                                                            // 20
  out = "";                                                                 // 21
  try_all_permutations(                                                     // 22
    [function () {out += ":";}],                                            // 23
    [                                                                       // 24
      2,                                                                    // 25
      function () {out += "A";},                                            // 26
      function () {out += "B";},                                            // 27
      function () {out += "C";}                                             // 28
    ],                                                                      // 29
    [],                                                                     // 30
    [                                                                       // 31
      0,                                                                    // 32
      function () {out += "X";},                                            // 33
      function () {out += "Y";}                                             // 34
    ],                                                                      // 35
    function () {out += ".";}                                               // 36
  );                                                                        // 37
                                                                            // 38
  test.equal(out, ":AB.:AC.:BA.:BC.:CA.:CB.");                              // 39
                                                                            // 40
  out = "";                                                                 // 41
  try_all_permutations(                                                     // 42
    [                                                                       // 43
      2,                                                                    // 44
      function () {out += "A";},                                            // 45
      function () {out += "B";},                                            // 46
      function () {out += "C";},                                            // 47
      function () {out += "D";}                                             // 48
    ],                                                                      // 49
    [                                                                       // 50
      function () {out += "X";},                                            // 51
      function () {out += "Y";}                                             // 52
    ],                                                                      // 53
    function () {out += ".";}                                               // 54
  );                                                                        // 55
  test.equal(out, "ABXY.ABYX.ACXY.ACYX.ADXY.ADYX.BAXY.BAYX.BCXY.BCYX.BDXY.BDYX.CAXY.CAYX.CBXY.CBYX.CDXY.CDYX.DAXY.DAYX.DBXY.DBYX.DCXY.DCYX.");
                                                                            // 57
  var examine = function (n) {                                              // 58
    var fs = [];                                                            // 59
    var seq = "";                                                           // 60
    var seen = {};                                                          // 61
                                                                            // 62
    for (var i = 0; i < n; i++)                                             // 63
      fs.push(_.bind(function (x) { seq += x + "_"; }, null, i));           // 64
    try_all_permutations(                                                   // 65
      function () {seq = "";},                                              // 66
      fs,                                                                   // 67
      function () {                                                         // 68
        if (seq in seen)                                                    // 69
          throw new Error("duplicate permutation");                         // 70
        seen[seq] = true;                                                   // 71
      }                                                                     // 72
    );                                                                      // 73
                                                                            // 74
    var expected_count = 1;                                                 // 75
    for (var i = n; i >= 1; i--)                                            // 76
      expected_count *= i;                                                  // 77
    test.equal(_.keys(seen).length, expected_count);                        // 78
  };                                                                        // 79
                                                                            // 80
  for (var i = 1; i <= 5; i++)                                              // 81
    examine(i);                                                             // 82
                                                                            // 83
  try_all_permutations();                                                   // 84
});                                                                         // 85
                                                                            // 86
//////////////////////////////////////////////////////////////////////////////

}).call(this);






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
