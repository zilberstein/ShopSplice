(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                              //
// packages/http/httpcall_tests.js                                                              //
//                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                //
// URL prefix for tests to talk to                                                              // 1
var _XHR_URL_PREFIX = "/http_test_responder";                                                   // 2
                                                                                                // 3
var url_base = function () {                                                                    // 4
  if (Meteor.isServer) {                                                                        // 5
    var address = WebApp.httpServer.address();                                                  // 6
    return "http://127.0.0.1:" + address.port;                                                  // 7
  } else {                                                                                      // 8
    return "";                                                                                  // 9
  }                                                                                             // 10
};                                                                                              // 11
                                                                                                // 12
var url_prefix = function () {                                                                  // 13
  if (Meteor.isServer && _XHR_URL_PREFIX.indexOf("http") !== 0) {                               // 14
    _XHR_URL_PREFIX = url_base() + _XHR_URL_PREFIX;                                             // 15
  }                                                                                             // 16
  return _XHR_URL_PREFIX;                                                                       // 17
};                                                                                              // 18
                                                                                                // 19
                                                                                                // 20
testAsyncMulti("httpcall - basic", [                                                            // 21
  function(test, expect) {                                                                      // 22
    var basic_get = function(url, options, expected_url) {                                      // 23
                                                                                                // 24
      var callback = function(error, result) {                                                  // 25
        test.isFalse(error);                                                                    // 26
        if (! error) {                                                                          // 27
          test.equal(typeof result, "object");                                                  // 28
          test.equal(result.statusCode, 200);                                                   // 29
                                                                                                // 30
          var data = result.data;                                                               // 31
                                                                                                // 32
          // allow dropping of final ? (which mobile browsers seem to do)                       // 33
          var allowed = [expected_url];                                                         // 34
          if (expected_url.slice(-1) === '?')                                                   // 35
            allowed.push(expected_url.slice(0, -1));                                            // 36
                                                                                                // 37
          test.include(allowed, expected_url);                                                  // 38
          test.equal(data.method, "GET");                                                       // 39
        }                                                                                       // 40
      };                                                                                        // 41
                                                                                                // 42
                                                                                                // 43
      HTTP.call("GET", url_prefix()+url, options, expect(callback));                            // 44
                                                                                                // 45
      if (Meteor.isServer) {                                                                    // 46
        // test sync version                                                                    // 47
        try {                                                                                   // 48
          var result = HTTP.call("GET", url_prefix()+url, options);                             // 49
          callback(undefined, result);                                                          // 50
        } catch (e) {                                                                           // 51
          callback(e, e.response);                                                              // 52
        }                                                                                       // 53
      }                                                                                         // 54
    };                                                                                          // 55
                                                                                                // 56
    basic_get("/foo", null, "/foo");                                                            // 57
    basic_get("/foo?", null, "/foo?");                                                          // 58
    basic_get("/foo?a=b", null, "/foo?a=b");                                                    // 59
    basic_get("/foo", {params: {fruit: "apple"}},                                               // 60
              "/foo?fruit=apple");                                                              // 61
    basic_get("/foo", {params: {fruit: "apple", dog: "Spot the dog"}},                          // 62
              "/foo?fruit=apple&dog=Spot+the+dog");                                             // 63
    basic_get("/foo?", {params: {fruit: "apple", dog: "Spot the dog"}},                         // 64
              "/foo?fruit=apple&dog=Spot+the+dog");                                             // 65
    basic_get("/foo?bar", {params: {fruit: "apple", dog: "Spot the dog"}},                      // 66
              "/foo?bar&fruit=apple&dog=Spot+the+dog");                                         // 67
    basic_get("/foo?bar", {params: {fruit: "apple", dog: "Spot the dog"},                       // 68
                           query: "baz"},                                                       // 69
              "/foo?baz&fruit=apple&dog=Spot+the+dog");                                         // 70
    basic_get("/foo", {params: {fruit: "apple", dog: "Spot the dog"},                           // 71
                       query: "baz"},                                                           // 72
              "/foo?baz&fruit=apple&dog=Spot+the+dog");                                         // 73
    basic_get("/foo?", {params: {fruit: "apple", dog: "Spot the dog"},                          // 74
                       query: "baz"},                                                           // 75
              "/foo?baz&fruit=apple&dog=Spot+the+dog");                                         // 76
    basic_get("/foo?bar", {query: ""}, "/foo?");                                                // 77
    basic_get("/foo?bar", {params: {fruit: "apple", dog: "Spot the dog"},                       // 78
                           query: ""},                                                          // 79
              "/foo?fruit=apple&dog=Spot+the+dog");                                             // 80
  }]);                                                                                          // 81
                                                                                                // 82
testAsyncMulti("httpcall - errors", [                                                           // 83
  function(test, expect) {                                                                      // 84
                                                                                                // 85
    // Accessing unknown server (should fail to make any connection)                            // 86
    var unknownServerCallback = function(error, result) {                                       // 87
      test.isTrue(error);                                                                       // 88
      test.isFalse(result);                                                                     // 89
      test.isFalse(error.response);                                                             // 90
    };                                                                                          // 91
    HTTP.call("GET", "http://asfd.asfd/", expect(unknownServerCallback));                       // 92
                                                                                                // 93
    if (Meteor.isServer) {                                                                      // 94
      // test sync version                                                                      // 95
      try {                                                                                     // 96
        var unknownServerResult = HTTP.call("GET", "http://asfd.asfd/");                        // 97
        unknownServerCallback(undefined, unknownServerResult);                                  // 98
      } catch (e) {                                                                             // 99
        unknownServerCallback(e, e.response);                                                   // 100
      }                                                                                         // 101
    }                                                                                           // 102
                                                                                                // 103
    // Server serves 500                                                                        // 104
    var error500Callback = function(error, result) {                                            // 105
      test.isTrue(error);                                                                       // 106
      test.isTrue(error.message.indexOf("500") !== -1); // message has statusCode               // 107
      test.isTrue(error.message.indexOf(                                                        // 108
        error.response.content.substring(0, 10)) !== -1); // message has part of content        // 109
                                                                                                // 110
      test.isTrue(result);                                                                      // 111
      test.isTrue(error.response);                                                              // 112
      test.equal(result, error.response);                                                       // 113
      test.equal(error.response.statusCode, 500);                                               // 114
                                                                                                // 115
      // in test_responder.js we make a very long response body, to make sure                   // 116
      // that we truncate messages. first of all, make sure we didn't make that                 // 117
      // message too short, so that we can be sure we're verifying that we truncate.            // 118
      test.isTrue(error.response.content.length > 180);                                         // 119
      test.isTrue(error.message.length < 180); // make sure we truncate.                        // 120
    };                                                                                          // 121
    HTTP.call("GET", url_prefix()+"/fail", expect(error500Callback));                           // 122
                                                                                                // 123
    if (Meteor.isServer) {                                                                      // 124
      // test sync version                                                                      // 125
      try {                                                                                     // 126
        var error500Result = HTTP.call("GET", url_prefix()+"/fail");                            // 127
        error500Callback(undefined, error500Result);                                            // 128
      } catch (e) {                                                                             // 129
        error500Callback(e, e.response);                                                        // 130
      }                                                                                         // 131
    }                                                                                           // 132
  }                                                                                             // 133
]);                                                                                             // 134
                                                                                                // 135
testAsyncMulti("httpcall - timeout", [                                                          // 136
  function(test, expect) {                                                                      // 137
                                                                                                // 138
    // Should time out                                                                          // 139
    var timeoutCallback = function(error, result) {                                             // 140
      test.isTrue(error);                                                                       // 141
      test.isFalse(result);                                                                     // 142
      test.isFalse(error.response);                                                             // 143
    };                                                                                          // 144
    var timeoutUrl = url_prefix()+"/slow-"+Random.id();                                         // 145
    HTTP.call(                                                                                  // 146
      "GET", timeoutUrl,                                                                        // 147
      { timeout: 500 },                                                                         // 148
      expect(timeoutCallback));                                                                 // 149
                                                                                                // 150
    if (Meteor.isServer) {                                                                      // 151
      // test sync version                                                                      // 152
      try {                                                                                     // 153
        var timeoutResult = HTTP.call("GET", timeoutUrl, { timeout: 500 });                     // 154
        timeoutCallback(undefined, timeoutResult);                                              // 155
      } catch (e) {                                                                             // 156
        timeoutCallback(e, e.response);                                                         // 157
      }                                                                                         // 158
    }                                                                                           // 159
                                                                                                // 160
    // Should not time out                                                                      // 161
    var noTimeoutCallback = function(error, result) {                                           // 162
      test.isFalse(error);                                                                      // 163
      test.isTrue(result);                                                                      // 164
      test.equal(result.statusCode, 200);                                                       // 165
      var data = result.data;                                                                   // 166
      test.equal(data.url.substring(0, 4), "/foo");                                             // 167
      test.equal(data.method, "GET");                                                           // 168
    };                                                                                          // 169
    var noTimeoutUrl = url_prefix()+"/foo-"+Random.id();                                        // 170
    HTTP.call(                                                                                  // 171
      "GET", noTimeoutUrl,                                                                      // 172
      { timeout: 2000 },                                                                        // 173
      expect(noTimeoutCallback));                                                               // 174
                                                                                                // 175
    if (Meteor.isServer) {                                                                      // 176
      // test sync version                                                                      // 177
      try {                                                                                     // 178
        var noTimeoutResult = HTTP.call("GET", noTimeoutUrl, { timeout: 2000 });                // 179
        noTimeoutCallback(undefined, noTimeoutResult);                                          // 180
      } catch (e) {                                                                             // 181
        noTimeoutCallback(e, e.response);                                                       // 182
      }                                                                                         // 183
    }                                                                                           // 184
  }                                                                                             // 185
]);                                                                                             // 186
                                                                                                // 187
testAsyncMulti("httpcall - redirect", [                                                         // 188
                                                                                                // 189
  function(test, expect) {                                                                      // 190
    // Test that we follow redirects by default                                                 // 191
    HTTP.call("GET", url_prefix()+"/redirect", expect(                                          // 192
      function(error, result) {                                                                 // 193
        test.isFalse(error);                                                                    // 194
        test.isTrue(result);                                                                    // 195
                                                                                                // 196
        // should be redirected transparently to /foo                                           // 197
        test.equal(result.statusCode, 200);                                                     // 198
        var data = result.data;                                                                 // 199
        test.equal(data.url, "/foo");                                                           // 200
        test.equal(data.method, "GET");                                                         // 201
      }));                                                                                      // 202
                                                                                                // 203
    // followRedirect option; can't be false on client                                          // 204
    _.each([false, true], function(followRedirects) {                                           // 205
      var do_it = function(should_work) {                                                       // 206
        var maybe_expect = should_work ? expect : _.identity;                                   // 207
        HTTP.call(                                                                              // 208
          "GET", url_prefix()+"/redirect",                                                      // 209
          {followRedirects: followRedirects},                                                   // 210
          maybe_expect(function(error, result) {                                                // 211
            test.isFalse(error);                                                                // 212
            test.isTrue(result);                                                                // 213
                                                                                                // 214
            if (followRedirects) {                                                              // 215
              // should be redirected transparently to /foo                                     // 216
              test.equal(result.statusCode, 200);                                               // 217
              var data = result.data;                                                           // 218
              test.equal(data.url, "/foo");                                                     // 219
              test.equal(data.method, "GET");                                                   // 220
            } else {                                                                            // 221
              // should see redirect                                                            // 222
              test.equal(result.statusCode, 301);                                               // 223
            }                                                                                   // 224
          }));                                                                                  // 225
      };                                                                                        // 226
      if (Meteor.isClient && ! followRedirects) {                                               // 227
        // not supported, should fail                                                           // 228
        test.throws(do_it);                                                                     // 229
      } else {                                                                                  // 230
        do_it(true);                                                                            // 231
      }                                                                                         // 232
    });                                                                                         // 233
  }                                                                                             // 234
                                                                                                // 235
]);                                                                                             // 236
                                                                                                // 237
testAsyncMulti("httpcall - methods", [                                                          // 238
                                                                                                // 239
  function(test, expect) {                                                                      // 240
    // non-get methods                                                                          // 241
    var test_method = function(meth, func_name) {                                               // 242
      func_name = func_name || meth.toLowerCase();                                              // 243
      HTTP[func_name](                                                                          // 244
        url_prefix()+"/foo",                                                                    // 245
        expect(function(error, result) {                                                        // 246
          test.isFalse(error);                                                                  // 247
          test.isTrue(result);                                                                  // 248
          test.equal(result.statusCode, 200);                                                   // 249
          var data = result.data;                                                               // 250
          test.equal(data.url, "/foo");                                                         // 251
                                                                                                // 252
          // IE <= 8 turns seems to turn POSTs with no body into                                // 253
          // GETs, inexplicably.                                                                // 254
          //                                                                                    // 255
          // XXX Except now it doesn't!? Not sure what changed, but                             // 256
          // these lines now break the test...                                                  // 257
          // if (Meteor.isClient && $.browser.msie && $.browser.version <= 8                    // 258
          //     && meth === "POST")                                                            // 259
          //   meth = "GET";                                                                    // 260
                                                                                                // 261
          test.equal(data.method, meth);                                                        // 262
        }));                                                                                    // 263
    };                                                                                          // 264
                                                                                                // 265
    test_method("GET");                                                                         // 266
    test_method("POST");                                                                        // 267
    test_method("PUT");                                                                         // 268
    test_method("DELETE", 'del');                                                               // 269
  },                                                                                            // 270
                                                                                                // 271
  function(test, expect) {                                                                      // 272
    // contents and data                                                                        // 273
    HTTP.call(                                                                                  // 274
      "POST", url_prefix()+"/foo",                                                              // 275
      { content: "Hello World!" },                                                              // 276
      expect(function(error, result) {                                                          // 277
        test.isFalse(error);                                                                    // 278
        test.isTrue(result);                                                                    // 279
        test.equal(result.statusCode, 200);                                                     // 280
        var data = result.data;                                                                 // 281
        test.equal(data.body, "Hello World!");                                                  // 282
      }));                                                                                      // 283
                                                                                                // 284
    HTTP.call(                                                                                  // 285
      "POST", url_prefix()+"/data-test",                                                        // 286
      { data: {greeting: "Hello World!"} },                                                     // 287
      expect(function(error, result) {                                                          // 288
        test.isFalse(error);                                                                    // 289
        test.isTrue(result);                                                                    // 290
        test.equal(result.statusCode, 200);                                                     // 291
        var data = result.data;                                                                 // 292
        test.equal(data.body, {greeting: "Hello World!"});                                      // 293
        // nb: some browsers include a charset here too.                                        // 294
        test.matches(data.headers['content-type'], /^application\/json\b/);                     // 295
      }));                                                                                      // 296
                                                                                                // 297
    HTTP.call(                                                                                  // 298
      "POST", url_prefix()+"/data-test-explicit",                                               // 299
      { data: {greeting: "Hello World!"},                                                       // 300
        headers: {'Content-Type': 'text/stupid'} },                                             // 301
      expect(function(error, result) {                                                          // 302
        test.isFalse(error);                                                                    // 303
        test.isTrue(result);                                                                    // 304
        test.equal(result.statusCode, 200);                                                     // 305
        var data = result.data;                                                                 // 306
        test.equal(data.body, {greeting: "Hello World!"});                                      // 307
        // nb: some browsers include a charset here too.                                        // 308
        test.matches(data.headers['content-type'], /^text\/stupid\b/);                          // 309
      }));                                                                                      // 310
  }                                                                                             // 311
]);                                                                                             // 312
                                                                                                // 313
testAsyncMulti("httpcall - http auth", [                                                        // 314
  function(test, expect) {                                                                      // 315
    // Test basic auth                                                                          // 316
                                                                                                // 317
    // Unfortunately, any failed auth will result in a browser                                  // 318
    // password prompt.  So we don't test auth failure, only                                    // 319
    // success.                                                                                 // 320
                                                                                                // 321
    // Random password breaks in Firefox, because Firefox incorrectly                           // 322
    // uses cached credentials even if we supply different ones:                                // 323
    // https://bugzilla.mozilla.org/show_bug.cgi?id=654348                                      // 324
    var password = 'rocks';                                                                     // 325
    //var password = Random.id().replace(/[^0-9a-zA-Z]/g, '');                                  // 326
    HTTP.call(                                                                                  // 327
      "GET", url_prefix()+"/login?"+password,                                                   // 328
      { auth: "meteor:"+password },                                                             // 329
      expect(function(error, result) {                                                          // 330
        // should succeed                                                                       // 331
        test.isFalse(error);                                                                    // 332
        test.isTrue(result);                                                                    // 333
        test.equal(result.statusCode, 200);                                                     // 334
        var data = result.data;                                                                 // 335
        test.equal(data.url, "/login?"+password);                                               // 336
      }));                                                                                      // 337
                                                                                                // 338
    // test fail on malformed username:password                                                 // 339
    test.throws(function() {                                                                    // 340
      HTTP.call(                                                                                // 341
        "GET", url_prefix()+"/login?"+password,                                                 // 342
        { auth: "fooooo" },                                                                     // 343
        function() { throw new Error("can't get here"); });                                     // 344
    });                                                                                         // 345
  }                                                                                             // 346
]);                                                                                             // 347
                                                                                                // 348
testAsyncMulti("httpcall - headers", [                                                          // 349
  function(test, expect) {                                                                      // 350
    HTTP.call(                                                                                  // 351
      "GET", url_prefix()+"/foo-with-headers",                                                  // 352
      {headers: { "Test-header": "Value",                                                       // 353
                  "another": "Value2" } },                                                      // 354
      expect(function(error, result) {                                                          // 355
        test.isFalse(error);                                                                    // 356
        test.isTrue(result);                                                                    // 357
                                                                                                // 358
        test.equal(result.statusCode, 200);                                                     // 359
        var data = result.data;                                                                 // 360
        test.equal(data.url, "/foo-with-headers");                                              // 361
        test.equal(data.method, "GET");                                                         // 362
        test.equal(data.headers['test-header'], "Value");                                       // 363
        test.equal(data.headers['another'], "Value2");                                          // 364
      }));                                                                                      // 365
                                                                                                // 366
    HTTP.call(                                                                                  // 367
      "GET", url_prefix()+"/headers",                                                           // 368
      expect(function(error, result) {                                                          // 369
        test.isFalse(error);                                                                    // 370
        test.isTrue(result);                                                                    // 371
                                                                                                // 372
        test.equal(result.statusCode, 201);                                                     // 373
        test.equal(result.headers['a-silly-header'], "Tis a");                                  // 374
        test.equal(result.headers['another-silly-header'], "Silly place.");                     // 375
      }));                                                                                      // 376
  }                                                                                             // 377
]);                                                                                             // 378
                                                                                                // 379
testAsyncMulti("httpcall - params", [                                                           // 380
  function(test, expect) {                                                                      // 381
    var do_test = function(method, url, params, opt_opts, expect_url, expect_body) {            // 382
      var opts = {};                                                                            // 383
      if (typeof opt_opts === "string") {                                                       // 384
        // opt_opts omitted                                                                     // 385
        expect_body = expect_url;                                                               // 386
        expect_url = opt_opts;                                                                  // 387
      } else {                                                                                  // 388
        opts = opt_opts;                                                                        // 389
      }                                                                                         // 390
      HTTP.call(                                                                                // 391
        method, url_prefix()+url,                                                               // 392
        _.extend({ params: params }, opts),                                                     // 393
        expect(function(error, result) {                                                        // 394
          test.isFalse(error);                                                                  // 395
          test.isTrue(result);                                                                  // 396
          test.equal(result.statusCode, 200);                                                   // 397
          if (method !== "HEAD") {                                                              // 398
            var data = result.data;                                                             // 399
            test.equal(data.method, method);                                                    // 400
            test.equal(data.url, expect_url);                                                   // 401
            test.equal(data.body, expect_body);                                                 // 402
          }                                                                                     // 403
      }));                                                                                      // 404
    };                                                                                          // 405
                                                                                                // 406
    do_test("GET", "/blah", {foo:"bar"}, "/blah?foo=bar", "");                                  // 407
    do_test("GET", "/", {foo:"bar", fruit:"apple"}, "/?foo=bar&fruit=apple", "");               // 408
    do_test("POST", "/", {foo:"bar", fruit:"apple"}, "/", "foo=bar&fruit=apple");               // 409
    do_test("POST", "/", {foo:"bar", fruit:"apple"}, "/", "foo=bar&fruit=apple");               // 410
    do_test("GET", "/", {'foo!':"bang!"}, {}, "/?foo%21=bang%21", "");                          // 411
    do_test("POST", "/", {'foo!':"bang!"}, {}, "/", "foo%21=bang%21");                          // 412
    do_test("POST", "/", {foo:"bar", fruit:"apple"}, {                                          // 413
      content: "stuff!"}, "/?foo=bar&fruit=apple", "stuff!");                                   // 414
    do_test("POST", "/", {foo:"bar", greeting:"Hello World"}, {                                 // 415
      content: "stuff!"}, "/?foo=bar&greeting=Hello+World", "stuff!");                          // 416
    do_test("POST", "/foo", {foo:"bar", greeting:"Hello World"},                                // 417
            "/foo", "foo=bar&greeting=Hello+World");                                            // 418
    do_test("HEAD", "/head", {foo:"bar"}, "/head?foo=bar", "");                                 // 419
    do_test("PUT", "/put", {foo:"bar"}, "/put", "foo=bar");                                     // 420
  }                                                                                             // 421
]);                                                                                             // 422
                                                                                                // 423
                                                                                                // 424
if (Meteor.isServer) {                                                                          // 425
  // This is testing the server's static file sending code, not the http                        // 426
  // package. It's here because it is very similar to the other tests                           // 427
  // here, even though it is testing something else.                                            // 428
  //                                                                                            // 429
  // client http library mangles paths before they are requested. only                          // 430
  // run this test on the server.                                                               // 431
  testAsyncMulti("httpcall - static file serving", [                                            // 432
    function(test, expect) {                                                                    // 433
      // Suppress error printing for this test (and for any other code that sets                // 434
      // the x-suppress-error header).                                                          // 435
      WebApp.suppressConnectErrors();                                                           // 436
                                                                                                // 437
      var do_test = function (path, code, match) {                                              // 438
        HTTP.get(                                                                               // 439
          url_base() + path,                                                                    // 440
          {headers: {'x-suppress-error': 'true'}},                                              // 441
          expect(function(error, result) {                                                      // 442
            test.equal(result.statusCode, code);                                                // 443
            if (match)                                                                          // 444
              test.matches(result.content, match);                                              // 445
          }));                                                                                  // 446
      };                                                                                        // 447
                                                                                                // 448
      // existing static file                                                                   // 449
      do_test("/packages/http/test_static.serveme", 200, /static file serving/);                // 450
                                                                                                // 451
      // no such file, so return the default app HTML.                                          // 452
      var getsAppHtml = [                                                                       // 453
        // This file doesn't exist.                                                             // 454
        "/nosuchfile",                                                                          // 455
                                                                                                // 456
        // Our static file serving doesn't process .. or its encoded version, so                // 457
        // any of these return the app HTML.                                                    // 458
        "/../nosuchfile",                                                                       // 459
        "/%2e%2e/nosuchfile",                                                                   // 460
        "/%2E%2E/nosuchfile",                                                                   // 461
        "/%2d%2d/nosuchfile",                                                                   // 462
        "/packages/http/../http/test_static.serveme",                                           // 463
        "/packages/http/%2e%2e/http/test_static.serveme",                                       // 464
        "/packages/http/%2E%2E/http/test_static.serveme",                                       // 465
        "/packages/http/../../packages/http/test_static.serveme",                               // 466
        "/packages/http/%2e%2e/%2e%2e/packages/http/test_static.serveme",                       // 467
        "/packages/http/%2E%2E/%2E%2E/packages/http/test_static.serveme",                       // 468
                                                                                                // 469
        // ... and they *definitely* shouldn't be able to escape the app bundle.                // 470
        "/packages/http/../../../../../../packages/http/test_static.serveme",                   // 471
        "/../../../../../../../../../../../bin/ls",                                             // 472
        "/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/bin/ls", // 473
        "/%2E%2E/%2E%2E/%2E%2E/%2E%2E/%2E%2E/%2E%2E/%2E%2E/%2E%2E/%2E%2E/%2E%2E/%2E%2E/bin/ls"  // 474
      ];                                                                                        // 475
                                                                                                // 476
      _.each(getsAppHtml, function (x) {                                                        // 477
        do_test(x, 200, /__meteor_runtime_config__ = {/);                                       // 478
      });                                                                                       // 479
    }                                                                                           // 480
  ]);                                                                                           // 481
}                                                                                               // 482
                                                                                                // 483
                                                                                                // 484
// TO TEST/ADD:                                                                                 // 485
// - https                                                                                      // 486
// - cookies?                                                                                   // 487
// - human-readable error reason/cause?                                                         // 488
// - data parse error                                                                           // 489
                                                                                                // 490
//////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
