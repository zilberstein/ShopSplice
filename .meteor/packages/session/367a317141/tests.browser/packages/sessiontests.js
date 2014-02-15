(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/session/session_tests.js                                                                //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
Tinytest.add('session - setDefault', function (test) {                                              // 1
  Session.setDefault('def', "argyle");                                                              // 2
  test.equal(Session.get('def'), "argyle");                                                         // 3
  Session.set('def', "noodle");                                                                     // 4
  test.equal(Session.get('def'), "noodle");                                                         // 5
  Session.set('nondef', "potato");                                                                  // 6
  test.equal(Session.get('nondef'), "potato");                                                      // 7
  Session.setDefault('nondef', "eggs");                                                             // 8
  test.equal(Session.get('nondef'), "potato");                                                      // 9
  // This is so the test passes the next time, after hot code push.  I know it                      // 10
  // doesn't return it to the completely untouched state, but we don't have                         // 11
  // Session.clear() yet.  When we do, this should be that.                                         // 12
  delete Session.keys['def'];                                                                       // 13
  delete Session.keys['nondef'];                                                                    // 14
});                                                                                                 // 15
                                                                                                    // 16
Tinytest.add('session - get/set/equals types', function (test) {                                    // 17
  test.equal(Session.get('u'), undefined);                                                          // 18
  test.isTrue(Session.equals('u', undefined));                                                      // 19
  test.isFalse(Session.equals('u', null));                                                          // 20
  test.isFalse(Session.equals('u', 0));                                                             // 21
  test.isFalse(Session.equals('u', ''));                                                            // 22
                                                                                                    // 23
  Session.set('u', undefined);                                                                      // 24
  test.equal(Session.get('u'), undefined);                                                          // 25
  test.isTrue(Session.equals('u', undefined));                                                      // 26
  test.isFalse(Session.equals('u', null));                                                          // 27
  test.isFalse(Session.equals('u', 0));                                                             // 28
  test.isFalse(Session.equals('u', ''));                                                            // 29
  test.isFalse(Session.equals('u', 'undefined'));                                                   // 30
  test.isFalse(Session.equals('u', 'null'));                                                        // 31
                                                                                                    // 32
  Session.set('n', null);                                                                           // 33
  test.equal(Session.get('n'), null);                                                               // 34
  test.isFalse(Session.equals('n', undefined));                                                     // 35
  test.isTrue(Session.equals('n', null));                                                           // 36
  test.isFalse(Session.equals('n', 0));                                                             // 37
  test.isFalse(Session.equals('n', ''));                                                            // 38
  test.isFalse(Session.equals('n', 'undefined'));                                                   // 39
  test.isFalse(Session.equals('n', 'null'));                                                        // 40
                                                                                                    // 41
  Session.set('t', true);                                                                           // 42
  test.equal(Session.get('t'), true);                                                               // 43
  test.isTrue(Session.equals('t', true));                                                           // 44
  test.isFalse(Session.equals('t', false));                                                         // 45
  test.isFalse(Session.equals('t', 1));                                                             // 46
  test.isFalse(Session.equals('t', 'true'));                                                        // 47
                                                                                                    // 48
  Session.set('f', false);                                                                          // 49
  test.equal(Session.get('f'), false);                                                              // 50
  test.isFalse(Session.equals('f', true));                                                          // 51
  test.isTrue(Session.equals('f', false));                                                          // 52
  test.isFalse(Session.equals('f', 1));                                                             // 53
  test.isFalse(Session.equals('f', 'false'));                                                       // 54
                                                                                                    // 55
  Session.set('num', 0);                                                                            // 56
  test.equal(Session.get('num'), 0);                                                                // 57
  test.isTrue(Session.equals('num', 0));                                                            // 58
  test.isFalse(Session.equals('num', false));                                                       // 59
  test.isFalse(Session.equals('num', '0'));                                                         // 60
  test.isFalse(Session.equals('num', 1));                                                           // 61
                                                                                                    // 62
  Session.set('str', 'true');                                                                       // 63
  test.equal(Session.get('str'), 'true');                                                           // 64
  test.isTrue(Session.equals('str', 'true'));                                                       // 65
  test.isFalse(Session.equals('str', true));                                                        // 66
                                                                                                    // 67
  Session.set('arr', [1, 2, {a: 1, b: [5, 6]}]);                                                    // 68
  test.equal(Session.get('arr'), [1, 2, {b: [5, 6], a: 1}]);                                        // 69
  test.isFalse(Session.equals('arr', 1));                                                           // 70
  test.isFalse(Session.equals('arr', '[1,2,{"a":1,"b":[5,6]}]'));                                   // 71
  test.throws(function () {                                                                         // 72
    Session.equals('arr', [1, 2, {a: 1, b: [5, 6]}]);                                               // 73
  });                                                                                               // 74
                                                                                                    // 75
  Session.set('obj', {a: 1, b: [5, 6]});                                                            // 76
  test.equal(Session.get('obj'), {b: [5, 6], a: 1});                                                // 77
  test.isFalse(Session.equals('obj', 1));                                                           // 78
  test.isFalse(Session.equals('obj', '{"a":1,"b":[5,6]}'));                                         // 79
  test.throws(function() { Session.equals('obj', {a: 1, b: [5, 6]}); });                            // 80
                                                                                                    // 81
                                                                                                    // 82
  Session.set('date', new Date(1234));                                                              // 83
  test.equal(Session.get('date'), new Date(1234));                                                  // 84
  test.isFalse(Session.equals('date', new Date(3455)));                                             // 85
  test.isTrue(Session.equals('date', new Date(1234)));                                              // 86
                                                                                                    // 87
  Session.set('oid', new Meteor.Collection.ObjectID('ffffffffffffffffffffffff'));                   // 88
  test.equal(Session.get('oid'),  new Meteor.Collection.ObjectID('ffffffffffffffffffffffff'));      // 89
  test.isFalse(Session.equals('oid',  new Meteor.Collection.ObjectID('fffffffffffffffffffffffa'))); // 90
  test.isTrue(Session.equals('oid', new Meteor.Collection.ObjectID('ffffffffffffffffffffffff')));   // 91
});                                                                                                 // 92
                                                                                                    // 93
Tinytest.add('session - objects are cloned', function (test) {                                      // 94
  Session.set('frozen-array', [1, 2, 3]);                                                           // 95
  Session.get('frozen-array')[1] = 42;                                                              // 96
  test.equal(Session.get('frozen-array'), [1, 2, 3]);                                               // 97
                                                                                                    // 98
  Session.set('frozen-object', {a: 1, b: 2});                                                       // 99
  Session.get('frozen-object').a = 43;                                                              // 100
  test.equal(Session.get('frozen-object'), {a: 1, b: 2});                                           // 101
});                                                                                                 // 102
                                                                                                    // 103
Tinytest.add('session - context invalidation for get', function (test) {                            // 104
  var xGetExecutions = 0;                                                                           // 105
  Deps.autorun(function () {                                                                        // 106
    ++xGetExecutions;                                                                               // 107
    Session.get('x');                                                                               // 108
  });                                                                                               // 109
  test.equal(xGetExecutions, 1);                                                                    // 110
  Session.set('x', 1);                                                                              // 111
  // Invalidation shouldn't happen until flush time.                                                // 112
  test.equal(xGetExecutions, 1);                                                                    // 113
  Deps.flush();                                                                                     // 114
  test.equal(xGetExecutions, 2);                                                                    // 115
  // Setting to the same value doesn't re-run.                                                      // 116
  Session.set('x', 1);                                                                              // 117
  Deps.flush();                                                                                     // 118
  test.equal(xGetExecutions, 2);                                                                    // 119
  Session.set('x', '1');                                                                            // 120
  Deps.flush();                                                                                     // 121
  test.equal(xGetExecutions, 3);                                                                    // 122
});                                                                                                 // 123
                                                                                                    // 124
Tinytest.add('session - context invalidation for equals', function (test) {                         // 125
  var xEqualsExecutions = 0;                                                                        // 126
  Deps.autorun(function () {                                                                        // 127
    ++xEqualsExecutions;                                                                            // 128
    Session.equals('x', 5);                                                                         // 129
  });                                                                                               // 130
  test.equal(xEqualsExecutions, 1);                                                                 // 131
  Session.set('x', 1);                                                                              // 132
  Deps.flush();                                                                                     // 133
  // Changing undefined -> 1 shouldn't affect equals(5).                                            // 134
  test.equal(xEqualsExecutions, 1);                                                                 // 135
  Session.set('x', 5);                                                                              // 136
  // Invalidation shouldn't happen until flush time.                                                // 137
  test.equal(xEqualsExecutions, 1);                                                                 // 138
  Deps.flush();                                                                                     // 139
  test.equal(xEqualsExecutions, 2);                                                                 // 140
  Session.set('x', 5);                                                                              // 141
  Deps.flush();                                                                                     // 142
  // Setting to the same value doesn't re-run.                                                      // 143
  test.equal(xEqualsExecutions, 2);                                                                 // 144
  Session.set('x', '5');                                                                            // 145
  test.equal(xEqualsExecutions, 2);                                                                 // 146
  Deps.flush();                                                                                     // 147
  test.equal(xEqualsExecutions, 3);                                                                 // 148
  Session.set('x', 5);                                                                              // 149
  test.equal(xEqualsExecutions, 3);                                                                 // 150
  Deps.flush();                                                                                     // 151
  test.equal(xEqualsExecutions, 4);                                                                 // 152
});                                                                                                 // 153
                                                                                                    // 154
Tinytest.add(                                                                                       // 155
  'session - context invalidation for equals with undefined',                                       // 156
  function (test) {                                                                                 // 157
    // Make sure the special casing for equals undefined works.                                     // 158
    var yEqualsExecutions = 0;                                                                      // 159
    Deps.autorun(function () {                                                                      // 160
      ++yEqualsExecutions;                                                                          // 161
      Session.equals('y', undefined);                                                               // 162
    });                                                                                             // 163
    test.equal(yEqualsExecutions, 1);                                                               // 164
    Session.set('y', undefined);                                                                    // 165
    Deps.flush();                                                                                   // 166
    test.equal(yEqualsExecutions, 1);                                                               // 167
    Session.set('y', 5);                                                                            // 168
    test.equal(yEqualsExecutions, 1);                                                               // 169
    Deps.flush();                                                                                   // 170
    test.equal(yEqualsExecutions, 2);                                                               // 171
    Session.set('y', 3);                                                                            // 172
    Deps.flush();                                                                                   // 173
    test.equal(yEqualsExecutions, 2);                                                               // 174
    Session.set('y', 'undefined');                                                                  // 175
    Deps.flush();                                                                                   // 176
    test.equal(yEqualsExecutions, 2);                                                               // 177
    Session.set('y', undefined);                                                                    // 178
    test.equal(yEqualsExecutions, 2);                                                               // 179
    Deps.flush();                                                                                   // 180
    test.equal(yEqualsExecutions, 3);                                                               // 181
  });                                                                                               // 182
                                                                                                    // 183
//////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
