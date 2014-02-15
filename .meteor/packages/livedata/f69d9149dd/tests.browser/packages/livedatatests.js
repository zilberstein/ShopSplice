(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/livedata/stub_stream.js                                                                                  //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
StubStream = function () {                                                                                           // 1
  var self = this;                                                                                                   // 2
                                                                                                                     // 3
  self.sent = [];                                                                                                    // 4
  self.callbacks = {};                                                                                               // 5
};                                                                                                                   // 6
                                                                                                                     // 7
                                                                                                                     // 8
_.extend(StubStream.prototype, {                                                                                     // 9
  // Methods from Stream                                                                                             // 10
  on: function (name, callback) {                                                                                    // 11
    var self = this;                                                                                                 // 12
                                                                                                                     // 13
    if (!self.callbacks[name])                                                                                       // 14
      self.callbacks[name] = [callback];                                                                             // 15
    else                                                                                                             // 16
      self.callbacks[name].push(callback);                                                                           // 17
  },                                                                                                                 // 18
                                                                                                                     // 19
  send: function (data) {                                                                                            // 20
    var self = this;                                                                                                 // 21
    self.sent.push(data);                                                                                            // 22
  },                                                                                                                 // 23
                                                                                                                     // 24
  status: function () {                                                                                              // 25
    return {status: "connected", fake: true};                                                                        // 26
  },                                                                                                                 // 27
                                                                                                                     // 28
  reconnect: function () {                                                                                           // 29
    // no-op                                                                                                         // 30
  },                                                                                                                 // 31
                                                                                                                     // 32
                                                                                                                     // 33
  // Methods for tests                                                                                               // 34
  receive: function (data) {                                                                                         // 35
    var self = this;                                                                                                 // 36
                                                                                                                     // 37
    if (typeof data === 'object') {                                                                                  // 38
      data = EJSON.stringify(data);                                                                                  // 39
    }                                                                                                                // 40
                                                                                                                     // 41
    _.each(self.callbacks['message'], function (cb) {                                                                // 42
      cb(data);                                                                                                      // 43
    });                                                                                                              // 44
  },                                                                                                                 // 45
                                                                                                                     // 46
  reset: function () {                                                                                               // 47
    var self = this;                                                                                                 // 48
    _.each(self.callbacks['reset'], function (cb) {                                                                  // 49
      cb();                                                                                                          // 50
    });                                                                                                              // 51
  }                                                                                                                  // 52
                                                                                                                     // 53
                                                                                                                     // 54
});                                                                                                                  // 55
                                                                                                                     // 56
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/livedata/livedata_connection_tests.js                                                                    //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
var newConnection = function (stream) {                                                                              // 1
  // Some of these tests leave outstanding methods with no result yet                                                // 2
  // returned. This should not block us from re-running tests when sources                                           // 3
  // change.                                                                                                         // 4
  return new LivedataTest.Connection(stream, {reloadWithOutstanding: true});                                         // 5
};                                                                                                                   // 6
                                                                                                                     // 7
var makeConnectMessage = function (session) {                                                                        // 8
  var msg = {                                                                                                        // 9
    msg: 'connect',                                                                                                  // 10
    version: LivedataTest.SUPPORTED_DDP_VERSIONS[0],                                                                 // 11
    support: LivedataTest.SUPPORTED_DDP_VERSIONS                                                                     // 12
  };                                                                                                                 // 13
                                                                                                                     // 14
  if (session)                                                                                                       // 15
    msg.session = session;                                                                                           // 16
  return msg;                                                                                                        // 17
}                                                                                                                    // 18
                                                                                                                     // 19
var testGotMessage = function (test, stream, expected) {                                                             // 20
  var retVal = undefined;                                                                                            // 21
                                                                                                                     // 22
  if (stream.sent.length === 0) {                                                                                    // 23
    test.fail({error: 'no message received', expected: expected});                                                   // 24
    return retVal;                                                                                                   // 25
  }                                                                                                                  // 26
                                                                                                                     // 27
  var got = stream.sent.shift();                                                                                     // 28
                                                                                                                     // 29
  if (typeof got === 'string' && typeof expected === 'object')                                                       // 30
    got = JSON.parse(got);                                                                                           // 31
                                                                                                                     // 32
  // An expected value of '*' matches any value, and the matching value (or                                          // 33
  // array of matching values, if there are multiple) is returned from this                                          // 34
  // function.                                                                                                       // 35
  if (typeof expected === 'object') {                                                                                // 36
    var keysWithStarValues = [];                                                                                     // 37
    _.each(expected, function (v, k) {                                                                               // 38
      if (v === '*')                                                                                                 // 39
        keysWithStarValues.push(k);                                                                                  // 40
    });                                                                                                              // 41
    _.each(keysWithStarValues, function (k) {                                                                        // 42
      expected[k] = got[k];                                                                                          // 43
    });                                                                                                              // 44
    if (keysWithStarValues.length === 1) {                                                                           // 45
      retVal = got[keysWithStarValues[0]];                                                                           // 46
    } else {                                                                                                         // 47
      retVal = _.map(keysWithStarValues, function (k) {                                                              // 48
        return got[k];                                                                                               // 49
      });                                                                                                            // 50
    }                                                                                                                // 51
  }                                                                                                                  // 52
                                                                                                                     // 53
  test.equal(got, expected);                                                                                         // 54
  return retVal;                                                                                                     // 55
};                                                                                                                   // 56
                                                                                                                     // 57
var startAndConnect = function(test, stream) {                                                                       // 58
  stream.reset(); // initial connection start.                                                                       // 59
                                                                                                                     // 60
  testGotMessage(test, stream, makeConnectMessage());                                                                // 61
  test.length(stream.sent, 0);                                                                                       // 62
                                                                                                                     // 63
  stream.receive({msg: 'connected', session: SESSION_ID});                                                           // 64
  test.length(stream.sent, 0);                                                                                       // 65
};                                                                                                                   // 66
                                                                                                                     // 67
var SESSION_ID = '17';                                                                                               // 68
                                                                                                                     // 69
Tinytest.add("livedata stub - receive data", function (test) {                                                       // 70
  var stream = new StubStream();                                                                                     // 71
  var conn = newConnection(stream);                                                                                  // 72
                                                                                                                     // 73
  startAndConnect(test, stream);                                                                                     // 74
                                                                                                                     // 75
  // data comes in for unknown collection.                                                                           // 76
  var coll_name = Random.id();                                                                                       // 77
  stream.receive({msg: 'added', collection: coll_name, id: '1234',                                                   // 78
                  fields: {a: 1}});                                                                                  // 79
  // break throught the black box and test internal state                                                            // 80
  test.length(conn._updatesForUnknownStores[coll_name], 1);                                                          // 81
                                                                                                                     // 82
  // XXX: Test that the old signature of passing manager directly instead of in                                      // 83
  // options works.                                                                                                  // 84
  var coll = new Meteor.Collection(coll_name, conn);                                                                 // 85
                                                                                                                     // 86
  // queue has been emptied and doc is in db.                                                                        // 87
  test.isUndefined(conn._updatesForUnknownStores[coll_name]);                                                        // 88
  test.equal(coll.find({}).fetch(), [{_id:'1234', a:1}]);                                                            // 89
                                                                                                                     // 90
  // second message. applied directly to the db.                                                                     // 91
  stream.receive({msg: 'changed', collection: coll_name, id: '1234',                                                 // 92
                  fields: {a:2}});                                                                                   // 93
  test.equal(coll.find({}).fetch(), [{_id:'1234', a:2}]);                                                            // 94
  test.isUndefined(conn._updatesForUnknownStores[coll_name]);                                                        // 95
});                                                                                                                  // 96
                                                                                                                     // 97
Tinytest.add("livedata stub - subscribe", function (test) {                                                          // 98
  var stream = new StubStream();                                                                                     // 99
  var conn = newConnection(stream);                                                                                  // 100
                                                                                                                     // 101
  startAndConnect(test, stream);                                                                                     // 102
                                                                                                                     // 103
  // subscribe                                                                                                       // 104
  var callback_fired = false;                                                                                        // 105
  var sub = conn.subscribe('my_data', function () {                                                                  // 106
    callback_fired = true;                                                                                           // 107
  });                                                                                                                // 108
  test.isFalse(callback_fired);                                                                                      // 109
                                                                                                                     // 110
  test.length(stream.sent, 1);                                                                                       // 111
  var message = JSON.parse(stream.sent.shift());                                                                     // 112
  var id = message.id;                                                                                               // 113
  delete message.id;                                                                                                 // 114
  test.equal(message, {msg: 'sub', name: 'my_data', params: []});                                                    // 115
                                                                                                                     // 116
  var reactivelyReady = false;                                                                                       // 117
  var autorunHandle = Deps.autorun(function () {                                                                     // 118
    reactivelyReady = sub.ready();                                                                                   // 119
  });                                                                                                                // 120
  test.isFalse(reactivelyReady);                                                                                     // 121
                                                                                                                     // 122
  // get the sub satisfied. callback fires.                                                                          // 123
  stream.receive({msg: 'ready', 'subs': [id]});                                                                      // 124
  test.isTrue(callback_fired);                                                                                       // 125
  Deps.flush();                                                                                                      // 126
  test.isTrue(reactivelyReady);                                                                                      // 127
  autorunHandle.stop();                                                                                              // 128
                                                                                                                     // 129
  // Unsubscribe.                                                                                                    // 130
  sub.stop();                                                                                                        // 131
  test.length(stream.sent, 1);                                                                                       // 132
  message = JSON.parse(stream.sent.shift());                                                                         // 133
  test.equal(message, {msg: 'unsub', id: id});                                                                       // 134
                                                                                                                     // 135
  // Resubscribe.                                                                                                    // 136
  conn.subscribe('my_data');                                                                                         // 137
  test.length(stream.sent, 1);                                                                                       // 138
  message = JSON.parse(stream.sent.shift());                                                                         // 139
  var id2 = message.id;                                                                                              // 140
  test.notEqual(id, id2);                                                                                            // 141
  delete message.id;                                                                                                 // 142
  test.equal(message, {msg: 'sub', name: 'my_data', params: []});                                                    // 143
});                                                                                                                  // 144
                                                                                                                     // 145
                                                                                                                     // 146
Tinytest.add("livedata stub - reactive subscribe", function (test) {                                                 // 147
  var stream = new StubStream();                                                                                     // 148
  var conn = newConnection(stream);                                                                                  // 149
                                                                                                                     // 150
  startAndConnect(test, stream);                                                                                     // 151
                                                                                                                     // 152
  var rFoo = new ReactiveVar('foo1');                                                                                // 153
  var rBar = new ReactiveVar('bar1');                                                                                // 154
                                                                                                                     // 155
  var onReadyCount = {};                                                                                             // 156
  var onReady = function (tag) {                                                                                     // 157
    return function () {                                                                                             // 158
      if (_.has(onReadyCount, tag))                                                                                  // 159
        ++onReadyCount[tag];                                                                                         // 160
      else                                                                                                           // 161
        onReadyCount[tag] = 1;                                                                                       // 162
    };                                                                                                               // 163
  };                                                                                                                 // 164
                                                                                                                     // 165
  // Subscribe to some subs.                                                                                         // 166
  var stopperHandle;                                                                                                 // 167
  var autorunHandle = Deps.autorun(function () {                                                                     // 168
    conn.subscribe("foo", rFoo.get(), onReady(rFoo.get()));                                                          // 169
    conn.subscribe("bar", rBar.get(), onReady(rBar.get()));                                                          // 170
    conn.subscribe("completer", onReady("completer"));                                                               // 171
    stopperHandle = conn.subscribe("stopper", onReady("stopper"));                                                   // 172
  });                                                                                                                // 173
                                                                                                                     // 174
  // Check sub messages. (Assume they are sent in the order executed.)                                               // 175
  test.length(stream.sent, 4);                                                                                       // 176
  var message = JSON.parse(stream.sent.shift());                                                                     // 177
  var idFoo1 = message.id;                                                                                           // 178
  delete message.id;                                                                                                 // 179
  test.equal(message, {msg: 'sub', name: 'foo', params: ['foo1']});                                                  // 180
                                                                                                                     // 181
  message = JSON.parse(stream.sent.shift());                                                                         // 182
  var idBar1 = message.id;                                                                                           // 183
  delete message.id;                                                                                                 // 184
  test.equal(message, {msg: 'sub', name: 'bar', params: ['bar1']});                                                  // 185
                                                                                                                     // 186
  message = JSON.parse(stream.sent.shift());                                                                         // 187
  var idCompleter = message.id;                                                                                      // 188
  delete message.id;                                                                                                 // 189
  test.equal(message, {msg: 'sub', name: 'completer', params: []});                                                  // 190
                                                                                                                     // 191
  message = JSON.parse(stream.sent.shift());                                                                         // 192
  var idStopper = message.id;                                                                                        // 193
  delete message.id;                                                                                                 // 194
  test.equal(message, {msg: 'sub', name: 'stopper', params: []});                                                    // 195
                                                                                                                     // 196
  // Haven't hit onReady yet.                                                                                        // 197
  test.equal(onReadyCount, {});                                                                                      // 198
                                                                                                                     // 199
  // "completer" gets ready now. its callback should fire.                                                           // 200
  stream.receive({msg: 'ready', 'subs': [idCompleter]});                                                             // 201
  test.equal(onReadyCount, {completer: 1});                                                                          // 202
  test.length(stream.sent, 0);                                                                                       // 203
                                                                                                                     // 204
  // Stop 'stopper'.                                                                                                 // 205
  stopperHandle.stop();                                                                                              // 206
  test.length(stream.sent, 1);                                                                                       // 207
  message = JSON.parse(stream.sent.shift());                                                                         // 208
  test.equal(message, {msg: 'unsub', id: idStopper});                                                                // 209
                                                                                                                     // 210
  test.equal(onReadyCount, {completer: 1});                                                                          // 211
                                                                                                                     // 212
  // Change the foo subscription and flush. We should sub to the new foo                                             // 213
  // subscription, re-sub to the stopper subscription, and then unsub from the old                                   // 214
  // foo subscription.  The bar subscription should be unaffected. The completer                                     // 215
  // subscription should *NOT* call its new onReady callback, because we only                                        // 216
  // call at most one onReady for a given reactively-saved subscription.                                             // 217
  rFoo.set("foo2");                                                                                                  // 218
  Deps.flush();                                                                                                      // 219
  test.length(stream.sent, 3);                                                                                       // 220
                                                                                                                     // 221
  message = JSON.parse(stream.sent.shift());                                                                         // 222
  var idFoo2 = message.id;                                                                                           // 223
  delete message.id;                                                                                                 // 224
  test.equal(message, {msg: 'sub', name: 'foo', params: ['foo2']});                                                  // 225
                                                                                                                     // 226
  message = JSON.parse(stream.sent.shift());                                                                         // 227
  var idStopperAgain = message.id;                                                                                   // 228
  delete message.id;                                                                                                 // 229
  test.equal(message, {msg: 'sub', name: 'stopper', params: []});                                                    // 230
                                                                                                                     // 231
  message = JSON.parse(stream.sent.shift());                                                                         // 232
  test.equal(message, {msg: 'unsub', id: idFoo1});                                                                   // 233
                                                                                                                     // 234
  test.equal(onReadyCount, {completer: 1});                                                                          // 235
                                                                                                                     // 236
  // Ready the stopper and bar subs. Completing stopper should call only the                                         // 237
  // onReady from the new subscription because they were separate subscriptions                                      // 238
  // started at different times and the first one was explicitly torn down by                                        // 239
  // the client; completing bar should call only the onReady from the new                                            // 240
  // subscription because we only call at most one onReady per reactively-saved                                      // 241
  // subscription.                                                                                                   // 242
  stream.receive({msg: 'ready', 'subs': [idStopperAgain, idBar1]});                                                  // 243
  test.equal(onReadyCount, {completer: 1, bar1: 1, stopper: 1});                                                     // 244
                                                                                                                     // 245
  // Shut down the autorun. This should unsub us from all current subs at flush                                      // 246
  // time.                                                                                                           // 247
  autorunHandle.stop();                                                                                              // 248
  Deps.flush();                                                                                                      // 249
                                                                                                                     // 250
  test.length(stream.sent, 4);                                                                                       // 251
  // The order of unsubs here is not important.                                                                      // 252
  var unsubMessages = _.map(stream.sent, JSON.parse);                                                                // 253
  stream.sent.length = 0;                                                                                            // 254
  test.equal(_.unique(_.pluck(unsubMessages, 'msg')), ['unsub']);                                                    // 255
  var actualIds = _.pluck(unsubMessages, 'id');                                                                      // 256
  var expectedIds = [idFoo2, idBar1, idCompleter, idStopperAgain];                                                   // 257
  actualIds.sort();                                                                                                  // 258
  expectedIds.sort();                                                                                                // 259
  test.equal(actualIds, expectedIds);                                                                                // 260
});                                                                                                                  // 261
                                                                                                                     // 262
                                                                                                                     // 263
Tinytest.add("livedata stub - this", function (test) {                                                               // 264
  var stream = new StubStream();                                                                                     // 265
  var conn = newConnection(stream);                                                                                  // 266
                                                                                                                     // 267
  startAndConnect(test, stream);                                                                                     // 268
  conn.methods({test_this: function() {                                                                              // 269
    test.isTrue(this.isSimulation);                                                                                  // 270
    this.unblock(); // should be a no-op                                                                             // 271
  }});                                                                                                               // 272
                                                                                                                     // 273
  // should throw no exceptions                                                                                      // 274
  conn.call('test_this', _.identity);                                                                                // 275
  // satisfy method, quiesce connection                                                                              // 276
  var message = JSON.parse(stream.sent.shift());                                                                     // 277
  test.equal(message, {msg: 'method', method: 'test_this',                                                           // 278
                       params: [], id:message.id});                                                                  // 279
  test.length(stream.sent, 0);                                                                                       // 280
                                                                                                                     // 281
  stream.receive({msg: 'result', id:message.id, result:null});                                                       // 282
  stream.receive({msg: 'updated', 'methods': [message.id]});                                                         // 283
                                                                                                                     // 284
});                                                                                                                  // 285
                                                                                                                     // 286
if (Meteor.isClient) {                                                                                               // 287
  Tinytest.add("livedata stub - methods", function (test) {                                                          // 288
    var stream = new StubStream();                                                                                   // 289
    var conn = newConnection(stream);                                                                                // 290
                                                                                                                     // 291
    startAndConnect(test, stream);                                                                                   // 292
                                                                                                                     // 293
    var collName = Random.id();                                                                                      // 294
    var coll = new Meteor.Collection(collName, {connection: conn});                                                  // 295
                                                                                                                     // 296
    // setup method                                                                                                  // 297
    conn.methods({do_something: function (x) {                                                                       // 298
      coll.insert({value: x});                                                                                       // 299
    }});                                                                                                             // 300
                                                                                                                     // 301
    // setup observers                                                                                               // 302
    var counts = {added: 0, removed: 0, changed: 0, moved: 0};                                                       // 303
    var handle = coll.find({}).observe(                                                                              // 304
      { addedAt: function () { counts.added += 1; },                                                                 // 305
        removedAt: function () { counts.removed += 1; },                                                             // 306
        changedAt: function () { counts.changed += 1; },                                                             // 307
        movedTo: function () { counts.moved += 1; }                                                                  // 308
      });                                                                                                            // 309
                                                                                                                     // 310
                                                                                                                     // 311
    // call method with results callback                                                                             // 312
    var callback1Fired = false;                                                                                      // 313
    conn.call('do_something', 'friday!', function (err, res) {                                                       // 314
      test.isUndefined(err);                                                                                         // 315
      test.equal(res, '1234');                                                                                       // 316
      callback1Fired = true;                                                                                         // 317
    });                                                                                                              // 318
    test.isFalse(callback1Fired);                                                                                    // 319
                                                                                                                     // 320
    // observers saw the method run.                                                                                 // 321
    test.equal(counts, {added: 1, removed: 0, changed: 0, moved: 0});                                                // 322
                                                                                                                     // 323
    // get response from server                                                                                      // 324
    var message = JSON.parse(stream.sent.shift());                                                                   // 325
    test.equal(message, {msg: 'method', method: 'do_something',                                                      // 326
                         params: ['friday!'], id:message.id});                                                       // 327
                                                                                                                     // 328
    test.equal(coll.find({}).count(), 1);                                                                            // 329
    test.equal(coll.find({value: 'friday!'}).count(), 1);                                                            // 330
    var docId = coll.findOne({value: 'friday!'})._id;                                                                // 331
                                                                                                                     // 332
    // results does not yet result in callback, because data is not                                                  // 333
    // ready.                                                                                                        // 334
    stream.receive({msg: 'result', id:message.id, result: "1234"});                                                  // 335
    test.isFalse(callback1Fired);                                                                                    // 336
                                                                                                                     // 337
    // result message doesn't affect data                                                                            // 338
    test.equal(coll.find({}).count(), 1);                                                                            // 339
    test.equal(coll.find({value: 'friday!'}).count(), 1);                                                            // 340
    test.equal(counts, {added: 1, removed: 0, changed: 0, moved: 0});                                                // 341
                                                                                                                     // 342
    // data methods do not show up (not quiescent yet)                                                               // 343
    stream.receive({msg: 'added', collection: collName, id: LocalCollection._idStringify(docId),                     // 344
                    fields: {value: 'tuesday'}});                                                                    // 345
    test.equal(coll.find({}).count(), 1);                                                                            // 346
    test.equal(coll.find({value: 'friday!'}).count(), 1);                                                            // 347
    test.equal(counts, {added: 1, removed: 0, changed: 0, moved: 0});                                                // 348
                                                                                                                     // 349
    // send another methods (unknown on client)                                                                      // 350
    var callback2Fired = false;                                                                                      // 351
    conn.call('do_something_else', 'monday', function (err, res) {                                                   // 352
      callback2Fired = true;                                                                                         // 353
    });                                                                                                              // 354
    test.isFalse(callback1Fired);                                                                                    // 355
    test.isFalse(callback2Fired);                                                                                    // 356
                                                                                                                     // 357
    // test we still send a method request to server                                                                 // 358
    var message2 = JSON.parse(stream.sent.shift());                                                                  // 359
    test.equal(message2, {msg: 'method', method: 'do_something_else',                                                // 360
                          params: ['monday'], id: message2.id});                                                     // 361
                                                                                                                     // 362
    // get the first data satisfied message. changes are applied to database even                                    // 363
    // though another method is outstanding, because the other method didn't have                                    // 364
    // a stub. and its callback is called.                                                                           // 365
    stream.receive({msg: 'updated', 'methods': [message.id]});                                                       // 366
    test.isTrue(callback1Fired);                                                                                     // 367
    test.isFalse(callback2Fired);                                                                                    // 368
                                                                                                                     // 369
    test.equal(coll.find({}).count(), 1);                                                                            // 370
    test.equal(coll.find({value: 'tuesday'}).count(), 1);                                                            // 371
    test.equal(counts, {added: 1, removed: 0, changed: 1, moved: 0});                                                // 372
                                                                                                                     // 373
    // second result                                                                                                 // 374
    stream.receive({msg: 'result', id:message2.id, result:"bupkis"});                                                // 375
    test.isFalse(callback2Fired);                                                                                    // 376
                                                                                                                     // 377
    // get second satisfied; no new changes are applied.                                                             // 378
    stream.receive({msg: 'updated', 'methods': [message2.id]});                                                      // 379
    test.isTrue(callback2Fired);                                                                                     // 380
                                                                                                                     // 381
    test.equal(coll.find({}).count(), 1);                                                                            // 382
    test.equal(coll.find({value: 'tuesday', _id: docId}).count(), 1);                                                // 383
    test.equal(counts, {added: 1, removed: 0, changed: 1, moved: 0});                                                // 384
                                                                                                                     // 385
    handle.stop();                                                                                                   // 386
  });                                                                                                                // 387
}                                                                                                                    // 388
                                                                                                                     // 389
Tinytest.add("livedata stub - mutating method args", function (test) {                                               // 390
  var stream = new StubStream();                                                                                     // 391
  var conn = newConnection(stream);                                                                                  // 392
                                                                                                                     // 393
  startAndConnect(test, stream);                                                                                     // 394
                                                                                                                     // 395
  conn.methods({mutateArgs: function (arg) {                                                                         // 396
    arg.foo = 42;                                                                                                    // 397
  }});                                                                                                               // 398
                                                                                                                     // 399
  conn.call('mutateArgs', {foo: 50}, _.identity);                                                                    // 400
                                                                                                                     // 401
  // Method should be called with original arg, not mutated arg.                                                     // 402
  var message = JSON.parse(stream.sent.shift());                                                                     // 403
  test.equal(message, {msg: 'method', method: 'mutateArgs',                                                          // 404
                       params: [{foo: 50}], id: message.id});                                                        // 405
  test.length(stream.sent, 0);                                                                                       // 406
});                                                                                                                  // 407
                                                                                                                     // 408
var observeCursor = function (test, cursor) {                                                                        // 409
  var counts = {added: 0, removed: 0, changed: 0, moved: 0};                                                         // 410
  var expectedCounts = _.clone(counts);                                                                              // 411
  var handle = cursor.observe(                                                                                       // 412
    { addedAt: function () { counts.added += 1; },                                                                   // 413
      removedAt: function () { counts.removed += 1; },                                                               // 414
      changedAt: function () { counts.changed += 1; },                                                               // 415
      movedTo: function () { counts.moved += 1; }                                                                    // 416
    });                                                                                                              // 417
  return {                                                                                                           // 418
    stop: _.bind(handle.stop, handle),                                                                               // 419
    expectCallbacks: function (delta) {                                                                              // 420
      _.each(delta, function (mod, field) {                                                                          // 421
        expectedCounts[field] += mod;                                                                                // 422
      });                                                                                                            // 423
      test.equal(counts, expectedCounts);                                                                            // 424
    }                                                                                                                // 425
  };                                                                                                                 // 426
};                                                                                                                   // 427
                                                                                                                     // 428
// method calls another method in simulation. see not sent.                                                          // 429
if (Meteor.isClient) {                                                                                               // 430
  Tinytest.add("livedata stub - methods calling methods", function (test) {                                          // 431
    var stream = new StubStream();                                                                                   // 432
    var conn = newConnection(stream);                                                                                // 433
                                                                                                                     // 434
    startAndConnect(test, stream);                                                                                   // 435
                                                                                                                     // 436
    var coll_name = Random.id();                                                                                     // 437
    var coll = new Meteor.Collection(coll_name, {connection: conn});                                                 // 438
                                                                                                                     // 439
    // setup methods                                                                                                 // 440
    conn.methods({                                                                                                   // 441
      do_something: function () {                                                                                    // 442
        conn.call('do_something_else');                                                                              // 443
      },                                                                                                             // 444
      do_something_else: function () {                                                                               // 445
        coll.insert({a: 1});                                                                                         // 446
      }                                                                                                              // 447
    });                                                                                                              // 448
                                                                                                                     // 449
    var o = observeCursor(test, coll.find());                                                                        // 450
                                                                                                                     // 451
    // call method.                                                                                                  // 452
    conn.call('do_something', _.identity);                                                                           // 453
                                                                                                                     // 454
    // see we only send message for outer methods                                                                    // 455
    var message = JSON.parse(stream.sent.shift());                                                                   // 456
    test.equal(message, {msg: 'method', method: 'do_something',                                                      // 457
                         params: [], id:message.id});                                                                // 458
    test.length(stream.sent, 0);                                                                                     // 459
                                                                                                                     // 460
    // but inner method runs locally.                                                                                // 461
    o.expectCallbacks({added: 1});                                                                                   // 462
    test.equal(coll.find().count(), 1);                                                                              // 463
    var docId = coll.findOne()._id;                                                                                  // 464
    test.equal(coll.findOne(), {_id: docId, a: 1});                                                                  // 465
                                                                                                                     // 466
    // we get the results                                                                                            // 467
    stream.receive({msg: 'result', id:message.id, result:"1234"});                                                   // 468
                                                                                                                     // 469
    // get data from the method. data from this doc does not show up yet, but data                                   // 470
    // from another doc does.                                                                                        // 471
    stream.receive({msg: 'added', collection: coll_name, id: LocalCollection._idStringify(docId),                    // 472
                    fields: {value: 'tuesday'}});                                                                    // 473
    o.expectCallbacks();                                                                                             // 474
    test.equal(coll.findOne(docId), {_id: docId, a: 1});                                                             // 475
    stream.receive({msg: 'added', collection: coll_name, id: 'monkey',                                               // 476
                    fields: {value: 'bla'}});                                                                        // 477
    o.expectCallbacks({added: 1});                                                                                   // 478
    test.equal(coll.findOne(docId), {_id: docId, a: 1});                                                             // 479
    var newDoc = coll.findOne({value: 'bla'});                                                                       // 480
    test.isTrue(newDoc);                                                                                             // 481
    test.equal(newDoc, {_id: newDoc._id, value: 'bla'});                                                             // 482
                                                                                                                     // 483
    // get method satisfied. all data shows up. the 'a' field is reverted and                                        // 484
    // 'value' field is set.                                                                                         // 485
    stream.receive({msg: 'updated', 'methods': [message.id]});                                                       // 486
    o.expectCallbacks({changed: 1});                                                                                 // 487
    test.equal(coll.findOne(docId), {_id: docId, value: 'tuesday'});                                                 // 488
    test.equal(coll.findOne(newDoc._id), {_id: newDoc._id, value: 'bla'});                                           // 489
                                                                                                                     // 490
    o.stop();                                                                                                        // 491
  });                                                                                                                // 492
}                                                                                                                    // 493
Tinytest.add("livedata stub - method call before connect", function (test) {                                         // 494
  var stream = new StubStream;                                                                                       // 495
  var conn = newConnection(stream);                                                                                  // 496
                                                                                                                     // 497
  var callbackOutput = [];                                                                                           // 498
  conn.call('someMethod', function (err, result) {                                                                   // 499
    callbackOutput.push(result);                                                                                     // 500
  });                                                                                                                // 501
  test.equal(callbackOutput, []);                                                                                    // 502
                                                                                                                     // 503
  // the real stream drops all output pre-connection                                                                 // 504
  stream.sent.length = 0;                                                                                            // 505
                                                                                                                     // 506
  // Now connect.                                                                                                    // 507
  stream.reset();                                                                                                    // 508
                                                                                                                     // 509
  testGotMessage(test, stream, makeConnectMessage());                                                                // 510
  testGotMessage(test, stream, {msg: 'method', method: 'someMethod',                                                 // 511
                                params: [], id: '*'});                                                               // 512
});                                                                                                                  // 513
                                                                                                                     // 514
Tinytest.add("livedata stub - reconnect", function (test) {                                                          // 515
  var stream = new StubStream();                                                                                     // 516
  var conn = newConnection(stream);                                                                                  // 517
                                                                                                                     // 518
  startAndConnect(test, stream);                                                                                     // 519
                                                                                                                     // 520
  var collName = Random.id();                                                                                        // 521
  var coll = new Meteor.Collection(collName, {connection: conn});                                                    // 522
                                                                                                                     // 523
  var o = observeCursor(test, coll.find());                                                                          // 524
                                                                                                                     // 525
  // subscribe                                                                                                       // 526
  var subCallbackFired = false;                                                                                      // 527
  var sub = conn.subscribe('my_data', function () {                                                                  // 528
    subCallbackFired = true;                                                                                         // 529
  });                                                                                                                // 530
  test.isFalse(subCallbackFired);                                                                                    // 531
                                                                                                                     // 532
  var subMessage = JSON.parse(stream.sent.shift());                                                                  // 533
  test.equal(subMessage, {msg: 'sub', name: 'my_data', params: [],                                                   // 534
                          id: subMessage.id});                                                                       // 535
                                                                                                                     // 536
  // get some data. it shows up.                                                                                     // 537
  stream.receive({msg: 'added', collection: collName,                                                                // 538
                  id: '1234', fields: {a:1}});                                                                       // 539
                                                                                                                     // 540
  test.equal(coll.find({}).count(), 1);                                                                              // 541
  o.expectCallbacks({added: 1});                                                                                     // 542
  test.isFalse(subCallbackFired);                                                                                    // 543
                                                                                                                     // 544
  stream.receive({msg: 'changed', collection: collName,                                                              // 545
                  id: '1234', fields: {b:2}});                                                                       // 546
  stream.receive({msg: 'ready',                                                                                      // 547
                  subs: [subMessage.id] // satisfy sub                                                               // 548
                 });                                                                                                 // 549
  test.isTrue(subCallbackFired);                                                                                     // 550
  subCallbackFired = false; // re-arm for test that it doesn't fire again.                                           // 551
                                                                                                                     // 552
  test.equal(coll.find({a:1, b:2}).count(), 1);                                                                      // 553
  o.expectCallbacks({changed: 1});                                                                                   // 554
                                                                                                                     // 555
  // call method.                                                                                                    // 556
  var methodCallbackFired = false;                                                                                   // 557
  conn.call('do_something', function () {                                                                            // 558
    methodCallbackFired = true;                                                                                      // 559
  });                                                                                                                // 560
                                                                                                                     // 561
  conn.apply('do_something_else', [], {wait: true}, _.identity);                                                     // 562
  conn.apply('do_something_later', [], _.identity);                                                                  // 563
                                                                                                                     // 564
  test.isFalse(methodCallbackFired);                                                                                 // 565
                                                                                                                     // 566
  // The non-wait method should send, but not the wait method.                                                       // 567
  var methodMessage = JSON.parse(stream.sent.shift());                                                               // 568
  test.equal(methodMessage, {msg: 'method', method: 'do_something',                                                  // 569
                             params: [], id:methodMessage.id});                                                      // 570
  test.equal(stream.sent.length, 0);                                                                                 // 571
                                                                                                                     // 572
  // more data. shows up immediately because there was no relevant method stub.                                      // 573
  stream.receive({msg: 'changed', collection: collName,                                                              // 574
                  id: '1234', fields: {c:3}});                                                                       // 575
  test.equal(coll.findOne('1234'), {_id: '1234', a: 1, b: 2, c: 3});                                                 // 576
  o.expectCallbacks({changed: 1});                                                                                   // 577
                                                                                                                     // 578
  // stream reset. reconnect!  we send a connect, our pending method, and our                                        // 579
  // sub. The wait method still is blocked.                                                                          // 580
  stream.reset();                                                                                                    // 581
                                                                                                                     // 582
  testGotMessage(test, stream, makeConnectMessage(SESSION_ID));                                                      // 583
  testGotMessage(test, stream, methodMessage);                                                                       // 584
  testGotMessage(test, stream, subMessage);                                                                          // 585
                                                                                                                     // 586
  // reconnect with different session id                                                                             // 587
  stream.receive({msg: 'connected', session: SESSION_ID + 1});                                                       // 588
                                                                                                                     // 589
  // resend data. doesn't show up: we're in reconnect quiescence.                                                    // 590
  stream.receive({msg: 'added', collection: collName,                                                                // 591
                  id: '1234', fields: {a:1, b:2, c:3, d: 4}});                                                       // 592
  stream.receive({msg: 'added', collection: collName,                                                                // 593
                  id: '2345', fields: {e: 5}});                                                                      // 594
  test.equal(coll.findOne('1234'), {_id: '1234', a: 1, b: 2, c: 3});                                                 // 595
  test.isFalse(coll.findOne('2345'));                                                                                // 596
  o.expectCallbacks();                                                                                               // 597
                                                                                                                     // 598
  // satisfy and return the method                                                                                   // 599
  stream.receive({msg: 'updated',                                                                                    // 600
                  methods: [methodMessage.id]});                                                                     // 601
  test.isFalse(methodCallbackFired);                                                                                 // 602
  stream.receive({msg: 'result', id:methodMessage.id, result:"bupkis"});                                             // 603
  // The callback still doesn't fire (and we don't send the wait method): we're                                      // 604
  // still in global quiescence                                                                                      // 605
  test.isFalse(methodCallbackFired);                                                                                 // 606
  test.equal(stream.sent.length, 0);                                                                                 // 607
                                                                                                                     // 608
  // still no update.                                                                                                // 609
  test.equal(coll.findOne('1234'), {_id: '1234', a: 1, b: 2, c: 3});                                                 // 610
  test.isFalse(coll.findOne('2345'));                                                                                // 611
  o.expectCallbacks();                                                                                               // 612
                                                                                                                     // 613
  // re-satisfy sub                                                                                                  // 614
  stream.receive({msg: 'ready', subs: [subMessage.id]});                                                             // 615
                                                                                                                     // 616
  // now the doc changes and method callback is called, and the wait method is                                       // 617
  // sent. the sub callback isn't re-called.                                                                         // 618
  test.isTrue(methodCallbackFired);                                                                                  // 619
  test.isFalse(subCallbackFired);                                                                                    // 620
  test.equal(coll.findOne('1234'), {_id: '1234', a: 1, b: 2, c: 3, d: 4});                                           // 621
  test.equal(coll.findOne('2345'), {_id: '2345', e: 5});                                                             // 622
  o.expectCallbacks({added: 1, changed: 1});                                                                         // 623
                                                                                                                     // 624
  var waitMethodMessage = JSON.parse(stream.sent.shift());                                                           // 625
  test.equal(waitMethodMessage, {msg: 'method', method: 'do_something_else',                                         // 626
                                 params: [], id: waitMethodMessage.id});                                             // 627
  test.equal(stream.sent.length, 0);                                                                                 // 628
  stream.receive({msg: 'result', id: waitMethodMessage.id, result: "bupkis"});                                       // 629
  test.equal(stream.sent.length, 0);                                                                                 // 630
  stream.receive({msg: 'updated', methods: [waitMethodMessage.id]});                                                 // 631
                                                                                                                     // 632
  // wait method done means we can send the third method                                                             // 633
  test.equal(stream.sent.length, 1);                                                                                 // 634
  var laterMethodMessage = JSON.parse(stream.sent.shift());                                                          // 635
  test.equal(laterMethodMessage, {msg: 'method', method: 'do_something_later',                                       // 636
                                  params: [], id: laterMethodMessage.id});                                           // 637
                                                                                                                     // 638
  o.stop();                                                                                                          // 639
});                                                                                                                  // 640
                                                                                                                     // 641
                                                                                                                     // 642
if (Meteor.isClient) {                                                                                               // 643
  Tinytest.add("livedata stub - reconnect method which only got result", function (test) {                           // 644
    var stream = new StubStream;                                                                                     // 645
    var conn = newConnection(stream);                                                                                // 646
    startAndConnect(test, stream);                                                                                   // 647
                                                                                                                     // 648
    var collName = Random.id();                                                                                      // 649
    var coll = new Meteor.Collection(collName, {connection: conn});                                                  // 650
    var o = observeCursor(test, coll.find());                                                                        // 651
                                                                                                                     // 652
    conn.methods({writeSomething: function () {                                                                      // 653
      // stub write                                                                                                  // 654
      coll.insert({foo: 'bar'});                                                                                     // 655
    }});                                                                                                             // 656
                                                                                                                     // 657
    test.equal(coll.find({foo: 'bar'}).count(), 0);                                                                  // 658
                                                                                                                     // 659
    // Call a method. We'll get the result but not data-done before reconnect.                                       // 660
    var callbackOutput = [];                                                                                         // 661
    var onResultReceivedOutput = [];                                                                                 // 662
    conn.apply('writeSomething', [],                                                                                 // 663
               {onResultReceived: function (err, result) {                                                           // 664
                 onResultReceivedOutput.push(result);                                                                // 665
               }},                                                                                                   // 666
               function (err, result) {                                                                              // 667
                 callbackOutput.push(result);                                                                        // 668
               });                                                                                                   // 669
    // Stub write is visible.                                                                                        // 670
    test.equal(coll.find({foo: 'bar'}).count(), 1);                                                                  // 671
    var stubWrittenId = coll.findOne({foo: 'bar'})._id;                                                              // 672
    o.expectCallbacks({added: 1});                                                                                   // 673
    // Callback not called.                                                                                          // 674
    test.equal(callbackOutput, []);                                                                                  // 675
    test.equal(onResultReceivedOutput, []);                                                                          // 676
    // Method sent.                                                                                                  // 677
    var methodId = testGotMessage(                                                                                   // 678
      test, stream, {msg: 'method', method: 'writeSomething',                                                        // 679
                     params: [], id: '*'});                                                                          // 680
    test.equal(stream.sent.length, 0);                                                                               // 681
                                                                                                                     // 682
    // Get some data.                                                                                                // 683
    stream.receive({msg: 'added', collection: collName,                                                              // 684
                    id: LocalCollection._idStringify(stubWrittenId), fields: {baz: 42}});                            // 685
    // It doesn't show up yet.                                                                                       // 686
    test.equal(coll.find().count(), 1);                                                                              // 687
    test.equal(coll.findOne(stubWrittenId), {_id: stubWrittenId, foo: 'bar'});                                       // 688
    o.expectCallbacks();                                                                                             // 689
                                                                                                                     // 690
    // Get the result.                                                                                               // 691
    stream.receive({msg: 'result', id: methodId, result: 'bla'});                                                    // 692
    // Data unaffected.                                                                                              // 693
    test.equal(coll.find().count(), 1);                                                                              // 694
    test.equal(coll.findOne(stubWrittenId), {_id: stubWrittenId, foo: 'bar'});                                       // 695
    o.expectCallbacks();                                                                                             // 696
    // Callback not called, but onResultReceived is.                                                                 // 697
    test.equal(callbackOutput, []);                                                                                  // 698
    test.equal(onResultReceivedOutput, ['bla']);                                                                     // 699
                                                                                                                     // 700
    // Reset stream. Method does NOT get resent, because its result is already                                       // 701
    // in. Reconnect quiescence happens as soon as 'connected' is received because                                   // 702
    // there are no pending methods or subs in need of revival.                                                      // 703
    stream.reset();                                                                                                  // 704
    testGotMessage(test, stream, makeConnectMessage(SESSION_ID));                                                    // 705
    // Still holding out hope for session resumption, so nothing updated yet.                                        // 706
    test.equal(coll.find().count(), 1);                                                                              // 707
    test.equal(coll.findOne(stubWrittenId), {_id: stubWrittenId, foo: 'bar'});                                       // 708
    o.expectCallbacks();                                                                                             // 709
    test.equal(callbackOutput, []);                                                                                  // 710
                                                                                                                     // 711
    // Receive 'connected': time for reconnect quiescence! Data gets updated                                         // 712
    // locally (ie, data is reset) and callback gets called.                                                         // 713
    stream.receive({msg: 'connected', session: SESSION_ID + 1});                                                     // 714
    test.equal(coll.find().count(), 0);                                                                              // 715
    o.expectCallbacks({removed: 1});                                                                                 // 716
    test.equal(callbackOutput, ['bla']);                                                                             // 717
    test.equal(onResultReceivedOutput, ['bla']);                                                                     // 718
    stream.receive({msg: 'added', collection: collName,                                                              // 719
                    id: LocalCollection._idStringify(stubWrittenId), fields: {baz: 42}});                            // 720
    test.equal(coll.findOne(stubWrittenId), {_id: stubWrittenId, baz: 42});                                          // 721
    o.expectCallbacks({added: 1});                                                                                   // 722
                                                                                                                     // 723
                                                                                                                     // 724
                                                                                                                     // 725
                                                                                                                     // 726
    // Run method again. We're going to do the same thing this time, except we're                                    // 727
    // also going to use an onReconnect to insert another method at reconnect                                        // 728
    // time, which will delay reconnect quiescence.                                                                  // 729
    conn.apply('writeSomething', [],                                                                                 // 730
               {onResultReceived: function (err, result) {                                                           // 731
                 onResultReceivedOutput.push(result);                                                                // 732
               }},                                                                                                   // 733
               function (err, result) {                                                                              // 734
                 callbackOutput.push(result);                                                                        // 735
               });                                                                                                   // 736
    // Stub write is visible.                                                                                        // 737
    test.equal(coll.find({foo: 'bar'}).count(), 1);                                                                  // 738
    var stubWrittenId2 = coll.findOne({foo: 'bar'})._id;                                                             // 739
    o.expectCallbacks({added: 1});                                                                                   // 740
    // Callback not called.                                                                                          // 741
    test.equal(callbackOutput, ['bla']);                                                                             // 742
    test.equal(onResultReceivedOutput, ['bla']);                                                                     // 743
    // Method sent.                                                                                                  // 744
    var methodId2 = testGotMessage(                                                                                  // 745
      test, stream, {msg: 'method', method: 'writeSomething',                                                        // 746
                     params: [], id: '*'});                                                                          // 747
    test.equal(stream.sent.length, 0);                                                                               // 748
                                                                                                                     // 749
    // Get some data.                                                                                                // 750
    stream.receive({msg: 'added', collection: collName,                                                              // 751
                    id: LocalCollection._idStringify(stubWrittenId2), fields: {baz: 42}});                           // 752
    // It doesn't show up yet.                                                                                       // 753
    test.equal(coll.find().count(), 2);                                                                              // 754
    test.equal(coll.findOne(stubWrittenId2), {_id: stubWrittenId2, foo: 'bar'});                                     // 755
    o.expectCallbacks();                                                                                             // 756
                                                                                                                     // 757
    // Get the result.                                                                                               // 758
    stream.receive({msg: 'result', id: methodId2, result: 'blab'});                                                  // 759
    // Data unaffected.                                                                                              // 760
    test.equal(coll.find().count(), 2);                                                                              // 761
    test.equal(coll.findOne(stubWrittenId2), {_id: stubWrittenId2, foo: 'bar'});                                     // 762
    o.expectCallbacks();                                                                                             // 763
    // Callback not called, but onResultReceived is.                                                                 // 764
    test.equal(callbackOutput, ['bla']);                                                                             // 765
    test.equal(onResultReceivedOutput, ['bla', 'blab']);                                                             // 766
    conn.onReconnect = function () {                                                                                 // 767
      conn.call('slowMethod', function (err, result) {                                                               // 768
        callbackOutput.push(result);                                                                                 // 769
      });                                                                                                            // 770
    };                                                                                                               // 771
                                                                                                                     // 772
    // Reset stream. Method does NOT get resent, because its result is already in,                                   // 773
    // but slowMethod gets called via onReconnect. Reconnect quiescence is now                                       // 774
    // blocking on slowMethod.                                                                                       // 775
    stream.reset();                                                                                                  // 776
    testGotMessage(test, stream, makeConnectMessage(SESSION_ID + 1));                                                // 777
    var slowMethodId = testGotMessage(                                                                               // 778
      test, stream,                                                                                                  // 779
      {msg: 'method', method: 'slowMethod', params: [], id: '*'});                                                   // 780
    // Still holding out hope for session resumption, so nothing updated yet.                                        // 781
    test.equal(coll.find().count(), 2);                                                                              // 782
    test.equal(coll.findOne(stubWrittenId2), {_id: stubWrittenId2, foo: 'bar'});                                     // 783
    o.expectCallbacks();                                                                                             // 784
    test.equal(callbackOutput, ['bla']);                                                                             // 785
                                                                                                                     // 786
    // Receive 'connected'... but no reconnect quiescence yet due to slowMethod.                                     // 787
    stream.receive({msg: 'connected', session: SESSION_ID + 2});                                                     // 788
    test.equal(coll.find().count(), 2);                                                                              // 789
    test.equal(coll.findOne(stubWrittenId2), {_id: stubWrittenId2, foo: 'bar'});                                     // 790
    o.expectCallbacks();                                                                                             // 791
    test.equal(callbackOutput, ['bla']);                                                                             // 792
                                                                                                                     // 793
    // Receive data matching our stub. It doesn't take effect yet.                                                   // 794
    stream.receive({msg: 'added', collection: collName,                                                              // 795
                    id: LocalCollection._idStringify(stubWrittenId2), fields: {foo: 'bar'}});                        // 796
    o.expectCallbacks();                                                                                             // 797
                                                                                                                     // 798
    // slowMethod is done writing, so we get full reconnect quiescence (but no                                       // 799
    // slowMethod callback)... ie, a reset followed by applying the data we just                                     // 800
    // got, as well as calling the callback from the method that half-finished                                       // 801
    // before reset. The net effect is deleting doc 'stubWrittenId'.                                                 // 802
    stream.receive({msg: 'updated', methods: [slowMethodId]});                                                       // 803
    test.equal(coll.find().count(), 1);                                                                              // 804
    test.equal(coll.findOne(stubWrittenId2), {_id: stubWrittenId2, foo: 'bar'});                                     // 805
    o.expectCallbacks({removed: 1});                                                                                 // 806
    test.equal(callbackOutput, ['bla', 'blab']);                                                                     // 807
                                                                                                                     // 808
    // slowMethod returns a value now.                                                                               // 809
    stream.receive({msg: 'result', id: slowMethodId, result: 'slow'});                                               // 810
    o.expectCallbacks();                                                                                             // 811
    test.equal(callbackOutput, ['bla', 'blab', 'slow']);                                                             // 812
                                                                                                                     // 813
    o.stop();                                                                                                        // 814
  });                                                                                                                // 815
}                                                                                                                    // 816
Tinytest.add("livedata stub - reconnect method which only got data", function (test) {                               // 817
  var stream = new StubStream;                                                                                       // 818
  var conn = newConnection(stream);                                                                                  // 819
  startAndConnect(test, stream);                                                                                     // 820
                                                                                                                     // 821
  var collName = Random.id();                                                                                        // 822
  var coll = new Meteor.Collection(collName, {connection: conn});                                                    // 823
  var o = observeCursor(test, coll.find());                                                                          // 824
                                                                                                                     // 825
  // Call a method. We'll get the data-done message but not the result before                                        // 826
  // reconnect.                                                                                                      // 827
  var callbackOutput = [];                                                                                           // 828
  var onResultReceivedOutput = [];                                                                                   // 829
  conn.apply('doLittle', [],                                                                                         // 830
             {onResultReceived: function (err, result) {                                                             // 831
               onResultReceivedOutput.push(result);                                                                  // 832
             }},                                                                                                     // 833
             function (err, result) {                                                                                // 834
               callbackOutput.push(result);                                                                          // 835
             });                                                                                                     // 836
  // Callbacks not called.                                                                                           // 837
  test.equal(callbackOutput, []);                                                                                    // 838
  test.equal(onResultReceivedOutput, []);                                                                            // 839
  // Method sent.                                                                                                    // 840
  var methodId = testGotMessage(                                                                                     // 841
    test, stream, {msg: 'method', method: 'doLittle',                                                                // 842
                   params: [], id: '*'});                                                                            // 843
  test.equal(stream.sent.length, 0);                                                                                 // 844
                                                                                                                     // 845
  // Get some data.                                                                                                  // 846
  stream.receive({msg: 'added', collection: collName,                                                                // 847
                  id: 'photo', fields: {baz: 42}});                                                                  // 848
  // It shows up instantly because the stub didn't write anything.                                                   // 849
  test.equal(coll.find().count(), 1);                                                                                // 850
  test.equal(coll.findOne('photo'), {_id: 'photo', baz: 42});                                                        // 851
  o.expectCallbacks({added: 1});                                                                                     // 852
                                                                                                                     // 853
  // Get the data-done message.                                                                                      // 854
  stream.receive({msg: 'updated', methods: [methodId]});                                                             // 855
  // Data still here.                                                                                                // 856
  test.equal(coll.find().count(), 1);                                                                                // 857
  test.equal(coll.findOne('photo'), {_id: 'photo', baz: 42});                                                        // 858
  o.expectCallbacks();                                                                                               // 859
  // Method callback not called yet (no result yet).                                                                 // 860
  test.equal(callbackOutput, []);                                                                                    // 861
  test.equal(onResultReceivedOutput, []);                                                                            // 862
                                                                                                                     // 863
  // Reset stream. Method gets resent (with same ID), and blocks reconnect                                           // 864
  // quiescence.                                                                                                     // 865
  stream.reset();                                                                                                    // 866
  testGotMessage(test, stream, makeConnectMessage(SESSION_ID));                                                      // 867
  testGotMessage(                                                                                                    // 868
    test, stream, {msg: 'method', method: 'doLittle',                                                                // 869
                   params: [], id: methodId});                                                                       // 870
  // Still holding out hope for session resumption, so nothing updated yet.                                          // 871
  test.equal(coll.find().count(), 1);                                                                                // 872
  test.equal(coll.findOne('photo'), {_id: 'photo', baz: 42});                                                        // 873
  o.expectCallbacks();                                                                                               // 874
  test.equal(callbackOutput, []);                                                                                    // 875
  test.equal(onResultReceivedOutput, []);                                                                            // 876
                                                                                                                     // 877
  // Receive 'connected'. Still blocking on reconnect quiescence.                                                    // 878
  stream.receive({msg: 'connected', session: SESSION_ID + 1});                                                       // 879
  test.equal(coll.find().count(), 1);                                                                                // 880
  test.equal(coll.findOne('photo'), {_id: 'photo', baz: 42});                                                        // 881
  o.expectCallbacks();                                                                                               // 882
  test.equal(callbackOutput, []);                                                                                    // 883
  test.equal(onResultReceivedOutput, []);                                                                            // 884
                                                                                                                     // 885
  // Receive method result. onResultReceived is called but the main callback                                         // 886
  // isn't (ie, we don't get confused by the fact that we got data-done the                                          // 887
  // *FIRST* time through).                                                                                          // 888
  stream.receive({msg: 'result', id: methodId, result: 'res'});                                                      // 889
  test.equal(callbackOutput, []);                                                                                    // 890
  test.equal(onResultReceivedOutput, ['res']);                                                                       // 891
                                                                                                                     // 892
  // Now we get data-done. Collection is reset and callback is called.                                               // 893
  stream.receive({msg: 'updated', methods: [methodId]});                                                             // 894
  test.equal(coll.find().count(), 0);                                                                                // 895
  o.expectCallbacks({removed: 1});                                                                                   // 896
  test.equal(callbackOutput, ['res']);                                                                               // 897
  test.equal(onResultReceivedOutput, ['res']);                                                                       // 898
                                                                                                                     // 899
  o.stop();                                                                                                          // 900
});                                                                                                                  // 901
if (Meteor.isClient) {                                                                                               // 902
  Tinytest.add("livedata stub - multiple stubs same doc", function (test) {                                          // 903
    var stream = new StubStream;                                                                                     // 904
    var conn = newConnection(stream);                                                                                // 905
    startAndConnect(test, stream);                                                                                   // 906
                                                                                                                     // 907
    var collName = Random.id();                                                                                      // 908
    var coll = new Meteor.Collection(collName, {connection: conn});                                                  // 909
    var o = observeCursor(test, coll.find());                                                                        // 910
                                                                                                                     // 911
    conn.methods({                                                                                                   // 912
      insertSomething: function () {                                                                                 // 913
        // stub write                                                                                                // 914
        coll.insert({foo: 'bar'});                                                                                   // 915
      },                                                                                                             // 916
      updateIt: function (id) {                                                                                      // 917
        coll.update(id, {$set: {baz: 42}});                                                                          // 918
      }                                                                                                              // 919
    });                                                                                                              // 920
                                                                                                                     // 921
    test.equal(coll.find().count(), 0);                                                                              // 922
                                                                                                                     // 923
    // Call the insert method.                                                                                       // 924
    conn.call('insertSomething', _.identity);                                                                        // 925
    // Stub write is visible.                                                                                        // 926
    test.equal(coll.find({foo: 'bar'}).count(), 1);                                                                  // 927
    var stubWrittenId = coll.findOne({foo: 'bar'})._id;                                                              // 928
    o.expectCallbacks({added: 1});                                                                                   // 929
    // Method sent.                                                                                                  // 930
    var insertMethodId = testGotMessage(                                                                             // 931
      test, stream, {msg: 'method', method: 'insertSomething',                                                       // 932
                     params: [], id: '*'});                                                                          // 933
    test.equal(stream.sent.length, 0);                                                                               // 934
                                                                                                                     // 935
    // Call update method.                                                                                           // 936
    conn.call('updateIt', stubWrittenId, _.identity);                                                                // 937
    // This stub write is visible too.                                                                               // 938
    test.equal(coll.find().count(), 1);                                                                              // 939
    test.equal(coll.findOne(stubWrittenId),                                                                          // 940
               {_id: stubWrittenId, foo: 'bar', baz: 42});                                                           // 941
    o.expectCallbacks({changed: 1});                                                                                 // 942
    // Method sent.                                                                                                  // 943
    var updateMethodId = testGotMessage(                                                                             // 944
      test, stream, {msg: 'method', method: 'updateIt',                                                              // 945
                     params: [stubWrittenId], id: '*'});                                                             // 946
    test.equal(stream.sent.length, 0);                                                                               // 947
                                                                                                                     // 948
    // Get some data... slightly different than what we wrote.                                                       // 949
    stream.receive({msg: 'added', collection: collName,                                                              // 950
                    id: LocalCollection._idStringify(stubWrittenId), fields: {foo: 'barb', other: 'field',           // 951
                                                                    other2: 'bla'}});                                // 952
    // It doesn't show up yet.                                                                                       // 953
    test.equal(coll.find().count(), 1);                                                                              // 954
    test.equal(coll.findOne(stubWrittenId),                                                                          // 955
               {_id: stubWrittenId, foo: 'bar', baz: 42});                                                           // 956
    o.expectCallbacks();                                                                                             // 957
                                                                                                                     // 958
    // And get the first method-done. Still no updates to minimongo: we can't                                        // 959
    // quiesce the doc until the second method is done.                                                              // 960
    stream.receive({msg: 'updated', methods: [insertMethodId]});                                                     // 961
    test.equal(coll.find().count(), 1);                                                                              // 962
    test.equal(coll.findOne(stubWrittenId),                                                                          // 963
               {_id: stubWrittenId, foo: 'bar', baz: 42});                                                           // 964
    o.expectCallbacks();                                                                                             // 965
                                                                                                                     // 966
    // More data. Not quite what we wrote. Also ignored for now.                                                     // 967
    stream.receive({msg: 'changed', collection: collName,                                                            // 968
                    id: LocalCollection._idStringify(stubWrittenId), fields: {baz: 43}, cleared: ['other']});        // 969
    test.equal(coll.find().count(), 1);                                                                              // 970
    test.equal(coll.findOne(stubWrittenId),                                                                          // 971
               {_id: stubWrittenId, foo: 'bar', baz: 42});                                                           // 972
    o.expectCallbacks();                                                                                             // 973
                                                                                                                     // 974
    // Second data-ready. Now everything takes effect!                                                               // 975
    stream.receive({msg: 'updated', methods: [updateMethodId]});                                                     // 976
    test.equal(coll.find().count(), 1);                                                                              // 977
    test.equal(coll.findOne(stubWrittenId),                                                                          // 978
               {_id: stubWrittenId, foo: 'barb', other2: 'bla',                                                      // 979
                baz: 43});                                                                                           // 980
    o.expectCallbacks({changed: 1});                                                                                 // 981
                                                                                                                     // 982
    o.stop();                                                                                                        // 983
  });                                                                                                                // 984
}                                                                                                                    // 985
                                                                                                                     // 986
if (Meteor.isClient) {                                                                                               // 987
  Tinytest.add("livedata stub - unsent methods don't block quiescence", function (test) {                            // 988
    // This test is for https://github.com/meteor/meteor/issues/555                                                  // 989
                                                                                                                     // 990
    var stream = new StubStream;                                                                                     // 991
    var conn = newConnection(stream);                                                                                // 992
    startAndConnect(test, stream);                                                                                   // 993
                                                                                                                     // 994
    var collName = Random.id();                                                                                      // 995
    var coll = new Meteor.Collection(collName, {connection: conn});                                                  // 996
                                                                                                                     // 997
    conn.methods({                                                                                                   // 998
      insertSomething: function () {                                                                                 // 999
        // stub write                                                                                                // 1000
        coll.insert({foo: 'bar'});                                                                                   // 1001
      }                                                                                                              // 1002
    });                                                                                                              // 1003
                                                                                                                     // 1004
    test.equal(coll.find().count(), 0);                                                                              // 1005
                                                                                                                     // 1006
    // Call a random method (no-op)                                                                                  // 1007
    conn.call('no-op', _.identity);                                                                                  // 1008
    // Call a wait method                                                                                            // 1009
    conn.apply('no-op', [], {wait: true}, _.identity);                                                               // 1010
    // Call a method with a stub that writes.                                                                        // 1011
    conn.call('insertSomething', _.identity);                                                                        // 1012
                                                                                                                     // 1013
                                                                                                                     // 1014
    // Stub write is visible.                                                                                        // 1015
    test.equal(coll.find({foo: 'bar'}).count(), 1);                                                                  // 1016
    var stubWrittenId = coll.findOne({foo: 'bar'})._id;                                                              // 1017
                                                                                                                     // 1018
    // first method sent                                                                                             // 1019
    var firstMethodId = testGotMessage(                                                                              // 1020
      test, stream, {msg: 'method', method: 'no-op',                                                                 // 1021
                     params: [], id: '*'});                                                                          // 1022
    test.equal(stream.sent.length, 0);                                                                               // 1023
                                                                                                                     // 1024
    // ack the first method                                                                                          // 1025
    stream.receive({msg: 'updated', methods: [firstMethodId]});                                                      // 1026
    stream.receive({msg: 'result', id: firstMethodId});                                                              // 1027
                                                                                                                     // 1028
    // Wait method sent.                                                                                             // 1029
    var waitMethodId = testGotMessage(                                                                               // 1030
      test, stream, {msg: 'method', method: 'no-op',                                                                 // 1031
                     params: [], id: '*'});                                                                          // 1032
    test.equal(stream.sent.length, 0);                                                                               // 1033
                                                                                                                     // 1034
    // ack the wait method                                                                                           // 1035
    stream.receive({msg: 'updated', methods: [waitMethodId]});                                                       // 1036
    stream.receive({msg: 'result', id: waitMethodId});                                                               // 1037
                                                                                                                     // 1038
    // insert method sent.                                                                                           // 1039
    var insertMethodId = testGotMessage(                                                                             // 1040
      test, stream, {msg: 'method', method: 'insertSomething',                                                       // 1041
                     params: [], id: '*'});                                                                          // 1042
    test.equal(stream.sent.length, 0);                                                                               // 1043
                                                                                                                     // 1044
    // ack the insert method                                                                                         // 1045
    stream.receive({msg: 'updated', methods: [insertMethodId]});                                                     // 1046
    stream.receive({msg: 'result', id: insertMethodId});                                                             // 1047
                                                                                                                     // 1048
    // simulation reverted.                                                                                          // 1049
    test.equal(coll.find({foo: 'bar'}).count(), 0);                                                                  // 1050
                                                                                                                     // 1051
  });                                                                                                                // 1052
}                                                                                                                    // 1053
Tinytest.add("livedata stub - reactive resub", function (test) {                                                     // 1054
  var stream = new StubStream();                                                                                     // 1055
  var conn = newConnection(stream);                                                                                  // 1056
                                                                                                                     // 1057
  startAndConnect(test, stream);                                                                                     // 1058
                                                                                                                     // 1059
  var readiedSubs = {};                                                                                              // 1060
  var markAllReady = function () {                                                                                   // 1061
    // synthesize a "ready" message in response to any "sub"                                                         // 1062
    // message with an id we haven't seen before                                                                     // 1063
    _.each(stream.sent, function (msg) {                                                                             // 1064
      msg = JSON.parse(msg);                                                                                         // 1065
      if (msg.msg === 'sub' && ! _.has(readiedSubs, msg.id)) {                                                       // 1066
        stream.receive({msg: 'ready', subs: [msg.id]});                                                              // 1067
        readiedSubs[msg.id] = true;                                                                                  // 1068
      }                                                                                                              // 1069
    });                                                                                                              // 1070
  };                                                                                                                 // 1071
                                                                                                                     // 1072
  var fooArg = new ReactiveVar('A');                                                                                 // 1073
  var fooReady = 0;                                                                                                  // 1074
                                                                                                                     // 1075
  var inner;                                                                                                         // 1076
  var outer = Deps.autorun(function () {                                                                             // 1077
    inner = Deps.autorun(function () {                                                                               // 1078
      conn.subscribe("foo-sub", fooArg.get(),                                                                        // 1079
                     function () { fooReady++; });                                                                   // 1080
    });                                                                                                              // 1081
  });                                                                                                                // 1082
                                                                                                                     // 1083
  markAllReady();                                                                                                    // 1084
  test.equal(fooReady, 1);                                                                                           // 1085
                                                                                                                     // 1086
  // Rerun the inner autorun with different subscription                                                             // 1087
  // arguments.  Detect the re-sub via onReady.                                                                      // 1088
  fooArg.set('B');                                                                                                   // 1089
  test.isTrue(inner.invalidated);                                                                                    // 1090
  Deps.flush();                                                                                                      // 1091
  test.isFalse(inner.invalidated);                                                                                   // 1092
  markAllReady();                                                                                                    // 1093
  test.equal(fooReady, 2);                                                                                           // 1094
                                                                                                                     // 1095
  // Rerun inner again with same args; should be no re-sub.                                                          // 1096
  inner.invalidate();                                                                                                // 1097
  test.isTrue(inner.invalidated);                                                                                    // 1098
  Deps.flush();                                                                                                      // 1099
  test.isFalse(inner.invalidated);                                                                                   // 1100
  markAllReady();                                                                                                    // 1101
  test.equal(fooReady, 2);                                                                                           // 1102
                                                                                                                     // 1103
  // Rerun outer!  Should still be no re-sub even though                                                             // 1104
  // the inner computation is stopped and a new one is                                                               // 1105
  // started.                                                                                                        // 1106
  outer.invalidate();                                                                                                // 1107
  test.isTrue(inner.invalidated);                                                                                    // 1108
  Deps.flush();                                                                                                      // 1109
  test.isFalse(inner.invalidated);                                                                                   // 1110
  markAllReady();                                                                                                    // 1111
  test.equal(fooReady, 2);                                                                                           // 1112
                                                                                                                     // 1113
  // Change the subscription.  Now we should get an onReady.                                                         // 1114
  fooArg.set('C');                                                                                                   // 1115
  Deps.flush();                                                                                                      // 1116
  markAllReady();                                                                                                    // 1117
  test.equal(fooReady, 3);                                                                                           // 1118
});                                                                                                                  // 1119
                                                                                                                     // 1120
                                                                                                                     // 1121
                                                                                                                     // 1122
Tinytest.add("livedata connection - reactive userId", function (test) {                                              // 1123
  var stream = new StubStream();                                                                                     // 1124
  var conn = newConnection(stream);                                                                                  // 1125
                                                                                                                     // 1126
  test.equal(conn.userId(), null);                                                                                   // 1127
  conn.setUserId(1337);                                                                                              // 1128
  test.equal(conn.userId(), 1337);                                                                                   // 1129
});                                                                                                                  // 1130
                                                                                                                     // 1131
Tinytest.add("livedata connection - two wait methods", function (test) {                                             // 1132
  var stream = new StubStream();                                                                                     // 1133
  var conn = newConnection(stream);                                                                                  // 1134
  startAndConnect(test, stream);                                                                                     // 1135
                                                                                                                     // 1136
  var collName = Random.id();                                                                                        // 1137
  var coll = new Meteor.Collection(collName, {connection: conn});                                                    // 1138
                                                                                                                     // 1139
  // setup method                                                                                                    // 1140
  conn.methods({do_something: function (x) {}});                                                                     // 1141
                                                                                                                     // 1142
  var responses = [];                                                                                                // 1143
  conn.apply('do_something', ['one!'], function() { responses.push('one'); });                                       // 1144
  var one_message = JSON.parse(stream.sent.shift());                                                                 // 1145
  test.equal(one_message.params, ['one!']);                                                                          // 1146
                                                                                                                     // 1147
  conn.apply('do_something', ['two!'], {wait: true}, function() {                                                    // 1148
    responses.push('two');                                                                                           // 1149
  });                                                                                                                // 1150
  // 'two!' isn't sent yet, because it's a wait method.                                                              // 1151
  test.equal(stream.sent.length, 0);                                                                                 // 1152
                                                                                                                     // 1153
  conn.apply('do_something', ['three!'], function() {                                                                // 1154
    responses.push('three');                                                                                         // 1155
  });                                                                                                                // 1156
  conn.apply('do_something', ['four!'], function() {                                                                 // 1157
    responses.push('four');                                                                                          // 1158
  });                                                                                                                // 1159
                                                                                                                     // 1160
  conn.apply('do_something', ['five!'], {wait: true}, function() {                                                   // 1161
    responses.push('five');                                                                                          // 1162
  });                                                                                                                // 1163
                                                                                                                     // 1164
  conn.apply('do_something', ['six!'], function() { responses.push('six'); });                                       // 1165
                                                                                                                     // 1166
  // Verify that we did not send any more methods since we are still waiting on                                      // 1167
  // 'one!'.                                                                                                         // 1168
  test.equal(stream.sent.length, 0);                                                                                 // 1169
                                                                                                                     // 1170
  // Receive some data. "one" is not a wait method and there are no stubs, so it                                     // 1171
  // gets applied immediately.                                                                                       // 1172
  test.equal(coll.find().count(), 0);                                                                                // 1173
  stream.receive({msg: 'added', collection: collName,                                                                // 1174
                  id: 'foo', fields: {x: 1}});                                                                       // 1175
  test.equal(coll.find().count(), 1);                                                                                // 1176
  test.equal(coll.findOne('foo'), {_id: 'foo', x: 1});                                                               // 1177
                                                                                                                     // 1178
  // Let "one!" finish. Both messages are required to fire the callback.                                             // 1179
  stream.receive({msg: 'result', id: one_message.id});                                                               // 1180
  test.equal(responses, []);                                                                                         // 1181
  stream.receive({msg: 'updated', methods: [one_message.id]});                                                       // 1182
  test.equal(responses, ['one']);                                                                                    // 1183
                                                                                                                     // 1184
  // Now we've send out "two!".                                                                                      // 1185
  var two_message = JSON.parse(stream.sent.shift());                                                                 // 1186
  test.equal(two_message.params, ['two!']);                                                                          // 1187
                                                                                                                     // 1188
  // But still haven't sent "three!".                                                                                // 1189
  test.equal(stream.sent.length, 0);                                                                                 // 1190
                                                                                                                     // 1191
  // Receive more data. "two" is a wait method, so the data doesn't get applied                                      // 1192
  // yet.                                                                                                            // 1193
  stream.receive({msg: 'changed', collection: collName,                                                              // 1194
                  id: 'foo', fields: {y: 3}});                                                                       // 1195
  test.equal(coll.find().count(), 1);                                                                                // 1196
  test.equal(coll.findOne('foo'), {_id: 'foo', x: 1});                                                               // 1197
                                                                                                                     // 1198
  // Let "two!" finish, with its end messages in the opposite order to "one!".                                       // 1199
  stream.receive({msg: 'updated', methods: [two_message.id]});                                                       // 1200
  test.equal(responses, ['one']);                                                                                    // 1201
  test.equal(stream.sent.length, 0);                                                                                 // 1202
  // data-done message is enough to allow data to be written.                                                        // 1203
  test.equal(coll.find().count(), 1);                                                                                // 1204
  test.equal(coll.findOne('foo'), {_id: 'foo', x: 1, y: 3});                                                         // 1205
  stream.receive({msg: 'result', id: two_message.id});                                                               // 1206
  test.equal(responses, ['one', 'two']);                                                                             // 1207
                                                                                                                     // 1208
  // Verify that we just sent "three!" and "four!" now that we got                                                   // 1209
  // responses for "one!" and "two!"                                                                                 // 1210
  test.equal(stream.sent.length, 2);                                                                                 // 1211
  var three_message = JSON.parse(stream.sent.shift());                                                               // 1212
  test.equal(three_message.params, ['three!']);                                                                      // 1213
  var four_message = JSON.parse(stream.sent.shift());                                                                // 1214
  test.equal(four_message.params, ['four!']);                                                                        // 1215
                                                                                                                     // 1216
  // Out of order response is OK for non-wait methods.                                                               // 1217
  stream.receive({msg: 'result', id: three_message.id});                                                             // 1218
  stream.receive({msg: 'result', id: four_message.id});                                                              // 1219
  stream.receive({msg: 'updated', methods: [four_message.id]});                                                      // 1220
  test.equal(responses, ['one', 'two', 'four']);                                                                     // 1221
  test.equal(stream.sent.length, 0);                                                                                 // 1222
                                                                                                                     // 1223
  // Let three finish too.                                                                                           // 1224
  stream.receive({msg: 'updated', methods: [three_message.id]});                                                     // 1225
  test.equal(responses, ['one', 'two', 'four', 'three']);                                                            // 1226
                                                                                                                     // 1227
  // Verify that we just sent "five!" (the next wait method).                                                        // 1228
  test.equal(stream.sent.length, 1);                                                                                 // 1229
  var five_message = JSON.parse(stream.sent.shift());                                                                // 1230
  test.equal(five_message.params, ['five!']);                                                                        // 1231
  test.equal(responses, ['one', 'two', 'four', 'three']);                                                            // 1232
                                                                                                                     // 1233
  // Let five finish.                                                                                                // 1234
  stream.receive({msg: 'result', id: five_message.id});                                                              // 1235
  stream.receive({msg: 'updated', methods: [five_message.id]});                                                      // 1236
  test.equal(responses, ['one', 'two', 'four', 'three', 'five']);                                                    // 1237
                                                                                                                     // 1238
  var six_message = JSON.parse(stream.sent.shift());                                                                 // 1239
  test.equal(six_message.params, ['six!']);                                                                          // 1240
});                                                                                                                  // 1241
                                                                                                                     // 1242
Tinytest.add("livedata connection - onReconnect prepends messages correctly with a wait method", function(test) {    // 1243
  var stream = new StubStream();                                                                                     // 1244
  var conn = newConnection(stream);                                                                                  // 1245
  startAndConnect(test, stream);                                                                                     // 1246
                                                                                                                     // 1247
  // setup method                                                                                                    // 1248
  conn.methods({do_something: function (x) {}});                                                                     // 1249
                                                                                                                     // 1250
  conn.onReconnect = function() {                                                                                    // 1251
    conn.apply('do_something', ['reconnect zero'], _.identity);                                                      // 1252
    conn.apply('do_something', ['reconnect one'], _.identity);                                                       // 1253
    conn.apply('do_something', ['reconnect two'], {wait: true}, _.identity);                                         // 1254
    conn.apply('do_something', ['reconnect three'], _.identity);                                                     // 1255
  };                                                                                                                 // 1256
                                                                                                                     // 1257
  conn.apply('do_something', ['one'], _.identity);                                                                   // 1258
  conn.apply('do_something', ['two'], {wait: true}, _.identity);                                                     // 1259
  conn.apply('do_something', ['three'], _.identity);                                                                 // 1260
                                                                                                                     // 1261
  // reconnect                                                                                                       // 1262
  stream.sent = [];                                                                                                  // 1263
  stream.reset();                                                                                                    // 1264
  testGotMessage(test, stream, makeConnectMessage(conn._lastSessionId));                                             // 1265
                                                                                                                     // 1266
  // Test that we sent what we expect to send, and we're blocked on                                                  // 1267
  // what we expect to be blocked. The subsequent logic to correctly                                                 // 1268
  // read the wait flag is tested separately.                                                                        // 1269
  test.equal(_.map(stream.sent, function(msg) {                                                                      // 1270
    return JSON.parse(msg).params[0];                                                                                // 1271
  }), ['reconnect zero', 'reconnect one']);                                                                          // 1272
                                                                                                                     // 1273
  // white-box test:                                                                                                 // 1274
  test.equal(_.map(conn._outstandingMethodBlocks, function (block) {                                                 // 1275
    return [block.wait, _.map(block.methods, function (method) {                                                     // 1276
      return method._message.params[0];                                                                              // 1277
    })];                                                                                                             // 1278
  }), [                                                                                                              // 1279
    [false, ['reconnect zero', 'reconnect one']],                                                                    // 1280
    [true, ['reconnect two']],                                                                                       // 1281
    [false, ['reconnect three', 'one']],                                                                             // 1282
    [true, ['two']],                                                                                                 // 1283
    [false, ['three']]                                                                                               // 1284
  ]);                                                                                                                // 1285
});                                                                                                                  // 1286
                                                                                                                     // 1287
var getSelfConnectionUrl = function () {                                                                             // 1288
  if (Meteor.isClient) {                                                                                             // 1289
    return Meteor._relativeToSiteRootUrl("/");                                                                       // 1290
  } else {                                                                                                           // 1291
    return Meteor.absoluteUrl();                                                                                     // 1292
  }                                                                                                                  // 1293
};                                                                                                                   // 1294
                                                                                                                     // 1295
if (Meteor.isServer) {                                                                                               // 1296
  Meteor.methods({                                                                                                   // 1297
    reverse: function (arg) {                                                                                        // 1298
      // Return something notably different from reverse.meteor.com.                                                 // 1299
      return arg.split("").reverse().join("") + " LOCAL";                                                            // 1300
    }                                                                                                                // 1301
  });                                                                                                                // 1302
}                                                                                                                    // 1303
                                                                                                                     // 1304
testAsyncMulti("livedata connection - reconnect to a different server", [                                            // 1305
  function (test, expect) {                                                                                          // 1306
    var self = this;                                                                                                 // 1307
    self.conn = DDP.connect("reverse.meteor.com");                                                                   // 1308
    pollUntil(expect, function () {                                                                                  // 1309
      return self.conn.status().connected;                                                                           // 1310
    }, 5000, 100, true); // poll until connected, but don't fail if we don't connect                                 // 1311
  },                                                                                                                 // 1312
  function (test, expect) {                                                                                          // 1313
    var self = this;                                                                                                 // 1314
    self.doTest = self.conn.status().connected;                                                                      // 1315
    if (self.doTest) {                                                                                               // 1316
      self.conn.call("reverse", "foo", expect(function (err, res) {                                                  // 1317
        test.equal(res, "oof");                                                                                      // 1318
      }));                                                                                                           // 1319
    }                                                                                                                // 1320
  },                                                                                                                 // 1321
  function (test, expect) {                                                                                          // 1322
    var self = this;                                                                                                 // 1323
    if (self.doTest) {                                                                                               // 1324
      self.conn.reconnect({url: getSelfConnectionUrl()});                                                            // 1325
      self.conn.call("reverse", "bar", expect(function (err, res) {                                                  // 1326
        test.equal(res, "rab LOCAL");                                                                                // 1327
      }));                                                                                                           // 1328
    }                                                                                                                // 1329
  }                                                                                                                  // 1330
]);                                                                                                                  // 1331
                                                                                                                     // 1332
Tinytest.addAsync("livedata connection - version negotiation requires renegotiating",                                // 1333
                  function (test, onComplete) {                                                                      // 1334
  var connection = new LivedataTest.Connection(getSelfConnectionUrl(), {                                             // 1335
    reloadWithOutstanding: true,                                                                                     // 1336
    supportedDDPVersions: ["garbled", LivedataTest.SUPPORTED_DDP_VERSIONS[0]],                                       // 1337
    onDDPVersionNegotiationFailure: function () { test.fail(); onComplete(); },                                      // 1338
    onConnected: function () {                                                                                       // 1339
      test.equal(connection._version, LivedataTest.SUPPORTED_DDP_VERSIONS[0]);                                       // 1340
      connection._stream.disconnect({_permanent: true});                                                             // 1341
      onComplete();                                                                                                  // 1342
    }                                                                                                                // 1343
  });                                                                                                                // 1344
});                                                                                                                  // 1345
                                                                                                                     // 1346
Tinytest.addAsync("livedata connection - version negotiation error",                                                 // 1347
                  function (test, onComplete) {                                                                      // 1348
  var connection = new LivedataTest.Connection(getSelfConnectionUrl(), {                                             // 1349
    reloadWithOutstanding: true,                                                                                     // 1350
    supportedDDPVersions: ["garbled", "more garbled"],                                                               // 1351
    onDDPVersionNegotiationFailure: function () {                                                                    // 1352
      test.equal(connection.status().status, "failed");                                                              // 1353
      test.matches(connection.status().reason, /DDP version negotiation failed/);                                    // 1354
      test.isFalse(connection.status().connected);                                                                   // 1355
      onComplete();                                                                                                  // 1356
    },                                                                                                               // 1357
    onConnected: function () {                                                                                       // 1358
      test.fail();                                                                                                   // 1359
      onComplete();                                                                                                  // 1360
    }                                                                                                                // 1361
  });                                                                                                                // 1362
});                                                                                                                  // 1363
                                                                                                                     // 1364
Tinytest.add("livedata connection - onReconnect prepends messages correctly without a wait method", function(test) { // 1365
  var stream = new StubStream();                                                                                     // 1366
  var conn = newConnection(stream);                                                                                  // 1367
  startAndConnect(test, stream);                                                                                     // 1368
                                                                                                                     // 1369
  // setup method                                                                                                    // 1370
  conn.methods({do_something: function (x) {}});                                                                     // 1371
                                                                                                                     // 1372
  conn.onReconnect = function() {                                                                                    // 1373
    conn.apply('do_something', ['reconnect one'], _.identity);                                                       // 1374
    conn.apply('do_something', ['reconnect two'], _.identity);                                                       // 1375
    conn.apply('do_something', ['reconnect three'], _.identity);                                                     // 1376
  };                                                                                                                 // 1377
                                                                                                                     // 1378
  conn.apply('do_something', ['one'], _.identity);                                                                   // 1379
  conn.apply('do_something', ['two'], {wait: true}, _.identity);                                                     // 1380
  conn.apply('do_something', ['three'], {wait: true}, _.identity);                                                   // 1381
  conn.apply('do_something', ['four'], _.identity);                                                                  // 1382
                                                                                                                     // 1383
  // reconnect                                                                                                       // 1384
  stream.sent = [];                                                                                                  // 1385
  stream.reset();                                                                                                    // 1386
  testGotMessage(test, stream, makeConnectMessage(conn._lastSessionId));                                             // 1387
                                                                                                                     // 1388
  // Test that we sent what we expect to send, and we're blocked on                                                  // 1389
  // what we expect to be blocked. The subsequent logic to correctly                                                 // 1390
  // read the wait flag is tested separately.                                                                        // 1391
  test.equal(_.map(stream.sent, function(msg) {                                                                      // 1392
    return JSON.parse(msg).params[0];                                                                                // 1393
  }), ['reconnect one', 'reconnect two', 'reconnect three', 'one']);                                                 // 1394
                                                                                                                     // 1395
  // white-box test:                                                                                                 // 1396
  test.equal(_.map(conn._outstandingMethodBlocks, function (block) {                                                 // 1397
    return [block.wait, _.map(block.methods, function (method) {                                                     // 1398
      return method._message.params[0];                                                                              // 1399
    })];                                                                                                             // 1400
  }), [                                                                                                              // 1401
    [false, ['reconnect one', 'reconnect two', 'reconnect three', 'one']],                                           // 1402
    [true, ['two']],                                                                                                 // 1403
    [true, ['three']],                                                                                               // 1404
    [false, ['four']]                                                                                                // 1405
  ]);                                                                                                                // 1406
});                                                                                                                  // 1407
                                                                                                                     // 1408
Tinytest.add("livedata connection - onReconnect with sent messages", function(test) {                                // 1409
  var stream = new StubStream();                                                                                     // 1410
  var conn = newConnection(stream);                                                                                  // 1411
  startAndConnect(test, stream);                                                                                     // 1412
                                                                                                                     // 1413
  // setup method                                                                                                    // 1414
  conn.methods({do_something: function (x) {}});                                                                     // 1415
                                                                                                                     // 1416
  conn.onReconnect = function() {                                                                                    // 1417
    conn.apply('do_something', ['login'], {wait: true}, _.identity);                                                 // 1418
  };                                                                                                                 // 1419
                                                                                                                     // 1420
  conn.apply('do_something', ['one'], _.identity);                                                                   // 1421
                                                                                                                     // 1422
  // initial connect                                                                                                 // 1423
  stream.sent = [];                                                                                                  // 1424
  stream.reset();                                                                                                    // 1425
  testGotMessage(                                                                                                    // 1426
    test, stream, makeConnectMessage(conn._lastSessionId));                                                          // 1427
                                                                                                                     // 1428
  // Test that we sent just the login message.                                                                       // 1429
  var loginId = testGotMessage(                                                                                      // 1430
    test, stream, {msg: 'method', method: 'do_something',                                                            // 1431
                   params: ['login'], id: '*'});                                                                     // 1432
                                                                                                                     // 1433
  // we connect.                                                                                                     // 1434
  stream.receive({msg: 'connected', session: Random.id()});                                                          // 1435
  test.length(stream.sent, 0);                                                                                       // 1436
                                                                                                                     // 1437
  // login got result (but not yet data)                                                                             // 1438
  stream.receive({msg: 'result', id: loginId, result: 'foo'});                                                       // 1439
  test.length(stream.sent, 0);                                                                                       // 1440
                                                                                                                     // 1441
  // login got data. now we send next method.                                                                        // 1442
  stream.receive({msg: 'updated', methods: [loginId]});                                                              // 1443
                                                                                                                     // 1444
  testGotMessage(                                                                                                    // 1445
    test, stream, {msg: 'method', method: 'do_something',                                                            // 1446
                   params: ['one'], id: '*'});                                                                       // 1447
});                                                                                                                  // 1448
                                                                                                                     // 1449
                                                                                                                     // 1450
                                                                                                                     // 1451
Tinytest.add("livedata stub - reconnect double wait method", function (test) {                                       // 1452
  var stream = new StubStream;                                                                                       // 1453
  var conn = newConnection(stream);                                                                                  // 1454
  startAndConnect(test, stream);                                                                                     // 1455
                                                                                                                     // 1456
  var output = [];                                                                                                   // 1457
  conn.onReconnect = function () {                                                                                   // 1458
    conn.apply('reconnectMethod', [], {wait: true}, function (err, result) {                                         // 1459
      output.push('reconnect');                                                                                      // 1460
    });                                                                                                              // 1461
  };                                                                                                                 // 1462
                                                                                                                     // 1463
  conn.apply('halfwayMethod', [], {wait: true}, function (err, result) {                                             // 1464
    output.push('halfway');                                                                                          // 1465
  });                                                                                                                // 1466
                                                                                                                     // 1467
  test.equal(output, []);                                                                                            // 1468
  // Method sent.                                                                                                    // 1469
  var halfwayId = testGotMessage(                                                                                    // 1470
    test, stream, {msg: 'method', method: 'halfwayMethod',                                                           // 1471
                   params: [], id: '*'});                                                                            // 1472
  test.equal(stream.sent.length, 0);                                                                                 // 1473
                                                                                                                     // 1474
  // Get the result. This means it will not be resent.                                                               // 1475
  stream.receive({msg: 'result', id: halfwayId, result: 'bla'});                                                     // 1476
  // Callback not called.                                                                                            // 1477
  test.equal(output, []);                                                                                            // 1478
                                                                                                                     // 1479
  // Reset stream. halfwayMethod does NOT get resent, but reconnectMethod does!                                      // 1480
  // Reconnect quiescence happens when reconnectMethod is done.                                                      // 1481
  stream.reset();                                                                                                    // 1482
  testGotMessage(test, stream, makeConnectMessage(SESSION_ID));                                                      // 1483
  var reconnectId = testGotMessage(                                                                                  // 1484
    test, stream, {msg: 'method', method: 'reconnectMethod',                                                         // 1485
                   params: [], id: '*'});                                                                            // 1486
  test.length(stream.sent, 0);                                                                                       // 1487
  // Still holding out hope for session resumption, so no callbacks yet.                                             // 1488
  test.equal(output, []);                                                                                            // 1489
                                                                                                                     // 1490
  // Receive 'connected', but reconnect quiescence is blocking on                                                    // 1491
  // reconnectMethod.                                                                                                // 1492
  stream.receive({msg: 'connected', session: SESSION_ID + 1});                                                       // 1493
  test.equal(output, []);                                                                                            // 1494
                                                                                                                     // 1495
  // Data-done for reconnectMethod. This gets us to reconnect quiescence, so                                         // 1496
  // halfwayMethod's callback fires. reconnectMethod's is still waiting on its                                       // 1497
  // result.                                                                                                         // 1498
  stream.receive({msg: 'updated', methods: [reconnectId]});                                                          // 1499
  test.equal(output.shift(), 'halfway');                                                                             // 1500
  test.equal(output, []);                                                                                            // 1501
                                                                                                                     // 1502
  // Get result of reconnectMethod. Its callback fires.                                                              // 1503
  stream.receive({msg: 'result', id: reconnectId, result: 'foo'});                                                   // 1504
  test.equal(output.shift(), 'reconnect');                                                                           // 1505
  test.equal(output, []);                                                                                            // 1506
                                                                                                                     // 1507
  // Call another method. It should be delivered immediately. This is a                                              // 1508
  // regression test for a case where it never got delivered because there was                                       // 1509
  // an empty block in _outstandingMethodBlocks blocking it from being sent.                                         // 1510
  conn.call('lastMethod', _.identity);                                                                               // 1511
  testGotMessage(test, stream,                                                                                       // 1512
                 {msg: 'method', method: 'lastMethod', params: [], id: '*'});                                        // 1513
});                                                                                                                  // 1514
                                                                                                                     // 1515
Tinytest.add("livedata stub - subscribe errors", function (test) {                                                   // 1516
  var stream = new StubStream();                                                                                     // 1517
  var conn = newConnection(stream);                                                                                  // 1518
                                                                                                                     // 1519
  startAndConnect(test, stream);                                                                                     // 1520
                                                                                                                     // 1521
  // subscribe                                                                                                       // 1522
  var onReadyFired = false;                                                                                          // 1523
  var subError = null;                                                                                               // 1524
  var sub = conn.subscribe('unknownSub', {                                                                           // 1525
    onReady: function () {                                                                                           // 1526
      onReadyFired = true;                                                                                           // 1527
    },                                                                                                               // 1528
    onError: function (error) {                                                                                      // 1529
      subError = error;                                                                                              // 1530
    }                                                                                                                // 1531
  });                                                                                                                // 1532
  test.isFalse(onReadyFired);                                                                                        // 1533
  test.equal(subError, null);                                                                                        // 1534
                                                                                                                     // 1535
  var subMessage = JSON.parse(stream.sent.shift());                                                                  // 1536
  test.equal(subMessage, {msg: 'sub', name: 'unknownSub', params: [],                                                // 1537
                          id: subMessage.id});                                                                       // 1538
                                                                                                                     // 1539
  // Reject the sub.                                                                                                 // 1540
  stream.receive({msg: 'nosub', id: subMessage.id,                                                                   // 1541
                  error: new Meteor.Error(404, "Subscription not found")});                                          // 1542
  test.isFalse(onReadyFired);                                                                                        // 1543
  test.instanceOf(subError, Meteor.Error);                                                                           // 1544
  test.equal(subError.error, 404);                                                                                   // 1545
  test.equal(subError.reason, "Subscription not found");                                                             // 1546
                                                                                                                     // 1547
  // stream reset: reconnect!                                                                                        // 1548
  stream.reset();                                                                                                    // 1549
  // We send a connect.                                                                                              // 1550
  testGotMessage(test, stream, makeConnectMessage(SESSION_ID));                                                      // 1551
  // We should NOT re-sub to the sub, because we processed the error.                                                // 1552
  test.length(stream.sent, 0);                                                                                       // 1553
  test.isFalse(onReadyFired);                                                                                        // 1554
});                                                                                                                  // 1555
                                                                                                                     // 1556
if (Meteor.isClient) {                                                                                               // 1557
  Tinytest.add("livedata stub - stubs before connected", function (test) {                                           // 1558
    var stream = new StubStream();                                                                                   // 1559
    var conn = newConnection(stream);                                                                                // 1560
                                                                                                                     // 1561
    var collName = Random.id();                                                                                      // 1562
    var coll = new Meteor.Collection(collName, {connection: conn});                                                  // 1563
                                                                                                                     // 1564
    // Start and send "connect", but DON'T get 'connected' quite yet.                                                // 1565
    stream.reset(); // initial connection start.                                                                     // 1566
                                                                                                                     // 1567
    testGotMessage(test, stream, makeConnectMessage());                                                              // 1568
    test.length(stream.sent, 0);                                                                                     // 1569
                                                                                                                     // 1570
    // Insert a document. The stub updates "conn" directly.                                                          // 1571
    coll.insert({_id: "foo", bar: 42}, _.identity);                                                                  // 1572
    test.equal(coll.find().count(), 1);                                                                              // 1573
    test.equal(coll.findOne(), {_id: "foo", bar: 42});                                                               // 1574
    // It also sends the method message.                                                                             // 1575
    var methodMessage = JSON.parse(stream.sent.shift());                                                             // 1576
    test.equal(methodMessage, {msg: 'method', method: '/' + collName + '/insert',                                    // 1577
                               params: [{_id: "foo", bar: 42}],                                                      // 1578
                               id: methodMessage.id});                                                               // 1579
    test.length(stream.sent, 0);                                                                                     // 1580
                                                                                                                     // 1581
    // Now receive a connected message. This should not clear the                                                    // 1582
    // _documentsWrittenByStub state!                                                                                // 1583
    stream.receive({msg: 'connected', session: SESSION_ID});                                                         // 1584
    test.length(stream.sent, 0);                                                                                     // 1585
    test.equal(coll.find().count(), 1);                                                                              // 1586
                                                                                                                     // 1587
    // Now receive the "updated" message for the method. This should revert the                                      // 1588
    // insert.                                                                                                       // 1589
    stream.receive({msg: 'updated', methods: [methodMessage.id]});                                                   // 1590
    test.length(stream.sent, 0);                                                                                     // 1591
    test.equal(coll.find().count(), 0);                                                                              // 1592
  });                                                                                                                // 1593
}                                                                                                                    // 1594
// XXX also test:                                                                                                    // 1595
// - reconnect, with session resume.                                                                                 // 1596
// - restart on update flag                                                                                          // 1597
// - on_update event                                                                                                 // 1598
// - reloading when the app changes, including session migration                                                     // 1599
                                                                                                                     // 1600
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/livedata/livedata_tests.js                                                                               //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
// XXX should check error codes                                                                                      // 1
var failure = function (test, code, reason) {                                                                        // 2
  return function (error, result) {                                                                                  // 3
    test.equal(result, undefined);                                                                                   // 4
    test.isTrue(error && typeof error === "object");                                                                 // 5
    if (error && typeof error === "object") {                                                                        // 6
      if (typeof code === "number") {                                                                                // 7
        test.instanceOf(error, Meteor.Error);                                                                        // 8
        code && test.equal(error.error, code);                                                                       // 9
        reason && test.equal(error.reason, reason);                                                                  // 10
        // XXX should check that other keys aren't present.. should                                                  // 11
        // probably use something like the Matcher we used to have                                                   // 12
      } else {                                                                                                       // 13
        // for normal Javascript errors                                                                              // 14
        test.instanceOf(error, Error);                                                                               // 15
        test.equal(error.message, code);                                                                             // 16
      }                                                                                                              // 17
    }                                                                                                                // 18
  };                                                                                                                 // 19
};                                                                                                                   // 20
                                                                                                                     // 21
Tinytest.add("livedata - Meteor.Error", function (test) {                                                            // 22
  var error = new Meteor.Error(123, "kittens", "puppies");                                                           // 23
  test.instanceOf(error, Meteor.Error);                                                                              // 24
  test.instanceOf(error, Error);                                                                                     // 25
  test.equal(error.error, 123);                                                                                      // 26
  test.equal(error.reason, "kittens");                                                                               // 27
  test.equal(error.details, "puppies");                                                                              // 28
});                                                                                                                  // 29
                                                                                                                     // 30
if (Meteor.isServer) {                                                                                               // 31
  Tinytest.add("livedata - version negotiation", function (test) {                                                   // 32
    var versionCheck = function (clientVersions, serverVersions, expected) {                                         // 33
      test.equal(                                                                                                    // 34
        LivedataTest.calculateVersion(clientVersions, serverVersions),                                               // 35
        expected);                                                                                                   // 36
    };                                                                                                               // 37
                                                                                                                     // 38
    versionCheck(["A", "B", "C"], ["A", "B", "C"], "A");                                                             // 39
    versionCheck(["B", "C"], ["A", "B", "C"], "B");                                                                  // 40
    versionCheck(["A", "B", "C"], ["B", "C"], "B");                                                                  // 41
    versionCheck(["foo", "bar", "baz"], ["A", "B", "C"], "A");                                                       // 42
  });                                                                                                                // 43
}                                                                                                                    // 44
                                                                                                                     // 45
Tinytest.add("livedata - methods with colliding names", function (test) {                                            // 46
  var x = Random.id();                                                                                               // 47
  var m = {};                                                                                                        // 48
  m[x] = function () {};                                                                                             // 49
  Meteor.methods(m);                                                                                                 // 50
                                                                                                                     // 51
  test.throws(function () {                                                                                          // 52
    Meteor.methods(m);                                                                                               // 53
  });                                                                                                                // 54
});                                                                                                                  // 55
                                                                                                                     // 56
var echoTest = function (item) {                                                                                     // 57
  return function (test, expect) {                                                                                   // 58
    if (Meteor.isServer) {                                                                                           // 59
      test.equal(Meteor.call("echo", item), [item]);                                                                 // 60
      test.equal(Meteor.call("echoOne", item), item);                                                                // 61
    }                                                                                                                // 62
    if (Meteor.isClient)                                                                                             // 63
      test.equal(Meteor.call("echo", item), undefined);                                                              // 64
                                                                                                                     // 65
    test.equal(Meteor.call("echo", item, expect(undefined, [item])), undefined);                                     // 66
    test.equal(Meteor.call("echoOne", item, expect(undefined, item)), undefined);                                    // 67
  };                                                                                                                 // 68
};                                                                                                                   // 69
                                                                                                                     // 70
testAsyncMulti("livedata - basic method invocation", [                                                               // 71
  // Unknown methods                                                                                                 // 72
  function (test, expect) {                                                                                          // 73
    if (Meteor.isServer) {                                                                                           // 74
      // On server, with no callback, throws exception                                                               // 75
      try {                                                                                                          // 76
        var ret = Meteor.call("unknown method");                                                                     // 77
      } catch (e) {                                                                                                  // 78
        test.equal(e.error, 404);                                                                                    // 79
        var threw = true;                                                                                            // 80
      }                                                                                                              // 81
      test.isTrue(threw);                                                                                            // 82
      test.equal(ret, undefined);                                                                                    // 83
    }                                                                                                                // 84
                                                                                                                     // 85
    if (Meteor.isClient) {                                                                                           // 86
      // On client, with no callback, just returns undefined                                                         // 87
      var ret = Meteor.call("unknown method");                                                                       // 88
      test.equal(ret, undefined);                                                                                    // 89
    }                                                                                                                // 90
                                                                                                                     // 91
    // On either, with a callback, calls the callback and does not throw                                             // 92
    var ret = Meteor.call("unknown method",                                                                          // 93
                          expect(failure(test, 404, "Method not found")));                                           // 94
    test.equal(ret, undefined);                                                                                      // 95
  },                                                                                                                 // 96
                                                                                                                     // 97
  function (test, expect) {                                                                                          // 98
    // make sure 'undefined' is preserved as such, instead of turning                                                // 99
    // into null (JSON does not have 'undefined' so there is special                                                 // 100
    // code for this)                                                                                                // 101
    if (Meteor.isServer)                                                                                             // 102
      test.equal(Meteor.call("nothing"), undefined);                                                                 // 103
    if (Meteor.isClient)                                                                                             // 104
      test.equal(Meteor.call("nothing"), undefined);                                                                 // 105
                                                                                                                     // 106
    test.equal(Meteor.call("nothing", expect(undefined, undefined)), undefined);                                     // 107
  },                                                                                                                 // 108
                                                                                                                     // 109
  function (test, expect) {                                                                                          // 110
    if (Meteor.isServer)                                                                                             // 111
      test.equal(Meteor.call("echo"), []);                                                                           // 112
    if (Meteor.isClient)                                                                                             // 113
      test.equal(Meteor.call("echo"), undefined);                                                                    // 114
                                                                                                                     // 115
    test.equal(Meteor.call("echo", expect(undefined, [])), undefined);                                               // 116
  },                                                                                                                 // 117
                                                                                                                     // 118
  echoTest(new Date()),                                                                                              // 119
  echoTest({d: new Date(), s: "foobarbaz"}),                                                                         // 120
  echoTest([new Date(), "foobarbaz"]),                                                                               // 121
  echoTest(new Meteor.Collection.ObjectID()),                                                                        // 122
  echoTest({o: new Meteor.Collection.ObjectID()}),                                                                   // 123
  echoTest({$date: 30}), // literal                                                                                  // 124
  echoTest({$literal: {$date: 30}}),                                                                                 // 125
  echoTest(12),                                                                                                      // 126
  echoTest(Infinity),                                                                                                // 127
  echoTest(-Infinity),                                                                                               // 128
                                                                                                                     // 129
  function (test, expect) {                                                                                          // 130
    if (Meteor.isServer)                                                                                             // 131
      test.equal(Meteor.call("echo", 12, {x: 13}), [12, {x: 13}]);                                                   // 132
    if (Meteor.isClient)                                                                                             // 133
      test.equal(Meteor.call("echo", 12, {x: 13}), undefined);                                                       // 134
                                                                                                                     // 135
    test.equal(Meteor.call("echo", 12, {x: 13},                                                                      // 136
                           expect(undefined, [12, {x: 13}])), undefined);                                            // 137
  },                                                                                                                 // 138
                                                                                                                     // 139
  // test that `wait: false` is respected                                                                            // 140
  function (test, expect) {                                                                                          // 141
    if (Meteor.isClient) {                                                                                           // 142
      // For test isolation                                                                                          // 143
      var token = Random.id();                                                                                       // 144
      Meteor.apply(                                                                                                  // 145
        "delayedTrue", [token], {wait: false}, expect(function(err, res) {                                           // 146
          test.equal(res, false);                                                                                    // 147
        }));                                                                                                         // 148
      Meteor.apply("makeDelayedTrueImmediatelyReturnFalse", [token]);                                                // 149
    }                                                                                                                // 150
  },                                                                                                                 // 151
                                                                                                                     // 152
  // test that `wait: true` is respected                                                                             // 153
  function(test, expect) {                                                                                           // 154
    if (Meteor.isClient) {                                                                                           // 155
      var token = Random.id();                                                                                       // 156
      Meteor.apply(                                                                                                  // 157
        "delayedTrue", [token], {wait: true}, expect(function(err, res) {                                            // 158
          test.equal(res, true);                                                                                     // 159
        }));                                                                                                         // 160
      Meteor.apply("makeDelayedTrueImmediatelyReturnFalse", [token]);                                                // 161
    }                                                                                                                // 162
  },                                                                                                                 // 163
                                                                                                                     // 164
  function (test, expect) {                                                                                          // 165
    // No callback                                                                                                   // 166
                                                                                                                     // 167
    if (Meteor.isServer) {                                                                                           // 168
      test.throws(function () {                                                                                      // 169
        Meteor.call("exception", "both");                                                                            // 170
      });                                                                                                            // 171
      test.throws(function () {                                                                                      // 172
        Meteor.call("exception", "server");                                                                          // 173
      });                                                                                                            // 174
      // No exception, because no code will run on the client                                                        // 175
      test.equal(Meteor.call("exception", "client"), undefined);                                                     // 176
    }                                                                                                                // 177
                                                                                                                     // 178
    if (Meteor.isClient) {                                                                                           // 179
      // The client exception is thrown away because it's in the                                                     // 180
      // stub. The server exception is throw away because we didn't                                                  // 181
      // give a callback.                                                                                            // 182
      test.equal(Meteor.call("exception", "both"), undefined);                                                       // 183
      test.equal(Meteor.call("exception", "server"), undefined);                                                     // 184
      test.equal(Meteor.call("exception", "client"), undefined);                                                     // 185
    }                                                                                                                // 186
                                                                                                                     // 187
    // With callback                                                                                                 // 188
                                                                                                                     // 189
    if (Meteor.isClient) {                                                                                           // 190
      test.equal(                                                                                                    // 191
        Meteor.call("exception", "both",                                                                             // 192
                    expect(failure(test, 500, "Internal server error"))),                                            // 193
        undefined);                                                                                                  // 194
      test.equal(                                                                                                    // 195
        Meteor.call("exception", "server",                                                                           // 196
                    expect(failure(test, 500, "Internal server error"))),                                            // 197
        undefined);                                                                                                  // 198
      test.equal(Meteor.call("exception", "client"), undefined);                                                     // 199
    }                                                                                                                // 200
                                                                                                                     // 201
    if (Meteor.isServer) {                                                                                           // 202
      test.equal(                                                                                                    // 203
        Meteor.call("exception", "both",                                                                             // 204
                    expect(failure(test, "Test method throwing an exception"))),                                     // 205
        undefined);                                                                                                  // 206
      test.equal(                                                                                                    // 207
        Meteor.call("exception", "server",                                                                           // 208
                    expect(failure(test, "Test method throwing an exception"))),                                     // 209
        undefined);                                                                                                  // 210
      test.equal(Meteor.call("exception", "client"), undefined);                                                     // 211
    }                                                                                                                // 212
  },                                                                                                                 // 213
                                                                                                                     // 214
  function (test, expect) {                                                                                          // 215
    if (Meteor.isServer) {                                                                                           // 216
      var threw = false;                                                                                             // 217
      try {                                                                                                          // 218
        Meteor.call("exception", "both", {intended: true});                                                          // 219
      } catch (e) {                                                                                                  // 220
        threw = true;                                                                                                // 221
        test.equal(e.error, 999);                                                                                    // 222
        test.equal(e.reason, "Client-visible test exception");                                                       // 223
      }                                                                                                              // 224
      test.isTrue(threw);                                                                                            // 225
      threw = false;                                                                                                 // 226
      try {                                                                                                          // 227
        Meteor.call("exception", "both", {intended: true,                                                            // 228
                                          throwThroughFuture: true});                                                // 229
      } catch (e) {                                                                                                  // 230
        threw = true;                                                                                                // 231
        test.equal(e.error, 999);                                                                                    // 232
        test.equal(e.reason, "Client-visible test exception");                                                       // 233
      }                                                                                                              // 234
      test.isTrue(threw);                                                                                            // 235
    }                                                                                                                // 236
                                                                                                                     // 237
    if (Meteor.isClient) {                                                                                           // 238
      test.equal(                                                                                                    // 239
        Meteor.call("exception", "both", {intended: true},                                                           // 240
                    expect(failure(test, 999,                                                                        // 241
                                   "Client-visible test exception"))),                                               // 242
        undefined);                                                                                                  // 243
      test.equal(                                                                                                    // 244
        Meteor.call("exception", "server", {intended: true},                                                         // 245
                    expect(failure(test, 999,                                                                        // 246
                                   "Client-visible test exception"))),                                               // 247
        undefined);                                                                                                  // 248
      test.equal(                                                                                                    // 249
        Meteor.call("exception", "server", {intended: true,                                                          // 250
                                            throwThroughFuture: true},                                               // 251
                    expect(failure(test, 999,                                                                        // 252
                                   "Client-visible test exception"))),                                               // 253
        undefined);                                                                                                  // 254
    }                                                                                                                // 255
  }                                                                                                                  // 256
]);                                                                                                                  // 257
                                                                                                                     // 258
                                                                                                                     // 259
                                                                                                                     // 260
                                                                                                                     // 261
var checkBalances = function (test, a, b) {                                                                          // 262
  var alice = Ledger.findOne({name: "alice", world: test.runId()});                                                  // 263
  var bob = Ledger.findOne({name: "bob", world: test.runId()});                                                      // 264
  test.equal(alice.balance, a);                                                                                      // 265
  test.equal(bob.balance, b);                                                                                        // 266
};                                                                                                                   // 267
                                                                                                                     // 268
// would be nice to have a database-aware test harness of some kind --                                               // 269
// this is a big hack (and XXX pollutes the global test namespace)                                                   // 270
testAsyncMulti("livedata - compound methods", [                                                                      // 271
  function (test, expect) {                                                                                          // 272
    if (Meteor.isClient)                                                                                             // 273
      Meteor.subscribe("ledger", test.runId(), expect());                                                            // 274
                                                                                                                     // 275
    Ledger.insert({name: "alice", balance: 100, world: test.runId()},                                                // 276
                  expect(function () {}));                                                                           // 277
    Ledger.insert({name: "bob", balance: 50, world: test.runId()},                                                   // 278
                  expect(function () {}));                                                                           // 279
  },                                                                                                                 // 280
  function (test, expect) {                                                                                          // 281
    Meteor.call('ledger/transfer', test.runId(), "alice", "bob", 10,                                                 // 282
                expect(function(err, result) {                                                                       // 283
                  test.equal(err, undefined);                                                                        // 284
                  test.equal(result, undefined);                                                                     // 285
                  checkBalances(test, 90, 60);                                                                       // 286
                }));                                                                                                 // 287
    checkBalances(test, 90, 60);                                                                                     // 288
  },                                                                                                                 // 289
  function (test, expect) {                                                                                          // 290
    Meteor.call('ledger/transfer', test.runId(), "alice", "bob", 100, true,                                          // 291
                expect(function (err, result) {                                                                      // 292
                  failure(test, 409)(err, result);                                                                   // 293
                  // Balances are reverted back to pre-stub values.                                                  // 294
                  checkBalances(test, 90, 60);                                                                       // 295
                }));                                                                                                 // 296
                                                                                                                     // 297
    if (Meteor.isClient)                                                                                             // 298
      // client can fool itself by cheating, but only until the sync                                                 // 299
      // finishes                                                                                                    // 300
      checkBalances(test, -10, 160);                                                                                 // 301
    else                                                                                                             // 302
      checkBalances(test, 90, 60);                                                                                   // 303
  }                                                                                                                  // 304
]);                                                                                                                  // 305
                                                                                                                     // 306
// Replaces the Connection's `_livedata_data` method to push incoming                                                // 307
// messages on a given collection to an array. This can be used to                                                   // 308
// verify that the right data is sent on the wire                                                                    // 309
//                                                                                                                   // 310
// @param messages {Array} The array to which to append the messages                                                 // 311
// @return {Function} A function to call to undo the eavesdropping                                                   // 312
var eavesdropOnCollection = function(livedata_connection,                                                            // 313
                                     collection_name, messages) {                                                    // 314
  var old_livedata_data = _.bind(                                                                                    // 315
    livedata_connection._livedata_data, livedata_connection);                                                        // 316
                                                                                                                     // 317
  // Kind of gross since all tests past this one will run with this                                                  // 318
  // hook set up. That's probably fine since we only check a specific                                                // 319
  // collection but still...                                                                                         // 320
  //                                                                                                                 // 321
  // Should we consider having a separate connection per Tinytest or                                                 // 322
  // some similar scheme?                                                                                            // 323
  livedata_connection._livedata_data = function(msg) {                                                               // 324
    if (msg.collection && msg.collection === collection_name) {                                                      // 325
      messages.push(msg);                                                                                            // 326
    }                                                                                                                // 327
    old_livedata_data(msg);                                                                                          // 328
  };                                                                                                                 // 329
                                                                                                                     // 330
  return function() {                                                                                                // 331
    livedata_connection._livedata_data = old_livedata_data;                                                          // 332
  };                                                                                                                 // 333
};                                                                                                                   // 334
                                                                                                                     // 335
if (Meteor.isClient) {                                                                                               // 336
  testAsyncMulti("livedata - changing userid reruns subscriptions without flapping data on the wire", [              // 337
    function(test, expect) {                                                                                         // 338
      var messages = [];                                                                                             // 339
      var undoEavesdrop = eavesdropOnCollection(                                                                     // 340
        Meteor.connection, "objectsWithUsers", messages);                                                            // 341
                                                                                                                     // 342
      // A helper for testing incoming set and unset messages                                                        // 343
      // XXX should this be extracted as a general helper together with                                              // 344
      // eavesdropOnCollection?                                                                                      // 345
      var expectMessages = function(expectedAddedMessageCount,                                                       // 346
                                    expectedRemovedMessageCount,                                                     // 347
                                    expectedNamesInCollection) {                                                     // 348
        var actualAddedMessageCount = 0;                                                                             // 349
        var actualRemovedMessageCount = 0;                                                                           // 350
        _.each(messages, function (msg) {                                                                            // 351
          if (msg.msg === 'added')                                                                                   // 352
            ++actualAddedMessageCount;                                                                               // 353
          else if (msg.msg === 'removed')                                                                            // 354
            ++actualRemovedMessageCount;                                                                             // 355
          else                                                                                                       // 356
            test.fail({unexpected: JSON.stringify(msg)});                                                            // 357
        });                                                                                                          // 358
        test.equal(actualAddedMessageCount, expectedAddedMessageCount);                                              // 359
        test.equal(actualRemovedMessageCount, expectedRemovedMessageCount);                                          // 360
        expectedNamesInCollection.sort();                                                                            // 361
        test.equal(_.pluck(objectsWithUsers.find({}, {sort: ['name']}).fetch(),                                      // 362
                           'name'),                                                                                  // 363
                   expectedNamesInCollection);                                                                       // 364
        messages.length = 0; // clear messages without creating a new object                                         // 365
      };                                                                                                             // 366
                                                                                                                     // 367
      // make sure we're not already logged in. can happen if accounts                                               // 368
      // tests fail oddly.                                                                                           // 369
      Meteor.apply("setUserId", [null], {wait: true}, expect(function () {}));                                       // 370
                                                                                                                     // 371
      Meteor.subscribe("objectsWithUsers", expect(function() {                                                       // 372
        expectMessages(1, 0, ["owned by none"]);                                                                     // 373
        Meteor.apply("setUserId", ["1"], {wait: true}, afterFirstSetUserId);                                         // 374
      }));                                                                                                           // 375
                                                                                                                     // 376
      var afterFirstSetUserId = expect(function() {                                                                  // 377
        expectMessages(3, 1, [                                                                                       // 378
          "owned by one - a",                                                                                        // 379
          "owned by one/two - a",                                                                                    // 380
          "owned by one/two - b"]);                                                                                  // 381
        Meteor.apply("setUserId", ["2"], {wait: true}, afterSecondSetUserId);                                        // 382
      });                                                                                                            // 383
                                                                                                                     // 384
      var afterSecondSetUserId = expect(function() {                                                                 // 385
        expectMessages(2, 1, [                                                                                       // 386
          "owned by one/two - a",                                                                                    // 387
          "owned by one/two - b",                                                                                    // 388
          "owned by two - a",                                                                                        // 389
          "owned by two - b"]);                                                                                      // 390
        Meteor.apply("setUserId", ["2"], {wait: true}, afterThirdSetUserId);                                         // 391
      });                                                                                                            // 392
                                                                                                                     // 393
      var afterThirdSetUserId = expect(function() {                                                                  // 394
        // Nothing should have been sent since the results of the                                                    // 395
        // query are the same ("don't flap data on the wire")                                                        // 396
        expectMessages(0, 0, [                                                                                       // 397
          "owned by one/two - a",                                                                                    // 398
          "owned by one/two - b",                                                                                    // 399
          "owned by two - a",                                                                                        // 400
          "owned by two - b"]);                                                                                      // 401
        undoEavesdrop();                                                                                             // 402
      });                                                                                                            // 403
    }, function(test, expect) {                                                                                      // 404
      var key = Random.id();                                                                                         // 405
      Meteor.subscribe("recordUserIdOnStop", key);                                                                   // 406
      Meteor.apply("setUserId", ["100"], {wait: true}, expect(function () {}));                                      // 407
      Meteor.apply("setUserId", ["101"], {wait: true}, expect(function () {}));                                      // 408
      Meteor.call("userIdWhenStopped", key, expect(function (err, result) {                                          // 409
        test.isFalse(err);                                                                                           // 410
        test.equal(result, "100");                                                                                   // 411
      }));                                                                                                           // 412
      // clean up                                                                                                    // 413
      Meteor.apply("setUserId", [null], {wait: true}, expect(function () {}));                                       // 414
    }                                                                                                                // 415
  ]);                                                                                                                // 416
}                                                                                                                    // 417
                                                                                                                     // 418
Tinytest.add("livedata - setUserId error when called from server", function(test) {                                  // 419
  if (Meteor.isServer) {                                                                                             // 420
    test.equal(errorThrownWhenCallingSetUserIdDirectlyOnServer.message,                                              // 421
               "Can't call setUserId on a server initiated method call");                                            // 422
  }                                                                                                                  // 423
});                                                                                                                  // 424
                                                                                                                     // 425
                                                                                                                     // 426
if (Meteor.isServer) {                                                                                               // 427
  var pubHandles = {};                                                                                               // 428
};                                                                                                                   // 429
Meteor.methods({                                                                                                     // 430
  "livedata/setup" : function (id) {                                                                                 // 431
    check(id, String);                                                                                               // 432
    if (Meteor.isServer) {                                                                                           // 433
      pubHandles[id] = {};                                                                                           // 434
      Meteor.publish("pub1"+id, function () {                                                                        // 435
        pubHandles[id].pub1 = this;                                                                                  // 436
        this.ready();                                                                                                // 437
      });                                                                                                            // 438
      Meteor.publish("pub2"+id, function () {                                                                        // 439
        pubHandles[id].pub2 = this;                                                                                  // 440
        this.ready();                                                                                                // 441
      });                                                                                                            // 442
                                                                                                                     // 443
    }                                                                                                                // 444
  },                                                                                                                 // 445
  "livedata/pub1go" : function (id) {                                                                                // 446
    check(id, String);                                                                                               // 447
    if (Meteor.isServer) {                                                                                           // 448
                                                                                                                     // 449
      pubHandles[id].pub1.added("MultiPubCollection" + id, "foo", {a: "aa"});                                        // 450
      return 1;                                                                                                      // 451
    }                                                                                                                // 452
    return 0;                                                                                                        // 453
  },                                                                                                                 // 454
  "livedata/pub2go" : function (id) {                                                                                // 455
    check(id, String);                                                                                               // 456
    if (Meteor.isServer) {                                                                                           // 457
      pubHandles[id].pub2.added("MultiPubCollection" + id , "foo", {b: "bb"});                                       // 458
      return 2;                                                                                                      // 459
    }                                                                                                                // 460
    return 0;                                                                                                        // 461
  }                                                                                                                  // 462
});                                                                                                                  // 463
                                                                                                                     // 464
if (Meteor.isClient) {                                                                                               // 465
  (function () {                                                                                                     // 466
    var MultiPub;                                                                                                    // 467
    var id = Random.id();                                                                                            // 468
    testAsyncMulti("livedata - added from two different subs", [                                                     // 469
      function (test, expect) {                                                                                      // 470
        Meteor.call('livedata/setup', id, expect(function () {}));                                                   // 471
      },                                                                                                             // 472
      function (test, expect) {                                                                                      // 473
        MultiPub = new Meteor.Collection("MultiPubCollection" + id);                                                 // 474
        var sub1 = Meteor.subscribe("pub1"+id, expect(function () {}));                                              // 475
        var sub2 = Meteor.subscribe("pub2"+id, expect(function () {}));                                              // 476
      },                                                                                                             // 477
      function (test, expect) {                                                                                      // 478
        Meteor.call("livedata/pub1go", id, expect(function (err, res) {test.equal(res, 1);}));                       // 479
      },                                                                                                             // 480
      function (test, expect) {                                                                                      // 481
        test.equal(MultiPub.findOne("foo"), {_id: "foo", a: "aa"});                                                  // 482
      },                                                                                                             // 483
      function (test, expect) {                                                                                      // 484
        Meteor.call("livedata/pub2go", id, expect(function (err, res) {test.equal(res, 2);}));                       // 485
      },                                                                                                             // 486
      function (test, expect) {                                                                                      // 487
        test.equal(MultiPub.findOne("foo"), {_id: "foo", a: "aa", b: "bb"});                                         // 488
      }                                                                                                              // 489
    ]);                                                                                                              // 490
  })();                                                                                                              // 491
};                                                                                                                   // 492
                                                                                                                     // 493
if (Meteor.isClient) {                                                                                               // 494
  testAsyncMulti("livedata - overlapping universal subs", [                                                          // 495
    function (test, expect) {                                                                                        // 496
      var coll = new Meteor.Collection("overlappingUniversalSubs");                                                  // 497
      var token = Random.id();                                                                                       // 498
      test.isFalse(coll.findOne(token));                                                                             // 499
      Meteor.call("testOverlappingSubs", token, expect(function (err) {                                              // 500
        test.isFalse(err);                                                                                           // 501
        test.isTrue(coll.findOne(token));                                                                            // 502
      }));                                                                                                           // 503
    }                                                                                                                // 504
  ]);                                                                                                                // 505
                                                                                                                     // 506
  testAsyncMulti("livedata - runtime universal sub creation", [                                                      // 507
    function (test, expect) {                                                                                        // 508
      var coll = new Meteor.Collection("runtimeSubCreation");                                                        // 509
      var token = Random.id();                                                                                       // 510
      test.isFalse(coll.findOne(token));                                                                             // 511
      Meteor.call("runtimeUniversalSubCreation", token, expect(function (err) {                                      // 512
        test.isFalse(err);                                                                                           // 513
        test.isTrue(coll.findOne(token));                                                                            // 514
      }));                                                                                                           // 515
    }                                                                                                                // 516
  ]);                                                                                                                // 517
                                                                                                                     // 518
  testAsyncMulti("livedata - no setUserId after unblock", [                                                          // 519
    function (test, expect) {                                                                                        // 520
      Meteor.call("setUserIdAfterUnblock", expect(function (err, result) {                                           // 521
        test.isFalse(err);                                                                                           // 522
        test.isTrue(result);                                                                                         // 523
      }));                                                                                                           // 524
    }                                                                                                                // 525
  ]);                                                                                                                // 526
                                                                                                                     // 527
  testAsyncMulti("livedata - publisher errors", (function () {                                                       // 528
    // Use a separate connection so that we can safely check to see if                                               // 529
    // conn._subscriptions is empty.                                                                                 // 530
    var conn = new LivedataTest.Connection('/',                                                                      // 531
                                            {reloadWithOutstanding: true});                                          // 532
    var collName = Random.id();                                                                                      // 533
    var coll = new Meteor.Collection(collName, {connection: conn});                                                  // 534
    var errorFromRerun;                                                                                              // 535
    var gotErrorFromStopper = false;                                                                                 // 536
    return [                                                                                                         // 537
      function (test, expect) {                                                                                      // 538
        var testSubError = function (options) {                                                                      // 539
          conn.subscribe("publisherErrors", collName, options, {                                                     // 540
            onReady: expect(),                                                                                       // 541
            onError: expect(                                                                                         // 542
              failure(test,                                                                                          // 543
                      options.internalError ? 500 : 412,                                                             // 544
                      options.internalError ? "Internal server error"                                                // 545
                                            : "Explicit error"))                                                     // 546
          });                                                                                                        // 547
        };                                                                                                           // 548
        testSubError({throwInHandler: true});                                                                        // 549
        testSubError({throwInHandler: true, internalError: true});                                                   // 550
        testSubError({errorInHandler: true});                                                                        // 551
        testSubError({errorInHandler: true, internalError: true});                                                   // 552
        testSubError({errorLater: true});                                                                            // 553
        testSubError({errorLater: true, internalError: true});                                                       // 554
      },                                                                                                             // 555
      function (test, expect) {                                                                                      // 556
        test.equal(coll.find().count(), 0);                                                                          // 557
        test.equal(_.size(conn._subscriptions), 0);  // white-box test                                               // 558
                                                                                                                     // 559
        conn.subscribe("publisherErrors",                                                                            // 560
                       collName, {throwWhenUserIdSet: true}, {                                                       // 561
          onReady: expect(),                                                                                         // 562
          onError: function (error) {                                                                                // 563
            errorFromRerun = error;                                                                                  // 564
          }                                                                                                          // 565
        });                                                                                                          // 566
      },                                                                                                             // 567
      function (test, expect) {                                                                                      // 568
        // Because the last subscription is ready, we should have a document.                                        // 569
        test.equal(coll.find().count(), 1);                                                                          // 570
        test.isFalse(errorFromRerun);                                                                                // 571
        test.equal(_.size(conn._subscriptions), 1);  // white-box test                                               // 572
        conn.call('setUserId', 'bla', expect(function(){}));                                                         // 573
      },                                                                                                             // 574
      function (test, expect) {                                                                                      // 575
        // Now that we've re-run, we should have stopped the subscription,                                           // 576
        // gotten a error, and lost the document.                                                                    // 577
        test.equal(coll.find().count(), 0);                                                                          // 578
        test.isTrue(errorFromRerun);                                                                                 // 579
        test.instanceOf(errorFromRerun, Meteor.Error);                                                               // 580
        test.equal(errorFromRerun.error, 412);                                                                       // 581
        test.equal(errorFromRerun.reason, "Explicit error");                                                         // 582
        test.equal(_.size(conn._subscriptions), 0);  // white-box test                                               // 583
                                                                                                                     // 584
        conn.subscribe("publisherErrors", collName, {stopInHandler: true}, {                                         // 585
          onError: function() { gotErrorFromStopper = true; }                                                        // 586
        });                                                                                                          // 587
        // Call a method. This method won't be processed until the publisher's                                       // 588
        // function returns, so blocking on it being done ensures that we've                                         // 589
        // gotten the removed/nosub/etc.                                                                             // 590
        conn.call('nothing', expect(function(){}));                                                                  // 591
      },                                                                                                             // 592
      function (test, expect) {                                                                                      // 593
        test.equal(coll.find().count(), 0);                                                                          // 594
        // sub.stop does NOT call onError.                                                                           // 595
        test.isFalse(gotErrorFromStopper);                                                                           // 596
        test.equal(_.size(conn._subscriptions), 0);  // white-box test                                               // 597
        conn._stream.disconnect({_permanent: true});                                                                 // 598
      }                                                                                                              // 599
    ];})());                                                                                                         // 600
                                                                                                                     // 601
    testAsyncMulti("livedata - publish multiple cursors", [                                                          // 602
      function (test, expect) {                                                                                      // 603
        Meteor.subscribe("multiPublish", {normal: 1}, {                                                              // 604
          onReady: expect(function () {                                                                              // 605
            test.equal(One.find().count(), 2);                                                                       // 606
            test.equal(Two.find().count(), 3);                                                                       // 607
          }),                                                                                                        // 608
          onError: failure()                                                                                         // 609
        });                                                                                                          // 610
      },                                                                                                             // 611
      function (test, expect) {                                                                                      // 612
        Meteor.subscribe("multiPublish", {dup: 1}, {                                                                 // 613
          onReady: failure(),                                                                                        // 614
          onError: expect(failure(test, 500, "Internal server error"))                                               // 615
        });                                                                                                          // 616
      },                                                                                                             // 617
      function (test, expect) {                                                                                      // 618
        Meteor.subscribe("multiPublish", {notCursor: 1}, {                                                           // 619
          onReady: failure(),                                                                                        // 620
          onError: expect(failure(test, 500, "Internal server error"))                                               // 621
        });                                                                                                          // 622
      }                                                                                                              // 623
    ]);                                                                                                              // 624
}                                                                                                                    // 625
                                                                                                                     // 626
var selfUrl = Meteor.isServer                                                                                        // 627
      ? Meteor.absoluteUrl() : Meteor._relativeToSiteRootUrl('/');                                                   // 628
                                                                                                                     // 629
if (Meteor.isServer) {                                                                                               // 630
  Meteor.methods({                                                                                                   // 631
    "s2s": function (arg) {                                                                                          // 632
      check(arg, String);                                                                                            // 633
      return "s2s " + arg;                                                                                           // 634
    }                                                                                                                // 635
  });                                                                                                                // 636
}                                                                                                                    // 637
(function () {                                                                                                       // 638
  testAsyncMulti("livedata - connect works from both client and server", [                                           // 639
    function (test, expect) {                                                                                        // 640
      var self = this;                                                                                               // 641
      self.conn = DDP.connect(selfUrl);                                                                              // 642
      pollUntil(expect, function () {                                                                                // 643
        return self.conn.status().connected;                                                                         // 644
      }, 10000);                                                                                                     // 645
    },                                                                                                               // 646
                                                                                                                     // 647
    function (test, expect) {                                                                                        // 648
      var self = this;                                                                                               // 649
      if (self.conn.status().connected) {                                                                            // 650
        self.conn.call('s2s', 'foo', expect(function (err, res) {                                                    // 651
          if (err)                                                                                                   // 652
            throw err;                                                                                               // 653
          test.equal(res, "s2s foo");                                                                                // 654
        }));                                                                                                         // 655
      }                                                                                                              // 656
    }                                                                                                                // 657
  ]);                                                                                                                // 658
})();                                                                                                                // 659
                                                                                                                     // 660
if (Meteor.isServer) {                                                                                               // 661
  (function () {                                                                                                     // 662
    testAsyncMulti("livedata - method call on server blocks in a fiber way", [                                       // 663
      function (test, expect) {                                                                                      // 664
        var self = this;                                                                                             // 665
        self.conn = DDP.connect(selfUrl);                                                                            // 666
        pollUntil(expect, function () {                                                                              // 667
          return self.conn.status().connected;                                                                       // 668
        }, 10000);                                                                                                   // 669
      },                                                                                                             // 670
                                                                                                                     // 671
      function (test, expect) {                                                                                      // 672
        var self = this;                                                                                             // 673
        if (self.conn.status().connected) {                                                                          // 674
          test.equal(self.conn.call('s2s', 'foo'), "s2s foo");                                                       // 675
        }                                                                                                            // 676
      }                                                                                                              // 677
    ]);                                                                                                              // 678
  })();                                                                                                              // 679
}                                                                                                                    // 680
                                                                                                                     // 681
(function () {                                                                                                       // 682
  testAsyncMulti("livedata - connect fails to unknown place", [                                                      // 683
    function (test, expect) {                                                                                        // 684
      var self = this;                                                                                               // 685
      self.conn = DDP.connect("example.com");                                                                        // 686
      Meteor.setTimeout(expect(function () {                                                                         // 687
        test.isFalse(self.conn.status().connected, "Not connected");                                                 // 688
      }), 500);                                                                                                      // 689
    }                                                                                                                // 690
  ]);                                                                                                                // 691
})();                                                                                                                // 692
                                                                                                                     // 693
                                                                                                                     // 694
// XXX some things to test in greater detail:                                                                        // 695
// staying in simulation mode                                                                                        // 696
// time warp                                                                                                         // 697
// serialization / beginAsync(true) / beginAsync(false)                                                              // 698
// malformed messages (need raw wire access)                                                                         // 699
// method completion/satisfaction                                                                                    // 700
// subscriptions (multiple APIs, including autorun?)                                                                 // 701
// subscription completion                                                                                           // 702
// subscription attribute shadowing                                                                                  // 703
// server method calling methods on other server (eg, should simulate)                                               // 704
// subscriptions and methods being idempotent                                                                        // 705
// reconnection                                                                                                      // 706
// reconnection not resulting in method re-execution                                                                 // 707
// reconnection tolerating all kinds of lost messages (including data)                                               // 708
// [probably lots more]                                                                                              // 709
                                                                                                                     // 710
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/livedata/livedata_test_service.js                                                                        //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.methods({                                                                                                     // 1
  nothing: function () {                                                                                             // 2
    // No need to check if there are no arguments.                                                                   // 3
  },                                                                                                                 // 4
  echo: function (/* arguments */) {                                                                                 // 5
    check(arguments, [Match.Any]);                                                                                   // 6
    return _.toArray(arguments);                                                                                     // 7
  },                                                                                                                 // 8
  echoOne: function (/*arguments*/) {                                                                                // 9
    check(arguments, [Match.Any]);                                                                                   // 10
    return arguments[0];                                                                                             // 11
  },                                                                                                                 // 12
  exception: function (where, options) {                                                                             // 13
    check(where, String);                                                                                            // 14
    check(options, Match.Optional({                                                                                  // 15
      intended: Match.Optional(Boolean),                                                                             // 16
      throwThroughFuture: Match.Optional(Boolean)                                                                    // 17
    }));                                                                                                             // 18
    options = options || {};                                                                                         // 19
    var shouldThrow =                                                                                                // 20
      (Meteor.isServer && where === "server") ||                                                                     // 21
      (Meteor.isClient && where === "client") ||                                                                     // 22
      where === "both";                                                                                              // 23
                                                                                                                     // 24
    if (shouldThrow) {                                                                                               // 25
      var e;                                                                                                         // 26
      if (options.intended)                                                                                          // 27
        e = new Meteor.Error(999, "Client-visible test exception");                                                  // 28
      else                                                                                                           // 29
        e = new Error("Test method throwing an exception");                                                          // 30
      e.expected = true;                                                                                             // 31
                                                                                                                     // 32
      // We used to improperly serialize errors that were thrown through a                                           // 33
      // future first.                                                                                               // 34
      if (Meteor.isServer && options.throwThroughFuture) {                                                           // 35
        var Future = Npm.require('fibers/future');                                                                   // 36
        var f = new Future;                                                                                          // 37
        f['throw'](e);                                                                                               // 38
        e = f.wait();                                                                                                // 39
      }                                                                                                              // 40
      throw e;                                                                                                       // 41
    }                                                                                                                // 42
  },                                                                                                                 // 43
  setUserId: function(userId) {                                                                                      // 44
    check(userId, Match.OneOf(String, null));                                                                        // 45
    this.setUserId(userId);                                                                                          // 46
  }                                                                                                                  // 47
});                                                                                                                  // 48
                                                                                                                     // 49
