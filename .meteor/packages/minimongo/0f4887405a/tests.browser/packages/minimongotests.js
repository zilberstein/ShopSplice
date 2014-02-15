(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                          //
// packages/minimongo/minimongo_tests.js                                                                    //
//                                                                                                          //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                            //
                                                                                                            // 1
// Hack to make LocalCollection generate ObjectIDs by default.                                              // 2
LocalCollection._useOID = true;                                                                             // 3
                                                                                                            // 4
// assert that f is a strcmp-style comparison function that puts                                            // 5
// 'values' in the provided order                                                                           // 6
                                                                                                            // 7
var assert_ordering = function (test, f, values) {                                                          // 8
  for (var i = 0; i < values.length; i++) {                                                                 // 9
    var x = f(values[i], values[i]);                                                                        // 10
    if (x !== 0) {                                                                                          // 11
      // XXX super janky                                                                                    // 12
      test.fail({type: "minimongo-ordering",                                                                // 13
                 message: "value doesn't order as equal to itself",                                         // 14
                 value: JSON.stringify(values[i]),                                                          // 15
                 should_be_zero_but_got: JSON.stringify(x)});                                               // 16
    }                                                                                                       // 17
    if (i + 1 < values.length) {                                                                            // 18
      var less = values[i];                                                                                 // 19
      var more = values[i + 1];                                                                             // 20
      var x = f(less, more);                                                                                // 21
      if (!(x < 0)) {                                                                                       // 22
        // XXX super janky                                                                                  // 23
        test.fail({type: "minimongo-ordering",                                                              // 24
                   message: "ordering test failed",                                                         // 25
                   first: JSON.stringify(less),                                                             // 26
                   second: JSON.stringify(more),                                                            // 27
                   should_be_negative_but_got: JSON.stringify(x)});                                         // 28
      }                                                                                                     // 29
      x = f(more, less);                                                                                    // 30
      if (!(x > 0)) {                                                                                       // 31
        // XXX super janky                                                                                  // 32
        test.fail({type: "minimongo-ordering",                                                              // 33
                   message: "ordering test failed",                                                         // 34
                   first: JSON.stringify(less),                                                             // 35
                   second: JSON.stringify(more),                                                            // 36
                   should_be_positive_but_got: JSON.stringify(x)});                                         // 37
      }                                                                                                     // 38
    }                                                                                                       // 39
  }                                                                                                         // 40
};                                                                                                          // 41
                                                                                                            // 42
var log_callbacks = function (operations) {                                                                 // 43
  return {                                                                                                  // 44
    addedAt: function (obj, idx, before) {                                                                  // 45
      delete obj._id;                                                                                       // 46
      operations.push(EJSON.clone(['added', obj, idx, before]));                                            // 47
    },                                                                                                      // 48
    changedAt: function (obj, old_obj, at) {                                                                // 49
      delete obj._id;                                                                                       // 50
      delete old_obj._id;                                                                                   // 51
      operations.push(EJSON.clone(['changed', obj, at, old_obj]));                                          // 52
    },                                                                                                      // 53
    movedTo: function (obj, old_at, new_at, before) {                                                       // 54
      delete obj._id;                                                                                       // 55
      operations.push(EJSON.clone(['moved', obj, old_at, new_at, before]));                                 // 56
    },                                                                                                      // 57
    removedAt: function (old_obj, at) {                                                                     // 58
      var id = old_obj._id;                                                                                 // 59
      delete old_obj._id;                                                                                   // 60
      operations.push(EJSON.clone(['removed', id, at, old_obj]));                                           // 61
    }                                                                                                       // 62
  };                                                                                                        // 63
};                                                                                                          // 64
                                                                                                            // 65
// XXX test shared structure in all MM entrypoints                                                          // 66
Tinytest.add("minimongo - basics", function (test) {                                                        // 67
  var c = new LocalCollection(),                                                                            // 68
      fluffyKitten_id,                                                                                      // 69
      count;                                                                                                // 70
                                                                                                            // 71
  fluffyKitten_id = c.insert({type: "kitten", name: "fluffy"});                                             // 72
  c.insert({type: "kitten", name: "snookums"});                                                             // 73
  c.insert({type: "cryptographer", name: "alice"});                                                         // 74
  c.insert({type: "cryptographer", name: "bob"});                                                           // 75
  c.insert({type: "cryptographer", name: "cara"});                                                          // 76
  test.equal(c.find().count(), 5);                                                                          // 77
  test.equal(c.find({type: "kitten"}).count(), 2);                                                          // 78
  test.equal(c.find({type: "cryptographer"}).count(), 3);                                                   // 79
  test.length(c.find({type: "kitten"}).fetch(), 2);                                                         // 80
  test.length(c.find({type: "cryptographer"}).fetch(), 3);                                                  // 81
  test.equal(fluffyKitten_id, c.findOne({type: "kitten", name: "fluffy"})._id);                             // 82
                                                                                                            // 83
  c.remove({name: "cara"});                                                                                 // 84
  test.equal(c.find().count(), 4);                                                                          // 85
  test.equal(c.find({type: "kitten"}).count(), 2);                                                          // 86
  test.equal(c.find({type: "cryptographer"}).count(), 2);                                                   // 87
  test.length(c.find({type: "kitten"}).fetch(), 2);                                                         // 88
  test.length(c.find({type: "cryptographer"}).fetch(), 2);                                                  // 89
                                                                                                            // 90
  count = c.update({name: "snookums"}, {$set: {type: "cryptographer"}});                                    // 91
  test.equal(count, 1);                                                                                     // 92
  test.equal(c.find().count(), 4);                                                                          // 93
  test.equal(c.find({type: "kitten"}).count(), 1);                                                          // 94
  test.equal(c.find({type: "cryptographer"}).count(), 3);                                                   // 95
  test.length(c.find({type: "kitten"}).fetch(), 1);                                                         // 96
  test.length(c.find({type: "cryptographer"}).fetch(), 3);                                                  // 97
                                                                                                            // 98
  c.remove(null);                                                                                           // 99
  c.remove(false);                                                                                          // 100
  c.remove(undefined);                                                                                      // 101
  test.equal(c.find().count(), 4);                                                                          // 102
                                                                                                            // 103
  c.remove({_id: null});                                                                                    // 104
  c.remove({_id: false});                                                                                   // 105
  c.remove({_id: undefined});                                                                               // 106
  count = c.remove();                                                                                       // 107
  test.equal(count, 0);                                                                                     // 108
  test.equal(c.find().count(), 4);                                                                          // 109
                                                                                                            // 110
  count = c.remove({});                                                                                     // 111
  test.equal(count, 4);                                                                                     // 112
  test.equal(c.find().count(), 0);                                                                          // 113
                                                                                                            // 114
  c.insert({_id: 1, name: "strawberry", tags: ["fruit", "red", "squishy"]});                                // 115
  c.insert({_id: 2, name: "apple", tags: ["fruit", "red", "hard"]});                                        // 116
  c.insert({_id: 3, name: "rose", tags: ["flower", "red", "squishy"]});                                     // 117
                                                                                                            // 118
  test.equal(c.find({tags: "flower"}).count(), 1);                                                          // 119
  test.equal(c.find({tags: "fruit"}).count(), 2);                                                           // 120
  test.equal(c.find({tags: "red"}).count(), 3);                                                             // 121
  test.length(c.find({tags: "flower"}).fetch(), 1);                                                         // 122
  test.length(c.find({tags: "fruit"}).fetch(), 2);                                                          // 123
  test.length(c.find({tags: "red"}).fetch(), 3);                                                            // 124
                                                                                                            // 125
  test.equal(c.findOne(1).name, "strawberry");                                                              // 126
  test.equal(c.findOne(2).name, "apple");                                                                   // 127
  test.equal(c.findOne(3).name, "rose");                                                                    // 128
  test.equal(c.findOne(4), undefined);                                                                      // 129
  test.equal(c.findOne("abc"), undefined);                                                                  // 130
  test.equal(c.findOne(undefined), undefined);                                                              // 131
                                                                                                            // 132
  test.equal(c.find(1).count(), 1);                                                                         // 133
  test.equal(c.find(4).count(), 0);                                                                         // 134
  test.equal(c.find("abc").count(), 0);                                                                     // 135
  test.equal(c.find(undefined).count(), 0);                                                                 // 136
  test.equal(c.find().count(), 3);                                                                          // 137
  test.equal(c.find(1, {skip: 1}).count(), 0);                                                              // 138
  test.equal(c.find({_id: 1}, {skip: 1}).count(), 0);                                                       // 139
  test.equal(c.find({}, {skip: 1}).count(), 2);                                                             // 140
  test.equal(c.find({}, {skip: 2}).count(), 1);                                                             // 141
  test.equal(c.find({}, {limit: 2}).count(), 2);                                                            // 142
  test.equal(c.find({}, {limit: 1}).count(), 1);                                                            // 143
  test.equal(c.find({}, {skip: 1, limit: 1}).count(), 1);                                                   // 144
  test.equal(c.find({tags: "fruit"}, {skip: 1}).count(), 1);                                                // 145
  test.equal(c.find({tags: "fruit"}, {limit: 1}).count(), 1);                                               // 146
  test.equal(c.find({tags: "fruit"}, {skip: 1, limit: 1}).count(), 1);                                      // 147
  test.equal(c.find(1, {sort: ['_id','desc'], skip: 1}).count(), 0);                                        // 148
  test.equal(c.find({_id: 1}, {sort: ['_id','desc'], skip: 1}).count(), 0);                                 // 149
  test.equal(c.find({}, {sort: ['_id','desc'], skip: 1}).count(), 2);                                       // 150
  test.equal(c.find({}, {sort: ['_id','desc'], skip: 2}).count(), 1);                                       // 151
  test.equal(c.find({}, {sort: ['_id','desc'], limit: 2}).count(), 2);                                      // 152
  test.equal(c.find({}, {sort: ['_id','desc'], limit: 1}).count(), 1);                                      // 153
  test.equal(c.find({}, {sort: ['_id','desc'], skip: 1, limit: 1}).count(), 1);                             // 154
  test.equal(c.find({tags: "fruit"}, {sort: ['_id','desc'], skip: 1}).count(), 1);                          // 155
  test.equal(c.find({tags: "fruit"}, {sort: ['_id','desc'], limit: 1}).count(), 1);                         // 156
  test.equal(c.find({tags: "fruit"}, {sort: ['_id','desc'], skip: 1, limit: 1}).count(), 1);                // 157
                                                                                                            // 158
  // Regression test for #455.                                                                              // 159
  c.insert({foo: {bar: 'baz'}});                                                                            // 160
  test.equal(c.find({foo: {bam: 'baz'}}).count(), 0);                                                       // 161
  test.equal(c.find({foo: {bar: 'baz'}}).count(), 1);                                                       // 162
                                                                                                            // 163
});                                                                                                         // 164
                                                                                                            // 165
Tinytest.add("minimongo - cursors", function (test) {                                                       // 166
  var c = new LocalCollection();                                                                            // 167
  var res;                                                                                                  // 168
                                                                                                            // 169
  for (var i = 0; i < 20; i++)                                                                              // 170
    c.insert({i: i});                                                                                       // 171
                                                                                                            // 172
  var q = c.find();                                                                                         // 173
  test.equal(q.count(), 20);                                                                                // 174
                                                                                                            // 175
  // fetch                                                                                                  // 176
  res = q.fetch();                                                                                          // 177
  test.length(res, 20);                                                                                     // 178
  for (var i = 0; i < 20; i++)                                                                              // 179
    test.equal(res[i].i, i);                                                                                // 180
  // everything empty                                                                                       // 181
  test.length(q.fetch(), 0);                                                                                // 182
  q.rewind();                                                                                               // 183
                                                                                                            // 184
  // forEach                                                                                                // 185
  var count = 0;                                                                                            // 186
  var context = {};                                                                                         // 187
  q.forEach(function (obj, i, cursor) {                                                                     // 188
    test.equal(obj.i, count++);                                                                             // 189
    test.equal(obj.i, i);                                                                                   // 190
    test.isTrue(context === this);                                                                          // 191
    test.isTrue(cursor === q);                                                                              // 192
  }, context);                                                                                              // 193
  test.equal(count, 20);                                                                                    // 194
  // everything empty                                                                                       // 195
  test.length(q.fetch(), 0);                                                                                // 196
  q.rewind();                                                                                               // 197
                                                                                                            // 198
  // map                                                                                                    // 199
  res = q.map(function (obj, i, cursor) {                                                                   // 200
    test.equal(obj.i, i);                                                                                   // 201
    test.isTrue(context === this);                                                                          // 202
    test.isTrue(cursor === q);                                                                              // 203
    return obj.i * 2;                                                                                       // 204
  }, context);                                                                                              // 205
  test.length(res, 20);                                                                                     // 206
  for (var i = 0; i < 20; i++)                                                                              // 207
    test.equal(res[i], i * 2);                                                                              // 208
  // everything empty                                                                                       // 209
  test.length(q.fetch(), 0);                                                                                // 210
                                                                                                            // 211
  // findOne (and no rewind first)                                                                          // 212
  test.equal(c.findOne({i: 0}).i, 0);                                                                       // 213
  test.equal(c.findOne({i: 1}).i, 1);                                                                       // 214
  var id = c.findOne({i: 2})._id;                                                                           // 215
  test.equal(c.findOne(id).i, 2);                                                                           // 216
});                                                                                                         // 217
                                                                                                            // 218
Tinytest.add("minimongo - misc", function (test) {                                                          // 219
  // deepcopy                                                                                               // 220
  var a = {a: [1, 2, 3], b: "x", c: true, d: {x: 12, y: [12]},                                              // 221
           f: null, g: new Date()};                                                                         // 222
  var b = EJSON.clone(a);                                                                                   // 223
  test.equal(a, b);                                                                                         // 224
  test.isTrue(LocalCollection._f._equal(a, b));                                                             // 225
  a.a.push(4);                                                                                              // 226
  test.length(b.a, 3);                                                                                      // 227
  a.c = false;                                                                                              // 228
  test.isTrue(b.c);                                                                                         // 229
  b.d.z = 15;                                                                                               // 230
  a.d.z = 14;                                                                                               // 231
  test.equal(b.d.z, 15);                                                                                    // 232
  a.d.y.push(88);                                                                                           // 233
  test.length(b.d.y, 1);                                                                                    // 234
  test.equal(a.g, b.g);                                                                                     // 235
  b.g.setDate(b.g.getDate() + 1);                                                                           // 236
  test.notEqual(a.g, b.g);                                                                                  // 237
                                                                                                            // 238
  a = {x: function () {}};                                                                                  // 239
  b = EJSON.clone(a);                                                                                       // 240
  a.x.a = 14;                                                                                               // 241
  test.equal(b.x.a, 14); // just to document current behavior                                               // 242
});                                                                                                         // 243
                                                                                                            // 244
Tinytest.add("minimongo - lookup", function (test) {                                                        // 245
  var lookupA = LocalCollection._makeLookupFunction('a');                                                   // 246
  test.equal(lookupA({}), [undefined]);                                                                     // 247
  test.equal(lookupA({a: 1}), [1]);                                                                         // 248
  test.equal(lookupA({a: [1]}), [[1]]);                                                                     // 249
                                                                                                            // 250
  var lookupAX = LocalCollection._makeLookupFunction('a.x');                                                // 251
  test.equal(lookupAX({a: {x: 1}}), [1]);                                                                   // 252
  test.equal(lookupAX({a: {x: [1]}}), [[1]]);                                                               // 253
  test.equal(lookupAX({a: 5}), [undefined]);                                                                // 254
  test.equal(lookupAX({a: [{x: 1}, {x: [2]}, {y: 3}]}),                                                     // 255
             [1, [2], undefined]);                                                                          // 256
                                                                                                            // 257
  var lookupA0X = LocalCollection._makeLookupFunction('a.0.x');                                             // 258
  test.equal(lookupA0X({a: [{x: 1}]}), [1]);                                                                // 259
  test.equal(lookupA0X({a: [{x: [1]}]}), [[1]]);                                                            // 260
  test.equal(lookupA0X({a: 5}), [undefined]);                                                               // 261
  test.equal(lookupA0X({a: [{x: 1}, {x: [2]}, {y: 3}]}), [1]);                                              // 262
});                                                                                                         // 263
                                                                                                            // 264
Tinytest.add("minimongo - selector_compiler", function (test) {                                             // 265
  var matches = function (should_match, selector, doc) {                                                    // 266
    var does_match = MinimongoTest.matches(selector, doc);                                                  // 267
    if (does_match != should_match) {                                                                       // 268
      // XXX super janky                                                                                    // 269
      test.fail({type: "minimongo-ordering",                                                                // 270
                 message: "minimongo match failure: document " +                                            // 271
                 (should_match ? "should match, but doesn't" :                                              // 272
                  "shouldn't match, but does"),                                                             // 273
                 selector: JSON.stringify(selector),                                                        // 274
                 document: JSON.stringify(doc)                                                              // 275
                });                                                                                         // 276
    }                                                                                                       // 277
  };                                                                                                        // 278
                                                                                                            // 279
  var match = _.bind(matches, null, true);                                                                  // 280
  var nomatch = _.bind(matches, null, false);                                                               // 281
                                                                                                            // 282
  // XXX blog post about what I learned while writing these tests (weird                                    // 283
  // mongo edge cases)                                                                                      // 284
                                                                                                            // 285
  // empty selectors                                                                                        // 286
  match({}, {});                                                                                            // 287
  match({}, {a: 12});                                                                                       // 288
                                                                                                            // 289
  // scalars                                                                                                // 290
  match(1, {_id: 1, a: 'foo'});                                                                             // 291
  nomatch(1, {_id: 2, a: 'foo'});                                                                           // 292
  match('a', {_id: 'a', a: 'foo'});                                                                         // 293
  nomatch('a', {_id: 'b', a: 'foo'});                                                                       // 294
                                                                                                            // 295
  // safety                                                                                                 // 296
  nomatch(undefined, {});                                                                                   // 297
  nomatch(undefined, {_id: 'foo'});                                                                         // 298
  nomatch(false, {_id: 'foo'});                                                                             // 299
  nomatch(null, {_id: 'foo'});                                                                              // 300
  nomatch({_id: undefined}, {_id: 'foo'});                                                                  // 301
  nomatch({_id: false}, {_id: 'foo'});                                                                      // 302
  nomatch({_id: null}, {_id: 'foo'});                                                                       // 303
                                                                                                            // 304
  // matching one or more keys                                                                              // 305
  nomatch({a: 12}, {});                                                                                     // 306
  match({a: 12}, {a: 12});                                                                                  // 307
  match({a: 12}, {a: 12, b: 13});                                                                           // 308
  match({a: 12, b: 13}, {a: 12, b: 13});                                                                    // 309
  match({a: 12, b: 13}, {a: 12, b: 13, c: 14});                                                             // 310
  nomatch({a: 12, b: 13, c: 14}, {a: 12, b: 13});                                                           // 311
  nomatch({a: 12, b: 13}, {b: 13, c: 14});                                                                  // 312
                                                                                                            // 313
  match({a: 12}, {a: [12]});                                                                                // 314
  match({a: 12}, {a: [11, 12, 13]});                                                                        // 315
  nomatch({a: 12}, {a: [11, 13]});                                                                          // 316
  match({a: 12, b: 13}, {a: [11, 12, 13], b: [13, 14, 15]});                                                // 317
  nomatch({a: 12, b: 13}, {a: [11, 12, 13], b: [14, 15]});                                                  // 318
                                                                                                            // 319
  // arrays                                                                                                 // 320
  match({a: [1,2]}, {a: [1, 2]});                                                                           // 321
  match({a: [1,2]}, {a: [[1, 2]]});                                                                         // 322
  match({a: [1,2]}, {a: [[3, 4], [1, 2]]});                                                                 // 323
  nomatch({a: [1,2]}, {a: [3, 4]});                                                                         // 324
  nomatch({a: [1,2]}, {a: [[[1, 2]]]});                                                                     // 325
                                                                                                            // 326
  // literal documents                                                                                      // 327
  match({a: {b: 12}}, {a: {b: 12}});                                                                        // 328
  nomatch({a: {b: 12, c: 13}}, {a: {b: 12}});                                                               // 329
  nomatch({a: {b: 12}}, {a: {b: 12, c: 13}});                                                               // 330
  match({a: {b: 12, c: 13}}, {a: {b: 12, c: 13}});                                                          // 331
  nomatch({a: {b: 12, c: 13}}, {a: {c: 13, b: 12}}); // tested on mongodb                                   // 332
  nomatch({a: {}}, {a: {b: 12}});                                                                           // 333
  nomatch({a: {b:12}}, {a: {}});                                                                            // 334
  match(                                                                                                    // 335
    {a: {b: 12, c: [13, true, false, 2.2, "a", null, {d: 14}]}},                                            // 336
    {a: {b: 12, c: [13, true, false, 2.2, "a", null, {d: 14}]}});                                           // 337
  match({a: {b: 12}}, {a: {b: 12}, k: 99});                                                                 // 338
                                                                                                            // 339
  match({a: {b: 12}}, {a: [{b: 12}]});                                                                      // 340
  nomatch({a: {b: 12}}, {a: [[{b: 12}]]});                                                                  // 341
  match({a: {b: 12}}, {a: [{b: 11}, {b: 12}, {b: 13}]});                                                    // 342
  nomatch({a: {b: 12}}, {a: [{b: 11}, {b: 12, c: 20}, {b: 13}]});                                           // 343
  nomatch({a: {b: 12, c: 20}}, {a: [{b: 11}, {b: 12}, {c: 20}]});                                           // 344
  match({a: {b: 12, c: 20}}, {a: [{b: 11}, {b: 12, c: 20}, {b: 13}]});                                      // 345
                                                                                                            // 346
  // null                                                                                                   // 347
  match({a: null}, {a: null});                                                                              // 348
  match({a: null}, {b: 12});                                                                                // 349
  nomatch({a: null}, {a: 12});                                                                              // 350
  match({a: null}, {a: [1, 2, null, 3]}); // tested on mongodb                                              // 351
  nomatch({a: null}, {a: [1, 2, {}, 3]}); // tested on mongodb                                              // 352
                                                                                                            // 353
  // order comparisons: $lt, $gt, $lte, $gte                                                                // 354
  match({a: {$lt: 10}}, {a: 9});                                                                            // 355
  nomatch({a: {$lt: 10}}, {a: 10});                                                                         // 356
  nomatch({a: {$lt: 10}}, {a: 11});                                                                         // 357
                                                                                                            // 358
  match({a: {$gt: 10}}, {a: 11});                                                                           // 359
  nomatch({a: {$gt: 10}}, {a: 10});                                                                         // 360
  nomatch({a: {$gt: 10}}, {a: 9});                                                                          // 361
                                                                                                            // 362
  match({a: {$lte: 10}}, {a: 9});                                                                           // 363
  match({a: {$lte: 10}}, {a: 10});                                                                          // 364
  nomatch({a: {$lte: 10}}, {a: 11});                                                                        // 365
                                                                                                            // 366
  match({a: {$gte: 10}}, {a: 11});                                                                          // 367
  match({a: {$gte: 10}}, {a: 10});                                                                          // 368
  nomatch({a: {$gte: 10}}, {a: 9});                                                                         // 369
                                                                                                            // 370
  match({a: {$lt: 10}}, {a: [11, 9, 12]});                                                                  // 371
  nomatch({a: {$lt: 10}}, {a: [11, 12]});                                                                   // 372
                                                                                                            // 373
  // (there's a full suite of ordering test elsewhere)                                                      // 374
  match({a: {$lt: "null"}}, {a: null}); // tested against mongodb                                           // 375
  match({a: {$lt: {x: [2, 3, 4]}}}, {a: {x: [1, 3, 4]}});                                                   // 376
  match({a: {$gt: {x: [2, 3, 4]}}}, {a: {x: [3, 3, 4]}});                                                   // 377
  nomatch({a: {$gt: {x: [2, 3, 4]}}}, {a: {x: [1, 3, 4]}});                                                 // 378
  nomatch({a: {$gt: {x: [2, 3, 4]}}}, {a: {x: [2, 3, 4]}});                                                 // 379
  nomatch({a: {$lt: {x: [2, 3, 4]}}}, {a: {x: [2, 3, 4]}});                                                 // 380
  match({a: {$gte: {x: [2, 3, 4]}}}, {a: {x: [2, 3, 4]}});                                                  // 381
  match({a: {$lte: {x: [2, 3, 4]}}}, {a: {x: [2, 3, 4]}});                                                  // 382
                                                                                                            // 383
  nomatch({a: {$gt: [2, 3]}}, {a: [1, 2]}); // tested against mongodb                                       // 384
                                                                                                            // 385
  // composition of two qualifiers                                                                          // 386
  nomatch({a: {$lt: 11, $gt: 9}}, {a: 8});                                                                  // 387
  nomatch({a: {$lt: 11, $gt: 9}}, {a: 9});                                                                  // 388
  match({a: {$lt: 11, $gt: 9}}, {a: 10});                                                                   // 389
  nomatch({a: {$lt: 11, $gt: 9}}, {a: 11});                                                                 // 390
  nomatch({a: {$lt: 11, $gt: 9}}, {a: 12});                                                                 // 391
                                                                                                            // 392
  match({a: {$lt: 11, $gt: 9}}, {a: [8, 9, 10, 11, 12]});                                                   // 393
  match({a: {$lt: 11, $gt: 9}}, {a: [8, 9, 11, 12]}); // tested against mongodb                             // 394
                                                                                                            // 395
  // $all                                                                                                   // 396
  match({a: {$all: [1, 2]}}, {a: [1, 2]});                                                                  // 397
  nomatch({a: {$all: [1, 2, 3]}}, {a: [1, 2]});                                                             // 398
  match({a: {$all: [1, 2]}}, {a: [3, 2, 1]});                                                               // 399
  match({a: {$all: [1, "x"]}}, {a: [3, "x", 1]});                                                           // 400
  nomatch({a: {$all: ['2']}}, {a: 2});                                                                      // 401
  nomatch({a: {$all: [2]}}, {a: '2'});                                                                      // 402
  match({a: {$all: [[1, 2], [1, 3]]}}, {a: [[1, 3], [1, 2], [1, 4]]});                                      // 403
  nomatch({a: {$all: [[1, 2], [1, 3]]}}, {a: [[1, 4], [1, 2], [1, 4]]});                                    // 404
  match({a: {$all: [2, 2]}}, {a: [2]}); // tested against mongodb                                           // 405
  nomatch({a: {$all: [2, 3]}}, {a: [2, 2]});                                                                // 406
                                                                                                            // 407
  nomatch({a: {$all: [1, 2]}}, {a: [[1, 2]]}); // tested against mongodb                                    // 408
  nomatch({a: {$all: [1, 2]}}, {}); // tested against mongodb, field doesn't exist                          // 409
  nomatch({a: {$all: [1, 2]}}, {a: {foo: 'bar'}}); // tested against mongodb, field is not an object        // 410
                                                                                                            // 411
  // $exists                                                                                                // 412
  match({a: {$exists: true}}, {a: 12});                                                                     // 413
  nomatch({a: {$exists: true}}, {b: 12});                                                                   // 414
  nomatch({a: {$exists: false}}, {a: 12});                                                                  // 415
  match({a: {$exists: false}}, {b: 12});                                                                    // 416
                                                                                                            // 417
  match({a: {$exists: true}}, {a: []});                                                                     // 418
  nomatch({a: {$exists: true}}, {b: []});                                                                   // 419
  nomatch({a: {$exists: false}}, {a: []});                                                                  // 420
  match({a: {$exists: false}}, {b: []});                                                                    // 421
                                                                                                            // 422
  match({a: {$exists: true}}, {a: [1]});                                                                    // 423
  nomatch({a: {$exists: true}}, {b: [1]});                                                                  // 424
  nomatch({a: {$exists: false}}, {a: [1]});                                                                 // 425
  match({a: {$exists: false}}, {b: [1]});                                                                   // 426
                                                                                                            // 427
  // $mod                                                                                                   // 428
  match({a: {$mod: [10, 1]}}, {a: 11});                                                                     // 429
  nomatch({a: {$mod: [10, 1]}}, {a: 12});                                                                   // 430
  match({a: {$mod: [10, 1]}}, {a: [10, 11, 12]});                                                           // 431
  nomatch({a: {$mod: [10, 1]}}, {a: [10, 12]});                                                             // 432
                                                                                                            // 433
  // $ne                                                                                                    // 434
  match({a: {$ne: 1}}, {a: 2});                                                                             // 435
  nomatch({a: {$ne: 2}}, {a: 2});                                                                           // 436
  match({a: {$ne: [1]}}, {a: [2]});                                                                         // 437
                                                                                                            // 438
  nomatch({a: {$ne: [1, 2]}}, {a: [1, 2]}); // all tested against mongodb                                   // 439
  nomatch({a: {$ne: 1}}, {a: [1, 2]});                                                                      // 440
  nomatch({a: {$ne: 2}}, {a: [1, 2]});                                                                      // 441
  match({a: {$ne: 3}}, {a: [1, 2]});                                                                        // 442
  nomatch({'a.b': {$ne: 1}}, {a: [{b: 1}, {b: 2}]});                                                        // 443
  nomatch({'a.b': {$ne: 2}}, {a: [{b: 1}, {b: 2}]});                                                        // 444
  match({'a.b': {$ne: 3}}, {a: [{b: 1}, {b: 2}]});                                                          // 445
                                                                                                            // 446
  nomatch({a: {$ne: {x: 1}}}, {a: {x: 1}});                                                                 // 447
  match({a: {$ne: {x: 1}}}, {a: {x: 2}});                                                                   // 448
  match({a: {$ne: {x: 1}}}, {a: {x: 1, y: 2}});                                                             // 449
                                                                                                            // 450
  // $in                                                                                                    // 451
  match({a: {$in: [1, 2, 3]}}, {a: 2});                                                                     // 452
  nomatch({a: {$in: [1, 2, 3]}}, {a: 4});                                                                   // 453
  match({a: {$in: [[1], [2], [3]]}}, {a: [2]});                                                             // 454
  nomatch({a: {$in: [[1], [2], [3]]}}, {a: [4]});                                                           // 455
  match({a: {$in: [{b: 1}, {b: 2}, {b: 3}]}}, {a: {b: 2}});                                                 // 456
  nomatch({a: {$in: [{b: 1}, {b: 2}, {b: 3}]}}, {a: {b: 4}});                                               // 457
                                                                                                            // 458
  match({a: {$in: [1, 2, 3]}}, {a: [2]}); // tested against mongodb                                         // 459
  match({a: {$in: [{x: 1}, {x: 2}, {x: 3}]}}, {a: [{x: 2}]});                                               // 460
  match({a: {$in: [1, 2, 3]}}, {a: [4, 2]});                                                                // 461
  nomatch({a: {$in: [1, 2, 3]}}, {a: [4]});                                                                 // 462
                                                                                                            // 463
  // $nin                                                                                                   // 464
  nomatch({a: {$nin: [1, 2, 3]}}, {a: 2});                                                                  // 465
  match({a: {$nin: [1, 2, 3]}}, {a: 4});                                                                    // 466
  nomatch({a: {$nin: [[1], [2], [3]]}}, {a: [2]});                                                          // 467
  match({a: {$nin: [[1], [2], [3]]}}, {a: [4]});                                                            // 468
  nomatch({a: {$nin: [{b: 1}, {b: 2}, {b: 3}]}}, {a: {b: 2}});                                              // 469
  match({a: {$nin: [{b: 1}, {b: 2}, {b: 3}]}}, {a: {b: 4}});                                                // 470
                                                                                                            // 471
  nomatch({a: {$nin: [1, 2, 3]}}, {a: [2]}); // tested against mongodb                                      // 472
  nomatch({a: {$nin: [{x: 1}, {x: 2}, {x: 3}]}}, {a: [{x: 2}]});                                            // 473
  nomatch({a: {$nin: [1, 2, 3]}}, {a: [4, 2]});                                                             // 474
  nomatch({'a.b': {$nin: [1, 2, 3]}}, {a: [{b:4}, {b:2}]});                                                 // 475
  match({a: {$nin: [1, 2, 3]}}, {a: [4]});                                                                  // 476
  match({'a.b': {$nin: [1, 2, 3]}}, {a: [{b:4}]});                                                          // 477
                                                                                                            // 478
  // $size                                                                                                  // 479
  match({a: {$size: 0}}, {a: []});                                                                          // 480
  match({a: {$size: 1}}, {a: [2]});                                                                         // 481
  match({a: {$size: 2}}, {a: [2, 2]});                                                                      // 482
  nomatch({a: {$size: 0}}, {a: [2]});                                                                       // 483
  nomatch({a: {$size: 1}}, {a: []});                                                                        // 484
  nomatch({a: {$size: 1}}, {a: [2, 2]});                                                                    // 485
  nomatch({a: {$size: 0}}, {a: "2"});                                                                       // 486
  nomatch({a: {$size: 1}}, {a: "2"});                                                                       // 487
  nomatch({a: {$size: 2}}, {a: "2"});                                                                       // 488
                                                                                                            // 489
  nomatch({a: {$size: 2}}, {a: [[2,2]]}); // tested against mongodb                                         // 490
                                                                                                            // 491
  // $type                                                                                                  // 492
  match({a: {$type: 1}}, {a: 1.1});                                                                         // 493
  match({a: {$type: 1}}, {a: 1});                                                                           // 494
  nomatch({a: {$type: 1}}, {a: "1"});                                                                       // 495
  match({a: {$type: 2}}, {a: "1"});                                                                         // 496
  nomatch({a: {$type: 2}}, {a: 1});                                                                         // 497
  match({a: {$type: 3}}, {a: {}});                                                                          // 498
  match({a: {$type: 3}}, {a: {b: 2}});                                                                      // 499
  nomatch({a: {$type: 3}}, {a: []});                                                                        // 500
  nomatch({a: {$type: 3}}, {a: [1]});                                                                       // 501
  nomatch({a: {$type: 3}}, {a: null});                                                                      // 502
  match({a: {$type: 5}}, {a: EJSON.newBinary(0)});                                                          // 503
  match({a: {$type: 5}}, {a: EJSON.newBinary(4)});                                                          // 504
  nomatch({a: {$type: 5}}, {a: []});                                                                        // 505
  nomatch({a: {$type: 5}}, {a: [42]});                                                                      // 506
  match({a: {$type: 7}}, {a: new LocalCollection._ObjectID()});                                             // 507
  nomatch({a: {$type: 7}}, {a: "1234567890abcd1234567890"});                                                // 508
  match({a: {$type: 8}}, {a: true});                                                                        // 509
  match({a: {$type: 8}}, {a: false});                                                                       // 510
  nomatch({a: {$type: 8}}, {a: "true"});                                                                    // 511
  nomatch({a: {$type: 8}}, {a: 0});                                                                         // 512
  nomatch({a: {$type: 8}}, {a: null});                                                                      // 513
  nomatch({a: {$type: 8}}, {a: ''});                                                                        // 514
  nomatch({a: {$type: 8}}, {});                                                                             // 515
  match({a: {$type: 9}}, {a: (new Date)});                                                                  // 516
  nomatch({a: {$type: 9}}, {a: +(new Date)});                                                               // 517
  match({a: {$type: 10}}, {a: null});                                                                       // 518
  nomatch({a: {$type: 10}}, {a: false});                                                                    // 519
  nomatch({a: {$type: 10}}, {a: ''});                                                                       // 520
  nomatch({a: {$type: 10}}, {a: 0});                                                                        // 521
  nomatch({a: {$type: 10}}, {});                                                                            // 522
  match({a: {$type: 11}}, {a: /x/});                                                                        // 523
  nomatch({a: {$type: 11}}, {a: 'x'});                                                                      // 524
  nomatch({a: {$type: 11}}, {});                                                                            // 525
                                                                                                            // 526
  nomatch({a: {$type: 4}}, {a: []});                                                                        // 527
  nomatch({a: {$type: 4}}, {a: [1]}); // tested against mongodb                                             // 528
  match({a: {$type: 1}}, {a: [1]});                                                                         // 529
  nomatch({a: {$type: 2}}, {a: [1]});                                                                       // 530
  match({a: {$type: 1}}, {a: ["1", 1]});                                                                    // 531
  match({a: {$type: 2}}, {a: ["1", 1]});                                                                    // 532
  nomatch({a: {$type: 3}}, {a: ["1", 1]});                                                                  // 533
  nomatch({a: {$type: 4}}, {a: ["1", 1]});                                                                  // 534
  nomatch({a: {$type: 1}}, {a: ["1", []]});                                                                 // 535
  match({a: {$type: 2}}, {a: ["1", []]});                                                                   // 536
  match({a: {$type: 4}}, {a: ["1", []]}); // tested against mongodb                                         // 537
                                                                                                            // 538
  // regular expressions                                                                                    // 539
  match({a: /a/}, {a: 'cat'});                                                                              // 540
  nomatch({a: /a/}, {a: 'cut'});                                                                            // 541
  nomatch({a: /a/}, {a: 'CAT'});                                                                            // 542
  match({a: /a/i}, {a: 'CAT'});                                                                             // 543
  match({a: /a/}, {a: ['foo', 'bar']});  // search within array...                                          // 544
  nomatch({a: /,/}, {a: ['foo', 'bar']});  // but not by stringifying                                       // 545
  match({a: {$regex: 'a'}}, {a: ['foo', 'bar']});                                                           // 546
  nomatch({a: {$regex: ','}}, {a: ['foo', 'bar']});                                                         // 547
  match({a: {$regex: /a/}}, {a: 'cat'});                                                                    // 548
  nomatch({a: {$regex: /a/}}, {a: 'cut'});                                                                  // 549
  nomatch({a: {$regex: /a/}}, {a: 'CAT'});                                                                  // 550
  match({a: {$regex: /a/i}}, {a: 'CAT'});                                                                   // 551
  match({a: {$regex: /a/, $options: 'i'}}, {a: 'CAT'}); // tested                                           // 552
  match({a: {$regex: /a/i, $options: 'i'}}, {a: 'CAT'}); // tested                                          // 553
  nomatch({a: {$regex: /a/i, $options: ''}}, {a: 'CAT'}); // tested                                         // 554
  match({a: {$regex: 'a'}}, {a: 'cat'});                                                                    // 555
  nomatch({a: {$regex: 'a'}}, {a: 'cut'});                                                                  // 556
  nomatch({a: {$regex: 'a'}}, {a: 'CAT'});                                                                  // 557
  match({a: {$regex: 'a', $options: 'i'}}, {a: 'CAT'});                                                     // 558
  nomatch({a: /undefined/}, {});                                                                            // 559
  nomatch({a: {$regex: 'undefined'}}, {});                                                                  // 560
  nomatch({a: /xxx/}, {});                                                                                  // 561
  nomatch({a: {$regex: 'xxx'}}, {});                                                                        // 562
                                                                                                            // 563
  match({a: {$options: 'i'}}, {a: 12});                                                                     // 564
  match({b: {$options: 'i'}}, {a: 12});                                                                     // 565
                                                                                                            // 566
  match({a: /a/}, {a: ['dog', 'cat']});                                                                     // 567
  nomatch({a: /a/}, {a: ['dog', 'puppy']});                                                                 // 568
                                                                                                            // 569
  test.throws(function () {                                                                                 // 570
    match({a: {$regex: /a/, $options: 'x'}}, {a: 'cat'});                                                   // 571
  });                                                                                                       // 572
  test.throws(function () {                                                                                 // 573
    match({a: {$regex: /a/, $options: 's'}}, {a: 'cat'});                                                   // 574
  });                                                                                                       // 575
                                                                                                            // 576
  // $not                                                                                                   // 577
  match({x: {$not: {$gt: 7}}}, {x: 6});                                                                     // 578
  nomatch({x: {$not: {$gt: 7}}}, {x: 8});                                                                   // 579
  match({x: {$not: {$lt: 10, $gt: 7}}}, {x: 11});                                                           // 580
  nomatch({x: {$not: {$lt: 10, $gt: 7}}}, {x: 9});                                                          // 581
  match({x: {$not: {$lt: 10, $gt: 7}}}, {x: 6});                                                            // 582
                                                                                                            // 583
  match({x: {$not: {$gt: 7}}}, {x: [2, 3, 4]});                                                             // 584
  match({'x.y': {$not: {$gt: 7}}}, {x: [{y:2}, {y:3}, {y:4}]});                                             // 585
  nomatch({x: {$not: {$gt: 7}}}, {x: [2, 3, 4, 10]});                                                       // 586
  nomatch({'x.y': {$not: {$gt: 7}}}, {x: [{y:2}, {y:3}, {y:4}, {y:10}]});                                   // 587
                                                                                                            // 588
  match({x: {$not: /a/}}, {x: "dog"});                                                                      // 589
  nomatch({x: {$not: /a/}}, {x: "cat"});                                                                    // 590
  match({x: {$not: /a/}}, {x: ["dog", "puppy"]});                                                           // 591
  nomatch({x: {$not: /a/}}, {x: ["kitten", "cat"]});                                                        // 592
                                                                                                            // 593
  // dotted keypaths: bare values                                                                           // 594
  match({"a.b": 1}, {a: {b: 1}});                                                                           // 595
  nomatch({"a.b": 1}, {a: {b: 2}});                                                                         // 596
  match({"a.b": [1,2,3]}, {a: {b: [1,2,3]}});                                                               // 597
  nomatch({"a.b": [1,2,3]}, {a: {b: [4]}});                                                                 // 598
  match({"a.b": /a/}, {a: {b: "cat"}});                                                                     // 599
  nomatch({"a.b": /a/}, {a: {b: "dog"}});                                                                   // 600
  match({"a.b.c": null}, {});                                                                               // 601
  match({"a.b.c": null}, {a: 1});                                                                           // 602
  match({"a.b.c": null}, {a: {b: 4}});                                                                      // 603
                                                                                                            // 604
  // trying to access a dotted field that is undefined at some point                                        // 605
  // down the chain                                                                                         // 606
  nomatch({"a.b": 1}, {x: 2});                                                                              // 607
  nomatch({"a.b.c": 1}, {a: {x: 2}});                                                                       // 608
  nomatch({"a.b.c": 1}, {a: {b: {x: 2}}});                                                                  // 609
  nomatch({"a.b.c": 1}, {a: {b: 1}});                                                                       // 610
  nomatch({"a.b.c": 1}, {a: {b: 0}});                                                                       // 611
                                                                                                            // 612
  // dotted keypaths: literal objects                                                                       // 613
  match({"a.b": {c: 1}}, {a: {b: {c: 1}}});                                                                 // 614
  nomatch({"a.b": {c: 1}}, {a: {b: {c: 2}}});                                                               // 615
  nomatch({"a.b": {c: 1}}, {a: {b: 2}});                                                                    // 616
  match({"a.b": {c: 1, d: 2}}, {a: {b: {c: 1, d: 2}}});                                                     // 617
  nomatch({"a.b": {c: 1, d: 2}}, {a: {b: {c: 1, d: 1}}});                                                   // 618
  nomatch({"a.b": {c: 1, d: 2}}, {a: {b: {d: 2}}});                                                         // 619
                                                                                                            // 620
  // dotted keypaths: $ operators                                                                           // 621
  match({"a.b": {$in: [1, 2, 3]}}, {a: {b: [2]}}); // tested against mongodb                                // 622
  match({"a.b": {$in: [{x: 1}, {x: 2}, {x: 3}]}}, {a: {b: [{x: 2}]}});                                      // 623
  match({"a.b": {$in: [1, 2, 3]}}, {a: {b: [4, 2]}});                                                       // 624
  nomatch({"a.b": {$in: [1, 2, 3]}}, {a: {b: [4]}});                                                        // 625
                                                                                                            // 626
  // $or                                                                                                    // 627
  test.throws(function () {                                                                                 // 628
    match({$or: []}, {});                                                                                   // 629
  });                                                                                                       // 630
  test.throws(function () {                                                                                 // 631
    match({$or: []}, {a: 1});                                                                               // 632
  });                                                                                                       // 633
  match({$or: [{a: 1}]}, {a: 1});                                                                           // 634
  nomatch({$or: [{b: 2}]}, {a: 1});                                                                         // 635
  match({$or: [{a: 1}, {b: 2}]}, {a: 1});                                                                   // 636
  nomatch({$or: [{c: 3}, {d: 4}]}, {a: 1});                                                                 // 637
  match({$or: [{a: 1}, {b: 2}]}, {a: [1, 2, 3]});                                                           // 638
  nomatch({$or: [{a: 1}, {b: 2}]}, {c: [1, 2, 3]});                                                         // 639
  nomatch({$or: [{a: 1}, {b: 2}]}, {a: [2, 3, 4]});                                                         // 640
  match({$or: [{a: 1}, {a: 2}]}, {a: 1});                                                                   // 641
  match({$or: [{a: 1}, {a: 2}], b: 2}, {a: 1, b: 2});                                                       // 642
  nomatch({$or: [{a: 2}, {a: 3}], b: 2}, {a: 1, b: 2});                                                     // 643
  nomatch({$or: [{a: 1}, {a: 2}], b: 3}, {a: 1, b: 2});                                                     // 644
                                                                                                            // 645
  // $or and $lt, $lte, $gt, $gte                                                                           // 646
  match({$or: [{a: {$lte: 1}}, {a: 2}]}, {a: 1});                                                           // 647
  nomatch({$or: [{a: {$lt: 1}}, {a: 2}]}, {a: 1});                                                          // 648
  match({$or: [{a: {$gte: 1}}, {a: 2}]}, {a: 1});                                                           // 649
  nomatch({$or: [{a: {$gt: 1}}, {a: 2}]}, {a: 1});                                                          // 650
  match({$or: [{b: {$gt: 1}}, {b: {$lt: 3}}]}, {b: 2});                                                     // 651
  nomatch({$or: [{b: {$lt: 1}}, {b: {$gt: 3}}]}, {b: 2});                                                   // 652
                                                                                                            // 653
  // $or and $in                                                                                            // 654
  match({$or: [{a: {$in: [1, 2, 3]}}]}, {a: 1});                                                            // 655
  nomatch({$or: [{a: {$in: [4, 5, 6]}}]}, {a: 1});                                                          // 656
  match({$or: [{a: {$in: [1, 2, 3]}}, {b: 2}]}, {a: 1});                                                    // 657
  match({$or: [{a: {$in: [1, 2, 3]}}, {b: 2}]}, {b: 2});                                                    // 658
  nomatch({$or: [{a: {$in: [1, 2, 3]}}, {b: 2}]}, {c: 3});                                                  // 659
  match({$or: [{a: {$in: [1, 2, 3]}}, {b: {$in: [1, 2, 3]}}]}, {b: 2});                                     // 660
  nomatch({$or: [{a: {$in: [1, 2, 3]}}, {b: {$in: [4, 5, 6]}}]}, {b: 2});                                   // 661
                                                                                                            // 662
  // $or and $nin                                                                                           // 663
  nomatch({$or: [{a: {$nin: [1, 2, 3]}}]}, {a: 1});                                                         // 664
  match({$or: [{a: {$nin: [4, 5, 6]}}]}, {a: 1});                                                           // 665
  nomatch({$or: [{a: {$nin: [1, 2, 3]}}, {b: 2}]}, {a: 1});                                                 // 666
  match({$or: [{a: {$nin: [1, 2, 3]}}, {b: 2}]}, {b: 2});                                                   // 667
  match({$or: [{a: {$nin: [1, 2, 3]}}, {b: 2}]}, {c: 3});                                                   // 668
  match({$or: [{a: {$nin: [1, 2, 3]}}, {b: {$nin: [1, 2, 3]}}]}, {b: 2});                                   // 669
  nomatch({$or: [{a: {$nin: [1, 2, 3]}}, {b: {$nin: [1, 2, 3]}}]}, {a: 1, b: 2});                           // 670
  match({$or: [{a: {$nin: [1, 2, 3]}}, {b: {$nin: [4, 5, 6]}}]}, {b: 2});                                   // 671
                                                                                                            // 672
  // $or and dot-notation                                                                                   // 673
  match({$or: [{"a.b": 1}, {"a.b": 2}]}, {a: {b: 1}});                                                      // 674
  match({$or: [{"a.b": 1}, {"a.c": 1}]}, {a: {b: 1}});                                                      // 675
  nomatch({$or: [{"a.b": 2}, {"a.c": 1}]}, {a: {b: 1}});                                                    // 676
                                                                                                            // 677
  // $or and nested objects                                                                                 // 678
  match({$or: [{a: {b: 1, c: 2}}, {a: {b: 2, c: 1}}]}, {a: {b: 1, c: 2}});                                  // 679
  nomatch({$or: [{a: {b: 1, c: 3}}, {a: {b: 2, c: 1}}]}, {a: {b: 1, c: 2}});                                // 680
                                                                                                            // 681
  // $or and regexes                                                                                        // 682
  match({$or: [{a: /a/}]}, {a: "cat"});                                                                     // 683
  nomatch({$or: [{a: /o/}]}, {a: "cat"});                                                                   // 684
  match({$or: [{a: /a/}, {a: /o/}]}, {a: "cat"});                                                           // 685
  nomatch({$or: [{a: /i/}, {a: /o/}]}, {a: "cat"});                                                         // 686
  match({$or: [{a: /i/}, {b: /o/}]}, {a: "cat", b: "dog"});                                                 // 687
                                                                                                            // 688
  // $or and $ne                                                                                            // 689
  match({$or: [{a: {$ne: 1}}]}, {});                                                                        // 690
  nomatch({$or: [{a: {$ne: 1}}]}, {a: 1});                                                                  // 691
  match({$or: [{a: {$ne: 1}}]}, {a: 2});                                                                    // 692
  match({$or: [{a: {$ne: 1}}]}, {b: 1});                                                                    // 693
  match({$or: [{a: {$ne: 1}}, {a: {$ne: 2}}]}, {a: 1});                                                     // 694
  match({$or: [{a: {$ne: 1}}, {b: {$ne: 1}}]}, {a: 1});                                                     // 695
  nomatch({$or: [{a: {$ne: 1}}, {b: {$ne: 2}}]}, {a: 1, b: 2});                                             // 696
                                                                                                            // 697
  // $or and $not                                                                                           // 698
  match({$or: [{a: {$not: {$mod: [10, 1]}}}]}, {});                                                         // 699
  nomatch({$or: [{a: {$not: {$mod: [10, 1]}}}]}, {a: 1});                                                   // 700
  match({$or: [{a: {$not: {$mod: [10, 1]}}}]}, {a: 2});                                                     // 701
  match({$or: [{a: {$not: {$mod: [10, 1]}}}, {a: {$not: {$mod: [10, 2]}}}]}, {a: 1});                       // 702
  nomatch({$or: [{a: {$not: {$mod: [10, 1]}}}, {a: {$mod: [10, 2]}}]}, {a: 1});                             // 703
  match({$or: [{a: {$not: {$mod: [10, 1]}}}, {a: {$mod: [10, 2]}}]}, {a: 2});                               // 704
  match({$or: [{a: {$not: {$mod: [10, 1]}}}, {a: {$mod: [10, 2]}}]}, {a: 3});                               // 705
  // this is possibly an open-ended task, so we stop here ...                                               // 706
                                                                                                            // 707
  // $nor                                                                                                   // 708
  test.throws(function () {                                                                                 // 709
    match({$nor: []}, {});                                                                                  // 710
  });                                                                                                       // 711
  test.throws(function () {                                                                                 // 712
    match({$nor: []}, {a: 1});                                                                              // 713
  });                                                                                                       // 714
  nomatch({$nor: [{a: 1}]}, {a: 1});                                                                        // 715
  match({$nor: [{b: 2}]}, {a: 1});                                                                          // 716
  nomatch({$nor: [{a: 1}, {b: 2}]}, {a: 1});                                                                // 717
  match({$nor: [{c: 3}, {d: 4}]}, {a: 1});                                                                  // 718
  nomatch({$nor: [{a: 1}, {b: 2}]}, {a: [1, 2, 3]});                                                        // 719
  match({$nor: [{a: 1}, {b: 2}]}, {c: [1, 2, 3]});                                                          // 720
  match({$nor: [{a: 1}, {b: 2}]}, {a: [2, 3, 4]});                                                          // 721
  nomatch({$nor: [{a: 1}, {a: 2}]}, {a: 1});                                                                // 722
                                                                                                            // 723
  // $nor and $lt, $lte, $gt, $gte                                                                          // 724
  nomatch({$nor: [{a: {$lte: 1}}, {a: 2}]}, {a: 1});                                                        // 725
  match({$nor: [{a: {$lt: 1}}, {a: 2}]}, {a: 1});                                                           // 726
  nomatch({$nor: [{a: {$gte: 1}}, {a: 2}]}, {a: 1});                                                        // 727
  match({$nor: [{a: {$gt: 1}}, {a: 2}]}, {a: 1});                                                           // 728
  nomatch({$nor: [{b: {$gt: 1}}, {b: {$lt: 3}}]}, {b: 2});                                                  // 729
  match({$nor: [{b: {$lt: 1}}, {b: {$gt: 3}}]}, {b: 2});                                                    // 730
                                                                                                            // 731
  // $nor and $in                                                                                           // 732
  nomatch({$nor: [{a: {$in: [1, 2, 3]}}]}, {a: 1});                                                         // 733
  match({$nor: [{a: {$in: [4, 5, 6]}}]}, {a: 1});                                                           // 734
  nomatch({$nor: [{a: {$in: [1, 2, 3]}}, {b: 2}]}, {a: 1});                                                 // 735
  nomatch({$nor: [{a: {$in: [1, 2, 3]}}, {b: 2}]}, {b: 2});                                                 // 736
  match({$nor: [{a: {$in: [1, 2, 3]}}, {b: 2}]}, {c: 3});                                                   // 737
  nomatch({$nor: [{a: {$in: [1, 2, 3]}}, {b: {$in: [1, 2, 3]}}]}, {b: 2});                                  // 738
  match({$nor: [{a: {$in: [1, 2, 3]}}, {b: {$in: [4, 5, 6]}}]}, {b: 2});                                    // 739
                                                                                                            // 740
  // $nor and $nin                                                                                          // 741
  match({$nor: [{a: {$nin: [1, 2, 3]}}]}, {a: 1});                                                          // 742
  nomatch({$nor: [{a: {$nin: [4, 5, 6]}}]}, {a: 1});                                                        // 743
  match({$nor: [{a: {$nin: [1, 2, 3]}}, {b: 2}]}, {a: 1});                                                  // 744
  nomatch({$nor: [{a: {$nin: [1, 2, 3]}}, {b: 2}]}, {b: 2});                                                // 745
  nomatch({$nor: [{a: {$nin: [1, 2, 3]}}, {b: 2}]}, {c: 3});                                                // 746
  nomatch({$nor: [{a: {$nin: [1, 2, 3]}}, {b: {$nin: [1, 2, 3]}}]}, {b: 2});                                // 747
  match({$nor: [{a: {$nin: [1, 2, 3]}}, {b: {$nin: [1, 2, 3]}}]}, {a: 1, b: 2});                            // 748
  nomatch({$nor: [{a: {$nin: [1, 2, 3]}}, {b: {$nin: [4, 5, 6]}}]}, {b: 2});                                // 749
                                                                                                            // 750
  // $nor and dot-notation                                                                                  // 751
  nomatch({$nor: [{"a.b": 1}, {"a.b": 2}]}, {a: {b: 1}});                                                   // 752
  nomatch({$nor: [{"a.b": 1}, {"a.c": 1}]}, {a: {b: 1}});                                                   // 753
  match({$nor: [{"a.b": 2}, {"a.c": 1}]}, {a: {b: 1}});                                                     // 754
                                                                                                            // 755
  // $nor and nested objects                                                                                // 756
  nomatch({$nor: [{a: {b: 1, c: 2}}, {a: {b: 2, c: 1}}]}, {a: {b: 1, c: 2}});                               // 757
  match({$nor: [{a: {b: 1, c: 3}}, {a: {b: 2, c: 1}}]}, {a: {b: 1, c: 2}});                                 // 758
                                                                                                            // 759
  // $nor and regexes                                                                                       // 760
  nomatch({$nor: [{a: /a/}]}, {a: "cat"});                                                                  // 761
  match({$nor: [{a: /o/}]}, {a: "cat"});                                                                    // 762
  nomatch({$nor: [{a: /a/}, {a: /o/}]}, {a: "cat"});                                                        // 763
  match({$nor: [{a: /i/}, {a: /o/}]}, {a: "cat"});                                                          // 764
  nomatch({$nor: [{a: /i/}, {b: /o/}]}, {a: "cat", b: "dog"});                                              // 765
                                                                                                            // 766
  // $nor and $ne                                                                                           // 767
  nomatch({$nor: [{a: {$ne: 1}}]}, {});                                                                     // 768
  match({$nor: [{a: {$ne: 1}}]}, {a: 1});                                                                   // 769
  nomatch({$nor: [{a: {$ne: 1}}]}, {a: 2});                                                                 // 770
  nomatch({$nor: [{a: {$ne: 1}}]}, {b: 1});                                                                 // 771
  nomatch({$nor: [{a: {$ne: 1}}, {a: {$ne: 2}}]}, {a: 1});                                                  // 772
  nomatch({$nor: [{a: {$ne: 1}}, {b: {$ne: 1}}]}, {a: 1});                                                  // 773
  match({$nor: [{a: {$ne: 1}}, {b: {$ne: 2}}]}, {a: 1, b: 2});                                              // 774
                                                                                                            // 775
  // $nor and $not                                                                                          // 776
  nomatch({$nor: [{a: {$not: {$mod: [10, 1]}}}]}, {});                                                      // 777
  match({$nor: [{a: {$not: {$mod: [10, 1]}}}]}, {a: 1});                                                    // 778
  nomatch({$nor: [{a: {$not: {$mod: [10, 1]}}}]}, {a: 2});                                                  // 779
  nomatch({$nor: [{a: {$not: {$mod: [10, 1]}}}, {a: {$not: {$mod: [10, 2]}}}]}, {a: 1});                    // 780
  match({$nor: [{a: {$not: {$mod: [10, 1]}}}, {a: {$mod: [10, 2]}}]}, {a: 1});                              // 781
  nomatch({$nor: [{a: {$not: {$mod: [10, 1]}}}, {a: {$mod: [10, 2]}}]}, {a: 2});                            // 782
  nomatch({$nor: [{a: {$not: {$mod: [10, 1]}}}, {a: {$mod: [10, 2]}}]}, {a: 3});                            // 783
                                                                                                            // 784
  // $and                                                                                                   // 785
                                                                                                            // 786
  test.throws(function () {                                                                                 // 787
    match({$and: []}, {});                                                                                  // 788
  });                                                                                                       // 789
  test.throws(function () {                                                                                 // 790
    match({$and: []}, {a: 1});                                                                              // 791
  });                                                                                                       // 792
  match({$and: [{a: 1}]}, {a: 1});                                                                          // 793
  nomatch({$and: [{a: 1}, {a: 2}]}, {a: 1});                                                                // 794
  nomatch({$and: [{a: 1}, {b: 1}]}, {a: 1});                                                                // 795
  match({$and: [{a: 1}, {b: 2}]}, {a: 1, b: 2});                                                            // 796
  nomatch({$and: [{a: 1}, {b: 1}]}, {a: 1, b: 2});                                                          // 797
  match({$and: [{a: 1}, {b: 2}], c: 3}, {a: 1, b: 2, c: 3});                                                // 798
  nomatch({$and: [{a: 1}, {b: 2}], c: 4}, {a: 1, b: 2, c: 3});                                              // 799
                                                                                                            // 800
  // $and and regexes                                                                                       // 801
  match({$and: [{a: /a/}]}, {a: "cat"});                                                                    // 802
  match({$and: [{a: /a/i}]}, {a: "CAT"});                                                                   // 803
  nomatch({$and: [{a: /o/}]}, {a: "cat"});                                                                  // 804
  nomatch({$and: [{a: /a/}, {a: /o/}]}, {a: "cat"});                                                        // 805
  match({$and: [{a: /a/}, {b: /o/}]}, {a: "cat", b: "dog"});                                                // 806
  nomatch({$and: [{a: /a/}, {b: /a/}]}, {a: "cat", b: "dog"});                                              // 807
                                                                                                            // 808
  // $and, dot-notation, and nested objects                                                                 // 809
  match({$and: [{"a.b": 1}]}, {a: {b: 1}});                                                                 // 810
  match({$and: [{a: {b: 1}}]}, {a: {b: 1}});                                                                // 811
  nomatch({$and: [{"a.b": 2}]}, {a: {b: 1}});                                                               // 812
  nomatch({$and: [{"a.c": 1}]}, {a: {b: 1}});                                                               // 813
  nomatch({$and: [{"a.b": 1}, {"a.b": 2}]}, {a: {b: 1}});                                                   // 814
  nomatch({$and: [{"a.b": 1}, {a: {b: 2}}]}, {a: {b: 1}});                                                  // 815
  match({$and: [{"a.b": 1}, {"c.d": 2}]}, {a: {b: 1}, c: {d: 2}});                                          // 816
  nomatch({$and: [{"a.b": 1}, {"c.d": 1}]}, {a: {b: 1}, c: {d: 2}});                                        // 817
  match({$and: [{"a.b": 1}, {c: {d: 2}}]}, {a: {b: 1}, c: {d: 2}});                                         // 818
  nomatch({$and: [{"a.b": 1}, {c: {d: 1}}]}, {a: {b: 1}, c: {d: 2}});                                       // 819
  nomatch({$and: [{"a.b": 2}, {c: {d: 2}}]}, {a: {b: 1}, c: {d: 2}});                                       // 820
  match({$and: [{a: {b: 1}}, {c: {d: 2}}]}, {a: {b: 1}, c: {d: 2}});                                        // 821
  nomatch({$and: [{a: {b: 2}}, {c: {d: 2}}]}, {a: {b: 1}, c: {d: 2}});                                      // 822
                                                                                                            // 823
  // $and and $in                                                                                           // 824
  nomatch({$and: [{a: {$in: []}}]}, {});                                                                    // 825
  match({$and: [{a: {$in: [1, 2, 3]}}]}, {a: 1});                                                           // 826
  nomatch({$and: [{a: {$in: [4, 5, 6]}}]}, {a: 1});                                                         // 827
  nomatch({$and: [{a: {$in: [1, 2, 3]}}, {a: {$in: [4, 5, 6]}}]}, {a: 1});                                  // 828
  nomatch({$and: [{a: {$in: [1, 2, 3]}}, {b: {$in: [1, 2, 3]}}]}, {a: 1, b: 4});                            // 829
  match({$and: [{a: {$in: [1, 2, 3]}}, {b: {$in: [4, 5, 6]}}]}, {a: 1, b: 4});                              // 830
                                                                                                            // 831
                                                                                                            // 832
  // $and and $nin                                                                                          // 833
  match({$and: [{a: {$nin: []}}]}, {});                                                                     // 834
  nomatch({$and: [{a: {$nin: [1, 2, 3]}}]}, {a: 1});                                                        // 835
  match({$and: [{a: {$nin: [4, 5, 6]}}]}, {a: 1});                                                          // 836
  nomatch({$and: [{a: {$nin: [1, 2, 3]}}, {a: {$nin: [4, 5, 6]}}]}, {a: 1});                                // 837
  nomatch({$and: [{a: {$nin: [1, 2, 3]}}, {b: {$nin: [1, 2, 3]}}]}, {a: 1, b: 4});                          // 838
  nomatch({$and: [{a: {$nin: [1, 2, 3]}}, {b: {$nin: [4, 5, 6]}}]}, {a: 1, b: 4});                          // 839
                                                                                                            // 840
  // $and and $lt, $lte, $gt, $gte                                                                          // 841
  match({$and: [{a: {$lt: 2}}]}, {a: 1});                                                                   // 842
  nomatch({$and: [{a: {$lt: 1}}]}, {a: 1});                                                                 // 843
  match({$and: [{a: {$lte: 1}}]}, {a: 1});                                                                  // 844
  match({$and: [{a: {$gt: 0}}]}, {a: 1});                                                                   // 845
  nomatch({$and: [{a: {$gt: 1}}]}, {a: 1});                                                                 // 846
  match({$and: [{a: {$gte: 1}}]}, {a: 1});                                                                  // 847
  match({$and: [{a: {$gt: 0}}, {a: {$lt: 2}}]}, {a: 1});                                                    // 848
  nomatch({$and: [{a: {$gt: 1}}, {a: {$lt: 2}}]}, {a: 1});                                                  // 849
  nomatch({$and: [{a: {$gt: 0}}, {a: {$lt: 1}}]}, {a: 1});                                                  // 850
  match({$and: [{a: {$gte: 1}}, {a: {$lte: 1}}]}, {a: 1});                                                  // 851
  nomatch({$and: [{a: {$gte: 2}}, {a: {$lte: 0}}]}, {a: 1});                                                // 852
                                                                                                            // 853
  // $and and $ne                                                                                           // 854
  match({$and: [{a: {$ne: 1}}]}, {});                                                                       // 855
  nomatch({$and: [{a: {$ne: 1}}]}, {a: 1});                                                                 // 856
  match({$and: [{a: {$ne: 1}}]}, {a: 2});                                                                   // 857
  nomatch({$and: [{a: {$ne: 1}}, {a: {$ne: 2}}]}, {a: 2});                                                  // 858
  match({$and: [{a: {$ne: 1}}, {a: {$ne: 3}}]}, {a: 2});                                                    // 859
                                                                                                            // 860
  // $and and $not                                                                                          // 861
  match({$and: [{a: {$not: {$gt: 2}}}]}, {a: 1});                                                           // 862
  nomatch({$and: [{a: {$not: {$lt: 2}}}]}, {a: 1});                                                         // 863
  match({$and: [{a: {$not: {$lt: 0}}}, {a: {$not: {$gt: 2}}}]}, {a: 1});                                    // 864
  nomatch({$and: [{a: {$not: {$lt: 2}}}, {a: {$not: {$gt: 0}}}]}, {a: 1});                                  // 865
                                                                                                            // 866
  // $where                                                                                                 // 867
  match({$where: "this.a === 1"}, {a: 1});                                                                  // 868
  nomatch({$where: "this.a !== 1"}, {a: 1});                                                                // 869
  nomatch({$where: "this.a === 1", a: 2}, {a: 1});                                                          // 870
  match({$where: "this.a === 1", b: 2}, {a: 1, b: 2});                                                      // 871
  match({$where: "this.a === 1 && this.b === 2"}, {a: 1, b: 2});                                            // 872
  match({$where: "this.a instanceof Array"}, {a: []});                                                      // 873
  nomatch({$where: "this.a instanceof Array"}, {a: 1});                                                     // 874
                                                                                                            // 875
  // reaching into array                                                                                    // 876
  match({"dogs.0.name": "Fido"}, {dogs: [{name: "Fido"}, {name: "Rex"}]});                                  // 877
  match({"dogs.1.name": "Rex"}, {dogs: [{name: "Fido"}, {name: "Rex"}]});                                   // 878
  nomatch({"dogs.1.name": "Fido"}, {dogs: [{name: "Fido"}, {name: "Rex"}]});                                // 879
  match({"room.1b": "bla"}, {room: {"1b": "bla"}});                                                         // 880
                                                                                                            // 881
  match({"dogs.name": "Fido"}, {dogs: [{name: "Fido"}, {name: "Rex"}]});                                    // 882
  match({"dogs.name": "Rex"}, {dogs: [{name: "Fido"}, {name: "Rex"}]});                                     // 883
  match({"animals.dogs.name": "Fido"},                                                                      // 884
        {animals: [{dogs: [{name: "Rover"}]},                                                               // 885
                   {},                                                                                      // 886
                   {dogs: [{name: "Fido"}, {name: "Rex"}]}]});                                              // 887
  match({"animals.dogs.name": "Fido"},                                                                      // 888
        {animals: [{dogs: {name: "Rex"}},                                                                   // 889
                   {dogs: {name: "Fido"}}]});                                                               // 890
  match({"animals.dogs.name": "Fido"},                                                                      // 891
        {animals: [{dogs: [{name: "Rover"}]},                                                               // 892
                   {},                                                                                      // 893
                   {dogs: [{name: ["Fido"]}, {name: "Rex"}]}]});                                            // 894
  nomatch({"dogs.name": "Fido"}, {dogs: []});                                                               // 895
                                                                                                            // 896
  // $elemMatch                                                                                             // 897
  match({dogs: {$elemMatch: {name: /e/}}},                                                                  // 898
        {dogs: [{name: "Fido"}, {name: "Rex"}]});                                                           // 899
  nomatch({dogs: {$elemMatch: {name: /a/}}},                                                                // 900
          {dogs: [{name: "Fido"}, {name: "Rex"}]});                                                         // 901
  match({dogs: {$elemMatch: {age: {$gt: 4}}}},                                                              // 902
        {dogs: [{name: "Fido", age: 5}, {name: "Rex", age: 3}]});                                           // 903
  match({dogs: {$elemMatch: {name: "Fido", age: {$gt: 4}}}},                                                // 904
        {dogs: [{name: "Fido", age: 5}, {name: "Rex", age: 3}]});                                           // 905
  nomatch({dogs: {$elemMatch: {name: "Fido", age: {$gt: 5}}}},                                              // 906
          {dogs: [{name: "Fido", age: 5}, {name: "Rex", age: 3}]});                                         // 907
  match({dogs: {$elemMatch: {name: /i/, age: {$gt: 4}}}},                                                   // 908
        {dogs: [{name: "Fido", age: 5}, {name: "Rex", age: 3}]});                                           // 909
  nomatch({dogs: {$elemMatch: {name: /e/, age: 5}}},                                                        // 910
          {dogs: [{name: "Fido", age: 5}, {name: "Rex", age: 3}]});                                         // 911
                                                                                                            // 912
  // XXX still needs tests:                                                                                 // 913
  // - non-scalar arguments to $gt, $lt, etc                                                                // 914
});                                                                                                         // 915
                                                                                                            // 916
Tinytest.add("minimongo - projection_compiler", function (test) {                                           // 917
  var testProjection = function (projection, tests) {                                                       // 918
    var projection_f = LocalCollection._compileProjection(projection);                                      // 919
    var equalNonStrict = function (a, b, desc) {                                                            // 920
      test.isTrue(_.isEqual(a, b), desc);                                                                   // 921
    };                                                                                                      // 922
                                                                                                            // 923
    _.each(tests, function (testCase) {                                                                     // 924
      equalNonStrict(projection_f(testCase[0]), testCase[1], testCase[2]);                                  // 925
    });                                                                                                     // 926
  };                                                                                                        // 927
                                                                                                            // 928
  testProjection({ 'foo': 1, 'bar': 1 }, [                                                                  // 929
    [{ foo: 42, bar: "something", baz: "else" },                                                            // 930
     { foo: 42, bar: "something" },                                                                         // 931
     "simplest - whitelist"],                                                                               // 932
                                                                                                            // 933
    [{ foo: { nested: 17 }, baz: {} },                                                                      // 934
     { foo: { nested: 17 } },                                                                               // 935
     "nested whitelisted field"],                                                                           // 936
                                                                                                            // 937
    [{ _id: "uid", bazbaz: 42 },                                                                            // 938
     { _id: "uid" },                                                                                        // 939
     "simplest whitelist - preserve _id"]                                                                   // 940
  ]);                                                                                                       // 941
                                                                                                            // 942
  testProjection({ 'foo': 0, 'bar': 0 }, [                                                                  // 943
    [{ foo: 42, bar: "something", baz: "else" },                                                            // 944
     { baz: "else" },                                                                                       // 945
     "simplest - blacklist"],                                                                               // 946
                                                                                                            // 947
    [{ foo: { nested: 17 }, baz: { foo: "something" } },                                                    // 948
     { baz: { foo: "something" } },                                                                         // 949
     "nested blacklisted field"],                                                                           // 950
                                                                                                            // 951
    [{ _id: "uid", bazbaz: 42 },                                                                            // 952
     { _id: "uid", bazbaz: 42 },                                                                            // 953
     "simplest blacklist - preserve _id"]                                                                   // 954
  ]);                                                                                                       // 955
                                                                                                            // 956
  testProjection({ _id: 0, foo: 1 }, [                                                                      // 957
    [{ foo: 42, bar: 33, _id: "uid" },                                                                      // 958
     { foo: 42 },                                                                                           // 959
     "whitelist - _id blacklisted"]                                                                         // 960
  ]);                                                                                                       // 961
                                                                                                            // 962
  testProjection({ _id: 0, foo: 0 }, [                                                                      // 963
    [{ foo: 42, bar: 33, _id: "uid" },                                                                      // 964
     { bar: 33 },                                                                                           // 965
     "blacklist - _id blacklisted"]                                                                         // 966
  ]);                                                                                                       // 967
                                                                                                            // 968
  testProjection({ 'foo.bar.baz': 1 }, [                                                                    // 969
    [{ foo: { meh: "fur", bar: { baz: 42 }, tr: 1 }, bar: 33, baz: 'trolololo' },                           // 970
     { foo: { bar: { baz: 42 } } },                                                                         // 971
     "whitelist nested"],                                                                                   // 972
                                                                                                            // 973
    // Behavior of this test is looked up in actual mongo                                                   // 974
    [{ foo: { meh: "fur", bar: "nope", tr: 1 }, bar: 33, baz: 'trolololo' },                                // 975
     { foo: {} },                                                                                           // 976
     "whitelist nested - path not found in doc, different type"],                                           // 977
                                                                                                            // 978
    // Behavior of this test is looked up in actual mongo                                                   // 979
    [{ foo: { meh: "fur", bar: [], tr: 1 }, bar: 33, baz: 'trolololo' },                                    // 980
     { foo: { bar: [] } },                                                                                  // 981
     "whitelist nested - path not found in doc"]                                                            // 982
  ]);                                                                                                       // 983
                                                                                                            // 984
  testProjection({ 'hope.humanity': 0, 'hope.people': 0 }, [                                                // 985
    [{ hope: { humanity: "lost", people: 'broken', candies: 'long live!' } },                               // 986
     { hope: { candies: 'long live!' } },                                                                   // 987
     "blacklist nested"],                                                                                   // 988
                                                                                                            // 989
    [{ hope: "new" },                                                                                       // 990
     { hope: "new" },                                                                                       // 991
     "blacklist nested - path not found in doc"]                                                            // 992
  ]);                                                                                                       // 993
                                                                                                            // 994
  testProjection({ _id: 1 }, [                                                                              // 995
    [{ _id: 42, x: 1, y: { z: "2" } },                                                                      // 996
     { _id: 42 },                                                                                           // 997
     "_id whitelisted"],                                                                                    // 998
    [{ _id: 33 },                                                                                           // 999
     { _id: 33 },                                                                                           // 1000
     "_id whitelisted, _id only"],                                                                          // 1001
    [{ x: 1 },                                                                                              // 1002
     {},                                                                                                    // 1003
     "_id whitelisted, no _id"]                                                                             // 1004
  ]);                                                                                                       // 1005
                                                                                                            // 1006
  testProjection({ _id: 0 }, [                                                                              // 1007
    [{ _id: 42, x: 1, y: { z: "2" } },                                                                      // 1008
     { x: 1, y: { z: "2" } },                                                                               // 1009
     "_id blacklisted"],                                                                                    // 1010
    [{ _id: 33 },                                                                                           // 1011
     {},                                                                                                    // 1012
     "_id blacklisted, _id only"],                                                                          // 1013
    [{ x: 1 },                                                                                              // 1014
     { x: 1 },                                                                                              // 1015
     "_id blacklisted, no _id"]                                                                             // 1016
  ]);                                                                                                       // 1017
                                                                                                            // 1018
  testProjection({}, [                                                                                      // 1019
    [{ a: 1, b: 2, c: "3" },                                                                                // 1020
     { a: 1, b: 2, c: "3" },                                                                                // 1021
     "empty projection"]                                                                                    // 1022
  ]);                                                                                                       // 1023
                                                                                                            // 1024
  test.throws(function () {                                                                                 // 1025
    testProjection({ 'inc': 1, 'excl': 0 }, [                                                               // 1026
      [ { inc: 42, excl: 42 }, { inc: 42 }, "Can't combine incl/excl rules" ]                               // 1027
    ]);                                                                                                     // 1028
  });                                                                                                       // 1029
                                                                                                            // 1030
  test.throws(function () {                                                                                 // 1031
    testProjection({ 'a': 1, 'a.b': 1 }, [                                                                  // 1032
      [ { a: { b: 42 } }, { a: { b: 42 } }, "Can't have ambiguous rules (one is prefix of another)" ]       // 1033
    ]);                                                                                                     // 1034
  });                                                                                                       // 1035
  test.throws(function () {                                                                                 // 1036
    testProjection({ 'a.b.c': 1, 'a.b': 1, 'a': 1 }, [                                                      // 1037
      [ { a: { b: 42 } }, { a: { b: 42 } }, "Can't have ambiguous rules (one is prefix of another)" ]       // 1038
    ]);                                                                                                     // 1039
  });                                                                                                       // 1040
                                                                                                            // 1041
  test.throws(function () {                                                                                 // 1042
    testProjection("some string", [                                                                         // 1043
      [ { a: { b: 42 } }, { a: { b: 42 } }, "Projection is not a hash" ]                                    // 1044
    ]);                                                                                                     // 1045
  });                                                                                                       // 1046
});                                                                                                         // 1047
                                                                                                            // 1048
Tinytest.add("minimongo - fetch with fields", function (test) {                                             // 1049
  var c = new LocalCollection();                                                                            // 1050
  _.times(30, function (i) {                                                                                // 1051
    c.insert({                                                                                              // 1052
      something: Random.id(),                                                                               // 1053
      anything: {                                                                                           // 1054
        foo: "bar",                                                                                         // 1055
        cool: "hot"                                                                                         // 1056
      },                                                                                                    // 1057
      nothing: i,                                                                                           // 1058
      i: i                                                                                                  // 1059
    });                                                                                                     // 1060
  });                                                                                                       // 1061
                                                                                                            // 1062
  // Test just a regular fetch with some projection                                                         // 1063
  var fetchResults = c.find({}, { fields: {                                                                 // 1064
    'something': 1,                                                                                         // 1065
    'anything.foo': 1                                                                                       // 1066
  } }).fetch();                                                                                             // 1067
                                                                                                            // 1068
  test.isTrue(_.all(fetchResults, function (x) {                                                            // 1069
    return x &&                                                                                             // 1070
           x.something &&                                                                                   // 1071
           x.anything &&                                                                                    // 1072
           x.anything.foo &&                                                                                // 1073
           x.anything.foo === "bar" &&                                                                      // 1074
           !_.has(x, 'nothing') &&                                                                          // 1075
           !_.has(x.anything, 'cool');                                                                      // 1076
  }));                                                                                                      // 1077
                                                                                                            // 1078
  // Test with a selector, even field used in the selector is excluded in the                               // 1079
  // projection                                                                                             // 1080
  fetchResults = c.find({                                                                                   // 1081
    nothing: { $gte: 5 }                                                                                    // 1082
  }, {                                                                                                      // 1083
    fields: { nothing: 0 }                                                                                  // 1084
  }).fetch();                                                                                               // 1085
                                                                                                            // 1086
  test.isTrue(_.all(fetchResults, function (x) {                                                            // 1087
    return x &&                                                                                             // 1088
           x.something &&                                                                                   // 1089
           x.anything &&                                                                                    // 1090
           x.anything.foo === "bar" &&                                                                      // 1091
           x.anything.cool === "hot" &&                                                                     // 1092
           !_.has(x, 'nothing') &&                                                                          // 1093
           x.i &&                                                                                           // 1094
           x.i >= 5;                                                                                        // 1095
  }));                                                                                                      // 1096
                                                                                                            // 1097
  test.isTrue(fetchResults.length === 25);                                                                  // 1098
                                                                                                            // 1099
  // Test that we can sort, based on field excluded from the projection, use                                // 1100
  // skip and limit as well!                                                                                // 1101
  // following find will get indexes [10..20) sorted by nothing                                             // 1102
  fetchResults = c.find({}, {                                                                               // 1103
    sort: {                                                                                                 // 1104
      nothing: 1                                                                                            // 1105
    },                                                                                                      // 1106
    limit: 10,                                                                                              // 1107
    skip: 10,                                                                                               // 1108
    fields: {                                                                                               // 1109
      i: 1,                                                                                                 // 1110
      something: 1                                                                                          // 1111
    }                                                                                                       // 1112
  }).fetch();                                                                                               // 1113
                                                                                                            // 1114
  test.isTrue(_.all(fetchResults, function (x) {                                                            // 1115
    return x &&                                                                                             // 1116
           x.something &&                                                                                   // 1117
           x.i >= 10 && x.i < 20;                                                                           // 1118
  }));                                                                                                      // 1119
                                                                                                            // 1120
  _.each(fetchResults, function (x, i, arr) {                                                               // 1121
    if (!i) return;                                                                                         // 1122
    test.isTrue(x.i === arr[i-1].i + 1);                                                                    // 1123
  });                                                                                                       // 1124
                                                                                                            // 1125
  // Temporary unsupported operators                                                                        // 1126
  // queries are taken from MongoDB docs examples                                                           // 1127
  test.throws(function () {                                                                                 // 1128
    c.find({}, { fields: { 'grades.$': 1 } });                                                              // 1129
  });                                                                                                       // 1130
  test.throws(function () {                                                                                 // 1131
    c.find({}, { fields: { grades: { $elemMatch: { mean: 70 } } } });                                       // 1132
  });                                                                                                       // 1133
  test.throws(function () {                                                                                 // 1134
    c.find({}, { fields: { grades: { $slice: [20, 10] } } });                                               // 1135
  });                                                                                                       // 1136
});                                                                                                         // 1137
                                                                                                            // 1138
Tinytest.add("minimongo - fetch with projection, subarrays", function (test) {                              // 1139
  // Apparently projection of type 'foo.bar.x' for                                                          // 1140
  // { foo: [ { bar: { x: 42 } }, { bar: { x: 3 } } ] }                                                     // 1141
  // should return exactly this object. More precisely, arrays are considered as                            // 1142
  // sets and are queried separately and then merged back to result set                                     // 1143
  var c = new LocalCollection();                                                                            // 1144
                                                                                                            // 1145
  // Insert a test object with two set fields                                                               // 1146
  c.insert({                                                                                                // 1147
    setA: [{                                                                                                // 1148
      fieldA: 42,                                                                                           // 1149
      fieldB: 33                                                                                            // 1150
    }, {                                                                                                    // 1151
      fieldA: "the good",                                                                                   // 1152
      fieldB: "the bad",                                                                                    // 1153
      fieldC: "the ugly"                                                                                    // 1154
    }],                                                                                                     // 1155
    setB: [{                                                                                                // 1156
      anotherA: { },                                                                                        // 1157
      anotherB: "meh"                                                                                       // 1158
    }, {                                                                                                    // 1159
      anotherA: 1234,                                                                                       // 1160
      anotherB: 431                                                                                         // 1161
    }]                                                                                                      // 1162
  });                                                                                                       // 1163
                                                                                                            // 1164
  var equalNonStrict = function (a, b, desc) {                                                              // 1165
    test.isTrue(_.isEqual(a, b), desc);                                                                     // 1166
  };                                                                                                        // 1167
                                                                                                            // 1168
  var testForProjection = function (projection, expected) {                                                 // 1169
    var fetched = c.find({}, { fields: projection }).fetch()[0];                                            // 1170
    equalNonStrict(fetched, expected, "failed sub-set projection: " +                                       // 1171
                                      JSON.stringify(projection));                                          // 1172
  };                                                                                                        // 1173
                                                                                                            // 1174
  testForProjection({ 'setA.fieldA': 1, 'setB.anotherB': 1, _id: 0 },                                       // 1175
                    {                                                                                       // 1176
                      setA: [{ fieldA: 42 }, { fieldA: "the good" }],                                       // 1177
                      setB: [{ anotherB: "meh" }, { anotherB: 431 }]                                        // 1178
                    });                                                                                     // 1179
                                                                                                            // 1180
  testForProjection({ 'setA.fieldA': 0, 'setB.anotherA': 0, _id: 0 },                                       // 1181
                    {                                                                                       // 1182
                      setA: [{fieldB:33}, {fieldB:"the bad",fieldC:"the ugly"}],                            // 1183
                      setB: [{ anotherB: "meh" }, { anotherB: 431 }]                                        // 1184
                    });                                                                                     // 1185
                                                                                                            // 1186
  c.remove({});                                                                                             // 1187
  c.insert({a:[[{b:1,c:2},{b:2,c:4}],{b:3,c:5},[{b:4, c:9}]]});                                             // 1188
                                                                                                            // 1189
  testForProjection({ 'a.b': 1, _id: 0 },                                                                   // 1190
                    {a: [ [ { b: 1 }, { b: 2 } ], { b: 3 }, [ { b: 4 } ] ] });                              // 1191
  testForProjection({ 'a.b': 0, _id: 0 },                                                                   // 1192
                    {a: [ [ { c: 2 }, { c: 4 } ], { c: 5 }, [ { c: 9 } ] ] });                              // 1193
});                                                                                                         // 1194
                                                                                                            // 1195
Tinytest.add("minimongo - fetch with projection, deep copy", function (test) {                              // 1196
  // Compiled fields projection defines the contract: returned document doesn't                             // 1197
  // retain anything from the passed argument.                                                              // 1198
  var doc = {                                                                                               // 1199
    a: { x: 42 },                                                                                           // 1200
    b: {                                                                                                    // 1201
      y: { z: 33 }                                                                                          // 1202
    },                                                                                                      // 1203
    c: "asdf"                                                                                               // 1204
  };                                                                                                        // 1205
                                                                                                            // 1206
  var fields = {                                                                                            // 1207
    'a': 1,                                                                                                 // 1208
    'b.y': 1                                                                                                // 1209
  };                                                                                                        // 1210
                                                                                                            // 1211
  var projectionFn = LocalCollection._compileProjection(fields);                                            // 1212
  var filteredDoc = projectionFn(doc);                                                                      // 1213
  doc.a.x++;                                                                                                // 1214
  doc.b.y.z--;                                                                                              // 1215
  test.equal(filteredDoc.a.x, 42, "projection returning deep copy - including");                            // 1216
  test.equal(filteredDoc.b.y.z, 33, "projection returning deep copy - including");                          // 1217
                                                                                                            // 1218
  fields = { c: 0 };                                                                                        // 1219
  projectionFn = LocalCollection._compileProjection(fields);                                                // 1220
  filteredDoc = projectionFn(doc);                                                                          // 1221
                                                                                                            // 1222
  doc.a.x = 5;                                                                                              // 1223
  test.equal(filteredDoc.a.x, 43, "projection returning deep copy - excluding");                            // 1224
});                                                                                                         // 1225
                                                                                                            // 1226
Tinytest.add("minimongo - observe ordered with projection", function (test) {                               // 1227
  // These tests are copy-paste from "minimongo -observe ordered",                                          // 1228
  // slightly modified to test projection                                                                   // 1229
  var operations = [];                                                                                      // 1230
  var cbs = log_callbacks(operations);                                                                      // 1231
  var handle;                                                                                               // 1232
                                                                                                            // 1233
  var c = new LocalCollection();                                                                            // 1234
  handle = c.find({}, {sort: {a: 1}, fields: { a: 1 }}).observe(cbs);                                       // 1235
  test.isTrue(handle.collection === c);                                                                     // 1236
                                                                                                            // 1237
  c.insert({_id: 'foo', a:1, b:2});                                                                         // 1238
  test.equal(operations.shift(), ['added', {a:1}, 0, null]);                                                // 1239
  c.update({a:1}, {$set: {a: 2, b: 1}});                                                                    // 1240
  test.equal(operations.shift(), ['changed', {a:2}, 0, {a:1}]);                                             // 1241
  c.insert({_id: 'bar', a:10, c: 33});                                                                      // 1242
  test.equal(operations.shift(), ['added', {a:10}, 1, null]);                                               // 1243
  c.update({}, {$inc: {a: 1}}, {multi: true});                                                              // 1244
  c.update({}, {$inc: {c: 1}}, {multi: true});                                                              // 1245
  test.equal(operations.shift(), ['changed', {a:3}, 0, {a:2}]);                                             // 1246
  test.equal(operations.shift(), ['changed', {a:11}, 1, {a:10}]);                                           // 1247
  c.update({a:11}, {a:1, b:44});                                                                            // 1248
  test.equal(operations.shift(), ['changed', {a:1}, 1, {a:11}]);                                            // 1249
  test.equal(operations.shift(), ['moved', {a:1}, 1, 0, 'foo']);                                            // 1250
  c.remove({a:2});                                                                                          // 1251
  test.equal(operations.shift(), undefined);                                                                // 1252
  c.remove({a:3});                                                                                          // 1253
  test.equal(operations.shift(), ['removed', 'foo', 1, {a:3}]);                                             // 1254
                                                                                                            // 1255
  // test stop                                                                                              // 1256
  handle.stop();                                                                                            // 1257
  var idA2 = Random.id();                                                                                   // 1258
  c.insert({_id: idA2, a:2});                                                                               // 1259
  test.equal(operations.shift(), undefined);                                                                // 1260
                                                                                                            // 1261
  // test initial inserts (and backwards sort)                                                              // 1262
  handle = c.find({}, {sort: {a: -1}, fields: { a: 1 } }).observe(cbs);                                     // 1263
  test.equal(operations.shift(), ['added', {a:2}, 0, null]);                                                // 1264
  test.equal(operations.shift(), ['added', {a:1}, 1, null]);                                                // 1265
  handle.stop();                                                                                            // 1266
                                                                                                            // 1267
  // test _suppress_initial                                                                                 // 1268
  handle = c.find({}, {sort: {a: -1}, fields: { a: 1 }}).observe(_.extend(cbs, {_suppress_initial: true})); // 1269
  test.equal(operations.shift(), undefined);                                                                // 1270
  c.insert({a:100, b: { foo: "bar" }});                                                                     // 1271
  test.equal(operations.shift(), ['added', {a:100}, 0, idA2]);                                              // 1272
  handle.stop();                                                                                            // 1273
                                                                                                            // 1274
  // test skip and limit.                                                                                   // 1275
  c.remove({});                                                                                             // 1276
  handle = c.find({}, {sort: {a: 1}, skip: 1, limit: 2, fields: { 'blacklisted': 0 }}).observe(cbs);        // 1277
  test.equal(operations.shift(), undefined);                                                                // 1278
  c.insert({a:1, blacklisted:1324});                                                                        // 1279
  test.equal(operations.shift(), undefined);                                                                // 1280
  c.insert({_id: 'foo', a:2, blacklisted:["something"]});                                                   // 1281
  test.equal(operations.shift(), ['added', {a:2}, 0, null]);                                                // 1282
  c.insert({a:3, blacklisted: { 2: 3 }});                                                                   // 1283
  test.equal(operations.shift(), ['added', {a:3}, 1, null]);                                                // 1284
  c.insert({a:4, blacklisted: 6});                                                                          // 1285
  test.equal(operations.shift(), undefined);                                                                // 1286
  c.update({a:1}, {a:0, blacklisted:4444});                                                                 // 1287
  test.equal(operations.shift(), undefined);                                                                // 1288
  c.update({a:0}, {a:5, blacklisted:11111});                                                                // 1289
  test.equal(operations.shift(), ['removed', 'foo', 0, {a:2}]);                                             // 1290
  test.equal(operations.shift(), ['added', {a:4}, 1, null]);                                                // 1291
  c.update({a:3}, {a:3.5, blacklisted:333.4444});                                                           // 1292
  test.equal(operations.shift(), ['changed', {a:3.5}, 0, {a:3}]);                                           // 1293
  handle.stop();                                                                                            // 1294
                                                                                                            // 1295
  // test _no_indices                                                                                       // 1296
                                                                                                            // 1297
  c.remove({});                                                                                             // 1298
  handle = c.find({}, {sort: {a: 1}, fields: { a: 1 }}).observe(_.extend(cbs, {_no_indices: true}));        // 1299
  c.insert({_id: 'foo', a:1, zoo: "crazy"});                                                                // 1300
  test.equal(operations.shift(), ['added', {a:1}, -1, null]);                                               // 1301
  c.update({a:1}, {$set: {a: 2, foobar: "player"}});                                                        // 1302
  test.equal(operations.shift(), ['changed', {a:2}, -1, {a:1}]);                                            // 1303
  c.insert({a:10, b:123.45});                                                                               // 1304
  test.equal(operations.shift(), ['added', {a:10}, -1, null]);                                              // 1305
  c.update({}, {$inc: {a: 1, b:2}}, {multi: true});                                                         // 1306
  test.equal(operations.shift(), ['changed', {a:3}, -1, {a:2}]);                                            // 1307
  test.equal(operations.shift(), ['changed', {a:11}, -1, {a:10}]);                                          // 1308
  c.update({a:11, b:125.45}, {a:1, b:444});                                                                 // 1309
  test.equal(operations.shift(), ['changed', {a:1}, -1, {a:11}]);                                           // 1310
  test.equal(operations.shift(), ['moved', {a:1}, -1, -1, 'foo']);                                          // 1311
  c.remove({a:2});                                                                                          // 1312
  test.equal(operations.shift(), undefined);                                                                // 1313
  c.remove({a:3});                                                                                          // 1314
  test.equal(operations.shift(), ['removed', 'foo', -1, {a:3}]);                                            // 1315
  handle.stop();                                                                                            // 1316
});                                                                                                         // 1317
                                                                                                            // 1318
                                                                                                            // 1319
Tinytest.add("minimongo - ordering", function (test) {                                                      // 1320
  var shortBinary = EJSON.newBinary(1);                                                                     // 1321
  shortBinary[0] = 128;                                                                                     // 1322
  var longBinary1 = EJSON.newBinary(2);                                                                     // 1323
  longBinary1[1] = 42;                                                                                      // 1324
  var longBinary2 = EJSON.newBinary(2);                                                                     // 1325
  longBinary2[1] = 50;                                                                                      // 1326
                                                                                                            // 1327
  var date1 = new Date;                                                                                     // 1328
  var date2 = new Date(date1.getTime() + 1000);                                                             // 1329
                                                                                                            // 1330
  // value ordering                                                                                         // 1331
  assert_ordering(test, LocalCollection._f._cmp, [                                                          // 1332
    null,                                                                                                   // 1333
    1, 2.2, 3,                                                                                              // 1334
    "03", "1", "11", "2", "a", "aaa",                                                                       // 1335
    {}, {a: 2}, {a: 3}, {a: 3, b: 4}, {b: 4}, {b: 4, a: 3},                                                 // 1336
    {b: {}}, {b: [1, 2, 3]}, {b: [1, 2, 4]},                                                                // 1337
    [], [1, 2], [1, 2, 3], [1, 2, 4], [1, 2, "4"], [1, 2, [4]],                                             // 1338
    shortBinary, longBinary1, longBinary2,                                                                  // 1339
    new LocalCollection._ObjectID("1234567890abcd1234567890"),                                              // 1340
    new LocalCollection._ObjectID("abcd1234567890abcd123456"),                                              // 1341
    false, true,                                                                                            // 1342
    date1, date2                                                                                            // 1343
  ]);                                                                                                       // 1344
                                                                                                            // 1345
  // document ordering under a sort specification                                                           // 1346
  var verify = function (sorts, docs) {                                                                     // 1347
    _.each(sorts, function (sort) {                                                                         // 1348
      assert_ordering(test, LocalCollection._compileSort(sort), docs);                                      // 1349
    });                                                                                                     // 1350
  };                                                                                                        // 1351
                                                                                                            // 1352
  // note: [] doesn't sort with "arrays", it sorts as "undefined". the position                             // 1353
  // of arrays in _typeorder only matters for things like $lt. (This behavior                               // 1354
  // verified with MongoDB 2.2.1.) We don't define the relative order of {a: []}                            // 1355
  // and {c: 1} is undefined (MongoDB does seem to care but it's not clear how                              // 1356
  // or why).                                                                                               // 1357
  verify([{"a" : 1}, ["a"], [["a", "asc"]]],                                                                // 1358
         [{a: []}, {a: 1}, {a: {}}, {a: true}]);                                                            // 1359
  verify([{"a" : 1}, ["a"], [["a", "asc"]]],                                                                // 1360
         [{c: 1}, {a: 1}, {a: {}}, {a: true}]);                                                             // 1361
  verify([{"a" : -1}, [["a", "desc"]]],                                                                     // 1362
         [{a: true}, {a: {}}, {a: 1}, {c: 1}]);                                                             // 1363
  verify([{"a" : -1}, [["a", "desc"]]],                                                                     // 1364
         [{a: true}, {a: {}}, {a: 1}, {a: []}]);                                                            // 1365
                                                                                                            // 1366
  verify([{"a" : 1, "b": -1}, ["a", ["b", "desc"]],                                                         // 1367
          [["a", "asc"], ["b", "desc"]]],                                                                   // 1368
         [{c: 1}, {a: 1, b: 3}, {a: 1, b: 2}, {a: 2, b: 0}]);                                               // 1369
                                                                                                            // 1370
  verify([{"a" : 1, "b": 1}, ["a", "b"],                                                                    // 1371
          [["a", "asc"], ["b", "asc"]]],                                                                    // 1372
         [{c: 1}, {a: 1, b: 2}, {a: 1, b: 3}, {a: 2, b: 0}]);                                               // 1373
                                                                                                            // 1374
  test.throws(function () {                                                                                 // 1375
    LocalCollection._compileSort("a");                                                                      // 1376
  });                                                                                                       // 1377
                                                                                                            // 1378
  test.throws(function () {                                                                                 // 1379
    LocalCollection._compileSort(123);                                                                      // 1380
  });                                                                                                       // 1381
                                                                                                            // 1382
  test.equal(LocalCollection._compileSort({})({a:1}, {a:2}), 0);                                            // 1383
});                                                                                                         // 1384
                                                                                                            // 1385
Tinytest.add("minimongo - sort", function (test) {                                                          // 1386
  var c = new LocalCollection();                                                                            // 1387
  for (var i = 0; i < 50; i++)                                                                              // 1388
    for (var j = 0; j < 2; j++)                                                                             // 1389
      c.insert({a: i, b: j, _id: i + "_" + j});                                                             // 1390
                                                                                                            // 1391
  test.equal(                                                                                               // 1392
    c.find({a: {$gt: 10}}, {sort: {b: -1, a: 1}, limit: 5}).fetch(), [                                      // 1393
      {a: 11, b: 1, _id: "11_1"},                                                                           // 1394
      {a: 12, b: 1, _id: "12_1"},                                                                           // 1395
      {a: 13, b: 1, _id: "13_1"},                                                                           // 1396
      {a: 14, b: 1, _id: "14_1"},                                                                           // 1397
      {a: 15, b: 1, _id: "15_1"}]);                                                                         // 1398
                                                                                                            // 1399
  test.equal(                                                                                               // 1400
    c.find({a: {$gt: 10}}, {sort: {b: -1, a: 1}, skip: 3, limit: 5}).fetch(), [                             // 1401
      {a: 14, b: 1, _id: "14_1"},                                                                           // 1402
      {a: 15, b: 1, _id: "15_1"},                                                                           // 1403
      {a: 16, b: 1, _id: "16_1"},                                                                           // 1404
      {a: 17, b: 1, _id: "17_1"},                                                                           // 1405
      {a: 18, b: 1, _id: "18_1"}]);                                                                         // 1406
                                                                                                            // 1407
  test.equal(                                                                                               // 1408
    c.find({a: {$gte: 20}}, {sort: {a: 1, b: -1}, skip: 50, limit: 5}).fetch(), [                           // 1409
      {a: 45, b: 1, _id: "45_1"},                                                                           // 1410
      {a: 45, b: 0, _id: "45_0"},                                                                           // 1411
      {a: 46, b: 1, _id: "46_1"},                                                                           // 1412
      {a: 46, b: 0, _id: "46_0"},                                                                           // 1413
      {a: 47, b: 1, _id: "47_1"}]);                                                                         // 1414
});                                                                                                         // 1415
                                                                                                            // 1416
Tinytest.add("minimongo - subkey sort", function (test) {                                                   // 1417
  var c = new LocalCollection();                                                                            // 1418
                                                                                                            // 1419
  // normal case                                                                                            // 1420
  c.insert({a: {b: 2}});                                                                                    // 1421
  c.insert({a: {b: 1}});                                                                                    // 1422
  c.insert({a: {b: 3}});                                                                                    // 1423
  test.equal(                                                                                               // 1424
    _.pluck(c.find({}, {sort: {'a.b': -1}}).fetch(), 'a'),                                                  // 1425
    [{b: 3}, {b: 2}, {b: 1}]);                                                                              // 1426
                                                                                                            // 1427
  // isn't an object                                                                                        // 1428
  c.insert({a: 1});                                                                                         // 1429
  test.equal(                                                                                               // 1430
    _.pluck(c.find({}, {sort: {'a.b': 1}}).fetch(), 'a'),                                                   // 1431
    [1, {b: 1}, {b: 2}, {b: 3}]);                                                                           // 1432
                                                                                                            // 1433
  // complex object                                                                                         // 1434
  c.insert({a: {b: {c: 1}}});                                                                               // 1435
  test.equal(                                                                                               // 1436
    _.pluck(c.find({}, {sort: {'a.b': -1}}).fetch(), 'a'),                                                  // 1437
    [{b: {c: 1}}, {b: 3}, {b: 2}, {b: 1}, 1]);                                                              // 1438
                                                                                                            // 1439
  // no such top level prop                                                                                 // 1440
  c.insert({c: 1});                                                                                         // 1441
  test.equal(                                                                                               // 1442
    _.pluck(c.find({}, {sort: {'a.b': -1}}).fetch(), 'a'),                                                  // 1443
    [{b: {c: 1}}, {b: 3}, {b: 2}, {b: 1}, 1, undefined]);                                                   // 1444
                                                                                                            // 1445
  // no such mid level prop. just test that it doesn't throw.                                               // 1446
  test.equal(c.find({}, {sort: {'a.nope.c': -1}}).count(), 6);                                              // 1447
});                                                                                                         // 1448
                                                                                                            // 1449
Tinytest.add("minimongo - array sort", function (test) {                                                    // 1450
  var c = new LocalCollection();                                                                            // 1451
                                                                                                            // 1452
  // "up" and "down" are the indices that the docs should have when sorted                                  // 1453
  // ascending and descending by "a.x" respectively. They are not reverses of                               // 1454
  // each other: when sorting ascending, you use the minimum value you can find                             // 1455
  // in the document, and when sorting descending, you use the maximum value you                            // 1456
  // can find. So [1, 4] shows up in the 1 slot when sorting ascending and the 4                            // 1457
  // slot when sorting descending.                                                                          // 1458
  c.insert({up: 1, down: 1, a: {x: [1, 4]}});                                                               // 1459
  c.insert({up: 2, down: 2, a: [{x: [2]}, {x: 3}]});                                                        // 1460
  c.insert({up: 0, down: 4, a: {x: 0}});                                                                    // 1461
  c.insert({up: 3, down: 3, a: {x: 2.5}});                                                                  // 1462
  c.insert({up: 4, down: 0, a: {x: 5}});                                                                    // 1463
                                                                                                            // 1464
  test.equal(                                                                                               // 1465
    _.pluck(c.find({}, {sort: {'a.x': 1}}).fetch(), 'up'),                                                  // 1466
    _.range(c.find().count()));                                                                             // 1467
                                                                                                            // 1468
  test.equal(                                                                                               // 1469
    _.pluck(c.find({}, {sort: {'a.x': -1}}).fetch(), 'down'),                                               // 1470
    _.range(c.find().count()));                                                                             // 1471
});                                                                                                         // 1472
                                                                                                            // 1473
Tinytest.add("minimongo - binary search", function (test) {                                                 // 1474
  var forwardCmp = function (a, b) {                                                                        // 1475
    return a - b;                                                                                           // 1476
  };                                                                                                        // 1477
                                                                                                            // 1478
  var backwardCmp = function (a, b) {                                                                       // 1479
    return -1 * forwardCmp(a, b);                                                                           // 1480
  };                                                                                                        // 1481
                                                                                                            // 1482
  var checkSearch = function (cmp, array, value, expected, message) {                                       // 1483
    var actual = LocalCollection._binarySearch(cmp, array, value);                                          // 1484
    if (expected != actual) {                                                                               // 1485
      test.fail({type: "minimongo-binary-search",                                                           // 1486
                 message: message + " : Expected index " + expected +                                       // 1487
                 " but had " + actual                                                                       // 1488
      });                                                                                                   // 1489
    }                                                                                                       // 1490
  };                                                                                                        // 1491
                                                                                                            // 1492
  var checkSearchForward = function (array, value, expected, message) {                                     // 1493
    checkSearch(forwardCmp, array, value, expected, message);                                               // 1494
  };                                                                                                        // 1495
  var checkSearchBackward = function (array, value, expected, message) {                                    // 1496
    checkSearch(backwardCmp, array, value, expected, message);                                              // 1497
  };                                                                                                        // 1498
                                                                                                            // 1499
  checkSearchForward([1, 2, 5, 7], 4, 2, "Inner insert");                                                   // 1500
  checkSearchForward([1, 2, 3, 4], 3, 3, "Inner insert, equal value");                                      // 1501
  checkSearchForward([1, 2, 5], 4, 2, "Inner insert, odd length");                                          // 1502
  checkSearchForward([1, 3, 5, 6], 9, 4, "End insert");                                                     // 1503
  checkSearchForward([1, 3, 5, 6], 0, 0, "Beginning insert");                                               // 1504
  checkSearchForward([1], 0, 0, "Single array, less than.");                                                // 1505
  checkSearchForward([1], 1, 1, "Single array, equal.");                                                    // 1506
  checkSearchForward([1], 2, 1, "Single array, greater than.");                                             // 1507
  checkSearchForward([], 1, 0, "Empty array");                                                              // 1508
  checkSearchForward([1, 1, 1, 2, 2, 2, 2], 1, 3, "Highly degenerate array, lower");                        // 1509
  checkSearchForward([1, 1, 1, 2, 2, 2, 2], 2, 7, "Highly degenerate array, upper");                        // 1510
  checkSearchForward([2, 2, 2, 2, 2, 2, 2], 1, 0, "Highly degenerate array, lower");                        // 1511
  checkSearchForward([2, 2, 2, 2, 2, 2, 2], 2, 7, "Highly degenerate array, equal");                        // 1512
  checkSearchForward([2, 2, 2, 2, 2, 2, 2], 3, 7, "Highly degenerate array, upper");                        // 1513
                                                                                                            // 1514
  checkSearchBackward([7, 5, 2, 1], 4, 2, "Backward: Inner insert");                                        // 1515
  checkSearchBackward([4, 3, 2, 1], 3, 2, "Backward: Inner insert, equal value");                           // 1516
  checkSearchBackward([5, 2, 1], 4, 1, "Backward: Inner insert, odd length");                               // 1517
  checkSearchBackward([6, 5, 3, 1], 9, 0, "Backward: Beginning insert");                                    // 1518
  checkSearchBackward([6, 5, 3, 1], 0, 4, "Backward: End insert");                                          // 1519
  checkSearchBackward([1], 0, 1, "Backward: Single array, less than.");                                     // 1520
  checkSearchBackward([1], 1, 1, "Backward: Single array, equal.");                                         // 1521
  checkSearchBackward([1], 2, 0, "Backward: Single array, greater than.");                                  // 1522
  checkSearchBackward([], 1, 0, "Backward: Empty array");                                                   // 1523
  checkSearchBackward([2, 2, 2, 2, 1, 1, 1], 1, 7, "Backward: Degenerate array, lower");                    // 1524
  checkSearchBackward([2, 2, 2, 2, 1, 1, 1], 2, 4, "Backward: Degenerate array, upper");                    // 1525
  checkSearchBackward([2, 2, 2, 2, 2, 2, 2], 1, 7, "Backward: Highly degenerate array, upper");             // 1526
  checkSearchBackward([2, 2, 2, 2, 2, 2, 2], 2, 7, "Backward: Highly degenerate array, upper");             // 1527
  checkSearchBackward([2, 2, 2, 2, 2, 2, 2], 3, 0, "Backward: Highly degenerate array, upper");             // 1528
});                                                                                                         // 1529
                                                                                                            // 1530
Tinytest.add("minimongo - modify", function (test) {                                                        // 1531
  var modify = function (doc, mod, result) {                                                                // 1532
    var copy = EJSON.clone(doc);                                                                            // 1533
    LocalCollection._modify(copy, mod);                                                                     // 1534
    if (!LocalCollection._f._equal(copy, result)) {                                                         // 1535
      // XXX super janky                                                                                    // 1536
      test.fail({type: "minimongo-modifier",                                                                // 1537
                 message: "modifier test failure",                                                          // 1538
                 input_doc: JSON.stringify(doc),                                                            // 1539
                 modifier: JSON.stringify(mod),                                                             // 1540
                 expected: JSON.stringify(result),                                                          // 1541
                 actual: JSON.stringify(copy)                                                               // 1542
                });                                                                                         // 1543
    } else {                                                                                                // 1544
      test.ok();                                                                                            // 1545
    }                                                                                                       // 1546
  };                                                                                                        // 1547
  var exception = function (doc, mod) {                                                                     // 1548
    test.throws(function () {                                                                               // 1549
      LocalCollection._modify(EJSON.clone(doc), mod);                                                       // 1550
    });                                                                                                     // 1551
  };                                                                                                        // 1552
                                                                                                            // 1553
  // document replacement                                                                                   // 1554
  modify({}, {}, {});                                                                                       // 1555
  modify({a: 12}, {}, {}); // tested against mongodb                                                        // 1556
  modify({a: 12}, {a: 13}, {a:13});                                                                         // 1557
  modify({a: 12, b: 99}, {a: 13}, {a:13});                                                                  // 1558
  exception({a: 12}, {a: 13, $set: {b: 13}});                                                               // 1559
  exception({a: 12}, {$set: {b: 13}, a: 13});                                                               // 1560
                                                                                                            // 1561
  // keys                                                                                                   // 1562
  modify({}, {$set: {'a': 12}}, {a: 12});                                                                   // 1563
  modify({}, {$set: {'a.b': 12}}, {a: {b: 12}});                                                            // 1564
  modify({}, {$set: {'a.b.c': 12}}, {a: {b: {c: 12}}});                                                     // 1565
  modify({a: {d: 99}}, {$set: {'a.b.c': 12}}, {a: {d: 99, b: {c: 12}}});                                    // 1566
  modify({}, {$set: {'a.b.3.c': 12}}, {a: {b: {3: {c: 12}}}});                                              // 1567
  modify({a: {b: []}}, {$set: {'a.b.3.c': 12}}, {                                                           // 1568
    a: {b: [null, null, null, {c: 12}]}});                                                                  // 1569
  exception({a: [null, null, null]}, {$set: {'a.1.b': 12}});                                                // 1570
  exception({a: [null, 1, null]}, {$set: {'a.1.b': 12}});                                                   // 1571
  exception({a: [null, "x", null]}, {$set: {'a.1.b': 12}});                                                 // 1572
  exception({a: [null, [], null]}, {$set: {'a.1.b': 12}});                                                  // 1573
  modify({a: [null, null, null]}, {$set: {'a.3.b': 12}}, {                                                  // 1574
    a: [null, null, null, {b: 12}]});                                                                       // 1575
  exception({a: []}, {$set: {'a.b': 12}});                                                                  // 1576
  test.expect_fail();                                                                                       // 1577
  exception({a: 12}, {$set: {'a.b': 99}}); // tested on mongo                                               // 1578
  test.expect_fail();                                                                                       // 1579
  exception({a: 'x'}, {$set: {'a.b': 99}});                                                                 // 1580
  test.expect_fail();                                                                                       // 1581
  exception({a: true}, {$set: {'a.b': 99}});                                                                // 1582
  test.expect_fail();                                                                                       // 1583
  exception({a: null}, {$set: {'a.b': 99}});                                                                // 1584
  modify({a: {}}, {$set: {'a.3': 12}}, {a: {'3': 12}});                                                     // 1585
  modify({a: []}, {$set: {'a.3': 12}}, {a: [null, null, null, 12]});                                        // 1586
  modify({}, {$set: {'': 12}}, {'': 12}); // tested on mongo                                                // 1587
  test.expect_fail();                                                                                       // 1588
  exception({}, {$set: {'.': 12}}); // tested on mongo                                                      // 1589
  modify({}, {$set: {'. ': 12}}, {'': {' ': 12}}); // tested on mongo                                       // 1590
  modify({}, {$inc: {'... ': 12}}, {'': {'': {'': {' ': 12}}}}); // tested                                  // 1591
  modify({}, {$set: {'a..b': 12}}, {a: {'': {b: 12}}});                                                     // 1592
  modify({a: [1,2,3]}, {$set: {'a.01': 99}}, {a: [1, 99, 3]});                                              // 1593
  modify({a: [1,{a: 98},3]}, {$set: {'a.01.b': 99}}, {a: [1,{a:98, b: 99},3]});                             // 1594
  modify({}, {$set: {'2.a.b': 12}}, {'2': {'a': {'b': 12}}}); // tested                                     // 1595
  modify({x: []}, {$set: {'x.2..a': 99}}, {x: [null, null, {'': {a: 99}}]});                                // 1596
  modify({x: [null, null]}, {$set: {'x.2.a': 1}}, {x: [null, null, {a: 1}]});                               // 1597
  exception({x: [null, null]}, {$set: {'x.1.a': 1}});                                                       // 1598
                                                                                                            // 1599
  // $inc                                                                                                   // 1600
  modify({a: 1, b: 2}, {$inc: {a: 10}}, {a: 11, b: 2});                                                     // 1601
  modify({a: 1, b: 2}, {$inc: {c: 10}}, {a: 1, b: 2, c: 10});                                               // 1602
  exception({a: 1}, {$inc: {a: '10'}});                                                                     // 1603
  exception({a: 1}, {$inc: {a: true}});                                                                     // 1604
  exception({a: 1}, {$inc: {a: [10]}});                                                                     // 1605
  exception({a: '1'}, {$inc: {a: 10}});                                                                     // 1606
  exception({a: [1]}, {$inc: {a: 10}});                                                                     // 1607
  exception({a: {}}, {$inc: {a: 10}});                                                                      // 1608
  exception({a: false}, {$inc: {a: 10}});                                                                   // 1609
  exception({a: null}, {$inc: {a: 10}});                                                                    // 1610
  modify({a: [1, 2]}, {$inc: {'a.1': 10}}, {a: [1, 12]});                                                   // 1611
  modify({a: [1, 2]}, {$inc: {'a.2': 10}}, {a: [1, 2, 10]});                                                // 1612
  modify({a: [1, 2]}, {$inc: {'a.3': 10}}, {a: [1, 2, null, 10]});                                          // 1613
  modify({a: {b: 2}}, {$inc: {'a.b': 10}}, {a: {b: 12}});                                                   // 1614
  modify({a: {b: 2}}, {$inc: {'a.c': 10}}, {a: {b: 2, c: 10}});                                             // 1615
                                                                                                            // 1616
  // $set                                                                                                   // 1617
  modify({a: 1, b: 2}, {$set: {a: 10}}, {a: 10, b: 2});                                                     // 1618
  modify({a: 1, b: 2}, {$set: {c: 10}}, {a: 1, b: 2, c: 10});                                               // 1619
  modify({a: 1, b: 2}, {$set: {a: {c: 10}}}, {a: {c: 10}, b: 2});                                           // 1620
  modify({a: [1, 2], b: 2}, {$set: {a: [3, 4]}}, {a: [3, 4], b: 2});                                        // 1621
  modify({a: [1, 2, 3], b: 2}, {$set: {'a.1': [3, 4]}},                                                     // 1622
         {a: [1, [3, 4], 3], b:2});                                                                         // 1623
  modify({a: [1], b: 2}, {$set: {'a.1': 9}}, {a: [1, 9], b: 2});                                            // 1624
  modify({a: [1], b: 2}, {$set: {'a.2': 9}}, {a: [1, null, 9], b: 2});                                      // 1625
  modify({a: {b: 1}}, {$set: {'a.c': 9}}, {a: {b: 1, c: 9}});                                               // 1626
                                                                                                            // 1627
  // $unset                                                                                                 // 1628
  modify({}, {$unset: {a: 1}}, {});                                                                         // 1629
  modify({a: 1}, {$unset: {a: 1}}, {});                                                                     // 1630
  modify({a: 1, b: 2}, {$unset: {a: 1}}, {b: 2});                                                           // 1631
  modify({a: 1, b: 2}, {$unset: {a: 0}}, {b: 2});                                                           // 1632
  modify({a: 1, b: 2}, {$unset: {a: false}}, {b: 2});                                                       // 1633
  modify({a: 1, b: 2}, {$unset: {a: null}}, {b: 2});                                                        // 1634
  modify({a: 1, b: 2}, {$unset: {a: [1]}}, {b: 2});                                                         // 1635
  modify({a: 1, b: 2}, {$unset: {a: {}}}, {b: 2});                                                          // 1636
  modify({a: {b: 2, c: 3}}, {$unset: {'a.b': 1}}, {a: {c: 3}});                                             // 1637
  modify({a: [1, 2, 3]}, {$unset: {'a.1': 1}}, {a: [1, null, 3]}); // tested                                // 1638
  modify({a: [1, 2, 3]}, {$unset: {'a.2': 1}}, {a: [1, 2, null]}); // tested                                // 1639
  modify({a: [1, 2, 3]}, {$unset: {'a.x': 1}}, {a: [1, 2, 3]}); // tested                                   // 1640
  modify({a: {b: 1}}, {$unset: {'a.b.c.d': 1}}, {a: {b: 1}});                                               // 1641
  modify({a: {b: 1}}, {$unset: {'a.x.c.d': 1}}, {a: {b: 1}});                                               // 1642
  modify({a: {b: {c: 1}}}, {$unset: {'a.b.c': 1}}, {a: {b: {}}});                                           // 1643
                                                                                                            // 1644
  // $push                                                                                                  // 1645
  modify({}, {$push: {a: 1}}, {a: [1]});                                                                    // 1646
  modify({a: []}, {$push: {a: 1}}, {a: [1]});                                                               // 1647
  modify({a: [1]}, {$push: {a: 2}}, {a: [1, 2]});                                                           // 1648
  exception({a: true}, {$push: {a: 1}});                                                                    // 1649
  modify({a: [1]}, {$push: {a: [2]}}, {a: [1, [2]]});                                                       // 1650
  modify({a: []}, {$push: {'a.1': 99}}, {a: [null, [99]]}); // tested                                       // 1651
  modify({a: {}}, {$push: {'a.x': 99}}, {a: {x: [99]}});                                                    // 1652
  modify({}, {$push: {a: {$each: [1, 2, 3]}}},                                                              // 1653
         {a: [1, 2, 3]});                                                                                   // 1654
  modify({a: []}, {$push: {a: {$each: [1, 2, 3]}}},                                                         // 1655
         {a: [1, 2, 3]});                                                                                   // 1656
  modify({a: [true]}, {$push: {a: {$each: [1, 2, 3]}}},                                                     // 1657
         {a: [true, 1, 2, 3]});                                                                             // 1658
  // No positive numbers for $slice                                                                         // 1659
  exception({}, {$push: {a: {$each: [], $slice: 5}}});                                                      // 1660
  modify({a: [true]}, {$push: {a: {$each: [1, 2, 3], $slice: -2}}},                                         // 1661
         {a: [2, 3]});                                                                                      // 1662
  modify({a: [false, true]}, {$push: {a: {$each: [1], $slice: -2}}},                                        // 1663
         {a: [true, 1]});                                                                                   // 1664
  modify(                                                                                                   // 1665
    {a: [{x: 3}, {x: 1}]},                                                                                  // 1666
    {$push: {a: {                                                                                           // 1667
      $each: [{x: 4}, {x: 2}],                                                                              // 1668
      $slice: -2,                                                                                           // 1669
      $sort: {x: 1}                                                                                         // 1670
    }}},                                                                                                    // 1671
    {a: [{x: 3}, {x: 4}]});                                                                                 // 1672
  modify({}, {$push: {a: {$each: [1, 2, 3], $slice: 0}}}, {a: []});                                         // 1673
  modify({a: [1, 2]}, {$push: {a: {$each: [1, 2, 3], $slice: 0}}}, {a: []});                                // 1674
                                                                                                            // 1675
  // $pushAll                                                                                               // 1676
  modify({}, {$pushAll: {a: [1]}}, {a: [1]});                                                               // 1677
  modify({a: []}, {$pushAll: {a: [1]}}, {a: [1]});                                                          // 1678
  modify({a: [1]}, {$pushAll: {a: [2]}}, {a: [1, 2]});                                                      // 1679
  modify({}, {$pushAll: {a: [1, 2]}}, {a: [1, 2]});                                                         // 1680
  modify({a: []}, {$pushAll: {a: [1, 2]}}, {a: [1, 2]});                                                    // 1681
  modify({a: [1]}, {$pushAll: {a: [2, 3]}}, {a: [1, 2, 3]});                                                // 1682
  modify({}, {$pushAll: {a: []}}, {a: []});                                                                 // 1683
  modify({a: []}, {$pushAll: {a: []}}, {a: []});                                                            // 1684
  modify({a: [1]}, {$pushAll: {a: []}}, {a: [1]});                                                          // 1685
  exception({a: true}, {$pushAll: {a: [1]}});                                                               // 1686
  exception({a: []}, {$pushAll: {a: 1}});                                                                   // 1687
  modify({a: []}, {$pushAll: {'a.1': [99]}}, {a: [null, [99]]});                                            // 1688
  modify({a: []}, {$pushAll: {'a.1': []}}, {a: [null, []]});                                                // 1689
  modify({a: {}}, {$pushAll: {'a.x': [99]}}, {a: {x: [99]}});                                               // 1690
  modify({a: {}}, {$pushAll: {'a.x': []}}, {a: {x: []}});                                                   // 1691
                                                                                                            // 1692
  // $addToSet                                                                                              // 1693
  modify({}, {$addToSet: {a: 1}}, {a: [1]});                                                                // 1694
  modify({a: []}, {$addToSet: {a: 1}}, {a: [1]});                                                           // 1695
  modify({a: [1]}, {$addToSet: {a: 2}}, {a: [1, 2]});                                                       // 1696
  modify({a: [1, 2]}, {$addToSet: {a: 1}}, {a: [1, 2]});                                                    // 1697
  modify({a: [1, 2]}, {$addToSet: {a: 2}}, {a: [1, 2]});                                                    // 1698
  modify({a: [1, 2]}, {$addToSet: {a: 3}}, {a: [1, 2, 3]});                                                 // 1699
  exception({a: true}, {$addToSet: {a: 1}});                                                                // 1700
  modify({a: [1]}, {$addToSet: {a: [2]}}, {a: [1, [2]]});                                                   // 1701
  modify({}, {$addToSet: {a: {x: 1}}}, {a: [{x: 1}]});                                                      // 1702
  modify({a: [{x: 1}]}, {$addToSet: {a: {x: 1}}}, {a: [{x: 1}]});                                           // 1703
  modify({a: [{x: 1}]}, {$addToSet: {a: {x: 2}}}, {a: [{x: 1}, {x: 2}]});                                   // 1704
  modify({a: [{x: 1, y: 2}]}, {$addToSet: {a: {x: 1, y: 2}}},                                               // 1705
         {a: [{x: 1, y: 2}]});                                                                              // 1706
  modify({a: [{x: 1, y: 2}]}, {$addToSet: {a: {y: 2, x: 1}}},                                               // 1707
         {a: [{x: 1, y: 2}, {y: 2, x: 1}]});                                                                // 1708
  modify({a: [1, 2]}, {$addToSet: {a: {$each: [3, 1, 4]}}}, {a: [1, 2, 3, 4]});                             // 1709
  modify({a: [1, 2]}, {$addToSet: {a: {$each: [3, 1, 4], b: 12}}},                                          // 1710
         {a: [1, 2, 3, 4]}); // tested                                                                      // 1711
  modify({a: [1, 2]}, {$addToSet: {a: {b: 12, $each: [3, 1, 4]}}},                                          // 1712
         {a: [1, 2, {b: 12, $each: [3, 1, 4]}]}); // tested                                                 // 1713
  modify({a: []}, {$addToSet: {'a.1': 99}}, {a: [null, [99]]});                                             // 1714
  modify({a: {}}, {$addToSet: {'a.x': 99}}, {a: {x: [99]}});                                                // 1715
                                                                                                            // 1716
  // $pop                                                                                                   // 1717
  modify({}, {$pop: {a: 1}}, {}); // tested                                                                 // 1718
  modify({}, {$pop: {a: -1}}, {}); // tested                                                                // 1719
  modify({a: []}, {$pop: {a: 1}}, {a: []});                                                                 // 1720
  modify({a: []}, {$pop: {a: -1}}, {a: []});                                                                // 1721
  modify({a: [1, 2, 3]}, {$pop: {a: 1}}, {a: [1, 2]});                                                      // 1722
  modify({a: [1, 2, 3]}, {$pop: {a: 10}}, {a: [1, 2]});                                                     // 1723
  modify({a: [1, 2, 3]}, {$pop: {a: .001}}, {a: [1, 2]});                                                   // 1724
  modify({a: [1, 2, 3]}, {$pop: {a: 0}}, {a: [1, 2]});                                                      // 1725
  modify({a: [1, 2, 3]}, {$pop: {a: "stuff"}}, {a: [1, 2]});                                                // 1726
  modify({a: [1, 2, 3]}, {$pop: {a: -1}}, {a: [2, 3]});                                                     // 1727
  modify({a: [1, 2, 3]}, {$pop: {a: -10}}, {a: [2, 3]});                                                    // 1728
  modify({a: [1, 2, 3]}, {$pop: {a: -.001}}, {a: [2, 3]});                                                  // 1729
  exception({a: true}, {$pop: {a: 1}});                                                                     // 1730
  exception({a: true}, {$pop: {a: -1}});                                                                    // 1731
  modify({a: []}, {$pop: {'a.1': 1}}, {a: []}); // tested                                                   // 1732
  modify({a: [1, [2, 3], 4]}, {$pop: {'a.1': 1}}, {a: [1, [2], 4]});                                        // 1733
  modify({a: {}}, {$pop: {'a.x': 1}}, {a: {}}); // tested                                                   // 1734
  modify({a: {x: [2, 3]}}, {$pop: {'a.x': 1}}, {a: {x: [2]}});                                              // 1735
                                                                                                            // 1736
  // $pull                                                                                                  // 1737
  modify({}, {$pull: {a: 1}}, {});                                                                          // 1738
  modify({}, {$pull: {'a.x': 1}}, {});                                                                      // 1739
  modify({a: {}}, {$pull: {'a.x': 1}}, {a: {}});                                                            // 1740
  exception({a: true}, {$pull: {a: 1}});                                                                    // 1741
  modify({a: [2, 1, 2]}, {$pull: {a: 1}}, {a: [2, 2]});                                                     // 1742
  modify({a: [2, 1, 2]}, {$pull: {a: 2}}, {a: [1]});                                                        // 1743
  modify({a: [2, 1, 2]}, {$pull: {a: 3}}, {a: [2, 1, 2]});                                                  // 1744
  modify({a: []}, {$pull: {a: 3}}, {a: []});                                                                // 1745
  modify({a: [[2], [2, 1], [3]]}, {$pull: {a: [2, 1]}},                                                     // 1746
         {a: [[2], [3]]}); // tested                                                                        // 1747
  modify({a: [{b: 1, c: 2}, {b: 2, c: 2}]}, {$pull: {a: {b: 1}}},                                           // 1748
         {a: [{b: 2, c: 2}]});                                                                              // 1749
  modify({a: [{b: 1, c: 2}, {b: 2, c: 2}]}, {$pull: {a: {c: 2}}},                                           // 1750
         {a: []});                                                                                          // 1751
  // XXX implement this functionality!                                                                      // 1752
  // probably same refactoring as $elemMatch?                                                               // 1753
  // modify({a: [1, 2, 3, 4]}, {$pull: {$gt: 2}}, {a: [1,2]}); fails!                                       // 1754
                                                                                                            // 1755
  // $pullAll                                                                                               // 1756
  modify({}, {$pullAll: {a: [1]}}, {});                                                                     // 1757
  modify({a: [1, 2, 3]}, {$pullAll: {a: []}}, {a: [1, 2, 3]});                                              // 1758
  modify({a: [1, 2, 3]}, {$pullAll: {a: [2]}}, {a: [1, 3]});                                                // 1759
  modify({a: [1, 2, 3]}, {$pullAll: {a: [2, 1]}}, {a: [3]});                                                // 1760
  modify({a: [1, 2, 3]}, {$pullAll: {a: [1, 2]}}, {a: [3]});                                                // 1761
  modify({}, {$pullAll: {'a.b.c': [2]}}, {});                                                               // 1762
  exception({a: true}, {$pullAll: {a: [1]}});                                                               // 1763
  exception({a: [1, 2, 3]}, {$pullAll: {a: 1}});                                                            // 1764
  modify({x: [{a: 1}, {a: 1, b: 2}]}, {$pullAll: {x: [{a: 1}]}},                                            // 1765
         {x: [{a: 1, b: 2}]});                                                                              // 1766
                                                                                                            // 1767
  // $rename                                                                                                // 1768
  modify({}, {$rename: {a: 'b'}}, {});                                                                      // 1769
  modify({a: [12]}, {$rename: {a: 'b'}}, {b: [12]});                                                        // 1770
  modify({a: {b: 12}}, {$rename: {a: 'c'}}, {c: {b: 12}});                                                  // 1771
  modify({a: {b: 12}}, {$rename: {'a.b': 'a.c'}}, {a: {c: 12}});                                            // 1772
  modify({a: {b: 12}}, {$rename: {'a.b': 'x'}}, {a: {}, x: 12}); // tested                                  // 1773
  modify({a: {b: 12}}, {$rename: {'a.b': 'q.r'}}, {a: {}, q: {r: 12}});                                     // 1774
  modify({a: {b: 12}}, {$rename: {'a.b': 'q.2.r'}}, {a: {}, q: {2: {r: 12}}});                              // 1775
  modify({a: {b: 12}, q: {}}, {$rename: {'a.b': 'q.2.r'}},                                                  // 1776
         {a: {}, q: {2: {r: 12}}});                                                                         // 1777
  exception({a: {b: 12}, q: []}, {$rename: {'a.b': 'q.2'}}); // tested                                      // 1778
  exception({a: {b: 12}, q: []}, {$rename: {'a.b': 'q.2.r'}}); // tested                                    // 1779
  test.expect_fail();                                                                                       // 1780
  exception({a: {b: 12}, q: []}, {$rename: {'q.1': 'x'}}); // tested                                        // 1781
  test.expect_fail();                                                                                       // 1782
  exception({a: {b: 12}, q: []}, {$rename: {'q.1.j': 'x'}}); // tested                                      // 1783
  exception({}, {$rename: {'a': 'a'}});                                                                     // 1784
  exception({}, {$rename: {'a.b': 'a.b'}});                                                                 // 1785
  modify({a: 12, b: 13}, {$rename: {a: 'b'}}, {b: 12});                                                     // 1786
                                                                                                            // 1787
  // $bit                                                                                                   // 1788
  // unimplemented                                                                                          // 1789
                                                                                                            // 1790
  // XXX test case sensitivity of modops                                                                    // 1791
  // XXX for each (most) modop, test that it performs a deep copy                                           // 1792
});                                                                                                         // 1793
                                                                                                            // 1794
// XXX test update() (selecting docs, multi, upsert..)                                                      // 1795
                                                                                                            // 1796
Tinytest.add("minimongo - observe ordered", function (test) {                                               // 1797
  var operations = [];                                                                                      // 1798
  var cbs = log_callbacks(operations);                                                                      // 1799
  var handle;                                                                                               // 1800
                                                                                                            // 1801
  var c = new LocalCollection();                                                                            // 1802
  handle = c.find({}, {sort: {a: 1}}).observe(cbs);                                                         // 1803
  test.isTrue(handle.collection === c);                                                                     // 1804
                                                                                                            // 1805
  c.insert({_id: 'foo', a:1});                                                                              // 1806
  test.equal(operations.shift(), ['added', {a:1}, 0, null]);                                                // 1807
  c.update({a:1}, {$set: {a: 2}});                                                                          // 1808
  test.equal(operations.shift(), ['changed', {a:2}, 0, {a:1}]);                                             // 1809
  c.insert({a:10});                                                                                         // 1810
  test.equal(operations.shift(), ['added', {a:10}, 1, null]);                                               // 1811
  c.update({}, {$inc: {a: 1}}, {multi: true});                                                              // 1812
  test.equal(operations.shift(), ['changed', {a:3}, 0, {a:2}]);                                             // 1813
  test.equal(operations.shift(), ['changed', {a:11}, 1, {a:10}]);                                           // 1814
  c.update({a:11}, {a:1});                                                                                  // 1815
  test.equal(operations.shift(), ['changed', {a:1}, 1, {a:11}]);                                            // 1816
  test.equal(operations.shift(), ['moved', {a:1}, 1, 0, 'foo']);                                            // 1817
  c.remove({a:2});                                                                                          // 1818
  test.equal(operations.shift(), undefined);                                                                // 1819
  c.remove({a:3});                                                                                          // 1820
  test.equal(operations.shift(), ['removed', 'foo', 1, {a:3}]);                                             // 1821
                                                                                                            // 1822
  // test stop                                                                                              // 1823
  handle.stop();                                                                                            // 1824
  var idA2 = Random.id();                                                                                   // 1825
  c.insert({_id: idA2, a:2});                                                                               // 1826
  test.equal(operations.shift(), undefined);                                                                // 1827
                                                                                                            // 1828
  // test initial inserts (and backwards sort)                                                              // 1829
  handle = c.find({}, {sort: {a: -1}}).observe(cbs);                                                        // 1830
  test.equal(operations.shift(), ['added', {a:2}, 0, null]);                                                // 1831
  test.equal(operations.shift(), ['added', {a:1}, 1, null]);                                                // 1832
  handle.stop();                                                                                            // 1833
                                                                                                            // 1834
  // test _suppress_initial                                                                                 // 1835
  handle = c.find({}, {sort: {a: -1}}).observe(_.extend(cbs, {_suppress_initial: true}));                   // 1836
  test.equal(operations.shift(), undefined);                                                                // 1837
  c.insert({a:100});                                                                                        // 1838
  test.equal(operations.shift(), ['added', {a:100}, 0, idA2]);                                              // 1839
  handle.stop();                                                                                            // 1840
                                                                                                            // 1841
  // test skip and limit.                                                                                   // 1842
  c.remove({});                                                                                             // 1843
  handle = c.find({}, {sort: {a: 1}, skip: 1, limit: 2}).observe(cbs);                                      // 1844
  test.equal(operations.shift(), undefined);                                                                // 1845
  c.insert({a:1});                                                                                          // 1846
  test.equal(operations.shift(), undefined);                                                                // 1847
  c.insert({_id: 'foo', a:2});                                                                              // 1848
  test.equal(operations.shift(), ['added', {a:2}, 0, null]);                                                // 1849
  c.insert({a:3});                                                                                          // 1850
  test.equal(operations.shift(), ['added', {a:3}, 1, null]);                                                // 1851
  c.insert({a:4});                                                                                          // 1852
  test.equal(operations.shift(), undefined);                                                                // 1853
  c.update({a:1}, {a:0});                                                                                   // 1854
  test.equal(operations.shift(), undefined);                                                                // 1855
  c.update({a:0}, {a:5});                                                                                   // 1856
  test.equal(operations.shift(), ['removed', 'foo', 0, {a:2}]);                                             // 1857
  test.equal(operations.shift(), ['added', {a:4}, 1, null]);                                                // 1858
  c.update({a:3}, {a:3.5});                                                                                 // 1859
  test.equal(operations.shift(), ['changed', {a:3.5}, 0, {a:3}]);                                           // 1860
  handle.stop();                                                                                            // 1861
                                                                                                            // 1862
  // test _no_indices                                                                                       // 1863
                                                                                                            // 1864
  c.remove({});                                                                                             // 1865
  handle = c.find({}, {sort: {a: 1}}).observe(_.extend(cbs, {_no_indices: true}));                          // 1866
  c.insert({_id: 'foo', a:1});                                                                              // 1867
  test.equal(operations.shift(), ['added', {a:1}, -1, null]);                                               // 1868
  c.update({a:1}, {$set: {a: 2}});                                                                          // 1869
  test.equal(operations.shift(), ['changed', {a:2}, -1, {a:1}]);                                            // 1870
  c.insert({a:10});                                                                                         // 1871
  test.equal(operations.shift(), ['added', {a:10}, -1, null]);                                              // 1872
  c.update({}, {$inc: {a: 1}}, {multi: true});                                                              // 1873
  test.equal(operations.shift(), ['changed', {a:3}, -1, {a:2}]);                                            // 1874
  test.equal(operations.shift(), ['changed', {a:11}, -1, {a:10}]);                                          // 1875
  c.update({a:11}, {a:1});                                                                                  // 1876
  test.equal(operations.shift(), ['changed', {a:1}, -1, {a:11}]);                                           // 1877
  test.equal(operations.shift(), ['moved', {a:1}, -1, -1, 'foo']);                                          // 1878
  c.remove({a:2});                                                                                          // 1879
  test.equal(operations.shift(), undefined);                                                                // 1880
  c.remove({a:3});                                                                                          // 1881
  test.equal(operations.shift(), ['removed', 'foo', -1, {a:3}]);                                            // 1882
  handle.stop();                                                                                            // 1883
});                                                                                                         // 1884
                                                                                                            // 1885
_.each([true, false], function (ordered) {                                                                  // 1886
  Tinytest.add("minimongo - observe ordered: " + ordered, function (test) {                                 // 1887
    var c = new LocalCollection();                                                                          // 1888
                                                                                                            // 1889
    var ev = "";                                                                                            // 1890
    var makecb = function (tag) {                                                                           // 1891
      var ret = {};                                                                                         // 1892
      _.each(["added", "changed", "removed"], function (fn) {                                               // 1893
        var fnName = ordered ? fn + "At" : fn;                                                              // 1894
        ret[fnName] = function (doc) {                                                                      // 1895
          ev = (ev + fn.substr(0, 1) + tag + doc._id + "_");                                                // 1896
        };                                                                                                  // 1897
      });                                                                                                   // 1898
      return ret;                                                                                           // 1899
    };                                                                                                      // 1900
    var expect = function (x) {                                                                             // 1901
      test.equal(ev, x);                                                                                    // 1902
      ev = "";                                                                                              // 1903
    };                                                                                                      // 1904
                                                                                                            // 1905
    c.insert({_id: 1, name: "strawberry", tags: ["fruit", "red", "squishy"]});                              // 1906
    c.insert({_id: 2, name: "apple", tags: ["fruit", "red", "hard"]});                                      // 1907
    c.insert({_id: 3, name: "rose", tags: ["flower", "red", "squishy"]});                                   // 1908
                                                                                                            // 1909
    // This should work equally well for ordered and unordered observations                                 // 1910
    // (because the callbacks don't look at indices and there's no 'moved'                                  // 1911
    // callback).                                                                                           // 1912
    var handle = c.find({tags: "flower"}).observe(makecb('a'));                                             // 1913
    expect("aa3_");                                                                                         // 1914
    c.update({name: "rose"}, {$set: {tags: ["bloom", "red", "squishy"]}});                                  // 1915
    expect("ra3_");                                                                                         // 1916
    c.update({name: "rose"}, {$set: {tags: ["flower", "red", "squishy"]}});                                 // 1917
    expect("aa3_");                                                                                         // 1918
    c.update({name: "rose"}, {$set: {food: false}});                                                        // 1919
    expect("ca3_");                                                                                         // 1920
    c.remove({});                                                                                           // 1921
    expect("ra3_");                                                                                         // 1922
    c.insert({_id: 4, name: "daisy", tags: ["flower"]});                                                    // 1923
    expect("aa4_");                                                                                         // 1924
    handle.stop();                                                                                          // 1925
    // After calling stop, no more callbacks are called.                                                    // 1926
    c.insert({_id: 5, name: "iris", tags: ["flower"]});                                                     // 1927
    expect("");                                                                                             // 1928
                                                                                                            // 1929
    // Test that observing a lookup by ID works.                                                            // 1930
    handle = c.find(4).observe(makecb('b'));                                                                // 1931
    expect('ab4_');                                                                                         // 1932
    c.update(4, {$set: {eek: 5}});                                                                          // 1933
    expect('cb4_');                                                                                         // 1934
    handle.stop();                                                                                          // 1935
                                                                                                            // 1936
    // Test observe with reactive: false.                                                                   // 1937
    handle = c.find({tags: "flower"}, {reactive: false}).observe(makecb('c'));                              // 1938
    expect('ac4_ac5_');                                                                                     // 1939
    // This insert shouldn't trigger a callback because it's not reactive.                                  // 1940
    c.insert({_id: 6, name: "river", tags: ["flower"]});                                                    // 1941
    expect('');                                                                                             // 1942
    handle.stop();                                                                                          // 1943
  });                                                                                                       // 1944
});                                                                                                         // 1945
                                                                                                            // 1946
                                                                                                            // 1947
Tinytest.add("minimongo - diff changes ordering", function (test) {                                         // 1948
  var makeDocs = function (ids) {                                                                           // 1949
    return _.map(ids, function (id) { return {_id: id};});                                                  // 1950
  };                                                                                                        // 1951
  var testMutation = function (a, b) {                                                                      // 1952
    var aa = makeDocs(a);                                                                                   // 1953
    var bb = makeDocs(b);                                                                                   // 1954
    var aaCopy = EJSON.clone(aa);                                                                           // 1955
    LocalCollection._diffQueryOrderedChanges(aa, bb, {                                                      // 1956
                                                                                                            // 1957
      addedBefore: function (id, doc, before) {                                                             // 1958
        if (before === null) {                                                                              // 1959
          aaCopy.push( _.extend({_id: id}, doc));                                                           // 1960
          return;                                                                                           // 1961
        }                                                                                                   // 1962
        for (var i = 0; i < aaCopy.length; i++) {                                                           // 1963
          if (aaCopy[i]._id === before) {                                                                   // 1964
            aaCopy.splice(i, 0, _.extend({_id: id}, doc));                                                  // 1965
            return;                                                                                         // 1966
          }                                                                                                 // 1967
        }                                                                                                   // 1968
      },                                                                                                    // 1969
      movedBefore: function (id, before) {                                                                  // 1970
        var found;                                                                                          // 1971
        for (var i = 0; i < aaCopy.length; i++) {                                                           // 1972
          if (aaCopy[i]._id === id) {                                                                       // 1973
            found = aaCopy[i];                                                                              // 1974
            aaCopy.splice(i, 1);                                                                            // 1975
          }                                                                                                 // 1976
        }                                                                                                   // 1977
        if (before === null) {                                                                              // 1978
          aaCopy.push( _.extend({_id: id}, found));                                                         // 1979
          return;                                                                                           // 1980
        }                                                                                                   // 1981
        for (i = 0; i < aaCopy.length; i++) {                                                               // 1982
          if (aaCopy[i]._id === before) {                                                                   // 1983
            aaCopy.splice(i, 0, _.extend({_id: id}, found));                                                // 1984
            return;                                                                                         // 1985
          }                                                                                                 // 1986
        }                                                                                                   // 1987
      },                                                                                                    // 1988
      removed: function (id) {                                                                              // 1989
        var found;                                                                                          // 1990
        for (var i = 0; i < aaCopy.length; i++) {                                                           // 1991
          if (aaCopy[i]._id === id) {                                                                       // 1992
            found = aaCopy[i];                                                                              // 1993
            aaCopy.splice(i, 1);                                                                            // 1994
          }                                                                                                 // 1995
        }                                                                                                   // 1996
      }                                                                                                     // 1997
    });                                                                                                     // 1998
    test.equal(aaCopy, bb);                                                                                 // 1999
  };                                                                                                        // 2000
                                                                                                            // 2001
  var testBothWays = function (a, b) {                                                                      // 2002
    testMutation(a, b);                                                                                     // 2003
    testMutation(b, a);                                                                                     // 2004
  };                                                                                                        // 2005
                                                                                                            // 2006
  testBothWays(["a", "b", "c"], ["c", "b", "a"]);                                                           // 2007
  testBothWays(["a", "b", "c"], []);                                                                        // 2008
  testBothWays(["a", "b", "c"], ["e","f"]);                                                                 // 2009
  testBothWays(["a", "b", "c", "d"], ["c", "b", "a"]);                                                      // 2010
  testBothWays(['A','B','C','D','E','F','G','H','I'],                                                       // 2011
               ['A','B','F','G','C','D','I','L','M','N','H']);                                              // 2012
  testBothWays(['A','B','C','D','E','F','G','H','I'],['A','B','C','D','F','G','H','E','I']);                // 2013
});                                                                                                         // 2014
                                                                                                            // 2015
Tinytest.add("minimongo - diff", function (test) {                                                          // 2016
                                                                                                            // 2017
  // test correctness                                                                                       // 2018
                                                                                                            // 2019
  var diffTest = function(origLen, newOldIdx) {                                                             // 2020
    var oldResults = new Array(origLen);                                                                    // 2021
    for (var i = 1; i <= origLen; i++)                                                                      // 2022
      oldResults[i-1] = {_id: i};                                                                           // 2023
                                                                                                            // 2024
    var newResults = _.map(newOldIdx, function(n) {                                                         // 2025
      var doc = {_id: Math.abs(n)};                                                                         // 2026
      if (n < 0)                                                                                            // 2027
        doc.changed = true;                                                                                 // 2028
      return doc;                                                                                           // 2029
    });                                                                                                     // 2030
    var find = function (arr, id) {                                                                         // 2031
      for (var i = 0; i < arr.length; i++) {                                                                // 2032
        if (EJSON.equals(arr[i]._id, id))                                                                   // 2033
          return i;                                                                                         // 2034
      }                                                                                                     // 2035
      return -1;                                                                                            // 2036
    };                                                                                                      // 2037
                                                                                                            // 2038
    var results = _.clone(oldResults);                                                                      // 2039
    var observer = {                                                                                        // 2040
      addedBefore: function(id, fields, before) {                                                           // 2041
        var before_idx;                                                                                     // 2042
        if (before === null)                                                                                // 2043
          before_idx = results.length;                                                                      // 2044
        else                                                                                                // 2045
          before_idx = find (results, before);                                                              // 2046
        var doc = _.extend({_id: id}, fields);                                                              // 2047
        test.isFalse(before_idx < 0 || before_idx > results.length);                                        // 2048
        results.splice(before_idx, 0, doc);                                                                 // 2049
      },                                                                                                    // 2050
      removed: function(id) {                                                                               // 2051
        var at_idx = find (results, id);                                                                    // 2052
        test.isFalse(at_idx < 0 || at_idx >= results.length);                                               // 2053
        results.splice(at_idx, 1);                                                                          // 2054
      },                                                                                                    // 2055
      changed: function(id, fields) {                                                                       // 2056
        var at_idx = find (results, id);                                                                    // 2057
        var oldDoc = results[at_idx];                                                                       // 2058
        var doc = EJSON.clone(oldDoc);                                                                      // 2059
        LocalCollection._applyChanges(doc, fields);                                                         // 2060
        test.isFalse(at_idx < 0 || at_idx >= results.length);                                               // 2061
        test.equal(doc._id, oldDoc._id);                                                                    // 2062
        results[at_idx] = doc;                                                                              // 2063
      },                                                                                                    // 2064
      movedBefore: function(id, before) {                                                                   // 2065
        var old_idx = find(results, id);                                                                    // 2066
        var new_idx;                                                                                        // 2067
        if (before === null)                                                                                // 2068
          new_idx = results.length;                                                                         // 2069
        else                                                                                                // 2070
          new_idx = find (results, before);                                                                 // 2071
        if (new_idx > old_idx)                                                                              // 2072
          new_idx--;                                                                                        // 2073
        test.isFalse(old_idx < 0 || old_idx >= results.length);                                             // 2074
        test.isFalse(new_idx < 0 || new_idx >= results.length);                                             // 2075
        results.splice(new_idx, 0, results.splice(old_idx, 1)[0]);                                          // 2076
      }                                                                                                     // 2077
    };                                                                                                      // 2078
                                                                                                            // 2079
    LocalCollection._diffQueryOrderedChanges(oldResults, newResults, observer);                             // 2080
    test.equal(results, newResults);                                                                        // 2081
  };                                                                                                        // 2082
                                                                                                            // 2083
  // edge cases and cases run into during debugging                                                         // 2084
  diffTest(5, [5, 1, 2, 3, 4]);                                                                             // 2085
  diffTest(0, [1, 2, 3, 4]);                                                                                // 2086
  diffTest(4, []);                                                                                          // 2087
  diffTest(7, [4, 5, 6, 7, 1, 2, 3]);                                                                       // 2088
  diffTest(7, [5, 6, 7, 1, 2, 3, 4]);                                                                       // 2089
  diffTest(10, [7, 4, 11, 6, 12, 1, 5]);                                                                    // 2090
  diffTest(3, [3, 2, 1]);                                                                                   // 2091
  diffTest(10, [2, 7, 4, 6, 11, 3, 8, 9]);                                                                  // 2092
  diffTest(0, []);                                                                                          // 2093
  diffTest(1, []);                                                                                          // 2094
  diffTest(0, [1]);                                                                                         // 2095
  diffTest(1, [1]);                                                                                         // 2096
  diffTest(5, [1, 2, 3, 4, 5]);                                                                             // 2097
                                                                                                            // 2098
  // interaction between "changed" and other ops                                                            // 2099
  diffTest(5, [-5, -1, 2, -3, 4]);                                                                          // 2100
  diffTest(7, [-4, -5, 6, 7, -1, 2, 3]);                                                                    // 2101
  diffTest(7, [5, 6, -7, 1, 2, -3, 4]);                                                                     // 2102
  diffTest(10, [7, -4, 11, 6, 12, -1, 5]);                                                                  // 2103
  diffTest(3, [-3, -2, -1]);                                                                                // 2104
  diffTest(10, [-2, 7, 4, 6, 11, -3, -8, 9]);                                                               // 2105
});                                                                                                         // 2106
                                                                                                            // 2107
                                                                                                            // 2108
Tinytest.add("minimongo - saveOriginals", function (test) {                                                 // 2109
  // set up some data                                                                                       // 2110
  var c = new LocalCollection(),                                                                            // 2111
      count;                                                                                                // 2112
  c.insert({_id: 'foo', x: 'untouched'});                                                                   // 2113
  c.insert({_id: 'bar', x: 'updateme'});                                                                    // 2114
  c.insert({_id: 'baz', x: 'updateme'});                                                                    // 2115
  c.insert({_id: 'quux', y: 'removeme'});                                                                   // 2116
  c.insert({_id: 'whoa', y: 'removeme'});                                                                   // 2117
                                                                                                            // 2118
  // Save originals and make some changes.                                                                  // 2119
  c.saveOriginals();                                                                                        // 2120
  c.insert({_id: "hooray", z: 'insertme'});                                                                 // 2121
  c.remove({y: 'removeme'});                                                                                // 2122
  count = c.update({x: 'updateme'}, {$set: {z: 5}}, {multi: true});                                         // 2123
  c.update('bar', {$set: {k: 7}});  // update same doc twice                                                // 2124
                                                                                                            // 2125
  // Verify returned count is correct                                                                       // 2126
  test.equal(count, 2);                                                                                     // 2127
                                                                                                            // 2128
  // Verify the originals.                                                                                  // 2129
  var originals = c.retrieveOriginals();                                                                    // 2130
  var affected = ['bar', 'baz', 'quux', 'whoa', 'hooray'];                                                  // 2131
  test.equal(_.size(originals), _.size(affected));                                                          // 2132
  _.each(affected, function (id) {                                                                          // 2133
    test.isTrue(_.has(originals, id));                                                                      // 2134
  });                                                                                                       // 2135
  test.equal(originals.bar, {_id: 'bar', x: 'updateme'});                                                   // 2136
  test.equal(originals.baz, {_id: 'baz', x: 'updateme'});                                                   // 2137
  test.equal(originals.quux, {_id: 'quux', y: 'removeme'});                                                 // 2138
  test.equal(originals.whoa, {_id: 'whoa', y: 'removeme'});                                                 // 2139
  test.equal(originals.hooray, undefined);                                                                  // 2140
                                                                                                            // 2141
  // Verify that changes actually occured.                                                                  // 2142
  test.equal(c.find().count(), 4);                                                                          // 2143
  test.equal(c.findOne('foo'), {_id: 'foo', x: 'untouched'});                                               // 2144
  test.equal(c.findOne('bar'), {_id: 'bar', x: 'updateme', z: 5, k: 7});                                    // 2145
  test.equal(c.findOne('baz'), {_id: 'baz', x: 'updateme', z: 5});                                          // 2146
  test.equal(c.findOne('hooray'), {_id: 'hooray', z: 'insertme'});                                          // 2147
                                                                                                            // 2148
  // The next call doesn't get the same originals again.                                                    // 2149
  c.saveOriginals();                                                                                        // 2150
  originals = c.retrieveOriginals();                                                                        // 2151
  test.isTrue(originals);                                                                                   // 2152
  test.isTrue(_.isEmpty(originals));                                                                        // 2153
                                                                                                            // 2154
  // Insert and remove a document during the period.                                                        // 2155
  c.saveOriginals();                                                                                        // 2156
  c.insert({_id: 'temp', q: 8});                                                                            // 2157
  c.remove('temp');                                                                                         // 2158
  originals = c.retrieveOriginals();                                                                        // 2159
  test.equal(_.size(originals), 1);                                                                         // 2160
  test.isTrue(_.has(originals, 'temp'));                                                                    // 2161
  test.equal(originals.temp, undefined);                                                                    // 2162
});                                                                                                         // 2163
                                                                                                            // 2164
Tinytest.add("minimongo - saveOriginals errors", function (test) {                                          // 2165
  var c = new LocalCollection();                                                                            // 2166
  // Can't call retrieve before save.                                                                       // 2167
  test.throws(function () { c.retrieveOriginals(); });                                                      // 2168
  c.saveOriginals();                                                                                        // 2169
  // Can't call save twice.                                                                                 // 2170
  test.throws(function () { c.saveOriginals(); });                                                          // 2171
});                                                                                                         // 2172
                                                                                                            // 2173
Tinytest.add("minimongo - objectid transformation", function (test) {                                       // 2174
  var testId = function (item) {                                                                            // 2175
    test.equal(item, LocalCollection._idParse(LocalCollection._idStringify(item)));                         // 2176
  };                                                                                                        // 2177
  var randomOid = new LocalCollection._ObjectID();                                                          // 2178
  testId(randomOid);                                                                                        // 2179
  testId("FOO");                                                                                            // 2180
  testId("ffffffffffff");                                                                                   // 2181
  testId("0987654321abcdef09876543");                                                                       // 2182
  testId(new LocalCollection._ObjectID());                                                                  // 2183
  testId("--a string");                                                                                     // 2184
                                                                                                            // 2185
  test.equal("ffffffffffff", LocalCollection._idParse(LocalCollection._idStringify("ffffffffffff")));       // 2186
});                                                                                                         // 2187
                                                                                                            // 2188
                                                                                                            // 2189
Tinytest.add("minimongo - objectid", function (test) {                                                      // 2190
  var randomOid = new LocalCollection._ObjectID();                                                          // 2191
  var anotherRandomOid = new LocalCollection._ObjectID();                                                   // 2192
  test.notEqual(randomOid, anotherRandomOid);                                                               // 2193
  test.throws(function() { new LocalCollection._ObjectID("qqqqqqqqqqqqqqqqqqqqqqqq");});                    // 2194
  test.throws(function() { new LocalCollection._ObjectID("ABCDEF"); });                                     // 2195
  test.equal(randomOid, new LocalCollection._ObjectID(randomOid.valueOf()));                                // 2196
});                                                                                                         // 2197
                                                                                                            // 2198
Tinytest.add("minimongo - pause", function (test) {                                                         // 2199
  var operations = [];                                                                                      // 2200
  var cbs = log_callbacks(operations);                                                                      // 2201
                                                                                                            // 2202
  var c = new LocalCollection();                                                                            // 2203
  var h = c.find({}).observe(cbs);                                                                          // 2204
                                                                                                            // 2205
  // remove and add cancel out.                                                                             // 2206
  c.insert({_id: 1, a: 1});                                                                                 // 2207
  test.equal(operations.shift(), ['added', {a:1}, 0, null]);                                                // 2208
                                                                                                            // 2209
  c.pauseObservers();                                                                                       // 2210
                                                                                                            // 2211
  c.remove({_id: 1});                                                                                       // 2212
  test.length(operations, 0);                                                                               // 2213
  c.insert({_id: 1, a: 1});                                                                                 // 2214
  test.length(operations, 0);                                                                               // 2215
                                                                                                            // 2216
  c.resumeObservers();                                                                                      // 2217
  test.length(operations, 0);                                                                               // 2218
                                                                                                            // 2219
                                                                                                            // 2220
  // two modifications become one                                                                           // 2221
  c.pauseObservers();                                                                                       // 2222
                                                                                                            // 2223
  c.update({_id: 1}, {a: 2});                                                                               // 2224
  c.update({_id: 1}, {a: 3});                                                                               // 2225
                                                                                                            // 2226
  c.resumeObservers();                                                                                      // 2227
  test.equal(operations.shift(), ['changed', {a:3}, 0, {a:1}]);                                             // 2228
  test.length(operations, 0);                                                                               // 2229
                                                                                                            // 2230
  h.stop();                                                                                                 // 2231
});                                                                                                         // 2232
                                                                                                            // 2233
Tinytest.add("minimongo - ids matched by selector", function (test) {                                       // 2234
  var check = function (selector, ids) {                                                                    // 2235
    var idsFromSelector = LocalCollection._idsMatchedBySelector(selector);                                  // 2236
    // XXX normalize order, in a way that also works for ObjectIDs?                                         // 2237
    test.equal(idsFromSelector, ids);                                                                       // 2238
  };                                                                                                        // 2239
  check("foo", ["foo"]);                                                                                    // 2240
  check({_id: "foo"}, ["foo"]);                                                                             // 2241
  var oid1 = new LocalCollection._ObjectID();                                                               // 2242
  check(oid1, [oid1]);                                                                                      // 2243
  check({_id: oid1}, [oid1]);                                                                               // 2244
  check({_id: "foo", x: 42}, ["foo"]);                                                                      // 2245
  check({}, null);                                                                                          // 2246
  check({_id: {$in: ["foo", oid1]}}, ["foo", oid1]);                                                        // 2247
  check({_id: {$ne: "foo"}}, null);                                                                         // 2248
  // not actually valid, but works for now...                                                               // 2249
  check({$and: ["foo"]}, ["foo"]);                                                                          // 2250
  check({$and: [{x: 42}, {_id: oid1}]}, [oid1]);                                                            // 2251
  check({$and: [{x: 42}, {_id: {$in: [oid1]}}]}, [oid1]);                                                   // 2252
});                                                                                                         // 2253
                                                                                                            // 2254
Tinytest.add("minimongo - reactive stop", function (test) {                                                 // 2255
  var coll = new LocalCollection();                                                                         // 2256
  coll.insert({_id: 'A'});                                                                                  // 2257
  coll.insert({_id: 'B'});                                                                                  // 2258
  coll.insert({_id: 'C'});                                                                                  // 2259
                                                                                                            // 2260
  var addBefore = function (str, newChar, before) {                                                         // 2261
    var idx = str.indexOf(before);                                                                          // 2262
    if (idx === -1)                                                                                         // 2263
      return str + newChar;                                                                                 // 2264
    return str.slice(0, idx) + newChar + str.slice(idx);                                                    // 2265
  };                                                                                                        // 2266
                                                                                                            // 2267
  var x, y;                                                                                                 // 2268
  var sortOrder = ReactiveVar(1);                                                                           // 2269
                                                                                                            // 2270
  var c = Deps.autorun(function () {                                                                        // 2271
    var q = coll.find({}, {sort: {_id: sortOrder.get()}});                                                  // 2272
    x = "";                                                                                                 // 2273
    q.observe({ addedAt: function (doc, atIndex, before) {                                                  // 2274
      x = addBefore(x, doc._id, before);                                                                    // 2275
    }});                                                                                                    // 2276
    y = "";                                                                                                 // 2277
    q.observeChanges({ addedBefore: function (id, fields, before) {                                         // 2278
      y = addBefore(y, id, before);                                                                         // 2279
    }});                                                                                                    // 2280
  });                                                                                                       // 2281
                                                                                                            // 2282
  test.equal(x, "ABC");                                                                                     // 2283
  test.equal(y, "ABC");                                                                                     // 2284
                                                                                                            // 2285
  sortOrder.set(-1);                                                                                        // 2286
  test.equal(x, "ABC");                                                                                     // 2287
  test.equal(y, "ABC");                                                                                     // 2288
  Deps.flush();                                                                                             // 2289
  test.equal(x, "CBA");                                                                                     // 2290
  test.equal(y, "CBA");                                                                                     // 2291
                                                                                                            // 2292
  coll.insert({_id: 'D'});                                                                                  // 2293
  coll.insert({_id: 'E'});                                                                                  // 2294
  test.equal(x, "EDCBA");                                                                                   // 2295
  test.equal(y, "EDCBA");                                                                                   // 2296
                                                                                                            // 2297
  c.stop();                                                                                                 // 2298
  // stopping kills the observes immediately                                                                // 2299
  coll.insert({_id: 'F'});                                                                                  // 2300
  test.equal(x, "EDCBA");                                                                                   // 2301
  test.equal(y, "EDCBA");                                                                                   // 2302
});                                                                                                         // 2303
                                                                                                            // 2304
Tinytest.add("minimongo - immediate invalidate", function (test) {                                          // 2305
  var coll = new LocalCollection();                                                                         // 2306
  coll.insert({_id: 'A'});                                                                                  // 2307
                                                                                                            // 2308
  // This has two separate findOnes.  findOne() uses skip/limit, which means                                // 2309
  // that its response to an update() call involves a recompute. We used to have                            // 2310
  // a bug where we would first calculate all the calls that need to be                                     // 2311
  // recomputed, then recompute them one by one, without checking to see if the                             // 2312
  // callbacks from recomputing one query stopped the second query, which                                   // 2313
  // crashed.                                                                                               // 2314
  var c = Deps.autorun(function () {                                                                        // 2315
    coll.findOne('A');                                                                                      // 2316
    coll.findOne('A');                                                                                      // 2317
  });                                                                                                       // 2318
                                                                                                            // 2319
  coll.update('A', {$set: {x: 42}});                                                                        // 2320
                                                                                                            // 2321
  c.stop();                                                                                                 // 2322
});                                                                                                         // 2323
                                                                                                            // 2324
                                                                                                            // 2325
Tinytest.add("minimongo - count on cursor with limit", function(test){                                      // 2326
  var coll = new LocalCollection(), count;                                                                  // 2327
                                                                                                            // 2328
  coll.insert({_id: 'A'});                                                                                  // 2329
  coll.insert({_id: 'B'});                                                                                  // 2330
  coll.insert({_id: 'C'});                                                                                  // 2331
  coll.insert({_id: 'D'});                                                                                  // 2332
                                                                                                            // 2333
  var c = Deps.autorun(function (c) {                                                                       // 2334
    var cursor = coll.find({_id: {$exists: true}}, {sort: {_id: 1}, limit: 3});                             // 2335
    count = cursor.count();                                                                                 // 2336
  });                                                                                                       // 2337
                                                                                                            // 2338
  test.equal(count, 3);                                                                                     // 2339
                                                                                                            // 2340
  coll.remove('A'); // still 3 in the collection                                                            // 2341
  Deps.flush();                                                                                             // 2342
  test.equal(count, 3);                                                                                     // 2343
                                                                                                            // 2344
  coll.remove('B'); // expect count now 2                                                                   // 2345
  Deps.flush();                                                                                             // 2346
  test.equal(count, 2);                                                                                     // 2347
                                                                                                            // 2348
                                                                                                            // 2349
  coll.insert({_id: 'A'}); // now 3 again                                                                   // 2350
  Deps.flush();                                                                                             // 2351
  test.equal(count, 3);                                                                                     // 2352
                                                                                                            // 2353
  coll.insert({_id: 'B'}); // now 4 entries, but count should be 3 still                                    // 2354
  Deps.flush();                                                                                             // 2355
  test.equal(count, 3);                                                                                     // 2356
                                                                                                            // 2357
  c.stop();                                                                                                 // 2358
                                                                                                            // 2359
});                                                                                                         // 2360
                                                                                                            // 2361
Tinytest.add("minimongo - $near operator tests", function (test) {                                          // 2362
  var coll = new LocalCollection();                                                                         // 2363
  coll.insert({ rest: { loc: [2, 3] } });                                                                   // 2364
  coll.insert({ rest: { loc: [-3, 3] } });                                                                  // 2365
  coll.insert({ rest: { loc: [5, 5] } });                                                                   // 2366
                                                                                                            // 2367
  test.equal(coll.find({ 'rest.loc': { $near: [0, 0], $maxDistance: 30 } }).count(), 3);                    // 2368
  test.equal(coll.find({ 'rest.loc': { $near: [0, 0], $maxDistance: 4 } }).count(), 1);                     // 2369
  var points = coll.find({ 'rest.loc': { $near: [0, 0], $maxDistance: 6 } }).fetch();                       // 2370
  _.each(points, function (point, i, points) {                                                              // 2371
    test.isTrue(!i || distance([0, 0], point.rest.loc) >= distance([0, 0], points[i - 1].rest.loc));        // 2372
  });                                                                                                       // 2373
                                                                                                            // 2374
  function distance(a, b) {                                                                                 // 2375
    var x = a[0] - b[0];                                                                                    // 2376
    var y = a[1] - b[1];                                                                                    // 2377
    return Math.sqrt(x * x + y * y);                                                                        // 2378
  }                                                                                                         // 2379
                                                                                                            // 2380
  // GeoJSON tests                                                                                          // 2381
  coll = new LocalCollection();                                                                             // 2382
  var data = [{ "category" : "BURGLARY", "descript" : "BURGLARY OF STORE, FORCIBLE ENTRY", "address" : "100 Block of 10TH ST", "location" : { "type" : "Point", "coordinates" : [  -122.415449723856,  37.7749518087273 ] } },
    { "category" : "WEAPON LAWS", "descript" : "POSS OF PROHIBITED WEAPON", "address" : "900 Block of MINNA ST", "location" : { "type" : "Point", "coordinates" : [  -122.415386041221,  37.7747879744156 ] } },
    { "category" : "LARCENY/THEFT", "descript" : "GRAND THEFT OF PROPERTY", "address" : "900 Block of MINNA ST", "location" : { "type" : "Point", "coordinates" : [  -122.41538270191,  37.774683628213 ] } },
    { "category" : "LARCENY/THEFT", "descript" : "PETTY THEFT FROM LOCKED AUTO", "address" : "900 Block of MINNA ST", "location" : { "type" : "Point", "coordinates" : [  -122.415396041221,  37.7747879744156 ] } },
    { "category" : "OTHER OFFENSES", "descript" : "POSSESSION OF BURGLARY TOOLS", "address" : "900 Block of MINNA ST", "location" : { "type" : "Point", "coordinates" : [  -122.415386041221,  37.7747879734156 ] } }
  ];                                                                                                        // 2388
                                                                                                            // 2389
  _.each(data, function (x, i) { coll.insert(_.extend(x, { x: i })); });                                    // 2390
                                                                                                            // 2391
  var close15 = coll.find({ location: { $near: {                                                            // 2392
    $geometry: { type: "Point",                                                                             // 2393
                 coordinates: [-122.4154282, 37.7746115] },                                                 // 2394
    $maxDistance: 15 } } }).fetch();                                                                        // 2395
  test.length(close15, 1);                                                                                  // 2396
  test.equal(close15[0].descript, "GRAND THEFT OF PROPERTY");                                               // 2397
                                                                                                            // 2398
  var close20 = coll.find({ location: { $near: {                                                            // 2399
    $geometry: { type: "Point",                                                                             // 2400
                 coordinates: [-122.4154282, 37.7746115] },                                                 // 2401
    $maxDistance: 20 } } }).fetch();                                                                        // 2402
  test.length(close20, 4);                                                                                  // 2403
  test.equal(close20[0].descript, "GRAND THEFT OF PROPERTY");                                               // 2404
  test.equal(close20[1].descript, "PETTY THEFT FROM LOCKED AUTO");                                          // 2405
  test.equal(close20[2].descript, "POSSESSION OF BURGLARY TOOLS");                                          // 2406
  test.equal(close20[3].descript, "POSS OF PROHIBITED WEAPON");                                             // 2407
                                                                                                            // 2408
  // Any combinations of $near with $or/$and/$nor/$not should throw an error                                // 2409
  test.throws(function () {                                                                                 // 2410
    coll.find({ location: {                                                                                 // 2411
      $not: {                                                                                               // 2412
        $near: {                                                                                            // 2413
          $geometry: {                                                                                      // 2414
            type: "Point",                                                                                  // 2415
            coordinates: [-122.4154282, 37.7746115]                                                         // 2416
          }, $maxDistance: 20 } } } });                                                                     // 2417
  });                                                                                                       // 2418
  test.throws(function () {                                                                                 // 2419
    coll.find({                                                                                             // 2420
      $and: [ { location: { $near: { $geometry: { type: "Point", coordinates: [-122.4154282, 37.7746115] }, $maxDistance: 20 }}},
              { x: 0 }]                                                                                     // 2422
    });                                                                                                     // 2423
  });                                                                                                       // 2424
  test.throws(function () {                                                                                 // 2425
    coll.find({                                                                                             // 2426
      $or: [ { location: { $near: { $geometry: { type: "Point", coordinates: [-122.4154282, 37.7746115] }, $maxDistance: 20 }}},
             { x: 0 }]                                                                                      // 2428
    });                                                                                                     // 2429
  });                                                                                                       // 2430
  test.throws(function () {                                                                                 // 2431
    coll.find({                                                                                             // 2432
      $nor: [ { location: { $near: { $geometry: { type: "Point", coordinates: [-122.4154282, 37.7746115] }, $maxDistance: 1 }}},
              { x: 0 }]                                                                                     // 2434
    });                                                                                                     // 2435
  });                                                                                                       // 2436
  test.throws(function () {                                                                                 // 2437
    coll.find({                                                                                             // 2438
      $and: [{                                                                                              // 2439
        $and: [{                                                                                            // 2440
          location: {                                                                                       // 2441
            $near: {                                                                                        // 2442
              $geometry: {                                                                                  // 2443
                type: "Point",                                                                              // 2444
                coordinates: [-122.4154282, 37.7746115]                                                     // 2445
              },                                                                                            // 2446
              $maxDistance: 1                                                                               // 2447
            }                                                                                               // 2448
          }                                                                                                 // 2449
        }]                                                                                                  // 2450
      }]                                                                                                    // 2451
    });                                                                                                     // 2452
  });                                                                                                       // 2453
});                                                                                                         // 2454
                                                                                                            // 2455
                                                                                                            // 2456
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
