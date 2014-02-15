(function () {

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/deps/deps_tests.js                                       //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
Tinytest.add('deps - run', function (test) {                         // 1
  var d = new Deps.Dependency;                                       // 2
  var x = 0;                                                         // 3
  var handle = Deps.autorun(function (handle) {                      // 4
    d.depend();                                                      // 5
    ++x;                                                             // 6
  });                                                                // 7
  test.equal(x, 1);                                                  // 8
  Deps.flush();                                                      // 9
  test.equal(x, 1);                                                  // 10
  d.changed();                                                       // 11
  test.equal(x, 1);                                                  // 12
  Deps.flush();                                                      // 13
  test.equal(x, 2);                                                  // 14
  d.changed();                                                       // 15
  test.equal(x, 2);                                                  // 16
  Deps.flush();                                                      // 17
  test.equal(x, 3);                                                  // 18
  d.changed();                                                       // 19
  // Prevent the function from running further.                      // 20
  handle.stop();                                                     // 21
  Deps.flush();                                                      // 22
  test.equal(x, 3);                                                  // 23
  d.changed();                                                       // 24
  Deps.flush();                                                      // 25
  test.equal(x, 3);                                                  // 26
                                                                     // 27
  Deps.autorun(function (internalHandle) {                           // 28
    d.depend();                                                      // 29
    ++x;                                                             // 30
    if (x == 6)                                                      // 31
      internalHandle.stop();                                         // 32
  });                                                                // 33
  test.equal(x, 4);                                                  // 34
  d.changed();                                                       // 35
  Deps.flush();                                                      // 36
  test.equal(x, 5);                                                  // 37
  d.changed();                                                       // 38
  // Increment to 6 and stop.                                        // 39
  Deps.flush();                                                      // 40
  test.equal(x, 6);                                                  // 41
  d.changed();                                                       // 42
  Deps.flush();                                                      // 43
  // Still 6!                                                        // 44
  test.equal(x, 6);                                                  // 45
                                                                     // 46
  test.throws(function () {                                          // 47
    Deps.autorun();                                                  // 48
  });                                                                // 49
  test.throws(function () {                                          // 50
    Deps.autorun({});                                                // 51
  });                                                                // 52
});                                                                  // 53
                                                                     // 54
Tinytest.add("deps - nested run", function (test) {                  // 55
  var a = new Deps.Dependency;                                       // 56
  var b = new Deps.Dependency;                                       // 57
  var c = new Deps.Dependency;                                       // 58
  var d = new Deps.Dependency;                                       // 59
  var e = new Deps.Dependency;                                       // 60
  var f = new Deps.Dependency;                                       // 61
                                                                     // 62
  var buf = "";                                                      // 63
                                                                     // 64
  var c1 = Deps.autorun(function () {                                // 65
    a.depend();                                                      // 66
    buf += 'a';                                                      // 67
    Deps.autorun(function () {                                       // 68
      b.depend();                                                    // 69
      buf += 'b';                                                    // 70
      Deps.autorun(function () {                                     // 71
        c.depend();                                                  // 72
        buf += 'c';                                                  // 73
        var c2 = Deps.autorun(function () {                          // 74
          d.depend();                                                // 75
          buf += 'd';                                                // 76
          Deps.autorun(function () {                                 // 77
            e.depend();                                              // 78
            buf += 'e';                                              // 79
            Deps.autorun(function () {                               // 80
              f.depend();                                            // 81
              buf += 'f';                                            // 82
            });                                                      // 83
          });                                                        // 84
          Deps.onInvalidate(function () {                            // 85
            // only run once                                         // 86
            c2.stop();                                               // 87
          });                                                        // 88
        });                                                          // 89
      });                                                            // 90
    });                                                              // 91
    Deps.onInvalidate(function (c1) {                                // 92
      c1.stop();                                                     // 93
    });                                                              // 94
  });                                                                // 95
                                                                     // 96
  var expect = function (str) {                                      // 97
    test.equal(buf, str);                                            // 98
    buf = "";                                                        // 99
  };                                                                 // 100
                                                                     // 101
  expect('abcdef');                                                  // 102
                                                                     // 103
  b.changed();                                                       // 104
  expect(''); // didn't flush yet                                    // 105
  Deps.flush();                                                      // 106
  expect('bcdef');                                                   // 107
                                                                     // 108
  c.changed();                                                       // 109
  Deps.flush();                                                      // 110
  expect('cdef');                                                    // 111
                                                                     // 112
  var changeAndExpect = function (v, str) {                          // 113
    v.changed();                                                     // 114
    Deps.flush();                                                    // 115
    expect(str);                                                     // 116
  };                                                                 // 117
                                                                     // 118
  // should cause running                                            // 119
  changeAndExpect(e, 'ef');                                          // 120
  changeAndExpect(f, 'f');                                           // 121
  // invalidate inner context                                        // 122
  changeAndExpect(d, '');                                            // 123
  // no more running!                                                // 124
  changeAndExpect(e, '');                                            // 125
  changeAndExpect(f, '');                                            // 126
  // rerun C                                                         // 127
  changeAndExpect(c, 'cdef');                                        // 128
  changeAndExpect(e, 'ef');                                          // 129
  changeAndExpect(f, 'f');                                           // 130
  // rerun B                                                         // 131
  changeAndExpect(b, 'bcdef');                                       // 132
  changeAndExpect(e, 'ef');                                          // 133
  changeAndExpect(f, 'f');                                           // 134
  // kill A                                                          // 135
  a.changed();                                                       // 136
  changeAndExpect(f, '');                                            // 137
  changeAndExpect(e, '');                                            // 138
  changeAndExpect(d, '');                                            // 139
  changeAndExpect(c, '');                                            // 140
  changeAndExpect(b, '');                                            // 141
  changeAndExpect(a, '');                                            // 142
                                                                     // 143
  test.isFalse(a.hasDependents());                                   // 144
  test.isFalse(b.hasDependents());                                   // 145
  test.isFalse(c.hasDependents());                                   // 146
  test.isFalse(d.hasDependents());                                   // 147
  test.isFalse(e.hasDependents());                                   // 148
  test.isFalse(f.hasDependents());                                   // 149
});                                                                  // 150
                                                                     // 151
Tinytest.add("deps - flush", function (test) {                       // 152
                                                                     // 153
  var buf = "";                                                      // 154
                                                                     // 155
  var c1 = Deps.autorun(function (c) {                               // 156
    buf += 'a';                                                      // 157
    // invalidate first time                                         // 158
    if (c.firstRun)                                                  // 159
      c.invalidate();                                                // 160
  });                                                                // 161
                                                                     // 162
  test.equal(buf, 'a');                                              // 163
  Deps.flush();                                                      // 164
  test.equal(buf, 'aa');                                             // 165
  Deps.flush();                                                      // 166
  test.equal(buf, 'aa');                                             // 167
  c1.stop();                                                         // 168
  Deps.flush();                                                      // 169
  test.equal(buf, 'aa');                                             // 170
                                                                     // 171
  //////                                                             // 172
                                                                     // 173
  buf = "";                                                          // 174
                                                                     // 175
  var c2 = Deps.autorun(function (c) {                               // 176
    buf += 'a';                                                      // 177
    // invalidate first time                                         // 178
    if (c.firstRun)                                                  // 179
      c.invalidate();                                                // 180
                                                                     // 181
    Deps.onInvalidate(function () {                                  // 182
      buf += "*";                                                    // 183
    });                                                              // 184
  });                                                                // 185
                                                                     // 186
  test.equal(buf, 'a*');                                             // 187
  Deps.flush();                                                      // 188
  test.equal(buf, 'a*a');                                            // 189
  c2.stop();                                                         // 190
  test.equal(buf, 'a*a*');                                           // 191
  Deps.flush();                                                      // 192
  test.equal(buf, 'a*a*');                                           // 193
                                                                     // 194
  /////                                                              // 195
  // Can flush a diferent run from a run;                            // 196
  // no current computation in afterFlush                            // 197
                                                                     // 198
  buf = "";                                                          // 199
                                                                     // 200
  var c3 = Deps.autorun(function (c) {                               // 201
    buf += 'a';                                                      // 202
    // invalidate first time                                         // 203
    if (c.firstRun)                                                  // 204
      c.invalidate();                                                // 205
    Deps.afterFlush(function () {                                    // 206
      buf += (Deps.active ? "1" : "0");                              // 207
    });                                                              // 208
  });                                                                // 209
                                                                     // 210
  Deps.afterFlush(function () {                                      // 211
    buf += 'c';                                                      // 212
  });                                                                // 213
                                                                     // 214
  var c4 = Deps.autorun(function (c) {                               // 215
    c4 = c;                                                          // 216
    buf += 'b';                                                      // 217
  });                                                                // 218
                                                                     // 219
  Deps.flush();                                                      // 220
  test.equal(buf, 'aba0c0');                                         // 221
  c3.stop();                                                         // 222
  c4.stop();                                                         // 223
  Deps.flush();                                                      // 224
                                                                     // 225
  // cases where flush throws                                        // 226
                                                                     // 227
  var ran = false;                                                   // 228
  Deps.afterFlush(function (arg) {                                   // 229
    ran = true;                                                      // 230
    test.equal(typeof arg, 'undefined');                             // 231
    test.throws(function () {                                        // 232
      Deps.flush(); // illegal nested flush                          // 233
    });                                                              // 234
  });                                                                // 235
                                                                     // 236
  Deps.flush();                                                      // 237
  test.isTrue(ran);                                                  // 238
                                                                     // 239
  test.throws(function () {                                          // 240
    Deps.autorun(function () {                                       // 241
      Deps.flush(); // illegal to flush from a computation           // 242
    });                                                              // 243
  });                                                                // 244
});                                                                  // 245
                                                                     // 246
Tinytest.add("deps - lifecycle", function (test) {                   // 247
                                                                     // 248
  test.isFalse(Deps.active);                                         // 249
  test.equal(null, Deps.currentComputation);                         // 250
                                                                     // 251
  var runCount = 0;                                                  // 252
  var firstRun = true;                                               // 253
  var buf = [];                                                      // 254
  var cbId = 1;                                                      // 255
  var makeCb = function () {                                         // 256
    var id = cbId++;                                                 // 257
    return function () {                                             // 258
      buf.push(id);                                                  // 259
    };                                                               // 260
  };                                                                 // 261
                                                                     // 262
  var shouldStop = false;                                            // 263
                                                                     // 264
  var c1 = Deps.autorun(function (c) {                               // 265
    test.isTrue(Deps.active);                                        // 266
    test.equal(c, Deps.currentComputation);                          // 267
    test.equal(c.stopped, false);                                    // 268
    test.equal(c.invalidated, false);                                // 269
      test.equal(c.firstRun, firstRun);                              // 270
                                                                     // 271
    Deps.onInvalidate(makeCb()); // 1, 6, ...                        // 272
    Deps.afterFlush(makeCb()); // 2, 7, ...                          // 273
                                                                     // 274
    Deps.autorun(function (x) {                                      // 275
      x.stop();                                                      // 276
      c.onInvalidate(makeCb()); // 3, 8, ...                         // 277
                                                                     // 278
      Deps.onInvalidate(makeCb()); // 4, 9, ...                      // 279
      Deps.afterFlush(makeCb()); // 5, 10, ...                       // 280
    });                                                              // 281
    runCount++;                                                      // 282
                                                                     // 283
    if (shouldStop)                                                  // 284
      c.stop();                                                      // 285
  });                                                                // 286
                                                                     // 287
  firstRun = false;                                                  // 288
                                                                     // 289
  test.equal(runCount, 1);                                           // 290
                                                                     // 291
  test.equal(buf, [4]);                                              // 292
  c1.invalidate();                                                   // 293
  test.equal(runCount, 1);                                           // 294
  test.equal(c1.invalidated, true);                                  // 295
  test.equal(c1.stopped, false);                                     // 296
  test.equal(buf, [4, 1, 3]);                                        // 297
                                                                     // 298
  Deps.flush();                                                      // 299
                                                                     // 300
  test.equal(runCount, 2);                                           // 301
  test.equal(c1.invalidated, false);                                 // 302
  test.equal(buf, [4, 1, 3, 9, 2, 5, 7, 10]);                        // 303
                                                                     // 304
  // test self-stop                                                  // 305
  buf.length = 0;                                                    // 306
  shouldStop = true;                                                 // 307
  c1.invalidate();                                                   // 308
  test.equal(buf, [6, 8]);                                           // 309
  Deps.flush();                                                      // 310
  test.equal(buf, [6, 8, 14, 11, 13, 12, 15]);                       // 311
                                                                     // 312
});                                                                  // 313
                                                                     // 314
Tinytest.add("deps - onInvalidate", function (test) {                // 315
  var buf = "";                                                      // 316
                                                                     // 317
  var c1 = Deps.autorun(function () {                                // 318
    buf += "*";                                                      // 319
  });                                                                // 320
                                                                     // 321
  var append = function (x) {                                        // 322
    return function () {                                             // 323
      test.isFalse(Deps.active);                                     // 324
      buf += x;                                                      // 325
    };                                                               // 326
  };                                                                 // 327
                                                                     // 328
  c1.onInvalidate(append('a'));                                      // 329
  c1.onInvalidate(append('b'));                                      // 330
  test.equal(buf, '*');                                              // 331
  Deps.autorun(function (me) {                                       // 332
    Deps.onInvalidate(append('z'));                                  // 333
    me.stop();                                                       // 334
    test.equal(buf, '*z');                                           // 335
    c1.invalidate();                                                 // 336
  });                                                                // 337
  test.equal(buf, '*zab');                                           // 338
  c1.onInvalidate(append('c'));                                      // 339
  c1.onInvalidate(append('d'));                                      // 340
  test.equal(buf, '*zabcd');                                         // 341
  Deps.flush();                                                      // 342
  test.equal(buf, '*zabcd*');                                        // 343
                                                                     // 344
  // afterFlush ordering                                             // 345
  buf = '';                                                          // 346
  c1.onInvalidate(append('a'));                                      // 347
  c1.onInvalidate(append('b'));                                      // 348
  Deps.afterFlush(function () {                                      // 349
    append('x')();                                                   // 350
    c1.onInvalidate(append('c'));                                    // 351
    c1.invalidate();                                                 // 352
    Deps.afterFlush(function () {                                    // 353
      append('y')();                                                 // 354
      c1.onInvalidate(append('d'));                                  // 355
      c1.invalidate();                                               // 356
    });                                                              // 357
  });                                                                // 358
  Deps.afterFlush(function () {                                      // 359
    append('z')();                                                   // 360
    c1.onInvalidate(append('e'));                                    // 361
    c1.invalidate();                                                 // 362
  });                                                                // 363
                                                                     // 364
  test.equal(buf, '');                                               // 365
  Deps.flush();                                                      // 366
  test.equal(buf, 'xabc*ze*yd*');                                    // 367
                                                                     // 368
  buf = "";                                                          // 369
  c1.onInvalidate(append('m'));                                      // 370
  c1.stop();                                                         // 371
  test.equal(buf, 'm');                                              // 372
  Deps.flush();                                                      // 373
});                                                                  // 374
///////////////////////////////////////////////////////////////////////

}).call(this);