// Methods to help test applying methods with `wait: true`: delayedTrue returns                                      // 50
// true 1s after being run unless makeDelayedTrueImmediatelyReturnFalse was run                                      // 51
// in the meanwhile. Increasing the timeout makes the "wait: true" test slower;                                      // 52
// decreasing the timeout makes the "wait: false" test flakier (ie, the timeout                                      // 53
// could fire before processing the second method).                                                                  // 54
if (Meteor.isServer) {                                                                                               // 55
  // Keys are random tokens, used to isolate multiple test invocations from each                                     // 56
  // other.                                                                                                          // 57
  var waiters = {};                                                                                                  // 58
                                                                                                                     // 59
  var path = Npm.require('path');                                                                                    // 60
  var Future = Npm.require(path.join('fibers', 'future'));                                                           // 61
                                                                                                                     // 62
  var returnThroughFuture = function (token, returnValue) {                                                          // 63
    // Make sure that when we call return, the fields are already cleared.                                           // 64
    var record = waiters[token];                                                                                     // 65
    if (!record)                                                                                                     // 66
      return;                                                                                                        // 67
    delete waiters[token];                                                                                           // 68
    record.future['return'](returnValue);                                                                            // 69
  };                                                                                                                 // 70
                                                                                                                     // 71
  Meteor.methods({                                                                                                   // 72
    delayedTrue: function(token) {                                                                                   // 73
      check(token, String);                                                                                          // 74
      var record = waiters[token] = {                                                                                // 75
        future: new Future(),                                                                                        // 76
        timer: Meteor.setTimeout(function() {                                                                        // 77
          returnThroughFuture(token, true);                                                                          // 78
        }, 1000)                                                                                                     // 79
      };                                                                                                             // 80
                                                                                                                     // 81
      this.unblock();                                                                                                // 82
      return record.future.wait();                                                                                   // 83
    },                                                                                                               // 84
    makeDelayedTrueImmediatelyReturnFalse: function(token) {                                                         // 85
      check(token, String);                                                                                          // 86
      var record = waiters[token];                                                                                   // 87
      if (!record)                                                                                                   // 88
        return; // since delayedTrue's timeout had already run                                                       // 89
      clearTimeout(record.timer);                                                                                    // 90
      returnThroughFuture(token, false);                                                                             // 91
    }                                                                                                                // 92
  });                                                                                                                // 93
}                                                                                                                    // 94
                                                                                                                     // 95
