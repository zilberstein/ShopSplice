(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/accounts-base/accounts_tests.js                                                        //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
// XXX it'd be cool to also test that the right thing happens if options                           // 1
// *are* validated, but Accounts._options is global state which makes this hard                    // 2
// (impossible?)                                                                                   // 3
Tinytest.add('accounts - config validates keys', function (test) {                                 // 4
  test.throws(function () {                                                                        // 5
    Accounts.config({foo: "bar"});                                                                 // 6
  });                                                                                              // 7
});                                                                                                // 8
                                                                                                   // 9
                                                                                                   // 10
var idsInValidateNewUser = {};                                                                     // 11
Accounts.validateNewUser(function (user) {                                                         // 12
  idsInValidateNewUser[user._id] = true;                                                           // 13
  return true;                                                                                     // 14
});                                                                                                // 15
                                                                                                   // 16
Tinytest.add('accounts - validateNewUser gets passed user with _id', function (test) {             // 17
  var newUserId = Accounts.updateOrCreateUserFromExternalService('foobook', {id: Random.id()}).id; // 18
  test.isTrue(newUserId in idsInValidateNewUser);                                                  // 19
});                                                                                                // 20
                                                                                                   // 21
Tinytest.add('accounts - updateOrCreateUserFromExternalService - Facebook', function (test) {      // 22
  var facebookId = Random.id();                                                                    // 23
                                                                                                   // 24
  // create an account with facebook                                                               // 25
  var uid1 = Accounts.updateOrCreateUserFromExternalService(                                       // 26
    'facebook', {id: facebookId, monkey: 42}, {profile: {foo: 1}}).id;                             // 27
  var users = Meteor.users.find({"services.facebook.id": facebookId}).fetch();                     // 28
  test.length(users, 1);                                                                           // 29
  test.equal(users[0].profile.foo, 1);                                                             // 30
  test.equal(users[0].services.facebook.monkey, 42);                                               // 31
                                                                                                   // 32
  // create again with the same id, see that we get the same user.                                 // 33
  // it should update services.facebook but not profile.                                           // 34
  var uid2 = Accounts.updateOrCreateUserFromExternalService(                                       // 35
    'facebook', {id: facebookId, llama: 50},                                                       // 36
    {profile: {foo: 1000, bar: 2}}).id;                                                            // 37
  test.equal(uid1, uid2);                                                                          // 38
  users = Meteor.users.find({"services.facebook.id": facebookId}).fetch();                         // 39
  test.length(users, 1);                                                                           // 40
  test.equal(users[0].profile.foo, 1);                                                             // 41
  test.equal(users[0].profile.bar, undefined);                                                     // 42
  test.equal(users[0].services.facebook.llama, 50);                                                // 43
  // make sure we *don't* lose values not passed this call to                                      // 44
  // updateOrCreateUserFromExternalService                                                         // 45
  test.equal(users[0].services.facebook.monkey, 42);                                               // 46
                                                                                                   // 47
  // cleanup                                                                                       // 48
  Meteor.users.remove(uid1);                                                                       // 49
});                                                                                                // 50
                                                                                                   // 51
Tinytest.add('accounts - updateOrCreateUserFromExternalService - Weibo', function (test) {         // 52
  var weiboId1 = Random.id();                                                                      // 53
  var weiboId2 = Random.id();                                                                      // 54
                                                                                                   // 55
  // users that have different service ids get different users                                     // 56
  var uid1 = Accounts.updateOrCreateUserFromExternalService(                                       // 57
    'weibo', {id: weiboId1}, {profile: {foo: 1}}).id;                                              // 58
  var uid2 = Accounts.updateOrCreateUserFromExternalService(                                       // 59
    'weibo', {id: weiboId2}, {profile: {bar: 2}}).id;                                              // 60
  test.equal(Meteor.users.find({"services.weibo.id": {$in: [weiboId1, weiboId2]}}).count(), 2);    // 61
  test.equal(Meteor.users.findOne({"services.weibo.id": weiboId1}).profile.foo, 1);                // 62
  test.equal(Meteor.users.findOne({"services.weibo.id": weiboId1}).emails, undefined);             // 63
  test.equal(Meteor.users.findOne({"services.weibo.id": weiboId2}).profile.bar, 2);                // 64
  test.equal(Meteor.users.findOne({"services.weibo.id": weiboId2}).emails, undefined);             // 65
                                                                                                   // 66
  // cleanup                                                                                       // 67
  Meteor.users.remove(uid1);                                                                       // 68
  Meteor.users.remove(uid2);                                                                       // 69
});                                                                                                // 70
                                                                                                   // 71
Tinytest.add('accounts - updateOrCreateUserFromExternalService - Twitter', function (test) {       // 72
  var twitterIdOld = parseInt(Random.hexString(4), 16);                                            // 73
  var twitterIdNew = ''+twitterIdOld;                                                              // 74
                                                                                                   // 75
  // create an account with twitter using the old ID format of integer                             // 76
  var uid1 = Accounts.updateOrCreateUserFromExternalService(                                       // 77
    'twitter', {id: twitterIdOld, monkey: 42}, {profile: {foo: 1}}).id;                            // 78
  var users = Meteor.users.find({"services.twitter.id": twitterIdOld}).fetch();                    // 79
  test.length(users, 1);                                                                           // 80
  test.equal(users[0].profile.foo, 1);                                                             // 81
  test.equal(users[0].services.twitter.monkey, 42);                                                // 82
                                                                                                   // 83
  // Update the account with the new ID format of string                                           // 84
  // test that the existing user is found, and that the ID                                         // 85
  // gets updated to a string value                                                                // 86
  var uid2 = Accounts.updateOrCreateUserFromExternalService(                                       // 87
    'twitter', {id: twitterIdNew, monkey: 42}, {profile: {foo: 1}}).id;                            // 88
  test.equal(uid1, uid2);                                                                          // 89
  users = Meteor.users.find({"services.twitter.id": twitterIdNew}).fetch();                        // 90
  test.length(users, 1);                                                                           // 91
                                                                                                   // 92
  // cleanup                                                                                       // 93
  Meteor.users.remove(uid1);                                                                       // 94
});                                                                                                // 95
                                                                                                   // 96
                                                                                                   // 97
Tinytest.add('accounts - insertUserDoc username', function (test) {                                // 98
  var userIn = {                                                                                   // 99
    username: Random.id()                                                                          // 100
  };                                                                                               // 101
                                                                                                   // 102
  // user does not already exist. create a user object with fields set.                            // 103
  var result = Accounts.insertUserDoc(                                                             // 104
    {profile: {name: 'Foo Bar'}},                                                                  // 105
    userIn                                                                                         // 106
  );                                                                                               // 107
  var userOut = Meteor.users.findOne(result.id);                                                   // 108
                                                                                                   // 109
  test.equal(typeof userOut.createdAt, 'object');                                                  // 110
  test.equal(userOut.profile.name, 'Foo Bar');                                                     // 111
  test.equal(userOut.username, userIn.username);                                                   // 112
                                                                                                   // 113
  // run the hook again. now the user exists, so it throws an error.                               // 114
  test.throws(function () {                                                                        // 115
    Accounts.insertUserDoc(                                                                        // 116
      {profile: {name: 'Foo Bar'}},                                                                // 117
      userIn                                                                                       // 118
    );                                                                                             // 119
  });                                                                                              // 120
                                                                                                   // 121
  // cleanup                                                                                       // 122
  Meteor.users.remove(result.id);                                                                  // 123
                                                                                                   // 124
});                                                                                                // 125
                                                                                                   // 126
Tinytest.add('accounts - insertUserDoc email', function (test) {                                   // 127
  var email1 = Random.id();                                                                        // 128
  var email2 = Random.id();                                                                        // 129
  var email3 = Random.id();                                                                        // 130
  var userIn = {                                                                                   // 131
    emails: [{address: email1, verified: false},                                                   // 132
             {address: email2, verified: true}]                                                    // 133
  };                                                                                               // 134
                                                                                                   // 135
  // user does not already exist. create a user object with fields set.                            // 136
  var result = Accounts.insertUserDoc(                                                             // 137
    {profile: {name: 'Foo Bar'}},                                                                  // 138
    userIn                                                                                         // 139
  );                                                                                               // 140
  var userOut = Meteor.users.findOne(result.id);                                                   // 141
                                                                                                   // 142
  test.equal(typeof userOut.createdAt, 'object');                                                  // 143
  test.equal(userOut.profile.name, 'Foo Bar');                                                     // 144
  test.equal(userOut.emails, userIn.emails);                                                       // 145
                                                                                                   // 146
  // run the hook again with the exact same emails.                                                // 147
  // run the hook again. now the user exists, so it throws an error.                               // 148
  test.throws(function () {                                                                        // 149
    Accounts.insertUserDoc(                                                                        // 150
      {profile: {name: 'Foo Bar'}},                                                                // 151
      userIn                                                                                       // 152
    );                                                                                             // 153
  });                                                                                              // 154
                                                                                                   // 155
  // now with only one of them.                                                                    // 156
  test.throws(function () {                                                                        // 157
    Accounts.insertUserDoc(                                                                        // 158
      {}, {emails: [{address: email1}]}                                                            // 159
    );                                                                                             // 160
  });                                                                                              // 161
                                                                                                   // 162
  test.throws(function () {                                                                        // 163
    Accounts.insertUserDoc(                                                                        // 164
      {}, {emails: [{address: email2}]}                                                            // 165
    );                                                                                             // 166
  });                                                                                              // 167
                                                                                                   // 168
                                                                                                   // 169
  // a third email works.                                                                          // 170
  var result3 = Accounts.insertUserDoc(                                                            // 171
      {}, {emails: [{address: email3}]}                                                            // 172
  );                                                                                               // 173
  var user3 = Meteor.users.findOne(result3.id);                                                    // 174
  test.equal(typeof user3.createdAt, 'object');                                                    // 175
                                                                                                   // 176
  // cleanup                                                                                       // 177
  Meteor.users.remove(result.id);                                                                  // 178
  Meteor.users.remove(result3.id);                                                                 // 179
});                                                                                                // 180
                                                                                                   // 181
// More token expiration tests are in accounts-password                                            // 182
Tinytest.addAsync('accounts - expire numeric token', function (test, onComplete) {                 // 183
  var userIn = { username: Random.id() };                                                          // 184
  var result = Accounts.insertUserDoc({ profile: {                                                 // 185
    name: 'Foo Bar'                                                                                // 186
  } }, userIn);                                                                                    // 187
  var date = new Date(new Date() - 5000);                                                          // 188
  Meteor.users.update(result.id, {                                                                 // 189
    $set: {                                                                                        // 190
      "services.resume.loginTokens": [{                                                            // 191
        token: Random.id(),                                                                        // 192
        when: date                                                                                 // 193
      }, {                                                                                         // 194
        token: Random.id(),                                                                        // 195
        when: +date                                                                                // 196
      }]                                                                                           // 197
    }                                                                                              // 198
  });                                                                                              // 199
  var observe = Meteor.users.find(result.id).observe({                                             // 200
    changed: function (newUser) {                                                                  // 201
      if (newUser.services && newUser.services.resume &&                                           // 202
          _.isEmpty(newUser.services.resume.loginTokens)) {                                        // 203
        observe.stop();                                                                            // 204
        onComplete();                                                                              // 205
      }                                                                                            // 206
    }                                                                                              // 207
  });                                                                                              // 208
  Accounts._expireTokens(new Date(), result.id);                                                   // 209
});                                                                                                // 210
                                                                                                   // 211
                                                                                                   // 212
Tinytest.addAsync(                                                                                 // 213
  'accounts - connection data cleaned up',                                                         // 214
  function (test, onComplete) {                                                                    // 215
    makeTestConnection(                                                                            // 216
      test,                                                                                        // 217
      function (clientConn, serverConn) {                                                          // 218
        // onClose callbacks are called in order, so we run after the                              // 219
        // close callback in accounts.                                                             // 220
        serverConn.onClose(function () {                                                           // 221
          test.isFalse(Accounts._getAccountData(serverConn.id, 'connection'));                     // 222
          onComplete();                                                                            // 223
        });                                                                                        // 224
                                                                                                   // 225
        test.isTrue(Accounts._getAccountData(serverConn.id, 'connection'));                        // 226
        serverConn.close();                                                                        // 227
      },                                                                                           // 228
      onComplete                                                                                   // 229
    );                                                                                             // 230
  }                                                                                                // 231
);                                                                                                 // 232
                                                                                                   // 233
/////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
