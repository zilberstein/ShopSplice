(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/test-in-browser/template.driver.js                                   //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
Meteor.startup(function(){document.body.appendChild(Spark.render(Template.__define__(null,Package.handlebars.Handlebars.json_ast_to_func(["<div class=\"container-fluid\">\n  ",[">","navBars"],"\n  ",[">","failedTests"],"\n  ",[">","testTable"],"\n  </div>"]))));});Template.__define__("navBars",Package.handlebars.Handlebars.json_ast_to_func(["<div class=\"navbar navbar-fixed-top navbar-inverse\">\n    <div class=\"navbar-inner\">\n      <div class=\"row-fluid\">\n        <div class=\"span3\"><a class=\"brand\" href=\"#\">\n          &nbsp;\n          ",["#",[[0,"if"],[0,"running"]],["\n            Testing in progress...\n          "],["\n            ",["#",[[0,"if"],[0,"passed"]],["\n              All tests pass!\n            "],["\n              There are failures.\n            "]],"\n          "]],"\n        </a></div>\n        <div class=\"span2\">\n          ",["#",[[0,"unless"],[0,"running"]],["\n            <p class=\"navbar-text\">",["{",[[0,"total_test_time"]]]," ms</p>\n          "]],"\n        </div>\n        <div class=\"span6\">\n          ",[">","progressBar"],"\n        </div>\n        <div class=\"span1\"></div>\n      </div>\n    </div>\n  </div>\n  ",[">","groupNav"]]));
Template.__define__("progressBar",Package.handlebars.Handlebars.json_ast_to_func(["<div id=\"testProgressBar\" class=\"progress ",["{",[[0,"barOuterClass"]]],"\">\n    <span class=\"in-progress\">Passed ",["{",[[0,"passedCount"]]]," of ",["{",[[0,"totalCount"]]],"</span>\n    <div class=\"bar bar-danger\" style=\"width: ",["{",[[0,"percentFail"]]],"%;\"></div>\n    <div class=\"bar ",["{",[[0,"barInnerClass"]]],"\" style=\"width: ",["{",[[0,"percentPass"]]],"%;\"></div>\n  </div>"]));
Template.__define__("groupNav",Package.handlebars.Handlebars.json_ast_to_func(["<div class=\"navbar navbar-fixed-bottom navbar-inverse\">\n    <div class=\"navbar-inner\">\n      <ul class=\"nav\">\n      ",["#",[[0,"each"],[0,"groupPaths"]],["\n        <li class=\"navbar-text\">&nbsp;-&nbsp;</li>\n        <li><a class=\"group\" href=\"#\">",["{",[[0,"name"]]],"</a></li>\n      "]],"\n      </ul>\n      <form class=\"navbar-form pull-right\">\n        <a class=\"btn rerun\">\n          ",["#",[[0,"if"],[0,"rerunScheduled"]],["\n          <i class=\"icon-time\"></i>\n          Rerun scheduled...\n          "],["\n          <i class=\"icon-repeat\"></i>\n          Rerun\n          "]],"\n        </a>\n      </form>\n      &nbsp;\n    </div>\n  </div>"]));
Template.__define__("failedTests",Package.handlebars.Handlebars.json_ast_to_func(["<div class=\"row-fluid\"><div class=\"span12\">\n  <ul class=\"failedTests\">\n    ",["#",[[0,"each"],[0,"failedTests"]],["\n      <li>",["{",[[0]]],"</li>\n    "]],"\n  </ul>\n  </div></div>"]));
Template.__define__("testTable",Package.handlebars.Handlebars.json_ast_to_func(["<div class=\"row-fluid\"><div class=\"span12\">\n  <div class=\"test_table\">\n    ",["#",[[0,"each"],[0,"data"]],["\n      ",["#",[[0,"with"],[0]],[[">","test_group"]]],"\n    "]],"\n  </div>\n  </div></div>"]));
Template.__define__("test_group",Package.handlebars.Handlebars.json_ast_to_func([["{",[[0,"groupDep"]]],"\n  <div class=\"group\">\n    <div class=\"groupname\"><a>",["{",[[0,"name"]]],"</a></div>\n    ",["#",[[0,"each"],[0,"tests"]],["\n      ",[">","test"],"\n    "]],"\n    ",["#",[[0,"each"],[0,"groups"]],["\n      ",[">","test_group"],"\n    "]],"\n  </div>"]));
Template.__define__("test",Package.handlebars.Handlebars.json_ast_to_func([["{",[[0,"testDep"]]],"\n  <div class=\"test ",["{",[[0,"test_class"]]],"\">\n    <div class=\"testrow\">\n      <div class=\"teststatus\">\n        ",["{",[[0,"test_status_display"]]],"\n      </div>\n      <div class=\"testtime\">\n        ",["{",[[0,"test_time_display"]]],"\n      </div>\n      <div class=\"testname\">\n        ",["#",[[0,"if"],[0,"server"]],["S:"],["C:"]],"\n        ",["{",[[0,"name"]]],"\n      </div>\n    </div>\n    ",["#",[[0,"if"],[0,"expanded"]],["\n      ",["#",[[0,"each"],[0,"eventsArray"]],["\n        ",[">","event"],"\n      "],["\n        <div class=\"event\"><div class=\"nodata\">(no data)</div></div>\n      "]],"\n    "]],"\n  </div>"]));
Template.__define__("event",Package.handlebars.Handlebars.json_ast_to_func(["<div class=\"event\">\n    <div class=\"",["{",[[0,"type"]]],"\">\n      <span>\n      - ",["{",[[0,"type"]]],"\n      ",["#",[[0,"if"],[0,"times"]],["\n        <span class=\"xtimes\">(",["{",[[0,"times"]]]," times)</span>\n      "]],"\n      ",["#",[[0,"with"],[0,"get_details"]],["\n        ",["#",[[0,"if"],[0]],["\n          ","\n          ",["#",[[0,"if"],[0,"type"]],["&mdash; ",["{",[[0,"type"]]]]],"\n          ",["#",[[0,"each"],[0,"details"]],["\n            - <span class=\"failkey\">",["{",[[0,"key"]]],"</span> ",["{",[[0,"val"]]],"\n          "]],"\n        "]],"\n        ",["#",[[0,"if"],[0,"stack"]],["<pre>",["{",[[0,"stack"]]],"</pre>"]],"\n      "]],"\n      ",["#",[[0,"if"],[0,"is_debuggable"]],["\n        <span class=\"debug\">[Debug]</span>\n      "]],"\n      </span>\n    </div>\n  </div>"]));
                                                                                 // 9
///////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/test-in-browser/driver.js                                            //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
////                                                                             // 1
//// Setup                                                                       // 2
////                                                                             // 3
                                                                                 // 4
                                                                                 // 5
// dependency for the count of tests running/passed/failed, etc. drives          // 6
// the navbar and the like.                                                      // 7
var countDep = new Deps.Dependency;                                              // 8
// things that change on countDep                                                // 9
var running = true;                                                              // 10
var totalCount = 0;                                                              // 11
var passedCount = 0;                                                             // 12
var failedCount = 0;                                                             // 13
var failedTests = [];                                                            // 14
                                                                                 // 15
// Dependency for when a new top level group is added. Each group and            // 16
// each test have their own dependency objects.                                  // 17
var topLevelGroupsDep = new Deps.Dependency;                                     // 18
                                                                                 // 19
// An array of top-level groups.                                                 // 20
//                                                                               // 21
// Each group is an object with:                                                 // 22
// - name: string                                                                // 23
// - path: array of strings (names of parent groups)                             // 24
// - parent: parent group object (back reference)                                // 25
// - dep: Deps.Dependency object for this group. fires when new tests added.     // 26
// - groups: list of sub-groups                                                  // 27
// - tests: list of tests in this group                                          // 28
//                                                                               // 29
// Each test is an object with:                                                  // 30
// - name: string                                                                // 31
// - parent: parent group object (back reference)                                // 32
// - server: boolean                                                             // 33
// - fullName: string                                                            // 34
// - dep: Deps.Dependency object for this test. fires when the test completes.   // 35
var resultTree = [];                                                             // 36
                                                                                 // 37
                                                                                 // 38
Session.setDefault("groupPath", ["tinytest"]);                                   // 39
Session.set("rerunScheduled", false);                                            // 40
                                                                                 // 41
Meteor.startup(function () {                                                     // 42
  Deps.flush();                                                                  // 43
  Tinytest._runTestsEverywhere(reportResults, function () {                      // 44
    running = false;                                                             // 45
    Meteor.onTestsComplete && Meteor.onTestsComplete();                          // 46
    countDep.changed();                                                          // 47
    Deps.flush();                                                                // 48
                                                                                 // 49
    Meteor.connection._unsubscribeAll();                                         // 50
  }, Session.get("groupPath"));                                                  // 51
                                                                                 // 52
});                                                                              // 53
                                                                                 // 54
                                                                                 // 55
////                                                                             // 56
//// Take incoming results and drive resultsTree                                 // 57
////                                                                             // 58
                                                                                 // 59
// report a series of events in a single test, or just the existence of          // 60
// that test if no events. this is the entry point for test results to           // 61
// this module.                                                                  // 62
var reportResults = function(results) {                                          // 63
  var test = _findTestForResults(results);                                       // 64
                                                                                 // 65
  if (_.isArray(results.events)) {                                               // 66
    // append events, if present                                                 // 67
    Array.prototype.push.apply((test.events || (test.events = [])),              // 68
                               results.events);                                  // 69
    // sort and de-duplicate, based on sequence number                           // 70
    test.events.sort(function (a, b) {                                           // 71
      return a.sequence - b.sequence;                                            // 72
    });                                                                          // 73
    var out = [];                                                                // 74
    _.each(test.events, function (e) {                                           // 75
      if (out.length === 0 || out[out.length - 1].sequence !== e.sequence)       // 76
        out.push(e);                                                             // 77
    });                                                                          // 78
    test.events = out;                                                           // 79
  }                                                                              // 80
  var status = _testStatus(test);                                                // 81
  if (status === "failed") {                                                     // 82
    failedCount++;                                                               // 83
    // Expand a failed test (but only set this if the user hasn't clicked on the // 84
    // test name yet).                                                           // 85
    if (test.expanded === undefined)                                             // 86
      test.expanded = true;                                                      // 87
    if (!_.contains(failedTests, test.fullName))                                 // 88
      failedTests.push(test.fullName);                                           // 89
                                                                                 // 90
    countDep.changed();                                                          // 91
    test.dep.changed();                                                          // 92
  } else if (status === "succeeded") {                                           // 93
    passedCount++;                                                               // 94
    countDep.changed();                                                          // 95
    test.dep.changed();                                                          // 96
  } else if (test.expanded) {                                                    // 97
    // re-render the test if new results come in and the test is                 // 98
    // currently expanded.                                                       // 99
    test.dep.changed();                                                          // 100
  }                                                                              // 101
};                                                                               // 102
                                                                                 // 103
// forget all of the events for a particular test                                // 104
var forgetEvents = function (results) {                                          // 105
  var test = _findTestForResults(results);                                       // 106
  var status = _testStatus(test);                                                // 107
  if (status === "failed") {                                                     // 108
    failedCount--;                                                               // 109
    countDep.changed();                                                          // 110
  } else if (status === "succeeded") {                                           // 111
    passedCount--;                                                               // 112
    countDep.changed();                                                          // 113
  }                                                                              // 114
  delete test.events;                                                            // 115
  test.dep.changed();                                                            // 116
};                                                                               // 117
                                                                                 // 118
// given a 'results' as delivered via reportResults, find the                    // 119
// corresponding leaf object in resultTree, creating one if it doesn't           // 120
// exist. it will be an object with attributes 'name', 'parent', and             // 121
// possibly 'events'.                                                            // 122
var _findTestForResults = function (results) {                                   // 123
  var groupPath = results.groupPath; // array                                    // 124
  if ((! _.isArray(groupPath)) || (groupPath.length < 1)) {                      // 125
    throw new Error("Test must be part of a group");                             // 126
  }                                                                              // 127
                                                                                 // 128
  var group;                                                                     // 129
  var i = 0;                                                                     // 130
  _.each(groupPath, function(gname) {                                            // 131
    var array = (group ? (group.groups || (group.groups = []))                   // 132
                 : resultTree);                                                  // 133
    var newGroup = _.find(array, function(g) { return g.name === gname; });      // 134
    if (! newGroup) {                                                            // 135
      newGroup = {                                                               // 136
        name: gname,                                                             // 137
        parent: (group || null),                                                 // 138
        path: groupPath.slice(0, i+1),                                           // 139
        dep: new Deps.Dependency                                                 // 140
      }; // create group                                                         // 141
      array.push(newGroup);                                                      // 142
                                                                                 // 143
      if (group)                                                                 // 144
        group.dep.changed();                                                     // 145
      else                                                                       // 146
        topLevelGroupsDep.changed();                                             // 147
    }                                                                            // 148
    group = newGroup;                                                            // 149
    i++;                                                                         // 150
  });                                                                            // 151
                                                                                 // 152
  var testName = results.test;                                                   // 153
  var server = !!results.server;                                                 // 154
  var test = _.find(group.tests || (group.tests = []),                           // 155
                    function(t) { return t.name === testName &&                  // 156
                                  t.server === server; });                       // 157
  if (! test) {                                                                  // 158
    // create test                                                               // 159
    var nameParts = _.clone(groupPath);                                          // 160
    nameParts.push(testName);                                                    // 161
    var fullName = nameParts.join(' - ');                                        // 162
    test = {                                                                     // 163
      name: testName,                                                            // 164
      parent: group,                                                             // 165
      server: server,                                                            // 166
      fullName: fullName,                                                        // 167
      dep: new Deps.Dependency                                                   // 168
    };                                                                           // 169
    group.tests.push(test);                                                      // 170
    group.dep.changed();                                                         // 171
    totalCount++;                                                                // 172
    countDep.changed();                                                          // 173
  }                                                                              // 174
                                                                                 // 175
  return test;                                                                   // 176
};                                                                               // 177
                                                                                 // 178
                                                                                 // 179
                                                                                 // 180
////                                                                             // 181
//// Helpers on test objects                                                     // 182
////                                                                             // 183
                                                                                 // 184
var _testTime = function(t) {                                                    // 185
  if (t.events && t.events.length > 0) {                                         // 186
    var lastEvent = _.last(t.events);                                            // 187
    if (lastEvent.type === "finish") {                                           // 188
      if ((typeof lastEvent.timeMs) === "number") {                              // 189
        return lastEvent.timeMs;                                                 // 190
      }                                                                          // 191
    }                                                                            // 192
  }                                                                              // 193
  return null;                                                                   // 194
};                                                                               // 195
                                                                                 // 196
var _testStatus = function(t) {                                                  // 197
  var events = t.events || [];                                                   // 198
  if (_.find(events, function(x) { return x.type === "exception"; })) {          // 199
    // "exception" should be last event, except race conditions on the           // 200
    // server can make this not the case.  Technically we can't tell             // 201
    // if the test is still running at this point, but it can only               // 202
    // result in FAIL.                                                           // 203
    return "failed";                                                             // 204
  } else if (events.length == 0 || (_.last(events).type != "finish")) {          // 205
    return "running";                                                            // 206
  } else if (_.any(events, function(e) {                                         // 207
    return e.type == "fail" || e.type == "exception"; })) {                      // 208
    return "failed";                                                             // 209
  } else {                                                                       // 210
    return "succeeded";                                                          // 211
  }                                                                              // 212
};                                                                               // 213
                                                                                 // 214
                                                                                 // 215
                                                                                 // 216
////                                                                             // 217
//// Templates                                                                   // 218
////                                                                             // 219
                                                                                 // 220
//// Template - navBars                                                          // 221
                                                                                 // 222
Template.navBars.running = function() {                                          // 223
  countDep.depend();                                                             // 224
  return running;                                                                // 225
};                                                                               // 226
                                                                                 // 227
Template.navBars.passed = function() {                                           // 228
  countDep.depend();                                                             // 229
  return failedCount === 0;                                                      // 230
};                                                                               // 231
                                                                                 // 232
Template.navBars.total_test_time = function() {                                  // 233
  countDep.depend();                                                             // 234
                                                                                 // 235
  // walk whole tree to get all tests                                            // 236
  var walk = function (groups) {                                                 // 237
    var total = 0;                                                               // 238
                                                                                 // 239
    _.each(groups || [], function (group) {                                      // 240
      _.each(group.tests || [], function (t) {                                   // 241
        total += _testTime(t);                                                   // 242
      });                                                                        // 243
                                                                                 // 244
      total += walk(group.groups);                                               // 245
    });                                                                          // 246
                                                                                 // 247
    return total;                                                                // 248
  };                                                                             // 249
                                                                                 // 250
  return walk(resultTree);                                                       // 251
};                                                                               // 252
                                                                                 // 253
                                                                                 // 254
//// Template - progressBar                                                      // 255
                                                                                 // 256
Template.progressBar.running = function () {                                     // 257
  countDep.depend();                                                             // 258
  return running;                                                                // 259
};                                                                               // 260
                                                                                 // 261
Template.progressBar.percentPass = function () {                                 // 262
  countDep.depend();                                                             // 263
  if (totalCount === 0)                                                          // 264
    return 0;                                                                    // 265
  return 100*passedCount/totalCount;                                             // 266
};                                                                               // 267
                                                                                 // 268
Template.progressBar.totalCount = function () {                                  // 269
  countDep.depend();                                                             // 270
  return totalCount;                                                             // 271
};                                                                               // 272
                                                                                 // 273
Template.progressBar.passedCount = function () {                                 // 274
  countDep.depend();                                                             // 275
  return passedCount;                                                            // 276
};                                                                               // 277
                                                                                 // 278
Template.progressBar.percentFail = function () {                                 // 279
  countDep.depend();                                                             // 280
  if (totalCount === 0)                                                          // 281
    return 0;                                                                    // 282
  return 100*failedCount/totalCount;                                             // 283
};                                                                               // 284
                                                                                 // 285
Template.progressBar.anyFail = function () {                                     // 286
  countDep.depend();                                                             // 287
  return failedCount > 0;                                                        // 288
};                                                                               // 289
                                                                                 // 290
Template.progressBar.barOuterClass = function () {                               // 291
  return Template.progressBar.running() ? 'progress-striped' : '';               // 292
};                                                                               // 293
                                                                                 // 294
Template.progressBar.barInnerClass = function () {                               // 295
  return (Template.progressBar.anyFail() ?                                       // 296
          'bar-warning' : 'bar-success');                                        // 297
};                                                                               // 298
                                                                                 // 299
                                                                                 // 300
//// Template - groupNav                                                         // 301
                                                                                 // 302
Template.groupNav.groupPaths = function () {                                     // 303
  var groupPath = Session.get("groupPath");                                      // 304
  var ret = [];                                                                  // 305
  for (var i = 1; i <= groupPath.length; i++) {                                  // 306
    ret.push({path: groupPath.slice(0,i), name: groupPath[i-1]});                // 307
  }                                                                              // 308
  return ret;                                                                    // 309
};                                                                               // 310
                                                                                 // 311
Template.groupNav.rerunScheduled = function () {                                 // 312
  return Session.get("rerunScheduled");                                          // 313
};                                                                               // 314
                                                                                 // 315
var changeToPath = function (path) {                                             // 316
  Session.set("groupPath", path);                                                // 317
  Session.set("rerunScheduled", true);                                           // 318
  // pretend there's just been a hot code push                                   // 319
  // so we run the tests completely fresh.                                       // 320
  Reload._reload();                                                              // 321
};                                                                               // 322
                                                                                 // 323
Template.groupNav.events({                                                       // 324
  "click .group": function () {                                                  // 325
    changeToPath(this.path);                                                     // 326
  },                                                                             // 327
  "click .rerun": function () {                                                  // 328
    Session.set("rerunScheduled", true);                                         // 329
    Reload._reload();                                                            // 330
  }                                                                              // 331
});                                                                              // 332
                                                                                 // 333
                                                                                 // 334
//// Template - failedTests                                                      // 335
                                                                                 // 336
Template.failedTests.failedTests = function() {                                  // 337
  countDep.depend();                                                             // 338
  return failedTests;                                                            // 339
};                                                                               // 340
                                                                                 // 341
                                                                                 // 342
                                                                                 // 343
//// Template - testTable                                                        // 344
                                                                                 // 345
Template.testTable.data = function() {                                           // 346
  topLevelGroupsDep.depend();                                                    // 347
  return resultTree;                                                             // 348
};                                                                               // 349
                                                                                 // 350
                                                                                 // 351
//// Template - test_group                                                       // 352
                                                                                 // 353
Template.test_group.groupDep = function () {                                     // 354
  // this template just establishes a dependency. It doesn't actually            // 355
  // render anything.                                                            // 356
  this.dep.depend();                                                             // 357
  return "";                                                                     // 358
};                                                                               // 359
                                                                                 // 360
Template.test_group.events({                                                     // 361
  "click .groupname": function () {                                              // 362
    changeToPath(this.path);                                                     // 363
  }                                                                              // 364
});                                                                              // 365
                                                                                 // 366
                                                                                 // 367
//// Template - test                                                             // 368
                                                                                 // 369
Template.test.testDep = function () {                                            // 370
  // this template just establishes a dependency. It doesn't actually            // 371
  // render anything.                                                            // 372
  this.dep.depend();                                                             // 373
  return "";                                                                     // 374
};                                                                               // 375
                                                                                 // 376
Template.test.test_status_display = function() {                                 // 377
  var status = _testStatus(this);                                                // 378
  if (status == "failed") {                                                      // 379
    return "FAIL";                                                               // 380
  } else if (status == "succeeded") {                                            // 381
    return "PASS";                                                               // 382
  } else {                                                                       // 383
    return "waiting...";                                                         // 384
  }                                                                              // 385
};                                                                               // 386
                                                                                 // 387
Template.test.test_time_display = function() {                                   // 388
  var time = _testTime(this);                                                    // 389
  return (typeof time === "number") ? time + " ms" : "";                         // 390
};                                                                               // 391
                                                                                 // 392
Template.test.test_class = function() {                                          // 393
  var events = this.events || [];                                                // 394
  var classes = [_testStatus(this)];                                             // 395
                                                                                 // 396
  if (this.expanded) {                                                           // 397
    classes.push("expanded");                                                    // 398
  } else {                                                                       // 399
    classes.push("collapsed");                                                   // 400
  }                                                                              // 401
                                                                                 // 402
  return classes.join(' ');                                                      // 403
};                                                                               // 404
                                                                                 // 405
Template.test.events({                                                           // 406
  'click .testname': function() {                                                // 407
    this.expanded = ! this.expanded;                                             // 408
    this.dep.changed();                                                          // 409
  }                                                                              // 410
});                                                                              // 411
                                                                                 // 412
Template.test.eventsArray = function() {                                         // 413
  var events = _.filter(this.events, function(e) {                               // 414
    return e.type != "finish";                                                   // 415
  });                                                                            // 416
                                                                                 // 417
  var partitionBy = function(seq, func) {                                        // 418
    var result = [];                                                             // 419
    var lastValue = {};                                                          // 420
    _.each(seq, function(x) {                                                    // 421
      var newValue = func(x);                                                    // 422
      if (newValue === lastValue) {                                              // 423
        result[result.length-1].push(x);                                         // 424
      } else {                                                                   // 425
        lastValue = newValue;                                                    // 426
        result.push([x]);                                                        // 427
      }                                                                          // 428
    });                                                                          // 429
    return result;                                                               // 430
  };                                                                             // 431
                                                                                 // 432
  var dupLists = partitionBy(                                                    // 433
    _.map(events, function(e) {                                                  // 434
      // XXX XXX We need something better than stringify!                        // 435
      // stringify([undefined]) === "[null]"                                     // 436
      e = _.clone(e);                                                            // 437
      delete e.sequence;                                                         // 438
      return {obj: e, str: JSON.stringify(e)};                                   // 439
    }), function(x) { return x.str; });                                          // 440
                                                                                 // 441
  return _.map(dupLists, function(L) {                                           // 442
    var obj = L[0].obj;                                                          // 443
    return (L.length > 1) ? _.extend({times: L.length}, obj) : obj;              // 444
  });                                                                            // 445
};                                                                               // 446
                                                                                 // 447
                                                                                 // 448
//// Template - event                                                            // 449
                                                                                 // 450
Template.event.events({                                                          // 451
  'click .debug': function () {                                                  // 452
    // the way we manage groupPath, shortName, cookies, etc, is really           // 453
    // messy. needs to be aggressively refactored.                               // 454
    forgetEvents({groupPath: this.cookie.groupPath,                              // 455
                  test: this.cookie.shortName});                                 // 456
    Tinytest._debugTest(this.cookie, reportResults);                             // 457
  }                                                                              // 458
});                                                                              // 459
                                                                                 // 460
Template.event.get_details = function() {                                        // 461
                                                                                 // 462
  var prepare = function(details) {                                              // 463
    return _.compact(_.map(details, function(val, key) {                         // 464
                                                                                 // 465
      // You can end up with a an undefined value, e.g. using                    // 466
      // isNull without providing a message attribute: isNull(1).                // 467
      // No need to display those.                                               // 468
      if (!_.isUndefined(val)) {                                                 // 469
        return {                                                                 // 470
          key: key,                                                              // 471
          val: val                                                               // 472
        };                                                                       // 473
      } else {                                                                   // 474
        return undefined;                                                        // 475
      }                                                                          // 476
    }));                                                                         // 477
  };                                                                             // 478
                                                                                 // 479
  var details = this.details;                                                    // 480
                                                                                 // 481
  if (! details) {                                                               // 482
    return null;                                                                 // 483
  } else {                                                                       // 484
                                                                                 // 485
    var type = details.type;                                                     // 486
    var stack = details.stack;                                                   // 487
                                                                                 // 488
    details = _.clone(details);                                                  // 489
    delete details.type;                                                         // 490
    delete details.stack;                                                        // 491
                                                                                 // 492
    return {                                                                     // 493
      type: type,                                                                // 494
      stack: stack,                                                              // 495
      details: prepare(details)                                                  // 496
    };                                                                           // 497
  }                                                                              // 498
};                                                                               // 499
                                                                                 // 500
Template.event.is_debuggable = function() {                                      // 501
  return !!this.cookie;                                                          // 502
};                                                                               // 503
                                                                                 // 504
///////////////////////////////////////////////////////////////////////////////////

}).call(this);
