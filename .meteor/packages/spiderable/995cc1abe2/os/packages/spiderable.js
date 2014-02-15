(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/spiderable/spiderable.js                                                                               //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
var fs = Npm.require('fs');                                                                                        // 1
var child_process = Npm.require('child_process');                                                                  // 2
var querystring = Npm.require('querystring');                                                                      // 3
var urlParser = Npm.require('url');                                                                                // 4
                                                                                                                   // 5
Spiderable = {};                                                                                                   // 6
                                                                                                                   // 7
// list of bot user agents that we want to serve statically, but do                                                // 8
// not obey the _escaped_fragment_ protocol. The page is served                                                    // 9
// statically to any client whos user agent matches any of these                                                   // 10
// regexps. Users may modify this array.                                                                           // 11
//                                                                                                                 // 12
// An original goal with the spiderable package was to avoid doing                                                 // 13
// user-agent based tests. But the reality is not enough bots support                                              // 14
// the _escaped_fragment_ protocol, so we need to hardcode a list                                                  // 15
// here. I shed a silent tear.                                                                                     // 16
Spiderable.userAgentRegExps = [                                                                                    // 17
    /^facebookexternalhit/i, /^linkedinbot/i, /^twitterbot/i];                                                     // 18
                                                                                                                   // 19
// how long to let phantomjs run before we kill it                                                                 // 20
var REQUEST_TIMEOUT = 15*1000;                                                                                     // 21
// maximum size of result HTML. node's default is 200k which is too                                                // 22
// small for our docs.                                                                                             // 23
var MAX_BUFFER = 5*1024*1024; // 5MB                                                                               // 24
                                                                                                                   // 25
WebApp.connectHandlers.use(function (req, res, next) {                                                             // 26
  if (/\?.*_escaped_fragment_=/.test(req.url) ||                                                                   // 27
      _.any(Spiderable.userAgentRegExps, function (re) {                                                           // 28
        return re.test(req.headers['user-agent']); })) {                                                           // 29
                                                                                                                   // 30
    // reassembling url without escaped fragment if exists                                                         // 31
    var parsedUrl = urlParser.parse(req.url);                                                                      // 32
    var parsedQuery = querystring.parse(parsedUrl.query);                                                          // 33
    delete parsedQuery['_escaped_fragment_'];                                                                      // 34
    var newQuery = querystring.stringify(parsedQuery);                                                             // 35
    var newPath = parsedUrl.pathname + (newQuery ? ('?' + newQuery) : '');                                         // 36
    var url = "http://" + req.headers.host + newPath;                                                              // 37
                                                                                                                   // 38
    // This string is going to be put into a bash script, so it's important                                        // 39
    // that 'url' (which comes from the network) can neither exploit phantomjs                                     // 40
    // or the bash script. JSON stringification should prevent it from                                             // 41
    // exploiting phantomjs, and since the output of JSON.stringify shouldn't                                      // 42
    // be able to contain newlines, it should be unable to exploit bash as                                         // 43
    // well.                                                                                                       // 44
    var phantomScript = "var url = " + JSON.stringify(url) + ";" +                                                 // 45
          "var page = require('webpage').create();" +                                                              // 46
          "page.open(url);" +                                                                                      // 47
          "setInterval(function() {" +                                                                             // 48
          "  var ready = page.evaluate(function () {" +                                                            // 49
          "    if (typeof Meteor !== 'undefined' " +                                                               // 50
          "        && typeof(Meteor.status) !== 'undefined' " +                                                    // 51
          "        && Meteor.status().connected) {" +                                                              // 52
          "      Deps.flush();" +                                                                                  // 53
          "      return DDP._allSubscriptionsReady();" +                                                           // 54
          "    }" +                                                                                                // 55
          "    return false;" +                                                                                    // 56
          "  });" +                                                                                                // 57
          "  if (ready) {" +                                                                                       // 58
          "    var out = page.content;" +                                                                          // 59
          "    out = out.replace(/<script[^>]+>(.|\\n|\\r)*?<\\/script\\s*>/ig, '');" +                            // 60
          "    out = out.replace('<meta name=\"fragment\" content=\"!\">', '');" +                                 // 61
          "    console.log(out);" +                                                                                // 62
          "    phantom.exit();" +                                                                                  // 63
          "  }" +                                                                                                  // 64
          "}, 100);\n";                                                                                            // 65
                                                                                                                   // 66
    // Run phantomjs.                                                                                              // 67
    //                                                                                                             // 68
    // Use '/dev/stdin' to avoid writing to a temporary file. We can't                                             // 69
    // just omit the file, as PhantomJS takes that to mean 'use a                                                  // 70
    // REPL' and exits as soon as stdin closes.                                                                    // 71
    //                                                                                                             // 72
    // However, Node 0.8 broke the ability to open /dev/stdin in the                                               // 73
    // subprocess, so we can't just write our string to the process's stdin                                        // 74
    // directly; see https://gist.github.com/3751746 for the gory details. We                                      // 75
    // work around this with a bash heredoc. (We previous used a "cat |"                                           // 76
    // instead, but that meant we couldn't use exec and had to manage several                                      // 77
    // processes.)                                                                                                 // 78
    child_process.execFile(                                                                                        // 79
      '/bin/bash',                                                                                                 // 80
      ['-c',                                                                                                       // 81
       ("exec phantomjs --load-images=no /dev/stdin <<'END'\n" +                                                   // 82
        phantomScript + "END\n")],                                                                                 // 83
      {timeout: REQUEST_TIMEOUT, maxBuffer: MAX_BUFFER},                                                           // 84
      function (error, stdout, stderr) {                                                                           // 85
        if (!error && /<html/i.test(stdout)) {                                                                     // 86
          res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});                                        // 87
          res.end(stdout);                                                                                         // 88
        } else {                                                                                                   // 89
          // phantomjs failed. Don't send the error, instead send the                                              // 90
          // normal page.                                                                                          // 91
          if (error && error.code === 127)                                                                         // 92
            Meteor._debug("spiderable: phantomjs not installed. Download and install from http://phantomjs.org/"); // 93
          else                                                                                                     // 94
            Meteor._debug("spiderable: phantomjs failed:", error, "\nstderr:", stderr);                            // 95
                                                                                                                   // 96
          next();                                                                                                  // 97
        }                                                                                                          // 98
      });                                                                                                          // 99
  } else {                                                                                                         // 100
    next();                                                                                                        // 101
  }                                                                                                                // 102
});                                                                                                                // 103
                                                                                                                   // 104
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
