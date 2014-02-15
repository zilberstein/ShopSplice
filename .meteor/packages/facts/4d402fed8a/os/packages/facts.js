(function () {

/////////////////////////////////////////////////////////////////////////////////
//                                                                             //
// packages/facts/facts.js                                                     //
//                                                                             //
/////////////////////////////////////////////////////////////////////////////////
                                                                               //
Facts = {};                                                                    // 1
                                                                               // 2
var serverFactsCollection = 'meteor_Facts_server';                             // 3
                                                                               // 4
if (Meteor.isServer) {                                                         // 5
  // By default, we publish facts to no user if autopublish is off, and to all // 6
  // users if autopublish is on.                                               // 7
  var userIdFilter = function (userId) {                                       // 8
    return !!Package.autopublish;                                              // 9
  };                                                                           // 10
                                                                               // 11
  // XXX make this take effect at runtime too?                                 // 12
  Facts.setUserIdFilter = function (filter) {                                  // 13
    userIdFilter = filter;                                                     // 14
  };                                                                           // 15
                                                                               // 16
  // XXX Use a minimongo collection instead and hook up an observeChanges      // 17
  // directly to a publish.                                                    // 18
  var factsByPackage = {};                                                     // 19
  var activeSubscriptions = [];                                                // 20
                                                                               // 21
  Facts.incrementServerFact = function (pkg, fact, increment) {                // 22
    if (!_.has(factsByPackage, pkg)) {                                         // 23
      factsByPackage[pkg] = {};                                                // 24
      factsByPackage[pkg][fact] = increment;                                   // 25
      _.each(activeSubscriptions, function (sub) {                             // 26
        sub.added(serverFactsCollection, pkg, factsByPackage[pkg]);            // 27
      });                                                                      // 28
      return;                                                                  // 29
    }                                                                          // 30
                                                                               // 31
    var packageFacts = factsByPackage[pkg];                                    // 32
    if (!_.has(packageFacts, fact))                                            // 33
      factsByPackage[pkg][fact] = 0;                                           // 34
    factsByPackage[pkg][fact] += increment;                                    // 35
    var changedField = {};                                                     // 36
    changedField[fact] = factsByPackage[pkg][fact];                            // 37
    _.each(activeSubscriptions, function (sub) {                               // 38
      sub.changed(serverFactsCollection, pkg, changedField);                   // 39
    });                                                                        // 40
  };                                                                           // 41
                                                                               // 42
  // Deferred, because we have an unordered dependency on livedata.            // 43
  // XXX is this safe? could somebody try to connect before Meteor.publish is  // 44
  // called?                                                                   // 45
  Meteor.defer(function () {                                                   // 46
    // XXX Also publish facts-by-package.                                      // 47
    Meteor.publish("meteor_facts", function () {                               // 48
      var sub = this;                                                          // 49
      if (!userIdFilter(this.userId)) {                                        // 50
        sub.ready();                                                           // 51
        return;                                                                // 52
      }                                                                        // 53
      activeSubscriptions.push(sub);                                           // 54
      _.each(factsByPackage, function (facts, pkg) {                           // 55
        sub.added(serverFactsCollection, pkg, facts);                          // 56
      });                                                                      // 57
      sub.onStop(function () {                                                 // 58
        activeSubscriptions = _.without(activeSubscriptions, sub);             // 59
      });                                                                      // 60
      sub.ready();                                                             // 61
    }, {is_auto: true});                                                       // 62
  });                                                                          // 63
} else {                                                                       // 64
  Facts.server = new Meteor.Collection(serverFactsCollection);                 // 65
                                                                               // 66
  Template.serverFacts.factsByPackage = function () {                          // 67
    return Facts.server.find();                                                // 68
  };                                                                           // 69
  Template.serverFacts.facts = function () {                                   // 70
    var factArray = [];                                                        // 71
    _.each(this, function (value, name) {                                      // 72
      if (name !== '_id')                                                      // 73
        factArray.push({name: name, value: value});                            // 74
    });                                                                        // 75
    return factArray;                                                          // 76
  };                                                                           // 77
                                                                               // 78
  // Subscribe when the template is first made, and unsubscribe when it        // 79
  // is removed. If for some reason puts two copies of the template on         // 80
  // the screen at once, we'll subscribe twice. Meh.                           // 81
  Template.serverFacts.created = function () {                                 // 82
    this._stopHandle = Meteor.subscribe("meteor_facts");                       // 83
  };                                                                           // 84
  Template.serverFacts.destroyed = function () {                               // 85
    if (this._stopHandle) {                                                    // 86
      this._stopHandle.stop();                                                 // 87
      this._stopHandle = null;                                                 // 88
    }                                                                          // 89
  };                                                                           // 90
}                                                                              // 91
                                                                               // 92
/////////////////////////////////////////////////////////////////////////////////

}).call(this);