/*****/                                                                                                              // 96
                                                                                                                     // 97
Ledger = new Meteor.Collection("ledger");                                                                            // 98
Ledger.allow({                                                                                                       // 99
  insert: function() { return true; },                                                                               // 100
  update: function() { return true; },                                                                               // 101
  remove: function() { return true; },                                                                               // 102
  fetch: []                                                                                                          // 103
});                                                                                                                  // 104
                                                                                                                     // 105
Meteor.startup(function () {                                                                                         // 106
  if (Meteor.isServer)                                                                                               // 107
    Ledger.remove({}); // XXX can this please be Ledger.remove()?                                                    // 108
});                                                                                                                  // 109
                                                                                                                     // 110
if (Meteor.isServer)                                                                                                 // 111
  Meteor.publish('ledger', function (world) {                                                                        // 112
    check(world, String);                                                                                            // 113
    return Ledger.find({world: world});                                                                              // 114
  });                                                                                                                // 115
                                                                                                                     // 116
Meteor.methods({                                                                                                     // 117
  'ledger/transfer': function (world, from_name, to_name, amount, cheat) {                                           // 118
    check(world, String);                                                                                            // 119
    check(from_name, String);                                                                                        // 120
    check(to_name, String);                                                                                          // 121
    check(amount, Number);                                                                                           // 122
    check(cheat, Match.Optional(Boolean));                                                                           // 123
    var from = Ledger.findOne({name: from_name, world: world});                                                      // 124
    var to = Ledger.findOne({name: to_name, world: world});                                                          // 125
                                                                                                                     // 126
    if (Meteor.isServer)                                                                                             // 127
      cheat = false;                                                                                                 // 128
                                                                                                                     // 129
    if (!from)                                                                                                       // 130
      throw new Meteor.Error(404,                                                                                    // 131
                             "No such account " + from_name + " in " + world);                                       // 132
                                                                                                                     // 133
    if (!to)                                                                                                         // 134
      throw new Meteor.Error(404,                                                                                    // 135
                             "No such account " + to_name + " in " + world);                                         // 136
                                                                                                                     // 137
    if (from.balance < amount && !cheat)                                                                             // 138
      throw new Meteor.Error(409, "Insufficient funds");                                                             // 139
                                                                                                                     // 140
    Ledger.update(from._id, {$inc: {balance: -amount}});                                                             // 141
    Ledger.update(to._id, {$inc: {balance: amount}});                                                                // 142
  }                                                                                                                  // 143
});                                                                                                                  // 144
                                                                                                                     // 145
