(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/minimongo/minimongo_server_tests.js                                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Tinytest.add("minimongo - modifier affects selector", function (test) {                                               // 1
  function testSelectorPaths (sel, paths, desc) {                                                                     // 2
    test.isTrue(_.isEqual(MinimongoTest.getSelectorPaths(sel), paths), desc);                                         // 3
  }                                                                                                                   // 4
                                                                                                                      // 5
  testSelectorPaths({                                                                                                 // 6
    foo: {                                                                                                            // 7
      bar: 3,                                                                                                         // 8
      baz: 42                                                                                                         // 9
    }                                                                                                                 // 10
  }, ['foo'], "literal");                                                                                             // 11
                                                                                                                      // 12
  testSelectorPaths({                                                                                                 // 13
    foo: 42,                                                                                                          // 14
    bar: 33                                                                                                           // 15
  }, ['foo', 'bar'], "literal");                                                                                      // 16
                                                                                                                      // 17
  testSelectorPaths({                                                                                                 // 18
    foo: [ 'something' ],                                                                                             // 19
    bar: "asdf"                                                                                                       // 20
  }, ['foo', 'bar'], "literal");                                                                                      // 21
                                                                                                                      // 22
  testSelectorPaths({                                                                                                 // 23
    a: { $lt: 3 },                                                                                                    // 24
    b: "you know, literal",                                                                                           // 25
    'path.is.complicated': { $not: { $regex: 'acme.*corp' } }                                                         // 26
  }, ['a', 'b', 'path.is.complicated'], "literal + operators");                                                       // 27
                                                                                                                      // 28
  testSelectorPaths({                                                                                                 // 29
    $or: [{ 'a.b': 1 }, { 'a.b.c': { $lt: 22 } },                                                                     // 30
     {$and: [{ 'x.d': { $ne: 5, $gte: 433 } }, { 'a.b': 234 }]}]                                                      // 31
  }, ['a.b', 'a.b.c', 'x.d'], 'group operators + duplicates');                                                        // 32
                                                                                                                      // 33
  // When top-level value is an object, it is treated as a literal,                                                   // 34
  // so when you query col.find({ a: { foo: 1, bar: 2 } })                                                            // 35
  // it doesn't mean you are looking for anything that has 'a.foo' to be 1 and                                        // 36
  // 'a.bar' to be 2, instead you are looking for 'a' to be exatly that object                                        // 37
  // with exatly that order of keys. { a: { foo: 1, bar: 2, baz: 3 } } wouldn't                                       // 38
  // match it. That's why in this selector 'a' would be important key, not a.foo                                      // 39
  // and a.bar.                                                                                                       // 40
  testSelectorPaths({                                                                                                 // 41
    a: {                                                                                                              // 42
      foo: 1,                                                                                                         // 43
      bar: 2                                                                                                          // 44
    },                                                                                                                // 45
    'b.c': {                                                                                                          // 46
      literal: "object",                                                                                              // 47
      but: "we still observe any changes in 'b.c'"                                                                    // 48
    }                                                                                                                 // 49
  }, ['a', 'b.c'], "literal object");                                                                                 // 50
                                                                                                                      // 51
  function testSelectorAffectedByModifier (sel, mod, yes, desc) {                                                     // 52
    if (yes)                                                                                                          // 53
      test.isTrue(LocalCollection._isSelectorAffectedByModifier(sel, mod, desc));                                     // 54
    else                                                                                                              // 55
      test.isFalse(LocalCollection._isSelectorAffectedByModifier(sel, mod, desc));                                    // 56
  }                                                                                                                   // 57
                                                                                                                      // 58
  function affected(sel, mod, desc) {                                                                                 // 59
    testSelectorAffectedByModifier(sel, mod, 1, desc);                                                                // 60
  }                                                                                                                   // 61
  function notAffected(sel, mod, desc) {                                                                              // 62
    testSelectorAffectedByModifier(sel, mod, 0, desc);                                                                // 63
  }                                                                                                                   // 64
                                                                                                                      // 65
  notAffected({ foo: 0 }, { $set: { bar: 1 } }, "simplest");                                                          // 66
  affected({ foo: 0 }, { $set: { foo: 1 } }, "simplest");                                                             // 67
  affected({ foo: 0 }, { $set: { 'foo.bar': 1 } }, "simplest");                                                       // 68
  notAffected({ 'foo.bar': 0 }, { $set: { 'foo.baz': 1 } }, "simplest");                                              // 69
  affected({ 'foo.bar': 0 }, { $set: { 'foo.1': 1 } }, "simplest");                                                   // 70
  affected({ 'foo.bar': 0 }, { $set: { 'foo.2.bar': 1 } }, "simplest");                                               // 71
                                                                                                                      // 72
  notAffected({ 'foo': 0 }, { $set: { 'foobaz': 1 } }, "correct prefix check");                                       // 73
  notAffected({ 'foobar': 0 }, { $unset: { 'foo': 1 } }, "correct prefix check");                                     // 74
  notAffected({ 'foo.bar': 0 }, { $unset: { 'foob': 1 } }, "correct prefix check");                                   // 75
                                                                                                                      // 76
  notAffected({ 'foo.Infinity.x': 0 }, { $unset: { 'foo.x': 1 } }, "we convert integer fields correctly");            // 77
  notAffected({ 'foo.1e3.x': 0 }, { $unset: { 'foo.x': 1 } }, "we convert integer fields correctly");                 // 78
                                                                                                                      // 79
  affected({ 'foo.3.bar': 0 }, { $set: { 'foo.3.bar': 1 } }, "observe for an array element");                         // 80
                                                                                                                      // 81
  notAffected({ 'foo.4.bar.baz': 0 }, { $unset: { 'foo.3.bar': 1 } }, "delicate work with numeric fields in selector");
  notAffected({ 'foo.4.bar.baz': 0 }, { $unset: { 'foo.bar': 1 } }, "delicate work with numeric fields in selector"); // 83
  affected({ 'foo.4.bar.baz': 0 }, { $unset: { 'foo.4.bar': 1 } }, "delicate work with numeric fields in selector");  // 84
  affected({ 'foo.bar.baz': 0 }, { $unset: { 'foo.3.bar': 1 } }, "delicate work with numeric fields in selector");    // 85
                                                                                                                      // 86
  affected({ 'foo.0.bar': 0 }, { $set: { 'foo.0.0.bar': 1 } }, "delicate work with nested arrays and selectors by indecies");
});                                                                                                                   // 88
                                                                                                                      // 89
Tinytest.add("minimongo - selector and projection combination", function (test) {                                     // 90
  function testSelProjectionComb (sel, proj, expected, desc) {                                                        // 91
    test.equal(LocalCollection._combineSelectorAndProjection(sel, proj), expected, desc);                             // 92
  }                                                                                                                   // 93
                                                                                                                      // 94
  // Test with inclusive projection                                                                                   // 95
  testSelProjectionComb({ a: 1, b: 2 }, { b: 1, c: 1, d: 1 }, { a: true, b: true, c: true, d: true }, "simplest incl");
  testSelProjectionComb({ $or: [{ a: 1234, e: {$lt: 5} }], b: 2 }, { b: 1, c: 1, d: 1 }, { a: true, b: true, c: true, d: true, e: true }, "simplest incl, branching");
  testSelProjectionComb({                                                                                             // 98
    'a.b': { $lt: 3 },                                                                                                // 99
    'y.0': -1,                                                                                                        // 100
    'a.c': 15                                                                                                         // 101
  }, {                                                                                                                // 102
    'd': 1,                                                                                                           // 103
    'z': 1                                                                                                            // 104
  }, {                                                                                                                // 105
    'a.b': true,                                                                                                      // 106
    'y': true,                                                                                                        // 107
    'a.c': true,                                                                                                      // 108
    'd': true,                                                                                                        // 109
    'z': true                                                                                                         // 110
  }, "multikey paths in selector - incl");                                                                            // 111
                                                                                                                      // 112
  testSelProjectionComb({                                                                                             // 113
    foo: 1234,                                                                                                        // 114
    $and: [{ k: -1 }, { $or: [{ b: 15 }] }]                                                                           // 115
  }, {                                                                                                                // 116
    'foo.bar': 1,                                                                                                     // 117
    'foo.zzz': 1,                                                                                                     // 118
    'b.asdf': 1                                                                                                       // 119
  }, {                                                                                                                // 120
    foo: true,                                                                                                        // 121
    b: true,                                                                                                          // 122
    k: true                                                                                                           // 123
  }, "multikey paths in fields - incl");                                                                              // 124
                                                                                                                      // 125
  testSelProjectionComb({                                                                                             // 126
    'a.b.c': 123,                                                                                                     // 127
    'a.b.d': 321,                                                                                                     // 128
    'b.c.0': 111,                                                                                                     // 129
    'a.e': 12345                                                                                                      // 130
  }, {                                                                                                                // 131
    'a.b.z': 1,                                                                                                       // 132
    'a.b.d.g': 1,                                                                                                     // 133
    'c.c.c': 1                                                                                                        // 134
  }, {                                                                                                                // 135
    'a.b.c': true,                                                                                                    // 136
    'a.b.d': true,                                                                                                    // 137
    'a.b.z': true,                                                                                                    // 138
    'b.c': true,                                                                                                      // 139
    'a.e': true,                                                                                                      // 140
    'c.c.c': true                                                                                                     // 141
  }, "multikey both paths - incl");                                                                                   // 142
                                                                                                                      // 143
  testSelProjectionComb({                                                                                             // 144
    'a.b.c.d': 123,                                                                                                   // 145
    'a.b1.c.d': 421,                                                                                                  // 146
    'a.b.c.e': 111                                                                                                    // 147
  }, {                                                                                                                // 148
    'a.b': 1                                                                                                          // 149
  }, {                                                                                                                // 150
    'a.b': true,                                                                                                      // 151
    'a.b1.c.d': true                                                                                                  // 152
  }, "shadowing one another - incl");                                                                                 // 153
                                                                                                                      // 154
  testSelProjectionComb({                                                                                             // 155
    'a.b': 123,                                                                                                       // 156
    'foo.bar': false                                                                                                  // 157
  }, {                                                                                                                // 158
    'a.b.c.d': 1,                                                                                                     // 159
    'foo': 1                                                                                                          // 160
  }, {                                                                                                                // 161
    'a.b': true,                                                                                                      // 162
    'foo': true                                                                                                       // 163
  }, "shadowing one another - incl");                                                                                 // 164
                                                                                                                      // 165
  testSelProjectionComb({                                                                                             // 166
    'a.b.c': 1                                                                                                        // 167
  }, {                                                                                                                // 168
    'a.b.c': 1                                                                                                        // 169
  }, {                                                                                                                // 170
    'a.b.c': true                                                                                                     // 171
  }, "same paths - incl");                                                                                            // 172
                                                                                                                      // 173
  testSelProjectionComb({                                                                                             // 174
    'x.4.y': 42,                                                                                                      // 175
    'z.0.1': 33                                                                                                       // 176
  }, {                                                                                                                // 177
    'x.x': 1                                                                                                          // 178
  }, {                                                                                                                // 179
    'x.x': true,                                                                                                      // 180
    'x.y': true,                                                                                                      // 181
    'z': true                                                                                                         // 182
  }, "numbered keys in selector - incl");                                                                             // 183
                                                                                                                      // 184
  testSelProjectionComb({                                                                                             // 185
    'a.b.c': 42,                                                                                                      // 186
    $where: function () { return true; }                                                                              // 187
  }, {                                                                                                                // 188
    'a.b': 1,                                                                                                         // 189
    'z.z': 1                                                                                                          // 190
  }, {}, "$where in the selector - incl");                                                                            // 191
                                                                                                                      // 192
  testSelProjectionComb({                                                                                             // 193
    $or: [                                                                                                            // 194
      {'a.b.c': 42},                                                                                                  // 195
      {$where: function () { return true; } }                                                                         // 196
    ]                                                                                                                 // 197
  }, {                                                                                                                // 198
    'a.b': 1,                                                                                                         // 199
    'z.z': 1                                                                                                          // 200
  }, {}, "$where in the selector - incl");                                                                            // 201
                                                                                                                      // 202
  // Test with exclusive projection                                                                                   // 203
  testSelProjectionComb({ a: 1, b: 2 }, { b: 0, c: 0, d: 0 }, { c: false, d: false }, "simplest excl");               // 204
  testSelProjectionComb({ $or: [{ a: 1234, e: {$lt: 5} }], b: 2 }, { b: 0, c: 0, d: 0 }, { c: false, d: false }, "simplest excl, branching");
  testSelProjectionComb({                                                                                             // 206
    'a.b': { $lt: 3 },                                                                                                // 207
    'y.0': -1,                                                                                                        // 208
    'a.c': 15                                                                                                         // 209
  }, {                                                                                                                // 210
    'd': 0,                                                                                                           // 211
    'z': 0                                                                                                            // 212
  }, {                                                                                                                // 213
    d: false,                                                                                                         // 214
    z: false                                                                                                          // 215
  }, "multikey paths in selector - excl");                                                                            // 216
                                                                                                                      // 217
  testSelProjectionComb({                                                                                             // 218
    foo: 1234,                                                                                                        // 219
    $and: [{ k: -1 }, { $or: [{ b: 15 }] }]                                                                           // 220
  }, {                                                                                                                // 221
    'foo.bar': 0,                                                                                                     // 222
    'foo.zzz': 0,                                                                                                     // 223
    'b.asdf': 0                                                                                                       // 224
  }, {                                                                                                                // 225
  }, "multikey paths in fields - excl");                                                                              // 226
                                                                                                                      // 227
  testSelProjectionComb({                                                                                             // 228
    'a.b.c': 123,                                                                                                     // 229
    'a.b.d': 321,                                                                                                     // 230
    'b.c.0': 111,                                                                                                     // 231
    'a.e': 12345                                                                                                      // 232
  }, {                                                                                                                // 233
    'a.b.z': 0,                                                                                                       // 234
    'a.b.d.g': 0,                                                                                                     // 235
    'c.c.c': 0                                                                                                        // 236
  }, {                                                                                                                // 237
    'a.b.z': false,                                                                                                   // 238
    'c.c.c': false                                                                                                    // 239
  }, "multikey both paths - excl");                                                                                   // 240
                                                                                                                      // 241
  testSelProjectionComb({                                                                                             // 242
    'a.b.c.d': 123,                                                                                                   // 243
    'a.b1.c.d': 421,                                                                                                  // 244
    'a.b.c.e': 111                                                                                                    // 245
  }, {                                                                                                                // 246
    'a.b': 0                                                                                                          // 247
  }, {                                                                                                                // 248
  }, "shadowing one another - excl");                                                                                 // 249
                                                                                                                      // 250
  testSelProjectionComb({                                                                                             // 251
    'a.b': 123,                                                                                                       // 252
    'foo.bar': false                                                                                                  // 253
  }, {                                                                                                                // 254
    'a.b.c.d': 0,                                                                                                     // 255
    'foo': 0                                                                                                          // 256
  }, {                                                                                                                // 257
  }, "shadowing one another - excl");                                                                                 // 258
                                                                                                                      // 259
  testSelProjectionComb({                                                                                             // 260
    'a.b.c': 1                                                                                                        // 261
  }, {                                                                                                                // 262
    'a.b.c': 0                                                                                                        // 263
  }, {                                                                                                                // 264
  }, "same paths - excl");                                                                                            // 265
                                                                                                                      // 266
  testSelProjectionComb({                                                                                             // 267
    'a.b': 123,                                                                                                       // 268
    'a.c.d': 222,                                                                                                     // 269
    'ddd': 123                                                                                                        // 270
  }, {                                                                                                                // 271
    'a.b': 0,                                                                                                         // 272
    'a.c.e': 0,                                                                                                       // 273
    'asdf': 0                                                                                                         // 274
  }, {                                                                                                                // 275
    'a.c.e': false,                                                                                                   // 276
    'asdf': false                                                                                                     // 277
  }, "intercept the selector path - excl");                                                                           // 278
                                                                                                                      // 279
  testSelProjectionComb({                                                                                             // 280
    'a.b.c': 14                                                                                                       // 281
  }, {                                                                                                                // 282
    'a.b.d': 0                                                                                                        // 283
  }, {                                                                                                                // 284
    'a.b.d': false                                                                                                    // 285
  }, "different branches - excl");                                                                                    // 286
                                                                                                                      // 287
  testSelProjectionComb({                                                                                             // 288
    'a.b.c.d': "124",                                                                                                 // 289
    'foo.bar.baz.que': "some value"                                                                                   // 290
  }, {                                                                                                                // 291
    'a.b.c.d.e': 0,                                                                                                   // 292
    'foo.bar': 0                                                                                                      // 293
  }, {                                                                                                                // 294
  }, "excl on incl paths - excl");                                                                                    // 295
                                                                                                                      // 296
  testSelProjectionComb({                                                                                             // 297
    'x.4.y': 42,                                                                                                      // 298
    'z.0.1': 33                                                                                                       // 299
  }, {                                                                                                                // 300
    'x.x': 0,                                                                                                         // 301
    'x.y': 0                                                                                                          // 302
  }, {                                                                                                                // 303
    'x.x': false,                                                                                                     // 304
  }, "numbered keys in selector - excl");                                                                             // 305
                                                                                                                      // 306
  testSelProjectionComb({                                                                                             // 307
    'a.b.c': 42,                                                                                                      // 308
    $where: function () { return true; }                                                                              // 309
  }, {                                                                                                                // 310
    'a.b': 0,                                                                                                         // 311
    'z.z': 0                                                                                                          // 312
  }, {}, "$where in the selector - excl");                                                                            // 313
                                                                                                                      // 314
  testSelProjectionComb({                                                                                             // 315
    $or: [                                                                                                            // 316
      {'a.b.c': 42},                                                                                                  // 317
      {$where: function () { return true; } }                                                                         // 318
    ]                                                                                                                 // 319
  }, {                                                                                                                // 320
    'a.b': 0,                                                                                                         // 321
    'z.z': 0                                                                                                          // 322
  }, {}, "$where in the selector - excl");                                                                            // 323
                                                                                                                      // 324
});                                                                                                                   // 325
                                                                                                                      // 326
(function () {                                                                                                        // 327
  // TODO: Tests for "can selector become true by modifier" are incomplete,                                           // 328
  // absent or test the functionality of "not ideal" implementation (test checks                                      // 329
  // that certain case always returns true as implementation is incomplete)                                           // 330
  // - tests with $and/$or/$nor/$not branches (are absent)                                                            // 331
  // - more tests with arrays fields and numeric keys (incomplete and test "not                                       // 332
  // ideal" implementation)                                                                                           // 333
  // - tests when numeric keys actually mean numeric keys, not array indexes                                          // 334
  // (are absent)                                                                                                     // 335
  // - tests with $-operators in the selector (are incomplete and test "not                                           // 336
  // ideal" implementation)                                                                                           // 337
                                                                                                                      // 338
  var test = null; // set this global in the beginning of every test                                                  // 339
  // T - should return true                                                                                           // 340
  // F - should return false                                                                                          // 341
  function T (sel, mod, desc) {                                                                                       // 342
    test.isTrue(LocalCollection._canSelectorBecomeTrueByModifier(sel, mod), desc);                                    // 343
  }                                                                                                                   // 344
  function F (sel, mod, desc) {                                                                                       // 345
    test.isFalse(LocalCollection._canSelectorBecomeTrueByModifier(sel, mod), desc);                                   // 346
  }                                                                                                                   // 347
                                                                                                                      // 348
  Tinytest.add("minimongo - can selector become true by modifier - literals (structured tests)", function (t) {       // 349
    test = t;                                                                                                         // 350
                                                                                                                      // 351
    var selector = {                                                                                                  // 352
      'a.b.c': 2,                                                                                                     // 353
      'foo.bar': {                                                                                                    // 354
        z: { y: 1 }                                                                                                   // 355
      },                                                                                                              // 356
      'foo.baz': [ {ans: 42}, "string", false, undefined ],                                                           // 357
      'empty.field': null                                                                                             // 358
    };                                                                                                                // 359
                                                                                                                      // 360
    T(selector, {$set:{ 'a.b.c': 2 }});                                                                               // 361
    F(selector, {$unset:{ 'a': 1 }});                                                                                 // 362
    F(selector, {$unset:{ 'a.b': 1 }});                                                                               // 363
    F(selector, {$unset:{ 'a.b.c': 1 }});                                                                             // 364
    T(selector, {$set:{ 'a.b': { c: 2 } }});                                                                          // 365
    F(selector, {$set:{ 'a.b': {} }});                                                                                // 366
    T(selector, {$set:{ 'a.b': { c: 2, x: 5 } }});                                                                    // 367
    F(selector, {$set:{ 'a.b.c.k': 3 }});                                                                             // 368
    F(selector, {$set:{ 'a.b.c.k': {} }});                                                                            // 369
                                                                                                                      // 370
    F(selector, {$unset:{ 'foo': 1 }});                                                                               // 371
    F(selector, {$unset:{ 'foo.bar': 1 }});                                                                           // 372
    F(selector, {$unset:{ 'foo.bar.z': 1 }});                                                                         // 373
    F(selector, {$unset:{ 'foo.bar.z.y': 1 }});                                                                       // 374
    F(selector, {$set:{ 'foo.bar.x': 1 }});                                                                           // 375
    F(selector, {$set:{ 'foo.bar': {} }});                                                                            // 376
    F(selector, {$set:{ 'foo.bar': 3 }});                                                                             // 377
    T(selector, {$set:{ 'foo.bar': { z: { y: 1 } } }});                                                               // 378
    T(selector, {$set:{ 'foo.bar.z': { y: 1 } }});                                                                    // 379
    T(selector, {$set:{ 'foo.bar.z.y': 1 }});                                                                         // 380
                                                                                                                      // 381
    F(selector, {$set:{ 'empty.field': {} }});                                                                        // 382
    T(selector, {$set:{ 'empty': {} }});                                                                              // 383
    T(selector, {$set:{ 'empty.field': null }});                                                                      // 384
    T(selector, {$set:{ 'empty.field': undefined }});                                                                 // 385
    F(selector, {$set:{ 'empty.field.a': 3 }});                                                                       // 386
  });                                                                                                                 // 387
                                                                                                                      // 388
  Tinytest.add("minimongo - can selector become true by modifier - literals (adhoc tests)", function (t) {            // 389
    test = t;                                                                                                         // 390
    T({x:1}, {$set:{x:1}}, "simple set scalar");                                                                      // 391
    T({x:"a"}, {$set:{x:"a"}}, "simple set scalar");                                                                  // 392
    T({x:false}, {$set:{x:false}}, "simple set scalar");                                                              // 393
    F({x:true}, {$set:{x:false}}, "simple set scalar");                                                               // 394
    F({x:2}, {$set:{x:3}}, "simple set scalar");                                                                      // 395
                                                                                                                      // 396
    F({'foo.bar.baz': 1, x:1}, {$unset:{'foo.bar.baz': 1}, $set:{x:1}}, "simple unset of the interesting path");      // 397
    F({'foo.bar.baz': 1, x:1}, {$unset:{'foo.bar': 1}, $set:{x:1}}, "simple unset of the interesting path prefix");   // 398
    F({'foo.bar.baz': 1, x:1}, {$unset:{'foo': 1}, $set:{x:1}}, "simple unset of the interesting path prefix");       // 399
    F({'foo.bar.baz': 1}, {$unset:{'foo.baz': 1}}, "simple unset of the interesting path prefix");                    // 400
    F({'foo.bar.baz': 1}, {$unset:{'foo.bar.bar': 1}}, "simple unset of the interesting path prefix");                // 401
  });                                                                                                                 // 402
                                                                                                                      // 403
  Tinytest.add("minimongo - can selector become true by modifier - regexps", function (t) {                           // 404
    test = t;                                                                                                         // 405
                                                                                                                      // 406
    // Regexp                                                                                                         // 407
    T({ 'foo.bar': /^[0-9]+$/i }, { $set: {'foo.bar': '01233'} }, "set of regexp");                                   // 408
    // XXX this test should be False, should be fixed within improved implementation                                  // 409
    T({ 'foo.bar': /^[0-9]+$/i, x: 1 }, { $set: {'foo.bar': '0a1233', x: 1} }, "set of regexp");                      // 410
    // XXX this test should be False, should be fixed within improved implementation                                  // 411
    T({ 'foo.bar': /^[0-9]+$/i, x: 1 }, { $unset: {'foo.bar': 1}, $set: { x: 1 } }, "unset of regexp");               // 412
    T({ 'foo.bar': /^[0-9]+$/i, x: 1 }, { $set: { x: 1 } }, "don't touch regexp");                                    // 413
  });                                                                                                                 // 414
                                                                                                                      // 415
  Tinytest.add("minimongo - can selector become true by modifier - undefined/null", function (t) {                    // 416
    test = t;                                                                                                         // 417
    // Nulls / Undefined                                                                                              // 418
    T({ 'foo.bar': null }, {$set:{'foo.bar': null}}, "set of null looking for null");                                 // 419
    T({ 'foo.bar': null }, {$set:{'foo.bar': undefined}}, "set of undefined looking for null");                       // 420
    T({ 'foo.bar': undefined }, {$set:{'foo.bar': null}}, "set of null looking for undefined");                       // 421
    T({ 'foo.bar': undefined }, {$set:{'foo.bar': undefined}}, "set of undefined looking for undefined");             // 422
    T({ 'foo.bar': null }, {$set:{'foo': null}}, "set of null of parent path looking for null");                      // 423
    F({ 'foo.bar': null }, {$set:{'foo.bar.baz': null}}, "set of null of different path looking for null");           // 424
    T({ 'foo.bar': null }, { $unset: { 'foo': 1 } }, "unset the parent");                                             // 425
    T({ 'foo.bar': null }, { $unset: { 'foo.bar': 1 } }, "unset tracked path");                                       // 426
    T({ 'foo.bar': null }, { $set: { 'foo': 3 } }, "set the parent");                                                 // 427
    T({ 'foo.bar': null }, { $set: { 'foo': {baz:1} } }, "set the parent");                                           // 428
                                                                                                                      // 429
  });                                                                                                                 // 430
                                                                                                                      // 431
  Tinytest.add("minimongo - can selector become true by modifier - literals with arrays", function (t) {              // 432
    test = t;                                                                                                         // 433
    // These tests are incomplete and in theory they all should return true as we                                     // 434
    // don't support any case with numeric fields yet.                                                                // 435
    T({'a.1.b': 1, x:1}, {$unset:{'a.1.b': 1}, $set:{x:1}}, "unset of array element's field with exactly the same index as selector");
    F({'a.2.b': 1}, {$unset:{'a.1.b': 1}}, "unset of array element's field with different index as selector");        // 437
    // This is false, because if you are looking for array but in reality it is an                                    // 438
    // object, it just can't get to true.                                                                             // 439
    F({'a.2.b': 1}, {$unset:{'a.b': 1}}, "unset of field while selector is looking for index");                       // 440
    T({ 'foo.bar': null }, {$set:{'foo.1.bar': null}}, "set array's element's field to null looking for null");       // 441
    T({ 'foo.bar': null }, {$set:{'foo.0.bar': 1, 'foo.1.bar': null}}, "set array's element's field to null looking for null");
    // This is false, because there may remain other array elements that match                                        // 443
    // but we modified this test as we don't support this case yet                                                    // 444
    T({'a.b': 1}, {$unset:{'a.1.b': 1}}, "unset of array element's field");                                           // 445
  });                                                                                                                 // 446
                                                                                                                      // 447
  Tinytest.add("minimongo - can selector become true by modifier - set an object literal whose fields are selected", function (t) {
    test = t;                                                                                                         // 449
    T({ 'a.b.c': 1 }, { $set: { 'a.b': { c: 1 } } }, "a simple scalar selector and simple set");                      // 450
    F({ 'a.b.c': 1 }, { $set: { 'a.b': { c: 2 } } }, "a simple scalar selector and simple set to false");             // 451
    F({ 'a.b.c': 1 }, { $set: { 'a.b': { d: 1 } } }, "a simple scalar selector and simple set a wrong literal");      // 452
    F({ 'a.b.c': 1 }, { $set: { 'a.b': 222 } }, "a simple scalar selector and simple set a wrong type");              // 453
  });                                                                                                                 // 454
                                                                                                                      // 455
})();                                                                                                                 // 456
                                                                                                                      // 457
                                                                                                                      // 458
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
