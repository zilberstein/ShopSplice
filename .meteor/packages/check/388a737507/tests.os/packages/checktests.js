(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/check/match_test.js                                                                                      //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Tinytest.add("check - check", function (test) {                                                                      // 1
  var matches = function (value, pattern) {                                                                          // 2
    var error;                                                                                                       // 3
    try {                                                                                                            // 4
      check(value, pattern);                                                                                         // 5
    } catch (e) {                                                                                                    // 6
      error = e;                                                                                                     // 7
    }                                                                                                                // 8
    test.isFalse(error);                                                                                             // 9
    test.isTrue(Match.test(value, pattern));                                                                         // 10
  };                                                                                                                 // 11
  var fails = function (value, pattern) {                                                                            // 12
    var error;                                                                                                       // 13
    try {                                                                                                            // 14
      check(value, pattern);                                                                                         // 15
    } catch (e) {                                                                                                    // 16
      error = e;                                                                                                     // 17
    }                                                                                                                // 18
    test.isTrue(error);                                                                                              // 19
    test.instanceOf(error, Match.Error);                                                                             // 20
    test.isFalse(Match.test(value, pattern));                                                                        // 21
  };                                                                                                                 // 22
                                                                                                                     // 23
  // Atoms.                                                                                                          // 24
  var pairs = [                                                                                                      // 25
    ["foo", String],                                                                                                 // 26
    ["", String],                                                                                                    // 27
    [0, Number],                                                                                                     // 28
    [42.59, Number],                                                                                                 // 29
    [NaN, Number],                                                                                                   // 30
    [Infinity, Number],                                                                                              // 31
    [true, Boolean],                                                                                                 // 32
    [false, Boolean],                                                                                                // 33
    [undefined, undefined],                                                                                          // 34
    [null, null]                                                                                                     // 35
  ];                                                                                                                 // 36
  _.each(pairs, function (pair) {                                                                                    // 37
    matches(pair[0], Match.Any);                                                                                     // 38
    _.each([String, Number, Boolean, undefined, null], function (type) {                                             // 39
      if (type === pair[1]) {                                                                                        // 40
        matches(pair[0], type);                                                                                      // 41
        matches(pair[0], Match.Optional(type));                                                                      // 42
        matches(undefined, Match.Optional(type));                                                                    // 43
        matches(pair[0], Match.Where(function () {                                                                   // 44
          check(pair[0], type);                                                                                      // 45
          return true;                                                                                               // 46
        }));                                                                                                         // 47
        matches(pair[0], Match.Where(function () {                                                                   // 48
          try {                                                                                                      // 49
            check(pair[0], type);                                                                                    // 50
            return true;                                                                                             // 51
          } catch (e) {                                                                                              // 52
            return false;                                                                                            // 53
          }                                                                                                          // 54
        }));                                                                                                         // 55
      } else {                                                                                                       // 56
        fails(pair[0], type);                                                                                        // 57
        matches(pair[0], Match.OneOf(type, pair[1]));                                                                // 58
        matches(pair[0], Match.OneOf(pair[1], type));                                                                // 59
        fails(pair[0], Match.Where(function () {                                                                     // 60
          check(pair[0], type);                                                                                      // 61
          return true;                                                                                               // 62
        }));                                                                                                         // 63
        fails(pair[0], Match.Where(function () {                                                                     // 64
          try {                                                                                                      // 65
            check(pair[0], type);                                                                                    // 66
            return true;                                                                                             // 67
          } catch (e) {                                                                                              // 68
            return false;                                                                                            // 69
          }                                                                                                          // 70
        }));                                                                                                         // 71
      }                                                                                                              // 72
      fails(pair[0], [type]);                                                                                        // 73
      fails(pair[0], Object);                                                                                        // 74
    });                                                                                                              // 75
  });                                                                                                                // 76
  fails(true, Match.OneOf(String, Number, undefined, null, [Boolean]));                                              // 77
  fails(new String("foo"), String);                                                                                  // 78
  fails(new Boolean(true), Boolean);                                                                                 // 79
  fails(new Number(123), Number);                                                                                    // 80
                                                                                                                     // 81
  matches([1, 2, 3], [Number]);                                                                                      // 82
  matches([], [Number]);                                                                                             // 83
  fails([1, 2, 3, "4"], [Number]);                                                                                   // 84
  fails([1, 2, 3, [4]], [Number]);                                                                                   // 85
  matches([1, 2, 3, "4"], [Match.OneOf(Number, String)]);                                                            // 86
                                                                                                                     // 87
  matches({}, Object);                                                                                               // 88
  matches({}, {});                                                                                                   // 89
  matches({foo: 42}, Object);                                                                                        // 90
  fails({foo: 42}, {});                                                                                              // 91
  matches({a: 1, b:2}, {b: Number, a: Number});                                                                      // 92
  fails({a: 1, b:2}, {b: Number});                                                                                   // 93
  matches({a: 1, b:2}, Match.ObjectIncluding({b: Number}));                                                          // 94
  fails({a: 1, b:2}, Match.ObjectIncluding({b: String}));                                                            // 95
  fails({a: 1, b:2}, Match.ObjectIncluding({c: String}));                                                            // 96
  fails({}, {a: Number});                                                                                            // 97
  matches({}, {a: Match.Optional(Number)});                                                                          // 98
  matches({a: 1}, {a: Match.Optional(Number)});                                                                      // 99
  fails({a: true}, {a: Match.Optional(Number)});                                                                     // 100
  // Match.Optional means "or undefined" at the top level but "or absent" in                                         // 101
  // objects.                                                                                                        // 102
  fails({a: undefined}, {a: Match.Optional(Number)});                                                                // 103
                                                                                                                     // 104
  matches(/foo/, RegExp);                                                                                            // 105
  fails(/foo/, String);                                                                                              // 106
  matches(new Date, Date);                                                                                           // 107
  fails(new Date, Number);                                                                                           // 108
  matches(EJSON.newBinary(42), Match.Where(EJSON.isBinary));                                                         // 109
  fails([], Match.Where(EJSON.isBinary));                                                                            // 110
                                                                                                                     // 111
  matches(42, Match.Where(function (x) { return x % 2 === 0; }));                                                    // 112
  fails(43, Match.Where(function (x) { return x % 2 === 0; }));                                                      // 113
                                                                                                                     // 114
  matches({                                                                                                          // 115
    a: "something",                                                                                                  // 116
    b: [                                                                                                             // 117
      {x: 42, k: null},                                                                                              // 118
      {x: 43, k: true, p: ["yay"]}                                                                                   // 119
    ]                                                                                                                // 120
  }, {a: String, b: [Match.ObjectIncluding({                                                                         // 121
    x: Number,                                                                                                       // 122
    k: Match.OneOf(null, Boolean)})]});                                                                              // 123
                                                                                                                     // 124
                                                                                                                     // 125
  // Match.Integer                                                                                                   // 126
  matches(-1, Match.Integer);                                                                                        // 127
  matches(0, Match.Integer);                                                                                         // 128
  matches(1, Match.Integer);                                                                                         // 129
  matches(-2147483648, Match.Integer); // INT_MIN                                                                    // 130
  matches(2147483647, Match.Integer); // INT_MAX                                                                     // 131
  fails(123.33, Match.Integer);                                                                                      // 132
  fails(.33, Match.Integer);                                                                                         // 133
  fails(1.348192308491824e+23, Match.Integer);                                                                       // 134
  fails(NaN, Match.Integer);                                                                                         // 135
  fails(Infinity, Match.Integer);                                                                                    // 136
  fails(-Infinity, Match.Integer);                                                                                   // 137
  fails({}, Match.Integer);                                                                                          // 138
  fails([], Match.Integer);                                                                                          // 139
  fails(function () {}, Match.Integer);                                                                              // 140
  fails(new Date, Match.Integer);                                                                                    // 141
                                                                                                                     // 142
  // Test that "arguments" is treated like an array.                                                                 // 143
  var argumentsMatches = function () {                                                                               // 144
    matches(arguments, [Number]);                                                                                    // 145
  };                                                                                                                 // 146
  argumentsMatches();                                                                                                // 147
  argumentsMatches(1);                                                                                               // 148
  argumentsMatches(1, 2);                                                                                            // 149
  var argumentsFails = function () {                                                                                 // 150
    fails(arguments, [Number]);                                                                                      // 151
  };                                                                                                                 // 152
  argumentsFails("123");                                                                                             // 153
  argumentsFails(1, "23");                                                                                           // 154
});                                                                                                                  // 155
                                                                                                                     // 156
