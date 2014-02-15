(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/browser-policy-content/browser-policy-content.js                     //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
// By adding this package, you get the following default policy:                 // 1
// No eval or other string-to-code, and content can only be loaded from the      // 2
// same origin as the app (except for XHRs and websocket connections, which can  // 3
// go to any origin).                                                            // 4
//                                                                               // 5
// Apps should call BrowserPolicy.content.disallowInlineScripts() if they are    // 6
// not using any inline script tags and are willing to accept an extra round     // 7
// trip on page load.                                                            // 8
//                                                                               // 9
// BrowserPolicy.content functions for tweaking CSP:                             // 10
// allowInlineScripts()                                                          // 11
// disallowInlineScripts(): adds extra round-trip to page load time              // 12
// allowInlineStyles()                                                           // 13
// disallowInlineStyles()                                                        // 14
// allowEval()                                                                   // 15
// disallowEval()                                                                // 16
//                                                                               // 17
// For each type of content (script, object, image, media, font, connect,        // 18
// style), there are the following functions:                                    // 19
// allow<content type>Origin(origin): allows the type of content to be loaded    // 20
// from the given origin                                                         // 21
// allow<content type>DataUrl(): allows the content to be loaded from data: URLs // 22
// allow<content type>SameOrigin(): allows the content to be loaded from the     // 23
// same origin                                                                   // 24
// disallow<content type>(): disallows this type of content all together (can't  // 25
// be called for script)                                                         // 26
//                                                                               // 27
// The following functions allow you to set rules for all types of content at    // 28
// once:                                                                         // 29
// allowAllContentOrigin(origin)                                                 // 30
// allowAllContentDataUrl()                                                      // 31
// allowAllContentSameOrigin()                                                   // 32
// disallowAllContent()                                                          // 33
//                                                                               // 34
                                                                                 // 35
var cspSrcs;                                                                     // 36
var cachedCsp; // Avoid constructing the header out of cspSrcs when possible.    // 37
                                                                                 // 38
// CSP keywords have to be single-quoted.                                        // 39
var unsafeInline = "'unsafe-inline'";                                            // 40
var unsafeEval = "'unsafe-eval'";                                                // 41
var selfKeyword = "'self'";                                                      // 42
var noneKeyword = "'none'";                                                      // 43
                                                                                 // 44
BrowserPolicy.content = {};                                                      // 45
                                                                                 // 46
var parseCsp = function (csp) {                                                  // 47
  var policies = csp.split("; ");                                                // 48
  cspSrcs = {};                                                                  // 49
  _.each(policies, function (policy) {                                           // 50
    if (policy[policy.length - 1] === ";")                                       // 51
      policy = policy.substring(0, policy.length - 1);                           // 52
    var srcs = policy.split(" ");                                                // 53
    var directive = srcs[0];                                                     // 54
    if (_.indexOf(srcs, noneKeyword) !== -1)                                     // 55
      cspSrcs[directive] = null;                                                 // 56
    else                                                                         // 57
      cspSrcs[directive] = srcs.slice(1);                                        // 58
  });                                                                            // 59
                                                                                 // 60
  if (cspSrcs["default-src"] === undefined)                                      // 61
    throw new Error("Content Security Policies used with " +                     // 62
                    "browser-policy must specify a default-src.");               // 63
                                                                                 // 64
  // Copy default-src sources to other directives.                               // 65
  _.each(cspSrcs, function (sources, directive) {                                // 66
    cspSrcs[directive] = _.union(sources || [], cspSrcs["default-src"] || []);   // 67
  });                                                                            // 68
};                                                                               // 69
                                                                                 // 70
var removeCspSrc = function (directive, src) {                                   // 71
  cspSrcs[directive] = _.without(cspSrcs[directive] || [], src);                 // 72
};                                                                               // 73
                                                                                 // 74
// Prepare for a change to cspSrcs. Ensure that we have a key in the dictionary  // 75
// and clear any cached CSP.                                                     // 76
var prepareForCspDirective = function (directive) {                              // 77
  cspSrcs = cspSrcs || {};                                                       // 78
  cachedCsp = null;                                                              // 79
  if (! _.has(cspSrcs, directive))                                               // 80
    cspSrcs[directive] = _.clone(cspSrcs["default-src"]);                        // 81
};                                                                               // 82
                                                                                 // 83
var setDefaultPolicy = function () {                                             // 84
  // By default, unsafe inline scripts and styles are allowed, since we expect   // 85
  // many apps will use them for analytics, etc. Unsafe eval is disallowed, and  // 86
  // the only allowable content source is the same origin or data, except for    // 87
  // connect which allows anything (since meteor.com apps make websocket         // 88
  // connections to a lot of different origins).                                 // 89
  BrowserPolicy.content.setPolicy("default-src 'self'; " +                       // 90
                                  "script-src 'self' 'unsafe-inline'; " +        // 91
                                  "connect-src *; " +                            // 92
                                  "img-src data: 'self'; " +                     // 93
                                  "style-src 'self' 'unsafe-inline';");          // 94
};                                                                               // 95
                                                                                 // 96
var setWebAppInlineScripts = function (value) {                                  // 97
  if (! BrowserPolicy._runningTest())                                            // 98
    WebAppInternals.setInlineScriptsAllowed(value);                              // 99
};                                                                               // 100
                                                                                 // 101
_.extend(BrowserPolicy.content, {                                                // 102
  // Exported for tests and browser-policy-common.                               // 103
  _constructCsp: function () {                                                   // 104
    if (! cspSrcs || _.isEmpty(cspSrcs))                                         // 105
      return null;                                                               // 106
                                                                                 // 107
    if (cachedCsp)                                                               // 108
      return cachedCsp;                                                          // 109
                                                                                 // 110
    var header = _.map(cspSrcs, function (srcs, directive) {                     // 111
      srcs = srcs || [];                                                         // 112
      if (_.isEmpty(srcs))                                                       // 113
        srcs = [noneKeyword];                                                    // 114
      var directiveCsp = _.uniq(srcs).join(" ");                                 // 115
      return directive + " " + directiveCsp + ";";                               // 116
    });                                                                          // 117
                                                                                 // 118
    header = header.join(" ");                                                   // 119
    cachedCsp = header;                                                          // 120
    return header;                                                               // 121
  },                                                                             // 122
  _reset: function () {                                                          // 123
    cachedCsp = null;                                                            // 124
    setDefaultPolicy();                                                          // 125
  },                                                                             // 126
                                                                                 // 127
  setPolicy: function (csp) {                                                    // 128
    cachedCsp = null;                                                            // 129
    parseCsp(csp);                                                               // 130
    setWebAppInlineScripts(                                                      // 131
      BrowserPolicy.content._keywordAllowed("script-src", unsafeInline)          // 132
    );                                                                           // 133
  },                                                                             // 134
                                                                                 // 135
  _keywordAllowed: function (directive, keyword) {                               // 136
    return (cspSrcs[directive] &&                                                // 137
            _.indexOf(cspSrcs[directive], keyword) !== -1);                      // 138
  },                                                                             // 139
                                                                                 // 140
  // Helpers for creating content security policies                              // 141
                                                                                 // 142
  allowInlineScripts: function () {                                              // 143
    prepareForCspDirective("script-src");                                        // 144
    cspSrcs["script-src"].push(unsafeInline);                                    // 145
    setWebAppInlineScripts(true);                                                // 146
  },                                                                             // 147
  disallowInlineScripts: function () {                                           // 148
    prepareForCspDirective("script-src");                                        // 149
    removeCspSrc("script-src", unsafeInline);                                    // 150
    setWebAppInlineScripts(false);                                               // 151
  },                                                                             // 152
  allowEval: function () {                                                       // 153
    prepareForCspDirective("script-src");                                        // 154
    cspSrcs["script-src"].push(unsafeEval);                                      // 155
  },                                                                             // 156
  disallowEval: function () {                                                    // 157
    prepareForCspDirective("script-src");                                        // 158
    removeCspSrc("script-src", unsafeEval);                                      // 159
  },                                                                             // 160
  allowInlineStyles: function () {                                               // 161
    prepareForCspDirective("style-src");                                         // 162
    cspSrcs["style-src"].push(unsafeInline);                                     // 163
  },                                                                             // 164
  disallowInlineStyles: function () {                                            // 165
    prepareForCspDirective("style-src");                                         // 166
    removeCspSrc("style-src", unsafeInline);                                     // 167
  },                                                                             // 168
                                                                                 // 169
  // Functions for setting defaults                                              // 170
  allowSameOriginForAll: function () {                                           // 171
    BrowserPolicy.content.allowOriginForAll(selfKeyword);                        // 172
  },                                                                             // 173
  allowDataUrlForAll: function () {                                              // 174
    BrowserPolicy.content.allowOriginForAll("data:");                            // 175
  },                                                                             // 176
  allowOriginForAll: function (origin) {                                         // 177
    prepareForCspDirective("default-src");                                       // 178
    _.each(_.keys(cspSrcs), function (directive) {                               // 179
      cspSrcs[directive].push(origin);                                           // 180
    });                                                                          // 181
  },                                                                             // 182
  disallowAll: function () {                                                     // 183
    cachedCsp = null;                                                            // 184
    cspSrcs = {                                                                  // 185
      "default-src": []                                                          // 186
    };                                                                           // 187
    setWebAppInlineScripts(false);                                               // 188
  }                                                                              // 189
});                                                                              // 190
                                                                                 // 191
// allow<Resource>Origin, allow<Resource>Data, allow<Resource>self, and          // 192
// disallow<Resource> methods for each type of resource.                         // 193
_.each(["script", "object", "img", "media",                                      // 194
        "font", "connect", "style"],                                             // 195
       function (resource) {                                                     // 196
         var directive = resource + "-src";                                      // 197
         var methodResource;                                                     // 198
         if (resource !== "img") {                                               // 199
           methodResource = resource.charAt(0).toUpperCase() +                   // 200
             resource.slice(1);                                                  // 201
         } else {                                                                // 202
           methodResource = "Image";                                             // 203
         }                                                                       // 204
         var allowMethodName = "allow" + methodResource + "Origin";              // 205
         var disallowMethodName = "disallow" + methodResource;                   // 206
         var allowDataMethodName = "allow" + methodResource + "DataUrl";         // 207
         var allowSelfMethodName = "allow" + methodResource + "SameOrigin";      // 208
                                                                                 // 209
         var disallow = function () {                                            // 210
           cachedCsp = null;                                                     // 211
           cspSrcs[directive] = [];                                              // 212
         };                                                                      // 213
                                                                                 // 214
         BrowserPolicy.content[allowMethodName] = function (src) {               // 215
           prepareForCspDirective(directive);                                    // 216
           cspSrcs[directive].push(src);                                         // 217
         };                                                                      // 218
         if (resource === "script") {                                            // 219
           BrowserPolicy.content[disallowMethodName] = function () {             // 220
             disallow();                                                         // 221
             setWebAppInlineScripts(false);                                      // 222
           };                                                                    // 223
         } else {                                                                // 224
           BrowserPolicy.content[disallowMethodName] = disallow;                 // 225
         }                                                                       // 226
         BrowserPolicy.content[allowDataMethodName] = function () {              // 227
           prepareForCspDirective(directive);                                    // 228
           cspSrcs[directive].push("data:");                                     // 229
         };                                                                      // 230
         BrowserPolicy.content[allowSelfMethodName] = function () {              // 231
           prepareForCspDirective(directive);                                    // 232
           cspSrcs[directive].push(selfKeyword);                                 // 233
         };                                                                      // 234
       });                                                                       // 235
                                                                                 // 236
                                                                                 // 237
setDefaultPolicy();                                                              // 238
                                                                                 // 239
///////////////////////////////////////////////////////////////////////////////////

}).call(this);
