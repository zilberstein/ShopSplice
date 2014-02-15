(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                      //
// packages/force-ssl/force_ssl_common.js                                                               //
//                                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                        //
_.extend(Meteor.absoluteUrl.defaultOptions, {secure: true});                                            // 1
                                                                                                        // 2
//////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                      //
// packages/force-ssl/force_ssl_server.js                                                               //
//                                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                        //
// Unfortunately we can't use a connect middleware here since                                           // 1
// sockjs installs itself prior to all existing listeners                                               // 2
// (meaning prior to any connect middlewares) so we need to take                                        // 3
// an approach similar to overshadowListeners in                                                        // 4
// https://github.com/sockjs/sockjs-node/blob/cf820c55af6a9953e16558555a31decea554f70e/src/utils.coffee // 5
                                                                                                        // 6
var httpServer = WebApp.httpServer;                                                                     // 7
var oldHttpServerListeners = httpServer.listeners('request').slice(0);                                  // 8
httpServer.removeAllListeners('request');                                                               // 9
httpServer.addListener('request', function (req, res) {                                                 // 10
                                                                                                        // 11
  // allow connections if they have been handled w/ ssl already                                         // 12
  // (either by us or by a proxy) OR the connection is entirely over                                    // 13
  // localhost (development mode).                                                                      // 14
  //                                                                                                    // 15
  // Note: someone could trick us into serving over non-ssl by setting                                  // 16
  // x-forwarded-for or x-forwarded-proto. Not much we can do there if                                  // 17
  // we still want to operate behind proxies.                                                           // 18
                                                                                                        // 19
  var remoteAddress =                                                                                   // 20
        req.connection.remoteAddress || req.socket.remoteAddress;                                       // 21
  // Determine if the connection is only over localhost. Both we                                        // 22
  // received it on localhost, and all proxies involved received on                                     // 23
  // localhost.                                                                                         // 24
  var isLocal = (                                                                                       // 25
    remoteAddress === "127.0.0.1" &&                                                                    // 26
      (!req.headers['x-forwarded-for'] ||                                                               // 27
       _.all(req.headers['x-forwarded-for'].split(','), function (x) {                                  // 28
         return /\s*127\.0\.0\.1\s*/.test(x);                                                           // 29
       })));                                                                                            // 30
                                                                                                        // 31
  // Determine if the connection was over SSL at any point. Either we                                   // 32
  // received it as SSL, or a proxy did and translated it for us.                                       // 33
  var isSsl = req.connection.pair ||                                                                    // 34
      (req.headers['x-forwarded-proto'] &&                                                              // 35
       req.headers['x-forwarded-proto'].indexOf('https') !== -1);                                       // 36
                                                                                                        // 37
  if (!isLocal && !isSsl) {                                                                             // 38
    // connection is not cool. send a 302 redirect!                                                     // 39
                                                                                                        // 40
    // if we don't have a host header, there's not a lot we can do. We                                  // 41
    // don't know how to redirect them.                                                                 // 42
    // XXX can we do better here?                                                                       // 43
    var host = req.headers.host || 'no-host-header';                                                    // 44
                                                                                                        // 45
    // strip off the port number. If we went to a URL with a custom                                     // 46
    // port, we don't know what the custom SSL port is anyway.                                          // 47
    host = host.replace(/:\d+$/, '');                                                                   // 48
                                                                                                        // 49
    res.writeHead(302, {                                                                                // 50
      'Location': 'https://' + host + req.url                                                           // 51
    });                                                                                                 // 52
    res.end();                                                                                          // 53
    return;                                                                                             // 54
  }                                                                                                     // 55
                                                                                                        // 56
  // connection is OK. Proceed normally.                                                                // 57
  var args = arguments;                                                                                 // 58
  _.each(oldHttpServerListeners, function(oldListener) {                                                // 59
    oldListener.apply(httpServer, args);                                                                // 60
  });                                                                                                   // 61
});                                                                                                     // 62
                                                                                                        // 63
                                                                                                        // 64
// NOTE: this doesn't handle websockets!                                                                // 65
//                                                                                                      // 66
// Websockets come in via the 'upgrade' request. We can override this,                                  // 67
// however the problem is we're not sure if the websocket is actually                                   // 68
// encrypted. We don't get x-forwarded-for or x-forwarded-proto on                                      // 69
// websockets. It's possible the 'sec-websocket-origin' header does                                     // 70
// what we want, but that's not clear.                                                                  // 71
//                                                                                                      // 72
// For now, this package allows raw unencrypted DDP connections over                                    // 73
// websockets.                                                                                          // 74
                                                                                                        // 75
//////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
