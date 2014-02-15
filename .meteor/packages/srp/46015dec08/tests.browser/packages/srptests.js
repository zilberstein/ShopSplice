(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                   //
// packages/srp/srp_tests.js                                                                         //
//                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                     //
Tinytest.add("srp - good exchange", function(test) {                                                 // 1
  var password = 'hi there!';                                                                        // 2
  var verifier = SRP.generateVerifier(password);                                                     // 3
                                                                                                     // 4
  var C = new SRP.Client(password);                                                                  // 5
  var S = new SRP.Server(verifier);                                                                  // 6
                                                                                                     // 7
  var request = C.startExchange();                                                                   // 8
  var challenge = S.issueChallenge(request);                                                         // 9
  var response = C.respondToChallenge(challenge);                                                    // 10
  var confirmation = S.verifyResponse(response);                                                     // 11
                                                                                                     // 12
  test.isTrue(confirmation);                                                                         // 13
  test.isTrue(C.verifyConfirmation(confirmation));                                                   // 14
                                                                                                     // 15
});                                                                                                  // 16
                                                                                                     // 17
Tinytest.add("srp - bad exchange", function(test) {                                                  // 18
  var verifier = SRP.generateVerifier('one password');                                               // 19
                                                                                                     // 20
  var C = new SRP.Client('another password');                                                        // 21
  var S = new SRP.Server(verifier);                                                                  // 22
                                                                                                     // 23
  var request = C.startExchange();                                                                   // 24
  var challenge = S.issueChallenge(request);                                                         // 25
  var response = C.respondToChallenge(challenge);                                                    // 26
  var confirmation = S.verifyResponse(response);                                                     // 27
                                                                                                     // 28
  test.isFalse(confirmation);                                                                        // 29
});                                                                                                  // 30
                                                                                                     // 31
                                                                                                     // 32
Tinytest.add("srp - fixed values", function(test) {                                                  // 33
  // Test exact values during the exchange. We have to be very careful                               // 34
  // about changing the SRP code, because changes could render                                       // 35
  // people's existing user database unusable. This test is                                          // 36
  // intentionally brittle to catch change that could affect the                                     // 37
  // validity of user passwords.                                                                     // 38
                                                                                                     // 39
  var identity = "b73d9af9-4e74-4ce0-879c-484828b08436";                                             // 40
  var salt = "85f8b9d3-744a-487d-8982-a50e4c9f552a";                                                 // 41
  var password = "95109251-3d8a-4777-bdec-44ffe8d86dfb";                                             // 42
  var a = "dc99c646fa4cb7c24314bb6f4ca2d391297acd0dacb0430a13bbf1e37dcf8071";                        // 43
  var b = "cf878e00c9f2b6aa48a10f66df9706e64fef2ca399f396d65f5b0a27cb8ae237";                        // 44
                                                                                                     // 45
  var verifier = SRP.generateVerifier(                                                               // 46
    password, {identity: identity, salt: salt});                                                     // 47
                                                                                                     // 48
  var C = new SRP.Client(password, {a: a});                                                          // 49
  var S = new SRP.Server(verifier, {b: b});                                                          // 50
                                                                                                     // 51
  var request = C.startExchange();                                                                   // 52
  test.equal(request.A, "8a75aa61471a92d4c3b5d53698c910af5ef013c42799876c40612d1d5e0dc41d01f669bc022fadcd8a704030483401a1b86b8670191bd9dfb1fb506dd11c688b2f08e9946756263954db2040c1df1894af7af5f839c9215bb445268439157e65e8f100469d575d5d0458e19e8bd4dd4ea2c0b30b1b3f4f39264de4ec596e0bb7");
                                                                                                     // 54
  var challenge = S.issueChallenge(request);                                                         // 55
  test.equal(challenge.B, "77ab0a40ef428aa2fa2bc257c905f352c7f75fbcfdb8761393c9dc0f730bbb0270ba9f837545b410c955c3f761494b329ad23c6efdec7e63509e538c2f68a3526e072550a11dac46017718362205e0c698b5bed67d6ff475aa92c191ca169f865c81a1a577373c449b98df720c7b7ff50536f9919d781e698025fd7164932ba7");
                                                                                                     // 57
  var response = C.respondToChallenge(challenge);                                                    // 58
  test.equal(response.M, "8705d31bb61497279adf44eef6c167dcb7e03aa7a42102c1ea7e73025fbd4cd9");        // 59
                                                                                                     // 60
  var confirmation = S.verifyResponse(response);                                                     // 61
  test.equal(confirmation.HAMK, "07a0f200392fa9a084db7acc2021fbc174bfb36956b46835cc12506b68b27bba"); // 62
                                                                                                     // 63
  test.isTrue(C.verifyConfirmation(confirmation));                                                   // 64
});                                                                                                  // 65
                                                                                                     // 66
                                                                                                     // 67
Tinytest.add("srp - options", function(test) {                                                       // 68
  // test that all options are respected.                                                            // 69
  //                                                                                                 // 70
  // Note, all test strings here should be hex, because the 'hash'                                   // 71
  // function needs to output numbers.                                                               // 72
                                                                                                     // 73
  var baseOptions = {                                                                                // 74
    hash: function (x) { return x; },                                                                // 75
    N: 'b',                                                                                          // 76
    g: '2',                                                                                          // 77
    k: '1'                                                                                           // 78
  };                                                                                                 // 79
  var verifierOptions = _.extend({                                                                   // 80
    identity: 'a',                                                                                   // 81
    salt: 'b'                                                                                        // 82
  }, baseOptions);                                                                                   // 83
  var clientOptions = _.extend({                                                                     // 84
    a: "2"                                                                                           // 85
  }, baseOptions);                                                                                   // 86
  var serverOptions = _.extend({                                                                     // 87
    b: "2"                                                                                           // 88
  }, baseOptions);                                                                                   // 89
                                                                                                     // 90
  var verifier = SRP.generateVerifier('c', verifierOptions);;                                        // 91
                                                                                                     // 92
  test.equal(verifier.identity, 'a');                                                                // 93
  test.equal(verifier.salt, 'b');                                                                    // 94
  test.equal(verifier.verifier, '3');                                                                // 95
                                                                                                     // 96
  var C = new SRP.Client('c', clientOptions);                                                        // 97
  var S = new SRP.Server(verifier, serverOptions);                                                   // 98
                                                                                                     // 99
  var request = C.startExchange();                                                                   // 100
  test.equal(request.A, '4');                                                                        // 101
                                                                                                     // 102
  var challenge = S.issueChallenge(request);                                                         // 103
  test.equal(challenge.identity, 'a');                                                               // 104
  test.equal(challenge.salt, 'b');                                                                   // 105
  test.equal(challenge.B, '7');                                                                      // 106
                                                                                                     // 107
  var response = C.respondToChallenge(challenge);                                                    // 108
  test.equal(response.M, '471');                                                                     // 109
                                                                                                     // 110
  var confirmation = S.verifyResponse(response);                                                     // 111
  test.isTrue(confirmation);                                                                         // 112
  test.equal(confirmation.HAMK, '44711');                                                            // 113
                                                                                                     // 114
});                                                                                                  // 115
                                                                                                     // 116
///////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
