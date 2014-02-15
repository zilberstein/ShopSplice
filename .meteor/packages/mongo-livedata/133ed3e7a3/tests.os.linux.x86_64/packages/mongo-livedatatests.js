(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo-livedata/mongo_livedata_tests.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// This is a magic collection that fails its writes on the server when                                                 // 1
// the selector (or inserted document) contains fail: true.                                                            // 2
                                                                                                                       // 3
var TRANSFORMS = {};                                                                                                   // 4
if (Meteor.isServer) {                                                                                                 // 5
  Meteor.methods({                                                                                                     // 6
    createInsecureCollection: function (name, options) {                                                               // 7
      check(name, String);                                                                                             // 8
      check(options, Match.Optional({                                                                                  // 9
        transformName: Match.Optional(String),                                                                         // 10
        idGeneration: Match.Optional(String)                                                                           // 11
      }));                                                                                                             // 12
                                                                                                                       // 13
      if (options && options.transformName) {                                                                          // 14
        options.transform = TRANSFORMS[options.transformName];                                                         // 15
      }                                                                                                                // 16
      var c = new Meteor.Collection(name, options);                                                                    // 17
      c._insecure = true;                                                                                              // 18
      Meteor.publish('c-' + name, function () {                                                                        // 19
        return c.find();                                                                                               // 20
      });                                                                                                              // 21
    }                                                                                                                  // 22
  });                                                                                                                  // 23
}                                                                                                                      // 24
                                                                                                                       // 25
var runInFence = function (f) {                                                                                        // 26
  if (Meteor.isClient) {                                                                                               // 27
    f();                                                                                                               // 28
  } else {                                                                                                             // 29
    var fence = new DDPServer._WriteFence;                                                                             // 30
    DDPServer._CurrentWriteFence.withValue(fence, f);                                                                  // 31
    fence.armAndWait();                                                                                                // 32
  }                                                                                                                    // 33
};                                                                                                                     // 34
                                                                                                                       // 35
// Helpers for upsert tests                                                                                            // 36
                                                                                                                       // 37
var stripId = function (obj) {                                                                                         // 38
  delete obj._id;                                                                                                      // 39
};                                                                                                                     // 40
                                                                                                                       // 41
var compareResults = function (test, skipIds, actual, expected) {                                                      // 42
  if (skipIds) {                                                                                                       // 43
    _.map(actual, stripId);                                                                                            // 44
    _.map(expected, stripId);                                                                                          // 45
  }                                                                                                                    // 46
  // (technically should ignore order in comparison)                                                                   // 47
  test.equal(actual, expected);                                                                                        // 48
};                                                                                                                     // 49
                                                                                                                       // 50
var upsert = function (coll, useUpdate, query, mod, options, callback) {                                               // 51
  if (! callback && typeof options === "function") {                                                                   // 52
    callback = options;                                                                                                // 53
    options = {};                                                                                                      // 54
  }                                                                                                                    // 55
                                                                                                                       // 56
  if (useUpdate) {                                                                                                     // 57
    if (callback)                                                                                                      // 58
      return coll.update(query, mod,                                                                                   // 59
                         _.extend({ upsert: true }, options),                                                          // 60
                         function (err, result) {                                                                      // 61
                           callback(err, ! err && {                                                                    // 62
                             numberAffected: result                                                                    // 63
                           });                                                                                         // 64
                         });                                                                                           // 65
    return {                                                                                                           // 66
      numberAffected: coll.update(query, mod,                                                                          // 67
                                  _.extend({ upsert: true }, options))                                                 // 68
    };                                                                                                                 // 69
  } else {                                                                                                             // 70
    return coll.upsert(query, mod, options, callback);                                                                 // 71
  }                                                                                                                    // 72
};                                                                                                                     // 73
                                                                                                                       // 74
var upsertTestMethod = "livedata_upsert_test_method";                                                                  // 75
var upsertTestMethodColl;                                                                                              // 76
                                                                                                                       // 77
// This is the implementation of the upsert test method on both the client and                                         // 78
// the server. On the client, we get a test object. On the server, we just throw                                       // 79
// errors if something doesn't go according to plan, and when the client                                               // 80
// receives those errors it will cause the test to fail.                                                               // 81
//                                                                                                                     // 82
// Client-side exceptions in here will NOT cause the test to fail! Because it's                                        // 83
// a stub, those exceptions will get caught and logged.                                                                // 84
var upsertTestMethodImpl = function (coll, useUpdate, test) {                                                          // 85
  coll.remove({});                                                                                                     // 86
  var result1 = upsert(coll, useUpdate, { foo: "bar" }, { foo: "bar" });                                               // 87
                                                                                                                       // 88
  if (! test) {                                                                                                        // 89
    test = {                                                                                                           // 90
      equal: function (a, b) {                                                                                         // 91
        if (! EJSON.equals(a, b))                                                                                      // 92
          throw new Error("Not equal: " +                                                                              // 93
                          JSON.stringify(a) + ", " + JSON.stringify(b));                                               // 94
      },                                                                                                               // 95
      isTrue: function (a) {                                                                                           // 96
        if (! a)                                                                                                       // 97
          throw new Error("Not truthy: " + JSON.stringify(a));                                                         // 98
      },                                                                                                               // 99
      isFalse: function (a) {                                                                                          // 100
        if (a)                                                                                                         // 101
          throw new Error("Not falsey: " + JSON.stringify(a));                                                         // 102
      }                                                                                                                // 103
    };                                                                                                                 // 104
  }                                                                                                                    // 105
                                                                                                                       // 106
  // if we don't test this, then testing result1.numberAffected will throw,                                            // 107
  // which will get caught and logged and the whole test will pass!                                                    // 108
  test.isTrue(result1);                                                                                                // 109
                                                                                                                       // 110
  test.equal(result1.numberAffected, 1);                                                                               // 111
  if (! useUpdate)                                                                                                     // 112
    test.isTrue(result1.insertedId);                                                                                   // 113
  var fooId = result1.insertedId;                                                                                      // 114
  var obj = coll.findOne({ foo: "bar" });                                                                              // 115
  test.isTrue(obj);                                                                                                    // 116
  if (! useUpdate)                                                                                                     // 117
    test.equal(obj._id, result1.insertedId);                                                                           // 118
  var result2 = upsert(coll, useUpdate, { _id: fooId },                                                                // 119
                       { $set: { foo: "baz " } });                                                                     // 120
  test.isTrue(result2);                                                                                                // 121
  test.equal(result2.numberAffected, 1);                                                                               // 122
  test.isFalse(result2.insertedId);                                                                                    // 123
};                                                                                                                     // 124
                                                                                                                       // 125
if (Meteor.isServer) {                                                                                                 // 126
  var m = {};                                                                                                          // 127
  m[upsertTestMethod] = function (run, useUpdate, options) {                                                           // 128
    check(run, String);                                                                                                // 129
    check(useUpdate, Boolean);                                                                                         // 130
    upsertTestMethodColl = new Meteor.Collection(upsertTestMethod + "_collection_" + run, options);                    // 131
    upsertTestMethodImpl(upsertTestMethodColl, useUpdate);                                                             // 132
  };                                                                                                                   // 133
  Meteor.methods(m);                                                                                                   // 134
}                                                                                                                      // 135
                                                                                                                       // 136
Meteor._FailureTestCollection =                                                                                        // 137
  new Meteor.Collection("___meteor_failure_test_collection");                                                          // 138
                                                                                                                       // 139
// For test "document with a custom type"                                                                              // 140
var Dog = function (name, color, actions) {                                                                            // 141
  var self = this;                                                                                                     // 142
  self.color = color;                                                                                                  // 143
  self.name = name;                                                                                                    // 144
  self.actions = actions || [{name: "wag"}, {name: "swim"}];                                                           // 145
};                                                                                                                     // 146
_.extend(Dog.prototype, {                                                                                              // 147
  getName: function () { return this.name;},                                                                           // 148
  getColor: function () { return this.name;},                                                                          // 149
  equals: function (other) { return other.name === this.name &&                                                        // 150
                             other.color === this.color &&                                                             // 151
                             EJSON.equals(other.actions, this.actions);},                                              // 152
  toJSONValue: function () { return {color: this.color, name: this.name, actions: this.actions};},                     // 153
  typeName: function () { return "dog"; },                                                                             // 154
  clone: function () { return new Dog(this.name, this.color); },                                                       // 155
  speak: function () { return "woof"; }                                                                                // 156
});                                                                                                                    // 157
EJSON.addType("dog", function (o) { return new Dog(o.name, o.color, o.actions);});                                     // 158
                                                                                                                       // 159
                                                                                                                       // 160
// Parameterize tests.                                                                                                 // 161
_.each( ['STRING', 'MONGO'], function(idGeneration) {                                                                  // 162
                                                                                                                       // 163
var collectionOptions = { idGeneration: idGeneration};                                                                 // 164
                                                                                                                       // 165
testAsyncMulti("mongo-livedata - database error reporting. " + idGeneration, [                                         // 166
  function (test, expect) {                                                                                            // 167
    var ftc = Meteor._FailureTestCollection;                                                                           // 168
                                                                                                                       // 169
    var exception = function (err, res) {                                                                              // 170
      test.instanceOf(err, Error);                                                                                     // 171
    };                                                                                                                 // 172
                                                                                                                       // 173
    _.each(["insert", "remove", "update"], function (op) {                                                             // 174
      var arg = (op === "insert" ? {} : 'bla');                                                                        // 175
      var arg2 = {};                                                                                                   // 176
                                                                                                                       // 177
      var callOp = function (callback) {                                                                               // 178
        if (op === "update") {                                                                                         // 179
          ftc[op](arg, arg2, callback);                                                                                // 180
        } else {                                                                                                       // 181
          ftc[op](arg, callback);                                                                                      // 182
        }                                                                                                              // 183
      };                                                                                                               // 184
                                                                                                                       // 185
      if (Meteor.isServer) {                                                                                           // 186
        test.throws(function () {                                                                                      // 187
          callOp();                                                                                                    // 188
        });                                                                                                            // 189
                                                                                                                       // 190
        callOp(expect(exception));                                                                                     // 191
      }                                                                                                                // 192
                                                                                                                       // 193
      if (Meteor.isClient) {                                                                                           // 194
        callOp(expect(exception));                                                                                     // 195
                                                                                                                       // 196
        // This would log to console in normal operation.                                                              // 197
        Meteor._suppress_log(1);                                                                                       // 198
        callOp();                                                                                                      // 199
      }                                                                                                                // 200
    });                                                                                                                // 201
  }                                                                                                                    // 202
]);                                                                                                                    // 203
                                                                                                                       // 204
                                                                                                                       // 205
Tinytest.addAsync("mongo-livedata - basics, " + idGeneration, function (test, onComplete) {                            // 206
  var run = test.runId();                                                                                              // 207
  var coll, coll2;                                                                                                     // 208
  if (Meteor.isClient) {                                                                                               // 209
    coll = new Meteor.Collection(null, collectionOptions) ; // local, unmanaged                                        // 210
    coll2 = new Meteor.Collection(null, collectionOptions); // local, unmanaged                                        // 211
  } else {                                                                                                             // 212
    coll = new Meteor.Collection("livedata_test_collection_"+run, collectionOptions);                                  // 213
    coll2 = new Meteor.Collection("livedata_test_collection_2_"+run, collectionOptions);                               // 214
  }                                                                                                                    // 215
                                                                                                                       // 216
  var log = '';                                                                                                        // 217
  var obs = coll.find({run: run}, {sort: ["x"]}).observe({                                                             // 218
    addedAt: function (doc, before_index, before) {                                                                    // 219
      log += 'a(' + doc.x + ',' + before_index + ',' + before + ')';                                                   // 220
    },                                                                                                                 // 221
    changedAt: function (new_doc, old_doc, at_index) {                                                                 // 222
      log += 'c(' + new_doc.x + ',' + at_index + ',' + old_doc.x + ')';                                                // 223
    },                                                                                                                 // 224
    movedTo: function (doc, old_index, new_index) {                                                                    // 225
      log += 'm(' + doc.x + ',' + old_index + ',' + new_index + ')';                                                   // 226
    },                                                                                                                 // 227
    removedAt: function (doc, at_index) {                                                                              // 228
      log += 'r(' + doc.x + ',' + at_index + ')';                                                                      // 229
    }                                                                                                                  // 230
  });                                                                                                                  // 231
                                                                                                                       // 232
  var captureObserve = function (f) {                                                                                  // 233
    if (Meteor.isClient) {                                                                                             // 234
      f();                                                                                                             // 235
    } else {                                                                                                           // 236
      var fence = new DDPServer._WriteFence;                                                                           // 237
      DDPServer._CurrentWriteFence.withValue(fence, f);                                                                // 238
      fence.armAndWait();                                                                                              // 239
    }                                                                                                                  // 240
                                                                                                                       // 241
    var ret = log;                                                                                                     // 242
    log = '';                                                                                                          // 243
    return ret;                                                                                                        // 244
  };                                                                                                                   // 245
                                                                                                                       // 246
  var expectObserve = function (expected, f) {                                                                         // 247
    if (!(expected instanceof Array))                                                                                  // 248
      expected = [expected];                                                                                           // 249
                                                                                                                       // 250
    test.include(expected, captureObserve(f));                                                                         // 251
  };                                                                                                                   // 252
                                                                                                                       // 253
  test.equal(coll.find({run: run}).count(), 0);                                                                        // 254
  test.equal(coll.findOne("abc"), undefined);                                                                          // 255
  test.equal(coll.findOne({run: run}), undefined);                                                                     // 256
                                                                                                                       // 257
  expectObserve('a(1,0,null)', function () {                                                                           // 258
    var id = coll.insert({run: run, x: 1});                                                                            // 259
    test.equal(coll.find({run: run}).count(), 1);                                                                      // 260
    test.equal(coll.findOne(id).x, 1);                                                                                 // 261
    test.equal(coll.findOne({run: run}).x, 1);                                                                         // 262
  });                                                                                                                  // 263
                                                                                                                       // 264
  expectObserve('a(4,1,null)', function () {                                                                           // 265
    var id2 = coll.insert({run: run, x: 4});                                                                           // 266
    test.equal(coll.find({run: run}).count(), 2);                                                                      // 267
    test.equal(coll.find({_id: id2}).count(), 1);                                                                      // 268
    test.equal(coll.findOne(id2).x, 4);                                                                                // 269
  });                                                                                                                  // 270
                                                                                                                       // 271
  test.equal(coll.findOne({run: run}, {sort: ["x"], skip: 0}).x, 1);                                                   // 272
  test.equal(coll.findOne({run: run}, {sort: ["x"], skip: 1}).x, 4);                                                   // 273
  test.equal(coll.findOne({run: run}, {sort: {x: -1}, skip: 0}).x, 4);                                                 // 274
  test.equal(coll.findOne({run: run}, {sort: {x: -1}, skip: 1}).x, 1);                                                 // 275
                                                                                                                       // 276
                                                                                                                       // 277
  var cur = coll.find({run: run}, {sort: ["x"]});                                                                      // 278
  var total = 0;                                                                                                       // 279
  var index = 0;                                                                                                       // 280
  var context = {};                                                                                                    // 281
  cur.forEach(function (doc, i, cursor) {                                                                              // 282
    test.equal(i, index++);                                                                                            // 283
    test.isTrue(cursor === cur);                                                                                       // 284
    test.isTrue(context === this);                                                                                     // 285
    total *= 10;                                                                                                       // 286
    if (Meteor.isServer) {                                                                                             // 287
      // Verify that the callbacks from forEach run sequentially and that                                              // 288
      // forEach waits for them to complete (issue# 321). If they do not run                                           // 289
      // sequentially, then the second callback could execute during the first                                         // 290
      // callback's sleep sleep and the *= 10 will occur before the += 1, then                                         // 291
      // total (at test.equal time) will be 5. If forEach does not wait for the                                        // 292
      // callbacks to complete, then total (at test.equal time) will be 0.                                             // 293
      Meteor._sleepForMs(5);                                                                                           // 294
    }                                                                                                                  // 295
    total += doc.x;                                                                                                    // 296
    // verify the meteor environment is set up here                                                                    // 297
    coll2.insert({total:total});                                                                                       // 298
  }, context);                                                                                                         // 299
  test.equal(total, 14);                                                                                               // 300
                                                                                                                       // 301
  cur.rewind();                                                                                                        // 302
  index = 0;                                                                                                           // 303
  test.equal(cur.map(function (doc, i, cursor) {                                                                       // 304
    // XXX we could theoretically make map run its iterations in parallel or                                           // 305
    // something which would make this fail                                                                            // 306
    test.equal(i, index++);                                                                                            // 307
    test.isTrue(cursor === cur);                                                                                       // 308
    test.isTrue(context === this);                                                                                     // 309
    return doc.x * 2;                                                                                                  // 310
  }, context), [2, 8]);                                                                                                // 311
                                                                                                                       // 312
  test.equal(_.pluck(coll.find({run: run}, {sort: {x: -1}}).fetch(), "x"),                                             // 313
             [4, 1]);                                                                                                  // 314
                                                                                                                       // 315
  expectObserve('', function () {                                                                                      // 316
    var count = coll.update({run: run, x: -1}, {$inc: {x: 2}}, {multi: true});                                         // 317
    test.equal(count, 0);                                                                                              // 318
  });                                                                                                                  // 319
                                                                                                                       // 320
  expectObserve('c(3,0,1)c(6,1,4)', function () {                                                                      // 321
    var count = coll.update({run: run}, {$inc: {x: 2}}, {multi: true});                                                // 322
    test.equal(count, 2);                                                                                              // 323
    test.equal(_.pluck(coll.find({run: run}, {sort: {x: -1}}).fetch(), "x"),                                           // 324
               [6, 3]);                                                                                                // 325
  });                                                                                                                  // 326
                                                                                                                       // 327
  expectObserve(['c(13,0,3)m(13,0,1)', 'm(6,1,0)c(13,1,3)',                                                            // 328
                 'c(13,0,3)m(6,1,0)', 'm(3,0,1)c(13,1,3)'], function () {                                              // 329
    coll.update({run: run, x: 3}, {$inc: {x: 10}}, {multi: true});                                                     // 330
    test.equal(_.pluck(coll.find({run: run}, {sort: {x: -1}}).fetch(), "x"),                                           // 331
               [13, 6]);                                                                                               // 332
  });                                                                                                                  // 333
                                                                                                                       // 334
  expectObserve('r(13,1)', function () {                                                                               // 335
    var count = coll.remove({run: run, x: {$gt: 10}});                                                                 // 336
    test.equal(count, 1);                                                                                              // 337
    test.equal(coll.find({run: run}).count(), 1);                                                                      // 338
  });                                                                                                                  // 339
                                                                                                                       // 340
  expectObserve('r(6,0)', function () {                                                                                // 341
    coll.remove({run: run});                                                                                           // 342
    test.equal(coll.find({run: run}).count(), 0);                                                                      // 343
  });                                                                                                                  // 344
                                                                                                                       // 345
  expectObserve('', function () {                                                                                      // 346
    var count = coll.remove({run: run});                                                                               // 347
    test.equal(count, 0);                                                                                              // 348
    test.equal(coll.find({run: run}).count(), 0);                                                                      // 349
  });                                                                                                                  // 350
                                                                                                                       // 351
  obs.stop();                                                                                                          // 352
  onComplete();                                                                                                        // 353
});                                                                                                                    // 354
                                                                                                                       // 355
Tinytest.addAsync("mongo-livedata - fuzz test, " + idGeneration, function(test, onComplete) {                          // 356
                                                                                                                       // 357
  var run = Random.id();                                                                                               // 358
  var coll;                                                                                                            // 359
  if (Meteor.isClient) {                                                                                               // 360
    coll = new Meteor.Collection(null, collectionOptions); // local, unmanaged                                         // 361
  } else {                                                                                                             // 362
    coll = new Meteor.Collection("livedata_test_collection_"+run, collectionOptions);                                  // 363
  }                                                                                                                    // 364
                                                                                                                       // 365
  // fuzz test of observe(), especially the server-side diffing                                                        // 366
  var actual = [];                                                                                                     // 367
  var correct = [];                                                                                                    // 368
  var counters = {add: 0, change: 0, move: 0, remove: 0};                                                              // 369
                                                                                                                       // 370
  var obs = coll.find({run: run}, {sort: ["x"]}).observe({                                                             // 371
    addedAt: function (doc, before_index) {                                                                            // 372
      counters.add++;                                                                                                  // 373
      actual.splice(before_index, 0, doc.x);                                                                           // 374
    },                                                                                                                 // 375
    changedAt: function (new_doc, old_doc, at_index) {                                                                 // 376
      counters.change++;                                                                                               // 377
      test.equal(actual[at_index], old_doc.x);                                                                         // 378
      actual[at_index] = new_doc.x;                                                                                    // 379
    },                                                                                                                 // 380
    movedTo: function (doc, old_index, new_index) {                                                                    // 381
      counters.move++;                                                                                                 // 382
      test.equal(actual[old_index], doc.x);                                                                            // 383
      actual.splice(old_index, 1);                                                                                     // 384
      actual.splice(new_index, 0, doc.x);                                                                              // 385
    },                                                                                                                 // 386
    removedAt: function (doc, at_index) {                                                                              // 387
      counters.remove++;                                                                                               // 388
      test.equal(actual[at_index], doc.x);                                                                             // 389
      actual.splice(at_index, 1);                                                                                      // 390
    }                                                                                                                  // 391
  });                                                                                                                  // 392
                                                                                                                       // 393
  // XXX What if there are multiple observe handles on the ObserveMultiplexer?                                         // 394
  //     There shouldn't be because the collection has a name unique to this                                           // 395
  //     run.                                                                                                          // 396
  if (Meteor.isServer) {                                                                                               // 397
    // For now, has to be polling (not oplog).                                                                         // 398
    test.isTrue(obs._observeDriver);                                                                                   // 399
    test.isTrue(obs._observeDriver._suspendPolling);                                                                   // 400
  }                                                                                                                    // 401
                                                                                                                       // 402
  var step = 0;                                                                                                        // 403
                                                                                                                       // 404
  // Use non-deterministic randomness so we can have a shorter fuzz                                                    // 405
  // test (fewer iterations).  For deterministic (fully seeded)                                                        // 406
  // randomness, remove the call to Random.fraction().                                                                 // 407
  var seededRandom = new SeededRandom("foobard" + Random.fraction());                                                  // 408
  // Random integer in [0,n)                                                                                           // 409
  var rnd = function (n) {                                                                                             // 410
    return seededRandom.nextIntBetween(0, n-1);                                                                        // 411
  };                                                                                                                   // 412
                                                                                                                       // 413
  var finishObserve = function (f) {                                                                                   // 414
    if (Meteor.isClient) {                                                                                             // 415
      f();                                                                                                             // 416
    } else {                                                                                                           // 417
      var fence = new DDPServer._WriteFence;                                                                           // 418
      DDPServer._CurrentWriteFence.withValue(fence, f);                                                                // 419
      fence.armAndWait();                                                                                              // 420
    }                                                                                                                  // 421
  };                                                                                                                   // 422
                                                                                                                       // 423
  var doStep = function () {                                                                                           // 424
    if (step++ === 5) { // run N random tests                                                                          // 425
      obs.stop();                                                                                                      // 426
      onComplete();                                                                                                    // 427
      return;                                                                                                          // 428
    }                                                                                                                  // 429
                                                                                                                       // 430
    var max_counters = _.clone(counters);                                                                              // 431
                                                                                                                       // 432
    finishObserve(function () {                                                                                        // 433
      if (Meteor.isServer)                                                                                             // 434
        obs._observeDriver._suspendPolling();                                                                          // 435
                                                                                                                       // 436
      // Do a batch of 1-10 operations                                                                                 // 437
      var batch_count = rnd(10) + 1;                                                                                   // 438
      for (var i = 0; i < batch_count; i++) {                                                                          // 439
        // 25% add, 25% remove, 25% change in place, 25% change and move                                               // 440
        var op = rnd(4);                                                                                               // 441
        var which = rnd(correct.length);                                                                               // 442
        if (op === 0 || step < 2 || !correct.length) {                                                                 // 443
          // Add                                                                                                       // 444
          var x = rnd(1000000);                                                                                        // 445
          coll.insert({run: run, x: x});                                                                               // 446
          correct.push(x);                                                                                             // 447
          max_counters.add++;                                                                                          // 448
        } else if (op === 1 || op === 2) {                                                                             // 449
          var x = correct[which];                                                                                      // 450
          if (op === 1)                                                                                                // 451
            // Small change, not likely to cause a move                                                                // 452
            var val = x + (rnd(2) ? -1 : 1);                                                                           // 453
          else                                                                                                         // 454
            // Large change, likely to cause a move                                                                    // 455
            var val = rnd(1000000);                                                                                    // 456
          coll.update({run: run, x: x}, {$set: {x: val}});                                                             // 457
          correct[which] = val;                                                                                        // 458
          max_counters.change++;                                                                                       // 459
          max_counters.move++;                                                                                         // 460
        } else {                                                                                                       // 461
          coll.remove({run: run, x: correct[which]});                                                                  // 462
          correct.splice(which, 1);                                                                                    // 463
          max_counters.remove++;                                                                                       // 464
        }                                                                                                              // 465
      }                                                                                                                // 466
      if (Meteor.isServer)                                                                                             // 467
        obs._observeDriver._resumePolling();                                                                           // 468
                                                                                                                       // 469
    });                                                                                                                // 470
                                                                                                                       // 471
    // Did we actually deliver messages that mutated the array in the                                                  // 472
    // right way?                                                                                                      // 473
    correct.sort(function (a,b) {return a-b;});                                                                        // 474
    test.equal(actual, correct);                                                                                       // 475
                                                                                                                       // 476
    // Did we limit ourselves to one 'moved' message per change,                                                       // 477
    // rather than O(results) moved messages?                                                                          // 478
    _.each(max_counters, function (v, k) {                                                                             // 479
      test.isTrue(max_counters[k] >= counters[k], k);                                                                  // 480
    });                                                                                                                // 481
                                                                                                                       // 482
    Meteor.defer(doStep);                                                                                              // 483
  };                                                                                                                   // 484
                                                                                                                       // 485
  doStep();                                                                                                            // 486
                                                                                                                       // 487
});                                                                                                                    // 488
                                                                                                                       // 489
Tinytest.addAsync("mongo-livedata - scribbling, " + idGeneration, function (test, onComplete) {                        // 490
  var run = test.runId();                                                                                              // 491
  var coll;                                                                                                            // 492
  if (Meteor.isClient) {                                                                                               // 493
    coll = new Meteor.Collection(null, collectionOptions); // local, unmanaged                                         // 494
  } else {                                                                                                             // 495
    coll = new Meteor.Collection("livedata_test_collection_"+run, collectionOptions);                                  // 496
  }                                                                                                                    // 497
                                                                                                                       // 498
  var numAddeds = 0;                                                                                                   // 499
  var handle = coll.find({run: run}).observe({                                                                         // 500
    addedAt: function (o) {                                                                                            // 501
      // test that we can scribble on the object we get back from Mongo without                                        // 502
      // breaking anything.  The worst possible scribble is messing with _id.                                          // 503
      delete o._id;                                                                                                    // 504
      numAddeds++;                                                                                                     // 505
    }                                                                                                                  // 506
  });                                                                                                                  // 507
  _.each([123, 456, 789], function (abc) {                                                                             // 508
    runInFence(function () {                                                                                           // 509
      coll.insert({run: run, abc: abc});                                                                               // 510
    });                                                                                                                // 511
  });                                                                                                                  // 512
  handle.stop();                                                                                                       // 513
  // will be 6 (1+2+3) if we broke diffing!                                                                            // 514
  test.equal(numAddeds, 3);                                                                                            // 515
                                                                                                                       // 516
  onComplete();                                                                                                        // 517
});                                                                                                                    // 518
                                                                                                                       // 519
Tinytest.addAsync("mongo-livedata - stop handle in callback, " + idGeneration, function (test, onComplete) {           // 520
  var run = Random.id();                                                                                               // 521
  var coll;                                                                                                            // 522
  if (Meteor.isClient) {                                                                                               // 523
    coll = new Meteor.Collection(null, collectionOptions); // local, unmanaged                                         // 524
  } else {                                                                                                             // 525
    coll = new Meteor.Collection("stopHandleInCallback-"+run, collectionOptions);                                      // 526
  }                                                                                                                    // 527
                                                                                                                       // 528
  var output = [];                                                                                                     // 529
                                                                                                                       // 530
  var handle = coll.find().observe({                                                                                   // 531
    added: function (doc) {                                                                                            // 532
      output.push({added: doc._id});                                                                                   // 533
    },                                                                                                                 // 534
    changed: function (newDoc) {                                                                                       // 535
      output.push('changed');                                                                                          // 536
      handle.stop();                                                                                                   // 537
    }                                                                                                                  // 538
  });                                                                                                                  // 539
                                                                                                                       // 540
  test.equal(output, []);                                                                                              // 541
                                                                                                                       // 542
  // Insert a document. Observe that the added callback is called.                                                     // 543
  var docId;                                                                                                           // 544
  runInFence(function () {                                                                                             // 545
    docId = coll.insert({foo: 42});                                                                                    // 546
  });                                                                                                                  // 547
  test.length(output, 1);                                                                                              // 548
  test.equal(output.shift(), {added: docId});                                                                          // 549
                                                                                                                       // 550
  // Update it. Observe that the changed callback is called. This should also                                          // 551
  // stop the observation.                                                                                             // 552
  runInFence(function() {                                                                                              // 553
    coll.update(docId, {$set: {bar: 10}});                                                                             // 554
  });                                                                                                                  // 555
  test.length(output, 1);                                                                                              // 556
  test.equal(output.shift(), 'changed');                                                                               // 557
                                                                                                                       // 558
  // Update again. This shouldn't call the callback because we stopped the                                             // 559
  // observation.                                                                                                      // 560
  runInFence(function() {                                                                                              // 561
    coll.update(docId, {$set: {baz: 40}});                                                                             // 562
  });                                                                                                                  // 563
  test.length(output, 0);                                                                                              // 564
                                                                                                                       // 565
  test.equal(coll.find().count(), 1);                                                                                  // 566
  test.equal(coll.findOne(docId),                                                                                      // 567
             {_id: docId, foo: 42, bar: 10, baz: 40});                                                                 // 568
                                                                                                                       // 569
  onComplete();                                                                                                        // 570
});                                                                                                                    // 571
                                                                                                                       // 572
// This behavior isn't great, but it beats deadlock.                                                                   // 573
if (Meteor.isServer) {                                                                                                 // 574
  Tinytest.addAsync("mongo-livedata - recursive observe throws, " + idGeneration, function (test, onComplete) {        // 575
    var run = test.runId();                                                                                            // 576
    var coll = new Meteor.Collection("observeInCallback-"+run, collectionOptions);                                     // 577
                                                                                                                       // 578
    var callbackCalled = false;                                                                                        // 579
    var handle = coll.find({}).observe({                                                                               // 580
      added: function (newDoc) {                                                                                       // 581
        callbackCalled = true;                                                                                         // 582
        test.throws(function () {                                                                                      // 583
          coll.find({}).observe();                                                                                     // 584
        });                                                                                                            // 585
      }                                                                                                                // 586
    });                                                                                                                // 587
    test.isFalse(callbackCalled);                                                                                      // 588
    // Insert a document. Observe that the added callback is called.                                                   // 589
    runInFence(function () {                                                                                           // 590
      coll.insert({foo: 42});                                                                                          // 591
    });                                                                                                                // 592
    test.isTrue(callbackCalled);                                                                                       // 593
                                                                                                                       // 594
    handle.stop();                                                                                                     // 595
                                                                                                                       // 596
    onComplete();                                                                                                      // 597
  });                                                                                                                  // 598
                                                                                                                       // 599
  Tinytest.addAsync("mongo-livedata - cursor dedup, " + idGeneration, function (test, onComplete) {                    // 600
    var run = test.runId();                                                                                            // 601
    var coll = new Meteor.Collection("cursorDedup-"+run, collectionOptions);                                           // 602
                                                                                                                       // 603
    var observer = function (noAdded) {                                                                                // 604
      var output = [];                                                                                                 // 605
      var callbacks = {                                                                                                // 606
        changed: function (newDoc) {                                                                                   // 607
          output.push({changed: newDoc._id});                                                                          // 608
        }                                                                                                              // 609
      };                                                                                                               // 610
      if (!noAdded) {                                                                                                  // 611
        callbacks.added = function (doc) {                                                                             // 612
          output.push({added: doc._id});                                                                               // 613
        };                                                                                                             // 614
      }                                                                                                                // 615
      var handle = coll.find({foo: 22}).observe(callbacks);                                                            // 616
      return {output: output, handle: handle};                                                                         // 617
    };                                                                                                                 // 618
                                                                                                                       // 619
    // Insert a doc and start observing.                                                                               // 620
    var docId1 = coll.insert({foo: 22});                                                                               // 621
    var o1 = observer();                                                                                               // 622
    // Initial add.                                                                                                    // 623
    test.length(o1.output, 1);                                                                                         // 624
    test.equal(o1.output.shift(), {added: docId1});                                                                    // 625
                                                                                                                       // 626
    // Insert another doc (blocking until observes have fired).                                                        // 627
    var docId2;                                                                                                        // 628
    runInFence(function () {                                                                                           // 629
      docId2 = coll.insert({foo: 22, bar: 5});                                                                         // 630
    });                                                                                                                // 631
    // Observed add.                                                                                                   // 632
    test.length(o1.output, 1);                                                                                         // 633
    test.equal(o1.output.shift(), {added: docId2});                                                                    // 634
                                                                                                                       // 635
    // Second identical observe.                                                                                       // 636
    var o2 = observer();                                                                                               // 637
    // Initial adds.                                                                                                   // 638
    test.length(o2.output, 2);                                                                                         // 639
    test.include([docId1, docId2], o2.output[0].added);                                                                // 640
    test.include([docId1, docId2], o2.output[1].added);                                                                // 641
    test.notEqual(o2.output[0].added, o2.output[1].added);                                                             // 642
    o2.output.length = 0;                                                                                              // 643
    // Original observe not affected.                                                                                  // 644
    test.length(o1.output, 0);                                                                                         // 645
                                                                                                                       // 646
    // White-box test: both observes should share an ObserveMultiplexer.                                               // 647
    var observeMultiplexer = o1.handle._multiplexer;                                                                   // 648
    test.isTrue(observeMultiplexer);                                                                                   // 649
    test.isTrue(observeMultiplexer === o2.handle._multiplexer);                                                        // 650
                                                                                                                       // 651
    // Update. Both observes fire.                                                                                     // 652
    runInFence(function () {                                                                                           // 653
      coll.update(docId1, {$set: {x: 'y'}});                                                                           // 654
    });                                                                                                                // 655
    test.length(o1.output, 1);                                                                                         // 656
    test.length(o2.output, 1);                                                                                         // 657
    test.equal(o1.output.shift(), {changed: docId1});                                                                  // 658
    test.equal(o2.output.shift(), {changed: docId1});                                                                  // 659
                                                                                                                       // 660
    // Stop first handle. Second handle still around.                                                                  // 661
    o1.handle.stop();                                                                                                  // 662
    test.length(o1.output, 0);                                                                                         // 663
    test.length(o2.output, 0);                                                                                         // 664
                                                                                                                       // 665
    // Another update. Just the second handle should fire.                                                             // 666
    runInFence(function () {                                                                                           // 667
      coll.update(docId2, {$set: {z: 'y'}});                                                                           // 668
    });                                                                                                                // 669
    test.length(o1.output, 0);                                                                                         // 670
    test.length(o2.output, 1);                                                                                         // 671
    test.equal(o2.output.shift(), {changed: docId2});                                                                  // 672
                                                                                                                       // 673
    // Stop second handle. Nothing should happen, but the multiplexer should                                           // 674
    // be stopped.                                                                                                     // 675
    test.isTrue(observeMultiplexer._handles);  // This will change.                                                    // 676
    o2.handle.stop();                                                                                                  // 677
    test.length(o1.output, 0);                                                                                         // 678
    test.length(o2.output, 0);                                                                                         // 679
    // White-box: ObserveMultiplexer has nulled its _handles so you can't                                              // 680
    // accidentally join to it.                                                                                        // 681
    test.isNull(observeMultiplexer._handles);                                                                          // 682
                                                                                                                       // 683
    // Start yet another handle on the same query.                                                                     // 684
    var o3 = observer();                                                                                               // 685
    // Initial adds.                                                                                                   // 686
    test.length(o3.output, 2);                                                                                         // 687
    test.include([docId1, docId2], o3.output[0].added);                                                                // 688
    test.include([docId1, docId2], o3.output[1].added);                                                                // 689
    test.notEqual(o3.output[0].added, o3.output[1].added);                                                             // 690
    // Old observers not called.                                                                                       // 691
    test.length(o1.output, 0);                                                                                         // 692
    test.length(o2.output, 0);                                                                                         // 693
    // White-box: Different ObserveMultiplexer.                                                                        // 694
    test.isTrue(observeMultiplexer !== o3.handle._multiplexer);                                                        // 695
                                                                                                                       // 696
    // Start another handle with no added callback. Regression test for #589.                                          // 697
    var o4 = observer(true);                                                                                           // 698
                                                                                                                       // 699
    o3.handle.stop();                                                                                                  // 700
    o4.handle.stop();                                                                                                  // 701
                                                                                                                       // 702
    onComplete();                                                                                                      // 703
  });                                                                                                                  // 704
                                                                                                                       // 705
  Tinytest.addAsync("mongo-livedata - async server-side insert, " + idGeneration, function (test, onComplete) {        // 706
    // Tests that insert returns before the callback runs. Relies on the fact                                          // 707
    // that mongo does not run the callback before spinning off the event loop.                                        // 708
    var cname = Random.id();                                                                                           // 709
    var coll = new Meteor.Collection(cname);                                                                           // 710
    var doc = { foo: "bar" };                                                                                          // 711
    var x = 0;                                                                                                         // 712
    coll.insert(doc, function (err, result) {                                                                          // 713
      test.equal(err, null);                                                                                           // 714
      test.equal(x, 1);                                                                                                // 715
      onComplete();                                                                                                    // 716
    });                                                                                                                // 717
    x++;                                                                                                               // 718
  });                                                                                                                  // 719
                                                                                                                       // 720
  Tinytest.addAsync("mongo-livedata - async server-side update, " + idGeneration, function (test, onComplete) {        // 721
    // Tests that update returns before the callback runs.                                                             // 722
    var cname = Random.id();                                                                                           // 723
    var coll = new Meteor.Collection(cname);                                                                           // 724
    var doc = { foo: "bar" };                                                                                          // 725
    var x = 0;                                                                                                         // 726
    var id = coll.insert(doc);                                                                                         // 727
    coll.update(id, { $set: { foo: "baz" } }, function (err, result) {                                                 // 728
      test.equal(err, null);                                                                                           // 729
      test.equal(result, 1);                                                                                           // 730
      test.equal(x, 1);                                                                                                // 731
      onComplete();                                                                                                    // 732
    });                                                                                                                // 733
    x++;                                                                                                               // 734
  });                                                                                                                  // 735
                                                                                                                       // 736
  Tinytest.addAsync("mongo-livedata - async server-side remove, " + idGeneration, function (test, onComplete) {        // 737
    // Tests that remove returns before the callback runs.                                                             // 738
    var cname = Random.id();                                                                                           // 739
    var coll = new Meteor.Collection(cname);                                                                           // 740
    var doc = { foo: "bar" };                                                                                          // 741
    var x = 0;                                                                                                         // 742
    var id = coll.insert(doc);                                                                                         // 743
    coll.remove(id, function (err, result) {                                                                           // 744
      test.equal(err, null);                                                                                           // 745
      test.isFalse(coll.findOne(id));                                                                                  // 746
      test.equal(x, 1);                                                                                                // 747
      onComplete();                                                                                                    // 748
    });                                                                                                                // 749
    x++;                                                                                                               // 750
  });                                                                                                                  // 751
}                                                                                                                      // 752
                                                                                                                       // 753
                                                                                                                       // 754
testAsyncMulti('mongo-livedata - empty documents, ' + idGeneration, [                                                  // 755
  function (test, expect) {                                                                                            // 756
    var collectionName = Random.id();                                                                                  // 757
    if (Meteor.isClient) {                                                                                             // 758
      Meteor.call('createInsecureCollection', collectionName);                                                         // 759
      Meteor.subscribe('c-' + collectionName);                                                                         // 760
    }                                                                                                                  // 761
                                                                                                                       // 762
    var coll = new Meteor.Collection(collectionName, collectionOptions);                                               // 763
    var docId;                                                                                                         // 764
                                                                                                                       // 765
    coll.insert({}, expect(function (err, id) {                                                                        // 766
      test.isFalse(err);                                                                                               // 767
      test.isTrue(id);                                                                                                 // 768
      docId = id;                                                                                                      // 769
      var cursor = coll.find();                                                                                        // 770
      test.equal(cursor.count(), 1);                                                                                   // 771
    }));                                                                                                               // 772
  }                                                                                                                    // 773
]);                                                                                                                    // 774
                                                                                                                       // 775
testAsyncMulti('mongo-livedata - document with a date, ' + idGeneration, [                                             // 776
  function (test, expect) {                                                                                            // 777
    var collectionName = Random.id();                                                                                  // 778
    if (Meteor.isClient) {                                                                                             // 779
      Meteor.call('createInsecureCollection', collectionName, collectionOptions);                                      // 780
      Meteor.subscribe('c-' + collectionName);                                                                         // 781
    }                                                                                                                  // 782
                                                                                                                       // 783
    var coll = new Meteor.Collection(collectionName, collectionOptions);                                               // 784
    var docId;                                                                                                         // 785
    coll.insert({d: new Date(1356152390004)}, expect(function (err, id) {                                              // 786
      test.isFalse(err);                                                                                               // 787
      test.isTrue(id);                                                                                                 // 788
      docId = id;                                                                                                      // 789
      var cursor = coll.find();                                                                                        // 790
      test.equal(cursor.count(), 1);                                                                                   // 791
      test.equal(coll.findOne().d.getFullYear(), 2012);                                                                // 792
    }));                                                                                                               // 793
  }                                                                                                                    // 794
]);                                                                                                                    // 795
                                                                                                                       // 796
testAsyncMulti('mongo-livedata - document goes through a transform, ' + idGeneration, [                                // 797
  function (test, expect) {                                                                                            // 798
    var self = this;                                                                                                   // 799
    var seconds = function (doc) {                                                                                     // 800
      doc.seconds = function () {return doc.d.getSeconds();};                                                          // 801
      return doc;                                                                                                      // 802
    };                                                                                                                 // 803
    TRANSFORMS["seconds"] = seconds;                                                                                   // 804
    var collectionOptions = {                                                                                          // 805
      idGeneration: idGeneration,                                                                                      // 806
      transform: seconds,                                                                                              // 807
      transformName: "seconds"                                                                                         // 808
    };                                                                                                                 // 809
    var collectionName = Random.id();                                                                                  // 810
    if (Meteor.isClient) {                                                                                             // 811
      Meteor.call('createInsecureCollection', collectionName, collectionOptions);                                      // 812
      Meteor.subscribe('c-' + collectionName);                                                                         // 813
    }                                                                                                                  // 814
                                                                                                                       // 815
    self.coll = new Meteor.Collection(collectionName, collectionOptions);                                              // 816
    var obs;                                                                                                           // 817
    var expectAdd = expect(function (doc) {                                                                            // 818
      test.equal(doc.seconds(), 50);                                                                                   // 819
    });                                                                                                                // 820
    var expectRemove = expect (function (doc) {                                                                        // 821
      test.equal(doc.seconds(), 50);                                                                                   // 822
      obs.stop();                                                                                                      // 823
    });                                                                                                                // 824
    self.coll.insert({d: new Date(1356152390004)}, expect(function (err, id) {                                         // 825
      test.isFalse(err);                                                                                               // 826
      test.isTrue(id);                                                                                                 // 827
      var cursor = self.coll.find();                                                                                   // 828
      obs = cursor.observe({                                                                                           // 829
        added: expectAdd,                                                                                              // 830
        removed: expectRemove                                                                                          // 831
      });                                                                                                              // 832
      test.equal(cursor.count(), 1);                                                                                   // 833
      test.equal(cursor.fetch()[0].seconds(), 50);                                                                     // 834
      test.equal(self.coll.findOne().seconds(), 50);                                                                   // 835
      test.equal(self.coll.findOne({}, {transform: null}).seconds, undefined);                                         // 836
      test.equal(self.coll.findOne({}, {                                                                               // 837
        transform: function (doc) {return {seconds: doc.d.getSeconds()};}                                              // 838
      }).seconds, 50);                                                                                                 // 839
      self.coll.remove(id);                                                                                            // 840
    }));                                                                                                               // 841
  },                                                                                                                   // 842
  function (test, expect) {                                                                                            // 843
    var self = this;                                                                                                   // 844
    self.coll.insert({d: new Date(1356152390004)}, expect(function (err, id) {                                         // 845
      test.isFalse(err);                                                                                               // 846
      test.isTrue(id);                                                                                                 // 847
      self.id1 = id;                                                                                                   // 848
    }));                                                                                                               // 849
    self.coll.insert({d: new Date(1356152391004)}, expect(function (err, id) {                                         // 850
      test.isFalse(err);                                                                                               // 851
      test.isTrue(id);                                                                                                 // 852
      self.id2 = id;                                                                                                   // 853
    }));                                                                                                               // 854
  },                                                                                                                   // 855
  function (test, expect) {                                                                                            // 856
    var self = this;                                                                                                   // 857
    // Test that a transform that returns something other than a document with                                         // 858
    // an _id (eg, a number) works. Regression test for #974.                                                          // 859
    test.equal(self.coll.find({}, {                                                                                    // 860
      transform: function (doc) { return doc.d.getSeconds(); },                                                        // 861
      sort: {d: 1}                                                                                                     // 862
    }).fetch(), [50, 51]);                                                                                             // 863
  }                                                                                                                    // 864
]);                                                                                                                    // 865
                                                                                                                       // 866
testAsyncMulti('mongo-livedata - document with binary data, ' + idGeneration, [                                        // 867
  function (test, expect) {                                                                                            // 868
    // XXX probably shouldn't use EJSON's private test symbols                                                         // 869
    var bin = EJSONTest.base64Decode(                                                                                  // 870
      "TWFuIGlzIGRpc3Rpbmd1aXNoZWQsIG5vdCBvbmx5IGJ5IGhpcyBy" +                                                         // 871
        "ZWFzb24sIGJ1dCBieSB0aGlzIHNpbmd1bGFyIHBhc3Npb24gZnJv" +                                                       // 872
        "bSBvdGhlciBhbmltYWxzLCB3aGljaCBpcyBhIGx1c3Qgb2YgdGhl" +                                                       // 873
        "IG1pbmQsIHRoYXQgYnkgYSBwZXJzZXZlcmFuY2Ugb2YgZGVsaWdo" +                                                       // 874
        "dCBpbiB0aGUgY29udGludWVkIGFuZCBpbmRlZmF0aWdhYmxlIGdl" +                                                       // 875
        "bmVyYXRpb24gb2Yga25vd2xlZGdlLCBleGNlZWRzIHRoZSBzaG9y" +                                                       // 876
        "dCB2ZWhlbWVuY2Ugb2YgYW55IGNhcm5hbCBwbGVhc3VyZS4=");                                                           // 877
    var collectionName = Random.id();                                                                                  // 878
    if (Meteor.isClient) {                                                                                             // 879
      Meteor.call('createInsecureCollection', collectionName, collectionOptions);                                      // 880
      Meteor.subscribe('c-' + collectionName);                                                                         // 881
    }                                                                                                                  // 882
                                                                                                                       // 883
    var coll = new Meteor.Collection(collectionName, collectionOptions);                                               // 884
    var docId;                                                                                                         // 885
    coll.insert({b: bin}, expect(function (err, id) {                                                                  // 886
      test.isFalse(err);                                                                                               // 887
      test.isTrue(id);                                                                                                 // 888
      docId = id;                                                                                                      // 889
      var cursor = coll.find();                                                                                        // 890
      test.equal(cursor.count(), 1);                                                                                   // 891
      var inColl = coll.findOne();                                                                                     // 892
      test.isTrue(EJSON.isBinary(inColl.b));                                                                           // 893
      test.equal(inColl.b, bin);                                                                                       // 894
    }));                                                                                                               // 895
  }                                                                                                                    // 896
]);                                                                                                                    // 897
                                                                                                                       // 898
testAsyncMulti('mongo-livedata - document with a custom type, ' + idGeneration, [                                      // 899
  function (test, expect) {                                                                                            // 900
    var collectionName = Random.id();                                                                                  // 901
    if (Meteor.isClient) {                                                                                             // 902
      Meteor.call('createInsecureCollection', collectionName, collectionOptions);                                      // 903
      Meteor.subscribe('c-' + collectionName);                                                                         // 904
    }                                                                                                                  // 905
                                                                                                                       // 906
    var coll = new Meteor.Collection(collectionName, collectionOptions);                                               // 907
    var docId;                                                                                                         // 908
    // Dog is implemented at the top of the file, outside of the idGeneration                                          // 909
    // loop (so that we only call EJSON.addType once).                                                                 // 910
    var d = new Dog("reginald", "purple");                                                                             // 911
    coll.insert({d: d}, expect(function (err, id) {                                                                    // 912
      test.isFalse(err);                                                                                               // 913
      test.isTrue(id);                                                                                                 // 914
      docId = id;                                                                                                      // 915
      var cursor = coll.find();                                                                                        // 916
      test.equal(cursor.count(), 1);                                                                                   // 917
      var inColl = coll.findOne();                                                                                     // 918
      test.isTrue(inColl);                                                                                             // 919
      inColl && test.equal(inColl.d.speak(), "woof");                                                                  // 920
    }));                                                                                                               // 921
  }                                                                                                                    // 922
]);                                                                                                                    // 923
                                                                                                                       // 924
if (Meteor.isServer) {                                                                                                 // 925
  Tinytest.addAsync("mongo-livedata - update return values, " + idGeneration, function (test, onComplete) {            // 926
    var run = test.runId();                                                                                            // 927
    var coll = new Meteor.Collection("livedata_update_result_"+run, collectionOptions);                                // 928
                                                                                                                       // 929
    coll.insert({ foo: "bar" });                                                                                       // 930
    coll.insert({ foo: "baz" });                                                                                       // 931
    test.equal(coll.update({}, { $set: { foo: "qux" } }, { multi: true }),                                             // 932
               2);                                                                                                     // 933
    coll.update({}, { $set: { foo: "quux" } }, { multi: true }, function (err, result) {                               // 934
      test.isFalse(err);                                                                                               // 935
      test.equal(result, 2);                                                                                           // 936
      onComplete();                                                                                                    // 937
    });                                                                                                                // 938
  });                                                                                                                  // 939
                                                                                                                       // 940
  Tinytest.addAsync("mongo-livedata - remove return values, " + idGeneration, function (test, onComplete) {            // 941
    var run = test.runId();                                                                                            // 942
    var coll = new Meteor.Collection("livedata_update_result_"+run, collectionOptions);                                // 943
                                                                                                                       // 944
    coll.insert({ foo: "bar" });                                                                                       // 945
    coll.insert({ foo: "baz" });                                                                                       // 946
    test.equal(coll.remove({}), 2);                                                                                    // 947
    coll.insert({ foo: "bar" });                                                                                       // 948
    coll.insert({ foo: "baz" });                                                                                       // 949
    coll.remove({}, function (err, result) {                                                                           // 950
      test.isFalse(err);                                                                                               // 951
      test.equal(result, 2);                                                                                           // 952
      onComplete();                                                                                                    // 953
    });                                                                                                                // 954
  });                                                                                                                  // 955
                                                                                                                       // 956
                                                                                                                       // 957
  Tinytest.addAsync("mongo-livedata - id-based invalidation, " + idGeneration, function (test, onComplete) {           // 958
    var run = test.runId();                                                                                            // 959
    var coll = new Meteor.Collection("livedata_invalidation_collection_"+run, collectionOptions);                      // 960
                                                                                                                       // 961
    coll.allow({                                                                                                       // 962
      update: function () {return true;},                                                                              // 963
      remove: function () {return true;}                                                                               // 964
    });                                                                                                                // 965
                                                                                                                       // 966
    var id1 = coll.insert({x: 42, is1: true});                                                                         // 967
    var id2 = coll.insert({x: 50, is2: true});                                                                         // 968
                                                                                                                       // 969
    var polls = {};                                                                                                    // 970
    var handlesToStop = [];                                                                                            // 971
    var observe = function (name, query) {                                                                             // 972
      var handle = coll.find(query).observeChanges({                                                                   // 973
        // Make sure that we only poll on invalidation, not due to time, and                                           // 974
        // keep track of when we do. Note: this option disables the use of                                             // 975
        // oplogs (which admittedly is somewhat irrelevant to this feature).                                           // 976
        _testOnlyPollCallback: function () {                                                                           // 977
          polls[name] = (name in polls ? polls[name] + 1 : 1);                                                         // 978
        }                                                                                                              // 979
      });                                                                                                              // 980
      handlesToStop.push(handle);                                                                                      // 981
    };                                                                                                                 // 982
                                                                                                                       // 983
    observe("all", {});                                                                                                // 984
    observe("id1Direct", id1);                                                                                         // 985
    observe("id1InQuery", {_id: id1, z: null});                                                                        // 986
    observe("id2Direct", id2);                                                                                         // 987
    observe("id2InQuery", {_id: id2, z: null});                                                                        // 988
    observe("bothIds", {_id: {$in: [id1, id2]}});                                                                      // 989
                                                                                                                       // 990
    var resetPollsAndRunInFence = function (f) {                                                                       // 991
      polls = {};                                                                                                      // 992
      runInFence(f);                                                                                                   // 993
    };                                                                                                                 // 994
                                                                                                                       // 995
    // Update id1 directly. This should poll all but the "id2" queries. "all"                                          // 996
    // and "bothIds" increment by 2 because they are looking at both.                                                  // 997
    resetPollsAndRunInFence(function () {                                                                              // 998
      coll.update(id1, {$inc: {x: 1}});                                                                                // 999
    });                                                                                                                // 1000
    test.equal(                                                                                                        // 1001
      polls,                                                                                                           // 1002
      {all: 1, id1Direct: 1, id1InQuery: 1, bothIds: 1});                                                              // 1003
                                                                                                                       // 1004
    // Update id2 using a funny query. This should poll all but the "id1"                                              // 1005
    // queries.                                                                                                        // 1006
    resetPollsAndRunInFence(function () {                                                                              // 1007
      coll.update({_id: id2, q: null}, {$inc: {x: 1}});                                                                // 1008
    });                                                                                                                // 1009
    test.equal(                                                                                                        // 1010
      polls,                                                                                                           // 1011
      {all: 1, id2Direct: 1, id2InQuery: 1, bothIds: 1});                                                              // 1012
                                                                                                                       // 1013
    // Update both using a $in query. Should poll each of them exactly once.                                           // 1014
    resetPollsAndRunInFence(function () {                                                                              // 1015
      coll.update({_id: {$in: [id1, id2]}, q: null}, {$inc: {x: 1}});                                                  // 1016
    });                                                                                                                // 1017
    test.equal(                                                                                                        // 1018
      polls,                                                                                                           // 1019
      {all: 1, id1Direct: 1, id1InQuery: 1, id2Direct: 1, id2InQuery: 1,                                               // 1020
       bothIds: 1});                                                                                                   // 1021
                                                                                                                       // 1022
    _.each(handlesToStop, function (h) {h.stop();});                                                                   // 1023
    onComplete();                                                                                                      // 1024
  });                                                                                                                  // 1025
                                                                                                                       // 1026
  Tinytest.add("mongo-livedata - upsert error parse, " + idGeneration, function (test) {                               // 1027
    var run = test.runId();                                                                                            // 1028
    var coll = new Meteor.Collection("livedata_upsert_errorparse_collection_"+run, collectionOptions);                 // 1029
                                                                                                                       // 1030
    coll.insert({_id: 'foobar'});                                                                                      // 1031
    var err;                                                                                                           // 1032
    try {                                                                                                              // 1033
      coll.update({_id: 'foobar'}, {_id: 'cowbar'});                                                                   // 1034
    } catch (e) {                                                                                                      // 1035
      err = e;                                                                                                         // 1036
    }                                                                                                                  // 1037
    test.isTrue(err);                                                                                                  // 1038
    test.isTrue(MongoInternals.Connection._isCannotChangeIdError(err));                                                // 1039
                                                                                                                       // 1040
    try {                                                                                                              // 1041
      coll.insert({_id: 'foobar'});                                                                                    // 1042
    } catch (e) {                                                                                                      // 1043
      err = e;                                                                                                         // 1044
    }                                                                                                                  // 1045
    test.isTrue(err);                                                                                                  // 1046
    // duplicate id error is not same as change id error                                                               // 1047
    test.isFalse(MongoInternals.Connection._isCannotChangeIdError(err));                                               // 1048
  });                                                                                                                  // 1049
                                                                                                                       // 1050
} // end Meteor.isServer                                                                                               // 1051
                                                                                                                       // 1052
// This test is duplicated below (with some changes) for async upserts that go                                         // 1053
// over the network.                                                                                                   // 1054
_.each(Meteor.isServer ? [true, false] : [true], function (minimongo) {                                                // 1055
  _.each([true, false], function (useUpdate) {                                                                         // 1056
    _.each([true, false], function (useDirectCollection) {                                                             // 1057
      Tinytest.add("mongo-livedata - " + (useUpdate ? "update " : "") + "upsert" + (minimongo ? " minimongo" : "") + (useDirectCollection ? " direct collection " : "") + ", " + idGeneration, function (test) {
        var run = test.runId();                                                                                        // 1059
        var options = collectionOptions;                                                                               // 1060
        // We don't get ids back when we use update() to upsert, or when we are                                        // 1061
        // directly calling MongoConnection.upsert().                                                                  // 1062
        var skipIds = useUpdate || (! minimongo && useDirectCollection);                                               // 1063
        if (minimongo)                                                                                                 // 1064
          options = _.extend({}, collectionOptions, { connection: null });                                             // 1065
        var coll = new Meteor.Collection(                                                                              // 1066
          "livedata_upsert_collection_"+run+                                                                           // 1067
            (useUpdate ? "_update_" : "") +                                                                            // 1068
            (minimongo ? "_minimongo_" : "") +                                                                         // 1069
            (useDirectCollection ? "_direct_" : "") + "",                                                              // 1070
          options                                                                                                      // 1071
        );                                                                                                             // 1072
        if (useDirectCollection)                                                                                       // 1073
          coll = coll._collection;                                                                                     // 1074
                                                                                                                       // 1075
        var result1 = upsert(coll, useUpdate, {foo: 'bar'}, {foo: 'bar'});                                             // 1076
        test.equal(result1.numberAffected, 1);                                                                         // 1077
        if (! skipIds)                                                                                                 // 1078
          test.isTrue(result1.insertedId);                                                                             // 1079
        compareResults(test, skipIds, coll.find().fetch(), [{foo: 'bar', _id: result1.insertedId}]);                   // 1080
                                                                                                                       // 1081
        var result2 = upsert(coll, useUpdate, {foo: 'bar'}, {foo: 'baz'});                                             // 1082
        test.equal(result2.numberAffected, 1);                                                                         // 1083
        if (! skipIds)                                                                                                 // 1084
          test.isFalse(result2.insertedId);                                                                            // 1085
        compareResults(test, skipIds, coll.find().fetch(), [{foo: 'baz', _id: result1.insertedId}]);                   // 1086
                                                                                                                       // 1087
        coll.remove({});                                                                                               // 1088
                                                                                                                       // 1089
        // Test values that require transformation to go into Mongo:                                                   // 1090
                                                                                                                       // 1091
        var t1 = new Meteor.Collection.ObjectID();                                                                     // 1092
        var t2 = new Meteor.Collection.ObjectID();                                                                     // 1093
        var result3 = upsert(coll, useUpdate, {foo: t1}, {foo: t1});                                                   // 1094
        test.equal(result3.numberAffected, 1);                                                                         // 1095
        if (! skipIds)                                                                                                 // 1096
          test.isTrue(result3.insertedId);                                                                             // 1097
        compareResults(test, skipIds, coll.find().fetch(), [{foo: t1, _id: result3.insertedId}]);                      // 1098
                                                                                                                       // 1099
        var result4 = upsert(coll, useUpdate, {foo: t1}, {foo: t2});                                                   // 1100
        test.equal(result2.numberAffected, 1);                                                                         // 1101
        if (! skipIds)                                                                                                 // 1102
          test.isFalse(result2.insertedId);                                                                            // 1103
        compareResults(test, skipIds, coll.find().fetch(), [{foo: t2, _id: result3.insertedId}]);                      // 1104
                                                                                                                       // 1105
        coll.remove({});                                                                                               // 1106
                                                                                                                       // 1107
        // Test modification by upsert                                                                                 // 1108
                                                                                                                       // 1109
        var result5 = upsert(coll, useUpdate, {name: 'David'}, {$set: {foo: 1}});                                      // 1110
        test.equal(result5.numberAffected, 1);                                                                         // 1111
        if (! skipIds)                                                                                                 // 1112
          test.isTrue(result5.insertedId);                                                                             // 1113
        var davidId = result5.insertedId;                                                                              // 1114
        compareResults(test, skipIds, coll.find().fetch(), [{name: 'David', foo: 1, _id: davidId}]);                   // 1115
                                                                                                                       // 1116
        test.throws(function () {                                                                                      // 1117
          // test that bad modifier fails fast                                                                         // 1118
          upsert(coll, useUpdate, {name: 'David'}, {$blah: {foo: 2}});                                                 // 1119
        });                                                                                                            // 1120
                                                                                                                       // 1121
                                                                                                                       // 1122
        var result6 = upsert(coll, useUpdate, {name: 'David'}, {$set: {foo: 2}});                                      // 1123
        test.equal(result6.numberAffected, 1);                                                                         // 1124
        if (! skipIds)                                                                                                 // 1125
          test.isFalse(result6.insertedId);                                                                            // 1126
        compareResults(test, skipIds, coll.find().fetch(), [{name: 'David', foo: 2,                                    // 1127
                                                               _id: result5.insertedId}]);                             // 1128
                                                                                                                       // 1129
        var emilyId = coll.insert({name: 'Emily', foo: 2});                                                            // 1130
        compareResults(test, skipIds, coll.find().fetch(), [{name: 'David', foo: 2, _id: davidId},                     // 1131
                                                              {name: 'Emily', foo: 2, _id: emilyId}]);                 // 1132
                                                                                                                       // 1133
        // multi update by upsert                                                                                      // 1134
        var result7 = upsert(coll, useUpdate, {foo: 2},                                                                // 1135
                             {$set: {bar: 7},                                                                          // 1136
                              $setOnInsert: {name: 'Fred', foo: 2}},                                                   // 1137
                             {multi: true});                                                                           // 1138
        test.equal(result7.numberAffected, 2);                                                                         // 1139
        if (! skipIds)                                                                                                 // 1140
          test.isFalse(result7.insertedId);                                                                            // 1141
        compareResults(test, skipIds, coll.find().fetch(), [{name: 'David', foo: 2, bar: 7, _id: davidId},             // 1142
                                                              {name: 'Emily', foo: 2, bar: 7, _id: emilyId}]);         // 1143
                                                                                                                       // 1144
        // insert by multi upsert                                                                                      // 1145
        var result8 = upsert(coll, useUpdate, {foo: 3},                                                                // 1146
                             {$set: {bar: 7},                                                                          // 1147
                              $setOnInsert: {name: 'Fred', foo: 2}},                                                   // 1148
                             {multi: true});                                                                           // 1149
        test.equal(result8.numberAffected, 1);                                                                         // 1150
        if (! skipIds)                                                                                                 // 1151
          test.isTrue(result8.insertedId);                                                                             // 1152
        var fredId = result8.insertedId;                                                                               // 1153
        compareResults(test, skipIds, coll.find().fetch(),                                                             // 1154
                       [{name: 'David', foo: 2, bar: 7, _id: davidId},                                                 // 1155
                        {name: 'Emily', foo: 2, bar: 7, _id: emilyId},                                                 // 1156
                        {name: 'Fred', foo: 2, bar: 7, _id: fredId}]);                                                 // 1157
                                                                                                                       // 1158
        // test `insertedId` option                                                                                    // 1159
        var result9 = upsert(coll, useUpdate, {name: 'Steve'},                                                         // 1160
                             {name: 'Steve'},                                                                          // 1161
                             {insertedId: 'steve'});                                                                   // 1162
        test.equal(result9.numberAffected, 1);                                                                         // 1163
        if (! skipIds)                                                                                                 // 1164
          test.equal(result9.insertedId, 'steve');                                                                     // 1165
        compareResults(test, skipIds, coll.find().fetch(),                                                             // 1166
                       [{name: 'David', foo: 2, bar: 7, _id: davidId},                                                 // 1167
                        {name: 'Emily', foo: 2, bar: 7, _id: emilyId},                                                 // 1168
                        {name: 'Fred', foo: 2, bar: 7, _id: fredId},                                                   // 1169
                        {name: 'Steve', _id: 'steve'}]);                                                               // 1170
        test.isTrue(coll.findOne('steve'));                                                                            // 1171
        test.isFalse(coll.findOne('fred'));                                                                            // 1172
                                                                                                                       // 1173
        // Test $ operator in selectors.                                                                               // 1174
                                                                                                                       // 1175
        var result10 = upsert(coll, useUpdate,                                                                         // 1176
                              {$or: [{name: 'David'}, {name: 'Emily'}]},                                               // 1177
                              {$set: {foo: 3}}, {multi: true});                                                        // 1178
        test.equal(result10.numberAffected, 2);                                                                        // 1179
        if (! skipIds)                                                                                                 // 1180
          test.isFalse(result10.insertedId);                                                                           // 1181
        compareResults(test, skipIds,                                                                                  // 1182
                       [coll.findOne({name: 'David'}), coll.findOne({name: 'Emily'})],                                 // 1183
                       [{name: 'David', foo: 3, bar: 7, _id: davidId},                                                 // 1184
                        {name: 'Emily', foo: 3, bar: 7, _id: emilyId}]                                                 // 1185
                      );                                                                                               // 1186
                                                                                                                       // 1187
        var result11 = upsert(                                                                                         // 1188
          coll, useUpdate,                                                                                             // 1189
          {                                                                                                            // 1190
            name: 'Charlie',                                                                                           // 1191
            $or: [{ foo: 2}, { bar: 7 }]                                                                               // 1192
          },                                                                                                           // 1193
          { $set: { foo: 3 } }                                                                                         // 1194
        );                                                                                                             // 1195
        test.equal(result11.numberAffected, 1);                                                                        // 1196
        if (! skipIds)                                                                                                 // 1197
          test.isTrue(result11.insertedId);                                                                            // 1198
        var charlieId = result11.insertedId;                                                                           // 1199
        compareResults(test, skipIds,                                                                                  // 1200
                       coll.find({ name: 'Charlie' }).fetch(),                                                         // 1201
                       [{name: 'Charlie', foo: 3, _id: charlieId}]);                                                   // 1202
      });                                                                                                              // 1203
    });                                                                                                                // 1204
  });                                                                                                                  // 1205
});                                                                                                                    // 1206
                                                                                                                       // 1207
var asyncUpsertTestName = function (useNetwork, useDirectCollection,                                                   // 1208
                                    useUpdate, idGeneration) {                                                         // 1209
  return "mongo-livedata - async " +                                                                                   // 1210
    (useUpdate ? "update " : "") +                                                                                     // 1211
    "upsert " +                                                                                                        // 1212
    (useNetwork ? "over network " : "") +                                                                              // 1213
    (useDirectCollection ? ", direct collection " : "") +                                                              // 1214
    idGeneration;                                                                                                      // 1215
};                                                                                                                     // 1216
                                                                                                                       // 1217
// This is a duplicate of the test above, with some changes to make it work for                                        // 1218
// callback style. On the client, we test server-backed and in-memory                                                  // 1219
// collections, and run the tests for both the Meteor.Collection and the                                               // 1220
// LocalCollection. On the server, we test mongo-backed collections, for both                                          // 1221
// the Meteor.Collection and the MongoConnection.                                                                      // 1222
_.each(Meteor.isServer ? [false] : [true, false], function (useNetwork) {                                              // 1223
  _.each(useNetwork ? [false] : [true, false], function (useDirectCollection) {                                        // 1224
    _.each([true, false], function (useUpdate) {                                                                       // 1225
      Tinytest.addAsync(asyncUpsertTestName(useNetwork, useDirectCollection, useUpdate, idGeneration), function (test, onComplete) {
        var coll;                                                                                                      // 1227
        var run = test.runId();                                                                                        // 1228
        var collName = "livedata_upsert_collection_"+run+                                                              // 1229
              (useUpdate ? "_update_" : "") +                                                                          // 1230
              (useNetwork ? "_network_" : "") +                                                                        // 1231
              (useDirectCollection ? "_direct_" : "");                                                                 // 1232
        if (useNetwork) {                                                                                              // 1233
          Meteor.call("createInsecureCollection", collName, collectionOptions);                                        // 1234
          coll = new Meteor.Collection(collName, collectionOptions);                                                   // 1235
          Meteor.subscribe("c-" + collName);                                                                           // 1236
        } else {                                                                                                       // 1237
          var opts = _.clone(collectionOptions);                                                                       // 1238
          if (Meteor.isClient)                                                                                         // 1239
            opts.connection = null;                                                                                    // 1240
          coll = new Meteor.Collection(collName, opts);                                                                // 1241
          if (useDirectCollection)                                                                                     // 1242
            coll = coll._collection;                                                                                   // 1243
        }                                                                                                              // 1244
                                                                                                                       // 1245
        var result1;                                                                                                   // 1246
        var next1 = function (err, result) {                                                                           // 1247
          result1 = result;                                                                                            // 1248
          test.equal(result1.numberAffected, 1);                                                                       // 1249
          if (! useUpdate) {                                                                                           // 1250
            test.isTrue(result1.insertedId);                                                                           // 1251
            test.equal(result1.insertedId, 'foo');                                                                     // 1252
          }                                                                                                            // 1253
          compareResults(test, useUpdate, coll.find().fetch(), [{foo: 'bar', _id: 'foo'}]);                            // 1254
          upsert(coll, useUpdate, {_id: 'foo'}, {foo: 'baz'}, next2);                                                  // 1255
        };                                                                                                             // 1256
                                                                                                                       // 1257
        // Test starts here.                                                                                           // 1258
        upsert(coll, useUpdate, {_id: 'foo'}, {_id: 'foo', foo: 'bar'}, next1);                                        // 1259
                                                                                                                       // 1260
        var t1, t2, result2;                                                                                           // 1261
        var next2 = function (err, result) {                                                                           // 1262
          result2 = result;                                                                                            // 1263
          test.equal(result2.numberAffected, 1);                                                                       // 1264
          if (! useUpdate)                                                                                             // 1265
            test.isFalse(result2.insertedId);                                                                          // 1266
          compareResults(test, useUpdate, coll.find().fetch(), [{foo: 'baz', _id: result1.insertedId}]);               // 1267
          coll.remove({_id: 'foo'});                                                                                   // 1268
          compareResults(test, useUpdate, coll.find().fetch(), []);                                                    // 1269
                                                                                                                       // 1270
          // Test values that require transformation to go into Mongo:                                                 // 1271
                                                                                                                       // 1272
          t1 = new Meteor.Collection.ObjectID();                                                                       // 1273
          t2 = new Meteor.Collection.ObjectID();                                                                       // 1274
          upsert(coll, useUpdate, {_id: t1}, {_id: t1, foo: 'bar'}, next3);                                            // 1275
        };                                                                                                             // 1276
                                                                                                                       // 1277
        var result3;                                                                                                   // 1278
        var next3 = function (err, result) {                                                                           // 1279
          result3 = result;                                                                                            // 1280
          test.equal(result3.numberAffected, 1);                                                                       // 1281
          if (! useUpdate) {                                                                                           // 1282
            test.isTrue(result3.insertedId);                                                                           // 1283
            test.equal(t1, result3.insertedId);                                                                        // 1284
          }                                                                                                            // 1285
          compareResults(test, useUpdate, coll.find().fetch(), [{_id: t1, foo: 'bar'}]);                               // 1286
                                                                                                                       // 1287
          upsert(coll, useUpdate, {_id: t1}, {foo: t2}, next4);                                                        // 1288
        };                                                                                                             // 1289
                                                                                                                       // 1290
        var next4 = function (err, result4) {                                                                          // 1291
          test.equal(result2.numberAffected, 1);                                                                       // 1292
          if (! useUpdate)                                                                                             // 1293
            test.isFalse(result2.insertedId);                                                                          // 1294
          compareResults(test, useUpdate, coll.find().fetch(), [{foo: t2, _id: result3.insertedId}]);                  // 1295
                                                                                                                       // 1296
          coll.remove({_id: t1});                                                                                      // 1297
                                                                                                                       // 1298
          // Test modification by upsert                                                                               // 1299
          upsert(coll, useUpdate, {_id: 'David'}, {$set: {foo: 1}}, next5);                                            // 1300
        };                                                                                                             // 1301
                                                                                                                       // 1302
        var result5;                                                                                                   // 1303
        var next5 = function (err, result) {                                                                           // 1304
          result5 = result;                                                                                            // 1305
          test.equal(result5.numberAffected, 1);                                                                       // 1306
          if (! useUpdate) {                                                                                           // 1307
            test.isTrue(result5.insertedId);                                                                           // 1308
            test.equal(result5.insertedId, 'David');                                                                   // 1309
          }                                                                                                            // 1310
          var davidId = result5.insertedId;                                                                            // 1311
          compareResults(test, useUpdate, coll.find().fetch(), [{foo: 1, _id: davidId}]);                              // 1312
                                                                                                                       // 1313
          if (! Meteor.isClient && useDirectCollection) {                                                              // 1314
            // test that bad modifier fails                                                                            // 1315
            // The stub throws an exception about the invalid modifier, which                                          // 1316
            // livedata logs (so we suppress it).                                                                      // 1317
            Meteor._suppress_log(1);                                                                                   // 1318
            upsert(coll, useUpdate, {_id: 'David'}, {$blah: {foo: 2}}, function (err) {                                // 1319
              if (! (Meteor.isClient && useDirectCollection))                                                          // 1320
                test.isTrue(err);                                                                                      // 1321
              upsert(coll, useUpdate, {_id: 'David'}, {$set: {foo: 2}}, next6);                                        // 1322
            });                                                                                                        // 1323
          } else {                                                                                                     // 1324
            // XXX skip this test for now for LocalCollection; the fact that                                           // 1325
            // we're in a nested sequence of callbacks means we're inside a                                            // 1326
            // Meteor.defer, which means the exception just gets                                                       // 1327
            // logged. Something should be done about this at some point?  Maybe                                       // 1328
            // LocalCollection callbacks don't really have to be deferred.                                             // 1329
            upsert(coll, useUpdate, {_id: 'David'}, {$set: {foo: 2}}, next6);                                          // 1330
          }                                                                                                            // 1331
        };                                                                                                             // 1332
                                                                                                                       // 1333
        var result6;                                                                                                   // 1334
        var next6 = function (err, result) {                                                                           // 1335
          result6 = result;                                                                                            // 1336
          test.equal(result6.numberAffected, 1);                                                                       // 1337
          if (! useUpdate)                                                                                             // 1338
            test.isFalse(result6.insertedId);                                                                          // 1339
          compareResults(test, useUpdate, coll.find().fetch(), [{_id: 'David', foo: 2}]);                              // 1340
                                                                                                                       // 1341
          var emilyId = coll.insert({_id: 'Emily', foo: 2});                                                           // 1342
          compareResults(test, useUpdate, coll.find().fetch(), [{_id: 'David', foo: 2},                                // 1343
                                                                {_id: 'Emily', foo: 2}]);                              // 1344
                                                                                                                       // 1345
          // multi update by upsert.                                                                                   // 1346
          // We can't actually update multiple documents since we have to do it by                                     // 1347
          // id, but at least make sure the multi flag doesn't mess anything up.                                       // 1348
          upsert(coll, useUpdate, {_id: 'Emily'},                                                                      // 1349
                 {$set: {bar: 7},                                                                                      // 1350
                  $setOnInsert: {name: 'Fred', foo: 2}},                                                               // 1351
                 {multi: true}, next7);                                                                                // 1352
        };                                                                                                             // 1353
                                                                                                                       // 1354
        var result7;                                                                                                   // 1355
        var next7 = function (err, result) {                                                                           // 1356
          result7 = result;                                                                                            // 1357
          test.equal(result7.numberAffected, 1);                                                                       // 1358
          if (! useUpdate)                                                                                             // 1359
            test.isFalse(result7.insertedId);                                                                          // 1360
          compareResults(test, useUpdate, coll.find().fetch(), [{_id: 'David', foo: 2},                                // 1361
                                                                {_id: 'Emily', foo: 2, bar: 7}]);                      // 1362
                                                                                                                       // 1363
          // insert by multi upsert                                                                                    // 1364
          upsert(coll, useUpdate, {_id: 'Fred'},                                                                       // 1365
                 {$set: {bar: 7},                                                                                      // 1366
                  $setOnInsert: {name: 'Fred', foo: 2}},                                                               // 1367
                 {multi: true}, next8);                                                                                // 1368
                                                                                                                       // 1369
        };                                                                                                             // 1370
                                                                                                                       // 1371
        var result8;                                                                                                   // 1372
        var next8 = function (err, result) {                                                                           // 1373
          result8 = result;                                                                                            // 1374
                                                                                                                       // 1375
          test.equal(result8.numberAffected, 1);                                                                       // 1376
          if (! useUpdate) {                                                                                           // 1377
            test.isTrue(result8.insertedId);                                                                           // 1378
            test.equal(result8.insertedId, 'Fred');                                                                    // 1379
          }                                                                                                            // 1380
          var fredId = result8.insertedId;                                                                             // 1381
          compareResults(test, useUpdate,  coll.find().fetch(),                                                        // 1382
                         [{_id: 'David', foo: 2},                                                                      // 1383
                          {_id: 'Emily', foo: 2, bar: 7},                                                              // 1384
                          {name: 'Fred', foo: 2, bar: 7, _id: fredId}]);                                               // 1385
          onComplete();                                                                                                // 1386
        };                                                                                                             // 1387
      });                                                                                                              // 1388
    });                                                                                                                // 1389
  });                                                                                                                  // 1390
});                                                                                                                    // 1391
                                                                                                                       // 1392
if (Meteor.isClient) {                                                                                                 // 1393
  Tinytest.addAsync("mongo-livedata - async update/remove return values over network " + idGeneration, function (test, onComplete) {
    var coll;                                                                                                          // 1395
    var run = test.runId();                                                                                            // 1396
    var collName = "livedata_upsert_collection_"+run;                                                                  // 1397
    Meteor.call("createInsecureCollection", collName, collectionOptions);                                              // 1398
    coll = new Meteor.Collection(collName, collectionOptions);                                                         // 1399
    Meteor.subscribe("c-" + collName);                                                                                 // 1400
                                                                                                                       // 1401
    coll.insert({ _id: "foo" });                                                                                       // 1402
    coll.insert({ _id: "bar" });                                                                                       // 1403
    coll.update({ _id: "foo" }, { $set: { foo: 1 } }, { multi: true }, function (err, result) {                        // 1404
      test.isFalse(err);                                                                                               // 1405
      test.equal(result, 1);                                                                                           // 1406
      coll.update({ _id: "foo" }, { _id: "foo", foo: 2 }, function (err, result) {                                     // 1407
        test.isFalse(err);                                                                                             // 1408
        test.equal(result, 1);                                                                                         // 1409
        coll.update({ _id: "baz" }, { $set: { foo: 1 } }, function (err, result) {                                     // 1410
          test.isFalse(err);                                                                                           // 1411
          test.equal(result, 0);                                                                                       // 1412
          coll.remove({ _id: "foo" }, function (err, result) {                                                         // 1413
            test.equal(result, 1);                                                                                     // 1414
            coll.remove({ _id: "baz" }, function (err, result) {                                                       // 1415
              test.equal(result, 0);                                                                                   // 1416
              onComplete();                                                                                            // 1417
            });                                                                                                        // 1418
          });                                                                                                          // 1419
        });                                                                                                            // 1420
      });                                                                                                              // 1421
    });                                                                                                                // 1422
  });                                                                                                                  // 1423
}                                                                                                                      // 1424
                                                                                                                       // 1425
// Runs a method and its stub which do some upserts. The method throws an error                                        // 1426
// if we don't get the right return values.                                                                            // 1427
if (Meteor.isClient) {                                                                                                 // 1428
  _.each([true, false], function (useUpdate) {                                                                         // 1429
    Tinytest.addAsync("mongo-livedata - " + (useUpdate ? "update " : "") + "upsert in method, " + idGeneration, function (test, onComplete) {
      var run = test.runId();                                                                                          // 1431
      upsertTestMethodColl = new Meteor.Collection(upsertTestMethod + "_collection_" + run, collectionOptions);        // 1432
      var m = {};                                                                                                      // 1433
      delete Meteor.connection._methodHandlers[upsertTestMethod];                                                      // 1434
      m[upsertTestMethod] = function (run, useUpdate, options) {                                                       // 1435
        upsertTestMethodImpl(upsertTestMethodColl, useUpdate, test);                                                   // 1436
      };                                                                                                               // 1437
      Meteor.methods(m);                                                                                               // 1438
      Meteor.call(upsertTestMethod, run, useUpdate, collectionOptions, function (err, result) {                        // 1439
        test.isFalse(err);                                                                                             // 1440
        onComplete();                                                                                                  // 1441
      });                                                                                                              // 1442
    });                                                                                                                // 1443
  });                                                                                                                  // 1444
}                                                                                                                      // 1445
                                                                                                                       // 1446
_.each(Meteor.isServer ? [true, false] : [true], function (minimongo) {                                                // 1447
  _.each([true, false], function (useUpdate) {                                                                         // 1448
    Tinytest.add("mongo-livedata - " + (useUpdate ? "update " : "") + "upsert by id" + (minimongo ? " minimongo" : "") + ", " + idGeneration, function (test) {
      var run = test.runId();                                                                                          // 1450
      var options = collectionOptions;                                                                                 // 1451
      if (minimongo)                                                                                                   // 1452
        options = _.extend({}, collectionOptions, { connection: null });                                               // 1453
      var coll = new Meteor.Collection("livedata_upsert_by_id_collection_"+run, options);                              // 1454
                                                                                                                       // 1455
      var ret;                                                                                                         // 1456
      ret = upsert(coll, useUpdate, {_id: 'foo'}, {$set: {x: 1}});                                                     // 1457
      test.equal(ret.numberAffected, 1);                                                                               // 1458
      if (! useUpdate)                                                                                                 // 1459
        test.equal(ret.insertedId, 'foo');                                                                             // 1460
      compareResults(test, useUpdate, coll.find().fetch(),                                                             // 1461
                     [{_id: 'foo', x: 1}]);                                                                            // 1462
                                                                                                                       // 1463
      ret = upsert(coll, useUpdate, {_id: 'foo'}, {$set: {x: 2}});                                                     // 1464
      test.equal(ret.numberAffected, 1);                                                                               // 1465
      if (! useUpdate)                                                                                                 // 1466
        test.isFalse(ret.insertedId);                                                                                  // 1467
      compareResults(test, useUpdate, coll.find().fetch(),                                                             // 1468
                     [{_id: 'foo', x: 2}]);                                                                            // 1469
                                                                                                                       // 1470
      ret = upsert(coll, useUpdate, {_id: 'bar'}, {$set: {x: 1}});                                                     // 1471
      test.equal(ret.numberAffected, 1);                                                                               // 1472
      if (! useUpdate)                                                                                                 // 1473
        test.equal(ret.insertedId, 'bar');                                                                             // 1474
      compareResults(test, useUpdate, coll.find().fetch(),                                                             // 1475
                     [{_id: 'foo', x: 2},                                                                              // 1476
                      {_id: 'bar', x: 1}]);                                                                            // 1477
                                                                                                                       // 1478
      coll.remove({});                                                                                                 // 1479
                                                                                                                       // 1480
      ret = upsert(coll, useUpdate, {_id: 'traz'}, {x: 1});                                                            // 1481
      test.equal(ret.numberAffected, 1);                                                                               // 1482
      var myId = ret.insertedId;                                                                                       // 1483
      if (! useUpdate) {                                                                                               // 1484
        test.isTrue(myId);                                                                                             // 1485
        // upsert with entire document does NOT take _id from                                                          // 1486
        // the query.                                                                                                  // 1487
        test.notEqual(myId, 'traz');                                                                                   // 1488
      } else {                                                                                                         // 1489
        myId = coll.findOne()._id;                                                                                     // 1490
      }                                                                                                                // 1491
      compareResults(test, useUpdate, coll.find().fetch(),                                                             // 1492
                     [{x: 1, _id: myId}]);                                                                             // 1493
                                                                                                                       // 1494
      // this time, insert as _id 'traz'                                                                               // 1495
      ret = upsert(coll, useUpdate, {_id: 'traz'}, {_id: 'traz', x: 2});                                               // 1496
      test.equal(ret.numberAffected, 1);                                                                               // 1497
      if (! useUpdate)                                                                                                 // 1498
        test.equal(ret.insertedId, 'traz');                                                                            // 1499
      compareResults(test, useUpdate, coll.find().fetch(),                                                             // 1500
                     [{x: 1, _id: myId},                                                                               // 1501
                      {x: 2, _id: 'traz'}]);                                                                           // 1502
                                                                                                                       // 1503
      // now update _id 'traz'                                                                                         // 1504
      ret = upsert(coll, useUpdate, {_id: 'traz'}, {x: 3});                                                            // 1505
      test.equal(ret.numberAffected, 1);                                                                               // 1506
      test.isFalse(ret.insertedId);                                                                                    // 1507
      compareResults(test, useUpdate, coll.find().fetch(),                                                             // 1508
                     [{x: 1, _id: myId},                                                                               // 1509
                      {x: 3, _id: 'traz'}]);                                                                           // 1510
                                                                                                                       // 1511
      // now update, passing _id (which is ok as long as it's the same)                                                // 1512
      ret = upsert(coll, useUpdate, {_id: 'traz'}, {_id: 'traz', x: 4});                                               // 1513
      test.equal(ret.numberAffected, 1);                                                                               // 1514
      test.isFalse(ret.insertedId);                                                                                    // 1515
      compareResults(test, useUpdate, coll.find().fetch(),                                                             // 1516
                     [{x: 1, _id: myId},                                                                               // 1517
                      {x: 4, _id: 'traz'}]);                                                                           // 1518
                                                                                                                       // 1519
    });                                                                                                                // 1520
  });                                                                                                                  // 1521
});                                                                                                                    // 1522
                                                                                                                       // 1523
});  // end idGeneration parametrization                                                                               // 1524
                                                                                                                       // 1525
Tinytest.add('mongo-livedata - rewrite selector', function (test) {                                                    // 1526
  test.equal(Meteor.Collection._rewriteSelector({x: /^o+B/im}),                                                        // 1527
             {x: {$regex: '^o+B', $options: 'im'}});                                                                   // 1528
  test.equal(Meteor.Collection._rewriteSelector({x: {$regex: /^o+B/im}}),                                              // 1529
             {x: {$regex: '^o+B', $options: 'im'}});                                                                   // 1530
  test.equal(Meteor.Collection._rewriteSelector({x: /^o+B/}),                                                          // 1531
             {x: {$regex: '^o+B'}});                                                                                   // 1532
  test.equal(Meteor.Collection._rewriteSelector({x: {$regex: /^o+B/}}),                                                // 1533
             {x: {$regex: '^o+B'}});                                                                                   // 1534
  test.equal(Meteor.Collection._rewriteSelector('foo'),                                                                // 1535
             {_id: 'foo'});                                                                                            // 1536
                                                                                                                       // 1537
  test.equal(                                                                                                          // 1538
    Meteor.Collection._rewriteSelector(                                                                                // 1539
      {'$or': [                                                                                                        // 1540
        {x: /^o/},                                                                                                     // 1541
        {y: /^p/},                                                                                                     // 1542
        {z: 'q'},                                                                                                      // 1543
        {w: {$regex: /^r/}}                                                                                            // 1544
      ]}                                                                                                               // 1545
    ),                                                                                                                 // 1546
    {'$or': [                                                                                                          // 1547
      {x: {$regex: '^o'}},                                                                                             // 1548
      {y: {$regex: '^p'}},                                                                                             // 1549
      {z: 'q'},                                                                                                        // 1550
      {w: {$regex: '^r'}}                                                                                              // 1551
    ]}                                                                                                                 // 1552
  );                                                                                                                   // 1553
                                                                                                                       // 1554
  test.equal(                                                                                                          // 1555
    Meteor.Collection._rewriteSelector(                                                                                // 1556
      {'$or': [                                                                                                        // 1557
        {'$and': [                                                                                                     // 1558
          {x: /^a/i},                                                                                                  // 1559
          {y: /^b/},                                                                                                   // 1560
          {z: {$regex: /^c/i}},                                                                                        // 1561
          {w: {$regex: '^[abc]', $options: 'i'}}, // make sure we don't break vanilla selectors                        // 1562
          {v: {$regex: /O/, $options: 'i'}}, // $options should override the ones on the RegExp object                 // 1563
          {u: {$regex: /O/m, $options: 'i'}} // $options should override the ones on the RegExp object                 // 1564
        ]},                                                                                                            // 1565
        {'$nor': [                                                                                                     // 1566
          {s: /^d/},                                                                                                   // 1567
          {t: /^e/i},                                                                                                  // 1568
          {u: {$regex: /^f/i}},                                                                                        // 1569
          // even empty string overrides built-in flags                                                                // 1570
          {v: {$regex: /^g/i, $options: ''}}                                                                           // 1571
        ]}                                                                                                             // 1572
      ]}                                                                                                               // 1573
    ),                                                                                                                 // 1574
    {'$or': [                                                                                                          // 1575
      {'$and': [                                                                                                       // 1576
        {x: {$regex: '^a', $options: 'i'}},                                                                            // 1577
        {y: {$regex: '^b'}},                                                                                           // 1578
        {z: {$regex: '^c', $options: 'i'}},                                                                            // 1579
        {w: {$regex: '^[abc]', $options: 'i'}},                                                                        // 1580
        {v: {$regex: 'O', $options: 'i'}},                                                                             // 1581
        {u: {$regex: 'O', $options: 'i'}}                                                                              // 1582
      ]},                                                                                                              // 1583
      {'$nor': [                                                                                                       // 1584
        {s: {$regex: '^d'}},                                                                                           // 1585
        {t: {$regex: '^e', $options: 'i'}},                                                                            // 1586
        {u: {$regex: '^f', $options: 'i'}},                                                                            // 1587
        {v: {$regex: '^g', $options: ''}}                                                                              // 1588
      ]}                                                                                                               // 1589
    ]}                                                                                                                 // 1590
  );                                                                                                                   // 1591
                                                                                                                       // 1592
  var oid = new Meteor.Collection.ObjectID();                                                                          // 1593
  test.equal(Meteor.Collection._rewriteSelector(oid),                                                                  // 1594
             {_id: oid});                                                                                              // 1595
});                                                                                                                    // 1596
                                                                                                                       // 1597
testAsyncMulti('mongo-livedata - specified _id', [                                                                     // 1598
  function (test, expect) {                                                                                            // 1599
    var collectionName = Random.id();                                                                                  // 1600
    if (Meteor.isClient) {                                                                                             // 1601
      Meteor.call('createInsecureCollection', collectionName);                                                         // 1602
      Meteor.subscribe('c-' + collectionName);                                                                         // 1603
    }                                                                                                                  // 1604
    var expectError = expect(function (err, result) {                                                                  // 1605
      test.isTrue(err);                                                                                                // 1606
      var doc = coll.findOne();                                                                                        // 1607
      test.equal(doc.name, "foo");                                                                                     // 1608
    });                                                                                                                // 1609
    var coll = new Meteor.Collection(collectionName);                                                                  // 1610
    coll.insert({_id: "foo", name: "foo"}, expect(function (err1, id) {                                                // 1611
      test.equal(id, "foo");                                                                                           // 1612
      var doc = coll.findOne();                                                                                        // 1613
      test.equal(doc._id, "foo");                                                                                      // 1614
      Meteor._suppress_log(1);                                                                                         // 1615
      coll.insert({_id: "foo", name: "bar"}, expectError);                                                             // 1616
    }));                                                                                                               // 1617
  }                                                                                                                    // 1618
]);                                                                                                                    // 1619
                                                                                                                       // 1620
testAsyncMulti('mongo-livedata - empty string _id', [                                                                  // 1621
  function (test, expect) {                                                                                            // 1622
    var self = this;                                                                                                   // 1623
    self.collectionName = Random.id();                                                                                 // 1624
    if (Meteor.isClient) {                                                                                             // 1625
      Meteor.call('createInsecureCollection', self.collectionName);                                                    // 1626
      Meteor.subscribe('c-' + self.collectionName);                                                                    // 1627
    }                                                                                                                  // 1628
    self.coll = new Meteor.Collection(self.collectionName);                                                            // 1629
    try {                                                                                                              // 1630
      self.coll.insert({_id: "", f: "foo"});                                                                           // 1631
      test.fail("Insert with an empty _id should fail");                                                               // 1632
    } catch (e) {                                                                                                      // 1633
      // ok                                                                                                            // 1634
    }                                                                                                                  // 1635
    self.coll.insert({_id: "realid", f: "bar"}, expect(function (err, res) {                                           // 1636
      test.equal(res, "realid");                                                                                       // 1637
    }));                                                                                                               // 1638
  },                                                                                                                   // 1639
  function (test, expect) {                                                                                            // 1640
    var self = this;                                                                                                   // 1641
    var docs = self.coll.find().fetch();                                                                               // 1642
    test.equal(docs, [{_id: "realid", f: "bar"}]);                                                                     // 1643
  },                                                                                                                   // 1644
  function (test, expect) {                                                                                            // 1645
    var self = this;                                                                                                   // 1646
    if (Meteor.isServer) {                                                                                             // 1647
      self.coll._collection.insert({_id: "", f: "baz"});                                                               // 1648
      test.equal(self.coll.find().fetch().length, 2);                                                                  // 1649
    }                                                                                                                  // 1650
  }                                                                                                                    // 1651
]);                                                                                                                    // 1652
                                                                                                                       // 1653
                                                                                                                       // 1654
if (Meteor.isServer) {                                                                                                 // 1655
                                                                                                                       // 1656
  testAsyncMulti("mongo-livedata - minimongo on server to server connection", [                                        // 1657
    function (test, expect) {                                                                                          // 1658
      var self = this;                                                                                                 // 1659
      Meteor._debug("connection setup");                                                                               // 1660
      self.id = Random.id();                                                                                           // 1661
      var C = self.C = new Meteor.Collection("ServerMinimongo_" + self.id);                                            // 1662
      C.allow({                                                                                                        // 1663
        insert: function () {return true;},                                                                            // 1664
        update: function () {return true;},                                                                            // 1665
        remove: function () {return true;}                                                                             // 1666
      });                                                                                                              // 1667
      C.insert({a: 0, b: 1});                                                                                          // 1668
      C.insert({a: 0, b: 2});                                                                                          // 1669
      C.insert({a: 1, b: 3});                                                                                          // 1670
      Meteor.publish(self.id, function () {                                                                            // 1671
        return C.find({a: 0});                                                                                         // 1672
      });                                                                                                              // 1673
                                                                                                                       // 1674
      self.conn = DDP.connect(Meteor.absoluteUrl());                                                                   // 1675
      pollUntil(expect, function () {                                                                                  // 1676
        return self.conn.status().connected;                                                                           // 1677
      }, 10000);                                                                                                       // 1678
    },                                                                                                                 // 1679
                                                                                                                       // 1680
    function (test, expect) {                                                                                          // 1681
      var self = this;                                                                                                 // 1682
      if (self.conn.status().connected) {                                                                              // 1683
        self.miniC = new Meteor.Collection("ServerMinimongo_" + self.id, {                                             // 1684
          connection: self.conn                                                                                        // 1685
        });                                                                                                            // 1686
        var exp = expect(function (err) {                                                                              // 1687
          test.isFalse(err);                                                                                           // 1688
        });                                                                                                            // 1689
        self.conn.subscribe(self.id, {                                                                                 // 1690
          onError: exp,                                                                                                // 1691
          onReady: exp                                                                                                 // 1692
        });                                                                                                            // 1693
      }                                                                                                                // 1694
    },                                                                                                                 // 1695
                                                                                                                       // 1696
    function (test, expect) {                                                                                          // 1697
      var self = this;                                                                                                 // 1698
      if (self.miniC) {                                                                                                // 1699
        var contents = self.miniC.find().fetch();                                                                      // 1700
        test.equal(contents.length, 2);                                                                                // 1701
        test.equal(contents[0].a, 0);                                                                                  // 1702
      }                                                                                                                // 1703
    },                                                                                                                 // 1704
                                                                                                                       // 1705
    function (test, expect) {                                                                                          // 1706
      var self = this;                                                                                                 // 1707
      if (!self.miniC)                                                                                                 // 1708
        return;                                                                                                        // 1709
      self.miniC.insert({a:0, b:3});                                                                                   // 1710
      var contents = self.miniC.find({b:3}).fetch();                                                                   // 1711
      test.equal(contents.length, 1);                                                                                  // 1712
      test.equal(contents[0].a, 0);                                                                                    // 1713
    }                                                                                                                  // 1714
  ]);                                                                                                                  // 1715
                                                                                                                       // 1716
  testAsyncMulti("mongo-livedata - minimongo observe on server", [                                                     // 1717
    function (test, expect) {                                                                                          // 1718
      var self = this;                                                                                                 // 1719
      self.id = Random.id();                                                                                           // 1720
      self.C = new Meteor.Collection("ServerMinimongoObserve_" + self.id);                                             // 1721
      self.events = [];                                                                                                // 1722
                                                                                                                       // 1723
      Meteor.publish(self.id, function () {                                                                            // 1724
        return self.C.find();                                                                                          // 1725
      });                                                                                                              // 1726
                                                                                                                       // 1727
      self.conn = DDP.connect(Meteor.absoluteUrl());                                                                   // 1728
      pollUntil(expect, function () {                                                                                  // 1729
        return self.conn.status().connected;                                                                           // 1730
      }, 10000);                                                                                                       // 1731
    },                                                                                                                 // 1732
                                                                                                                       // 1733
    function (test, expect) {                                                                                          // 1734
      var self = this;                                                                                                 // 1735
      if (self.conn.status().connected) {                                                                              // 1736
        self.miniC = new Meteor.Collection("ServerMinimongoObserve_" + self.id, {                                      // 1737
          connection: self.conn                                                                                        // 1738
        });                                                                                                            // 1739
        var exp = expect(function (err) {                                                                              // 1740
          test.isFalse(err);                                                                                           // 1741
        });                                                                                                            // 1742
        self.conn.subscribe(self.id, {                                                                                 // 1743
          onError: exp,                                                                                                // 1744
          onReady: exp                                                                                                 // 1745
        });                                                                                                            // 1746
      }                                                                                                                // 1747
    },                                                                                                                 // 1748
                                                                                                                       // 1749
    function (test, expect) {                                                                                          // 1750
      var self = this;                                                                                                 // 1751
      if (self.miniC) {                                                                                                // 1752
        self.obs = self.miniC.find().observeChanges({                                                                  // 1753
          added: function (id, fields) {                                                                               // 1754
            self.events.push({evt: "a", id: id});                                                                      // 1755
            Meteor._sleepForMs(200);                                                                                   // 1756
            self.events.push({evt: "b", id: id});                                                                      // 1757
          }                                                                                                            // 1758
        });                                                                                                            // 1759
        self.one = self.C.insert({});                                                                                  // 1760
        self.two = self.C.insert({});                                                                                  // 1761
        pollUntil(expect, function () {                                                                                // 1762
          return self.events.length === 4;                                                                             // 1763
        }, 10000);                                                                                                     // 1764
      }                                                                                                                // 1765
    },                                                                                                                 // 1766
                                                                                                                       // 1767
    function (test, expect) {                                                                                          // 1768
      var self = this;                                                                                                 // 1769
      if (self.miniC) {                                                                                                // 1770
        test.equal(self.events, [                                                                                      // 1771
          {evt: "a", id: self.one},                                                                                    // 1772
          {evt: "b", id: self.one},                                                                                    // 1773
          {evt: "a", id: self.two},                                                                                    // 1774
          {evt: "b", id: self.two}                                                                                     // 1775
        ]);                                                                                                            // 1776
      }                                                                                                                // 1777
      self.obs && self.obs.stop();                                                                                     // 1778
    }                                                                                                                  // 1779
  ]);                                                                                                                  // 1780
}                                                                                                                      // 1781
                                                                                                                       // 1782
Tinytest.addAsync("mongo-livedata - local collections with different connections", function (test, onComplete) {       // 1783
  var cname = Random.id();                                                                                             // 1784
  var cname2 = Random.id();                                                                                            // 1785
  var coll1 = new Meteor.Collection(cname);                                                                            // 1786
  var doc = { foo: "bar" };                                                                                            // 1787
  var coll2 = new Meteor.Collection(cname2, { connection: null });                                                     // 1788
  coll2.insert(doc, function (err, id) {                                                                               // 1789
    test.equal(coll1.find(doc).count(), 0);                                                                            // 1790
    test.equal(coll2.find(doc).count(), 1);                                                                            // 1791
    onComplete();                                                                                                      // 1792
  });                                                                                                                  // 1793
});                                                                                                                    // 1794
                                                                                                                       // 1795
Tinytest.addAsync("mongo-livedata - local collection with null connection, w/ callback", function (test, onComplete) { // 1796
  var cname = Random.id();                                                                                             // 1797
  var coll1 = new Meteor.Collection(cname, { connection: null });                                                      // 1798
  var doc = { foo: "bar" };                                                                                            // 1799
  var docId = coll1.insert(doc, function (err, id) {                                                                   // 1800
    test.equal(docId, id);                                                                                             // 1801
    test.equal(coll1.findOne(doc)._id, id);                                                                            // 1802
    onComplete();                                                                                                      // 1803
  });                                                                                                                  // 1804
});                                                                                                                    // 1805
                                                                                                                       // 1806
Tinytest.addAsync("mongo-livedata - local collection with null connection, w/o callback", function (test, onComplete) {
  var cname = Random.id();                                                                                             // 1808
  var coll1 = new Meteor.Collection(cname, { connection: null });                                                      // 1809
  var doc = { foo: "bar" };                                                                                            // 1810
  var docId = coll1.insert(doc);                                                                                       // 1811
  test.equal(coll1.findOne(doc)._id, docId);                                                                           // 1812
  onComplete();                                                                                                        // 1813
});                                                                                                                    // 1814
                                                                                                                       // 1815
testAsyncMulti("mongo-livedata - update handles $push with $each correctly", [                                         // 1816
  function (test, expect) {                                                                                            // 1817
    var self = this;                                                                                                   // 1818
    var collectionName = Random.id();                                                                                  // 1819
    if (Meteor.isClient) {                                                                                             // 1820
      Meteor.call('createInsecureCollection', collectionName);                                                         // 1821
      Meteor.subscribe('c-' + collectionName);                                                                         // 1822
    }                                                                                                                  // 1823
                                                                                                                       // 1824
    self.collection = new Meteor.Collection(collectionName);                                                           // 1825
                                                                                                                       // 1826
    self.id = self.collection.insert(                                                                                  // 1827
      {name: 'jens', elements: ['X', 'Y']}, expect(function (err, res) {                                               // 1828
        test.isFalse(err);                                                                                             // 1829
        test.equal(self.id, res);                                                                                      // 1830
        }));                                                                                                           // 1831
  },                                                                                                                   // 1832
  function (test, expect) {                                                                                            // 1833
    var self = this;                                                                                                   // 1834
    self.collection.update(self.id, {                                                                                  // 1835
      $push: {                                                                                                         // 1836
        elements: {                                                                                                    // 1837
          $each: ['A', 'B', 'C'],                                                                                      // 1838
          $slice: -4                                                                                                   // 1839
        }}}, expect(function (err, res) {                                                                              // 1840
          test.isFalse(err);                                                                                           // 1841
          test.equal(                                                                                                  // 1842
            self.collection.findOne(self.id),                                                                          // 1843
            {_id: self.id, name: 'jens', elements: ['Y', 'A', 'B', 'C']});                                             // 1844
        }));                                                                                                           // 1845
  }                                                                                                                    // 1846
]);                                                                                                                    // 1847
                                                                                                                       // 1848
if (Meteor.isServer) {                                                                                                 // 1849
  Tinytest.add("mongo-livedata - upsert handles $push with $each correctly", function (test) {                         // 1850
    var collection = new Meteor.Collection(Random.id());                                                               // 1851
                                                                                                                       // 1852
    var result = collection.upsert(                                                                                    // 1853
      {name: 'jens'},                                                                                                  // 1854
      {$push: {                                                                                                        // 1855
        elements: {                                                                                                    // 1856
          $each: ['A', 'B', 'C'],                                                                                      // 1857
          $slice: -4                                                                                                   // 1858
        }}});                                                                                                          // 1859
                                                                                                                       // 1860
    test.equal(collection.findOne(result.insertedId),                                                                  // 1861
               {_id: result.insertedId,                                                                                // 1862
                name: 'jens',                                                                                          // 1863
                elements: ['A', 'B', 'C']});                                                                           // 1864
                                                                                                                       // 1865
    var id = collection.insert({name: "david", elements: ['X', 'Y']});                                                 // 1866
    result = collection.upsert(                                                                                        // 1867
      {name: 'david'},                                                                                                 // 1868
      {$push: {                                                                                                        // 1869
        elements: {                                                                                                    // 1870
          $each: ['A', 'B', 'C'],                                                                                      // 1871
          $slice: -4                                                                                                   // 1872
        }}});                                                                                                          // 1873
                                                                                                                       // 1874
    test.equal(collection.findOne(id),                                                                                 // 1875
               {_id: id,                                                                                               // 1876
                name: 'david',                                                                                         // 1877
                elements: ['Y', 'A', 'B', 'C']});                                                                      // 1878
  });                                                                                                                  // 1879
}                                                                                                                      // 1880
                                                                                                                       // 1881
// This is a VERY white-box test.                                                                                      // 1882
Meteor.isServer && Tinytest.add("mongo-livedata - oplog - _disableOplog", function (test) {                            // 1883
  var collName = Random.id();                                                                                          // 1884
  var coll = new Meteor.Collection(collName);                                                                          // 1885
  if (MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle) {                                             // 1886
    var observeWithOplog = coll.find({x: 5})                                                                           // 1887
          .observeChanges({added: function () {}});                                                                    // 1888
    test.isTrue(observeWithOplog._observeDriver);                                                                      // 1889
    test.isTrue(observeWithOplog._observeDriver._usesOplog);                                                           // 1890
    observeWithOplog.stop();                                                                                           // 1891
  }                                                                                                                    // 1892
  var observeWithoutOplog = coll.find({x: 6}, {_disableOplog: true})                                                   // 1893
        .observeChanges({added: function () {}});                                                                      // 1894
  test.isTrue(observeWithoutOplog._observeDriver);                                                                     // 1895
  test.isFalse(observeWithoutOplog._observeDriver._usesOplog);                                                         // 1896
  observeWithoutOplog.stop();                                                                                          // 1897
});                                                                                                                    // 1898
                                                                                                                       // 1899
Meteor.isServer && Tinytest.add("mongo-livedata - oplog - include selector fields", function (test) {                  // 1900
  var collName = "includeSelector" + Random.id();                                                                      // 1901
  var coll = new Meteor.Collection(collName);                                                                          // 1902
                                                                                                                       // 1903
  var docId = coll.insert({a: 1, b: [3, 2], c: 'foo'});                                                                // 1904
  test.isTrue(docId);                                                                                                  // 1905
                                                                                                                       // 1906
  // Wait until we've processed the insert oplog entry. (If the insert shows up                                        // 1907
  // during the observeChanges, the bug in question is not consistently                                                // 1908
  // reproduced.) We don't have to do this for polling observe (eg                                                     // 1909
  // --disable-oplog).                                                                                                 // 1910
  var oplog = MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle;                                       // 1911
  oplog && oplog.waitUntilCaughtUp();                                                                                  // 1912
                                                                                                                       // 1913
  var output = [];                                                                                                     // 1914
  var handle = coll.find({a: 1, b: 2}, {fields: {c: 1}}).observeChanges({                                              // 1915
    added: function (id, fields) {                                                                                     // 1916
      output.push(['added', id, fields]);                                                                              // 1917
    },                                                                                                                 // 1918
    changed: function (id, fields) {                                                                                   // 1919
      output.push(['changed', id, fields]);                                                                            // 1920
    },                                                                                                                 // 1921
    removed: function (id) {                                                                                           // 1922
      output.push(['removed', id]);                                                                                    // 1923
    }                                                                                                                  // 1924
  });                                                                                                                  // 1925
  // Initially should match the document.                                                                              // 1926
  test.length(output, 1);                                                                                              // 1927
  test.equal(output.shift(), ['added', docId, {c: 'foo'}]);                                                            // 1928
                                                                                                                       // 1929
  // Update in such a way that, if we only knew about the published field 'c'                                          // 1930
  // and the changed field 'b' (but not the field 'a'), we would think it didn't                                       // 1931
  // match any more.  (This is a regression test for a bug that existed because                                        // 1932
  // we used to not use the shared projection in the initial query.)                                                   // 1933
  runInFence(function () {                                                                                             // 1934
    coll.update(docId, {$set: {'b.0': 2, c: 'bar'}});                                                                  // 1935
  });                                                                                                                  // 1936
  test.length(output, 1);                                                                                              // 1937
  test.equal(output.shift(), ['changed', docId, {c: 'bar'}]);                                                          // 1938
                                                                                                                       // 1939
  handle.stop();                                                                                                       // 1940
});                                                                                                                    // 1941
                                                                                                                       // 1942
Meteor.isServer && Tinytest.add("mongo-livedata - oplog - transform", function (test) {                                // 1943
  var collName = "oplogTransform" + Random.id();                                                                       // 1944
  var coll = new Meteor.Collection(collName);                                                                          // 1945
                                                                                                                       // 1946
  var docId = coll.insert({a: 25, x: {x: 5, y: 9}});                                                                   // 1947
  test.isTrue(docId);                                                                                                  // 1948
                                                                                                                       // 1949
  // Wait until we've processed the insert oplog entry. (If the insert shows up                                        // 1950
  // during the observeChanges, the bug in question is not consistently                                                // 1951
  // reproduced.) We don't have to do this for polling observe (eg                                                     // 1952
  // --disable-oplog).                                                                                                 // 1953
  var oplog = MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle;                                       // 1954
  oplog && oplog.waitUntilCaughtUp();                                                                                  // 1955
                                                                                                                       // 1956
  var cursor = coll.find({}, {transform: function (doc) {                                                              // 1957
    return doc.x;                                                                                                      // 1958
  }});                                                                                                                 // 1959
                                                                                                                       // 1960
  var changesOutput = [];                                                                                              // 1961
  var changesHandle = cursor.observeChanges({                                                                          // 1962
    added: function (id, fields) {                                                                                     // 1963
      changesOutput.push(['added', fields]);                                                                           // 1964
    }                                                                                                                  // 1965
  });                                                                                                                  // 1966
  // We should get untransformed fields via observeChanges.                                                            // 1967
  test.length(changesOutput, 1);                                                                                       // 1968
  test.equal(changesOutput.shift(), ['added', {a: 25, x: {x: 5, y: 9}}]);                                              // 1969
  changesHandle.stop();                                                                                                // 1970
                                                                                                                       // 1971
  var transformedOutput = [];                                                                                          // 1972
  var transformedHandle = cursor.observe({                                                                             // 1973
    added: function (doc) {                                                                                            // 1974
      transformedOutput.push(['added', doc]);                                                                          // 1975
    }                                                                                                                  // 1976
  });                                                                                                                  // 1977
  test.length(transformedOutput, 1);                                                                                   // 1978
  test.equal(transformedOutput.shift(), ['added', {x: 5, y: 9}]);                                                      // 1979
  transformedHandle.stop();                                                                                            // 1980
});                                                                                                                    // 1981
                                                                                                                       // 1982
                                                                                                                       // 1983
Meteor.isServer && Tinytest.add("mongo-livedata - oplog - drop collection", function (test) {                          // 1984
  var collName = "dropCollection" + Random.id();                                                                       // 1985
  var coll = new Meteor.Collection(collName);                                                                          // 1986
                                                                                                                       // 1987
  var doc1Id = coll.insert({a: 'foo', c: 1});                                                                          // 1988
  var doc2Id = coll.insert({b: 'bar'});                                                                                // 1989
  var doc3Id = coll.insert({a: 'foo', c: 2});                                                                          // 1990
  var tmp;                                                                                                             // 1991
                                                                                                                       // 1992
  var output = [];                                                                                                     // 1993
  var handle = coll.find({a: 'foo'}).observeChanges({                                                                  // 1994
    added: function (id, fields) {                                                                                     // 1995
      output.push(['added', id, fields]);                                                                              // 1996
    },                                                                                                                 // 1997
    changed: function (id) {                                                                                           // 1998
      output.push(['changed']);                                                                                        // 1999
    },                                                                                                                 // 2000
    removed: function (id) {                                                                                           // 2001
      output.push(['removed', id]);                                                                                    // 2002
    }                                                                                                                  // 2003
  });                                                                                                                  // 2004
  test.length(output, 2);                                                                                              // 2005
  // make order consistent                                                                                             // 2006
  if (output.length === 2 && output[0][1] === doc3Id) {                                                                // 2007
    tmp = output[0];                                                                                                   // 2008
    output[0] = output[1];                                                                                             // 2009
    output[1] = tmp;                                                                                                   // 2010
  }                                                                                                                    // 2011
  test.equal(output.shift(), ['added', doc1Id, {a: 'foo', c: 1}]);                                                     // 2012
  test.equal(output.shift(), ['added', doc3Id, {a: 'foo', c: 2}]);                                                     // 2013
                                                                                                                       // 2014
  // Wait until we've processed the insert oplog entry, so that we are in a                                            // 2015
  // steady state (and we don't see the dropped docs because we are FETCHING).                                         // 2016
  var oplog = MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle;                                       // 2017
  oplog && oplog.waitUntilCaughtUp();                                                                                  // 2018
                                                                                                                       // 2019
  // Drop the collection. Should remove all docs.                                                                      // 2020
  runInFence(function () {                                                                                             // 2021
    coll._dropCollection();                                                                                            // 2022
  });                                                                                                                  // 2023
                                                                                                                       // 2024
  test.length(output, 2);                                                                                              // 2025
  // make order consistent                                                                                             // 2026
  if (output.length === 2 && output[0][1] === doc3Id) {                                                                // 2027
    tmp = output[0];                                                                                                   // 2028
    output[0] = output[1];                                                                                             // 2029
    output[1] = tmp;                                                                                                   // 2030
  }                                                                                                                    // 2031
  test.equal(output.shift(), ['removed', doc1Id]);                                                                     // 2032
  test.equal(output.shift(), ['removed', doc3Id]);                                                                     // 2033
                                                                                                                       // 2034
  // Put something back in.                                                                                            // 2035
  var doc4Id;                                                                                                          // 2036
  runInFence(function () {                                                                                             // 2037
    doc4Id = coll.insert({a: 'foo', c: 3});                                                                            // 2038
  });                                                                                                                  // 2039
                                                                                                                       // 2040
  test.length(output, 1);                                                                                              // 2041
  test.equal(output.shift(), ['added', doc4Id, {a: 'foo', c: 3}]);                                                     // 2042
                                                                                                                       // 2043
  handle.stop();                                                                                                       // 2044
});                                                                                                                    // 2045
                                                                                                                       // 2046
var TestCustomType = function (head, tail) {                                                                           // 2047
  // use different field names on the object than in JSON, to ensure we are                                            // 2048
  // actually treating this as an opaque object.                                                                       // 2049
  this.myHead = head;                                                                                                  // 2050
  this.myTail = tail;                                                                                                  // 2051
};                                                                                                                     // 2052
_.extend(TestCustomType.prototype, {                                                                                   // 2053
  clone: function () {                                                                                                 // 2054
    return new TestCustomType(this.myHead, this.myTail);                                                               // 2055
  },                                                                                                                   // 2056
  equals: function (other) {                                                                                           // 2057
    return other instanceof TestCustomType                                                                             // 2058
      && EJSON.equals(this.myHead, other.myHead)                                                                       // 2059
      && EJSON.equals(this.myTail, other.myTail);                                                                      // 2060
  },                                                                                                                   // 2061
  typeName: function () {                                                                                              // 2062
    return 'someCustomType';                                                                                           // 2063
  },                                                                                                                   // 2064
  toJSONValue: function () {                                                                                           // 2065
    return {head: this.myHead, tail: this.myTail};                                                                     // 2066
  }                                                                                                                    // 2067
});                                                                                                                    // 2068
                                                                                                                       // 2069
EJSON.addType('someCustomType', function (json) {                                                                      // 2070
  return new TestCustomType(json.head, json.tail);                                                                     // 2071
});                                                                                                                    // 2072
                                                                                                                       // 2073
testAsyncMulti("mongo-livedata - oplog - update EJSON", [                                                              // 2074
  function (test, expect) {                                                                                            // 2075
    var self = this;                                                                                                   // 2076
    var collectionName = "ejson" + Random.id();                                                                        // 2077
    if (Meteor.isClient) {                                                                                             // 2078
      Meteor.call('createInsecureCollection', collectionName);                                                         // 2079
      Meteor.subscribe('c-' + collectionName);                                                                         // 2080
    }                                                                                                                  // 2081
                                                                                                                       // 2082
    self.collection = new Meteor.Collection(collectionName);                                                           // 2083
    self.date = new Date;                                                                                              // 2084
    self.objId = new Meteor.Collection.ObjectID;                                                                       // 2085
                                                                                                                       // 2086
    self.id = self.collection.insert(                                                                                  // 2087
      {d: self.date, oi: self.objId,                                                                                   // 2088
       custom: new TestCustomType('a', 'b')},                                                                          // 2089
      expect(function (err, res) {                                                                                     // 2090
        test.isFalse(err);                                                                                             // 2091
        test.equal(self.id, res);                                                                                      // 2092
      }));                                                                                                             // 2093
  },                                                                                                                   // 2094
  function (test, expect) {                                                                                            // 2095
    var self = this;                                                                                                   // 2096
    self.changes = [];                                                                                                 // 2097
    self.handle = self.collection.find({}).observeChanges({                                                            // 2098
      added: function (id, fields) {                                                                                   // 2099
        self.changes.push(['a', id, fields]);                                                                          // 2100
      },                                                                                                               // 2101
      changed: function (id, fields) {                                                                                 // 2102
        self.changes.push(['c', id, fields]);                                                                          // 2103
      },                                                                                                               // 2104
      removed: function (id) {                                                                                         // 2105
        self.changes.push(['r', id]);                                                                                  // 2106
      }                                                                                                                // 2107
    });                                                                                                                // 2108
    test.length(self.changes, 1);                                                                                      // 2109
    test.equal(self.changes.shift(),                                                                                   // 2110
               ['a', self.id,                                                                                          // 2111
                {d: self.date, oi: self.objId,                                                                         // 2112
                 custom: new TestCustomType('a', 'b')}]);                                                              // 2113
                                                                                                                       // 2114
    // First, replace the entire custom object.                                                                        // 2115
    // (runInFence is useful for the server, using expect() is useful for the                                          // 2116
    // client)                                                                                                         // 2117
    runInFence(function () {                                                                                           // 2118
      self.collection.update(                                                                                          // 2119
        self.id, {$set: {custom: new TestCustomType('a', 'c')}},                                                       // 2120
        expect(function (err) {                                                                                        // 2121
          test.isFalse(err);                                                                                           // 2122
        }));                                                                                                           // 2123
    });                                                                                                                // 2124
  },                                                                                                                   // 2125
  function (test, expect) {                                                                                            // 2126
    var self = this;                                                                                                   // 2127
    test.length(self.changes, 1);                                                                                      // 2128
    test.equal(self.changes.shift(),                                                                                   // 2129
               ['c', self.id, {custom: new TestCustomType('a', 'c')}]);                                                // 2130
                                                                                                                       // 2131
    // Now, sneakily replace just a piece of it. Meteor won't do this, but                                             // 2132
    // perhaps you are accessing Mongo directly.                                                                       // 2133
    runInFence(function () {                                                                                           // 2134
      self.collection.update(                                                                                          // 2135
        self.id, {$set: {'custom.EJSON$value.EJSONtail': 'd'}},                                                        // 2136
      expect(function (err) {                                                                                          // 2137
        test.isFalse(err);                                                                                             // 2138
      }));                                                                                                             // 2139
    });                                                                                                                // 2140
  },                                                                                                                   // 2141
  function (test, expect) {                                                                                            // 2142
    var self = this;                                                                                                   // 2143
    test.length(self.changes, 1);                                                                                      // 2144
    test.equal(self.changes.shift(),                                                                                   // 2145
               ['c', self.id, {custom: new TestCustomType('a', 'd')}]);                                                // 2146
                                                                                                                       // 2147
    // Update a date and an ObjectID too.                                                                              // 2148
    self.date2 = new Date(self.date.valueOf() + 1000);                                                                 // 2149
    self.objId2 = new Meteor.Collection.ObjectID;                                                                      // 2150
    runInFence(function () {                                                                                           // 2151
      self.collection.update(                                                                                          // 2152
        self.id, {$set: {d: self.date2, oi: self.objId2}},                                                             // 2153
      expect(function (err) {                                                                                          // 2154
        test.isFalse(err);                                                                                             // 2155
      }));                                                                                                             // 2156
    });                                                                                                                // 2157
  },                                                                                                                   // 2158
  function (test, expect) {                                                                                            // 2159
    var self = this;                                                                                                   // 2160
    test.length(self.changes, 1);                                                                                      // 2161
    test.equal(self.changes.shift(),                                                                                   // 2162
               ['c', self.id, {d: self.date2, oi: self.objId2}]);                                                      // 2163
                                                                                                                       // 2164
    self.handle.stop();                                                                                                // 2165
  }                                                                                                                    // 2166
]);                                                                                                                    // 2167
                                                                                                                       // 2168
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo-livedata/allow_tests.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
if (Meteor.isServer) {                                                                                                 // 1
  // Set up allow/deny rules for test collections                                                                      // 2
                                                                                                                       // 3
  var allowCollections = {};                                                                                           // 4
                                                                                                                       // 5
  // We create the collections in the publisher (instead of using a method or                                          // 6
  // something) because if we made them with a method, we'd need to follow the                                         // 7
  // method with some subscribes, and it's possible that the method call would                                         // 8
  // be delayed by a wait method and the subscribe messages would be sent before                                       // 9
  // it and fail due to the collection not yet existing. So we are very hacky                                          // 10
  // and use a publish.                                                                                                // 11
  Meteor.publish("allowTests", function (nonce, idGeneration) {                                                        // 12
    check(nonce, String);                                                                                              // 13
    check(idGeneration, String);                                                                                       // 14
    var cursors = [];                                                                                                  // 15
    var needToConfigure = undefined;                                                                                   // 16
                                                                                                                       // 17
    // helper for defining a collection. we are careful to create just one                                             // 18
    // Meteor.Collection even if the sub body is rerun, by caching them.                                               // 19
    var defineCollection = function(name, insecure, transform) {                                                       // 20
      var fullName = name + idGeneration + nonce;                                                                      // 21
                                                                                                                       // 22
      var collection;                                                                                                  // 23
      if (_.has(allowCollections, fullName)) {                                                                         // 24
        collection = allowCollections[fullName];                                                                       // 25
        if (needToConfigure === true)                                                                                  // 26
          throw new Error("collections inconsistently exist");                                                         // 27
        needToConfigure = false;                                                                                       // 28
      } else {                                                                                                         // 29
        collection = new Meteor.Collection(                                                                            // 30
          fullName, {idGeneration: idGeneration, transform: transform});                                               // 31
        allowCollections[fullName] = collection;                                                                       // 32
        if (needToConfigure === false)                                                                                 // 33
          throw new Error("collections inconsistently don't exist");                                                   // 34
        needToConfigure = true;                                                                                        // 35
        collection._insecure = insecure;                                                                               // 36
        var m = {};                                                                                                    // 37
        m["clear-collection-" + fullName] = function() {                                                               // 38
          collection.remove({});                                                                                       // 39
        };                                                                                                             // 40
        Meteor.methods(m);                                                                                             // 41
      }                                                                                                                // 42
                                                                                                                       // 43
      cursors.push(collection.find());                                                                                 // 44
      return collection;                                                                                               // 45
    };                                                                                                                 // 46
                                                                                                                       // 47
    var insecureCollection = defineCollection(                                                                         // 48
      "collection-insecure", true /*insecure*/);                                                                       // 49
    // totally locked down collection                                                                                  // 50
    var lockedDownCollection = defineCollection(                                                                       // 51
      "collection-locked-down", false /*insecure*/);                                                                   // 52
    // resticted collection with same allowed modifications, both with and                                             // 53
    // without the `insecure` package                                                                                  // 54
    var restrictedCollectionDefaultSecure = defineCollection(                                                          // 55
      "collection-restrictedDefaultSecure", false /*insecure*/);                                                       // 56
    var restrictedCollectionDefaultInsecure = defineCollection(                                                        // 57
      "collection-restrictedDefaultInsecure", true /*insecure*/);                                                      // 58
    var restrictedCollectionForUpdateOptionsTest = defineCollection(                                                   // 59
      "collection-restrictedForUpdateOptionsTest", true /*insecure*/);                                                 // 60
    var restrictedCollectionForPartialAllowTest = defineCollection(                                                    // 61
      "collection-restrictedForPartialAllowTest", true /*insecure*/);                                                  // 62
    var restrictedCollectionForPartialDenyTest = defineCollection(                                                     // 63
      "collection-restrictedForPartialDenyTest", true /*insecure*/);                                                   // 64
    var restrictedCollectionForFetchTest = defineCollection(                                                           // 65
      "collection-restrictedForFetchTest", true /*insecure*/);                                                         // 66
    var restrictedCollectionForFetchAllTest = defineCollection(                                                        // 67
      "collection-restrictedForFetchAllTest", true /*insecure*/);                                                      // 68
    var restrictedCollectionWithTransform = defineCollection(                                                          // 69
      "withTransform", false, function (doc) {                                                                         // 70
        return doc.a;                                                                                                  // 71
      });                                                                                                              // 72
                                                                                                                       // 73
    if (needToConfigure) {                                                                                             // 74
      restrictedCollectionWithTransform.allow({                                                                        // 75
        insert: function (userId, doc) {                                                                               // 76
          return doc.foo === "foo";                                                                                    // 77
        },                                                                                                             // 78
        update: function (userId, doc) {                                                                               // 79
          return doc.foo === "foo";                                                                                    // 80
        },                                                                                                             // 81
        remove: function (userId, doc) {                                                                               // 82
          return doc.bar === "bar";                                                                                    // 83
        }                                                                                                              // 84
      });                                                                                                              // 85
      restrictedCollectionWithTransform.allow({                                                                        // 86
        // transform: null means that doc here is the top level, not the 'a'                                           // 87
        // element.                                                                                                    // 88
        transform: null,                                                                                               // 89
        insert: function (userId, doc) {                                                                               // 90
          return !!doc.topLevelField;                                                                                  // 91
        }                                                                                                              // 92
      });                                                                                                              // 93
                                                                                                                       // 94
      // two calls to allow to verify that either validator is sufficient.                                             // 95
      var allows = [{                                                                                                  // 96
        insert: function(userId, doc) {                                                                                // 97
          return doc.canInsert;                                                                                        // 98
        },                                                                                                             // 99
        update: function(userId, doc) {                                                                                // 100
          return doc.canUpdate;                                                                                        // 101
        },                                                                                                             // 102
        remove: function (userId, doc) {                                                                               // 103
          return doc.canRemove;                                                                                        // 104
        }                                                                                                              // 105
      }, {                                                                                                             // 106
        insert: function(userId, doc) {                                                                                // 107
          return doc.canInsert2;                                                                                       // 108
        },                                                                                                             // 109
        update: function(userId, doc, fields, modifier) {                                                              // 110
          return -1 !== _.indexOf(fields, 'canUpdate2');                                                               // 111
        },                                                                                                             // 112
        remove: function(userId, doc) {                                                                                // 113
          return doc.canRemove2;                                                                                       // 114
        }                                                                                                              // 115
      }];                                                                                                              // 116
                                                                                                                       // 117
      // two calls to deny to verify that either one blocks the change.                                                // 118
      var denies = [{                                                                                                  // 119
        insert: function(userId, doc) {                                                                                // 120
          return doc.cantInsert;                                                                                       // 121
        },                                                                                                             // 122
        remove: function (userId, doc) {                                                                               // 123
          return doc.cantRemove;                                                                                       // 124
        }                                                                                                              // 125
      }, {                                                                                                             // 126
        insert: function(userId, doc) {                                                                                // 127
          return doc.cantInsert2;                                                                                      // 128
        },                                                                                                             // 129
        update: function(userId, doc, fields, modifier) {                                                              // 130
          return -1 !== _.indexOf(fields, 'verySecret');                                                               // 131
        }                                                                                                              // 132
      }];                                                                                                              // 133
                                                                                                                       // 134
      _.each([                                                                                                         // 135
        restrictedCollectionDefaultSecure,                                                                             // 136
        restrictedCollectionDefaultInsecure,                                                                           // 137
        restrictedCollectionForUpdateOptionsTest                                                                       // 138
      ], function (collection) {                                                                                       // 139
        _.each(allows, function (allow) {                                                                              // 140
          collection.allow(allow);                                                                                     // 141
        });                                                                                                            // 142
        _.each(denies, function (deny) {                                                                               // 143
          collection.deny(deny);                                                                                       // 144
        });                                                                                                            // 145
      });                                                                                                              // 146
                                                                                                                       // 147
      // just restrict one operation so that we can verify that others                                                 // 148
      // fail                                                                                                          // 149
      restrictedCollectionForPartialAllowTest.allow({                                                                  // 150
        insert: function() {}                                                                                          // 151
      });                                                                                                              // 152
      restrictedCollectionForPartialDenyTest.deny({                                                                    // 153
        insert: function() {}                                                                                          // 154
      });                                                                                                              // 155
                                                                                                                       // 156
      // verify that we only fetch the fields specified - we should                                                    // 157
      // be fetching just field1, field2, and field3.                                                                  // 158
      restrictedCollectionForFetchTest.allow({                                                                         // 159
        insert: function() { return true; },                                                                           // 160
        update: function(userId, doc) {                                                                                // 161
          // throw fields in doc so that we can inspect them in test                                                   // 162
          throw new Meteor.Error(                                                                                      // 163
            999, "Test: Fields in doc: " + _.keys(doc).join(','));                                                     // 164
        },                                                                                                             // 165
        remove: function(userId, doc) {                                                                                // 166
          // throw fields in doc so that we can inspect them in test                                                   // 167
          throw new Meteor.Error(                                                                                      // 168
            999, "Test: Fields in doc: " + _.keys(doc).join(','));                                                     // 169
        },                                                                                                             // 170
        fetch: ['field1']                                                                                              // 171
      });                                                                                                              // 172
      restrictedCollectionForFetchTest.allow({                                                                         // 173
        fetch: ['field2']                                                                                              // 174
      });                                                                                                              // 175
      restrictedCollectionForFetchTest.deny({                                                                          // 176
        fetch: ['field3']                                                                                              // 177
      });                                                                                                              // 178
                                                                                                                       // 179
      // verify that not passing fetch to one of the calls to allow                                                    // 180
      // causes all fields to be fetched                                                                               // 181
      restrictedCollectionForFetchAllTest.allow({                                                                      // 182
        insert: function() { return true; },                                                                           // 183
        update: function(userId, doc) {                                                                                // 184
          // throw fields in doc so that we can inspect them in test                                                   // 185
          throw new Meteor.Error(                                                                                      // 186
            999, "Test: Fields in doc: " + _.keys(doc).join(','));                                                     // 187
        },                                                                                                             // 188
        remove: function(userId, doc) {                                                                                // 189
          // throw fields in doc so that we can inspect them in test                                                   // 190
          throw new Meteor.Error(                                                                                      // 191
            999, "Test: Fields in doc: " + _.keys(doc).join(','));                                                     // 192
        },                                                                                                             // 193
        fetch: ['field1']                                                                                              // 194
      });                                                                                                              // 195
      restrictedCollectionForFetchAllTest.allow({                                                                      // 196
        update: function() { return true; }                                                                            // 197
      });                                                                                                              // 198
    }                                                                                                                  // 199
                                                                                                                       // 200
    return cursors;                                                                                                    // 201
  });                                                                                                                  // 202
}                                                                                                                      // 203
                                                                                                                       // 204
if (Meteor.isClient) {                                                                                                 // 205
  _.each(['STRING', 'MONGO'], function (idGeneration) {                                                                // 206
    // Set up a bunch of test collections... on the client! They match the ones                                        // 207
    // created by setUpAllowTestsCollections.                                                                          // 208
                                                                                                                       // 209
    var nonce = Random.id();                                                                                           // 210
    // Tell the server to make, configure, and publish a set of collections unique                                     // 211
    // to our test run. Since the method does not unblock, this will complete                                          // 212
    // running on the server before anything else happens.                                                             // 213
    Meteor.subscribe('allowTests', nonce, idGeneration);                                                               // 214
                                                                                                                       // 215
    // helper for defining a collection, subscribing to it, and defining                                               // 216
    // a method to clear it                                                                                            // 217
    var defineCollection = function(name, transform) {                                                                 // 218
      var fullName = name + idGeneration + nonce;                                                                      // 219
      var collection = new Meteor.Collection(                                                                          // 220
        fullName, {idGeneration: idGeneration, transform: transform});                                                 // 221
                                                                                                                       // 222
      collection.callClearMethod = function (callback) {                                                               // 223
        Meteor.call("clear-collection-" + fullName, callback);                                                         // 224
      };                                                                                                               // 225
      collection.unnoncedName = name + idGeneration;                                                                   // 226
      return collection;                                                                                               // 227
    };                                                                                                                 // 228
                                                                                                                       // 229
    // totally insecure collection                                                                                     // 230
    var insecureCollection = defineCollection("collection-insecure");                                                  // 231
                                                                                                                       // 232
    // totally locked down collection                                                                                  // 233
    var lockedDownCollection = defineCollection("collection-locked-down");                                             // 234
                                                                                                                       // 235
    // resticted collection with same allowed modifications, both with and                                             // 236
    // without the `insecure` package                                                                                  // 237
    var restrictedCollectionDefaultSecure = defineCollection(                                                          // 238
      "collection-restrictedDefaultSecure");                                                                           // 239
    var restrictedCollectionDefaultInsecure = defineCollection(                                                        // 240
      "collection-restrictedDefaultInsecure");                                                                         // 241
    var restrictedCollectionForUpdateOptionsTest = defineCollection(                                                   // 242
      "collection-restrictedForUpdateOptionsTest");                                                                    // 243
    var restrictedCollectionForPartialAllowTest = defineCollection(                                                    // 244
      "collection-restrictedForPartialAllowTest");                                                                     // 245
    var restrictedCollectionForPartialDenyTest = defineCollection(                                                     // 246
      "collection-restrictedForPartialDenyTest");                                                                      // 247
    var restrictedCollectionForFetchTest = defineCollection(                                                           // 248
      "collection-restrictedForFetchTest");                                                                            // 249
    var restrictedCollectionForFetchAllTest = defineCollection(                                                        // 250
      "collection-restrictedForFetchAllTest");                                                                         // 251
    var restrictedCollectionWithTransform = defineCollection(                                                          // 252
      "withTransform", function (doc) {                                                                                // 253
        return doc.a;                                                                                                  // 254
      });                                                                                                              // 255
                                                                                                                       // 256
                                                                                                                       // 257
    // test that if allow is called once then the collection is                                                        // 258
    // restricted, and that other mutations aren't allowed                                                             // 259
    testAsyncMulti("collection - partial allow, " + idGeneration, [                                                    // 260
      function (test, expect) {                                                                                        // 261
        restrictedCollectionForPartialAllowTest.update(                                                                // 262
          'foo', {$set: {updated: true}}, expect(function (err, res) {                                                 // 263
            test.equal(err.error, 403);                                                                                // 264
          }));                                                                                                         // 265
      }                                                                                                                // 266
    ]);                                                                                                                // 267
                                                                                                                       // 268
    // test that if deny is called once then the collection is                                                         // 269
    // restricted, and that other mutations aren't allowed                                                             // 270
    testAsyncMulti("collection - partial deny, " + idGeneration, [                                                     // 271
      function (test, expect) {                                                                                        // 272
        restrictedCollectionForPartialDenyTest.update(                                                                 // 273
          'foo', {$set: {updated: true}}, expect(function (err, res) {                                                 // 274
            test.equal(err.error, 403);                                                                                // 275
          }));                                                                                                         // 276
      }                                                                                                                // 277
    ]);                                                                                                                // 278
                                                                                                                       // 279
                                                                                                                       // 280
    // test that we only fetch the fields specified                                                                    // 281
    testAsyncMulti("collection - fetch, " + idGeneration, [                                                            // 282
      function (test, expect) {                                                                                        // 283
        var fetchId = restrictedCollectionForFetchTest.insert(                                                         // 284
          {field1: 1, field2: 1, field3: 1, field4: 1});                                                               // 285
        var fetchAllId = restrictedCollectionForFetchAllTest.insert(                                                   // 286
          {field1: 1, field2: 1, field3: 1, field4: 1});                                                               // 287
        restrictedCollectionForFetchTest.update(                                                                       // 288
          fetchId, {$set: {updated: true}}, expect(function (err, res) {                                               // 289
            test.equal(err.reason,                                                                                     // 290
                       "Test: Fields in doc: field1,field2,field3,_id");                                               // 291
          }));                                                                                                         // 292
        restrictedCollectionForFetchTest.remove(                                                                       // 293
          fetchId, expect(function (err, res) {                                                                        // 294
            test.equal(err.reason,                                                                                     // 295
                       "Test: Fields in doc: field1,field2,field3,_id");                                               // 296
          }));                                                                                                         // 297
                                                                                                                       // 298
        restrictedCollectionForFetchAllTest.update(                                                                    // 299
          fetchAllId, {$set: {updated: true}}, expect(function (err, res) {                                            // 300
            test.equal(err.reason,                                                                                     // 301
                       "Test: Fields in doc: field1,field2,field3,field4,_id");                                        // 302
          }));                                                                                                         // 303
        restrictedCollectionForFetchAllTest.remove(                                                                    // 304
          fetchAllId, expect(function (err, res) {                                                                     // 305
            test.equal(err.reason,                                                                                     // 306
                       "Test: Fields in doc: field1,field2,field3,field4,_id");                                        // 307
          }));                                                                                                         // 308
      }                                                                                                                // 309
    ]);                                                                                                                // 310
                                                                                                                       // 311
    (function(){                                                                                                       // 312
      var item1;                                                                                                       // 313
      var item2;                                                                                                       // 314
      testAsyncMulti("collection - restricted factories " + idGeneration, [                                            // 315
        function (test, expect) {                                                                                      // 316
          restrictedCollectionWithTransform.callClearMethod(expect(function () {                                       // 317
            test.equal(restrictedCollectionWithTransform.find().count(), 0);                                           // 318
          }));                                                                                                         // 319
        },                                                                                                             // 320
        function (test, expect) {                                                                                      // 321
          restrictedCollectionWithTransform.insert({                                                                   // 322
            a: {foo: "foo", bar: "bar", baz: "baz"}                                                                    // 323
          }, expect(function (e, res) {                                                                                // 324
            test.isFalse(e);                                                                                           // 325
            test.isTrue(res);                                                                                          // 326
            item1 = res;                                                                                               // 327
          }));                                                                                                         // 328
          restrictedCollectionWithTransform.insert({                                                                   // 329
            a: {foo: "foo", bar: "quux", baz: "quux"},                                                                 // 330
            b: "potato"                                                                                                // 331
          }, expect(function (e, res) {                                                                                // 332
            test.isFalse(e);                                                                                           // 333
            test.isTrue(res);                                                                                          // 334
            item2 = res;                                                                                               // 335
          }));                                                                                                         // 336
          restrictedCollectionWithTransform.insert({                                                                   // 337
            a: {foo: "adsfadf", bar: "quux", baz: "quux"},                                                             // 338
            b: "potato"                                                                                                // 339
          }, expect(function (e, res) {                                                                                // 340
            test.isTrue(e);                                                                                            // 341
          }));                                                                                                         // 342
          restrictedCollectionWithTransform.insert({                                                                   // 343
            a: {foo: "bar"},                                                                                           // 344
            topLevelField: true                                                                                        // 345
          }, expect(function (e, res) {                                                                                // 346
            test.isFalse(e);                                                                                           // 347
            test.isTrue(res);                                                                                          // 348
          }));                                                                                                         // 349
        },                                                                                                             // 350
        function (test, expect) {                                                                                      // 351
          test.equal(                                                                                                  // 352
            restrictedCollectionWithTransform.findOne({"a.bar": "bar"}),                                               // 353
            {foo: "foo", bar: "bar", baz: "baz"});                                                                     // 354
          restrictedCollectionWithTransform.remove(item1, expect(function (e, res) {                                   // 355
            test.isFalse(e);                                                                                           // 356
          }));                                                                                                         // 357
          restrictedCollectionWithTransform.remove(item2, expect(function (e, res) {                                   // 358
            test.isTrue(e);                                                                                            // 359
          }));                                                                                                         // 360
        }                                                                                                              // 361
      ]);                                                                                                              // 362
    })();                                                                                                              // 363
                                                                                                                       // 364
    testAsyncMulti("collection - insecure, " + idGeneration, [                                                         // 365
      function (test, expect) {                                                                                        // 366
        insecureCollection.callClearMethod(expect(function () {                                                        // 367
          test.equal(insecureCollection.find().count(), 0);                                                            // 368
        }));                                                                                                           // 369
      },                                                                                                               // 370
      function (test, expect) {                                                                                        // 371
        var id = insecureCollection.insert({foo: 'bar'}, expect(function(err, res) {                                   // 372
          test.equal(res, id);                                                                                         // 373
          test.equal(insecureCollection.find(id).count(), 1);                                                          // 374
          test.equal(insecureCollection.findOne(id).foo, 'bar');                                                       // 375
        }));                                                                                                           // 376
        test.equal(insecureCollection.find(id).count(), 1);                                                            // 377
        test.equal(insecureCollection.findOne(id).foo, 'bar');                                                         // 378
      }                                                                                                                // 379
    ]);                                                                                                                // 380
                                                                                                                       // 381
    testAsyncMulti("collection - locked down, " + idGeneration, [                                                      // 382
      function (test, expect) {                                                                                        // 383
        lockedDownCollection.callClearMethod(expect(function() {                                                       // 384
          test.equal(lockedDownCollection.find().count(), 0);                                                          // 385
        }));                                                                                                           // 386
      },                                                                                                               // 387
      function (test, expect) {                                                                                        // 388
        lockedDownCollection.insert({foo: 'bar'}, expect(function (err, res) {                                         // 389
          test.equal(err.error, 403);                                                                                  // 390
          test.equal(lockedDownCollection.find().count(), 0);                                                          // 391
        }));                                                                                                           // 392
      }                                                                                                                // 393
    ]);                                                                                                                // 394
                                                                                                                       // 395
    (function () {                                                                                                     // 396
      var collection = restrictedCollectionForUpdateOptionsTest;                                                       // 397
      var id1, id2;                                                                                                    // 398
      testAsyncMulti("collection - update options, " + idGeneration, [                                                 // 399
        // init                                                                                                        // 400
        function (test, expect) {                                                                                      // 401
          collection.callClearMethod(expect(function () {                                                              // 402
            test.equal(collection.find().count(), 0);                                                                  // 403
          }));                                                                                                         // 404
        },                                                                                                             // 405
        // put a few objects                                                                                           // 406
        function (test, expect) {                                                                                      // 407
          var doc = {canInsert: true, canUpdate: true};                                                                // 408
          id1 = collection.insert(doc);                                                                                // 409
          id2 = collection.insert(doc);                                                                                // 410
          collection.insert(doc);                                                                                      // 411
          collection.insert(doc, expect(function (err, res) {                                                          // 412
            test.isFalse(err);                                                                                         // 413
            test.equal(collection.find().count(), 4);                                                                  // 414
          }));                                                                                                         // 415
        },                                                                                                             // 416
        // update by id                                                                                                // 417
        function (test, expect) {                                                                                      // 418
          collection.update(                                                                                           // 419
            id1,                                                                                                       // 420
            {$set: {updated: true}},                                                                                   // 421
            expect(function (err, res) {                                                                               // 422
              test.isFalse(err);                                                                                       // 423
              test.equal(collection.find({updated: true}).count(), 1);                                                 // 424
            }));                                                                                                       // 425
        },                                                                                                             // 426
        // update by id in an object                                                                                   // 427
        function (test, expect) {                                                                                      // 428
          collection.update(                                                                                           // 429
            {_id: id2},                                                                                                // 430
            {$set: {updated: true}},                                                                                   // 431
            expect(function (err, res) {                                                                               // 432
              test.isFalse(err);                                                                                       // 433
              test.equal(collection.find({updated: true}).count(), 2);                                                 // 434
            }));                                                                                                       // 435
        },                                                                                                             // 436
        // update with replacement operator not allowed, and has nice error.                                           // 437
        function (test, expect) {                                                                                      // 438
          collection.update(                                                                                           // 439
            {_id: id2},                                                                                                // 440
            {_id: id2, updated: true},                                                                                 // 441
            expect(function (err, res) {                                                                               // 442
              test.equal(err.error, 403);                                                                              // 443
              test.matches(err.reason, /In a restricted/);                                                             // 444
              // unchanged                                                                                             // 445
              test.equal(collection.find({updated: true}).count(), 2);                                                 // 446
            }));                                                                                                       // 447
        },                                                                                                             // 448
        // upsert not allowed, and has nice error.                                                                     // 449
        function (test, expect) {                                                                                      // 450
          collection.update(                                                                                           // 451
            {_id: id2},                                                                                                // 452
            {$set: { upserted: true }},                                                                                // 453
            { upsert: true },                                                                                          // 454
            expect(function (err, res) {                                                                               // 455
              test.equal(err.error, 403);                                                                              // 456
              test.matches(err.reason, /in a restricted/);                                                             // 457
              test.equal(collection.find({ upserted: true }).count(), 0);                                              // 458
            }));                                                                                                       // 459
        },                                                                                                             // 460
        // update with rename operator not allowed, and has nice error.                                                // 461
        function (test, expect) {                                                                                      // 462
          collection.update(                                                                                           // 463
            {_id: id2},                                                                                                // 464
            {$rename: {updated: 'asdf'}},                                                                              // 465
            expect(function (err, res) {                                                                               // 466
              test.equal(err.error, 403);                                                                              // 467
              test.matches(err.reason, /not allowed/);                                                                 // 468
              // unchanged                                                                                             // 469
              test.equal(collection.find({updated: true}).count(), 2);                                                 // 470
            }));                                                                                                       // 471
        },                                                                                                             // 472
        // update method with a non-ID selector is not allowed                                                         // 473
        function (test, expect) {                                                                                      // 474
          // We shouldn't even send the method...                                                                      // 475
          test.throws(function () {                                                                                    // 476
            collection.update(                                                                                         // 477
              {updated: {$exists: false}},                                                                             // 478
              {$set: {updated: true}});                                                                                // 479
          });                                                                                                          // 480
          // ... but if we did, the server would reject it too.                                                        // 481
          Meteor.call(                                                                                                 // 482
            '/' + collection._name + '/update',                                                                        // 483
            {updated: {$exists: false}},                                                                               // 484
            {$set: {updated: true}},                                                                                   // 485
            expect(function (err, res) {                                                                               // 486
              test.equal(err.error, 403);                                                                              // 487
              // unchanged                                                                                             // 488
              test.equal(collection.find({updated: true}).count(), 2);                                                 // 489
            }));                                                                                                       // 490
        },                                                                                                             // 491
        // make sure it doesn't think that {_id: 'foo', something: else} is ok.                                        // 492
        function (test, expect) {                                                                                      // 493
          test.throws(function () {                                                                                    // 494
            collection.update(                                                                                         // 495
              {_id: id1, updated: {$exists: false}},                                                                   // 496
              {$set: {updated: true}});                                                                                // 497
          });                                                                                                          // 498
        },                                                                                                             // 499
        // remove method with a non-ID selector is not allowed                                                         // 500
        function (test, expect) {                                                                                      // 501
          // We shouldn't even send the method...                                                                      // 502
          test.throws(function () {                                                                                    // 503
            collection.remove({updated: true});                                                                        // 504
          });                                                                                                          // 505
          // ... but if we did, the server would reject it too.                                                        // 506
          Meteor.call(                                                                                                 // 507
            '/' + collection._name + '/remove',                                                                        // 508
            {updated: true},                                                                                           // 509
            expect(function (err, res) {                                                                               // 510
              test.equal(err.error, 403);                                                                              // 511
              // unchanged                                                                                             // 512
              test.equal(collection.find({updated: true}).count(), 2);                                                 // 513
            }));                                                                                                       // 514
        }                                                                                                              // 515
      ]);                                                                                                              // 516
    }) ();                                                                                                             // 517
                                                                                                                       // 518
    _.each(                                                                                                            // 519
      [restrictedCollectionDefaultInsecure, restrictedCollectionDefaultSecure],                                        // 520
      function(collection) {                                                                                           // 521
        var canUpdateId, canRemoveId;                                                                                  // 522
                                                                                                                       // 523
        testAsyncMulti("collection - " + collection.unnoncedName, [                                                    // 524
          // init                                                                                                      // 525
          function (test, expect) {                                                                                    // 526
            collection.callClearMethod(expect(function () {                                                            // 527
              test.equal(collection.find().count(), 0);                                                                // 528
            }));                                                                                                       // 529
          },                                                                                                           // 530
                                                                                                                       // 531
          // insert with no allows passing. request is denied.                                                         // 532
          function (test, expect) {                                                                                    // 533
            collection.insert(                                                                                         // 534
              {},                                                                                                      // 535
              expect(function (err, res) {                                                                             // 536
                test.equal(err.error, 403);                                                                            // 537
                test.equal(collection.find().count(), 0);                                                              // 538
              }));                                                                                                     // 539
          },                                                                                                           // 540
          // insert with one allow and one deny. denied.                                                               // 541
          function (test, expect) {                                                                                    // 542
            collection.insert(                                                                                         // 543
              {canInsert: true, cantInsert: true},                                                                     // 544
              expect(function (err, res) {                                                                             // 545
                test.equal(err.error, 403);                                                                            // 546
                test.equal(collection.find().count(), 0);                                                              // 547
              }));                                                                                                     // 548
          },                                                                                                           // 549
          // insert with one allow and other deny. denied.                                                             // 550
          function (test, expect) {                                                                                    // 551
            collection.insert(                                                                                         // 552
              {canInsert: true, cantInsert2: true},                                                                    // 553
              expect(function (err, res) {                                                                             // 554
                test.equal(err.error, 403);                                                                            // 555
                test.equal(collection.find().count(), 0);                                                              // 556
              }));                                                                                                     // 557
          },                                                                                                           // 558
          // insert one allow passes. allowed.                                                                         // 559
          function (test, expect) {                                                                                    // 560
            collection.insert(                                                                                         // 561
              {canInsert: true},                                                                                       // 562
              expect(function (err, res) {                                                                             // 563
                test.isFalse(err);                                                                                     // 564
                test.equal(collection.find().count(), 1);                                                              // 565
              }));                                                                                                     // 566
          },                                                                                                           // 567
          // insert other allow passes. allowed.                                                                       // 568
          // includes canUpdate for later.                                                                             // 569
          function (test, expect) {                                                                                    // 570
            canUpdateId = collection.insert(                                                                           // 571
              {canInsert2: true, canUpdate: true},                                                                     // 572
              expect(function (err, res) {                                                                             // 573
                test.isFalse(err);                                                                                     // 574
                test.equal(collection.find().count(), 2);                                                              // 575
              }));                                                                                                     // 576
          },                                                                                                           // 577
          // yet a third insert executes. this one has canRemove and                                                   // 578
          // cantRemove set for later.                                                                                 // 579
          function (test, expect) {                                                                                    // 580
            canRemoveId = collection.insert(                                                                           // 581
              {canInsert: true, canRemove: true, cantRemove: true},                                                    // 582
              expect(function (err, res) {                                                                             // 583
                test.isFalse(err);                                                                                     // 584
                test.equal(collection.find().count(), 3);                                                              // 585
              }));                                                                                                     // 586
          },                                                                                                           // 587
                                                                                                                       // 588
          // can't update with a non-operator mutation                                                                 // 589
          function (test, expect) {                                                                                    // 590
            collection.update(                                                                                         // 591
              canUpdateId, {newObject: 1},                                                                             // 592
              expect(function (err, res) {                                                                             // 593
                test.equal(err.error, 403);                                                                            // 594
                test.equal(collection.find().count(), 3);                                                              // 595
              }));                                                                                                     // 596
          },                                                                                                           // 597
                                                                                                                       // 598
          // updating dotted fields works as if we are changing their                                                  // 599
          // top part                                                                                                  // 600
          function (test, expect) {                                                                                    // 601
            collection.update(                                                                                         // 602
              canUpdateId, {$set: {"dotted.field": 1}},                                                                // 603
              expect(function (err, res) {                                                                             // 604
                test.isFalse(err);                                                                                     // 605
                test.equal(collection.findOne(canUpdateId).dotted.field, 1);                                           // 606
              }));                                                                                                     // 607
          },                                                                                                           // 608
          function (test, expect) {                                                                                    // 609
            collection.update(                                                                                         // 610
              canUpdateId, {$set: {"verySecret.field": 1}},                                                            // 611
              expect(function (err, res) {                                                                             // 612
                test.equal(err.error, 403);                                                                            // 613
                test.equal(collection.find({verySecret: {$exists: true}}).count(), 0);                                 // 614
              }));                                                                                                     // 615
          },                                                                                                           // 616
                                                                                                                       // 617
          // update doesn't do anything if no docs match                                                               // 618
          function (test, expect) {                                                                                    // 619
            collection.update(                                                                                         // 620
              "doesn't exist",                                                                                         // 621
              {$set: {updated: true}},                                                                                 // 622
              expect(function (err, res) {                                                                             // 623
                test.isFalse(err);                                                                                     // 624
                // nothing has changed                                                                                 // 625
                test.equal(collection.find().count(), 3);                                                              // 626
                test.equal(collection.find({updated: true}).count(), 0);                                               // 627
              }));                                                                                                     // 628
          },                                                                                                           // 629
          // update fails when access is denied trying to set `verySecret`                                             // 630
          function (test, expect) {                                                                                    // 631
            collection.update(                                                                                         // 632
              canUpdateId, {$set: {verySecret: true}},                                                                 // 633
              expect(function (err, res) {                                                                             // 634
                test.equal(err.error, 403);                                                                            // 635
                // nothing has changed                                                                                 // 636
                test.equal(collection.find().count(), 3);                                                              // 637
                test.equal(collection.find({updated: true}).count(), 0);                                               // 638
              }));                                                                                                     // 639
          },                                                                                                           // 640
          // update fails when trying to set two fields, one of which is                                               // 641
          // `verySecret`                                                                                              // 642
          function (test, expect) {                                                                                    // 643
            collection.update(                                                                                         // 644
              canUpdateId, {$set: {updated: true, verySecret: true}},                                                  // 645
              expect(function (err, res) {                                                                             // 646
                test.equal(err.error, 403);                                                                            // 647
                // nothing has changed                                                                                 // 648
                test.equal(collection.find().count(), 3);                                                              // 649
                test.equal(collection.find({updated: true}).count(), 0);                                               // 650
              }));                                                                                                     // 651
          },                                                                                                           // 652
          // update fails when trying to modify docs that don't                                                        // 653
          // have `canUpdate` set                                                                                      // 654
          function (test, expect) {                                                                                    // 655
            collection.update(                                                                                         // 656
              canRemoveId,                                                                                             // 657
              {$set: {updated: true}},                                                                                 // 658
              expect(function (err, res) {                                                                             // 659
                test.equal(err.error, 403);                                                                            // 660
                // nothing has changed                                                                                 // 661
                test.equal(collection.find().count(), 3);                                                              // 662
                test.equal(collection.find({updated: true}).count(), 0);                                               // 663
              }));                                                                                                     // 664
          },                                                                                                           // 665
          // update executes when it should                                                                            // 666
          function (test, expect) {                                                                                    // 667
            collection.update(                                                                                         // 668
              canUpdateId,                                                                                             // 669
              {$set: {updated: true}},                                                                                 // 670
              expect(function (err, res) {                                                                             // 671
                test.isFalse(err);                                                                                     // 672
                test.equal(collection.find({updated: true}).count(), 1);                                               // 673
              }));                                                                                                     // 674
          },                                                                                                           // 675
                                                                                                                       // 676
          // remove fails when trying to modify a doc with no `canRemove` set                                          // 677
          function (test, expect) {                                                                                    // 678
            collection.remove(canUpdateId,                                                                             // 679
                              expect(function (err, res) {                                                             // 680
              test.equal(err.error, 403);                                                                              // 681
              // nothing has changed                                                                                   // 682
              test.equal(collection.find().count(), 3);                                                                // 683
            }));                                                                                                       // 684
          },                                                                                                           // 685
          // remove fails when trying to modify an doc with `cantRemove`                                               // 686
          // set                                                                                                       // 687
          function (test, expect) {                                                                                    // 688
            collection.remove(canRemoveId,                                                                             // 689
                              expect(function (err, res) {                                                             // 690
              test.equal(err.error, 403);                                                                              // 691
              // nothing has changed                                                                                   // 692
              test.equal(collection.find().count(), 3);                                                                // 693
            }));                                                                                                       // 694
          },                                                                                                           // 695
                                                                                                                       // 696
          // update the doc to remove cantRemove.                                                                      // 697
          function (test, expect) {                                                                                    // 698
            collection.update(                                                                                         // 699
              canRemoveId,                                                                                             // 700
              {$set: {cantRemove: false, canUpdate2: true}},                                                           // 701
              expect(function (err, res) {                                                                             // 702
                test.isFalse(err);                                                                                     // 703
                test.equal(collection.find({cantRemove: true}).count(), 0);                                            // 704
              }));                                                                                                     // 705
          },                                                                                                           // 706
                                                                                                                       // 707
          // now remove can remove it.                                                                                 // 708
          function (test, expect) {                                                                                    // 709
            collection.remove(canRemoveId,                                                                             // 710
                              expect(function (err, res) {                                                             // 711
              test.isFalse(err);                                                                                       // 712
              // successfully removed                                                                                  // 713
              test.equal(collection.find().count(), 2);                                                                // 714
            }));                                                                                                       // 715
          },                                                                                                           // 716
                                                                                                                       // 717
          // methods can still bypass restrictions                                                                     // 718
          function (test, expect) {                                                                                    // 719
            collection.callClearMethod(                                                                                // 720
              expect(function (err, res) {                                                                             // 721
                test.isFalse(err);                                                                                     // 722
                // successfully removed                                                                                // 723
                test.equal(collection.find().count(), 0);                                                              // 724
            }));                                                                                                       // 725
          }                                                                                                            // 726
        ]);                                                                                                            // 727
      });                                                                                                              // 728
  });  // end idGeneration loop                                                                                        // 729
}  // end if isClient                                                                                                  // 730
                                                                                                                       // 731
                                                                                                                       // 732
                                                                                                                       // 733
// A few simple server-only tests which don't need to coordinate collections                                           // 734
// with the client..                                                                                                   // 735
if (Meteor.isServer) {                                                                                                 // 736
  Tinytest.add("collection - allow and deny validate options", function (test) {                                       // 737
    var collection = new Meteor.Collection(null);                                                                      // 738
                                                                                                                       // 739
    test.throws(function () {                                                                                          // 740
      collection.allow({invalidOption: true});                                                                         // 741
    });                                                                                                                // 742
    test.throws(function () {                                                                                          // 743
      collection.deny({invalidOption: true});                                                                          // 744
    });                                                                                                                // 745
                                                                                                                       // 746
    _.each(['insert', 'update', 'remove', 'fetch'], function (key) {                                                   // 747
      var options = {};                                                                                                // 748
      options[key] = true;                                                                                             // 749
      test.throws(function () {                                                                                        // 750
        collection.allow(options);                                                                                     // 751
      });                                                                                                              // 752
      test.throws(function () {                                                                                        // 753
        collection.deny(options);                                                                                      // 754
      });                                                                                                              // 755
    });                                                                                                                // 756
                                                                                                                       // 757
    _.each(['insert', 'update', 'remove'], function (key) {                                                            // 758
      var options = {};                                                                                                // 759
      options[key] = ['an array']; // this should be a function, not an array                                          // 760
      test.throws(function () {                                                                                        // 761
        collection.allow(options);                                                                                     // 762
      });                                                                                                              // 763
      test.throws(function () {                                                                                        // 764
        collection.deny(options);                                                                                      // 765
      });                                                                                                              // 766
    });                                                                                                                // 767
                                                                                                                       // 768
    test.throws(function () {                                                                                          // 769
      collection.allow({fetch: function () {}}); // this should be an array                                            // 770
    });                                                                                                                // 771
  });                                                                                                                  // 772
                                                                                                                       // 773
  Tinytest.add("collection - calling allow restricts", function (test) {                                               // 774
    var collection = new Meteor.Collection(null);                                                                      // 775
    test.equal(collection._restricted, false);                                                                         // 776
    collection.allow({                                                                                                 // 777
      insert: function() {}                                                                                            // 778
    });                                                                                                                // 779
    test.equal(collection._restricted, true);                                                                          // 780
  });                                                                                                                  // 781
                                                                                                                       // 782
  Tinytest.add("collection - global insecure", function (test) {                                                       // 783
    // note: This test alters the global insecure status, by sneakily hacking                                          // 784
    // the global Package object! This may collide with itself if run multiple                                         // 785
    // times (but is better than the old test which had the same problem)                                              // 786
    var insecurePackage = Package.insecure;                                                                            // 787
                                                                                                                       // 788
    Package.insecure = {};                                                                                             // 789
    var collection = new Meteor.Collection(null);                                                                      // 790
    test.equal(collection._isInsecure(), true);                                                                        // 791
                                                                                                                       // 792
    Package.insecure = undefined;                                                                                      // 793
    test.equal(collection._isInsecure(), false);                                                                       // 794
                                                                                                                       // 795
    delete Package.insecure;                                                                                           // 796
    test.equal(collection._isInsecure(), false);                                                                       // 797
                                                                                                                       // 798
    collection._insecure = true;                                                                                       // 799
    test.equal(collection._isInsecure(), true);                                                                        // 800
                                                                                                                       // 801
    if (insecurePackage)                                                                                               // 802
      Package.insecure = insecurePackage;                                                                              // 803
    else                                                                                                               // 804
      delete Package.insecure;                                                                                         // 805
  });                                                                                                                  // 806
}                                                                                                                      // 807
                                                                                                                       // 808
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo-livedata/collection_tests.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Tinytest.add(                                                                                                          // 1
  'collection - call Meteor.Collection without new',                                                                   // 2
  function (test) {                                                                                                    // 3
    test.throws(                                                                                                       // 4
      function () {                                                                                                    // 5
        Meteor.Collection(null);                                                                                       // 6
      },                                                                                                               // 7
      /use "new" to construct a Meteor\.Collection/                                                                    // 8
    );                                                                                                                 // 9
  }                                                                                                                    // 10
);                                                                                                                     // 11
                                                                                                                       // 12
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo-livedata/observe_changes_tests.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var makeCollection = function () {                                                                                     // 1
  if (Meteor.isServer)                                                                                                 // 2
    return new Meteor.Collection(Random.id());                                                                         // 3
  else                                                                                                                 // 4
    return new Meteor.Collection(null);                                                                                // 5
};                                                                                                                     // 6
                                                                                                                       // 7
_.each ([{added:'added', forceOrdered: true},                                                                          // 8
         {added:'added', forceOrdered: false},                                                                         // 9
         {added: 'addedBefore', forceOrdered: false}], function (options) {                                            // 10
           var added = options.added;                                                                                  // 11
           var forceOrdered = options.forceOrdered;                                                                    // 12
  Tinytest.addAsync("observeChanges - single id - basics "                                                             // 13
                    + added                                                                                            // 14
                    + (forceOrdered ? " force ordered" : ""),                                                          // 15
                    function (test, onComplete) {                                                                      // 16
    var c = makeCollection();                                                                                          // 17
    var counter = 0;                                                                                                   // 18
    var callbacks = [added, "changed", "removed"];                                                                     // 19
    if (forceOrdered)                                                                                                  // 20
      callbacks.push("movedBefore");                                                                                   // 21
    withCallbackLogger(test,                                                                                           // 22
                       callbacks,                                                                                      // 23
                       Meteor.isServer,                                                                                // 24
                       function (logger) {                                                                             // 25
    var barid = c.insert({thing: "stuff"});                                                                            // 26
    var fooid = c.insert({noodles: "good", bacon: "bad", apples: "ok"});                                               // 27
    var handle = c.find(fooid).observeChanges(logger);                                                                 // 28
    if (added === 'added')                                                                                             // 29
      logger.expectResult(added, [fooid, {noodles: "good", bacon: "bad",apples: "ok"}]);                               // 30
    else                                                                                                               // 31
      logger.expectResult(added,                                                                                       // 32
                          [fooid, {noodles: "good", bacon: "bad", apples: "ok"}, null]);                               // 33
    c.update(fooid, {noodles: "alright", potatoes: "tasty", apples: "ok"});                                            // 34
    logger.expectResult("changed",                                                                                     // 35
                        [fooid, {noodles: "alright", potatoes: "tasty", bacon: undefined}]);                           // 36
                                                                                                                       // 37
    c.remove(fooid);                                                                                                   // 38
    logger.expectResult("removed", [fooid]);                                                                           // 39
                                                                                                                       // 40
    c.remove(barid);                                                                                                   // 41
                                                                                                                       // 42
    c.insert({noodles: "good", bacon: "bad", apples: "ok"});                                                           // 43
    logger.expectNoResult();                                                                                           // 44
    handle.stop();                                                                                                     // 45
    onComplete();                                                                                                      // 46
    });                                                                                                                // 47
  });                                                                                                                  // 48
});                                                                                                                    // 49
                                                                                                                       // 50
Tinytest.addAsync("observeChanges - callback isolation", function (test, onComplete) {                                 // 51
  var c = makeCollection();                                                                                            // 52
  withCallbackLogger(test, ["added", "changed", "removed"], Meteor.isServer, function (logger) {                       // 53
    var handles = [];                                                                                                  // 54
    var cursor = c.find();                                                                                             // 55
    handles.push(cursor.observeChanges(logger));                                                                       // 56
    // fields-tampering observer                                                                                       // 57
    handles.push(cursor.observeChanges({                                                                               // 58
      added: function(id, fields) {                                                                                    // 59
        fields.apples = 'green';                                                                                       // 60
      },                                                                                                               // 61
      changed: function(id, fields) {                                                                                  // 62
        fields.apples = 'green';                                                                                       // 63
      },                                                                                                               // 64
    }));                                                                                                               // 65
                                                                                                                       // 66
    var fooid = c.insert({apples: "ok"});                                                                              // 67
    logger.expectResult("added", [fooid, {apples: "ok"}]);                                                             // 68
                                                                                                                       // 69
    c.update(fooid, {apples: "not ok"})                                                                                // 70
    logger.expectResult("changed", [fooid, {apples: "not ok"}]);                                                       // 71
                                                                                                                       // 72
    test.equal(c.findOne(fooid).apples, "not ok");                                                                     // 73
                                                                                                                       // 74
    _.each(handles, function(handle) { handle.stop(); });                                                              // 75
    onComplete();                                                                                                      // 76
  });                                                                                                                  // 77
                                                                                                                       // 78
});                                                                                                                    // 79
                                                                                                                       // 80
Tinytest.addAsync("observeChanges - single id - initial adds", function (test, onComplete) {                           // 81
  var c = makeCollection();                                                                                            // 82
  withCallbackLogger(test, ["added", "changed", "removed"], Meteor.isServer, function (logger) {                       // 83
  var fooid = c.insert({noodles: "good", bacon: "bad", apples: "ok"});                                                 // 84
  var handle = c.find(fooid).observeChanges(logger);                                                                   // 85
  logger.expectResult("added", [fooid, {noodles: "good", bacon: "bad", apples: "ok"}]);                                // 86
  logger.expectNoResult();                                                                                             // 87
  handle.stop();                                                                                                       // 88
  onComplete();                                                                                                        // 89
  });                                                                                                                  // 90
});                                                                                                                    // 91
                                                                                                                       // 92
                                                                                                                       // 93
                                                                                                                       // 94
Tinytest.addAsync("observeChanges - unordered - initial adds", function (test, onComplete) {                           // 95
  var c = makeCollection();                                                                                            // 96
  withCallbackLogger(test, ["added", "changed", "removed"], Meteor.isServer, function (logger) {                       // 97
  var fooid = c.insert({noodles: "good", bacon: "bad", apples: "ok"});                                                 // 98
  var barid = c.insert({noodles: "good", bacon: "weird", apples: "ok"});                                               // 99
  var handle = c.find().observeChanges(logger);                                                                        // 100
  logger.expectResultUnordered([                                                                                       // 101
    {callback: "added",                                                                                                // 102
     args: [fooid, {noodles: "good", bacon: "bad", apples: "ok"}]},                                                    // 103
    {callback: "added",                                                                                                // 104
     args: [barid, {noodles: "good", bacon: "weird", apples: "ok"}]}                                                   // 105
  ]);                                                                                                                  // 106
  logger.expectNoResult();                                                                                             // 107
  handle.stop();                                                                                                       // 108
  onComplete();                                                                                                        // 109
  });                                                                                                                  // 110
});                                                                                                                    // 111
                                                                                                                       // 112
Tinytest.addAsync("observeChanges - unordered - basics", function (test, onComplete) {                                 // 113
  var c = makeCollection();                                                                                            // 114
  withCallbackLogger(test, ["added", "changed", "removed"], Meteor.isServer, function (logger) {                       // 115
  var handle = c.find().observeChanges(logger);                                                                        // 116
  var barid = c.insert({thing: "stuff"});                                                                              // 117
  logger.expectResultOnly("added", [barid, {thing: "stuff"}]);                                                         // 118
                                                                                                                       // 119
  var fooid = c.insert({noodles: "good", bacon: "bad", apples: "ok"});                                                 // 120
                                                                                                                       // 121
  logger.expectResultOnly("added", [fooid, {noodles: "good", bacon: "bad", apples: "ok"}]);                            // 122
                                                                                                                       // 123
  c.update(fooid, {noodles: "alright", potatoes: "tasty", apples: "ok"});                                              // 124
  c.update(fooid, {noodles: "alright", potatoes: "tasty", apples: "ok"});                                              // 125
  logger.expectResultOnly("changed",                                                                                   // 126
                      [fooid, {noodles: "alright", potatoes: "tasty", bacon: undefined}]);                             // 127
  c.remove(fooid);                                                                                                     // 128
  logger.expectResultOnly("removed", [fooid]);                                                                         // 129
  c.remove(barid);                                                                                                     // 130
  logger.expectResultOnly("removed", [barid]);                                                                         // 131
                                                                                                                       // 132
  fooid = c.insert({noodles: "good", bacon: "bad", apples: "ok"});                                                     // 133
                                                                                                                       // 134
  logger.expectResult("added", [fooid, {noodles: "good", bacon: "bad", apples: "ok"}]);                                // 135
  logger.expectNoResult();                                                                                             // 136
  handle.stop();                                                                                                       // 137
  onComplete();                                                                                                        // 138
  });                                                                                                                  // 139
});                                                                                                                    // 140
                                                                                                                       // 141
if (Meteor.isServer) {                                                                                                 // 142
  Tinytest.addAsync("observeChanges - unordered - specific fields", function (test, onComplete) {                      // 143
    var c = makeCollection();                                                                                          // 144
    withCallbackLogger(test, ["added", "changed", "removed"], Meteor.isServer, function (logger) {                     // 145
      var handle = c.find({}, {fields:{noodles: 1, bacon: 1}}).observeChanges(logger);                                 // 146
      var barid = c.insert({thing: "stuff"});                                                                          // 147
      logger.expectResultOnly("added", [barid, {}]);                                                                   // 148
                                                                                                                       // 149
      var fooid = c.insert({noodles: "good", bacon: "bad", apples: "ok"});                                             // 150
                                                                                                                       // 151
      logger.expectResultOnly("added", [fooid, {noodles: "good", bacon: "bad"}]);                                      // 152
                                                                                                                       // 153
      c.update(fooid, {noodles: "alright", potatoes: "tasty", apples: "ok"});                                          // 154
      logger.expectResultOnly("changed",                                                                               // 155
                              [fooid, {noodles: "alright", bacon: undefined}]);                                        // 156
      c.update(fooid, {noodles: "alright", potatoes: "meh", apples: "ok"});                                            // 157
      c.remove(fooid);                                                                                                 // 158
      logger.expectResultOnly("removed", [fooid]);                                                                     // 159
      c.remove(barid);                                                                                                 // 160
      logger.expectResultOnly("removed", [barid]);                                                                     // 161
                                                                                                                       // 162
      fooid = c.insert({noodles: "good", bacon: "bad"});                                                               // 163
                                                                                                                       // 164
      logger.expectResult("added", [fooid, {noodles: "good", bacon: "bad"}]);                                          // 165
      logger.expectNoResult();                                                                                         // 166
      handle.stop();                                                                                                   // 167
      onComplete();                                                                                                    // 168
    });                                                                                                                // 169
  });                                                                                                                  // 170
                                                                                                                       // 171
  Tinytest.addAsync("observeChanges - unordered - specific fields + selector on excluded fields", function (test, onComplete) {
    var c = makeCollection();                                                                                          // 173
    withCallbackLogger(test, ["added", "changed", "removed"], Meteor.isServer, function (logger) {                     // 174
      var handle = c.find({ mac: 1, cheese: 2 },                                                                       // 175
                          {fields:{noodles: 1, bacon: 1, eggs: 1}}).observeChanges(logger);                            // 176
      var barid = c.insert({thing: "stuff", mac: 1, cheese: 2});                                                       // 177
      logger.expectResultOnly("added", [barid, {}]);                                                                   // 178
                                                                                                                       // 179
      var fooid = c.insert({noodles: "good", bacon: "bad", apples: "ok", mac: 1, cheese: 2});                          // 180
                                                                                                                       // 181
      logger.expectResultOnly("added", [fooid, {noodles: "good", bacon: "bad"}]);                                      // 182
                                                                                                                       // 183
      c.update(fooid, {noodles: "alright", potatoes: "tasty", apples: "ok", mac: 1, cheese: 2});                       // 184
      logger.expectResultOnly("changed",                                                                               // 185
                              [fooid, {noodles: "alright", bacon: undefined}]);                                        // 186
                                                                                                                       // 187
      // Doesn't get update event, since modifies only hidden fields                                                   // 188
      c.update(fooid, {noodles: "alright", potatoes: "meh", apples: "ok", mac: 1, cheese: 2});                         // 189
      logger.expectNoResult();                                                                                         // 190
                                                                                                                       // 191
      c.remove(fooid);                                                                                                 // 192
      logger.expectResultOnly("removed", [fooid]);                                                                     // 193
      c.remove(barid);                                                                                                 // 194
      logger.expectResultOnly("removed", [barid]);                                                                     // 195
                                                                                                                       // 196
      fooid = c.insert({noodles: "good", bacon: "bad", mac: 1, cheese: 2});                                            // 197
                                                                                                                       // 198
      logger.expectResult("added", [fooid, {noodles: "good", bacon: "bad"}]);                                          // 199
      logger.expectNoResult();                                                                                         // 200
      handle.stop();                                                                                                   // 201
      onComplete();                                                                                                    // 202
    });                                                                                                                // 203
  });                                                                                                                  // 204
                                                                                                                       // 205
  Tinytest.addAsync("observeChanges - unordered - specific fields + modify on excluded fields", function (test, onComplete) {
    var c = makeCollection();                                                                                          // 207
    withCallbackLogger(test, ["added", "changed", "removed"], Meteor.isServer, function (logger) {                     // 208
      var handle = c.find({ mac: 1, cheese: 2 },                                                                       // 209
                          {fields:{noodles: 1, bacon: 1, eggs: 1}}).observeChanges(logger);                            // 210
      var fooid = c.insert({noodles: "good", bacon: "bad", apples: "ok", mac: 1, cheese: 2});                          // 211
                                                                                                                       // 212
      logger.expectResultOnly("added", [fooid, {noodles: "good", bacon: "bad"}]);                                      // 213
                                                                                                                       // 214
                                                                                                                       // 215
      // Noodles go into shadow, mac appears as eggs                                                                   // 216
      c.update(fooid, {$rename: { noodles: 'shadow', apples: 'eggs' }});                                               // 217
      logger.expectResultOnly("changed",                                                                               // 218
                              [fooid, {eggs:"ok", noodles: undefined}]);                                               // 219
                                                                                                                       // 220
      c.remove(fooid);                                                                                                 // 221
      logger.expectResultOnly("removed", [fooid]);                                                                     // 222
      logger.expectNoResult();                                                                                         // 223
      handle.stop();                                                                                                   // 224
      onComplete();                                                                                                    // 225
    });                                                                                                                // 226
  });                                                                                                                  // 227
}                                                                                                                      // 228
                                                                                                                       // 229
                                                                                                                       // 230
Tinytest.addAsync("observeChanges - unordered - enters and exits result set through change", function (test, onComplete) {
  var c = makeCollection();                                                                                            // 232
  withCallbackLogger(test, ["added", "changed", "removed"], Meteor.isServer, function (logger) {                       // 233
  var handle = c.find({noodles: "good"}).observeChanges(logger);                                                       // 234
  var barid = c.insert({thing: "stuff"});                                                                              // 235
                                                                                                                       // 236
  var fooid = c.insert({noodles: "good", bacon: "bad", apples: "ok"});                                                 // 237
  logger.expectResultOnly("added", [fooid, {noodles: "good", bacon: "bad", apples: "ok"}]);                            // 238
                                                                                                                       // 239
  c.update(fooid, {noodles: "alright", potatoes: "tasty", apples: "ok"});                                              // 240
  logger.expectResultOnly("removed",                                                                                   // 241
                      [fooid]);                                                                                        // 242
  c.remove(fooid);                                                                                                     // 243
  c.remove(barid);                                                                                                     // 244
                                                                                                                       // 245
  fooid = c.insert({noodles: "ok", bacon: "bad", apples: "ok"});                                                       // 246
  c.update(fooid, {noodles: "good", potatoes: "tasty", apples: "ok"});                                                 // 247
  logger.expectResult("added", [fooid, {noodles: "good", potatoes: "tasty", apples: "ok"}]);                           // 248
  logger.expectNoResult();                                                                                             // 249
  handle.stop();                                                                                                       // 250
  onComplete();                                                                                                        // 251
  });                                                                                                                  // 252
});                                                                                                                    // 253
                                                                                                                       // 254
                                                                                                                       // 255
if (Meteor.isServer) {                                                                                                 // 256
  testAsyncMulti("observeChanges - tailable", [                                                                        // 257
    function (test, expect) {                                                                                          // 258
      var self = this;                                                                                                 // 259
      var collName = "cap_" + Random.id();                                                                             // 260
      var coll = new Meteor.Collection(collName);                                                                      // 261
      coll._createCappedCollection(1000000);                                                                           // 262
      self.xs = [];                                                                                                    // 263
      self.expects = [];                                                                                               // 264
      self.insert = function (fields) {                                                                                // 265
        coll.insert(_.extend({ts: new MongoInternals.MongoTimestamp(0, 0)},                                            // 266
                             fields));                                                                                 // 267
      };                                                                                                               // 268
                                                                                                                       // 269
      // Tailable observe shouldn't show things that are in the initial                                                // 270
      // contents.                                                                                                     // 271
      self.insert({x: 1});                                                                                             // 272
      // Wait for one added call before going to the next test function.                                               // 273
      self.expects.push(expect());                                                                                     // 274
                                                                                                                       // 275
      var cursor = coll.find({y: {$ne: 7}}, {tailable: true});                                                         // 276
      self.handle = cursor.observeChanges({                                                                            // 277
        added: function (id, fields) {                                                                                 // 278
          self.xs.push(fields.x);                                                                                      // 279
          test.notEqual(self.expects.length, 0);                                                                       // 280
          self.expects.pop()();                                                                                        // 281
        },                                                                                                             // 282
        changed: function () {                                                                                         // 283
          test.fail({unexpected: "changed"});                                                                          // 284
        },                                                                                                             // 285
        removed: function () {                                                                                         // 286
          test.fail({unexpected: "removed"});                                                                          // 287
        }                                                                                                              // 288
      });                                                                                                              // 289
                                                                                                                       // 290
      // Nothing happens synchronously.                                                                                // 291
      test.equal(self.xs, []);                                                                                         // 292
    },                                                                                                                 // 293
    function (test, expect) {                                                                                          // 294
      var self = this;                                                                                                 // 295
      // The cursors sees the first element.                                                                           // 296
      test.equal(self.xs, [1]);                                                                                        // 297
      self.xs = [];                                                                                                    // 298
                                                                                                                       // 299
      self.insert({x: 2, y: 3});                                                                                       // 300
      self.insert({x: 3, y: 7});  // filtered out by the query                                                         // 301
      self.insert({x: 4});                                                                                             // 302
      // Expect two added calls to happen.                                                                             // 303
      self.expects = [expect(), expect()];                                                                             // 304
    },                                                                                                                 // 305
    function (test, expect) {                                                                                          // 306
      var self = this;                                                                                                 // 307
      test.equal(self.xs, [2, 4]);                                                                                     // 308
      self.xs = [];                                                                                                    // 309
      self.handle.stop();                                                                                              // 310
                                                                                                                       // 311
      self.insert({x: 5});                                                                                             // 312
      // XXX This timeout isn't perfect but it's pretty hard to prove that an                                          // 313
      // event WON'T happen without something like a write fence.                                                      // 314
      Meteor.setTimeout(expect(), 1000);                                                                               // 315
    },                                                                                                                 // 316
    function (test, expect) {                                                                                          // 317
      var self = this;                                                                                                 // 318
      test.equal(self.xs, []);                                                                                         // 319
    }                                                                                                                  // 320
  ]);                                                                                                                  // 321
}                                                                                                                      // 322
                                                                                                                       // 323
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo-livedata/oplog_tests.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var OplogCollection = new Meteor.Collection("oplog-" + Random.id());                                                   // 1
                                                                                                                       // 2
Tinytest.add("mongo-livedata - oplog - cursorSupported", function (test) {                                             // 3
  var supported = function (expected, selector) {                                                                      // 4
    var cursor = OplogCollection.find(selector);                                                                       // 5
    test.equal(                                                                                                        // 6
      MongoTest.OplogObserveDriver.cursorSupported(cursor._cursorDescription),                                         // 7
      expected);                                                                                                       // 8
  };                                                                                                                   // 9
                                                                                                                       // 10
  supported(true, "asdf");                                                                                             // 11
  supported(true, 1234);                                                                                               // 12
  supported(true, new Meteor.Collection.ObjectID());                                                                   // 13
                                                                                                                       // 14
  supported(true, {_id: "asdf"});                                                                                      // 15
  supported(true, {_id: 1234});                                                                                        // 16
  supported(true, {_id: new Meteor.Collection.ObjectID()});                                                            // 17
                                                                                                                       // 18
  supported(true, {foo: "asdf",                                                                                        // 19
                   bar: 1234,                                                                                          // 20
                   baz: new Meteor.Collection.ObjectID(),                                                              // 21
                   eeney: true,                                                                                        // 22
                   miney: false,                                                                                       // 23
                   moe: null});                                                                                        // 24
                                                                                                                       // 25
  supported(true, {});                                                                                                 // 26
                                                                                                                       // 27
  supported(false, {$and: [{foo: "asdf"}, {bar: "baz"}]});                                                             // 28
  supported(false, {foo: {x: 1}});                                                                                     // 29
  supported(false, {foo: {$gt: 1}});                                                                                   // 30
  supported(false, {foo: [1, 2, 3]});                                                                                  // 31
});                                                                                                                    // 32
                                                                                                                       // 33
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mongo-livedata/doc_fetcher_tests.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var Fiber = Npm.require('fibers');                                                                                     // 1
var Future = Npm.require('fibers/future');                                                                             // 2
                                                                                                                       // 3
testAsyncMulti("mongo-livedata - doc fetcher", [                                                                       // 4
  function (test, expect) {                                                                                            // 5
    var self = this;                                                                                                   // 6
    var collName = "docfetcher-" + Random.id();                                                                        // 7
    var collection = new Meteor.Collection(collName);                                                                  // 8
    var id1 = collection.insert({x: 1});                                                                               // 9
    var id2 = collection.insert({y: 2});                                                                               // 10
                                                                                                                       // 11
    var fetcher = new MongoTest.DocFetcher(                                                                            // 12
      MongoInternals.defaultRemoteCollectionDriver().mongo);                                                           // 13
                                                                                                                       // 14
    // Test basic operation.                                                                                           // 15
    fetcher.fetch(collName, id1, Random.id(), expect(null, {_id: id1, x: 1}));                                         // 16
    fetcher.fetch(collName, "nonexistent!", Random.id(), expect(null, null));                                          // 17
                                                                                                                       // 18
    var fetched = false;                                                                                               // 19
    var cacheKey = Random.id();                                                                                        // 20
    var expected = {_id: id2, y: 2};                                                                                   // 21
    fetcher.fetch(collName, id2, cacheKey, expect(function (e, d) {                                                    // 22
      fetched = true;                                                                                                  // 23
      test.isFalse(e);                                                                                                 // 24
      test.equal(d, expected);                                                                                         // 25
    }));                                                                                                               // 26
    // The fetcher yields.                                                                                             // 27
    test.isFalse(fetched);                                                                                             // 28
                                                                                                                       // 29
    // Now ask for another document with the same cache key. Because a fetch for                                       // 30
    // that cache key is in flight, we will get the other fetch's document, not                                        // 31
    // this random document.                                                                                           // 32
    fetcher.fetch(collName, Random.id(), cacheKey, expect(function (e, d) {                                            // 33
      test.isFalse(e);                                                                                                 // 34
      test.equal(d, expected);                                                                                         // 35
    }));                                                                                                               // 36
  }                                                                                                                    // 37
]);                                                                                                                    // 38
                                                                                                                       // 39
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