/*****/                                                                                                              // 146
                                                                                                                     // 147
/// Helpers for "livedata - changing userid reruns subscriptions..."                                                 // 148
                                                                                                                     // 149
objectsWithUsers = new Meteor.Collection("objectsWithUsers");                                                        // 150
                                                                                                                     // 151
if (Meteor.isServer) {                                                                                               // 152
  objectsWithUsers.remove({});                                                                                       // 153
  objectsWithUsers.insert({name: "owned by none", ownerUserIds: [null]});                                            // 154
  objectsWithUsers.insert({name: "owned by one - a", ownerUserIds: ["1"]});                                          // 155
  objectsWithUsers.insert({name: "owned by one/two - a", ownerUserIds: ["1", "2"]});                                 // 156
  objectsWithUsers.insert({name: "owned by one/two - b", ownerUserIds: ["1", "2"]});                                 // 157
  objectsWithUsers.insert({name: "owned by two - a", ownerUserIds: ["2"]});                                          // 158
  objectsWithUsers.insert({name: "owned by two - b", ownerUserIds: ["2"]});                                          // 159
                                                                                                                     // 160
  Meteor.publish("objectsWithUsers", function() {                                                                    // 161
    return objectsWithUsers.find({ownerUserIds: this.userId},                                                        // 162
                                 {fields: {ownerUserIds: 0}});                                                       // 163
  });                                                                                                                // 164
                                                                                                                     // 165
  (function () {                                                                                                     // 166
    var userIdWhenStopped = {};                                                                                      // 167
    Meteor.publish("recordUserIdOnStop", function (key) {                                                            // 168
      check(key, String);                                                                                            // 169
      var self = this;                                                                                               // 170
      self.onStop(function() {                                                                                       // 171
        userIdWhenStopped[key] = self.userId;                                                                        // 172
      });                                                                                                            // 173
    });                                                                                                              // 174
                                                                                                                     // 175
    Meteor.methods({                                                                                                 // 176
      userIdWhenStopped: function (key) {                                                                            // 177
        check(key, String);                                                                                          // 178
        return userIdWhenStopped[key];                                                                               // 179
      }                                                                                                              // 180
    });                                                                                                              // 181
  })();                                                                                                              // 182
}                                                                                                                    // 183
                                                                                                                     // 184
