Items = new Meteor.Collection("items");

if (Meteor.isClient) {
  Template.receipt.things = function () {
      items = Items.find({_id:"CQt2mRTXk3n6kQJBd"}, {sort: {name: 1, price: -1}}).fetch();
      Meteor.defer(function() {
      $('input[type=checkbox]').click(function() {
        receipt = Items.find({_id:"CQt2mRTXk3n6kQJBd"}).fetch();
        items = $('tr.itemNF');
        sum = 0;
        for (i=0; i<items.length; i++) {
          if ($(items[i]).find('input[type=checkbox]').is(':checked')) {
            sum = sum + Number($(items[i]).find('.actualPrice').html());
          }
        }
        subtotal = Number($('.st').html());
        tax = Number($('.tax').html());
        sum = sum + (tax * sum / subtotal);
        $('.myTotal').html(sum.toFixed(2));
      });
    });
      return items;
  };
  Template["receipt-form"].date = new Date().toLocaleDateString();
  Template.date.date = Date;

  Handlebars.registerHelper('formatNum', function(n){
    return n.toFixed(2);
  });


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
      newR.name = $('#nameR').val();
      newR.date = new Date().toLocaleDateString();
      newR.tax = Number($('.tax').val());
      newR.items = []
      newR.subtotal = Number($('.st').html());
      newR.total = Number($('.total').html());
      items = $('.field');
      for (i = 0; i< items.length; i++) {
        item = {}
        item.name = $(items[i]).find('.iname').val();
        item.price = Number($(items[i]).find('.price').val());
        item.people = [];
        newR.items[i] = item;
      }
      var id = Items.insert(newR);
      $('#receipt').html(Meteor.render(function(){
        return Template['congrats-mess']({id:id});
      }))
    });
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
