(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/test-in-console/driver.js                                                                  //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
// Global flag for phantomjs (or other browser) to eval to see if we're done.                          // 1
DONE = false;                                                                                          // 2
// Failure count for phantomjs exit code                                                               // 3
FAILURES = null;                                                                                       // 4
                                                                                                       // 5
TEST_STATUS = {                                                                                        // 6
  DONE: false,                                                                                         // 7
  FAILURES: null                                                                                       // 8
};                                                                                                     // 9
                                                                                                       // 10
                                                                                                       // 11
var getName = function (result) {                                                                      // 12
  return (result.server ? "S: " : "C: ") +                                                             // 13
    result.groupPath.join(" - ") + " - " + result.test;                                                // 14
};                                                                                                     // 15
                                                                                                       // 16
var log = function (/*arguments*/) {                                                                   // 17
  if (typeof console !== 'undefined') {                                                                // 18
    console.log.apply(console, arguments);                                                             // 19
  }                                                                                                    // 20
};                                                                                                     // 21
                                                                                                       // 22
                                                                                                       // 23
var passed = 0;                                                                                        // 24
var failed = 0;                                                                                        // 25
var expected = 0;                                                                                      // 26
var resultSet = {};                                                                                    // 27
var toReport = [];                                                                                     // 28
                                                                                                       // 29
var hrefPath = document.location.href.split("/");                                                      // 30
var platform = decodeURIComponent(hrefPath.length && hrefPath[hrefPath.length - 1]);                   // 31
if (!platform)                                                                                         // 32
  platform = "local";                                                                                  // 33
var doReport = Meteor &&                                                                               // 34
      Meteor.settings &&                                                                               // 35
      Meteor.settings.public &&                                                                        // 36
      Meteor.settings.public.runId;                                                                    // 37
var report = function (name, last) {                                                                   // 38
  if (doReport) {                                                                                      // 39
    var data = {                                                                                       // 40
      run_id: Meteor.settings.public.runId,                                                            // 41
      testPath: resultSet[name].testPath,                                                              // 42
      status: resultSet[name].status,                                                                  // 43
      platform: platform,                                                                              // 44
      server: resultSet[name].server,                                                                  // 45
      fullName: name.substr(3)                                                                         // 46
    };                                                                                                 // 47
    if ((data.status === "FAIL" || data.status === "EXPECTED") &&                                      // 48
        !_.isEmpty(resultSet[name].events)) {                                                          // 49
      // only send events when bad things happen                                                       // 50
      data.events = resultSet[name].events;                                                            // 51
    }                                                                                                  // 52
    if (last)                                                                                          // 53
      data.end = new Date();                                                                           // 54
    else                                                                                               // 55
      data.start = new Date();                                                                         // 56
    toReport.push(EJSON.toJSONValue(data));                                                            // 57
  }                                                                                                    // 58
};                                                                                                     // 59
var sendReports = function (callback) {                                                                // 60
  var reports = toReport;                                                                              // 61
  if (!callback)                                                                                       // 62
    callback = function () {};                                                                         // 63
  toReport = [];                                                                                       // 64
  if (doReport)                                                                                        // 65
    Meteor.call("report", reports, callback);                                                          // 66
  else                                                                                                 // 67
    callback();                                                                                        // 68
};                                                                                                     // 69
Meteor.startup(function () {                                                                           // 70
  setTimeout(sendReports, 500);                                                                        // 71
  setInterval(sendReports, 2000);                                                                      // 72
                                                                                                       // 73
  Tinytest._runTestsEverywhere(                                                                        // 74
    function (results) {                                                                               // 75
      var name = getName(results);                                                                     // 76
      if (!_.has(resultSet, name)) {                                                                   // 77
        var testPath = EJSON.clone(results.groupPath);                                                 // 78
        testPath.push(results.test);                                                                   // 79
        resultSet[name] = {                                                                            // 80
          name: name,                                                                                  // 81
          status: "PENDING",                                                                           // 82
          events: [],                                                                                  // 83
          server: !!results.server,                                                                    // 84
          testPath: testPath                                                                           // 85
        };                                                                                             // 86
        report(name, false);                                                                           // 87
      }                                                                                                // 88
      _.each(results.events, function (event) {                                                        // 89
        resultSet[name].events.push(event);                                                            // 90
        switch (event.type) {                                                                          // 91
        case "ok":                                                                                     // 92
          break;                                                                                       // 93
        case "expected_fail":                                                                          // 94
          if (resultSet[name].status !== "FAIL")                                                       // 95
            resultSet[name].status = "EXPECTED";                                                       // 96
          break;                                                                                       // 97
        case "exception":                                                                              // 98
          log(name, ":", "!!!!!!!!! FAIL !!!!!!!!!!!");                                                // 99
          if (event.details && event.details.stack)                                                    // 100
            log(event.details.stack);                                                                  // 101
          else                                                                                         // 102
            log("Test failed with exception");                                                         // 103
          failed++;                                                                                    // 104
          break;                                                                                       // 105
        case "finish":                                                                                 // 106
          switch (resultSet[name].status) {                                                            // 107
          case "OK":                                                                                   // 108
            break;                                                                                     // 109
          case "PENDING":                                                                              // 110
            resultSet[name].status = "OK";                                                             // 111
            report(name, true);                                                                        // 112
            log(name, ":", "OK");                                                                      // 113
            passed++;                                                                                  // 114
            break;                                                                                     // 115
          case "EXPECTED":                                                                             // 116
            report(name, true);                                                                        // 117
            log(name, ":", "EXPECTED FAILURE");                                                        // 118
            expected++;                                                                                // 119
            break;                                                                                     // 120
          case "FAIL":                                                                                 // 121
            failed++;                                                                                  // 122
            report(name, true);                                                                        // 123
            log(name, ":", "!!!!!!!!! FAIL !!!!!!!!!!!");                                              // 124
            log(JSON.stringify(resultSet[name].info));                                                 // 125
            break;                                                                                     // 126
          default:                                                                                     // 127
            log(name, ": unknown state for the test to be in");                                        // 128
          }                                                                                            // 129
          break;                                                                                       // 130
        default:                                                                                       // 131
          resultSet[name].status = "FAIL";                                                             // 132
          resultSet[name].info = results;                                                              // 133
          break;                                                                                       // 134
        }                                                                                              // 135
      });                                                                                              // 136
    },                                                                                                 // 137
                                                                                                       // 138
    function () {                                                                                      // 139
      if (failed > 0) {                                                                                // 140
        log("~~~~~~~ THERE ARE FAILURES ~~~~~~~");                                                     // 141
      }                                                                                                // 142
      log("passed/expected/failed/total", passed, "/", expected, "/", failed, "/", _.size(resultSet)); // 143
      sendReports(function () {                                                                        // 144
        if (doReport) {                                                                                // 145
          log("Waiting 3s for any last reports to get sent out");                                      // 146
          setTimeout(function () {                                                                     // 147
            TEST_STATUS.FAILURES = FAILURES = failed;                                                  // 148
            TEST_STATUS.DONE = DONE = true;                                                            // 149
          }, 3000);                                                                                    // 150
        } else {                                                                                       // 151
          TEST_STATUS.FAILURES = FAILURES = failed;                                                    // 152
          TEST_STATUS.DONE = DONE = true;                                                              // 153
        }                                                                                              // 154
      });                                                                                              // 155
    },                                                                                                 // 156
    ["tinytest"]);                                                                                     // 157
});                                                                                                    // 158
                                                                                                       // 159
/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
