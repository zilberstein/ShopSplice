(function () {

////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                            //
// packages/oauth2/oauth2_tests.js                                                            //
//                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                              //
Tinytest.add("oauth2 - loginResultForCredentialToken is stored", function (test) {            // 1
  var http = Npm.require('http');                                                             // 2
  var foobookId = Random.id();                                                                // 3
  var foobookOption1 = Random.id();                                                           // 4
  var credentialToken = Random.id();                                                          // 5
  var serviceName = Random.id();                                                              // 6
                                                                                              // 7
  ServiceConfiguration.configurations.insert({service: serviceName});                         // 8
                                                                                              // 9
  try {                                                                                       // 10
    // register a fake login service                                                          // 11
    Oauth.registerService(serviceName, 2, null, function (query) {                            // 12
      return {                                                                                // 13
        serviceData: {id: foobookId},                                                         // 14
        options: {option1: foobookOption1}                                                    // 15
      };                                                                                      // 16
    });                                                                                       // 17
                                                                                              // 18
    // simulate logging in using foobook                                                      // 19
    var req = {method: "POST",                                                                // 20
               url: "/_oauth/" + serviceName + "?close",                                      // 21
               query: {state: credentialToken}};                                              // 22
    OauthTest.middleware(req, new http.ServerResponse(req));                                  // 23
                                                                                              // 24
    // Test that the login result for that user is prepared                                   // 25
    test.equal(                                                                               // 26
      Oauth._loginResultForCredentialToken[credentialToken].serviceName, serviceName);        // 27
    test.equal(                                                                               // 28
      Oauth._loginResultForCredentialToken[credentialToken].serviceData.id, foobookId);       // 29
    test.equal(                                                                               // 30
      Oauth._loginResultForCredentialToken[credentialToken].options.option1, foobookOption1); // 31
                                                                                              // 32
  } finally {                                                                                 // 33
    OauthTest.unregisterService(serviceName);                                                 // 34
  }                                                                                           // 35
});                                                                                           // 36
                                                                                              // 37
////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