/*****/                                                                                                              // 185
                                                                                                                     // 186
/// Helper for "livedata - setUserId fails when called on server"                                                    // 187
                                                                                                                     // 188
if (Meteor.isServer) {                                                                                               // 189
  Meteor.startup(function() {                                                                                        // 190
    errorThrownWhenCallingSetUserIdDirectlyOnServer = null;                                                          // 191
    try {                                                                                                            // 192
      Meteor.call("setUserId", "1000");                                                                              // 193
    } catch (e) {                                                                                                    // 194
      errorThrownWhenCallingSetUserIdDirectlyOnServer = e;                                                           // 195
    }                                                                                                                // 196
  });                                                                                                                // 197
}                                                                                                                    // 198
                                                                                                                     // 199
/// Helper for "livedata - no setUserId after unblock"                                                               // 200
                                                                                                                     // 201
if (Meteor.isServer) {                                                                                               // 202
  Meteor.methods({                                                                                                   // 203
    setUserIdAfterUnblock: function () {                                                                             // 204
      this.unblock();                                                                                                // 205
      var threw = false;                                                                                             // 206
      var originalUserId = this.userId;                                                                              // 207
      try {                                                                                                          // 208
        // Calling setUserId after unblock should throw an error (and not mutate                                     // 209
        // userId).                                                                                                  // 210
        this.setUserId(originalUserId + "bla");                                                                      // 211
      } catch (e) {                                                                                                  // 212
        threw = true;                                                                                                // 213
      }                                                                                                              // 214
      return threw && this.userId === originalUserId;                                                                // 215
    }                                                                                                                // 216
  });                                                                                                                // 217
}                                                                                                                    // 218
                                                                                                                     // 219
