(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/browser-policy/browser-policy-test.js                                                          //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
BrowserPolicy._setRunningTest();                                                                           // 1
                                                                                                           // 2
var cspsEqual = function (csp1, csp2) {                                                                    // 3
  var cspToObj = function (csp) {                                                                          // 4
    csp = csp.substring(0, csp.length - 1);                                                                // 5
    var parts = _.map(csp.split("; "), function (part) {                                                   // 6
      return part.split(" ");                                                                              // 7
    });                                                                                                    // 8
    var keys = _.map(parts, _.first);                                                                      // 9
    var values = _.map(parts, _.rest);                                                                     // 10
    _.each(values, function (value) {                                                                      // 11
      value.sort();                                                                                        // 12
    });                                                                                                    // 13
    return _.object(keys, values);                                                                         // 14
  };                                                                                                       // 15
                                                                                                           // 16
  return EJSON.equals(cspToObj(csp1), cspToObj(csp2));                                                     // 17
};                                                                                                         // 18
                                                                                                           // 19
// It's important to call _reset() at the beginnning of these tests; otherwise                             // 20
// the headers left over at the end of the last test run will be used.                                     // 21
                                                                                                           // 22
Tinytest.add("browser-policy - csp", function (test) {                                                     // 23
  var defaultCsp = "default-src 'self'; script-src 'self' 'unsafe-inline'; " +                             // 24
        "connect-src * 'self'; img-src data: 'self'; style-src 'self' 'unsafe-inline';"                    // 25
                                                                                                           // 26
  BrowserPolicy.content._reset();                                                                          // 27
  // Default policy                                                                                        // 28
  test.isTrue(cspsEqual(BrowserPolicy.content._constructCsp(), defaultCsp));                               // 29
  test.isTrue(BrowserPolicy.content._keywordAllowed("script-src", "'unsafe-inline'"));                     // 30
                                                                                                           // 31
  // Redundant whitelisting (inline scripts already allowed in default policy)                             // 32
  BrowserPolicy.content.allowInlineScripts();                                                              // 33
  test.isTrue(cspsEqual(BrowserPolicy.content._constructCsp(), defaultCsp));                               // 34
                                                                                                           // 35
  // Disallow inline scripts                                                                               // 36
  BrowserPolicy.content.disallowInlineScripts();                                                           // 37
  test.isTrue(cspsEqual(BrowserPolicy.content._constructCsp(),                                             // 38
                        "default-src 'self'; script-src 'self'; " +                                        // 39
                        "connect-src * 'self'; img-src data: 'self'; style-src 'self' 'unsafe-inline';")); // 40
  test.isFalse(BrowserPolicy.content._keywordAllowed("script-src", "'unsafe-inline'"));                    // 41
                                                                                                           // 42
  // Allow eval                                                                                            // 43
  BrowserPolicy.content.allowEval();                                                                       // 44
  test.isTrue(cspsEqual(BrowserPolicy.content._constructCsp(), "default-src 'self'; script-src 'self' 'unsafe-eval'; " +
                        "connect-src * 'self'; img-src data: 'self'; style-src 'self' 'unsafe-inline';")); // 46
                                                                                                           // 47
  // Disallow inline styles                                                                                // 48
  BrowserPolicy.content.disallowInlineStyles();                                                            // 49
  test.isTrue(cspsEqual(BrowserPolicy.content._constructCsp(), "default-src 'self'; script-src 'self' 'unsafe-eval'; " +
                        "connect-src * 'self'; img-src data: 'self'; style-src 'self';"));                 // 51
                                                                                                           // 52
  // Allow data: urls everywhere                                                                           // 53
  BrowserPolicy.content.allowDataUrlForAll();                                                              // 54
  test.isTrue(cspsEqual(BrowserPolicy.content._constructCsp(),                                             // 55
                        "default-src 'self' data:; script-src 'self' 'unsafe-eval' data:; " +              // 56
                        "connect-src * data: 'self'; img-src data: 'self'; style-src 'self' data:;"));     // 57
                                                                                                           // 58
  // Disallow everything                                                                                   // 59
  BrowserPolicy.content.disallowAll();                                                                     // 60
  test.isTrue(cspsEqual(BrowserPolicy.content._constructCsp(), "default-src 'none';"));                    // 61
  test.isFalse(BrowserPolicy.content._keywordAllowed("script-src", "'unsafe-inline'"));                    // 62
                                                                                                           // 63
  // Put inline scripts back in                                                                            // 64
  BrowserPolicy.content.allowInlineScripts();                                                              // 65
  test.isTrue(cspsEqual(BrowserPolicy.content._constructCsp(),                                             // 66
                        "default-src 'none'; script-src 'unsafe-inline';"));                               // 67
  test.isTrue(BrowserPolicy.content._keywordAllowed("script-src", "'unsafe-inline'"));                     // 68
                                                                                                           // 69
  // Add 'self' to all content types                                                                       // 70
  BrowserPolicy.content.allowSameOriginForAll();                                                           // 71
  test.isTrue(cspsEqual(BrowserPolicy.content._constructCsp(),                                             // 72
                        "default-src 'self'; script-src 'self' 'unsafe-inline';"));                        // 73
  test.isTrue(BrowserPolicy.content._keywordAllowed("script-src", "'unsafe-inline'"));                     // 74
                                                                                                           // 75
  // Disallow all content except same-origin scripts                                                       // 76
  BrowserPolicy.content.disallowAll();                                                                     // 77
  BrowserPolicy.content.allowScriptSameOrigin();                                                           // 78
  test.isTrue(cspsEqual(BrowserPolicy.content._constructCsp(),                                             // 79
                        "default-src 'none'; script-src 'self';"));                                        // 80
  test.isFalse(BrowserPolicy.content._keywordAllowed("script-src", "'unsafe-inline'"));                    // 81
                                                                                                           // 82
  // Starting with all content same origin, disallowScript() and then allow                                // 83
  // inline scripts. Result should be that that only inline scripts can execute,                           // 84
  // not same-origin scripts.                                                                              // 85
  BrowserPolicy.content.disallowAll();                                                                     // 86
  BrowserPolicy.content.allowSameOriginForAll();                                                           // 87
  test.isTrue(cspsEqual(BrowserPolicy.content._constructCsp(), "default-src 'self';"));                    // 88
  BrowserPolicy.content.disallowScript();                                                                  // 89
  test.isTrue(cspsEqual(BrowserPolicy.content._constructCsp(),                                             // 90
                        "default-src 'self'; script-src 'none';"));                                        // 91
  test.isFalse(BrowserPolicy.content._keywordAllowed("script-src", "'unsafe-inline'"));                    // 92
  BrowserPolicy.content.allowInlineScripts();                                                              // 93
  test.isTrue(cspsEqual(BrowserPolicy.content._constructCsp(),                                             // 94
                        "default-src 'self'; script-src 'unsafe-inline';"));                               // 95
  test.isTrue(BrowserPolicy.content._keywordAllowed("script-src", "'unsafe-inline'"));                     // 96
                                                                                                           // 97
  // Starting with all content same origin, allow inline scripts. (Should result                           // 98
  // in both same origin and inline scripts allowed.)                                                      // 99
  BrowserPolicy.content.disallowAll();                                                                     // 100
  BrowserPolicy.content.allowSameOriginForAll();                                                           // 101
  BrowserPolicy.content.allowInlineScripts();                                                              // 102
  test.isTrue(cspsEqual(BrowserPolicy.content._constructCsp(),                                             // 103
                        "default-src 'self'; script-src 'self' 'unsafe-inline';"));                        // 104
  BrowserPolicy.content.disallowInlineScripts();                                                           // 105
  test.isTrue(cspsEqual(BrowserPolicy.content._constructCsp(),                                             // 106
                        "default-src 'self'; script-src 'self';"));                                        // 107
                                                                                                           // 108
  // Allow same origin for all content, then disallow object entirely.                                     // 109
  BrowserPolicy.content.disallowAll();                                                                     // 110
  BrowserPolicy.content.allowSameOriginForAll();                                                           // 111
  BrowserPolicy.content.disallowObject();                                                                  // 112
  test.isTrue(cspsEqual(BrowserPolicy.content._constructCsp(),                                             // 113
                        "default-src 'self'; object-src 'none';"));                                        // 114
});                                                                                                        // 115
                                                                                                           // 116
Tinytest.add("browser-policy - x-frame-options", function (test) {                                         // 117
  BrowserPolicy.framing._reset();                                                                          // 118
  test.equal(BrowserPolicy.framing._constructXFrameOptions(), "SAMEORIGIN");                               // 119
  BrowserPolicy.framing.disallow();                                                                        // 120
  test.equal(BrowserPolicy.framing._constructXFrameOptions(), "DENY");                                     // 121
  BrowserPolicy.framing.allowAll();                                                                        // 122
  test.equal(BrowserPolicy.framing._constructXFrameOptions(), null);                                       // 123
  BrowserPolicy.framing.restrictToOrigin("foo.com");                                                       // 124
  test.equal(BrowserPolicy.framing._constructXFrameOptions(), "ALLOW-FROM foo.com");                       // 125
  test.throws(function () {                                                                                // 126
    BrowserPolicy.framing.restrictToOrigin("bar.com");                                                     // 127
  });                                                                                                      // 128
});                                                                                                        // 129
                                                                                                           // 130
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