Tinytest.add("check - argument checker", function (test) {                                                           // 157
  var checksAllArguments = function (f /*arguments*/) {                                                              // 158
    Match._failIfArgumentsAreNotAllChecked(                                                                          // 159
      f, {}, _.toArray(arguments).slice(1), "test");                                                                 // 160
  };                                                                                                                 // 161
  checksAllArguments(function () {});                                                                                // 162
  checksAllArguments(function (x) {check(x, Match.Any);}, undefined);                                                // 163
  checksAllArguments(function (x) {check(x, Match.Any);}, null);                                                     // 164
  checksAllArguments(function (x) {check(x, Match.Any);}, false);                                                    // 165
  checksAllArguments(function (x) {check(x, Match.Any);}, true);                                                     // 166
  checksAllArguments(function (x) {check(x, Match.Any);}, 0);                                                        // 167
  checksAllArguments(function (a, b, c) {                                                                            // 168
    check(a, String);                                                                                                // 169
    check(b, Boolean);                                                                                               // 170
    check(c, Match.Optional(Number));                                                                                // 171
  }, "foo", true);                                                                                                   // 172
  checksAllArguments(function () {                                                                                   // 173
    check(arguments, [Number]);                                                                                      // 174
  }, 1, 2, 4);                                                                                                       // 175
  checksAllArguments(function(x) {                                                                                   // 176
    check(x, Number);                                                                                                // 177
    check(_.toArray(arguments).slice(1), [String]);                                                                  // 178
  }, 1, "foo", "bar", "baz");                                                                                        // 179
                                                                                                                     // 180
  var doesntCheckAllArguments = function (f /*arguments*/) {                                                         // 181
    try {                                                                                                            // 182
      Match._failIfArgumentsAreNotAllChecked(                                                                        // 183
        f, {}, _.toArray(arguments).slice(1), "test");                                                               // 184
      test.fail({message: "expected _failIfArgumentsAreNotAllChecked to throw"});                                    // 185
    } catch (e) {                                                                                                    // 186
      test.equal(e.message, "Did not check() all arguments during test");                                            // 187
    }                                                                                                                // 188
  };                                                                                                                 // 189
                                                                                                                     // 190
  doesntCheckAllArguments(function () {}, undefined);                                                                // 191
  doesntCheckAllArguments(function () {}, null);                                                                     // 192
  doesntCheckAllArguments(function () {}, 1);                                                                        // 193
  doesntCheckAllArguments(function () {                                                                              // 194
    check(_.toArray(arguments).slice(1), [String]);                                                                  // 195
  }, 1, "asdf", "foo");                                                                                              // 196
  doesntCheckAllArguments(function (x, y) {                                                                          // 197
    check(x, Boolean);                                                                                               // 198
  }, true, false);                                                                                                   // 199
  // One "true" check doesn't count for all.                                                                         // 200
  doesntCheckAllArguments(function (x, y) {                                                                          // 201
    check(x, Boolean);                                                                                               // 202
  }, true, true);                                                                                                    // 203
  // For non-primitives, we really do require that each arg gets checked.                                            // 204
  doesntCheckAllArguments(function (x, y) {                                                                          // 205
    check(x, [Boolean]);                                                                                             // 206
    check(x, [Boolean]);                                                                                             // 207
  }, [true], [true]);                                                                                                // 208
                                                                                                                     // 209
                                                                                                                     // 210
  // In an ideal world this test would fail, but we currently can't                                                  // 211
  // differentiate between "two calls to check x, both of which are true" and                                        // 212
  // "check x and check y, both of which are true" (for any interned primitive                                       // 213
  // type).                                                                                                          // 214
  checksAllArguments(function (x, y) {                                                                               // 215
    check(x, Boolean);                                                                                               // 216
    check(x, Boolean);                                                                                               // 217
  }, true, true);                                                                                                    // 218
});                                                                                                                  // 219
                                                                                                                     // 220