/*****/                                                                                                              // 220
                                                                                                                     // 221
/// Helper for "livedata - overlapping universal subs"                                                               // 222
                                                                                                                     // 223
if (Meteor.isServer) {                                                                                               // 224
  (function(){                                                                                                       // 225
    var collName = "overlappingUniversalSubs";                                                                       // 226
    var universalSubscribers = [[], []];                                                                             // 227
                                                                                                                     // 228
    _.each([0, 1], function (index) {                                                                                // 229
      Meteor.publish(null, function () {                                                                             // 230
        var sub = this;                                                                                              // 231
        universalSubscribers[index].push(sub);                                                                       // 232
        sub.onStop(function () {                                                                                     // 233
          universalSubscribers[index] = _.without(                                                                   // 234
            universalSubscribers[index], sub);                                                                       // 235
        });                                                                                                          // 236
      });                                                                                                            // 237
    });                                                                                                              // 238
                                                                                                                     // 239
    Meteor.methods({                                                                                                 // 240
      testOverlappingSubs: function (token) {                                                                        // 241
        check(token, String);                                                                                        // 242
        _.each(universalSubscribers[0], function (sub) {                                                             // 243
          sub.added(collName, token, {});                                                                            // 244
        });                                                                                                          // 245
        _.each(universalSubscribers[1], function (sub) {                                                             // 246
          sub.added(collName, token, {});                                                                            // 247
        });                                                                                                          // 248
        _.each(universalSubscribers[0], function (sub) {                                                             // 249
          sub.removed(collName, token);                                                                              // 250
        });                                                                                                          // 251
      }                                                                                                              // 252
    });                                                                                                              // 253
  })();                                                                                                              // 254
}                                                                                                                    // 255
                                                                                                                     // 256
