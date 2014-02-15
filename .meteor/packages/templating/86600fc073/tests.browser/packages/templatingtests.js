(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/templating/templating_tests.js                                                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
                                                                                                                      // 1
Tinytest.add("templating - assembly", function (test) {                                                               // 2
                                                                                                                      // 3
  // Test for a bug that made it to production -- after a replacement,                                                // 4
  // we need to also check the newly replaced node for replacements                                                   // 5
  var frag = Meteor.render(Template.test_assembly_a0);                                                                // 6
  test.equal(canonicalizeHtml(DomUtils.fragmentToHtml(frag)),                                                         // 7
               "Hi");                                                                                                 // 8
                                                                                                                      // 9
  // Another production bug -- we must use LiveRange to replace the                                                   // 10
  // placeholder, or risk breaking other LiveRanges                                                                   // 11
  Session.set("stuff", true); // XXX bad form to use Session in a test?                                               // 12
  Template.test_assembly_b1.stuff = function () {                                                                     // 13
    return Session.get("stuff");                                                                                      // 14
  };                                                                                                                  // 15
  var onscreen = DIV({style: "display: none"}, [                                                                      // 16
    Meteor.render(Template.test_assembly_b0)]);                                                                       // 17
  document.body.appendChild(onscreen);                                                                                // 18
  test.equal(canonicalizeHtml(onscreen.innerHTML), "xyhi");                                                           // 19
  Session.set("stuff", false);                                                                                        // 20
  Deps.flush();                                                                                                       // 21
  test.equal(canonicalizeHtml(onscreen.innerHTML), "xhi");                                                            // 22
  document.body.removeChild(onscreen);                                                                                // 23
  Deps.flush();                                                                                                       // 24
});                                                                                                                   // 25
                                                                                                                      // 26
// Test that if a template throws an error, then pending_partials is                                                  // 27
// cleaned up properly (that template rendering doesn't break..)                                                      // 28
                                                                                                                      // 29
                                                                                                                      // 30
                                                                                                                      // 31
                                                                                                                      // 32
                                                                                                                      // 33
                                                                                                                      // 34
Tinytest.add("templating - table assembly", function(test) {                                                          // 35
  var childWithTag = function(node, tag) {                                                                            // 36
    return _.find(node.childNodes, function(n) {                                                                      // 37
      return n.nodeName === tag;                                                                                      // 38
    });                                                                                                               // 39
  };                                                                                                                  // 40
                                                                                                                      // 41
  var table;                                                                                                          // 42
                                                                                                                      // 43
  table = childWithTag(Meteor.render(Template.test_table_a0), "TABLE");                                               // 44
                                                                                                                      // 45
  // table.rows is a great test, as it fails not only when TR/TD tags are                                             // 46
  // stripped due to improper html-to-fragment, but also when they are present                                        // 47
  // but don't show up because we didn't create a TBODY for IE.                                                       // 48
  test.equal(table.rows.length, 3);                                                                                   // 49
                                                                                                                      // 50
  // this time with an explicit TBODY                                                                                 // 51
  table = childWithTag(Meteor.render(Template.test_table_b0), "TABLE");                                               // 52
  test.equal(table.rows.length, 3);                                                                                   // 53
                                                                                                                      // 54
  var c = new LocalCollection();                                                                                      // 55
  c.insert({bar:'a'});                                                                                                // 56
  c.insert({bar:'b'});                                                                                                // 57
  c.insert({bar:'c'});                                                                                                // 58
  var onscreen = DIV({style: "display: none;"});                                                                      // 59
  onscreen.appendChild(                                                                                               // 60
    Meteor.render(_.bind(Template.test_table_each, null, {foo: c.find()})));                                          // 61
  document.body.appendChild(onscreen);                                                                                // 62
  table = childWithTag(onscreen, "TABLE");                                                                            // 63
                                                                                                                      // 64
  test.equal(table.rows.length, 3, table.parentNode.innerHTML);                                                       // 65
  var tds = onscreen.getElementsByTagName("TD");                                                                      // 66
  test.equal(tds.length, 3);                                                                                          // 67
  test.equal(tds[0].innerHTML, "a");                                                                                  // 68
  test.equal(tds[1].innerHTML, "b");                                                                                  // 69
  test.equal(tds[2].innerHTML, "c");                                                                                  // 70
                                                                                                                      // 71
                                                                                                                      // 72
  document.body.removeChild(onscreen);                                                                                // 73
  Deps.flush();                                                                                                       // 74
});                                                                                                                   // 75
                                                                                                                      // 76
Tinytest.add("templating - event handler this", function(test) {                                                      // 77
                                                                                                                      // 78
  Template.test_event_data_with.ONE = {str: "one"};                                                                   // 79
  Template.test_event_data_with.TWO = {str: "two"};                                                                   // 80
  Template.test_event_data_with.THREE = {str: "three"};                                                               // 81
                                                                                                                      // 82
  Template.test_event_data_with.events({                                                                              // 83
    'click': function(event, template) {                                                                              // 84
      test.isTrue(this.str);                                                                                          // 85
      test.equal(template.data.str, "one");                                                                           // 86
      event_buf.push(this.str);                                                                                       // 87
    }                                                                                                                 // 88
  });                                                                                                                 // 89
                                                                                                                      // 90
  var event_buf = [];                                                                                                 // 91
  var tmpl = OnscreenDiv(                                                                                             // 92
    Meteor.render(function () {                                                                                       // 93
      return Template.test_event_data_with(                                                                           // 94
        Template.test_event_data_with.ONE);                                                                           // 95
    }));                                                                                                              // 96
                                                                                                                      // 97
  var divs = tmpl.node().getElementsByTagName("div");                                                                 // 98
  test.equal(3, divs.length);                                                                                         // 99
                                                                                                                      // 100
  clickElement(divs[0]);                                                                                              // 101
  test.equal(event_buf, ['one']);                                                                                     // 102
  event_buf.length = 0;                                                                                               // 103
                                                                                                                      // 104
  clickElement(divs[1]);                                                                                              // 105
  test.equal(event_buf, ['two']);                                                                                     // 106
  event_buf.length = 0;                                                                                               // 107
                                                                                                                      // 108
  clickElement(divs[2]);                                                                                              // 109
  test.equal(event_buf, ['three']);                                                                                   // 110
  event_buf.length = 0;                                                                                               // 111
                                                                                                                      // 112
  tmpl.kill();                                                                                                        // 113
  Deps.flush();                                                                                                       // 114
});                                                                                                                   // 115
                                                                                                                      // 116
Tinytest.add("templating - safestring", function(test) {                                                              // 117
                                                                                                                      // 118
  Template.test_safestring_a.foo = function() {                                                                       // 119
    return "1<2";                                                                                                     // 120
  };                                                                                                                  // 121
  Template.test_safestring_a.bar = function() {                                                                       // 122
    return new Handlebars.SafeString("3<4");                                                                          // 123
  };                                                                                                                  // 124
                                                                                                                      // 125
  var obj = {fooprop: "1<2",                                                                                          // 126
             barprop: new Handlebars.SafeString("3<4")};                                                              // 127
                                                                                                                      // 128
  test.equal(Template.test_safestring_a(obj).replace(/\s+/g, ' '),                                                    // 129
             "1&lt;2 1<2 3<4 3<4 1<2 3<4 "+                                                                           // 130
             "1&lt;2 1<2 3<4 3<4 1<2 3<4");                                                                           // 131
                                                                                                                      // 132
});                                                                                                                   // 133
                                                                                                                      // 134
Tinytest.add("templating - helpers and dots", function(test) {                                                        // 135
  Handlebars.registerHelper("platypus", function() {                                                                  // 136
    return "eggs";                                                                                                    // 137
  });                                                                                                                 // 138
  Handlebars.registerHelper("watermelon", function() {                                                                // 139
    return "seeds";                                                                                                   // 140
  });                                                                                                                 // 141
                                                                                                                      // 142
  Handlebars.registerHelper("daisygetter", function() {                                                               // 143
    return this.daisy;                                                                                                // 144
  });                                                                                                                 // 145
                                                                                                                      // 146
  // XXX for debugging                                                                                                // 147
  Handlebars.registerHelper("debugger", function() {                                                                  // 148
    debugger;                                                                                                         // 149
  });                                                                                                                 // 150
                                                                                                                      // 151
  var getFancyObject = function() {                                                                                   // 152
    return {                                                                                                          // 153
      foo: 'bar',                                                                                                     // 154
      apple: {banana: 'smoothie'},                                                                                    // 155
      currentFruit: function() {                                                                                      // 156
        return 'guava';                                                                                               // 157
      },                                                                                                              // 158
      currentCountry: function() {                                                                                    // 159
        return {name: 'Iceland',                                                                                      // 160
                _pop: 321007,                                                                                         // 161
                population: function() {                                                                              // 162
                  return this._pop;                                                                                   // 163
                },                                                                                                    // 164
                unicorns: 0, // falsy value                                                                           // 165
                daisyGetter: function() {                                                                             // 166
                  return this.daisy;                                                                                  // 167
                }                                                                                                     // 168
               };                                                                                                     // 169
      }                                                                                                               // 170
    };                                                                                                                // 171
  };                                                                                                                  // 172
                                                                                                                      // 173
  Handlebars.registerHelper("fancyhelper", getFancyObject);                                                           // 174
                                                                                                                      // 175
  Template.test_helpers_a.platypus = 'bill';                                                                          // 176
  Template.test_helpers_a.warthog = function() {                                                                      // 177
    return 'snout';                                                                                                   // 178
  };                                                                                                                  // 179
                                                                                                                      // 180
  var listFour = function(a, b, c, d, options) {                                                                      // 181
    var keywordArgs = _.map(_.keys(options.hash), function(k) {                                                       // 182
      return k+':'+options.hash[k];                                                                                   // 183
    });                                                                                                               // 184
    return [a, b, c, d].concat(keywordArgs).join(' ');                                                                // 185
  };                                                                                                                  // 186
                                                                                                                      // 187
  var dataObj = {                                                                                                     // 188
    zero: 0,                                                                                                          // 189
    platypus: 'weird',                                                                                                // 190
    watermelon: 'rind',                                                                                               // 191
    daisy: 'petal',                                                                                                   // 192
    tree: function() { return 'leaf'; },                                                                              // 193
    thisTest: function() { return this.tree(); },                                                                     // 194
    getNull: function() { return null; },                                                                             // 195
    getUndefined: function () { return; },                                                                            // 196
    fancy: getFancyObject(),                                                                                          // 197
    methodListFour: listFour                                                                                          // 198
  };                                                                                                                  // 199
                                                                                                                      // 200
  test.equal(Template.test_helpers_a(dataObj).match(/\S+/g), [                                                        // 201
    'platypus=bill', // helpers on Template object take first priority                                                // 202
    'watermelon=seeds', // global helpers take second priority                                                        // 203
    'daisy=petal', // unshadowed object property                                                                      // 204
    'tree=leaf', // function object property                                                                          // 205
    'warthog=snout' // function Template property                                                                     // 206
  ]);                                                                                                                 // 207
                                                                                                                      // 208
  test.equal(Template.test_helpers_b(dataObj).match(/\S+/g), [                                                        // 209
    // unknown properties silently fail                                                                               // 210
    'unknown=',                                                                                                       // 211
    // falsy property comes through                                                                                   // 212
    'zero=0'                                                                                                          // 213
  ]);                                                                                                                 // 214
                                                                                                                      // 215
  test.equal(Template.test_helpers_c(dataObj).match(/\S+/g), [                                                        // 216
    // property gets are supposed to silently fail                                                                    // 217
    'platypus.X=',                                                                                                    // 218
    'watermelon.X=',                                                                                                  // 219
    'daisy.X=',                                                                                                       // 220
    'tree.X=',                                                                                                        // 221
    'warthog.X=',                                                                                                     // 222
    'getNull.X=',                                                                                                     // 223
    'getUndefined.X=',                                                                                                // 224
    'getUndefined.X.Y='                                                                                               // 225
  ]);                                                                                                                 // 226
                                                                                                                      // 227
  test.equal(Template.test_helpers_d(dataObj).match(/\S+/g), [                                                        // 228
    // helpers should get current data context in `this`                                                              // 229
    'daisygetter=petal',                                                                                              // 230
    // object methods should get object in `this`                                                                     // 231
    'thisTest=leaf',                                                                                                  // 232
    // nesting inside {{#with fancy}} shouldn't affect                                                                // 233
    // method                                                                                                         // 234
    '../thisTest=leaf',                                                                                               // 235
    // combine .. and .                                                                                               // 236
    '../fancy.currentFruit=guava'                                                                                     // 237
  ]);                                                                                                                 // 238
                                                                                                                      // 239
  test.equal(Template.test_helpers_e(dataObj).match(/\S+/g), [                                                        // 240
    'fancy.foo=bar',                                                                                                  // 241
    'fancy.apple.banana=smoothie',                                                                                    // 242
    'fancy.currentFruit=guava',                                                                                       // 243
    'fancy.currentCountry.name=Iceland',                                                                              // 244
    'fancy.currentCountry.population=321007',                                                                         // 245
    'fancy.currentCountry.unicorns=0'                                                                                 // 246
  ]);                                                                                                                 // 247
                                                                                                                      // 248
  test.equal(Template.test_helpers_f(dataObj).match(/\S+/g), [                                                        // 249
    'fancyhelper.foo=bar',                                                                                            // 250
    'fancyhelper.apple.banana=smoothie',                                                                              // 251
    'fancyhelper.currentFruit=guava',                                                                                 // 252
    'fancyhelper.currentCountry.name=Iceland',                                                                        // 253
    'fancyhelper.currentCountry.population=321007',                                                                   // 254
    'fancyhelper.currentCountry.unicorns=0'                                                                           // 255
  ]);                                                                                                                 // 256
                                                                                                                      // 257
  // test significance of 'this', which prevents helper from                                                          // 258
  // shadowing property                                                                                               // 259
  test.equal(Template.test_helpers_g(dataObj).match(/\S+/g), [                                                        // 260
    'platypus=eggs',                                                                                                  // 261
    'this.platypus=weird'                                                                                             // 262
  ]);                                                                                                                 // 263
                                                                                                                      // 264
  // test interpretation of arguments                                                                                 // 265
                                                                                                                      // 266
  Template.test_helpers_h.helperListFour = listFour;                                                                  // 267
                                                                                                                      // 268
  var trials =                                                                                                        // 269
        Template.test_helpers_h(dataObj).match(/\(.*?\)/g);                                                           // 270
  test.equal(trials[0],                                                                                               // 271
             '(methodListFour 6 7 8 9=6 7 8 9)');                                                                     // 272
  test.equal(trials[1],                                                                                               // 273
             '(methodListFour platypus thisTest fancyhelper.currentFruit fancyhelper.currentCountry.unicorns=eggs leaf guava 0)');
  test.equal(trials[2],                                                                                               // 275
             '(methodListFour platypus thisTest fancyhelper.currentFruit fancyhelper.currentCountry.unicorns a=platypus b=thisTest c=fancyhelper.currentFruit d=fancyhelper.currentCountry.unicorns=eggs leaf guava 0 a:eggs b:leaf c:guava d:0)');
  test.equal(trials[3],                                                                                               // 277
             '(helperListFour platypus thisTest fancyhelper.currentFruit fancyhelper.currentCountry.unicorns=eggs leaf guava 0)');
  test.equal(trials[4],                                                                                               // 279
             '(helperListFour platypus thisTest fancyhelper.currentFruit fancyhelper.currentCountry.unicorns a=platypus b=thisTest c=fancyhelper.currentFruit d=fancyhelper.currentCountry.unicorns=eggs leaf guava 0 a:eggs b:leaf c:guava d:0)');
  test.equal(trials.length, 5);                                                                                       // 281
                                                                                                                      // 282
  // test interpretation of block helper invocation                                                                   // 283
                                                                                                                      // 284
  Template.test_helpers_i.uppercase = function(fn) {                                                                  // 285
    return fn().toUpperCase();                                                                                        // 286
  };                                                                                                                  // 287
  Template.test_helpers_i.tr = function(options) {                                                                    // 288
    var str = options.fn();                                                                                           // 289
    _.each(options.hash, function(v,k) {                                                                              // 290
      str = str.replace(new RegExp(k, 'g'), v);                                                                       // 291
    });                                                                                                               // 292
    return str;                                                                                                       // 293
  };                                                                                                                  // 294
  Template.test_helpers_i.arg_and_dict = function(arg, options) {                                                     // 295
    if (typeof options.hash !== "object")                                                                             // 296
      throw new Error();                                                                                              // 297
    return _.keys(options.hash).length;                                                                               // 298
  };                                                                                                                  // 299
  Template.test_helpers_i.get_arg = function(arg) {                                                                   // 300
    return arg;                                                                                                       // 301
  };                                                                                                                  // 302
  Template.test_helpers_i.two_args = function(arg1, arg2) {                                                           // 303
    return [typeof arg1 === "string",                                                                                 // 304
            typeof arg2 === "string"].join();                                                                         // 305
  };                                                                                                                  // 306
  Template.test_helpers_i.helperListFour = listFour;                                                                  // 307
                                                                                                                      // 308
  trials =                                                                                                            // 309
        Template.test_helpers_i(dataObj).match(/\(.*?\)/g);                                                           // 310
  test.equal(trials[0], "(uppercase apple=APPLE)");                                                                   // 311
  test.equal(trials[1], "(altered banana=bododo)");                                                                   // 312
  // presence of arg should prevent keyword arguments from                                                            // 313
  // being passed to block helper, whether or not the arg                                                             // 314
  // is a function.                                                                                                   // 315
  test.equal(trials[2], "(nokeys=0)");                                                                                // 316
  test.equal(trials[3], "(nokeys=0)");                                                                                // 317
  test.equal(trials[4],                                                                                               // 318
             '(biggie=eggs leaf guava 0 a:eggs b:leaf c:guava d:0)');                                                 // 319
  // can't pass > 1 positional arg to block helper                                                                    // 320
  test.equal(trials[5], "(twoArgBlock=true,false)");                                                                  // 321
  test.equal(trials.length, 6);                                                                                       // 322
});                                                                                                                   // 323
                                                                                                                      // 324
                                                                                                                      // 325
Tinytest.add("templating - rendered template", function(test) {                                                       // 326
  var R = ReactiveVar('foo');                                                                                         // 327
  Template.test_render_a.foo = function() {                                                                           // 328
    R.get();                                                                                                          // 329
    return this.x + 1;                                                                                                // 330
  };                                                                                                                  // 331
                                                                                                                      // 332
  Template.test_render_a.preserve(['br']);                                                                            // 333
                                                                                                                      // 334
  var div = OnscreenDiv(                                                                                              // 335
    Meteor.render(function () {                                                                                       // 336
      return Template.test_render_a({ x: 123 });                                                                      // 337
    }));                                                                                                              // 338
                                                                                                                      // 339
  test.equal(div.text().match(/\S+/)[0], "124");                                                                      // 340
                                                                                                                      // 341
  var br1 = div.node().getElementsByTagName('br')[0];                                                                 // 342
  var hr1 = div.node().getElementsByTagName('hr')[0];                                                                 // 343
  test.isTrue(br1);                                                                                                   // 344
  test.isTrue(hr1);                                                                                                   // 345
                                                                                                                      // 346
  R.set('bar');                                                                                                       // 347
  Deps.flush();                                                                                                       // 348
  var br2 = div.node().getElementsByTagName('br')[0];                                                                 // 349
  var hr2 = div.node().getElementsByTagName('hr')[0];                                                                 // 350
  test.isTrue(br2);                                                                                                   // 351
  test.isTrue(br1 === br2);                                                                                           // 352
  test.isTrue(hr2);                                                                                                   // 353
  test.isFalse(hr1 === hr2);                                                                                          // 354
                                                                                                                      // 355
  div.kill();                                                                                                         // 356
  Deps.flush();                                                                                                       // 357
                                                                                                                      // 358
  /////                                                                                                               // 359
                                                                                                                      // 360
  R = ReactiveVar('foo');                                                                                             // 361
                                                                                                                      // 362
  Template.test_render_b.foo = function() {                                                                           // 363
    R.get();                                                                                                          // 364
    return (+this) + 1;                                                                                               // 365
  };                                                                                                                  // 366
  Template.test_render_b.preserve(['br']);                                                                            // 367
                                                                                                                      // 368
  div = OnscreenDiv(                                                                                                  // 369
    Meteor.render(function () {                                                                                       // 370
      return Template.test_render_b({ x: 123 });                                                                      // 371
    }));                                                                                                              // 372
                                                                                                                      // 373
  test.equal(div.text().match(/\S+/)[0], "201");                                                                      // 374
                                                                                                                      // 375
  var br1 = div.node().getElementsByTagName('br')[0];                                                                 // 376
  var hr1 = div.node().getElementsByTagName('hr')[0];                                                                 // 377
  test.isTrue(br1);                                                                                                   // 378
  test.isTrue(hr1);                                                                                                   // 379
                                                                                                                      // 380
  R.set('bar');                                                                                                       // 381
  Deps.flush();                                                                                                       // 382
  var br2 = div.node().getElementsByTagName('br')[0];                                                                 // 383
  var hr2 = div.node().getElementsByTagName('hr')[0];                                                                 // 384
  test.isTrue(br2);                                                                                                   // 385
  test.isTrue(br1 === br2);                                                                                           // 386
  test.isTrue(hr2);                                                                                                   // 387
  test.isFalse(hr1 === hr2);                                                                                          // 388
                                                                                                                      // 389
  div.kill();                                                                                                         // 390
  Deps.flush();                                                                                                       // 391
                                                                                                                      // 392
  /////                                                                                                               // 393
                                                                                                                      // 394
  var stuff = new LocalCollection();                                                                                  // 395
  stuff.insert({foo:'bar'});                                                                                          // 396
                                                                                                                      // 397
  Template.test_render_c.preserve(['br']);                                                                            // 398
                                                                                                                      // 399
  div = OnscreenDiv(                                                                                                  // 400
    Meteor.renderList(                                                                                                // 401
      stuff.find(), function (data) {                                                                                 // 402
        return Template.test_render_c(data, 'blah');                                                                  // 403
      }));                                                                                                            // 404
                                                                                                                      // 405
  var br1 = div.node().getElementsByTagName('br')[0];                                                                 // 406
  var hr1 = div.node().getElementsByTagName('hr')[0];                                                                 // 407
  test.isTrue(br1);                                                                                                   // 408
  test.isTrue(hr1);                                                                                                   // 409
                                                                                                                      // 410
  stuff.update({foo:'bar'}, {$set: {foo: 'baz'}});                                                                    // 411
  Deps.flush();                                                                                                       // 412
  var br2 = div.node().getElementsByTagName('br')[0];                                                                 // 413
  var hr2 = div.node().getElementsByTagName('hr')[0];                                                                 // 414
  test.isTrue(br2);                                                                                                   // 415
  test.isTrue(br1 === br2);                                                                                           // 416
  test.isTrue(hr2);                                                                                                   // 417
  test.isFalse(hr1 === hr2);                                                                                          // 418
                                                                                                                      // 419
  div.kill();                                                                                                         // 420
  Deps.flush();                                                                                                       // 421
                                                                                                                      // 422
  /////                                                                                                               // 423
                                                                                                                      // 424
  var stuff = new LocalCollection();                                                                                  // 425
  stuff.insert({foo:'bar'});                                                                                          // 426
                                                                                                                      // 427
  Template.test_render_c.preserve(['br']);                                                                            // 428
                                                                                                                      // 429
  div = OnscreenDiv(Meteor.renderList(stuff.find(),                                                                   // 430
                                      Template.test_render_c));                                                       // 431
                                                                                                                      // 432
  var br1 = div.node().getElementsByTagName('br')[0];                                                                 // 433
  var hr1 = div.node().getElementsByTagName('hr')[0];                                                                 // 434
  test.isTrue(br1);                                                                                                   // 435
  test.isTrue(hr1);                                                                                                   // 436
                                                                                                                      // 437
  stuff.update({foo:'bar'}, {$set: {foo: 'baz'}});                                                                    // 438
  Deps.flush();                                                                                                       // 439
  var br2 = div.node().getElementsByTagName('br')[0];                                                                 // 440
  var hr2 = div.node().getElementsByTagName('hr')[0];                                                                 // 441
  test.isTrue(br2);                                                                                                   // 442
  test.isTrue(br1 === br2);                                                                                           // 443
  test.isTrue(hr2);                                                                                                   // 444
  test.isFalse(hr1 === hr2);                                                                                          // 445
                                                                                                                      // 446
  div.kill();                                                                                                         // 447
  Deps.flush();                                                                                                       // 448
                                                                                                                      // 449
});                                                                                                                   // 450
                                                                                                                      // 451
Tinytest.add("templating - branch labels", function(test) {                                                           // 452
  var R = ReactiveVar('foo');                                                                                         // 453
  Template.test_branches_a['var'] = function () {                                                                     // 454
    return R.get();                                                                                                   // 455
  };                                                                                                                  // 456
                                                                                                                      // 457
  var elems = [];                                                                                                     // 458
                                                                                                                      // 459
  // use constant landmarks to test that each                                                                         // 460
  // block helper invocation gets a different label                                                                   // 461
  Template.test_branches_a.myConstant = function (options) {                                                          // 462
    var data = this;                                                                                                  // 463
    var firstRender = true;                                                                                           // 464
    return Spark.createLandmark({ constant: true,                                                                     // 465
                                  rendered: function () {                                                             // 466
                                    if (! firstRender)                                                                // 467
                                      return;                                                                         // 468
                                    firstRender = false;                                                              // 469
                                    var hr = this.find('hr');                                                         // 470
                                    hr.myIndex = elems.length;                                                        // 471
                                    elems.push(this.find('hr'));                                                      // 472
                                  }},                                                                                 // 473
                                function () {                                                                         // 474
                                  return options.fn(data);                                                            // 475
                                });                                                                                   // 476
  };                                                                                                                  // 477
                                                                                                                      // 478
  var div = OnscreenDiv(Meteor.render(Template.test_branches_a));                                                     // 479
  Deps.flush();                                                                                                       // 480
  test.equal(DomUtils.find(div.node(), 'span').innerHTML, 'foo');                                                     // 481
  test.equal(elems.length, 3);                                                                                        // 482
                                                                                                                      // 483
  R.set('bar');                                                                                                       // 484
  Deps.flush();                                                                                                       // 485
  var elems2 = DomUtils.findAll(div.node(), 'hr');                                                                    // 486
  elems2.sort(function(a, b) { return a.myIndex - b.myIndex; });                                                      // 487
  test.equal(elems[0], elems2[0]);                                                                                    // 488
  test.equal(elems[1], elems2[1]);                                                                                    // 489
  test.equal(elems[2], elems2[2]);                                                                                    // 490
  test.equal(DomUtils.find(div.node(), 'span').innerHTML, 'bar');                                                     // 491
                                                                                                                      // 492
  div.kill();                                                                                                         // 493
  Deps.flush();                                                                                                       // 494
});                                                                                                                   // 495
                                                                                                                      // 496
Tinytest.add("templating - matching in list", function (test) {                                                       // 497
  var c = new LocalCollection();                                                                                      // 498
  c.insert({letter:'a'});                                                                                             // 499
  c.insert({letter:'b'});                                                                                             // 500
  c.insert({letter:'c'});                                                                                             // 501
                                                                                                                      // 502
  _.extend(Template.test_listmatching_a0, {                                                                           // 503
    'var': function () { return R.get(); },                                                                           // 504
    c: function () { return c.find(); }                                                                               // 505
  });                                                                                                                 // 506
                                                                                                                      // 507
  var buf = [];                                                                                                       // 508
  _.extend(Template.test_listmatching_a1, {                                                                           // 509
    created: function () { buf.push('+'); },                                                                          // 510
    rendered: function () {                                                                                           // 511
      var letter = canonicalizeHtml(                                                                                  // 512
        DomUtils.rangeToHtml(this.firstNode,                                                                          // 513
                             this.lastNode).match(/\S+/)[0]);                                                         // 514
      buf.push('*'+letter);                                                                                           // 515
    },                                                                                                                // 516
    destroyed: function () { buf.push('-'); }                                                                         // 517
  });                                                                                                                 // 518
                                                                                                                      // 519
  var R = ReactiveVar('foo');                                                                                         // 520
  var div = OnscreenDiv(Spark.render(Template.test_listmatching_a0));                                                 // 521
  Deps.flush();                                                                                                       // 522
                                                                                                                      // 523
  test.equal(DomUtils.find(div.node(), 'span').innerHTML, 'foo');                                                     // 524
  test.equal(div.html().match(/<p>(.*?)<\/p>/)[1].match(/\S+/g), ['a','b','c']);                                      // 525
  test.equal(buf.join(''), '+++*a*b*c');                                                                              // 526
                                                                                                                      // 527
  buf.length = 0;                                                                                                     // 528
  R.set('bar');                                                                                                       // 529
  Deps.flush();                                                                                                       // 530
  test.equal(DomUtils.find(div.node(), 'span').innerHTML, 'bar');                                                     // 531
  test.equal(div.html().match(/<p>(.*?)<\/p>/)[1].match(/\S+/g), ['a','b','c']);                                      // 532
  test.equal(buf.join(''), '*a*b*c');                                                                                 // 533
                                                                                                                      // 534
  div.kill();                                                                                                         // 535
  Deps.flush();                                                                                                       // 536
                                                                                                                      // 537
});                                                                                                                   // 538
                                                                                                                      // 539
Tinytest.add("templating - isolate helper", function (test) {                                                         // 540
  var Rs = _.map(_.range(4), function () { return ReactiveVar(1); });                                                 // 541
  var touch = function (n) { Rs[n-1].get(); };                                                                        // 542
  var bump = function (n) { Rs[n-1].set(Rs[n-1].get() + 1); };                                                        // 543
  var counts = _.map(_.range(4), function () { return 0; });                                                          // 544
  var tally = function (n) { return ++counts[n-1]; };                                                                 // 545
                                                                                                                      // 546
  _.extend(Template.test_isolate_a, {                                                                                 // 547
    helper: function (n) {                                                                                            // 548
      touch(n);                                                                                                       // 549
      return tally(n);                                                                                                // 550
    }                                                                                                                 // 551
  });                                                                                                                 // 552
                                                                                                                      // 553
  var div = OnscreenDiv(Meteor.render(Template.test_isolate_a));                                                      // 554
                                                                                                                      // 555
  var getTallies = function () {                                                                                      // 556
    return _.map(div.html().match(/\S+/g), Number);                                                                   // 557
  };                                                                                                                  // 558
  var expect = function(str) {                                                                                        // 559
    test.equal(getTallies().join(','), str);                                                                          // 560
  };                                                                                                                  // 561
                                                                                                                      // 562
  Deps.flush();                                                                                                       // 563
  expect("1,1,1,1");                                                                                                  // 564
  bump(1);  Deps.flush();  expect("2,2,2,2");                                                                         // 565
  bump(2);  Deps.flush();  expect("2,3,3,3");                                                                         // 566
  bump(3);  Deps.flush();  expect("2,3,4,4");                                                                         // 567
  bump(4);  Deps.flush();  expect("2,3,4,5");                                                                         // 568
  Deps.flush(); expect("2,3,4,5");                                                                                    // 569
  bump(3);  Deps.flush();  expect("2,3,5,6");                                                                         // 570
  bump(2);  Deps.flush();  expect("2,4,6,7");                                                                         // 571
  bump(1);  Deps.flush();  expect("3,5,7,8");                                                                         // 572
                                                                                                                      // 573
  div.kill();                                                                                                         // 574
  Deps.flush();                                                                                                       // 575
                                                                                                                      // 576
});                                                                                                                   // 577
                                                                                                                      // 578
Tinytest.add("templating - template arg", function (test) {                                                           // 579
  Template.test_template_arg_a.events({                                                                               // 580
    click: function (event, template) {                                                                               // 581
      template.firstNode.innerHTML = 'Hello';                                                                         // 582
      template.lastNode.innerHTML = 'World';                                                                          // 583
      template.find('i').innerHTML =                                                                                  // 584
        (template.findAll('*').length)+"-element";                                                                    // 585
      template.lastNode.innerHTML += ' (the secret is '+                                                              // 586
        template.secret+')';                                                                                          // 587
    }                                                                                                                 // 588
  });                                                                                                                 // 589
                                                                                                                      // 590
  Template.test_template_arg_a.created = function() {                                                                 // 591
    var self = this;                                                                                                  // 592
    test.isFalse(self.firstNode);                                                                                     // 593
    test.isFalse(self.lastNode);                                                                                      // 594
    test.throws(function () { return self.find("*"); });                                                              // 595
    test.throws(function () { return self.findAll("*"); });                                                           // 596
  };                                                                                                                  // 597
                                                                                                                      // 598
  Template.test_template_arg_a.rendered = function () {                                                               // 599
    var template = this;                                                                                              // 600
    template.firstNode.innerHTML = 'Greetings';                                                                       // 601
    template.lastNode.innerHTML = 'Line';                                                                             // 602
    template.find('i').innerHTML =                                                                                    // 603
      (template.findAll('b').length)+"-bold";                                                                         // 604
    template.secret = "strawberry "+template.data.food;                                                               // 605
  };                                                                                                                  // 606
                                                                                                                      // 607
  Template.test_template_arg_a.destroyed = function() {                                                               // 608
    var self = this;                                                                                                  // 609
    test.isFalse(self.firstNode);                                                                                     // 610
    test.isFalse(self.lastNode);                                                                                      // 611
    test.throws(function () { return self.find("*"); });                                                              // 612
    test.throws(function () { return self.findAll("*"); });                                                           // 613
  };                                                                                                                  // 614
                                                                                                                      // 615
  var div = OnscreenDiv(Spark.render(function () {                                                                    // 616
    return Template.test_template_arg_a({food: "pie"});                                                               // 617
  }));                                                                                                                // 618
                                                                                                                      // 619
  test.equal(div.text(), "Foo Bar Baz");                                                                              // 620
  Deps.flush();                                                                                                       // 621
  test.equal(div.text(), "Greetings 1-bold Line");                                                                    // 622
  clickElement(DomUtils.find(div.node(), 'i'));                                                                       // 623
  test.equal(div.text(), "Hello 3-element World (the secret is strawberry pie)");                                     // 624
                                                                                                                      // 625
  div.kill();                                                                                                         // 626
  Deps.flush();                                                                                                       // 627
});                                                                                                                   // 628
                                                                                                                      // 629
Tinytest.add("templating - preserve", function (test) {                                                               // 630
  var R = ReactiveVar('foo');                                                                                         // 631
                                                                                                                      // 632
  var tmpl = Template.test_template_preserve_a;                                                                       // 633
  tmpl.preserve(['.b']);                                                                                              // 634
  tmpl.preserve(['.c']);                                                                                              // 635
  tmpl.preserve({'.d': true});                                                                                        // 636
  tmpl.preserve({'span': function (n) {                                                                               // 637
    return _.contains(['e','f'], n.className) && n.className;                                                         // 638
  }});                                                                                                                // 639
  tmpl.preserve(['span.a']);                                                                                          // 640
  tmpl['var'] = function () { return R.get(); };                                                                      // 641
                                                                                                                      // 642
  var div = OnscreenDiv(Meteor.render(tmpl));                                                                         // 643
  Deps.flush();                                                                                                       // 644
  test.equal(DomUtils.find(div.node(), 'u').firstChild.nodeValue.match(                                               // 645
      /\S+/)[0], 'foo');                                                                                              // 646
  var spans1 = {};                                                                                                    // 647
  _.each(DomUtils.findAll(div.node(), 'span'), function (sp) {                                                        // 648
    spans1[sp.className] = sp;                                                                                        // 649
  });                                                                                                                 // 650
                                                                                                                      // 651
  R.set('bar');                                                                                                       // 652
  Deps.flush();                                                                                                       // 653
  test.equal(DomUtils.find(div.node(), 'u').firstChild.nodeValue.match(                                               // 654
      /\S+/)[0], 'bar');                                                                                              // 655
  var spans2 = {};                                                                                                    // 656
  _.each(DomUtils.findAll(div.node(), 'span'), function (sp) {                                                        // 657
    spans2[sp.className] = sp;                                                                                        // 658
  });                                                                                                                 // 659
                                                                                                                      // 660
  test.isTrue(spans1.a === spans2.a);                                                                                 // 661
  test.isTrue(spans1.b === spans2.b);                                                                                 // 662
  test.isTrue(spans1.c === spans2.c);                                                                                 // 663
  test.isTrue(spans1.d === spans2.d);                                                                                 // 664
  test.isTrue(spans1.e === spans2.e);                                                                                 // 665
  test.isTrue(spans1.f === spans2.f);                                                                                 // 666
  test.isFalse(spans1.y === spans2.y);                                                                                // 667
  test.isFalse(spans1.z === spans2.z);                                                                                // 668
                                                                                                                      // 669
  div.kill();                                                                                                         // 670
  Deps.flush();                                                                                                       // 671
});                                                                                                                   // 672
                                                                                                                      // 673
Tinytest.add("templating - helpers", function (test) {                                                                // 674
  var tmpl = Template.test_template_helpers_a;                                                                        // 675
                                                                                                                      // 676
  tmpl.foo = 'z';                                                                                                     // 677
  tmpl.helpers({bar: 'b'});                                                                                           // 678
  // helpers(...) takes precendence of assigned helper                                                                // 679
  tmpl.helpers({foo: 'a', baz: function() { return 'c'; }});                                                          // 680
                                                                                                                      // 681
  var div = OnscreenDiv(Meteor.render(tmpl));                                                                         // 682
  test.equal(div.text().match(/\S+/)[0], 'abc');                                                                      // 683
  div.kill();                                                                                                         // 684
  Deps.flush();                                                                                                       // 685
                                                                                                                      // 686
  tmpl = Template.test_template_helpers_b;                                                                            // 687
                                                                                                                      // 688
  tmpl.helpers({                                                                                                      // 689
    'name': 'A',                                                                                                      // 690
    'arity': 'B',                                                                                                     // 691
    'toString': 'C',                                                                                                  // 692
    'length': 4,                                                                                                      // 693
    'var': 'D'                                                                                                        // 694
  });                                                                                                                 // 695
                                                                                                                      // 696
  div = OnscreenDiv(Meteor.render(tmpl));                                                                             // 697
  var txt = div.text().match(/\S+/)[0];                                                                               // 698
  test.isTrue(txt.match(/^ABC?4D$/));                                                                                 // 699
  // We don't get 'C' (the ability to name a helper {{toString}})                                                     // 700
  // in IE < 9 because of the famed DontEnum bug.  This could be                                                      // 701
  // fixed but it would require making all the code that handles                                                      // 702
  // the dictionary of helpers be DontEnum-aware.  In practice,                                                       // 703
  // the Object prototype method names (toString, hasOwnProperty,                                                     // 704
  // isPropertyOf, ...) make poor helper names and are unlikely                                                       // 705
  // to be used in apps.                                                                                              // 706
  test.expect_fail();                                                                                                 // 707
  test.equal(txt, 'ABC4D');                                                                                           // 708
  div.kill();                                                                                                         // 709
  Deps.flush();                                                                                                       // 710
                                                                                                                      // 711
  // test that helpers don't "leak"                                                                                   // 712
  tmpl = Template.test_template_helpers_c;                                                                            // 713
  div = OnscreenDiv(Meteor.render(tmpl));                                                                             // 714
  test.equal(div.text(), 'x');                                                                                        // 715
  div.kill();                                                                                                         // 716
  Deps.flush();                                                                                                       // 717
});                                                                                                                   // 718
                                                                                                                      // 719
Tinytest.add("templating - events", function (test) {                                                                 // 720
  var tmpl = Template.test_template_events_a;                                                                         // 721
                                                                                                                      // 722
  var buf = [];                                                                                                       // 723
                                                                                                                      // 724
  // old style                                                                                                        // 725
  tmpl.events = {                                                                                                     // 726
    'click b': function () { buf.push('b'); }                                                                         // 727
  };                                                                                                                  // 728
                                                                                                                      // 729
  var div = OnscreenDiv(Meteor.render(tmpl));                                                                         // 730
  clickElement(DomUtils.find(div.node(), 'b'));                                                                       // 731
  test.equal(buf, ['b']);                                                                                             // 732
  div.kill();                                                                                                         // 733
  Deps.flush();                                                                                                       // 734
                                                                                                                      // 735
  ///                                                                                                                 // 736
                                                                                                                      // 737
  tmpl = Template.test_template_events_b;                                                                             // 738
  buf = [];                                                                                                           // 739
  // new style                                                                                                        // 740
  tmpl.events({                                                                                                       // 741
    'click u': function () { buf.push('u'); }                                                                         // 742
  });                                                                                                                 // 743
  tmpl.events({                                                                                                       // 744
    'click i': function () { buf.push('i'); }                                                                         // 745
  });                                                                                                                 // 746
                                                                                                                      // 747
  var div = OnscreenDiv(Meteor.render(tmpl));                                                                         // 748
  clickElement(DomUtils.find(div.node(), 'u'));                                                                       // 749
  clickElement(DomUtils.find(div.node(), 'i'));                                                                       // 750
  test.equal(buf, ['u', 'i']);                                                                                        // 751
  div.kill();                                                                                                         // 752
  Deps.flush();                                                                                                       // 753
                                                                                                                      // 754
  //Test for identical callbacks for issue #650                                                                       // 755
  tmpl = Template.test_template_events_c;                                                                             // 756
  buf = [];                                                                                                           // 757
  tmpl.events({                                                                                                       // 758
    'click u': function () { buf.push('a'); }                                                                         // 759
  });                                                                                                                 // 760
  tmpl.events({                                                                                                       // 761
    'click u': function () { buf.push('b'); }                                                                         // 762
  });                                                                                                                 // 763
                                                                                                                      // 764
  div = OnscreenDiv(Meteor.render(tmpl));                                                                             // 765
  clickElement(DomUtils.find(div.node(), 'u'));                                                                       // 766
  test.equal(buf.length, 2);                                                                                          // 767
  test.isTrue(_.contains(buf, 'a'));                                                                                  // 768
  test.isTrue(_.contains(buf, 'b'));                                                                                  // 769
  div.kill();                                                                                                         // 770
  Deps.flush();                                                                                                       // 771
});                                                                                                                   // 772
                                                                                                                      // 773
Tinytest.add("templating - #each rendered callback", function (test) {                                                // 774
  // test that any list modification triggers a rendered callback on the                                              // 775
  // enclosing template                                                                                               // 776
                                                                                                                      // 777
  var entries = new LocalCollection();                                                                                // 778
  entries.insert({x:'a'});                                                                                            // 779
  entries.insert({x:'b'});                                                                                            // 780
  entries.insert({x:'c'});                                                                                            // 781
                                                                                                                      // 782
  var buf = [];                                                                                                       // 783
                                                                                                                      // 784
  var tmpl = Template.test_template_eachrender_a;                                                                     // 785
  tmpl.helpers({entries: function() {                                                                                 // 786
    return entries.find({}, {sort: ['x']}); }});                                                                      // 787
  tmpl.rendered = function () {                                                                                       // 788
    buf.push(canonicalizeHtml(                                                                                        // 789
      DomUtils.rangeToHtml(this.firstNode, this.lastNode)).replace(/\s/g, ''));                                       // 790
  };                                                                                                                  // 791
  var div = OnscreenDiv(Meteor.render(tmpl));                                                                         // 792
  Deps.flush();                                                                                                       // 793
  test.equal(buf, ['<div>a</div><div>b</div><div>c</div>']);                                                          // 794
  buf.length = 0;                                                                                                     // 795
                                                                                                                      // 796
  // added                                                                                                            // 797
  entries.insert({x:'d'});                                                                                            // 798
  test.equal(buf, []);                                                                                                // 799
  Deps.flush();                                                                                                       // 800
  test.equal(buf, ['<div>a</div><div>b</div><div>c</div><div>d</div>']);                                              // 801
  buf.length = 0;                                                                                                     // 802
                                                                                                                      // 803
  // removed                                                                                                          // 804
  entries.remove({x:'a'});                                                                                            // 805
  test.equal(buf, []);                                                                                                // 806
  Deps.flush();                                                                                                       // 807
  test.equal(buf, ['<div>b</div><div>c</div><div>d</div>']);                                                          // 808
  buf.length = 0;                                                                                                     // 809
                                                                                                                      // 810
  // moved/changed                                                                                                    // 811
  entries.update({x:'b'}, {$set: {x: 'z'}});                                                                          // 812
  test.equal(buf, []);                                                                                                // 813
  Deps.flush();                                                                                                       // 814
  test.equal(buf, ['<div>c</div><div>d</div><div>z</div>',                                                            // 815
                   '<div>c</div><div>d</div><div>z</div>']);                                                          // 816
  buf.length = 0;                                                                                                     // 817
                                                                                                                      // 818
  div.kill();                                                                                                         // 819
  Deps.flush();                                                                                                       // 820
                                                                                                                      // 821
  // test pure "moved"                                                                                                // 822
                                                                                                                      // 823
  tmpl = Template.test_template_eachrender_b;                                                                         // 824
  var cbks = [];                                                                                                      // 825
  var xs = ['a','b','c'];                                                                                             // 826
  tmpl.helpers({entries: function() {                                                                                 // 827
    return { observeChanges: function (callbacks) {                                                                   // 828
      cbks.push(callbacks);                                                                                           // 829
      _.each(xs, function(x) {                                                                                        // 830
        callbacks.addedBefore(x, {x:x}, null);                                                                        // 831
      });                                                                                                             // 832
      return {                                                                                                        // 833
        stop: function () {                                                                                           // 834
          cbks = _.without(cbks, callbacks);                                                                          // 835
        }                                                                                                             // 836
      };                                                                                                              // 837
    }};                                                                                                               // 838
  }});                                                                                                                // 839
  tmpl.rendered = function () {                                                                                       // 840
    buf.push(canonicalizeHtml(                                                                                        // 841
      DomUtils.rangeToHtml(this.firstNode, this.lastNode)).replace(/\s/g, ''));                                       // 842
  };                                                                                                                  // 843
  buf = [];                                                                                                           // 844
  var div = OnscreenDiv(Meteor.render(tmpl));                                                                         // 845
  test.equal(buf, []);                                                                                                // 846
  Deps.flush();                                                                                                       // 847
  test.equal(buf, ['<div>a</div><div>b</div><div>c</div>']);                                                          // 848
  buf.length = 0;                                                                                                     // 849
                                                                                                                      // 850
  _.each(cbks, function (callbacks) {                                                                                 // 851
    callbacks.movedBefore('a', null);                                                                                 // 852
  });                                                                                                                 // 853
  test.equal(buf, []);                                                                                                // 854
  Deps.flush();                                                                                                       // 855
  test.equal(div.html().replace(/\s/g, ''),                                                                           // 856
             '<div>b</div><div>c</div><div>a</div>');                                                                 // 857
  test.equal(buf, ['<div>b</div><div>c</div><div>a</div>']);                                                          // 858
  buf.length = 0;                                                                                                     // 859
                                                                                                                      // 860
  div.kill();                                                                                                         // 861
  Deps.flush();                                                                                                       // 862
});                                                                                                                   // 863
                                                                                                                      // 864
Tinytest.add("templating - landmarks in helpers", function (test) {                                                   // 865
  var buf = [];                                                                                                       // 866
                                                                                                                      // 867
  var R = ReactiveVar('foo');                                                                                         // 868
                                                                                                                      // 869
  var tmpl = Template.test_template_landmarks_a;                                                                      // 870
  tmpl.LM = function () {                                                                                             // 871
    return new Handlebars.SafeString(                                                                                 // 872
      Spark.createLandmark({created: function () { buf.push('c'); },                                                  // 873
                            rendered: function () { buf.push('r'); },                                                 // 874
                            destroyed: function () { buf.push('d'); }},                                               // 875
                           function () { return 'x'; }));                                                             // 876
  };                                                                                                                  // 877
  tmpl.v = function () {                                                                                              // 878
    return R.get();                                                                                                   // 879
  };                                                                                                                  // 880
                                                                                                                      // 881
  var div = OnscreenDiv(Meteor.render(tmpl));                                                                         // 882
  test.equal(div.text().match(/\S+/)[0], 'xxxxfoo');                                                                  // 883
  Deps.flush();                                                                                                       // 884
  buf.sort();                                                                                                         // 885
  test.equal(buf.join(''), 'ccccrrrr');                                                                               // 886
  buf.length = 0;                                                                                                     // 887
                                                                                                                      // 888
  R.set('bar');                                                                                                       // 889
  Deps.flush();                                                                                                       // 890
  test.equal(div.text().match(/\S+/)[0], 'xxxxbar');                                                                  // 891
  test.equal(buf.join(''), 'rrrr');                                                                                   // 892
  buf.length = 0;                                                                                                     // 893
                                                                                                                      // 894
  div.kill();                                                                                                         // 895
  Deps.flush();                                                                                                       // 896
  test.equal(buf.join(''), 'dddd');                                                                                   // 897
});                                                                                                                   // 898
                                                                                                                      // 899
Tinytest.add("templating - bare each has no matching", function (test) {                                              // 900
  var buf = [];                                                                                                       // 901
                                                                                                                      // 902
  var R = ReactiveVar('foo');                                                                                         // 903
                                                                                                                      // 904
  var tmpl = Template.test_template_bare_each_a;                                                                      // 905
  tmpl.abc = [{}, {}, {}];                                                                                            // 906
  tmpl.LM = function () {                                                                                             // 907
    return new Handlebars.SafeString(                                                                                 // 908
      Spark.createLandmark({created: function () { buf.push('c'); },                                                  // 909
                            rendered: function () { buf.push('r'); },                                                 // 910
                            destroyed: function () { buf.push('d'); }},                                               // 911
                           function () { return 'x'; }));                                                             // 912
  };                                                                                                                  // 913
  tmpl.v = function () {                                                                                              // 914
    return R.get();                                                                                                   // 915
  };                                                                                                                  // 916
                                                                                                                      // 917
  var div = OnscreenDiv(Meteor.render(tmpl));                                                                         // 918
  Deps.flush();                                                                                                       // 919
  buf.sort();                                                                                                         // 920
  test.equal(buf.join(''), 'cccrrr');                                                                                 // 921
  buf.length = 0;                                                                                                     // 922
                                                                                                                      // 923
  R.set('bar');                                                                                                       // 924
  Deps.flush();                                                                                                       // 925
  buf.sort();                                                                                                         // 926
  test.equal(buf.join(''), 'cccdddrrr');                                                                              // 927
  buf.length = 0;                                                                                                     // 928
                                                                                                                      // 929
  div.kill();                                                                                                         // 930
  Deps.flush();                                                                                                       // 931
  test.equal(buf.join(''), 'ddd');                                                                                    // 932
});                                                                                                                   // 933
                                                                                                                      // 934
Tinytest.add("templating - templates are labeled", function (test) {                                                  // 935
  var buf = [];                                                                                                       // 936
                                                                                                                      // 937
  var R = ReactiveVar('foo');                                                                                         // 938
                                                                                                                      // 939
  var tmpls = _.map([0,1,2,3], function (n) {                                                                         // 940
    return Template['test_template_labels_a'+n];                                                                      // 941
  });                                                                                                                 // 942
  tmpls[0].stuff = function () {                                                                                      // 943
    return tmpls[1]() + tmpls[2]() + tmpls[3]() + R.get();                                                            // 944
  };                                                                                                                  // 945
  _.each([tmpls[1], tmpls[2], tmpls[3]], function (tmpl) {                                                            // 946
    tmpl.preserve(['hr']);                                                                                            // 947
    tmpl.created = function () { buf.push('c'); };                                                                    // 948
    tmpl.rendered = function () { buf.push('r'); };                                                                   // 949
    tmpl.destroyed = function () { buf.push('d'); };                                                                  // 950
  });                                                                                                                 // 951
                                                                                                                      // 952
  var div = OnscreenDiv(Meteor.render(tmpls[0]));                                                                     // 953
  Deps.flush();                                                                                                       // 954
  test.equal(div.html(), "<hr><hr><hr>foo");                                                                          // 955
  buf.sort();                                                                                                         // 956
  test.equal(buf.join(''), 'cccrrr');                                                                                 // 957
  buf.length = 0;                                                                                                     // 958
                                                                                                                      // 959
  R.set('bar');                                                                                                       // 960
  Deps.flush();                                                                                                       // 961
  test.equal(div.html(), "<hr><hr><hr>bar");                                                                          // 962
  buf.sort();                                                                                                         // 963
  test.equal(buf.join(''), 'rrr');                                                                                    // 964
  buf.length = 0;                                                                                                     // 965
                                                                                                                      // 966
  div.kill();                                                                                                         // 967
  Deps.flush();                                                                                                       // 968
  test.equal(buf.join(''), 'ddd');                                                                                    // 969
});                                                                                                                   // 970
                                                                                                                      // 971
Tinytest.add("templating - unlabeled cursor", function (test) {                                                       // 972
  var R = ReactiveVar("foo");                                                                                         // 973
                                                                                                                      // 974
  var div = OnscreenDiv(Meteor.render(function () {                                                                   // 975
    R.get(); // create dependency                                                                                     // 976
    return Template.test_unlabeled_cursor_a0(                                                                         // 977
      {observeChanges: function (callbacks) {                                                                         // 978
        callbacks.addedBefore('0', {}, null);                                                                         // 979
        callbacks.addedBefore('1', {}, null);                                                                         // 980
        callbacks.addedBefore('2', {}, null);                                                                         // 981
        return { stop: function () {} };                                                                              // 982
      }}                                                                                                              // 983
    );                                                                                                                // 984
  }));                                                                                                                // 985
                                                                                                                      // 986
  R.set("bar");                                                                                                       // 987
  // This will fail with "can't create second landmark in branch"                                                     // 988
  // unless _id-less objects returned from a cursor are given                                                         // 989
  // unique branch labels in an {{#each}}.                                                                            // 990
  Deps.flush();                                                                                                       // 991
                                                                                                                      // 992
  div.kill();                                                                                                         // 993
  Deps.flush();                                                                                                       // 994
});                                                                                                                   // 995
                                                                                                                      // 996
Tinytest.add("templating - constant text patching", function (test) {                                                 // 997
  // Issue #323.                                                                                                      // 998
                                                                                                                      // 999
  var tmpl = Template.test_constant_text_a0;                                                                          // 1000
                                                                                                                      // 1001
  var R = ReactiveVar("foo");                                                                                         // 1002
                                                                                                                      // 1003
  tmpl.preserve(['p']);                                                                                               // 1004
  tmpl.v = function () {                                                                                              // 1005
    return R.get();                                                                                                   // 1006
  };                                                                                                                  // 1007
                                                                                                                      // 1008
  var div = OnscreenDiv(Meteor.render(tmpl));                                                                         // 1009
  Deps.flush();                                                                                                       // 1010
                                                                                                                      // 1011
  R.set("bar");                                                                                                       // 1012
  // This flush will fail if we can't patch the constant region,                                                      // 1013
  // which starts with a text node, after preserving the preceding                                                    // 1014
  // paragraph.                                                                                                       // 1015
  Deps.flush();                                                                                                       // 1016
                                                                                                                      // 1017
  div.kill();                                                                                                         // 1018
  Deps.flush();                                                                                                       // 1019
});                                                                                                                   // 1020
                                                                                                                      // 1021
                                                                                                                      // 1022
Tinytest.add('templating - helper typecast Issue #617', function (test) {                                             // 1023
                                                                                                                      // 1024
  Handlebars.registerHelper('testTypeCasting', function (/*arguments*/) {                                             // 1025
    // Return a string representing the arguments passed to this                                                      // 1026
    // function, including types. eg:                                                                                 // 1027
    // (1, true) -> "[number,1][boolean,true]"                                                                        // 1028
    return _.reduce(_.toArray(arguments), function (memo, arg) {                                                      // 1029
      if (typeof arg === 'object')                                                                                    // 1030
        return memo + "[object]";                                                                                     // 1031
      return memo + "[" + typeof arg + "," + arg + "]";                                                               // 1032
    }, "");                                                                                                           // 1033
    return x;                                                                                                         // 1034
  });                                                                                                                 // 1035
                                                                                                                      // 1036
  var frag = Meteor.render(Template.test_type_casting);                                                               // 1037
  var result = canonicalizeHtml(DomUtils.fragmentToHtml(frag));                                                       // 1038
  test.equal(                                                                                                         // 1039
    result,                                                                                                           // 1040
    // This corresponds to entries in templating_tests.html.                                                          // 1041
    // true/faslse                                                                                                    // 1042
    "[string,true][string,false][boolean,true][boolean,false]" +                                                      // 1043
      // numbers                                                                                                      // 1044
      "[number,0][number,1][number,-1][number,10][number,-10]" +                                                      // 1045
      // errors                                                                                                       // 1046
      "[undefined,undefined][undefined,undefined]" +                                                                  // 1047
      // handlebars 'options' argument. appended to args of all helpers.                                              // 1048
      "[object]");                                                                                                    // 1049
});                                                                                                                   // 1050
                                                                                                                      // 1051
Tinytest.add("templating - tricky branch labels", function (test) {                                                   // 1052
  // regression test for issue #724                                                                                   // 1053
                                                                                                                      // 1054
  var loading = ReactiveVar(true);                                                                                    // 1055
  var v = ReactiveVar(1);                                                                                             // 1056
                                                                                                                      // 1057
  var x = [];                                                                                                         // 1058
                                                                                                                      // 1059
  Template.test_template_trickylabels_a0.loading = function () {                                                      // 1060
    return loading.get();                                                                                             // 1061
  };                                                                                                                  // 1062
                                                                                                                      // 1063
  Template.test_template_trickylabels_a1.v = function () {                                                            // 1064
    return v.get();                                                                                                   // 1065
  };                                                                                                                  // 1066
                                                                                                                      // 1067
  _.extend(Template.test_template_trickylabels_a2, {                                                                  // 1068
    created: function () { x.push('c'); },                                                                            // 1069
    rendered: function () { x.push('r'); },                                                                           // 1070
    destroyed: function () { x.push('d'); }                                                                           // 1071
  });                                                                                                                 // 1072
                                                                                                                      // 1073
  var div = OnscreenDiv(Meteor.render(Template.test_template_trickylabels_a0));                                       // 1074
  Deps.flush();                                                                                                       // 1075
  loading.set(false);                                                                                                 // 1076
  Deps.flush();                                                                                                       // 1077
  x.length = 0;                                                                                                       // 1078
                                                                                                                      // 1079
  v.set(2);                                                                                                           // 1080
  Deps.flush();                                                                                                       // 1081
  test.equal(x.join(''), 'r'); // no 'c' or 'd'                                                                       // 1082
  test.equal(div.html().replace(/\s+/g, ''), '<div>foo</div>2<div>bar</div>');                                        // 1083
                                                                                                                      // 1084
  div.kill();                                                                                                         // 1085
  Deps.flush();                                                                                                       // 1086
});                                                                                                                   // 1087
                                                                                                                      // 1088
Tinytest.add('templating - each falsy Issue #801', function (test) {                                                  // 1089
  //Minor test for issue #801                                                                                         // 1090
  Template.test_template_issue801.values = function() { return [1,2,null,undefined]; };                               // 1091
  var frag = Meteor.render(Template.test_template_issue801);                                                          // 1092
  test.equal(canonicalizeHtml(DomUtils.fragmentToHtml(frag)), "12null");                                              // 1093
});                                                                                                                   // 1094
                                                                                                                      // 1095
Tinytest.add('templating - with falsy Issue #770', function (test) {                                                  // 1096
  Template.test_template_issue770.value1 = function () { return "abc"; };                                             // 1097
  Template.test_template_issue770.value2 = function () { return false; };                                             // 1098
  var frag = Meteor.render(Template.test_template_issue770);                                                          // 1099
  test.equal(canonicalizeHtml(DomUtils.fragmentToHtml(frag)), "abcxxxabc");                                           // 1100
});                                                                                                                   // 1101
                                                                                                                      // 1102
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/templating/template.templating_tests.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Template.__define__("test_assembly_a0",Package.handlebars.Handlebars.json_ast_to_func([[">","test_assembly_a1"]]));   // 1
Template.__define__("test_assembly_a1",Package.handlebars.Handlebars.json_ast_to_func([[">","test_assembly_a2"]]));   // 2
Template.__define__("test_assembly_a2",Package.handlebars.Handlebars.json_ast_to_func([[">","test_assembly_a3"]]));   // 3
Template.__define__("test_assembly_a3",Package.handlebars.Handlebars.json_ast_to_func(["Hi"]));                       // 4
Template.__define__("test_assembly_b0",Package.handlebars.Handlebars.json_ast_to_func([[">","test_assembly_b1"]]));   // 5
Template.__define__("test_assembly_b1",Package.handlebars.Handlebars.json_ast_to_func(["x",["#",[[0,"if"],[0,"stuff"]],["y"]],[">","test_assembly_b2"]]));
Template.__define__("test_assembly_b2",Package.handlebars.Handlebars.json_ast_to_func(["hi"]));                       // 7
Template.__define__("test_table_a0",Package.handlebars.Handlebars.json_ast_to_func(["<table>\n    ",[">","test_table_a1"],"\n    ",[">","test_table_a1"],"\n    ",[">","test_table_a1"],"\n  </table>"]));
Template.__define__("test_table_a1",Package.handlebars.Handlebars.json_ast_to_func(["<tr>\n    ",[">","test_table_a2"],"\n  </tr>"]));
Template.__define__("test_table_a2",Package.handlebars.Handlebars.json_ast_to_func(["<td>\n    ",[">","test_table_a3"],"\n  </td>"]));
Template.__define__("test_table_a3",Package.handlebars.Handlebars.json_ast_to_func(["Foo."]));                        // 11
Template.__define__("test_table_b0",Package.handlebars.Handlebars.json_ast_to_func(["<table>\n    <tbody>\n      ",[">","test_table_b1"],"\n      ",[">","test_table_b1"],"\n      ",[">","test_table_b1"],"\n    </tbody>\n  </table>"]));
Template.__define__("test_table_b1",Package.handlebars.Handlebars.json_ast_to_func(["<tr>\n    ",[">","test_table_b2"],"\n  </tr>"]));
Template.__define__("test_table_b2",Package.handlebars.Handlebars.json_ast_to_func(["<td>\n    ",[">","test_table_b3"],"\n  </td>"]));
Template.__define__("test_table_b3",Package.handlebars.Handlebars.json_ast_to_func(["Foo."]));                        // 15
Template.__define__("test_table_each",Package.handlebars.Handlebars.json_ast_to_func(["<table>\n    ",["#",[[0,"each"],[0,"foo"]],["\n      <tr><td>",["{",[[0,"bar"]]],"</td></tr>\n    "]],"\n  </table>"]));
Template.__define__("test_event_data_with",Package.handlebars.Handlebars.json_ast_to_func(["<div>\n  xxx\n  ",["#",[[0,"with"],[0,"TWO"]],["\n    <div>\n      xxx\n      ",["#",[[0,"with"],[0,"THREE"]],["\n        <div>\n          xxx\n        </div>\n      "]],"\n    </div>\n  "]],"\n</div>"]));
Template.__define__("test_safestring_a",Package.handlebars.Handlebars.json_ast_to_func([["{",[[0,"foo"]]]," ",["!",[[0,"foo"]]]," ",["{",[[0,"bar"]]]," ",["!",[[0,"bar"]]],"\n  ",["#",[[0,"foo"]],[]]," ",["#",[[0,"bar"]],[]],"\n  ",["{",[[0,"fooprop"]]]," ",["!",[[0,"fooprop"]]]," ",["{",[[0,"barprop"]]]," ",["!",[[0,"barprop"]]],"\n  ",["#",[[0,"fooprop"]],[]]," ",["#",[[0,"barprop"]],[]]]));
Template.__define__("test_helpers_a",Package.handlebars.Handlebars.json_ast_to_func(["platypus=",["{",[[0,"platypus"]]],"\n  watermelon=",["{",[[0,"watermelon"]]],"\n  daisy=",["{",[[0,"daisy"]]],"\n  tree=",["{",[[0,"tree"]]],"\n  warthog=",["{",[[0,"warthog"]]]]));
Template.__define__("test_helpers_b",Package.handlebars.Handlebars.json_ast_to_func(["unknown=",["{",[[0,"unknown"]]],"\n  zero=",["{",[[0,"zero"]]]]));
Template.__define__("test_helpers_c",Package.handlebars.Handlebars.json_ast_to_func(["platypus.X=",["{",[[0,"platypus","X"]]],"\n  watermelon.X=",["{",[[0,"watermelon","X"]]],"\n  daisy.X=",["{",[[0,"daisy","X"]]],"\n  tree.X=",["{",[[0,"tree","X"]]],"\n  warthog.X=",["{",[[0,"warthog","X"]]],"\n  getNull.X=",["{",[[0,"getNull","X"]]],"\n  getUndefined.X=",["{",[[0,"getUndefined","X"]]],"\n  getUndefined.X.Y=",["{",[[0,"getUndefined","X","Y"]]]]));
Template.__define__("test_helpers_d",Package.handlebars.Handlebars.json_ast_to_func(["daisygetter=",["{",[[0,"daisygetter"]]],"\n  thisTest=",["{",[[0,"thisTest"]]],"\n  ",["#",[[0,"with"],[0,"fancy"]],["\n    ../thisTest=",["{",[[1,"thisTest"]]],"\n  "]],"\n  ",["#",[[0,"with"],"foo"],["\n    ../fancy.currentFruit=",["{",[[1,"fancy","currentFruit"]]],"\n  "]]]));
Template.__define__("test_helpers_e",Package.handlebars.Handlebars.json_ast_to_func(["fancy.foo=",["{",[[0,"fancy","foo"]]],"\n  fancy.apple.banana=",["{",[[0,"fancy","apple","banana"]]],"\n  fancy.currentFruit=",["{",[[0,"fancy","currentFruit"]]],"\n  fancy.currentCountry.name=",["{",[[0,"fancy","currentCountry","name"]]],"\n  fancy.currentCountry.population=",["{",[[0,"fancy","currentCountry","population"]]],"\n  fancy.currentCountry.unicorns=",["{",[[0,"fancy","currentCountry","unicorns"]]]]));
Template.__define__("test_helpers_f",Package.handlebars.Handlebars.json_ast_to_func(["fancyhelper.foo=",["{",[[0,"fancyhelper","foo"]]],"\n  fancyhelper.apple.banana=",["{",[[0,"fancyhelper","apple","banana"]]],"\n  fancyhelper.currentFruit=",["{",[[0,"fancyhelper","currentFruit"]]],"\n  fancyhelper.currentCountry.name=",["{",[[0,"fancyhelper","currentCountry","name"]]],"\n  fancyhelper.currentCountry.population=",["{",[[0,"fancyhelper","currentCountry","population"]]],"\n  fancyhelper.currentCountry.unicorns=",["{",[[0,"fancyhelper","currentCountry","unicorns"]]]]));
Template.__define__("test_helpers_g",Package.handlebars.Handlebars.json_ast_to_func(["platypus=",["{",[[0,"platypus"]]],"\n  this.platypus=",["{",[[0,"","platypus"]]]]));
Template.__define__("test_helpers_h",Package.handlebars.Handlebars.json_ast_to_func(["(methodListFour 6 7 8 9=",["{",[[0,"methodListFour"],6,7,8,9]],")\n  (methodListFour platypus thisTest fancyhelper.currentFruit fancyhelper.currentCountry.unicorns=",["{",[[0,"methodListFour"],[0,"platypus"],[0,"thisTest"],[0,"fancyhelper","currentFruit"],[0,"fancyhelper","currentCountry","unicorns"]]],")\n  (methodListFour platypus thisTest fancyhelper.currentFruit fancyhelper.currentCountry.unicorns a=platypus b=thisTest c=fancyhelper.currentFruit d=fancyhelper.currentCountry.unicorns=",["{",[[0,"methodListFour"],[0,"platypus"],[0,"thisTest"],[0,"fancyhelper","currentFruit"],[0,"fancyhelper","currentCountry","unicorns"],{"a":[0,"platypus"],"b":[0,"thisTest"],"c":[0,"fancyhelper","currentFruit"],"d":[0,"fancyhelper","currentCountry","unicorns"]}]],")\n  (helperListFour platypus thisTest fancyhelper.currentFruit fancyhelper.currentCountry.unicorns=",["{",[[0,"helperListFour"],[0,"platypus"],[0,"thisTest"],[0,"fancyhelper","currentFruit"],[0,"fancyhelper","currentCountry","unicorns"]]],")\n  (helperListFour platypus thisTest fancyhelper.currentFruit fancyhelper.currentCountry.unicorns a=platypus b=thisTest c=fancyhelper.currentFruit d=fancyhelper.currentCountry.unicorns=",["{",[[0,"helperListFour"],[0,"platypus"],[0,"thisTest"],[0,"fancyhelper","currentFruit"],[0,"fancyhelper","currentCountry","unicorns"],{"a":[0,"platypus"],"b":[0,"thisTest"],"c":[0,"fancyhelper","currentFruit"],"d":[0,"fancyhelper","currentCountry","unicorns"]}]],")"]));
Template.__define__("test_helpers_i",Package.handlebars.Handlebars.json_ast_to_func(["(uppercase apple=",["#",[[0,"uppercase"]],["apple"]],")\n  (altered banana=",["#",[[0,"tr"],{"a":"o","n":"d"}],["banana"]],")\n  (nokeys=",["#",[[0,"arg_and_dict"],"foo",{"x":"foo"}],[]],")\n  (nokeys=",["#",[[0,"arg_and_dict"],[0,"tree"],{"x":"foo"}],[]],")\n  (biggie=",["#",[[0,"get_arg"],[0,"helperListFour"],[0,"platypus"],[0,"thisTest"],[0,"fancyhelper","currentFruit"],[0,"fancyhelper","currentCountry","unicorns"],{"a":[0,"platypus"],"b":[0,"thisTest"],"c":[0,"fancyhelper","currentFruit"],"d":[0,"fancyhelper","currentCountry","unicorns"]}],[]],")\n  (twoArgBlock=",["#",[[0,"two_args"],"foo","foo"],[]],")"]));
Template.__define__("test_render_a",Package.handlebars.Handlebars.json_ast_to_func([["{",[[0,"foo"]]],"<br><hr>"]));  // 28
Template.__define__("test_render_b",Package.handlebars.Handlebars.json_ast_to_func([["#",[[0,"with"],200],[["{",[[0,"foo"]]],"<br><hr>"]]]));
Template.__define__("test_render_c",Package.handlebars.Handlebars.json_ast_to_func(["<br><hr>"]));                    // 30
Template.__define__("test_branches_a",Package.handlebars.Handlebars.json_ast_to_func(["<span>",["{",[[0,"var"]]],"</span>\n  ",["#",[[0,"myConstant"]],["<hr/>"]],"\n  ",["#",[[0,"if"],1],["\n    ",["#",[[0,"myConstant"]],["<hr/>"]],"\n  "]],"\n  ",["#",[[0,"myConstant"]],["<hr/>"]]]));
Template.__define__("test_listmatching_a0",Package.handlebars.Handlebars.json_ast_to_func(["<span>",["{",[[0,"var"]]],"</span>\n  <p>\n    ",["#",[[0,"each"],[0,"c"]],["\n      ",[">","test_listmatching_a1"],"\n    "]],"\n  </p>"]));
Template.__define__("test_listmatching_a1",Package.handlebars.Handlebars.json_ast_to_func([["{",[[0,"letter"]]]]));   // 33
Template.__define__("test_isolate_a",Package.handlebars.Handlebars.json_ast_to_func([["{",[[0,"helper"],1]],"\n  ",["#",[[0,"isolate"]],["\n    ",["{",[[0,"helper"],2]],"\n    ",["#",[[0,"isolate"]],["\n      ",["{",[[0,"helper"],3]],"\n      ",["#",[[0,"isolate"]],["\n        ",["{",[[0,"helper"],4]],"\n      "]],"\n    "]],"\n  "]]]));
Template.__define__("test_template_arg_a",Package.handlebars.Handlebars.json_ast_to_func(["<b>Foo</b> <i>Bar</i> <u>Baz</u>"]));
Template.__define__("test_template_preserve_a",Package.handlebars.Handlebars.json_ast_to_func(["<span class=\"a\">x</span>\n  <span class=\"b\">x</span>\n  <span class=\"c\">x</span>\n  <span class=\"d\">x</span>\n  <span class=\"y\">x</span>\n  <span class=\"e\">x</span>\n  <span class=\"z\">x</span>\n  <span class=\"f\">x</span>\n  <u>",["{",[[0,"var"]]],"</u>"]));
Template.__define__("test_template_helpers_a",Package.handlebars.Handlebars.json_ast_to_func([["{",[[0,"foo"]]],["{",[[0,"bar"]]],["{",[[0,"baz"]]]]));
Template.__define__("test_template_helpers_b",Package.handlebars.Handlebars.json_ast_to_func([["{",[[0,"name"]]],["{",[[0,"arity"]]],["{",[[0,"toString"]]],["{",[[0,"length"]]],["{",[[0,"var"]]]]));
Template.__define__("test_template_helpers_c",Package.handlebars.Handlebars.json_ast_to_func([["{",[[0,"name"]]],["{",[[0,"arity"]]],["{",[[0,"toString"]]],["{",[[0,"length"]]],["{",[[0,"var"]]],"x"]));
Template.__define__("test_template_events_a",Package.handlebars.Handlebars.json_ast_to_func(["<b>foo</b><u>bar</u><i>baz</i>"]));
Template.__define__("test_template_events_b",Package.handlebars.Handlebars.json_ast_to_func(["<b>foo</b><u>bar</u><i>baz</i>"]));
Template.__define__("test_template_events_c",Package.handlebars.Handlebars.json_ast_to_func(["<b>foo</b><u>bar</u><i>baz</i>"]));
Template.__define__("test_template_eachrender_a",Package.handlebars.Handlebars.json_ast_to_func([["#",[[0,"each"],[0,"entries"]],["\n    <div>",["{",[[0,"x"]]],"</div>\n  "]]]));
Template.__define__("test_template_eachrender_b",Package.handlebars.Handlebars.json_ast_to_func([["#",[[0,"each"],[0,"entries"]],["\n    <div>",["{",[[0,"x"]]],"</div>\n  "]]]));
Template.__define__("test_template_landmarks_a",Package.handlebars.Handlebars.json_ast_to_func([["{",[[0,"LM"]]],["!",[[0,"LM"]]],["{",[[0,"LM"]]],["!",[[0,"LM"]]],["{",[[0,"v"]]]]));
Template.__define__("test_template_bare_each_a",Package.handlebars.Handlebars.json_ast_to_func([["#",[[0,"each"],[0,"abc"]],["\n    ",["{",[[0,"LM"]]],"\n  "]],"\n  ",["{",[[0,"v"]]]]));
Template.__define__("test_template_labels_a0",Package.handlebars.Handlebars.json_ast_to_func([["!",[[0,"stuff"]]]])); // 47
Template.__define__("test_template_labels_a1",Package.handlebars.Handlebars.json_ast_to_func(["<hr>"]));              // 48
Template.__define__("test_template_labels_a2",Package.handlebars.Handlebars.json_ast_to_func(["<hr>"]));              // 49
Template.__define__("test_template_labels_a3",Package.handlebars.Handlebars.json_ast_to_func(["<hr>"]));              // 50
Template.__define__("test_unlabeled_cursor_a0",Package.handlebars.Handlebars.json_ast_to_func([["#",[[0,"each"],[0]],[[">","test_unlabeled_cursor_a1"]]]]));
Template.__define__("test_unlabeled_cursor_a1",Package.handlebars.Handlebars.json_ast_to_func(["<div>foo</div>"]));   // 52
Template.__define__("test_constant_text_a0",Package.handlebars.Handlebars.json_ast_to_func(["<div><p>preserved P:",["{",[[0,"v"]]],"</p>",["#",[[0,"constant"]],["text"]],"</div>"]));
Template.__define__("test_type_casting",Package.handlebars.Handlebars.json_ast_to_func([["{",[[0,"testTypeCasting"],"true","false",true,false,0,1,-1,10,-10,[0,"1asdf"],[0,"-1asdf"]]]]));
Template.__define__("test_template_trickylabels_a0",Package.handlebars.Handlebars.json_ast_to_func([["#",[[0,"unless"],[0,"loading"]],["\n    ",[">","test_template_trickylabels_a1"],"\n  "]]]));
Template.__define__("test_template_trickylabels_a1",Package.handlebars.Handlebars.json_ast_to_func([["#",[[0,"isolate"]],["\n    ",[">","test_template_trickylabels_a2"],"\n    ",["{",[[0,"v"]]],"\n  "]],"\n  <div>bar</div>"]));
Template.__define__("test_template_trickylabels_a2",Package.handlebars.Handlebars.json_ast_to_func(["<div>foo</div>"]));
Template.__define__("test_template_issue801",Package.handlebars.Handlebars.json_ast_to_func([["#",[[0,"each"],[0,"values"]],[["{",[[0]]]]]]));
Template.__define__("test_template_issue770",Package.handlebars.Handlebars.json_ast_to_func([["#",[[0,"with"],[0,"value1"]],[["{",[[0]]]],["xxx"]],["#",[[0,"with"],[0,"value2"]],[["{",[[0]]]],["xxx"]],["#",[[0,"with"],[0,"value1"]],[["{",[[0]]]]],["#",[[0,"with"],[0,"value2"]],[["{",[[0]]]]]]));
                                                                                                                      // 60
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
