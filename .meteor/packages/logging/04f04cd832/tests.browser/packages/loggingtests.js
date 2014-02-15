(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/logging/logging_test.js                                                                               //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
Tinytest.add("logging - _getCallerDetails", function (test) {                                                     // 1
  var details = Log._getCallerDetails();                                                                          // 2
  // Ignore this test for Opera, IE, Safari since this test would work only                                       // 3
  // in Chrome and Firefox, other browsers don't give us an ability to get                                        // 4
  // stacktrace.                                                                                                  // 5
  if ((new Error).stack) {                                                                                        // 6
    test.equal(details.file, 'tinytest.js');                                                                      // 7
                                                                                                                  // 8
    // evaled statements shouldn't crash                                                                          // 9
    var code = "Log._getCallerDetails().file";                                                                    // 10
    test.matches(eval(code), /^eval|tinytest.js$/);                                                               // 11
  }                                                                                                               // 12
});                                                                                                               // 13
                                                                                                                  // 14
Tinytest.add("logging - log", function (test) {                                                                   // 15
  var logBothMessageAndObject = function (log, level) {                                                           // 16
    Log._intercept(3);                                                                                            // 17
                                                                                                                  // 18
    // Tests for correctness                                                                                      // 19
    log("message");                                                                                               // 20
    log({property1: "foo", property2: "bar"});                                                                    // 21
    log({message: "mixed", property1: "foo", property2: "bar"});                                                  // 22
                                                                                                                  // 23
    var intercepted = Log._intercepted();                                                                         // 24
    test.equal(intercepted.length, 3);                                                                            // 25
                                                                                                                  // 26
    var obj1 = EJSON.parse(intercepted[0]);                                                                       // 27
    test.equal(obj1.message, "message");                                                                          // 28
    test.equal(obj1.level, level);                                                                                // 29
    test.instanceOf(obj1.time, Date);                                                                             // 30
                                                                                                                  // 31
    var obj2 = EJSON.parse(intercepted[1]);                                                                       // 32
    test.isFalse(obj2.message);                                                                                   // 33
    test.equal(obj2.property1, "foo");                                                                            // 34
    test.equal(obj2.property2, "bar");                                                                            // 35
    test.equal(obj2.level, level);                                                                                // 36
    test.instanceOf(obj2.time, Date);                                                                             // 37
                                                                                                                  // 38
    var obj3 = EJSON.parse(intercepted[2]);                                                                       // 39
    test.equal(obj3.message, "mixed");                                                                            // 40
    test.equal(obj3.property1, "foo");                                                                            // 41
    test.equal(obj3.property2, "bar");                                                                            // 42
    test.equal(obj3.level, level);                                                                                // 43
    test.instanceOf(obj3.time, Date);                                                                             // 44
                                                                                                                  // 45
    // Test logging falsy values, as well as single digits                                                        // 46
    // and some other non-stringy things                                                                          // 47
    // In a format of testcase, expected result, name of the test.                                                // 48
    var testcases = [                                                                                             // 49
          [1, "1", "single digit"],                                                                               // 50
          [0, "0", "falsy - 0"],                                                                                  // 51
          [null, "null", "falsy - null"],                                                                         // 52
          [undefined, "undefined", "falsy - undefined"],                                                          // 53
          [new Date("2013-06-13T01:15:16.000Z"), new Date("2013-06-13T01:15:16.000Z"), "date"],                   // 54
          [/[^regexp]{0,1}/g, "/[^regexp]{0,1}/g", "regexp"],                                                     // 55
          [true, "true", "boolean - true"],                                                                       // 56
          [false, "false", "boolean - false"],                                                                    // 57
          [-Infinity, "-Infinity", "number - -Infinity"]];                                                        // 58
                                                                                                                  // 59
    Log._intercept(testcases.length);                                                                             // 60
    _.each(testcases, function (testcase) {                                                                       // 61
      log(testcase[0]);                                                                                           // 62
    });                                                                                                           // 63
                                                                                                                  // 64
    intercepted = Log._intercepted();                                                                             // 65
                                                                                                                  // 66
    test.equal(intercepted.length, testcases.length);                                                             // 67
                                                                                                                  // 68
    _.each(testcases, function (testcase, index) {                                                                // 69
      var expected = testcase[1];                                                                                 // 70
      var testName = testcase[2];                                                                                 // 71
      var recieved = intercepted[index];                                                                          // 72
      var obj = EJSON.parse(recieved);                                                                            // 73
                                                                                                                  // 74
      // IE8 and old Safari don't support this date format. Skip it.                                              // 75
      if (expected && expected.toString &&                                                                        // 76
          (expected.toString() === "NaN" ||                                                                       // 77
           expected.toString() === "Invalid Date"))                                                               // 78
        return;                                                                                                   // 79
                                                                                                                  // 80
      if (_.isDate(testcase[0]))                                                                                  // 81
        obj.message = new Date(obj.message);                                                                      // 82
      test.equal(obj.message, expected, 'Logging ' + testName);                                                   // 83
    });                                                                                                           // 84
                                                                                                                  // 85
    // Tests for correct exceptions                                                                               // 86
    Log._intercept(6);                                                                                            // 87
                                                                                                                  // 88
    test.throws(function () {                                                                                     // 89
      log({time: 'not the right time'});                                                                          // 90
    });                                                                                                           // 91
    test.throws(function () {                                                                                     // 92
      log({level: 'not the right level'});                                                                        // 93
    });                                                                                                           // 94
    _.each(['file', 'line', 'program', 'originApp', 'satellite'],                                                 // 95
      function (restrictedKey) {                                                                                  // 96
      test.throws(function () {                                                                                   // 97
        var obj = {};                                                                                             // 98
        obj[restrictedKey] = 'usage of restricted key';                                                           // 99
        log(obj);                                                                                                 // 100
      });                                                                                                         // 101
    });                                                                                                           // 102
                                                                                                                  // 103
    // Can't pass numbers, objects, arrays, regexps or functions as message                                       // 104
    var throwingTestcases = [1, NaN, {foo:"bar"}, ["a", "r", "r"], null,                                          // 105
                             undefined, new Date, function () { return 42; },                                     // 106
                             /[regexp]/ ];                                                                        // 107
    Log._intercept(throwingTestcases.length);                                                                     // 108
    _.each(throwingTestcases, function (testcase) {                                                               // 109
      test.throws(function () {                                                                                   // 110
        log({ message: testcase });                                                                               // 111
      });                                                                                                         // 112
    });                                                                                                           // 113
                                                                                                                  // 114
    // Since all tests above should throw, nothing should be printed.                                             // 115
    // This call will set the logging interception to the clean state as well.                                    // 116
    test.equal(Log._intercepted().length, 0);                                                                     // 117
  };                                                                                                              // 118
                                                                                                                  // 119
  logBothMessageAndObject(Log, 'info');                                                                           // 120
  _.each(['info', 'warn', 'error'], function (level) {                                                            // 121
    logBothMessageAndObject(Log[level], level);                                                                   // 122
  });                                                                                                             // 123
});                                                                                                               // 124
                                                                                                                  // 125
Tinytest.add("logging - parse", function (test) {                                                                 // 126
  test.equal(Log.parse("message"), null);                                                                         // 127
  test.equal(Log.parse('{"foo": "bar"}'), null);                                                                  // 128
  var time = new Date;                                                                                            // 129
  test.equal(Log.parse('{"foo": "bar", "time": ' + EJSON.stringify(time) + '}'),                                  // 130
                        { foo: "bar", time: time });                                                              // 131
  test.equal(Log.parse('{"foo": not json "bar"}'), null);                                                         // 132
  test.equal(Log.parse('{"time": "not a date object"}'), null);                                                   // 133
});                                                                                                               // 134
                                                                                                                  // 135
Tinytest.add("logging - format", function (test) {                                                                // 136
  var time = new Date(2012, 9 - 1/*0-based*/, 8, 7, 6, 5, 4);                                                     // 137
  var utcOffsetStr = '(' + (-(new Date().getTimezoneOffset() / 60)) + ')';                                        // 138
                                                                                                                  // 139
  _.each(['debug', 'info', 'warn', 'error'], function (level) {                                                   // 140
    test.equal(                                                                                                   // 141
      Log.format({message: "message", time: time, level: level}),                                                 // 142
      level.charAt(0).toUpperCase() + "20120908-07:06:05.004" + utcOffsetStr + " message");                       // 143
                                                                                                                  // 144
    test.equal(                                                                                                   // 145
      Log.format({message: "message", time: time, timeInexact: true, level: level}),                              // 146
      level.charAt(0).toUpperCase() + "20120908-07:06:05.004" + utcOffsetStr + "? message");                      // 147
                                                                                                                  // 148
    test.equal(                                                                                                   // 149
      Log.format({foo1: "bar1", foo2: "bar2", time: time, level: level}),                                         // 150
      level.charAt(0).toUpperCase() + '20120908-07:06:05.004' + utcOffsetStr + ' {"foo1":"bar1","foo2":"bar2"}'); // 151
                                                                                                                  // 152
    test.equal(                                                                                                   // 153
      Log.format({message: "message", foo: "bar", time: time, level: level}),                                     // 154
      level.charAt(0).toUpperCase() + '20120908-07:06:05.004' + utcOffsetStr + ' message {"foo":"bar"}');         // 155
                                                                                                                  // 156
    // Has everything except stderr field                                                                         // 157
    test.equal(                                                                                                   // 158
      Log.format({message: "message", foo: "bar", time: time, level: level, file: "app.js", line:42, app: "myApp", originApp: "proxy", program: "server"}),
      level.charAt(0).toUpperCase() + '20120908-07:06:05.004' + utcOffsetStr + ' [myApp via proxy] (server:app.js:42) message {\"foo\":\"bar\"}');
                                                                                                                  // 161
    // stderr                                                                                                     // 162
    test.equal(                                                                                                   // 163
      Log.format({message: "message from stderr", time: time, level: level, stderr: true}),                       // 164
      level.charAt(0).toUpperCase() + '20120908-07:06:05.004' + utcOffsetStr + ' (STDERR) message from stderr');  // 165
                                                                                                                  // 166
    // app/originApp                                                                                              // 167
    test.equal(                                                                                                   // 168
      Log.format({message: "message", time: time, level: level, app: "app", originApp: "app"}),                   // 169
      level.charAt(0).toUpperCase() + '20120908-07:06:05.004' + utcOffsetStr + ' [app] message');                 // 170
    test.equal(                                                                                                   // 171
      Log.format({message: "message", time: time, level: level, app: "app", originApp: "proxy"}),                 // 172
      level.charAt(0).toUpperCase() + '20120908-07:06:05.004' + utcOffsetStr + ' [app via proxy] message');       // 173
                                                                                                                  // 174
    // source info                                                                                                // 175
    test.equal(                                                                                                   // 176
      Log.format({message: "message", time: time, level: level, file: "app.js", line: 42, program: "server"}),    // 177
      level.charAt(0).toUpperCase() + '20120908-07:06:05.004' + utcOffsetStr + ' (server:app.js:42) message');    // 178
    test.equal(                                                                                                   // 179
      Log.format({message: "message", time: time, level: level, file: "app.js", line: 42}),                       // 180
      level.charAt(0).toUpperCase() + '20120908-07:06:05.004' + utcOffsetStr + ' (app.js:42) message');           // 181
  });                                                                                                             // 182
});                                                                                                               // 183
                                                                                                                  // 184
                                                                                                                  // 185
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
