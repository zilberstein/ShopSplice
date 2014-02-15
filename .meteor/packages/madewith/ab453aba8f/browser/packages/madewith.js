(function () {

///////////////////////////////////////////////////////////////////////////
//                                                                       //
// packages/madewith/template.madewith.js                                //
//                                                                       //
///////////////////////////////////////////////////////////////////////////
                                                                         //
Meteor.startup(function(){document.body.appendChild(Spark.render(Template.__define__(null,Package.handlebars.Handlebars.json_ast_to_func([[">","madewith"]]))));});Template.__define__("madewith",Package.handlebars.Handlebars.json_ast_to_func(["<a class=\"madewith_badge\" href=\"http://madewith.meteor.com/",["{",[[0,"shortname"]]],"\" target=\"_blank\">\n    <div class=\"madewith_votes\">\n      <div class=\"madewith_upvote\"></div>\n      <div class=\"madewith_vote_count\">",["{",[[0,"vote_count"]]],"</div>\n    </div>\n  </a>"]));
                                                                         // 2
///////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////
//                                                                       //
// packages/madewith/madewith.js                                         //
//                                                                       //
///////////////////////////////////////////////////////////////////////////
                                                                         //
// automatically capture this app's hostname                             // 1
var hostname = window.location.host;                                     // 2
var match = hostname.match(/(.*)\.meteor.com$/);                         // 3
var shortname = match ? match[1] : hostname;                             // 4
                                                                         // 5
// connect to madewith and subscribe to my app's record                  // 6
var server = DDP.connect("madewith.meteor.com");                         // 7
var sub = server.subscribe("myApp", hostname);                           // 8
                                                                         // 9
// minimongo collection to hold my singleton app record.                 // 10
var apps = new Meteor.Collection('madewith_apps', {connection: server}); // 11
                                                                         // 12
server.methods({                                                         // 13
  vote: function (hostname) {                                            // 14
    // This is a stub, so it doesn't need to call check.                 // 15
    apps.update({name: hostname}, {$inc: {vote_count: 1}});              // 16
  }                                                                      // 17
});                                                                      // 18
                                                                         // 19
Template.madewith.vote_count = function() {                              // 20
  var app = apps.findOne();                                              // 21
  return app ? app.vote_count : '';                                      // 22
};                                                                       // 23
                                                                         // 24
Template.madewith.shortname = function () {                              // 25
  return shortname;                                                      // 26
};                                                                       // 27
                                                                         // 28
Template.madewith.events({                                               // 29
  'click .madewith_upvote': function(event) {                            // 30
    var app = apps.findOne();                                            // 31
    if (app)                                                             // 32
      server.call('vote', hostname);                                     // 33
                                                                         // 34
    // stop these so you don't click through the link to go to the       // 35
    // app.                                                              // 36
    event.stopPropagation();                                             // 37
    event.preventDefault();                                              // 38
  }                                                                      // 39
});                                                                      // 40
                                                                         // 41
///////////////////////////////////////////////////////////////////////////

}).call(this);