/// Helper for "livedata - runtime universal sub creation"                                                           // 257
                                                                                                                     // 258
if (Meteor.isServer) {                                                                                               // 259
  Meteor.methods({                                                                                                   // 260
    runtimeUniversalSubCreation: function (token) {                                                                  // 261
      check(token, String);                                                                                          // 262
      Meteor.publish(null, function () {                                                                             // 263
        this.added("runtimeSubCreation", token, {});                                                                 // 264
      });                                                                                                            // 265
    }                                                                                                                // 266
  });                                                                                                                // 267
}                                                                                                                    // 268
                                                                                                                     // 269
/// Helper for "livedata - publisher errors"                                                                         // 270
                                                                                                                     // 271
if (Meteor.isServer) {                                                                                               // 272
  Meteor.publish("publisherErrors", function (collName, options) {                                                   // 273
    check(collName, String);                                                                                         // 274
    // See below to see what options are accepted.                                                                   // 275
    check(options, Object);                                                                                          // 276
    var sub = this;                                                                                                  // 277
                                                                                                                     // 278
    // First add a random item, which should be cleaned up. We use ready/onReady                                     // 279
    // to make sure that the second test block is only called after the added is                                     // 280
    // processed, so that there's any chance of the coll.find().count() failing.                                     // 281
    sub.added(collName, Random.id(), {foo: 42});                                                                     // 282
    sub.ready();                                                                                                     // 283
                                                                                                                     // 284
    if (options.stopInHandler) {                                                                                     // 285
      sub.stop();                                                                                                    // 286
      return;                                                                                                        // 287
    }                                                                                                                // 288
                                                                                                                     // 289
    var error;                                                                                                       // 290
    if (options.internalError) {                                                                                     // 291
      error = new Error("Egads!");                                                                                   // 292
      error.expected = true;  // don't log                                                                           // 293
    } else {                                                                                                         // 294
      error = new Meteor.Error(412, "Explicit error");                                                               // 295
    }                                                                                                                // 296
    if (options.throwInHandler) {                                                                                    // 297
      throw error;                                                                                                   // 298
    } else if (options.errorInHandler) {                                                                             // 299
      sub.error(error);                                                                                              // 300
    } else if (options.throwWhenUserIdSet) {                                                                         // 301
      if (sub.userId)                                                                                                // 302
        throw error;                                                                                                 // 303
    } else if (options.errorLater) {                                                                                 // 304
      Meteor.defer(function () {                                                                                     // 305
        sub.error(error);                                                                                            // 306
      });                                                                                                            // 307
    }                                                                                                                // 308
  });                                                                                                                // 309
}                                                                                                                    // 310
                                                                                                                     // 311
                                                                                                                     // 312
