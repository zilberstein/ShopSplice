(function () {

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/routepolicy/routepolicy_tests.js                                            //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
Tinytest.add("routepolicy - declare", function (test) {                                 // 1
  var policy = new RoutePolicyTest.Constructor();                                       // 2
                                                                                        // 3
  policy.declare('/sockjs/', 'network');                                                // 4
  policy.declare('/bigphoto.jpg', 'static-online');                                     // 5
  policy.declare('/anotherphoto.png', 'static-online');                                 // 6
                                                                                        // 7
  test.equal(policy.classify('/'), null);                                               // 8
  test.equal(policy.classify('/foo'), null);                                            // 9
  test.equal(policy.classify('/sockjs'), null);                                         // 10
                                                                                        // 11
  test.equal(policy.classify('/sockjs/'), 'network');                                   // 12
  test.equal(policy.classify('/sockjs/foo'), 'network');                                // 13
                                                                                        // 14
  test.equal(policy.classify('/bigphoto.jpg'), 'static-online');                        // 15
  test.equal(policy.classify('/bigphoto.jpg.orig'), 'static-online');                   // 16
                                                                                        // 17
  test.equal(policy.urlPrefixesFor('network'), ['/sockjs/']);                           // 18
  test.equal(                                                                           // 19
    policy.urlPrefixesFor('static-online'),                                             // 20
    ['/anotherphoto.png', '/bigphoto.jpg']                                              // 21
  );                                                                                    // 22
});                                                                                     // 23
                                                                                        // 24
Tinytest.add("routepolicy - static conflicts", function (test) {                        // 25
  var manifest = [                                                                      // 26
    {                                                                                   // 27
      "path": "static/sockjs/socks-are-comfy.jpg",                                      // 28
      "type": "static",                                                                 // 29
      "where": "client",                                                                // 30
      "url": "/sockjs/socks-are-comfy.jpg"                                              // 31
    },                                                                                  // 32
    {                                                                                   // 33
      "path": "static/bigphoto.jpg",                                                    // 34
      "type": "static",                                                                 // 35
      "where": "client",                                                                // 36
      "url": "/bigphoto.jpg"                                                            // 37
    }                                                                                   // 38
  ];                                                                                    // 39
  var policy = new RoutePolicyTest.Constructor();                                       // 40
                                                                                        // 41
  test.equal(                                                                           // 42
    policy.checkForConflictWithStatic('/sockjs/', 'network', manifest),                 // 43
    "static resource /sockjs/socks-are-comfy.jpg conflicts with network route /sockjs/" // 44
  );                                                                                    // 45
                                                                                        // 46
  test.equal(                                                                           // 47
    policy.checkForConflictWithStatic('/bigphoto.jpg', 'static-online', manifest),      // 48
    null                                                                                // 49
  );                                                                                    // 50
});                                                                                     // 51
                                                                                        // 52
Tinytest.add("routepolicy - checkUrlPrefix", function (test) {                          // 53
  var policy = new RoutePolicyTest.Constructor();                                       // 54
  policy.declare('/sockjs/', 'network');                                                // 55
                                                                                        // 56
  test.equal(                                                                           // 57
    policy.checkUrlPrefix('foo/bar', 'network'),                                        // 58
    "a route URL prefix must begin with a slash"                                        // 59
  );                                                                                    // 60
                                                                                        // 61
  test.equal(                                                                           // 62
    policy.checkUrlPrefix('/', 'network'),                                              // 63
    "a route URL prefix cannot be /"                                                    // 64
  );                                                                                    // 65
                                                                                        // 66
  test.equal(                                                                           // 67
    policy.checkUrlPrefix('/sockjs/', 'static-online'),                                 // 68
    "the route URL prefix /sockjs/ has already been declared to be of type network"     // 69
  );                                                                                    // 70
});                                                                                     // 71
                                                                                        // 72
//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
