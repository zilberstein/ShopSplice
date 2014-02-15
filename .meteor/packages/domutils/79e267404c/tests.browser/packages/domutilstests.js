(function () {

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/domutils/domutils_tests.js                                 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
Tinytest.add("domutils - setElementValue", function (test) {           // 1
  var div = OnscreenDiv();                                             // 2
  div.node().appendChild(DomUtils.htmlToFragment(                      // 3
    ("<select><option>Foo</option><option value='Bar'>Baz</option>" +  // 4
     "<option selected value='Quux'>Quux</option></select>")));        // 5
                                                                       // 6
  var select = DomUtils.find(div.node(), 'select');                    // 7
  test.equal(DomUtils.getElementValue(select), "Quux");                // 8
  _.each(["Foo", "Bar", "Quux"], function (value) {                    // 9
    DomUtils.setElementValue(select, value);                           // 10
    test.equal(DomUtils.getElementValue(select), value);               // 11
  });                                                                  // 12
                                                                       // 13
  div.kill();                                                          // 14
});                                                                    // 15
                                                                       // 16
Tinytest.add("domutils - form id expando", function (test) {           // 17
  // See https://github.com/meteor/meteor/issues/604                   // 18
                                                                       // 19
  var div = OnscreenDiv();                                             // 20
  div.node().appendChild(DomUtils.htmlToFragment(                      // 21
    ('<form><input name="id"></form>')));                              // 22
  var theInput = DomUtils.find(div.node(), 'input');                   // 23
  var theForm = theInput.parentNode;                                   // 24
  var theDiv = theForm.parentNode;                                     // 25
                                                                       // 26
  // test that this call doesn't throw an exception                    // 27
  test.equal(DomUtils.matchesSelector(theForm, theDiv, 'form'), true); // 28
                                                                       // 29
  div.kill();                                                          // 30
});                                                                    // 31
                                                                       // 32
/////////////////////////////////////////////////////////////////////////

}).call(this);