/*****/                                                                                                              // 313
                                                                                                                     // 314
/// Helpers for "livedata - publish multiple cursors"                                                                // 315
One = new Meteor.Collection("collectionOne");                                                                        // 316
Two = new Meteor.Collection("collectionTwo");                                                                        // 317
                                                                                                                     // 318
if (Meteor.isServer) {                                                                                               // 319
  One.remove({});                                                                                                    // 320
  One.insert({name: "value1"});                                                                                      // 321
  One.insert({name: "value2"});                                                                                      // 322
                                                                                                                     // 323
  Two.remove({});                                                                                                    // 324
  Two.insert({name: "value3"});                                                                                      // 325
  Two.insert({name: "value4"});                                                                                      // 326
  Two.insert({name: "value5"});                                                                                      // 327
                                                                                                                     // 328
  Meteor.publish("multiPublish", function (options) {                                                                // 329
    // See below to see what options are accepted.                                                                   // 330
    check(options, Object);                                                                                          // 331
    if (options.normal) {                                                                                            // 332
      return [                                                                                                       // 333
        One.find(),                                                                                                  // 334
        Two.find()                                                                                                   // 335
      ];                                                                                                             // 336
    } else if (options.dup) {                                                                                        // 337
      // Suppress the log of the expected internal error.                                                            // 338
      Meteor._suppress_log(1);                                                                                       // 339
      return [                                                                                                       // 340
        One.find(),                                                                                                  // 341
        One.find({name: "value2"}), // multiple cursors for one collection - error                                   // 342
        Two.find()                                                                                                   // 343
      ];                                                                                                             // 344
    } else if (options.notCursor) {                                                                                  // 345
      // Suppress the log of the expected internal error.                                                            // 346
      Meteor._suppress_log(1);                                                                                       // 347
      return [                                                                                                       // 348
        One.find(),                                                                                                  // 349
        "not a cursor",                                                                                              // 350
        Two.find()                                                                                                   // 351
      ];                                                                                                             // 352
    } else                                                                                                           // 353
      throw "unexpected options";                                                                                    // 354
  });                                                                                                                // 355
}                                                                                                                    // 356
                                                                                                                     // 357
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/livedata/stream_tests.js                                                                                 //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Tinytest.add("stream - status", function (test) {                                                                    // 1
  // Very basic test. Just see that it runs and returns something. Not a                                             // 2
  // lot of coverage, but enough that it would have caught a recent bug.                                             // 3
  var status = Meteor.status();                                                                                      // 4
  test.equal(typeof status, "object");                                                                               // 5
  test.isTrue(status.status);                                                                                        // 6
  // Make sure backward-compatiblity names are defined.                                                              // 7
  test.equal(status.retryCount, status.retryCount);                                                                  // 8
  test.equal(status.retryTime, status.retryTime);                                                                    // 9
});                                                                                                                  // 10
                                                                                                                     // 11
testAsyncMulti("stream - reconnect", [                                                                               // 12
  function (test, expect) {                                                                                          // 13
    var callback = _.once(expect(function() {                                                                        // 14
      var status;                                                                                                    // 15
      status = Meteor.status();                                                                                      // 16
      test.equal(status.status, "connected");                                                                        // 17
                                                                                                                     // 18
      Meteor.reconnect();                                                                                            // 19
      status = Meteor.status();                                                                                      // 20
      test.equal(status.status, "connected");                                                                        // 21
                                                                                                                     // 22
      Meteor.reconnect({_force: true});                                                                              // 23
      status = Meteor.status();                                                                                      // 24
      test.equal(status.status, "waiting");                                                                          // 25
    }));                                                                                                             // 26
                                                                                                                     // 27
    if (Meteor.status().status !== "connected")                                                                      // 28
      Meteor.connection._stream.on('reset', callback);                                                               // 29
    else                                                                                                             // 30
      callback();                                                                                                    // 31
  }                                                                                                                  // 32
]);                                                                                                                  // 33
                                                                                                                     // 34
// Disconnecting and reconnecting transitions through the correct statuses.                                          // 35
testAsyncMulti("stream - basic disconnect", [                                                                        // 36
  function (test, expect) {                                                                                          // 37
    var history = [];                                                                                                // 38
    var stream = new LivedataTest.ClientStream("/");                                                                 // 39
    var onTestPass = expect();                                                                                       // 40
                                                                                                                     // 41
    Deps.autorun(function() {                                                                                        // 42
      var status = stream.status();                                                                                  // 43
                                                                                                                     // 44
      if (_.last(history) != status.status) {                                                                        // 45
        history.push(status.status);                                                                                 // 46
                                                                                                                     // 47
        if (_.isEqual(history, ["connecting", "connected"]))                                                         // 48
          stream.disconnect();                                                                                       // 49
                                                                                                                     // 50
        if (_.isEqual(history, ["connecting", "connected", "offline"]))                                              // 51
          stream.reconnect();                                                                                        // 52
                                                                                                                     // 53
        if (_.isEqual(history, ["connecting", "connected", "offline",                                                // 54
                                "connecting", "connected"])) {                                                       // 55
          stream.disconnect();                                                                                       // 56
          onTestPass();                                                                                              // 57
        }                                                                                                            // 58
      }                                                                                                              // 59
    });                                                                                                              // 60
  }                                                                                                                  // 61
]);                                                                                                                  // 62
                                                                                                                     // 63
// Remain offline if the online event is received while offline.                                                     // 64
testAsyncMulti("stream - disconnect remains offline", [                                                              // 65
  function (test, expect) {                                                                                          // 66
    var history = [];                                                                                                // 67
    var stream = new LivedataTest.ClientStream("/");                                                                 // 68
    var onTestComplete = expect();                                                                                   // 69
                                                                                                                     // 70
    Deps.autorun(function() {                                                                                        // 71
      var status = stream.status();                                                                                  // 72
                                                                                                                     // 73
      if (_.last(history) != status.status) {                                                                        // 74
        history.push(status.status);                                                                                 // 75
                                                                                                                     // 76
        if (_.isEqual(history, ["connecting", "connected"]))                                                         // 77
          stream.disconnect();                                                                                       // 78
                                                                                                                     // 79
        if (_.isEqual(history, ["connecting", "connected", "offline"])) {                                            // 80
          stream._online();                                                                                          // 81
          test.isTrue(status.status == "offline");                                                                   // 82
          onTestComplete();                                                                                          // 83
        }                                                                                                            // 84
      }                                                                                                              // 85
    });                                                                                                              // 86
  }                                                                                                                  // 87
]);                                                                                                                  // 88
                                                                                                                     // 89
Tinytest.add("stream - sockjs urls are computed correctly", function(test) {                                         // 90
  var testHasSockjsUrl = function(raw, expectedSockjsUrl) {                                                          // 91
    var actual = LivedataTest.toSockjsUrl(raw);                                                                      // 92
    if (expectedSockjsUrl instanceof RegExp)                                                                         // 93
      test.isTrue(actual.match(expectedSockjsUrl), actual);                                                          // 94
    else                                                                                                             // 95
      test.equal(actual, expectedSockjsUrl);                                                                         // 96
  };                                                                                                                 // 97
                                                                                                                     // 98
  testHasSockjsUrl("http://subdomain.meteor.com/",                                                                   // 99
                   "http://subdomain.meteor.com/sockjs");                                                            // 100
  testHasSockjsUrl("http://subdomain.meteor.com",                                                                    // 101
                   "http://subdomain.meteor.com/sockjs");                                                            // 102
  testHasSockjsUrl("subdomain.meteor.com/",                                                                          // 103
                   "http://subdomain.meteor.com/sockjs");                                                            // 104
  testHasSockjsUrl("subdomain.meteor.com",                                                                           // 105
                   "http://subdomain.meteor.com/sockjs");                                                            // 106
  testHasSockjsUrl("/", Meteor._relativeToSiteRootUrl("/sockjs"));                                                   // 107
                                                                                                                     // 108
  testHasSockjsUrl("http://localhost:3000/", "http://localhost:3000/sockjs");                                        // 109
  testHasSockjsUrl("http://localhost:3000", "http://localhost:3000/sockjs");                                         // 110
  testHasSockjsUrl("localhost:3000", "http://localhost:3000/sockjs");                                                // 111
                                                                                                                     // 112
  testHasSockjsUrl("https://subdomain.meteor.com/",                                                                  // 113
                   "https://subdomain.meteor.com/sockjs");                                                           // 114
  testHasSockjsUrl("https://subdomain.meteor.com",                                                                   // 115
                   "https://subdomain.meteor.com/sockjs");                                                           // 116
                                                                                                                     // 117
  testHasSockjsUrl("ddp+sockjs://ddp--****-foo.meteor.com/sockjs",                                                   // 118
                   /^https:\/\/ddp--\d\d\d\d-foo\.meteor\.com\/sockjs$/);                                            // 119
  testHasSockjsUrl("ddpi+sockjs://ddp--****-foo.meteor.com/sockjs",                                                  // 120
                   /^http:\/\/ddp--\d\d\d\d-foo\.meteor\.com\/sockjs$/);                                             // 121
});                                                                                                                  // 122
                                                                                                                     // 123
testAsyncMulti("stream - /websocket is a websocket endpoint", [                                                      // 124
  function(test, expect) {                                                                                           // 125
    //                                                                                                               // 126
    // Verify that /websocket and /websocket/ don't return the main page                                             // 127
    //                                                                                                               // 128
    _.each(['/websocket', '/websocket/'], function(path) {                                                           // 129
      HTTP.get(Meteor._relativeToSiteRootUrl(path), expect(function(error, result) {                                 // 130
        test.isNotNull(error);                                                                                       // 131
        test.equal('Can "Upgrade" only to "WebSocket".', result.content);                                            // 132
      }));                                                                                                           // 133
    });                                                                                                              // 134
                                                                                                                     // 135
    //                                                                                                               // 136
    // For sanity, also verify that /websockets and /websockets/ return                                              // 137
    // the main page                                                                                                 // 138
    //                                                                                                               // 139
                                                                                                                     // 140
    // Somewhat contorted but we can't call nested expects (XXX why?)                                                // 141
    var pageContent;                                                                                                 // 142
    var wrappedCallback = expect(function(error, result) {                                                           // 143
      test.isNull(error);                                                                                            // 144
      test.equal(pageContent, result.content);                                                                       // 145
    });                                                                                                              // 146
                                                                                                                     // 147
    HTTP.get(Meteor._relativeToSiteRootUrl('/'), expect(function(error, result) {                                    // 148
      test.isNull(error);                                                                                            // 149
      pageContent = result.content;                                                                                  // 150
                                                                                                                     // 151
      _.each(['/websockets', '/websockets/'], function(path) {                                                       // 152
        HTTP.get(Meteor._relativeToSiteRootUrl(path), wrappedCallback);                                              // 153
      });                                                                                                            // 154
    }));                                                                                                             // 155
  }                                                                                                                  // 156
]);                                                                                                                  // 157
                                                                                                                     // 158
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
