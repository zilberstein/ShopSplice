(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/tinytest/tinytest.js                                                                   //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
/******************************************************************************/                   // 1
/* TestCaseResults                                                            */                   // 2
/******************************************************************************/                   // 3
                                                                                                   // 4
TestCaseResults = function (test_case, onEvent, onException, stop_at_offset) {                     // 5
  var self = this;                                                                                 // 6
  self.test_case = test_case;                                                                      // 7
  self.onEvent = onEvent;                                                                          // 8
  self.expecting_failure = false;                                                                  // 9
  self.current_fail_count = 0;                                                                     // 10
  self.stop_at_offset = stop_at_offset;                                                            // 11
  self.onException = onException;                                                                  // 12
  self.id = Random.id();                                                                           // 13
};                                                                                                 // 14
                                                                                                   // 15
_.extend(TestCaseResults.prototype, {                                                              // 16
  ok: function (doc) {                                                                             // 17
    var self = this;                                                                               // 18
    var ok = {type: "ok"};                                                                         // 19
    if (doc)                                                                                       // 20
      ok.details = doc;                                                                            // 21
    if (self.expecting_failure) {                                                                  // 22
      ok.details = ok.details || {};                                                               // 23
      ok.details["was_expecting_failure"] = true;                                                  // 24
      self.expecting_failure = false;                                                              // 25
    }                                                                                              // 26
    self.onEvent(ok);                                                                              // 27
  },                                                                                               // 28
                                                                                                   // 29
  expect_fail: function () {                                                                       // 30
    var self = this;                                                                               // 31
    self.expecting_failure = true;                                                                 // 32
  },                                                                                               // 33
                                                                                                   // 34
  fail: function (doc) {                                                                           // 35
    var self = this;                                                                               // 36
                                                                                                   // 37
    if (typeof doc === "string") {                                                                 // 38
      // Some very old code still tries to call fail() with a                                      // 39
      // string. Don't do this!                                                                    // 40
      doc = { type: "fail", message: doc };                                                        // 41
    }                                                                                              // 42
                                                                                                   // 43
    if (self.stop_at_offset === 0) {                                                               // 44
      if (Meteor.isClient) {                                                                       // 45
        // Only supported on the browser for now..                                                 // 46
        var now = (+new Date);                                                                     // 47
        debugger;                                                                                  // 48
        if ((+new Date) - now < 100)                                                               // 49
          alert("To use this feature, first enable your browser's debugger.");                     // 50
      }                                                                                            // 51
      self.stop_at_offset = null;                                                                  // 52
    }                                                                                              // 53
    if (self.stop_at_offset)                                                                       // 54
      self.stop_at_offset--;                                                                       // 55
                                                                                                   // 56
    // Get filename and line number of failure if we're using v8 (Chrome or                        // 57
    // Node).                                                                                      // 58
    if (Error.captureStackTrace) {                                                                 // 59
      var savedPrepareStackTrace = Error.prepareStackTrace;                                        // 60
      Error.prepareStackTrace = function(_, stack){ return stack; };                               // 61
      var err = new Error;                                                                         // 62
      Error.captureStackTrace(err);                                                                // 63
      var stack = err.stack;                                                                       // 64
      Error.prepareStackTrace = savedPrepareStackTrace;                                            // 65
      for (var i = stack.length - 1; i >= 0; --i) {                                                // 66
        var frame = stack[i];                                                                      // 67
        // Heuristic: use the OUTERMOST line which is in a :tests.js                               // 68
        // file (this is less likely to be a test helper function).                                // 69
        if (frame.getFileName().match(/:tests\.js/)) {                                             // 70
          doc.filename = frame.getFileName();                                                      // 71
          doc.line = frame.getLineNumber();                                                        // 72
          break;                                                                                   // 73
        }                                                                                          // 74
      }                                                                                            // 75
    }                                                                                              // 76
                                                                                                   // 77
    self.onEvent({                                                                                 // 78
        type: (self.expecting_failure ? "expected_fail" : "fail"),                                 // 79
        details: doc,                                                                              // 80
        cookie: {name: self.test_case.name, offset: self.current_fail_count,                       // 81
                 groupPath: self.test_case.groupPath,                                              // 82
                 shortName: self.test_case.shortName}                                              // 83
    });                                                                                            // 84
    self.expecting_failure = false;                                                                // 85
    self.current_fail_count++;                                                                     // 86
  },                                                                                               // 87
                                                                                                   // 88
  // Call this to fail the test with an exception. Use this to record                              // 89
  // exceptions that occur inside asynchronous callbacks in tests.                                 // 90
  //                                                                                               // 91
  // It should only be used with asynchronous tests, and if you call                               // 92
  // this function, you should make sure that (1) the test doesn't                                 // 93
  // call its callback (onComplete function); (2) the test function                                // 94
  // doesn't directly raise an exception.                                                          // 95
  exception: function (exception) {                                                                // 96
    this.onException(exception);                                                                   // 97
  },                                                                                               // 98
                                                                                                   // 99
  // returns a unique ID for this test run, for convenience use by                                 // 100
  // your tests                                                                                    // 101
  runId: function () {                                                                             // 102
    return this.id;                                                                                // 103
  },                                                                                               // 104
                                                                                                   // 105
  // === Following patterned after http://vowsjs.org/#reference ===                                // 106
                                                                                                   // 107
  // XXX eliminate 'message' and 'not' arguments                                                   // 108
  equal: function (actual, expected, message, not) {                                               // 109
    /* If expected is a DOM node, do a literal '===' comparison with                               // 110
     * actual. Otherwise do a deep comparison, as implemented by _.isEqual.                        // 111
     */                                                                                            // 112
                                                                                                   // 113
    var matched;                                                                                   // 114
    // XXX remove cruft specific to liverange                                                      // 115
    if (typeof expected === "object" && expected && expected.nodeType) {                           // 116
      matched = expected === actual;                                                               // 117
      expected = "[Node]";                                                                         // 118
      actual = "[Unknown]";                                                                        // 119
    } else if (typeof Uint8Array !== 'undefined' && expected instanceof Uint8Array) {              // 120
      // I have no idea why but _.isEqual on Chrome horks completely on Uint8Arrays.               // 121
      // and the symptom is the chrome renderer taking up an entire CPU and freezing               // 122
      // your web page, but not pausing anywhere in _.isEqual.  I don't understand it              // 123
      // but we fall back to a manual comparison                                                   // 124
      if (!(actual instanceof Uint8Array))                                                         // 125
        this.fail({type: "assert_equal", message: "found object is not a typed array",             // 126
                   expected: "A typed array", actual: actual.constructor.toString()});             // 127
      if (expected.length !== actual.length)                                                       // 128
        this.fail({type: "assert_equal", message: "lengths of typed arrays do not match",          // 129
                   expected: expected.length, actual: actual.length});                             // 130
      for (var i = 0; i < expected.length; i++) {                                                  // 131
        this.equal(actual[i], expected[i]);                                                        // 132
      }                                                                                            // 133
    } else {                                                                                       // 134
      matched = EJSON.equals(expected, actual);                                                    // 135
    }                                                                                              // 136
                                                                                                   // 137
    if (matched === !!not) {                                                                       // 138
      this.fail({type: "assert_equal", message: message,                                           // 139
                 expected: JSON.stringify(expected), actual: JSON.stringify(actual), not: !!not}); // 140
    } else                                                                                         // 141
      this.ok();                                                                                   // 142
  },                                                                                               // 143
                                                                                                   // 144
  notEqual: function (actual, expected, message) {                                                 // 145
    this.equal(actual, expected, message, true);                                                   // 146
  },                                                                                               // 147
                                                                                                   // 148
  instanceOf: function (obj, klass) {                                                              // 149
    if (obj instanceof klass)                                                                      // 150
      this.ok();                                                                                   // 151
    else                                                                                           // 152
      this.fail({type: "instanceOf"}); // XXX what other data?                                     // 153
  },                                                                                               // 154
                                                                                                   // 155
  matches: function (actual, regexp, message) {                                                    // 156
    if (regexp.test(actual))                                                                       // 157
      this.ok();                                                                                   // 158
    else                                                                                           // 159
      this.fail({type: "matches", message: message,                                                // 160
                 actual: actual, regexp: regexp.toString()});                                      // 161
  },                                                                                               // 162
                                                                                                   // 163
  // XXX nodejs assert.throws can take an expected error, as a class,                              // 164
  // regular expression, or predicate function.  However, with its                                 // 165
  // implementation if a constructor (class) is passed in and `actual`                             // 166
  // fails the instanceof test, the constructor is then treated as                                 // 167
  // a predicate and called with `actual` (!)                                                      // 168
  //                                                                                               // 169
  // expected can be:                                                                              // 170
  //  undefined: accept any exception.                                                             // 171
  //  regexp: accept an exception with message passing the regexp.                                 // 172
  //  function: call the function as a predicate with the exception.                               // 173
  throws: function (f, expected) {                                                                 // 174
    var actual, predicate;                                                                         // 175
                                                                                                   // 176
    if (expected === undefined)                                                                    // 177
      predicate = function (actual) {                                                              // 178
        return true;                                                                               // 179
      };                                                                                           // 180
    else if (expected instanceof RegExp)                                                           // 181
      predicate = function (actual) {                                                              // 182
        return expected.test(actual.message)                                                       // 183
      };                                                                                           // 184
    else if (typeof expected === 'function')                                                       // 185
      predicate = expected;                                                                        // 186
    else                                                                                           // 187
      throw new Error('expected should be a predicate function or regexp');                        // 188
                                                                                                   // 189
    try {                                                                                          // 190
      f();                                                                                         // 191
    } catch (exception) {                                                                          // 192
      actual = exception;                                                                          // 193
    }                                                                                              // 194
                                                                                                   // 195
    if (actual && predicate(actual))                                                               // 196
      this.ok({message: actual.message});                                                          // 197
    else                                                                                           // 198
      this.fail({type: "throws"});                                                                 // 199
  },                                                                                               // 200
                                                                                                   // 201
  isTrue: function (v, msg) {                                                                      // 202
    if (v)                                                                                         // 203
      this.ok();                                                                                   // 204
    else                                                                                           // 205
      this.fail({type: "true", message: msg});                                                     // 206
  },                                                                                               // 207
                                                                                                   // 208
  isFalse: function (v, msg) {                                                                     // 209
    if (v)                                                                                         // 210
      this.fail({type: "true", message: msg});                                                     // 211
    else                                                                                           // 212
      this.ok();                                                                                   // 213
  },                                                                                               // 214
                                                                                                   // 215
  isNull: function (v, msg) {                                                                      // 216
    if (v === null)                                                                                // 217
      this.ok();                                                                                   // 218
    else                                                                                           // 219
      this.fail({type: "null", message: msg});                                                     // 220
  },                                                                                               // 221
                                                                                                   // 222
  isNotNull: function (v, msg) {                                                                   // 223
    if (v === null)                                                                                // 224
      this.fail({type: "true", message: msg});                                                     // 225
    else                                                                                           // 226
      this.ok();                                                                                   // 227
  },                                                                                               // 228
                                                                                                   // 229
  isUndefined: function (v, msg) {                                                                 // 230
    if (v === undefined)                                                                           // 231
      this.ok();                                                                                   // 232
    else                                                                                           // 233
      this.fail({type: "undefined", message: msg});                                                // 234
  },                                                                                               // 235
                                                                                                   // 236
  isNaN: function (v, msg) {                                                                       // 237
    if (isNaN(v))                                                                                  // 238
      this.ok();                                                                                   // 239
    else                                                                                           // 240
      this.fail({type: "NaN", message: msg});                                                      // 241
  },                                                                                               // 242
                                                                                                   // 243
  include: function (s, v) {                                                                       // 244
    var pass = false;                                                                              // 245
    if (s instanceof Array)                                                                        // 246
      pass = _.any(s, function(it) {return _.isEqual(v, it);});                                    // 247
    else if (typeof s === "object")                                                                // 248
      pass = v in s;                                                                               // 249
    else if (typeof s === "string")                                                                // 250
      for (var i = 0; i < s.length; i++)                                                           // 251
        if (s.charAt(i) === v) {                                                                   // 252
          pass = true;                                                                             // 253
          break;                                                                                   // 254
        }                                                                                          // 255
    else                                                                                           // 256
      /* fail -- not something that contains other things */;                                      // 257
    if (pass)                                                                                      // 258
      this.ok();                                                                                   // 259
    else {                                                                                         // 260
      this.fail({type: "include", sequence: s, should_contain_value: v});                          // 261
    }                                                                                              // 262
  },                                                                                               // 263
                                                                                                   // 264
  // XXX should change to lengthOf to match vowsjs                                                 // 265
  length: function (obj, expected_length) {                                                        // 266
    if (obj.length === expected_length)                                                            // 267
      this.ok();                                                                                   // 268
    else                                                                                           // 269
      this.fail({type: "length", expected: expected_length,                                        // 270
                 actual: obj.length});                                                             // 271
  }                                                                                                // 272
                                                                                                   // 273
});                                                                                                // 274
                                                                                                   // 275
/******************************************************************************/                   // 276
/* TestCase                                                                   */                   // 277
/******************************************************************************/                   // 278
                                                                                                   // 279
TestCase = function (name, func, async) {                                                          // 280
  var self = this;                                                                                 // 281
  self.name = name;                                                                                // 282
  self.func = func;                                                                                // 283
  self.async = async || false;                                                                     // 284
                                                                                                   // 285
  var nameParts = _.map(name.split(" - "), function(s) {                                           // 286
    return s.replace(/^\s*|\s*$/g, ""); // trim                                                    // 287
  });                                                                                              // 288
  self.shortName = nameParts.pop();                                                                // 289
  nameParts.unshift("tinytest");                                                                   // 290
  self.groupPath = nameParts;                                                                      // 291
};                                                                                                 // 292
                                                                                                   // 293
_.extend(TestCase.prototype, {                                                                     // 294
  // Run the test asynchronously, delivering results via onEvent;                                  // 295
  // then call onComplete() on success, or else onException(e) if the                              // 296
  // test raised (or voluntarily reported) an exception.                                           // 297
  run: function (onEvent, onComplete, onException, stop_at_offset) {                               // 298
    var self = this;                                                                               // 299
                                                                                                   // 300
    var completed = false;                                                                         // 301
    var markComplete = function () {                                                               // 302
      if (completed) {                                                                             // 303
        Meteor._debug("*** Test error -- test '" + self.name +                                     // 304
                      "' returned multiple times.");                                               // 305
        return false;                                                                              // 306
      }                                                                                            // 307
      completed = true;                                                                            // 308
      return true;                                                                                 // 309
    };                                                                                             // 310
                                                                                                   // 311
    var wrappedOnEvent = function (e) {                                                            // 312
      // If this trace prints, it means you ran some test.* function after the                     // 313
      // test finished! Another symptom will be that the test will display as                      // 314
      // "waiting" even when it counts as passed or failed.                                        // 315
      if (completed)                                                                               // 316
        console.trace("event after complete!");                                                    // 317
      return onEvent(e);                                                                           // 318
    };                                                                                             // 319
                                                                                                   // 320
    var results = new TestCaseResults(self, wrappedOnEvent,                                        // 321
                                      function (e) {                                               // 322
                                        if (markComplete())                                        // 323
                                          onException(e);                                          // 324
                                      }, stop_at_offset);                                          // 325
                                                                                                   // 326
    Meteor.defer(function () {                                                                     // 327
      try {                                                                                        // 328
        if (self.async) {                                                                          // 329
          self.func(results, function () {                                                         // 330
            if (markComplete())                                                                    // 331
              onComplete();                                                                        // 332
          });                                                                                      // 333
        } else {                                                                                   // 334
          self.func(results);                                                                      // 335
          if (markComplete())                                                                      // 336
            onComplete();                                                                          // 337
        }                                                                                          // 338
      } catch (e) {                                                                                // 339
        if (markComplete())                                                                        // 340
          onException(e);                                                                          // 341
      }                                                                                            // 342
    });                                                                                            // 343
  }                                                                                                // 344
});                                                                                                // 345
                                                                                                   // 346
/******************************************************************************/                   // 347
/* TestManager                                                                */                   // 348
/******************************************************************************/                   // 349
                                                                                                   // 350
TestManager = function () {                                                                        // 351
  var self = this;                                                                                 // 352
  self.tests = {};                                                                                 // 353
  self.ordered_tests = [];                                                                         // 354
};                                                                                                 // 355
                                                                                                   // 356
_.extend(TestManager.prototype, {                                                                  // 357
  addCase: function (test) {                                                                       // 358
    var self = this;                                                                               // 359
    if (test.name in self.tests)                                                                   // 360
      throw new Error(                                                                             // 361
        "Every test needs a unique name, but there are two tests named '" +                        // 362
          test.name + "'");                                                                        // 363
    self.tests[test.name] = test;                                                                  // 364
    self.ordered_tests.push(test);                                                                 // 365
  },                                                                                               // 366
                                                                                                   // 367
  createRun: function (onReport, pathPrefix) {                                                     // 368
    var self = this;                                                                               // 369
    return new TestRun(self, onReport, pathPrefix);                                                // 370
  }                                                                                                // 371
});                                                                                                // 372
                                                                                                   // 373
// singleton                                                                                       // 374
TestManager = new TestManager;                                                                     // 375
                                                                                                   // 376
/******************************************************************************/                   // 377
/* TestRun                                                                    */                   // 378
/******************************************************************************/                   // 379
                                                                                                   // 380
TestRun = function (manager, onReport, pathPrefix) {                                               // 381
  var self = this;                                                                                 // 382
  self.manager = manager;                                                                          // 383
  self.onReport = onReport;                                                                        // 384
  self.next_sequence_number = 0;                                                                   // 385
  self._pathPrefix = pathPrefix || [];                                                             // 386
  _.each(self.manager.ordered_tests, function (test) {                                             // 387
    if (self._prefixMatch(test.groupPath))                                                         // 388
      self._report(test);                                                                          // 389
  });                                                                                              // 390
};                                                                                                 // 391
                                                                                                   // 392
_.extend(TestRun.prototype, {                                                                      // 393
                                                                                                   // 394
  _prefixMatch: function (testPath) {                                                              // 395
    var self = this;                                                                               // 396
    for (var i = 0; i < self._pathPrefix.length; i++) {                                            // 397
      if (!testPath[i] || self._pathPrefix[i] !== testPath[i]) {                                   // 398
        return false;                                                                              // 399
      }                                                                                            // 400
    }                                                                                              // 401
    return true;                                                                                   // 402
  },                                                                                               // 403
                                                                                                   // 404
  _runOne: function (test, onComplete, stop_at_offset) {                                           // 405
    var self = this;                                                                               // 406
    var startTime = (+new Date);                                                                   // 407
    if (self._prefixMatch(test.groupPath)) {                                                       // 408
      test.run(function (event) {                                                                  // 409
        /* onEvent */                                                                              // 410
        self._report(test, event);                                                                 // 411
      }, function () {                                                                             // 412
        /* onComplete */                                                                           // 413
        var totalTime = (+new Date) - startTime;                                                   // 414
        self._report(test, {type: "finish", timeMs: totalTime});                                   // 415
        onComplete && onComplete();                                                                // 416
      }, function (exception) {                                                                    // 417
        /* onException */                                                                          // 418
                                                                                                   // 419
        // XXX you want the "name" and "message" fields on the                                     // 420
        // exception, to start with..                                                              // 421
        self._report(test, {                                                                       // 422
          type: "exception",                                                                       // 423
          details: {                                                                               // 424
            message: exception.message, // XXX empty???                                            // 425
            stack: exception.stack // XXX portability                                              // 426
          }                                                                                        // 427
        });                                                                                        // 428
                                                                                                   // 429
        onComplete && onComplete();                                                                // 430
      }, stop_at_offset);                                                                          // 431
    } else {                                                                                       // 432
      onComplete && onComplete();                                                                  // 433
    }                                                                                              // 434
  },                                                                                               // 435
                                                                                                   // 436
  run: function (onComplete) {                                                                     // 437
    var self = this;                                                                               // 438
    // create array of arrays of tests; synchronous tests in                                       // 439
    // different groups are run in parallel on client, async tests or                              // 440
    // tests in different groups are run in sequence, as are all                                   // 441
    // tests on server                                                                             // 442
    var testGroups = _.values(                                                                     // 443
      _.groupBy(self.manager.ordered_tests,                                                        // 444
                function(t) {                                                                      // 445
                  if (Meteor.isServer)                                                             // 446
                    return "SERVER";                                                               // 447
                  if (t.async)                                                                     // 448
                    return "ASYNC";                                                                // 449
                  return t.name.split(" - ")[0];                                                   // 450
                }));                                                                               // 451
                                                                                                   // 452
    if (! testGroups.length) {                                                                     // 453
      onComplete();                                                                                // 454
    } else {                                                                                       // 455
      var groupsDone = 0;                                                                          // 456
                                                                                                   // 457
      _.each(testGroups, function(tests) {                                                         // 458
        var runNext = function () {                                                                // 459
          if (tests.length) {                                                                      // 460
            self._runOne(tests.shift(), runNext);                                                  // 461
          } else {                                                                                 // 462
            groupsDone++;                                                                          // 463
            if (groupsDone >= testGroups.length)                                                   // 464
              onComplete();                                                                        // 465
          }                                                                                        // 466
        };                                                                                         // 467
                                                                                                   // 468
        runNext();                                                                                 // 469
      });                                                                                          // 470
    }                                                                                              // 471
  },                                                                                               // 472
                                                                                                   // 473
  // An alternative to run(). Given the 'cookie' attribute of a                                    // 474
  // failure record, try to rerun that particular test up to that                                  // 475
  // failure, and then open the debugger.                                                          // 476
  debug: function (cookie, onComplete) {                                                           // 477
    var self = this;                                                                               // 478
    var test = self.manager.tests[cookie.name];                                                    // 479
    if (!test)                                                                                     // 480
      throw new Error("No such test '" + cookie.name + "'");                                       // 481
    self._runOne(test, onComplete, cookie.offset);                                                 // 482
  },                                                                                               // 483
                                                                                                   // 484
  _report: function (test, event) {                                                                // 485
    var self = this;                                                                               // 486
    if (event)                                                                                     // 487
      var events = [_.extend({sequence: self.next_sequence_number++}, event)];                     // 488
    else                                                                                           // 489
      var events = [];                                                                             // 490
    self.onReport({                                                                                // 491
      groupPath: test.groupPath,                                                                   // 492
      test: test.shortName,                                                                        // 493
      events: events                                                                               // 494
    });                                                                                            // 495
  }                                                                                                // 496
});                                                                                                // 497
                                                                                                   // 498
/******************************************************************************/                   // 499
/* Public API                                                                 */                   // 500
/******************************************************************************/                   // 501
                                                                                                   // 502
Tinytest = {};                                                                                     // 503
                                                                                                   // 504
Tinytest.add = function (name, func) {                                                             // 505
  TestManager.addCase(new TestCase(name, func));                                                   // 506
};                                                                                                 // 507
                                                                                                   // 508
Tinytest.addAsync = function (name, func) {                                                        // 509
  TestManager.addCase(new TestCase(name, func, true));                                             // 510
};                                                                                                 // 511
                                                                                                   // 512
// Run every test, asynchronously. Runs the test in the current                                    // 513
// process only (if called on the server, runs the tests on the                                    // 514
// server, and likewise for the client.) Report results via                                        // 515
// onReport. Call onComplete when it's done.                                                       // 516
//                                                                                                 // 517
Tinytest._runTests = function (onReport, onComplete, pathPrefix) {                                 // 518
  var testRun = TestManager.createRun(onReport, pathPrefix);                                       // 519
  testRun.run(onComplete);                                                                         // 520
};                                                                                                 // 521
                                                                                                   // 522
// Run just one test case, and stop the debugger at a particular                                   // 523
// error, all as indicated by 'cookie', which will have come from a                                // 524
// failure event output by _runTests.                                                              // 525
//                                                                                                 // 526
Tinytest._debugTest = function (cookie, onReport, onComplete) {                                    // 527
  var testRun = TestManager.createRun(onReport);                                                   // 528
  testRun.debug(cookie, onComplete);                                                               // 529
};                                                                                                 // 530
                                                                                                   // 531
/////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/tinytest/model.js                                                                      //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
Meteor._ServerTestResultsSubscription = 'tinytest_results_subscription';                           // 1
Meteor._ServerTestResultsCollection = 'tinytest_results_collection';                               // 2
                                                                                                   // 3
/////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/tinytest/tinytest_client.js                                                            //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
// Like Tinytest._runTests, but runs the tests on both the client and                              // 1
// the server. Sets a 'server' flag on test results that came from the                             // 2
// server.                                                                                         // 3
//                                                                                                 // 4
Tinytest._runTestsEverywhere = function (onReport, onComplete, pathPrefix) {                       // 5
  var runId = Random.id();                                                                         // 6
  var localComplete = false;                                                                       // 7
  var remoteComplete = false;                                                                      // 8
  var done = false;                                                                                // 9
                                                                                                   // 10
  var maybeDone = function () {                                                                    // 11
    if (!done && localComplete && remoteComplete) {                                                // 12
      done = true;                                                                                 // 13
      onComplete && onComplete();                                                                  // 14
    }                                                                                              // 15
  };                                                                                               // 16
                                                                                                   // 17
  Tinytest._runTests(onReport, function () {                                                       // 18
    localComplete = true;                                                                          // 19
    maybeDone();                                                                                   // 20
  }, pathPrefix);                                                                                  // 21
                                                                                                   // 22
  Meteor.connection.registerStore(Meteor._ServerTestResultsCollection, {                           // 23
    update: function (msg) {                                                                       // 24
      // We only should call _runTestsEverywhere once per client-page-load, so                     // 25
      // we really only should see one runId here.                                                 // 26
      if (msg.id !== runId)                                                                        // 27
        return;                                                                                    // 28
      // This will only work for added & changed messages.                                         // 29
      // hope that is all you get.                                                                 // 30
      _.each(msg.fields, function (report) {                                                       // 31
        _.each(report.events, function (event) {                                                   // 32
          delete event.cookie; // can't debug a server test on the client..                        // 33
        });                                                                                        // 34
        report.server = true;                                                                      // 35
        onReport(report);                                                                          // 36
      });                                                                                          // 37
    }                                                                                              // 38
  });                                                                                              // 39
                                                                                                   // 40
  var handle = Meteor.subscribe(Meteor._ServerTestResultsSubscription, runId);                     // 41
                                                                                                   // 42
  Meteor.call('tinytest/run', runId, pathPrefix, function (error, result) {                        // 43
    if (error)                                                                                     // 44
      // XXX better report error                                                                   // 45
      throw new Error("Test server returned an error");                                            // 46
    remoteComplete = true;                                                                         // 47
    handle.stop();                                                                                 // 48
    Meteor.call('tinytest/clearResults', runId);                                                   // 49
    maybeDone();                                                                                   // 50
  });                                                                                              // 51
};                                                                                                 // 52
                                                                                                   // 53
/////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