Tinytest.add("check - Match error path", function (test) {                                                           // 221
  var match = function (value, pattern, expectedPath) {                                                              // 222
    try {                                                                                                            // 223
      check(value, pattern);                                                                                         // 224
    } catch (err) {                                                                                                  // 225
      // XXX just for FF 3.6, its JSON stringification prefers "\u000a" to "\n"                                      // 226
      err.path = err.path.replace(/\\u000a/, "\\n");                                                                 // 227
      if (err.path != expectedPath)                                                                                  // 228
        test.fail({                                                                                                  // 229
          type: "match-error-path",                                                                                  // 230
          message: "The path of Match.Error doesn't match.",                                                         // 231
          pattern: JSON.stringify(pattern),                                                                          // 232
          value: JSON.stringify(value),                                                                              // 233
          path: err.path,                                                                                            // 234
          expectedPath: expectedPath                                                                                 // 235
        });                                                                                                          // 236
    }                                                                                                                // 237
  };                                                                                                                 // 238
                                                                                                                     // 239
  match({ foo: [ { bar: 3 }, {bar: "something"} ] }, { foo: [ { bar: Number } ] }, "foo[1].bar");                    // 240
  // Complicated case with arrays, $, whitespace and quotes!                                                         // 241
  match([{ $FoO: { "bar baz\n\"'": 3 } }], [{ $FoO: { "bar baz\n\"'": String } }], "[0].$FoO[\"bar baz\\n\\\"'\"]"); // 242
  // Numbers only, can be accessed w/o quotes                                                                        // 243
  match({ "1231": 123 }, { "1231": String }, "[1231]");                                                              // 244
  match({ "1234abcd": 123 }, { "1234abcd": String }, "[\"1234abcd\"]");                                              // 245
  match({ $set: { people: "nice" } }, { $set: { people: [String] } }, "$set.people");                                // 246
  match({ _underscore: "should work" }, { _underscore: Number }, "_underscore");                                     // 247
  // Nested array looks nice                                                                                         // 248
  match([[["something", "here"], []], [["string", 123]]], [[[String]]], "[1][0][1]");                                // 249
  // Object nested in arrays should look nice, too!                                                                  // 250
  match([[[{ foo: "something" }, { foo: "here"}],                                                                    // 251
          [{ foo: "asdf" }]],                                                                                        // 252
         [[{ foo: 123 }]]],                                                                                          // 253
        [[[{ foo: String }]]], "[1][0][0].foo");                                                                     // 254
                                                                                                                     // 255
  // JS keyword                                                                                                      // 256
  match({ "return": 0 }, { "return": String }, "[\"return\"]");                                                      // 257
});                                                                                                                  // 258
                                                                                                                     // 259
                                                                                                                     // 260
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
