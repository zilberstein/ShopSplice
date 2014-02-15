(function () {

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/session/session.js                                         //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var migratedKeys = {};                                                 // 1
if (Package.reload) {                                                  // 2
  var migrationData = Package.reload.Reload._migrationData('session'); // 3
  if (migrationData && migrationData.keys) {                           // 4
    migratedKeys = migrationData.keys;                                 // 5
  }                                                                    // 6
}                                                                      // 7
                                                                       // 8
Session = new ReactiveDict(migratedKeys);                              // 9
                                                                       // 10
if (Package.reload) {                                                  // 11
  Package.reload.Reload._onMigrate('session', function () {            // 12
    return [true, {keys: Session.keys}];                               // 13
  });                                                                  // 14
}                                                                      // 15
                                                                       // 16
/////////////////////////////////////////////////////////////////////////

}).call(this);
