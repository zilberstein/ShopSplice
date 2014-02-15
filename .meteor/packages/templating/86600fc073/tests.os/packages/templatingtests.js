(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/templating/plugin/html_scanner.js                                                       //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
html_scanner = {                                                                                    // 1
  // Scan a template file for <head>, <body>, and <template>                                        // 2
  // tags and extract their contents.                                                               // 3
  //                                                                                                // 4
  // This is a primitive, regex-based scanner.  It scans                                            // 5
  // top-level tags, which are allowed to have attributes,                                          // 6
  // and ignores top-level HTML comments.                                                           // 7
                                                                                                    // 8
  // Has fields 'message', 'line', 'file'                                                           // 9
  ParseError: function () {                                                                         // 10
  },                                                                                                // 11
                                                                                                    // 12
  scan: function (contents, source_name) {                                                          // 13
    var rest = contents;                                                                            // 14
    var index = 0;                                                                                  // 15
                                                                                                    // 16
    var advance = function(amount) {                                                                // 17
      rest = rest.substring(amount);                                                                // 18
      index += amount;                                                                              // 19
    };                                                                                              // 20
                                                                                                    // 21
    var throwParseError = function (msg, atIndex, lineOffset) {                                     // 22
      atIndex = atIndex || index;                                                                   // 23
      lineOffset = lineOffset || 0;                                                                 // 24
                                                                                                    // 25
      var ret = new html_scanner.ParseError;                                                        // 26
      ret.message = msg || "bad formatting in HTML template";                                       // 27
      ret.file = source_name;                                                                       // 28
      ret.line = contents.substring(0, atIndex).split('\n').length + lineOffset;                    // 29
      throw ret;                                                                                    // 30
    };                                                                                              // 31
                                                                                                    // 32
    var results = html_scanner._initResults();                                                      // 33
                                                                                                    // 34
    var rOpenTag = /^((<(template|head|body)\b)|(<!--)|(<!DOCTYPE|{{!)|$)/i;                        // 35
                                                                                                    // 36
    while (rest) {                                                                                  // 37
      // skip whitespace first (for better line numbers)                                            // 38
      advance(rest.match(/^\s*/)[0].length);                                                        // 39
                                                                                                    // 40
      var match = rOpenTag.exec(rest);                                                              // 41
      if (! match)                                                                                  // 42
        throwParseError(); // unknown text encountered                                              // 43
                                                                                                    // 44
      var matchToken = match[1];                                                                    // 45
      var matchTokenTagName =  match[3];                                                            // 46
      var matchTokenComment = match[4];                                                             // 47
      var matchTokenUnsupported = match[5];                                                         // 48
                                                                                                    // 49
      var tagStartIndex = index;                                                                    // 50
      advance(match.index + match[0].length);                                                       // 51
                                                                                                    // 52
      if (! matchToken)                                                                             // 53
        break; // matched $ (end of file)                                                           // 54
      if (matchTokenComment === '<!--') {                                                           // 55
        // top-level HTML comment                                                                   // 56
        var commentEnd = /--\s*>/.exec(rest);                                                       // 57
        if (! commentEnd)                                                                           // 58
          throwParseError("unclosed HTML comment");                                                 // 59
        advance(commentEnd.index + commentEnd[0].length);                                           // 60
        continue;                                                                                   // 61
      }                                                                                             // 62
      if (matchTokenUnsupported) {                                                                  // 63
        switch (matchTokenUnsupported.toLowerCase()) {                                              // 64
        case '<!doctype':                                                                           // 65
          throwParseError(                                                                          // 66
            "Can't set DOCTYPE here.  (Meteor sets <!DOCTYPE html> for you)");                      // 67
        case '{{!':                                                                                 // 68
          throwParseError(                                                                          // 69
            "Can't use '{{! }}' outside a template.  Use '<!-- -->'.");                             // 70
        }                                                                                           // 71
        throwParseError();                                                                          // 72
      }                                                                                             // 73
                                                                                                    // 74
      // otherwise, a <tag>                                                                         // 75
      var tagName = matchTokenTagName.toLowerCase();                                                // 76
      var tagAttribs = {}; // bare name -> value dict                                               // 77
      var rTagPart = /^\s*((([a-zA-Z0-9:_-]+)\s*=\s*(["'])(.*?)\4)|(>))/;                           // 78
      var attr;                                                                                     // 79
      // read attributes                                                                            // 80
      while ((attr = rTagPart.exec(rest))) {                                                        // 81
        var attrToken = attr[1];                                                                    // 82
        var attrKey = attr[3];                                                                      // 83
        var attrValue = attr[5];                                                                    // 84
        advance(attr.index + attr[0].length);                                                       // 85
        if (attrToken === '>')                                                                      // 86
          break;                                                                                    // 87
        // XXX we don't HTML unescape the attribute value                                           // 88
        // (e.g. to allow "abcd&quot;efg") or protect against                                       // 89
        // collisions with methods of tagAttribs (e.g. for                                          // 90
        // a property named toString)                                                               // 91
        attrValue = attrValue.match(/^\s*([\s\S]*?)\s*$/)[1]; // trim                               // 92
        tagAttribs[attrKey] = attrValue;                                                            // 93
      }                                                                                             // 94
      if (! attr) // didn't end on '>'                                                              // 95
        throwParseError("Parse error in tag");                                                      // 96
      // find </tag>                                                                                // 97
      var end = (new RegExp('</'+tagName+'\\s*>', 'i')).exec(rest);                                 // 98
      if (! end)                                                                                    // 99
        throwParseError("unclosed <"+tagName+">");                                                  // 100
      var tagContents = rest.slice(0, end.index);                                                   // 101
      var contentsStartIndex = index;                                                               // 102
      advance(end.index + end[0].length);                                                           // 103
                                                                                                    // 104
      // act on the tag                                                                             // 105
      html_scanner._handleTag(results, tagName, tagAttribs, tagContents,                            // 106
                              throwParseError, contentsStartIndex,                                  // 107
                              tagStartIndex);                                                       // 108
    }                                                                                               // 109
                                                                                                    // 110
    return results;                                                                                 // 111
  },                                                                                                // 112
                                                                                                    // 113
  _initResults: function() {                                                                        // 114
    var results = {};                                                                               // 115
    results.head = '';                                                                              // 116
    results.body = '';                                                                              // 117
    results.js = '';                                                                                // 118
    return results;                                                                                 // 119
  },                                                                                                // 120
                                                                                                    // 121
  _handleTag: function (results, tag, attribs, contents, throwParseError,                           // 122
                        contentsStartIndex, tagStartIndex) {                                        // 123
                                                                                                    // 124
    // trim the tag contents.                                                                       // 125
    // this is a courtesy and is also relied on by some unit tests.                                 // 126
    var m = contents.match(/^([ \t\r\n]*)([\s\S]*?)[ \t\r\n]*$/);                                   // 127
    contentsStartIndex += m[1].length;                                                              // 128
    contents = m[2];                                                                                // 129
                                                                                                    // 130
    // do we have 1 or more attribs?                                                                // 131
    var hasAttribs = false;                                                                         // 132
    for(var k in attribs) {                                                                         // 133
      if (attribs.hasOwnProperty(k)) {                                                              // 134
        hasAttribs = true;                                                                          // 135
        break;                                                                                      // 136
      }                                                                                             // 137
    }                                                                                               // 138
                                                                                                    // 139
    if (tag === "head") {                                                                           // 140
      if (hasAttribs)                                                                               // 141
        throwParseError("Attributes on <head> not supported");                                      // 142
      results.head += contents;                                                                     // 143
      return;                                                                                       // 144
    }                                                                                               // 145
                                                                                                    // 146
                                                                                                    // 147
    // <body> or <template>                                                                         // 148
    try {                                                                                           // 149
      var ast = Handlebars.to_json_ast(contents);                                                   // 150
    } catch (e) {                                                                                   // 151
      if (e instanceof Handlebars.ParseError) {                                                     // 152
        if (typeof(e.line) === "number")                                                            // 153
          // subtract one from e.line because it is one-based but we                                // 154
          // need it to be an offset from contentsStartIndex                                        // 155
          throwParseError(e.message, contentsStartIndex, e.line - 1);                               // 156
        else                                                                                        // 157
          // No line number available from Handlebars parser, so                                    // 158
          // generate the parse error at the <template> tag itself                                  // 159
          throwParseError("error in template: " + e.message, tagStartIndex);                        // 160
      }                                                                                             // 161
      else                                                                                          // 162
        throw e;                                                                                    // 163
    }                                                                                               // 164
    var code = 'Package.handlebars.Handlebars.json_ast_to_func(' +                                  // 165
          JSON.stringify(ast) + ')';                                                                // 166
                                                                                                    // 167
    if (tag === "template") {                                                                       // 168
      var name = attribs.name;                                                                      // 169
      if (! name)                                                                                   // 170
        throwParseError("Template has no 'name' attribute");                                        // 171
                                                                                                    // 172
      results.js += "Template.__define__(" + JSON.stringify(name) + ","                             // 173
        + code + ");\n";                                                                            // 174
    } else {                                                                                        // 175
      // <body>                                                                                     // 176
      if (hasAttribs)                                                                               // 177
        throwParseError("Attributes on <body> not supported");                                      // 178
      results.js += "Meteor.startup(function(){" +                                                  // 179
        "document.body.appendChild(Spark.render(" +                                                 // 180
        "Template.__define__(null," + code + ")));});";                                             // 181
    }                                                                                               // 182
  }                                                                                                 // 183
};                                                                                                  // 184
                                                                                                    // 185
//////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/templating/scanner_tests.js                                                             //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
Tinytest.add("templating - html scanner", function (test) {                                         // 1
  var testInString = function(actualStr, wantedContents) {                                          // 2
    if (actualStr.indexOf(wantedContents) >= 0)                                                     // 3
      test.ok();                                                                                    // 4
    else                                                                                            // 5
      test.fail("Expected "+JSON.stringify(wantedContents)+                                         // 6
                " in "+JSON.stringify(actualStr));                                                  // 7
  };                                                                                                // 8
                                                                                                    // 9
  var checkError = function(f, msgText, lineNum) {                                                  // 10
    try {                                                                                           // 11
      f();                                                                                          // 12
    } catch (e) {                                                                                   // 13
      if (e.line === lineNum)                                                                       // 14
        test.ok();                                                                                  // 15
      else                                                                                          // 16
        test.fail("Error should have been on line " + lineNum + ", not " +                          // 17
                  e.line);                                                                          // 18
      testInString(e.message, msgText);                                                             // 19
      return;                                                                                       // 20
    }                                                                                               // 21
    test.fail("Parse error didn't throw exception");                                                // 22
  };                                                                                                // 23
                                                                                                    // 24
  var BODY_PREAMBLE = "Meteor.startup(function(){" +                                                // 25
        "document.body.appendChild(Spark.render(" +                                                 // 26
        "Template.__define__(null,";                                                                // 27
  var BODY_POSTAMBLE = ")));});";                                                                   // 28
  var TEMPLATE_PREAMBLE = "Template.__define__(";                                                   // 29
  var TEMPLATE_POSTAMBLE = ");\n";                                                                  // 30
                                                                                                    // 31
  var checkResults = function(results, expectJs, expectHead) {                                      // 32
    test.equal(results.body, '');                                                                   // 33
    test.equal(results.js, expectJs || '');                                                         // 34
    test.equal(results.head, expectHead || '');                                                     // 35
  };                                                                                                // 36
                                                                                                    // 37
  checkError(function() {                                                                           // 38
    return html_scanner.scan("asdf");                                                               // 39
  }, "formatting in HTML template", 1);                                                             // 40
                                                                                                    // 41
  // body all on one line                                                                           // 42
  checkResults(                                                                                     // 43
    html_scanner.scan("<body>Hello</body>"),                                                        // 44
    BODY_PREAMBLE+'Package.handlebars.Handlebars.json_ast_to_func(["Hello"])'+BODY_POSTAMBLE);      // 45
                                                                                                    // 46
  // multi-line body, contents trimmed                                                              // 47
  checkResults(                                                                                     // 48
    html_scanner.scan("\n\n\n<body>\n\nHello\n\n</body>\n\n\n"),                                    // 49
    BODY_PREAMBLE+'Package.handlebars.Handlebars.json_ast_to_func(["Hello"])'+BODY_POSTAMBLE);      // 50
                                                                                                    // 51
  // same as previous, but with various HTML comments                                               // 52
  checkResults(                                                                                     // 53
    html_scanner.scan("\n<!--\n\nfoo\n-->\n<!-- -->\n"+                                             // 54
                      "<body>\n\nHello\n\n</body>\n\n<!----\n>\n\n"),                               // 55
    BODY_PREAMBLE+'Package.handlebars.Handlebars.json_ast_to_func(["Hello"])'+BODY_POSTAMBLE);      // 56
                                                                                                    // 57
  // head and body                                                                                  // 58
  checkResults(                                                                                     // 59
    html_scanner.scan("<head>\n<title>Hello</title>\n</head>\n\n<body>World</body>\n\n"),           // 60
    BODY_PREAMBLE+'Package.handlebars.Handlebars.json_ast_to_func(["World"])'+BODY_POSTAMBLE,       // 61
    "<title>Hello</title>");                                                                        // 62
                                                                                                    // 63
  // head and body with tag whitespace                                                              // 64
  checkResults(                                                                                     // 65
    html_scanner.scan("<head\n>\n<title>Hello</title>\n</head  >\n\n<body>World</body\n\n>\n\n"),   // 66
    BODY_PREAMBLE+'Package.handlebars.Handlebars.json_ast_to_func(["World"])'+BODY_POSTAMBLE,       // 67
    "<title>Hello</title>");                                                                        // 68
                                                                                                    // 69
  // head, body, and template                                                                       // 70
  checkResults(                                                                                     // 71
    html_scanner.scan("<head>\n<title>Hello</title>\n</head>\n\n<body>World</body>\n\n"+            // 72
                      '<template name="favoritefood">\n  pizza\n</template>\n'),                    // 73
    BODY_PREAMBLE+'Package.handlebars.Handlebars.json_ast_to_func(["World"])'+BODY_POSTAMBLE+       // 74
      TEMPLATE_PREAMBLE+'"favoritefood",Package.handlebars.Handlebars.json_ast_to_func(["pizza"])'+ // 75
      TEMPLATE_POSTAMBLE,                                                                           // 76
    "<title>Hello</title>");                                                                        // 77
                                                                                                    // 78
  // one-line template                                                                              // 79
  checkResults(                                                                                     // 80
    html_scanner.scan('<template name="favoritefood">pizza</template>'),                            // 81
    TEMPLATE_PREAMBLE+'"favoritefood",Package.handlebars.Handlebars.json_ast_to_func(["pizza"])'+   // 82
      TEMPLATE_POSTAMBLE);                                                                          // 83
                                                                                                    // 84
  // template with other attributes                                                                 // 85
  checkResults(                                                                                     // 86
    html_scanner.scan('<template foo="bar" name="favoritefood" baz="qux">'+                         // 87
                      'pizza</template>'),                                                          // 88
    TEMPLATE_PREAMBLE+'"favoritefood",Package.handlebars.Handlebars.json_ast_to_func(["pizza"])'+   // 89
      TEMPLATE_POSTAMBLE);                                                                          // 90
                                                                                                    // 91
  // whitespace around '=' in attributes and at end of tag                                          // 92
  checkResults(                                                                                     // 93
    html_scanner.scan('<template foo = "bar" name  ="favoritefood" baz= "qux"  >'+                  // 94
                      'pizza</template\n\n>'),                                                      // 95
    TEMPLATE_PREAMBLE+'"favoritefood",Package.handlebars.Handlebars.json_ast_to_func(["pizza"])'+   // 96
      TEMPLATE_POSTAMBLE);                                                                          // 97
                                                                                                    // 98
  // whitespace around template name                                                                // 99
  checkResults(                                                                                     // 100
    html_scanner.scan('<template name=" favoritefood  ">pizza</template>'),                         // 101
    TEMPLATE_PREAMBLE+'"favoritefood",Package.handlebars.Handlebars.json_ast_to_func(["pizza"])'+   // 102
      TEMPLATE_POSTAMBLE);                                                                          // 103
                                                                                                    // 104
  // single quotes around template name                                                             // 105
  checkResults(                                                                                     // 106
    html_scanner.scan('<template name=\'the "cool" template\'>'+                                    // 107
                      'pizza</template>'),                                                          // 108
    TEMPLATE_PREAMBLE+'"the \\"cool\\" template",'+                                                 // 109
      'Package.handlebars.Handlebars.json_ast_to_func(["pizza"])'+                                  // 110
      TEMPLATE_POSTAMBLE);                                                                          // 111
                                                                                                    // 112
  // error cases; exact line numbers are not critical, these just reflect                           // 113
  // the current implementation                                                                     // 114
                                                                                                    // 115
  // unclosed body (error mentions body)                                                            // 116
  checkError(function() {                                                                           // 117
    return html_scanner.scan("\n\n<body>\n  Hello\n</body");                                        // 118
  }, "body", 3);                                                                                    // 119
                                                                                                    // 120
  // bad open tag                                                                                   // 121
  checkError(function() {                                                                           // 122
    return html_scanner.scan("\n\n\n<bodyd>\n  Hello\n</body>");                                    // 123
  }, "formatting in HTML template", 4);                                                             // 124
  checkError(function() {                                                                           // 125
    return html_scanner.scan("\n\n\n\n<body foo=>\n  Hello\n</body>");                              // 126
  }, "error in tag", 5);                                                                            // 127
                                                                                                    // 128
  // unclosed tag                                                                                   // 129
  checkError(function() {                                                                           // 130
    return html_scanner.scan("\n<body>Hello");                                                      // 131
  }, "nclosed", 2);                                                                                 // 132
                                                                                                    // 133
  // unnamed template                                                                               // 134
  checkError(function() {                                                                           // 135
    return html_scanner.scan(                                                                       // 136
      "\n\n<template>Hi</template>\n\n<template>Hi</template>");                                    // 137
  }, "name", 3);                                                                                    // 138
                                                                                                    // 139
  // helpful doctype message                                                                        // 140
  checkError(function() {                                                                           // 141
    return html_scanner.scan(                                                                       // 142
      '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" '+                                         // 143
        '"http://www.w3.org/TR/html4/strict.dtd">'+                                                 // 144
        '\n\n<head>\n</head>');                                                                     // 145
  }, "DOCTYPE", 1);                                                                                 // 146
                                                                                                    // 147
  // lowercase basic doctype                                                                        // 148
  checkError(function() {                                                                           // 149
    return html_scanner.scan(                                                                       // 150
      '<!doctype html>');                                                                           // 151
  }, "DOCTYPE", 1);                                                                                 // 152
                                                                                                    // 153
  // attributes on body not supported                                                               // 154
  checkError(function() {                                                                           // 155
    return html_scanner.scan('<body foo="bar">\n  Hello\n</body>');                                 // 156
  }, "<body>", 3);                                                                                  // 157
                                                                                                    // 158
  // attributes on head not supported                                                               // 159
  checkError(function() {                                                                           // 160
    return html_scanner.scan('<head foo="bar">\n  Hello\n</head>');                                 // 161
  }, "<head>", 3);                                                                                  // 162
                                                                                                    // 163
  // can't mismatch quotes                                                                          // 164
  checkError(function() {                                                                           // 165
    return html_scanner.scan('<template name="foo\'>'+                                              // 166
                             'pizza</template>');                                                   // 167
  }, "error in tag", 1);                                                                            // 168
                                                                                                    // 169
});                                                                                                 // 170
                                                                                                    // 171
//////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
