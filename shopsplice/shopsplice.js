Items = new Meteor.Collection("items");

if (Meteor.isClient) {
  Template.receipt.items = function () {
      return Items.find({}, {sort: {name: 1, price: -1}});
  };

  /*  Template.hello.events({
    'click input' : function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    }
    });*/
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
