(function () {

////////////////////////////////////////////////////////////////////////
//                                                                    //
// packages/localstorage/localstorage.js                              //
//                                                                    //
////////////////////////////////////////////////////////////////////////
                                                                      //
// This is not an ideal name, but we can change it later.             // 1
                                                                      // 2
if (window.localStorage) {                                            // 3
  Meteor._localStorage = {                                            // 4
    getItem: function (key) {                                         // 5
      return window.localStorage.getItem(key);                        // 6
    },                                                                // 7
    setItem: function (key, value) {                                  // 8
      window.localStorage.setItem(key, value);                        // 9
    },                                                                // 10
    removeItem: function (key) {                                      // 11
      window.localStorage.removeItem(key);                            // 12
    }                                                                 // 13
  };                                                                  // 14
}                                                                     // 15
// XXX eliminate dependency on jQuery, detect browsers ourselves      // 16
else if ($.browser.msie) { // If we are on IE, which support userData // 17
  var userdata = document.createElement('span'); // could be anything // 18
  userdata.style.behavior = 'url("#default#userData")';               // 19
  userdata.id = 'localstorage-helper';                                // 20
  userdata.style.display = 'none';                                    // 21
  document.getElementsByTagName("head")[0].appendChild(userdata);     // 22
                                                                      // 23
  var userdataKey = 'localStorage';                                   // 24
  userdata.load(userdataKey);                                         // 25
                                                                      // 26
  Meteor._localStorage = {                                            // 27
    setItem: function (key, val) {                                    // 28
      userdata.setAttribute(key, val);                                // 29
      userdata.save(userdataKey);                                     // 30
    },                                                                // 31
                                                                      // 32
    removeItem: function (key) {                                      // 33
      userdata.removeAttribute(key);                                  // 34
      userdata.save(userdataKey);                                     // 35
    },                                                                // 36
                                                                      // 37
    getItem: function (key) {                                         // 38
      userdata.load(userdataKey);                                     // 39
      return userdata.getAttribute(key);                              // 40
    }                                                                 // 41
  };                                                                  // 42
} else {                                                              // 43
  Meteor._debug(                                                      // 44
    "You are running a browser with no localStorage or userData "     // 45
      + "support. Logging in from one tab will not cause another "    // 46
      + "tab to be logged in.");                                      // 47
                                                                      // 48
  Meteor._localStorage = {                                            // 49
    _data: {},                                                        // 50
                                                                      // 51
    setItem: function (key, val) {                                    // 52
      this._data[key] = val;                                          // 53
    },                                                                // 54
    removeItem: function (key) {                                      // 55
      delete this._data[key];                                         // 56
    },                                                                // 57
    getItem: function (key) {                                         // 58
      var value = this._data[key];                                    // 59
      if (value === undefined)                                        // 60
        return null;                                                  // 61
      else                                                            // 62
        return value;                                                 // 63
    }                                                                 // 64
  };                                                                  // 65
}                                                                     // 66
                                                                      // 67
////////////////////////////////////////////////////////////////////////

}).call(this);
