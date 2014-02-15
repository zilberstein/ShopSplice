Items = new Meteor.Collection("items");

if (Meteor.isClient) {
  Template.receipt.things = function () {
      return Items.find({name:"Hello World"}, {sort: {name: 1, price: -1}}).fetch();
  };
  Template["receipt-form"].date = Date;
  Template.date.date = Date;


  Meteor.startup(function(){
    function updateTotals() {
        var prices = $('.price');
        var sum = 0;
        for (i = 0; i < prices.length; i++) {
          v = Number(prices[i].value);
          sum = sum + Number(prices[i].value);
        }
        $('.st').html(sum.toFixed(2));
        tax = Number($('.tax')[0].value)
        sum = sum + tax
        $('.total').html(sum.toFixed(2));
      }
      function fixNums(e) {
        v = Number(e.target.value);
        e.target.value = v.toFixed(2);
      }

    $('#add-field').click(function(){
      $('#rtable').append(Meteor.render(function(){
        return Template['receipt-field']();
      }));

      $('.price').keyup(updateTotals);
      $('.price').blur(fixNums);
    });
    $('.price').keyup(updateTotals);
    $('.price').blur(fixNums);
    $('.tax').keyup(updateTotals);
    $('.tax').blur(fixNums);
    $('#submit').click(function(){
      var newR = {};
    });
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
