(function () {

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/accounts-password/password_tests_setup.js                                   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
Accounts.validateNewUser(function (user) {                                              // 1
  if (user.profile && user.profile.invalidAndThrowException)                            // 2
    throw new Meteor.Error(403, "An exception thrown within Accounts.validateNewUser"); // 3
  return !(user.profile && user.profile.invalid);                                       // 4
});                                                                                     // 5
                                                                                        // 6
Accounts.onCreateUser(function (options, user) {                                        // 7
  if (options.testOnCreateUserHook) {                                                   // 8
    user.profile = user.profile || {};                                                  // 9
    user.profile.touchedByOnCreateUser = true;                                          // 10
    return user;                                                                        // 11
  } else {                                                                              // 12
    return 'TEST DEFAULT HOOK';                                                         // 13
  }                                                                                     // 14
});                                                                                     // 15
                                                                                        // 16
                                                                                        // 17
// Because this is global state that affects every client, we can't turn                // 18
// it on and off during the tests. Doing so would mean two simultaneous                 // 19
// test runs could collide with each other.                                             // 20
//                                                                                      // 21
// We should probably have some sort of server-isolation between                        // 22
// multiple test runs. Perhaps a separate server instance per run. This                 // 23
// problem isn't unique to this test, there are other places in the code                // 24
// where we do various hacky things to work around the lack of                          // 25
// server-side isolation.                                                               // 26
//                                                                                      // 27
// For now, we just test the one configuration state. You can comment                   // 28
// out each configuration option and see that the tests fail.                           // 29
Accounts.config({                                                                       // 30
  sendVerificationEmail: true                                                           // 31
});                                                                                     // 32
                                                                                        // 33
                                                                                        // 34
Meteor.methods({                                                                        // 35
  testMeteorUser: function () { return Meteor.user(); },                                // 36
  clearUsernameAndProfile: function () {                                                // 37
    if (!this.userId)                                                                   // 38
      throw new Error("Not logged in!");                                                // 39
    Meteor.users.update(this.userId,                                                    // 40
                        {$unset: {profile: 1, username: 1}});                           // 41
  },                                                                                    // 42
                                                                                        // 43
  expireTokens: function () {                                                           // 44
    Accounts._expireTokens(new Date(), this.userId);                                    // 45
  },                                                                                    // 46
  removeUser: function (username) {                                                     // 47
    Meteor.users.remove({ "username": username });                                      // 48
  }                                                                                     // 49
});                                                                                     // 50
                                                                                        // 51
//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/accounts-password/password_tests.js                                         //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
Accounts._noConnectionCloseDelayForTest = true;                                         // 1
                                                                                        // 2
if (Meteor.isClient) (function () {                                                     // 3
                                                                                        // 4
  // XXX note, only one test can do login/logout things at once! for                    // 5
  // now, that is this test.                                                            // 6
                                                                                        // 7
  Accounts._isolateLoginTokenForTest();                                                 // 8
                                                                                        // 9
  var logoutStep = function (test, expect) {                                            // 10
    Meteor.logout(expect(function (error) {                                             // 11
      test.equal(error, undefined);                                                     // 12
      test.equal(Meteor.user(), null);                                                  // 13
    }));                                                                                // 14
  };                                                                                    // 15
  var loggedInAs = function (someUsername, test, expect) {                              // 16
    return expect(function (error) {                                                    // 17
      test.equal(error, undefined);                                                     // 18
      test.equal(Meteor.user().username, someUsername);                                 // 19
    });                                                                                 // 20
  };                                                                                    // 21
  var waitForLoggedOutStep = function (test, expect) {                                  // 22
    pollUntil(expect, function () {                                                     // 23
      return Meteor.userId() === null;                                                  // 24
    }, 10 * 1000, 100);                                                                 // 25
  };                                                                                    // 26
                                                                                        // 27
  testAsyncMulti("passwords - basic login with password", [                             // 28
    function (test, expect) {                                                           // 29
      // setup                                                                          // 30
      this.username = Random.id();                                                      // 31
      this.email = Random.id() + '-intercept@example.com';                              // 32
      this.password = 'password';                                                       // 33
                                                                                        // 34
      Accounts.createUser(                                                              // 35
        {username: this.username, email: this.email, password: this.password},          // 36
        loggedInAs(this.username, test, expect));                                       // 37
    },                                                                                  // 38
    function (test, expect) {                                                           // 39
      test.notEqual(Meteor.userId(), null);                                             // 40
    },                                                                                  // 41
    logoutStep,                                                                         // 42
    function (test, expect) {                                                           // 43
      Meteor.loginWithPassword(this.username, this.password,                            // 44
                               loggedInAs(this.username, test, expect));                // 45
    },                                                                                  // 46
    logoutStep,                                                                         // 47
    // This next step tests reactive contexts which are reactive on                     // 48
    // Meteor.user().                                                                   // 49
    function (test, expect) {                                                           // 50
      // Set up a reactive context that only refreshes when Meteor.user() is            // 51
      // invalidated.                                                                   // 52
      var loaded = false;                                                               // 53
      var handle = Deps.autorun(function () {                                           // 54
        if (Meteor.user() && Meteor.user().emails)                                      // 55
          loaded = true;                                                                // 56
      });                                                                               // 57
      // At the beginning, we're not logged in.                                         // 58
      test.isFalse(loaded);                                                             // 59
      Meteor.loginWithPassword(this.username, this.password, expect(function (error) {  // 60
        test.equal(error, undefined);                                                   // 61
        test.notEqual(Meteor.userId(), null);                                           // 62
        // By the time of the login callback, the user should be loaded.                // 63
        test.isTrue(Meteor.user().emails);                                              // 64
        // Flushing should get us the rerun as well.                                    // 65
        Deps.flush();                                                                   // 66
        test.isTrue(loaded);                                                            // 67
        handle.stop();                                                                  // 68
      }));                                                                              // 69
    },                                                                                  // 70
    logoutStep,                                                                         // 71
    function (test, expect) {                                                           // 72
      Meteor.loginWithPassword({username: this.username}, this.password,                // 73
                               loggedInAs(this.username, test, expect));                // 74
    },                                                                                  // 75
    logoutStep,                                                                         // 76
    function (test, expect) {                                                           // 77
      Meteor.loginWithPassword(this.email, this.password,                               // 78
                               loggedInAs(this.username, test, expect));                // 79
    },                                                                                  // 80
    logoutStep,                                                                         // 81
    function (test, expect) {                                                           // 82
      Meteor.loginWithPassword({email: this.email}, this.password,                      // 83
                               loggedInAs(this.username, test, expect));                // 84
    },                                                                                  // 85
    logoutStep                                                                          // 86
  ]);                                                                                   // 87
                                                                                        // 88
                                                                                        // 89
  testAsyncMulti("passwords - plain text passwords", [                                  // 90
    function (test, expect) {                                                           // 91
      // setup                                                                          // 92
      this.username = Random.id();                                                      // 93
      this.email = Random.id() + '-intercept@example.com';                              // 94
      this.password = 'password';                                                       // 95
                                                                                        // 96
      // create user with raw password (no API, need to invoke callLoginMethod          // 97
      // directly)                                                                      // 98
      Accounts.callLoginMethod({                                                        // 99
        methodName: 'createUser',                                                       // 100
        methodArguments: [{username: this.username, password: this.password}],          // 101
        userCallback: loggedInAs(this.username, test, expect)                           // 102
      });                                                                               // 103
    },                                                                                  // 104
    logoutStep,                                                                         // 105
    // check can login normally with this password.                                     // 106
    function(test, expect) {                                                            // 107
      Meteor.loginWithPassword({username: this.username}, this.password,                // 108
                               loggedInAs(this.username, test, expect));                // 109
    },                                                                                  // 110
    logoutStep,                                                                         // 111
    // plain text password. no API for this, have to invoke callLoginMethod             // 112
    // directly.                                                                        // 113
    function (test, expect) {                                                           // 114
      Accounts.callLoginMethod({                                                        // 115
        // wrong password                                                               // 116
        methodArguments: [{user: {username: this.username}, password: 'wrong'}],        // 117
        userCallback: expect(function (error) {                                         // 118
          test.isTrue(error);                                                           // 119
          test.isFalse(Meteor.user());                                                  // 120
        })});                                                                           // 121
    },                                                                                  // 122
    function (test, expect) {                                                           // 123
      Accounts.callLoginMethod({                                                        // 124
        // right password                                                               // 125
        methodArguments: [{user: {username: this.username},                             // 126
                           password: this.password}],                                   // 127
        userCallback: loggedInAs(this.username, test, expect)                           // 128
      });                                                                               // 129
    },                                                                                  // 130
    logoutStep                                                                          // 131
  ]);                                                                                   // 132
                                                                                        // 133
                                                                                        // 134
  testAsyncMulti("passwords - changing passwords", [                                    // 135
    function (test, expect) {                                                           // 136
      // setup                                                                          // 137
      this.username = Random.id();                                                      // 138
      this.email = Random.id() + '-intercept@example.com';                              // 139
      this.password = 'password';                                                       // 140
      this.password2 = 'password2';                                                     // 141
                                                                                        // 142
      Accounts.createUser(                                                              // 143
        {username: this.username, email: this.email, password: this.password},          // 144
        loggedInAs(this.username, test, expect));                                       // 145
    },                                                                                  // 146
    // change password with bad old password. we stay logged in.                        // 147
    function (test, expect) {                                                           // 148
      var self = this;                                                                  // 149
      Accounts.changePassword('wrong', 'doesntmatter', expect(function (error) {        // 150
        test.isTrue(error);                                                             // 151
        test.equal(Meteor.user().username, self.username);                              // 152
      }));                                                                              // 153
    },                                                                                  // 154
    // change password with good old password.                                          // 155
    function (test, expect) {                                                           // 156
      Accounts.changePassword(this.password, this.password2,                            // 157
                              loggedInAs(this.username, test, expect));                 // 158
    },                                                                                  // 159
    logoutStep,                                                                         // 160
    // old password, failed login                                                       // 161
    function (test, expect) {                                                           // 162
      Meteor.loginWithPassword(this.email, this.password, expect(function (error) {     // 163
        test.isTrue(error);                                                             // 164
        test.isFalse(Meteor.user());                                                    // 165
      }));                                                                              // 166
    },                                                                                  // 167
    // new password, success                                                            // 168
    function (test, expect) {                                                           // 169
      Meteor.loginWithPassword(this.email, this.password2,                              // 170
                               loggedInAs(this.username, test, expect));                // 171
    },                                                                                  // 172
    logoutStep                                                                          // 173
  ]);                                                                                   // 174
                                                                                        // 175
                                                                                        // 176
  testAsyncMulti("passwords - new user hooks", [                                        // 177
    function (test, expect) {                                                           // 178
      // setup                                                                          // 179
      this.username = Random.id();                                                      // 180
      this.email = Random.id() + '-intercept@example.com';                              // 181
      this.password = 'password';                                                       // 182
    },                                                                                  // 183
    // test Accounts.validateNewUser                                                    // 184
    function(test, expect) {                                                            // 185
      Accounts.createUser(                                                              // 186
        {username: this.username, password: this.password,                              // 187
         // should fail the new user validators                                         // 188
         profile: {invalid: true}},                                                     // 189
        expect(function (error) {                                                       // 190
          test.equal(error.error, 403);                                                 // 191
          test.equal(error.reason, "User validation failed");                           // 192
        }));                                                                            // 193
    },                                                                                  // 194
    logoutStep,                                                                         // 195
    function(test, expect) {                                                            // 196
      Accounts.createUser(                                                              // 197
        {username: this.username, password: this.password,                              // 198
         // should fail the new user validator with a special                           // 199
         // exception                                                                   // 200
         profile: {invalidAndThrowException: true}},                                    // 201
        expect(function (error) {                                                       // 202
          test.equal(                                                                   // 203
            error.reason,                                                               // 204
            "An exception thrown within Accounts.validateNewUser");                     // 205
        }));                                                                            // 206
    },                                                                                  // 207
    // test Accounts.onCreateUser                                                       // 208
    function(test, expect) {                                                            // 209
      Accounts.createUser(                                                              // 210
        {username: this.username, password: this.password,                              // 211
         testOnCreateUserHook: true},                                                   // 212
        loggedInAs(this.username, test, expect));                                       // 213
    },                                                                                  // 214
    function(test, expect) {                                                            // 215
      test.equal(Meteor.user().profile.touchedByOnCreateUser, true);                    // 216
    },                                                                                  // 217
    logoutStep                                                                          // 218
  ]);                                                                                   // 219
                                                                                        // 220
                                                                                        // 221
  testAsyncMulti("passwords - Meteor.user()", [                                         // 222
    function (test, expect) {                                                           // 223
      // setup                                                                          // 224
      this.username = Random.id();                                                      // 225
      this.password = 'password';                                                       // 226
                                                                                        // 227
      Accounts.createUser(                                                              // 228
        {username: this.username, password: this.password,                              // 229
         testOnCreateUserHook: true},                                                   // 230
        loggedInAs(this.username, test, expect));                                       // 231
    },                                                                                  // 232
    // test Meteor.user(). This test properly belongs in                                // 233
    // accounts-base/accounts_tests.js, but this is where the tests that                // 234
    // actually log in are.                                                             // 235
    function(test, expect) {                                                            // 236
      var self = this;                                                                  // 237
      var clientUser = Meteor.user();                                                   // 238
      Meteor.call('testMeteorUser', expect(function (err, result) {                     // 239
        test.equal(result._id, clientUser._id);                                         // 240
        test.equal(result.username, clientUser.username);                               // 241
        test.equal(result.username, self.username);                                     // 242
        test.equal(result.profile.touchedByOnCreateUser, true);                         // 243
        test.equal(err, undefined);                                                     // 244
      }));                                                                              // 245
    },                                                                                  // 246
    function(test, expect) {                                                            // 247
      // Test that even with no published fields, we still have a document.             // 248
      Meteor.call('clearUsernameAndProfile', expect(function() {                        // 249
        test.isTrue(Meteor.userId());                                                   // 250
        var user = Meteor.user();                                                       // 251
        test.equal(user, {_id: Meteor.userId()});                                       // 252
      }));                                                                              // 253
    },                                                                                  // 254
    logoutStep,                                                                         // 255
    function(test, expect) {                                                            // 256
      var clientUser = Meteor.user();                                                   // 257
      test.equal(clientUser, null);                                                     // 258
      test.equal(Meteor.userId(), null);                                                // 259
      Meteor.call('testMeteorUser', expect(function (err, result) {                     // 260
        test.equal(err, undefined);                                                     // 261
        test.equal(result, null);                                                       // 262
      }));                                                                              // 263
    }                                                                                   // 264
  ]);                                                                                   // 265
                                                                                        // 266
  testAsyncMulti("passwords - allow rules", [                                           // 267
    // create a second user to have an id for in a later test                           // 268
    function (test, expect) {                                                           // 269
      this.otherUsername = Random.id();                                                 // 270
      Accounts.createUser(                                                              // 271
        {username: this.otherUsername, password: 'dontcare',                            // 272
         testOnCreateUserHook: true},                                                   // 273
        loggedInAs(this.otherUsername, test, expect));                                  // 274
    },                                                                                  // 275
    function (test, expect) {                                                           // 276
      this.otherUserId = Meteor.userId();                                               // 277
    },                                                                                  // 278
    function (test, expect) {                                                           // 279
      // real setup                                                                     // 280
      this.username = Random.id();                                                      // 281
      this.password = 'password';                                                       // 282
                                                                                        // 283
      Accounts.createUser(                                                              // 284
        {username: this.username, password: this.password,                              // 285
         testOnCreateUserHook: true},                                                   // 286
        loggedInAs(this.username, test, expect));                                       // 287
    },                                                                                  // 288
    // test the default Meteor.users allow rule. This test properly belongs in          // 289
    // accounts-base/accounts_tests.js, but this is where the tests that                // 290
    // actually log in are.                                                             // 291
    function(test, expect) {                                                            // 292
      this.userId = Meteor.userId();                                                    // 293
      test.notEqual(this.userId, null);                                                 // 294
      test.notEqual(this.userId, this.otherUserId);                                     // 295
      // Can't update fields other than profile.                                        // 296
      Meteor.users.update(                                                              // 297
        this.userId, {$set: {disallowed: true, 'profile.updated': 42}},                 // 298
        expect(function (err) {                                                         // 299
          test.isTrue(err);                                                             // 300
          test.equal(err.error, 403);                                                   // 301
          test.isFalse(_.has(Meteor.user(), 'disallowed'));                             // 302
          test.isFalse(_.has(Meteor.user().profile, 'updated'));                        // 303
        }));                                                                            // 304
    },                                                                                  // 305
    function(test, expect) {                                                            // 306
      // Can't update another user.                                                     // 307
      Meteor.users.update(                                                              // 308
        this.otherUserId, {$set: {'profile.updated': 42}},                              // 309
        expect(function (err) {                                                         // 310
          test.isTrue(err);                                                             // 311
          test.equal(err.error, 403);                                                   // 312
        }));                                                                            // 313
    },                                                                                  // 314
    function(test, expect) {                                                            // 315
      // Can't update using a non-ID selector. (This one is thrown client-side.)        // 316
      test.throws(function () {                                                         // 317
        Meteor.users.update(                                                            // 318
          {username: this.username}, {$set: {'profile.updated': 42}});                  // 319
      });                                                                               // 320
      test.isFalse(_.has(Meteor.user().profile, 'updated'));                            // 321
    },                                                                                  // 322
    function(test, expect) {                                                            // 323
      // Can update own profile using ID.                                               // 324
      Meteor.users.update(                                                              // 325
        this.userId, {$set: {'profile.updated': 42}},                                   // 326
        expect(function (err) {                                                         // 327
          test.isFalse(err);                                                            // 328
          test.equal(42, Meteor.user().profile.updated);                                // 329
        }));                                                                            // 330
    },                                                                                  // 331
    logoutStep                                                                          // 332
  ]);                                                                                   // 333
                                                                                        // 334
                                                                                        // 335
  testAsyncMulti("passwords - tokens", [                                                // 336
    function (test, expect) {                                                           // 337
      // setup                                                                          // 338
      this.username = Random.id();                                                      // 339
      this.password = 'password';                                                       // 340
                                                                                        // 341
      Accounts.createUser(                                                              // 342
        {username: this.username, password: this.password},                             // 343
        loggedInAs(this.username, test, expect));                                       // 344
    },                                                                                  // 345
                                                                                        // 346
    function(test, expect) {                                                            // 347
      // test logging out invalidates our token                                         // 348
      var expectLoginError = expect(function (err) {                                    // 349
        test.isTrue(err);                                                               // 350
      });                                                                               // 351
      var token = Accounts._storedLoginToken();                                         // 352
      test.isTrue(token);                                                               // 353
      Meteor.logout(function () {                                                       // 354
        Meteor.loginWithToken(token, expectLoginError);                                 // 355
      });                                                                               // 356
    },                                                                                  // 357
                                                                                        // 358
    function(test, expect) {                                                            // 359
      var self = this;                                                                  // 360
      // Test that login tokens get expired. We should get logged out when a            // 361
      // token expires, and not be able to log in again with the same token.            // 362
      var expectNoError = expect(function (err) {                                       // 363
        test.isFalse(err);                                                              // 364
      });                                                                               // 365
                                                                                        // 366
      Meteor.loginWithPassword(this.username, this.password, function (error) {         // 367
        self.token = Accounts._storedLoginToken();                                      // 368
        test.isTrue(self.token);                                                        // 369
        expectNoError(error);                                                           // 370
        Meteor.call("expireTokens");                                                    // 371
      });                                                                               // 372
    },                                                                                  // 373
    waitForLoggedOutStep,                                                               // 374
    function (test, expect) {                                                           // 375
      var token = Accounts._storedLoginToken();                                         // 376
      test.isFalse(token);                                                              // 377
    },                                                                                  // 378
    function (test, expect) {                                                           // 379
      // Test that once expireTokens is finished, we can't login again with our         // 380
      // previous token.                                                                // 381
      Meteor.loginWithToken(this.token, expect(function (err, result) {                 // 382
        test.isTrue(err);                                                               // 383
        test.equal(Meteor.userId(), null);                                              // 384
      }));                                                                              // 385
    },                                                                                  // 386
    function (test, expect) {                                                           // 387
      var self = this;                                                                  // 388
                                                                                        // 389
      // copied from livedata/client_convenience.js                                     // 390
      var ddpUrl = '/';                                                                 // 391
      if (typeof __meteor_runtime_config__ !== "undefined") {                           // 392
        if (__meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL)                       // 393
          ddpUrl = __meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL;                // 394
      }                                                                                 // 395
      // XXX can we get the url from the existing connection somehow                    // 396
      // instead?                                                                       // 397
                                                                                        // 398
      // Test that Meteor.logoutOtherClients logs out a second authenticated            // 399
      // connection while leaving Meteor.connection logged in.                          // 400
      var token;                                                                        // 401
      var userId;                                                                       // 402
      self.secondConn = DDP.connect(ddpUrl);                                            // 403
                                                                                        // 404
      var expectLoginError = expect(function (err) {                                    // 405
        test.isTrue(err);                                                               // 406
      });                                                                               // 407
      var expectValidToken = expect(function (err, result) {                            // 408
        test.isFalse(err);                                                              // 409
        test.isTrue(result);                                                            // 410
        self.tokenFromLogoutOthers = result.token;                                      // 411
      });                                                                               // 412
      var expectSecondConnLoggedIn = expect(function (err, result) {                    // 413
        test.equal(result.token, token);                                                // 414
        test.isFalse(err);                                                              // 415
        // This test will fail if an unrelated reconnect triggers before the            // 416
        // connection is logged out. In general our tests aren't resilient to           // 417
        // mid-test reconnects.                                                         // 418
        self.secondConn.onReconnect = function () {                                     // 419
          self.secondConn.call("login", { resume: token }, expectLoginError);           // 420
        };                                                                              // 421
        Meteor.call("logoutOtherClients", expectValidToken);                            // 422
      });                                                                               // 423
                                                                                        // 424
      Meteor.loginWithPassword(this.username, this.password, expect(function (err) {    // 425
        test.isFalse(err);                                                              // 426
        token = Accounts._storedLoginToken();                                           // 427
        self.beforeLogoutOthersToken = token;                                           // 428
        test.isTrue(token);                                                             // 429
        userId = Meteor.userId();                                                       // 430
        self.secondConn.call("login", { resume: token },                                // 431
                             expectSecondConnLoggedIn);                                 // 432
      }));                                                                              // 433
    },                                                                                  // 434
    // Test that logoutOtherClients logged out Meteor.connection and that the           // 435
    // previous token is no longer valid.                                               // 436
    waitForLoggedOutStep,                                                               // 437
    function (test, expect) {                                                           // 438
      var self = this;                                                                  // 439
      var token = Accounts._storedLoginToken();                                         // 440
      test.isFalse(token);                                                              // 441
      this.secondConn.close();                                                          // 442
      Meteor.loginWithToken(                                                            // 443
        self.beforeLogoutOthersToken,                                                   // 444
        expect(function (err) {                                                         // 445
          test.isTrue(err);                                                             // 446
          test.isFalse(Meteor.userId());                                                // 447
        })                                                                              // 448
      );                                                                                // 449
    },                                                                                  // 450
    // Test that logoutOtherClients returned a new token that we can use to             // 451
    // log in.                                                                          // 452
    function (test, expect) {                                                           // 453
      var self = this;                                                                  // 454
      Meteor.loginWithToken(                                                            // 455
        self.tokenFromLogoutOthers,                                                     // 456
        expect(function (err) {                                                         // 457
          test.isFalse(err);                                                            // 458
          test.isTrue(Meteor.userId());                                                 // 459
        })                                                                              // 460
      );                                                                                // 461
    },                                                                                  // 462
    logoutStep,                                                                         // 463
    function (test, expect) {                                                           // 464
      var self = this;                                                                  // 465
      // Test that deleting a user logs out that user's connections.                    // 466
      Meteor.loginWithPassword(this.username, this.password, expect(function (err) {    // 467
        test.isFalse(err);                                                              // 468
        Meteor.call("removeUser", self.username);                                       // 469
      }));                                                                              // 470
    },                                                                                  // 471
    waitForLoggedOutStep                                                                // 472
  ]);                                                                                   // 473
}) ();                                                                                  // 474
                                                                                        // 475
                                                                                        // 476
if (Meteor.isServer) (function () {                                                     // 477
                                                                                        // 478
  Tinytest.add(                                                                         // 479
    'passwords - setup more than one onCreateUserHook',                                 // 480
    function (test) {                                                                   // 481
      test.throws(function() {                                                          // 482
        Accounts.onCreateUser(function () {});                                          // 483
      });                                                                               // 484
    });                                                                                 // 485
                                                                                        // 486
                                                                                        // 487
  Tinytest.add(                                                                         // 488
    'passwords - createUser hooks',                                                     // 489
    function (test) {                                                                   // 490
      var username = Random.id();                                                       // 491
      test.throws(function () {                                                         // 492
        // should fail the new user validators                                          // 493
        Accounts.createUser({username: username, profile: {invalid: true}});            // 494
      });                                                                               // 495
                                                                                        // 496
      var userId = Accounts.createUser({username: username,                             // 497
                                        testOnCreateUserHook: true});                   // 498
                                                                                        // 499
      test.isTrue(userId);                                                              // 500
      var user = Meteor.users.findOne(userId);                                          // 501
      test.equal(user.profile.touchedByOnCreateUser, true);                             // 502
    });                                                                                 // 503
                                                                                        // 504
                                                                                        // 505
  Tinytest.add(                                                                         // 506
    'passwords - setPassword',                                                          // 507
    function (test) {                                                                   // 508
      var username = Random.id();                                                       // 509
                                                                                        // 510
      var userId = Accounts.createUser({username: username});                           // 511
                                                                                        // 512
      var user = Meteor.users.findOne(userId);                                          // 513
      // no services yet.                                                               // 514
      test.equal(user.services.password, undefined);                                    // 515
                                                                                        // 516
      // set a new password.                                                            // 517
      Accounts.setPassword(userId, 'new password');                                     // 518
      user = Meteor.users.findOne(userId);                                              // 519
      var oldVerifier = user.services.password.srp;                                     // 520
      test.isTrue(user.services.password.srp);                                          // 521
                                                                                        // 522
      // reset with the same password, see we get a different verifier                  // 523
      Accounts.setPassword(userId, 'new password');                                     // 524
      user = Meteor.users.findOne(userId);                                              // 525
      var newVerifier = user.services.password.srp;                                     // 526
      test.notEqual(oldVerifier.salt, newVerifier.salt);                                // 527
      test.notEqual(oldVerifier.identity, newVerifier.identity);                        // 528
      test.notEqual(oldVerifier.verifier, newVerifier.verifier);                        // 529
                                                                                        // 530
      // cleanup                                                                        // 531
      Meteor.users.remove(userId);                                                      // 532
    });                                                                                 // 533
                                                                                        // 534
                                                                                        // 535
  // This test properly belongs in accounts-base/accounts_tests.js, but                 // 536
  // this is where the tests that actually log in are.                                  // 537
  Tinytest.add('accounts - user() out of context', function (test) {                    // 538
    // basic server context, no method.                                                 // 539
    test.throws(function () {                                                           // 540
      Meteor.user();                                                                    // 541
    });                                                                                 // 542
  });                                                                                   // 543
                                                                                        // 544
  // XXX would be nice to test Accounts.config({forbidClientAccountCreation: true})     // 545
                                                                                        // 546
  Tinytest.addAsync(                                                                    // 547
    'passwords - login tokens cleaned up',                                              // 548
    function (test, onComplete) {                                                       // 549
      var username = Random.id();                                                       // 550
      Accounts.createUser({                                                             // 551
        username: username,                                                             // 552
        password: 'password'                                                            // 553
      });                                                                               // 554
                                                                                        // 555
      makeTestConnection(                                                               // 556
        test,                                                                           // 557
        function (clientConn, serverConn) {                                             // 558
          serverConn.onClose(function () {                                              // 559
            test.isFalse(_.contains(                                                    // 560
              Accounts._getTokenConnections(token), serverConn.id));                    // 561
            onComplete();                                                               // 562
          });                                                                           // 563
          var result = clientConn.call('login', {                                       // 564
            user: {username: username},                                                 // 565
            password: 'password'                                                        // 566
          });                                                                           // 567
          test.isTrue(result);                                                          // 568
          var token = Accounts._getAccountData(serverConn.id, 'loginToken');            // 569
          test.isTrue(token);                                                           // 570
          test.equal(result.token, token);                                              // 571
          test.isTrue(_.contains(                                                       // 572
            Accounts._getTokenConnections(token), serverConn.id));                      // 573
          clientConn.disconnect();                                                      // 574
        },                                                                              // 575
        onComplete                                                                      // 576
      );                                                                                // 577
    }                                                                                   // 578
  );                                                                                    // 579
}) ();                                                                                  // 580
                                                                                        // 581
//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
// packages/accounts-password/email_tests_setup.js                                      //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////
                                                                                        //
//                                                                                      // 1
// a mechanism to intercept emails sent to addressing including                         // 2
// the string "intercept", storing them in an array that can then                       // 3
// be retrieved using the getInterceptedEmails method                                   // 4
//                                                                                      // 5
var interceptedEmails = {}; // (email address) -> (array of contents)                   // 6
                                                                                        // 7
EmailTest.hookSend(function (options) {                                                 // 8
  var to = options.to;                                                                  // 9
  if (to.indexOf('intercept') === -1) {                                                 // 10
    return true; // go ahead and send                                                   // 11
  } else {                                                                              // 12
    if (!interceptedEmails[to])                                                         // 13
      interceptedEmails[to] = [];                                                       // 14
                                                                                        // 15
    interceptedEmails[to].push(options.text);                                           // 16
    return false; // skip sending                                                       // 17
  }                                                                                     // 18
});                                                                                     // 19
                                                                                        // 20
Meteor.methods({                                                                        // 21
  getInterceptedEmails: function (email) {                                              // 22
    check(email, String);                                                               // 23
    return interceptedEmails[email];                                                    // 24
  },                                                                                    // 25
                                                                                        // 26
  addEmailForTestAndVerify: function (email) {                                          // 27
    check(email, String);                                                               // 28
    Meteor.users.update(                                                                // 29
      {_id: this.userId},                                                               // 30
      {$push: {emails: {address: email, verified: false}}});                            // 31
    Accounts.sendVerificationEmail(this.userId, email);                                 // 32
  },                                                                                    // 33
                                                                                        // 34
  createUserOnServer: function (email) {                                                // 35
    check(email, String);                                                               // 36
    var userId = Accounts.createUser({email: email});                                   // 37
    Accounts.sendEnrollmentEmail(userId);                                               // 38
    return Meteor.users.findOne(userId);                                                // 39
  }                                                                                     // 40
});                                                                                     // 41
                                                                                        // 42
//////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
