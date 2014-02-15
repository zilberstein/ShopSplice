Items = new Meteor.Collection("items");

if (Meteor.isClient) {
  Template.receipt.things = function () {
      return Items.find({name:"Hello World"}).fetch();
  };
  Template["receipt-form"].date = Date;
  Template.date.date = Date;

  Meteor.startup(function(){
    $('#add-field').click(function(){
      $('#rtable').append(Meteor.render(function(){
        return Template['receipt-field']();
      }));
    });
    Template['receipt-field'].rendered(function(){
      $('.price').keyup(function() {
        var prices = $('.price');
        var sum = 0;
        for (i = 0; i < prices.length; i++) {
          sum = sum + Number(prices[i].value);
        }
        $('.st').html(sum.toString());
      });
    });

  });

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
