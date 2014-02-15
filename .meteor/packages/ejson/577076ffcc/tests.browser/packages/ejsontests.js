(function () {

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/ejson/base64_test.js                                                        //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
var asciiToArray = function (str) {                                                     // 1
  var arr = EJSON.newBinary(str.length);                                                // 2
  for (var i = 0; i < str.length; i++) {                                                // 3
    var c = str.charCodeAt(i);                                                          // 4
    if (c > 0xFF) {                                                                     // 5
      throw new Error("Not ascii");                                                     // 6
    }                                                                                   // 7
    arr[i] = c;                                                                         // 8
  }                                                                                     // 9
  return arr;                                                                           // 10
};                                                                                      // 11
                                                                                        // 12
var arrayToAscii = function (arr) {                                                     // 13
  var res = [];                                                                         // 14
  for (var i = 0; i < arr.length; i++) {                                                // 15
    res.push(String.fromCharCode(arr[i]));                                              // 16
  }                                                                                     // 17
  return res.join("");                                                                  // 18
};                                                                                      // 19
                                                                                        // 20
Tinytest.add("base64 - testing the test", function (test) {                             // 21
  test.equal(arrayToAscii(asciiToArray("The quick brown fox jumps over the lazy dog")), // 22
             "The quick brown fox jumps over the lazy dog");                            // 23
});                                                                                     // 24
                                                                                        // 25
Tinytest.add("base64 - empty", function (test) {                                        // 26
  test.equal(EJSONTest.base64Encode(EJSON.newBinary(0)), "");                           // 27
  test.equal(EJSONTest.base64Decode(""), EJSON.newBinary(0));                           // 28
});                                                                                     // 29
                                                                                        // 30
                                                                                        // 31
Tinytest.add("base64 - wikipedia examples", function (test) {                           // 32
  var tests = [                                                                         // 33
    {txt: "pleasure.", res: "cGxlYXN1cmUu"},                                            // 34
    {txt: "leasure.", res: "bGVhc3VyZS4="},                                             // 35
    {txt: "easure.", res: "ZWFzdXJlLg=="},                                              // 36
    {txt: "asure.", res: "YXN1cmUu"},                                                   // 37
    {txt: "sure.", res: "c3VyZS4="}                                                     // 38
  ];                                                                                    // 39
  _.each(tests, function(t) {                                                           // 40
    test.equal(EJSONTest.base64Encode(asciiToArray(t.txt)), t.res);                     // 41
    test.equal(arrayToAscii(EJSONTest.base64Decode(t.res)), t.txt);                     // 42
  });                                                                                   // 43
});                                                                                     // 44
                                                                                        // 45
Tinytest.add("base64 - non-text examples", function (test) {                            // 46
  var tests = [                                                                         // 47
    {array: [0, 0, 0], b64: "AAAA"},                                                    // 48
    {array: [0, 0, 1], b64: "AAAB"}                                                     // 49
  ];                                                                                    // 50
  _.each(tests, function(t) {                                                           // 51
    test.equal(EJSONTest.base64Encode(t.array), t.b64);                                 // 52
    var expectedAsBinary = EJSON.newBinary(t.array.length);                             // 53
    _.each(t.array, function (val, i) {                                                 // 54
      expectedAsBinary[i] = val;                                                        // 55
    });                                                                                 // 56
    test.equal(EJSONTest.base64Decode(t.b64), expectedAsBinary);                        // 57
  });                                                                                   // 58
});                                                                                     // 59
                                                                                        // 60
//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/ejson/ejson_test.js                                                         //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
Tinytest.add("ejson - keyOrderSensitive", function (test) {                             // 1
  test.isTrue(EJSON.equals({                                                            // 2
    a: {b: 1, c: 2},                                                                    // 3
    d: {e: 3, f: 4}                                                                     // 4
  }, {                                                                                  // 5
    d: {f: 4, e: 3},                                                                    // 6
    a: {c: 2, b: 1}                                                                     // 7
  }));                                                                                  // 8
                                                                                        // 9
  test.isFalse(EJSON.equals({                                                           // 10
    a: {b: 1, c: 2},                                                                    // 11
    d: {e: 3, f: 4}                                                                     // 12
  }, {                                                                                  // 13
    d: {f: 4, e: 3},                                                                    // 14
    a: {c: 2, b: 1}                                                                     // 15
  }, {keyOrderSensitive: true}));                                                       // 16
                                                                                        // 17
  test.isFalse(EJSON.equals({                                                           // 18
    a: {b: 1, c: 2},                                                                    // 19
    d: {e: 3, f: 4}                                                                     // 20
  }, {                                                                                  // 21
    a: {c: 2, b: 1},                                                                    // 22
    d: {f: 4, e: 3}                                                                     // 23
  }, {keyOrderSensitive: true}));                                                       // 24
  test.isFalse(EJSON.equals({a: {}}, {a: {b:2}}, {keyOrderSensitive: true}));           // 25
  test.isFalse(EJSON.equals({a: {b:2}}, {a: {}}, {keyOrderSensitive: true}));           // 26
});                                                                                     // 27
                                                                                        // 28
Tinytest.add("ejson - nesting and literal", function (test) {                           // 29
  var d = new Date;                                                                     // 30
  var obj = {$date: d};                                                                 // 31
  var eObj = EJSON.toJSONValue(obj);                                                    // 32
  var roundTrip = EJSON.fromJSONValue(eObj);                                            // 33
  test.equal(obj, roundTrip);                                                           // 34
});                                                                                     // 35
                                                                                        // 36
Tinytest.add("ejson - some equality tests", function (test) {                           // 37
  test.isTrue(EJSON.equals({a: 1, b: 2, c: 3}, {a: 1, c: 3, b: 2}));                    // 38
  test.isFalse(EJSON.equals({a: 1, b: 2}, {a: 1, c: 3, b: 2}));                         // 39
  test.isFalse(EJSON.equals({a: 1, b: 2, c: 3}, {a: 1, b: 2}));                         // 40
  test.isFalse(EJSON.equals({a: 1, b: 2, c: 3}, {a: 1, c: 3, b: 4}));                   // 41
  test.isFalse(EJSON.equals({a: {}}, {a: {b:2}}));                                      // 42
  test.isFalse(EJSON.equals({a: {b:2}}, {a: {}}));                                      // 43
});                                                                                     // 44
                                                                                        // 45
Tinytest.add("ejson - equality and falsiness", function (test) {                        // 46
  test.isTrue(EJSON.equals(null, null));                                                // 47
  test.isTrue(EJSON.equals(undefined, undefined));                                      // 48
  test.isFalse(EJSON.equals({foo: "foo"}, null));                                       // 49
  test.isFalse(EJSON.equals(null, {foo: "foo"}));                                       // 50
  test.isFalse(EJSON.equals(undefined, {foo: "foo"}));                                  // 51
  test.isFalse(EJSON.equals({foo: "foo"}, undefined));                                  // 52
});                                                                                     // 53
                                                                                        // 54
Tinytest.add("ejson - NaN and Inf", function (test) {                                   // 55
  test.equal(EJSON.parse("{\"$InfNaN\": 1}"), Infinity);                                // 56
  test.equal(EJSON.parse("{\"$InfNaN\": -1}"), -Infinity);                              // 57
  test.isTrue(_.isNaN(EJSON.parse("{\"$InfNaN\": 0}")));                                // 58
  test.equal(EJSON.parse(EJSON.stringify(Infinity)), Infinity);                         // 59
  test.equal(EJSON.parse(EJSON.stringify(-Infinity)), -Infinity);                       // 60
  test.isTrue(_.isNaN(EJSON.parse(EJSON.stringify(NaN))));                              // 61
  test.isTrue(EJSON.equals(NaN, NaN));                                                  // 62
  test.isTrue(EJSON.equals(Infinity, Infinity));                                        // 63
  test.isTrue(EJSON.equals(-Infinity, -Infinity));                                      // 64
  test.isFalse(EJSON.equals(Infinity, -Infinity));                                      // 65
  test.isFalse(EJSON.equals(Infinity, NaN));                                            // 66
  test.isFalse(EJSON.equals(Infinity, 0));                                              // 67
  test.isFalse(EJSON.equals(NaN, 0));                                                   // 68
                                                                                        // 69
  test.isTrue(EJSON.equals(                                                             // 70
    EJSON.parse("{\"a\": {\"$InfNaN\": 1}}"),                                           // 71
    {a: Infinity}                                                                       // 72
  ));                                                                                   // 73
  test.isTrue(EJSON.equals(                                                             // 74
    EJSON.parse("{\"a\": {\"$InfNaN\": 0}}"),                                           // 75
    {a: NaN}                                                                            // 76
  ));                                                                                   // 77
});                                                                                     // 78
                                                                                        // 79
Tinytest.add("ejson - clone", function (test) {                                         // 80
  var cloneTest = function (x, identical) {                                             // 81
    var y = EJSON.clone(x);                                                             // 82
    test.isTrue(EJSON.equals(x, y));                                                    // 83
    test.equal(x === y, !!identical);                                                   // 84
  };                                                                                    // 85
  cloneTest(null, true);                                                                // 86
  cloneTest(undefined, true);                                                           // 87
  cloneTest(42, true);                                                                  // 88
  cloneTest("asdf", true);                                                              // 89
  cloneTest([1, 2, 3]);                                                                 // 90
  cloneTest([1, "fasdf", {foo: 42}]);                                                   // 91
  cloneTest({x: 42, y: "asdf"});                                                        // 92
                                                                                        // 93
  var testCloneArgs = function (/*arguments*/) {                                        // 94
    var clonedArgs = EJSON.clone(arguments);                                            // 95
    test.equal(clonedArgs, [1, 2, "foo", [4]]);                                         // 96
  };                                                                                    // 97
  testCloneArgs(1, 2, "foo", [4]);                                                      // 98
});                                                                                     // 99
                                                                                        // 100
Tinytest.add("ejson - stringify", function (test) {                                     // 101
  test.equal(EJSON.stringify(null), "null");                                            // 102
  test.equal(EJSON.stringify(true), "true");                                            // 103
  test.equal(EJSON.stringify(false), "false");                                          // 104
  test.equal(EJSON.stringify(123), "123");                                              // 105
  test.equal(EJSON.stringify("abc"), "\"abc\"");                                        // 106
                                                                                        // 107
  test.equal(EJSON.stringify([1, 2, 3]),                                                // 108
     "[1,2,3]"                                                                          // 109
  );                                                                                    // 110
  test.equal(EJSON.stringify([1, 2, 3], {indent: true}),                                // 111
    "[\n  1,\n  2,\n  3\n]"                                                             // 112
  );                                                                                    // 113
  test.equal(EJSON.stringify([1, 2, 3], {canonical: false}),                            // 114
    "[1,2,3]"                                                                           // 115
  );                                                                                    // 116
  test.equal(EJSON.stringify([1, 2, 3], {indent: true, canonical: false}),              // 117
    "[\n  1,\n  2,\n  3\n]"                                                             // 118
  );                                                                                    // 119
                                                                                        // 120
  test.equal(EJSON.stringify([1, 2, 3], {indent: 4}),                                   // 121
    "[\n    1,\n    2,\n    3\n]"                                                       // 122
  );                                                                                    // 123
  test.equal(EJSON.stringify([1, 2, 3], {indent: '--'}),                                // 124
    "[\n--1,\n--2,\n--3\n]"                                                             // 125
  );                                                                                    // 126
                                                                                        // 127
  test.equal(                                                                           // 128
    EJSON.stringify(                                                                    // 129
      {b: [2, {d: 4, c: 3}], a: 1},                                                     // 130
      {canonical: true}                                                                 // 131
    ),                                                                                  // 132
    "{\"a\":1,\"b\":[2,{\"c\":3,\"d\":4}]}"                                             // 133
  );                                                                                    // 134
  test.equal(                                                                           // 135
    EJSON.stringify(                                                                    // 136
      {b: [2, {d: 4, c: 3}], a: 1},                                                     // 137
      {                                                                                 // 138
        indent: true,                                                                   // 139
        canonical: true                                                                 // 140
      }                                                                                 // 141
    ),                                                                                  // 142
    "{\n" +                                                                             // 143
    "  \"a\": 1,\n" +                                                                   // 144
    "  \"b\": [\n" +                                                                    // 145
    "    2,\n" +                                                                        // 146
    "    {\n" +                                                                         // 147
    "      \"c\": 3,\n" +                                                               // 148
    "      \"d\": 4\n" +                                                                // 149
    "    }\n" +                                                                         // 150
    "  ]\n" +                                                                           // 151
    "}"                                                                                 // 152
  );                                                                                    // 153
  test.equal(                                                                           // 154
    EJSON.stringify(                                                                    // 155
      {b: [2, {d: 4, c: 3}], a: 1},                                                     // 156
      {canonical: false}                                                                // 157
    ),                                                                                  // 158
    "{\"b\":[2,{\"d\":4,\"c\":3}],\"a\":1}"                                             // 159
  );                                                                                    // 160
  test.equal(                                                                           // 161
    EJSON.stringify(                                                                    // 162
      {b: [2, {d: 4, c: 3}], a: 1},                                                     // 163
      {indent: true, canonical: false}                                                  // 164
    ),                                                                                  // 165
    "{\n" +                                                                             // 166
    "  \"b\": [\n" +                                                                    // 167
    "    2,\n" +                                                                        // 168
    "    {\n" +                                                                         // 169
    "      \"d\": 4,\n" +                                                               // 170
    "      \"c\": 3\n" +                                                                // 171
    "    }\n" +                                                                         // 172
    "  ],\n" +                                                                          // 173
    "  \"a\": 1\n" +                                                                    // 174
    "}"                                                                                 // 175
                                                                                        // 176
  );                                                                                    // 177
});                                                                                     // 178
                                                                                        // 179
Tinytest.add("ejson - parse", function (test) {                                         // 180
  test.equal(EJSON.parse("[1,2,3]"), [1,2,3]);                                          // 181
  test.throws(                                                                          // 182
    function () { EJSON.parse(null) },                                                  // 183
    /argument should be a string/                                                       // 184
  );                                                                                    // 185
});                                                                                     // 186
                                                                                        // 187
//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
