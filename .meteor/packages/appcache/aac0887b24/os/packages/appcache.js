(function () {

/////////////////////////////////////////////////////////////////////////////////
//                                                                             //
// packages/appcache/appcache-server.js                                        //
//                                                                             //
/////////////////////////////////////////////////////////////////////////////////
                                                                               //
var crypto = Npm.require('crypto');                                            // 1
var fs = Npm.require('fs');                                                    // 2
var path = Npm.require('path');                                                // 3
                                                                               // 4
var knownBrowsers = [                                                          // 5
  'android',                                                                   // 6
  'chrome',                                                                    // 7
  'chromium',                                                                  // 8
  'chromeMobileIOS',                                                           // 9
  'firefox',                                                                   // 10
  'ie',                                                                        // 11
  'mobileSafari',                                                              // 12
  'safari'                                                                     // 13
];                                                                             // 14
                                                                               // 15
var browsersEnabledByDefault = [                                               // 16
  'android',                                                                   // 17
  'chrome',                                                                    // 18
  'chromium',                                                                  // 19
  'chromeMobileIOS',                                                           // 20
  'ie',                                                                        // 21
  'mobileSafari',                                                              // 22
  'safari'                                                                     // 23
];                                                                             // 24
                                                                               // 25
var enabledBrowsers = {};                                                      // 26
_.each(browsersEnabledByDefault, function (browser) {                          // 27
  enabledBrowsers[browser] = true;                                             // 28
});                                                                            // 29
                                                                               // 30
Meteor.AppCache = {                                                            // 31
  config: function(options) {                                                  // 32
    _.each(options, function (value, option) {                                 // 33
      if (option === 'browsers') {                                             // 34
        enabledBrowsers = {};                                                  // 35
        _.each(value, function (browser) {                                     // 36
          enabledBrowsers[browser] = true;                                     // 37
        });                                                                    // 38
      }                                                                        // 39
      else if (_.contains(knownBrowsers, option)) {                            // 40
        enabledBrowsers[option] = value;                                       // 41
      }                                                                        // 42
      else if (option === 'onlineOnly') {                                      // 43
        _.each(value, function (urlPrefix) {                                   // 44
          RoutePolicy.declare(urlPrefix, 'static-online');                     // 45
        });                                                                    // 46
      }                                                                        // 47
      else {                                                                   // 48
        throw new Error('Invalid AppCache config option: ' + option);          // 49
      }                                                                        // 50
    });                                                                        // 51
  }                                                                            // 52
};                                                                             // 53
                                                                               // 54
var browserEnabled = function(request) {                                       // 55
  return enabledBrowsers[request.browser.name];                                // 56
};                                                                             // 57
                                                                               // 58
WebApp.addHtmlAttributeHook(function (request) {                               // 59
  if (browserEnabled(request))                                                 // 60
    return 'manifest="/app.manifest"';                                         // 61
  else                                                                         // 62
    return null;                                                               // 63
});                                                                            // 64
                                                                               // 65
WebApp.connectHandlers.use(function(req, res, next) {                          // 66
  if (req.url !== '/app.manifest') {                                           // 67
    return next();                                                             // 68
  }                                                                            // 69
                                                                               // 70
  // Browsers will get confused if we unconditionally serve the                // 71
  // manifest and then disable the app cache for that browser.  If             // 72
  // the app cache had previously been enabled for a browser, it               // 73
  // will continue to fetch the manifest as long as it's available,            // 74
  // even if we now are not including the manifest attribute in the            // 75
  // app HTML.  (Firefox for example will continue to display "this            // 76
  // website is asking to store data on your computer for offline              // 77
  // use").  Returning a 404 gets the browser to really turn off the           // 78
  // app cache.                                                                // 79
                                                                               // 80
  if (!browserEnabled(WebApp.categorizeRequest(req))) {                        // 81
    res.writeHead(404);                                                        // 82
    res.end();                                                                 // 83
    return;                                                                    // 84
  }                                                                            // 85
                                                                               // 86
  var manifest = "CACHE MANIFEST\n\n";                                         // 87
                                                                               // 88
  // After the browser has downloaded the app files from the server and        // 89
  // has populated the browser's application cache, the browser will           // 90
  // *only* connect to the server and reload the application if the            // 91
  // *contents* of the app manifest file has changed.                          // 92
  //                                                                           // 93
  // So to ensure that the client updates if client resources change,          // 94
  // include a hash of client resources in the manifest.                       // 95
                                                                               // 96
  manifest += "# " + WebApp.clientHash + "\n";                                 // 97
                                                                               // 98
  // When using the autoupdate package, also include                           // 99
  // AUTOUPDATE_VERSION.  Otherwise the client will get into an                // 100
  // infinite loop of reloads when the browser doesn't fetch the new           // 101
  // app HTML which contains the new version, and autoupdate will              // 102
  // reload again trying to get the new code.                                  // 103
                                                                               // 104
  if (Package.autoupdate) {                                                    // 105
    var version = Package.autoupdate.Autoupdate.autoupdateVersion;             // 106
    if (version !== WebApp.clientHash)                                         // 107
      manifest += "# " + version + "\n";                                       // 108
  }                                                                            // 109
                                                                               // 110
  manifest += "\n";                                                            // 111
                                                                               // 112
  manifest += "CACHE:" + "\n";                                                 // 113
  manifest += "/" + "\n";                                                      // 114
  _.each(WebApp.clientProgram.manifest, function (resource) {                  // 115
    if (resource.where === 'client' &&                                         // 116
        ! RoutePolicy.classify(resource.url)) {                                // 117
      manifest += resource.url;                                                // 118
      // If the resource is not already cacheable (has a query                 // 119
      // parameter, presumably with a hash or version of some sort),           // 120
      // put a version with a hash in the cache.                               // 121
      //                                                                       // 122
      // Avoid putting a non-cacheable asset into the cache, otherwise         // 123
      // the user can't modify the asset until the cache headers               // 124
      // expire.                                                               // 125
      if (!resource.cacheable)                                                 // 126
        manifest += "?" + resource.hash;                                       // 127
                                                                               // 128
      manifest += "\n";                                                        // 129
    }                                                                          // 130
  });                                                                          // 131
  manifest += "\n";                                                            // 132
                                                                               // 133
  manifest += "FALLBACK:\n";                                                   // 134
  manifest += "/ /" + "\n";                                                    // 135
  // Add a fallback entry for each uncacheable asset we added above.           // 136
  //                                                                           // 137
  // This means requests for the bare url (/image.png instead of               // 138
  // /image.png?hash) will work offline. Online, however, the browser          // 139
  // will send a request to the server. Users can remove this extra            // 140
  // request to the server and have the asset served from cache by             // 141
  // specifying the full URL with hash in their code (manually, with           // 142
  // some sort of URL rewriting helper)                                        // 143
  _.each(WebApp.clientProgram.manifest, function (resource) {                  // 144
    if (resource.where === 'client' &&                                         // 145
        ! RoutePolicy.classify(resource.url) &&                                // 146
        !resource.cacheable) {                                                 // 147
      manifest += resource.url + " " + resource.url +                          // 148
        "?" + resource.hash + "\n";                                            // 149
    }                                                                          // 150
  });                                                                          // 151
                                                                               // 152
  manifest += "\n";                                                            // 153
                                                                               // 154
  manifest += "NETWORK:\n";                                                    // 155
  // TODO adding the manifest file to NETWORK should be unnecessary?           // 156
  // Want more testing to be sure.                                             // 157
  manifest += "/app.manifest" + "\n";                                          // 158
  _.each(                                                                      // 159
    [].concat(                                                                 // 160
      RoutePolicy.urlPrefixesFor('network'),                                   // 161
      RoutePolicy.urlPrefixesFor('static-online')                              // 162
    ),                                                                         // 163
    function (urlPrefix) {                                                     // 164
      manifest += urlPrefix + "\n";                                            // 165
    }                                                                          // 166
  );                                                                           // 167
  manifest += "*" + "\n";                                                      // 168
                                                                               // 169
  // content length needs to be based on bytes                                 // 170
  var body = new Buffer(manifest);                                             // 171
                                                                               // 172
  res.setHeader('Content-Type', 'text/cache-manifest');                        // 173
  res.setHeader('Content-Length', body.length);                                // 174
  return res.end(body);                                                        // 175
});                                                                            // 176
                                                                               // 177
var sizeCheck = function() {                                                   // 178
  var totalSize = 0;                                                           // 179
  _.each(WebApp.clientProgram.manifest, function (resource) {                  // 180
    if (resource.cacheable && resource.where === 'client') {                   // 181
      totalSize += resource.size;                                              // 182
    }                                                                          // 183
  });                                                                          // 184
  if (totalSize > 5 * 1024 * 1024) {                                           // 185
    Meteor._debug(                                                             // 186
      "** You are using the appcache package but the total size of the\n" +    // 187
      "** cached resources is " +                                              // 188
      (totalSize / 1024 / 1024).toFixed(1) + "MB.\n" +                         // 189
      "**\n" +                                                                 // 190
      "** This is over the recommended maximum of 5 MB and may break your\n" + // 191
      "** app in some browsers! See http://docs.meteor.com/#appcache\n" +      // 192
      "** for more information and fixes.\n"                                   // 193
    );                                                                         // 194
  }                                                                            // 195
};                                                                             // 196
                                                                               // 197
sizeCheck();                                                                   // 198
                                                                               // 199
/////////////////////////////////////////////////////////////////////////////////

}).call(this);
