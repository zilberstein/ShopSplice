(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/oauth1/oauth1_tests.js                                                                           //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
Tinytest.add("oauth1 - loginResultForCredentialToken is stored", function (test) {                           // 1
  var http = Npm.require('http');                                                                            // 2
  var twitterfooId = Random.id();                                                                            // 3
  var twitterfooName = 'nickname' + Random.id();                                                             // 4
  var twitterfooAccessToken = Random.id();                                                                   // 5
  var twitterfooAccessTokenSecret = Random.id();                                                             // 6
  var twitterOption1 = Random.id();                                                                          // 7
  var credentialToken = Random.id();                                                                         // 8
  var serviceName = Random.id();                                                                             // 9
                                                                                                             // 10
  var urls = {                                                                                               // 11
    requestToken: "https://example.com/oauth/request_token",                                                 // 12
    authorize: "https://example.com/oauth/authorize",                                                        // 13
    accessToken: "https://example.com/oauth/access_token",                                                   // 14
    authenticate: "https://example.com/oauth/authenticate"                                                   // 15
  };                                                                                                         // 16
                                                                                                             // 17
  OAuth1Binding.prototype.prepareRequestToken = function() {};                                               // 18
  OAuth1Binding.prototype.prepareAccessToken = function() {                                                  // 19
    this.accessToken = twitterfooAccessToken;                                                                // 20
    this.accessTokenSecret = twitterfooAccessTokenSecret;                                                    // 21
  };                                                                                                         // 22
                                                                                                             // 23
  ServiceConfiguration.configurations.insert({service: serviceName});                                        // 24
                                                                                                             // 25
  try {                                                                                                      // 26
    // register a fake login service                                                                         // 27
    Oauth.registerService(serviceName, 1, urls, function (query) {                                           // 28
      return {                                                                                               // 29
        serviceData: {                                                                                       // 30
          id: twitterfooId,                                                                                  // 31
          screenName: twitterfooName,                                                                        // 32
          accessToken: twitterfooAccessToken,                                                                // 33
          accessTokenSecret: twitterfooAccessTokenSecret                                                     // 34
        },                                                                                                   // 35
        options: {                                                                                           // 36
          option1: twitterOption1                                                                            // 37
        }                                                                                                    // 38
      };                                                                                                     // 39
    });                                                                                                      // 40
                                                                                                             // 41
    // simulate logging in using twitterfoo                                                                  // 42
    OAuth1Test.requestTokens[credentialToken] = {                                                            // 43
      requestToken: twitterfooAccessToken                                                                    // 44
    };                                                                                                       // 45
                                                                                                             // 46
    var req = {                                                                                              // 47
      method: "POST",                                                                                        // 48
      url: "/_oauth/" + serviceName + "?close",                                                              // 49
      query: {                                                                                               // 50
        state: credentialToken,                                                                              // 51
        oauth_token: twitterfooAccessToken                                                                   // 52
      }                                                                                                      // 53
    };                                                                                                       // 54
    OauthTest.middleware(req, new http.ServerResponse(req));                                                 // 55
                                                                                                             // 56
    // Test that right data is placed on the loginResult map                                                 // 57
    test.equal(                                                                                              // 58
      Oauth._loginResultForCredentialToken[credentialToken].serviceName, serviceName);                       // 59
    test.equal(                                                                                              // 60
      Oauth._loginResultForCredentialToken[credentialToken].serviceData.id, twitterfooId);                   // 61
    test.equal(                                                                                              // 62
      Oauth._loginResultForCredentialToken[credentialToken].serviceData.screenName, twitterfooName);         // 63
    test.equal(                                                                                              // 64
      Oauth._loginResultForCredentialToken[credentialToken].serviceData.accessToken, twitterfooAccessToken); // 65
    test.equal(                                                                                              // 66
      Oauth._loginResultForCredentialToken[credentialToken].serviceData.accessTokenSecret, twitterfooAccessTokenSecret);
    test.equal(                                                                                              // 68
      Oauth._loginResultForCredentialToken[credentialToken].options.option1, twitterOption1);                // 69
                                                                                                             // 70
  } finally {                                                                                                // 71
    OauthTest.unregisterService(serviceName);                                                                // 72
  }                                                                                                          // 73
});                                                                                                          // 74
                                                                                                             // 75
                                                                                                             // 76
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
