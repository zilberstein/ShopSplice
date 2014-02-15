(function () {

/* Imports */
var Handlebars = Package.handlebars.Handlebars;

/* Package-scope variables */
var html_scanner;

(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// plugin/html_scanner.js                                                        //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
html_scanner = {                                                                 // 1
  // Scan a template file for <head>, <body>, and <template>                     // 2
  // tags and extract their contents.                                            // 3
  //                                                                             // 4
  // This is a primitive, regex-based scanner.  It scans                         // 5
  // top-level tags, which are allowed to have attributes,                       // 6
  // and ignores top-level HTML comments.                                        // 7
                                                                                 // 8
  // Has fields 'message', 'line', 'file'                                        // 9
  ParseError: function () {                                                      // 10
  },                                                                             // 11
                                                                                 // 12
  scan: function (contents, source_name) {                                       // 13
    var rest = contents;                                                         // 14
    var index = 0;                                                               // 15
                                                                                 // 16
    var advance = function(amount) {                                             // 17
      rest = rest.substring(amount);                                             // 18
      index += amount;                                                           // 19
    };                                                                           // 20
                                                                                 // 21
    var throwParseError = function (msg, atIndex, lineOffset) {                  // 22
      atIndex = atIndex || index;                                                // 23
      lineOffset = lineOffset || 0;                                              // 24
                                                                                 // 25
      var ret = new html_scanner.ParseError;                                     // 26
      ret.message = msg || "bad formatting in HTML template";                    // 27
      ret.file = source_name;                                                    // 28
      ret.line = contents.substring(0, atIndex).split('\n').length + lineOffset; // 29
      throw ret;                                                                 // 30
    };                                                                           // 31
                                                                                 // 32
    var results = html_scanner._initResults();                                   // 33
                                                                                 // 34
    var rOpenTag = /^((<(template|head|body)\b)|(<!--)|(<!DOCTYPE|{{!)|$)/i;     // 35
                                                                                 // 36
    while (rest) {                                                               // 37
      // skip whitespace first (for better line numbers)                         // 38
      advance(rest.match(/^\s*/)[0].length);                                     // 39
                                                                                 // 40
      var match = rOpenTag.exec(rest);                                           // 41
      if (! match)                                                               // 42
        throwParseError(); // unknown text encountered                           // 43
                                                                                 // 44
      var matchToken = match[1];                                                 // 45
      var matchTokenTagName =  match[3];                                         // 46
      var matchTokenComment = match[4];                                          // 47
      var matchTokenUnsupported = match[5];                                      // 48
                                                                                 // 49
      var tagStartIndex = index;                                                 // 50
      advance(match.index + match[0].length);                                    // 51
                                                                                 // 52
      if (! matchToken)                                                          // 53
        break; // matched $ (end of file)                                        // 54
      if (matchTokenComment === '<!--') {                                        // 55
        // top-level HTML comment                                                // 56
        var commentEnd = /--\s*>/.exec(rest);                                    // 57
        if (! commentEnd)                                                        // 58
          throwParseError("unclosed HTML comment");                              // 59
        advance(commentEnd.index + commentEnd[0].length);                        // 60
        continue;                                                                // 61
      }                                                                          // 62
      if (matchTokenUnsupported) {                                               // 63
        switch (matchTokenUnsupported.toLowerCase()) {                           // 64
        case '<!doctype':                                                        // 65
          throwParseError(                                                       // 66
            "Can't set DOCTYPE here.  (Meteor sets <!DOCTYPE html> for you)");   // 67
        case '{{!':                                                              // 68
          throwParseError(                                                       // 69
            "Can't use '{{! }}' outside a template.  Use '<!-- -->'.");          // 70
        }                                                                        // 71
        throwParseError();                                                       // 72
      }                                                                          // 73
                                                                                 // 74
      // otherwise, a <tag>                                                      // 75
      var tagName = matchTokenTagName.toLowerCase();                             // 76
      var tagAttribs = {}; // bare name -> value dict                            // 77
      var rTagPart = /^\s*((([a-zA-Z0-9:_-]+)\s*=\s*(["'])(.*?)\4)|(>))/;        // 78
      var attr;                                                                  // 79
      // read attributes                                                         // 80
      while ((attr = rTagPart.exec(rest))) {                                     // 81
        var attrToken = attr[1];                                                 // 82
        var attrKey = attr[3];                                                   // 83
        var attrValue = attr[5];                                                 // 84
        advance(attr.index + attr[0].length);                                    // 85
        if (attrToken === '>')                                                   // 86
          break;                                                                 // 87
        // XXX we don't HTML unescape the attribute value                        // 88
        // (e.g. to allow "abcd&quot;efg") or protect against                    // 89
        // collisions with methods of tagAttribs (e.g. for                       // 90
        // a property named toString)                                            // 91
        attrValue = attrValue.match(/^\s*([\s\S]*?)\s*$/)[1]; // trim            // 92
        tagAttribs[attrKey] = attrValue;                                         // 93
      }                                                                          // 94
      if (! attr) // didn't end on '>'                                           // 95
        throwParseError("Parse error in tag");                                   // 96
      // find </tag>                                                             // 97
      var end = (new RegExp('</'+tagName+'\\s*>', 'i')).exec(rest);              // 98
      if (! end)                                                                 // 99
        throwParseError("unclosed <"+tagName+">");                               // 100
      var tagContents = rest.slice(0, end.index);                                // 101
      var contentsStartIndex = index;                                            // 102
      advance(end.index + end[0].length);                                        // 103
                                                                                 // 104
      // act on the tag                                                          // 105
      html_scanner._handleTag(results, tagName, tagAttribs, tagContents,         // 106
                              throwParseError, contentsStartIndex,               // 107
                              tagStartIndex);                                    // 108
    }                                                                            // 109
                                                                                 // 110
    return results;                                                              // 111
  },                                                                             // 112
                                                                                 // 113
  _initResults: function() {                                                     // 114
    var results = {};                                                            // 115
    results.head = '';                                                           // 116
    results.body = '';                                                           // 117
    results.js = '';                                                             // 118
    return results;                                                              // 119
  },                                                                             // 120
                                                                                 // 121
  _handleTag: function (results, tag, attribs, contents, throwParseError,        // 122
                        contentsStartIndex, tagStartIndex) {                     // 123
                                                                                 // 124
    // trim the tag contents.                                                    // 125
    // this is a courtesy and is also relied on by some unit tests.              // 126
    var m = contents.match(/^([ \t\r\n]*)([\s\S]*?)[ \t\r\n]*$/);                // 127
    contentsStartIndex += m[1].length;                                           // 128
    contents = m[2];                                                             // 129
                                                                                 // 130
    // do we have 1 or more attribs?                                             // 131
    var hasAttribs = false;                                                      // 132
    for(var k in attribs) {                                                      // 133
      if (attribs.hasOwnProperty(k)) {                                           // 134
        hasAttribs = true;                                                       // 135
        break;                                                                   // 136
      }                                                                          // 137
    }                                                                            // 138
                                                                                 // 139
    if (tag === "head") {                                                        // 140
      if (hasAttribs)                                                            // 141
        throwParseError("Attributes on <head> not supported");                   // 142
      results.head += contents;                                                  // 143
      return;                                                                    // 144
    }                                                                            // 145
                                                                                 // 146
                                                                                 // 147
    // <body> or <template>                                                      // 148
    try {                                                                        // 149
      var ast = Handlebars.to_json_ast(contents);                                // 150
    } catch (e) {                                                                // 151
      if (e instanceof Handlebars.ParseError) {                                  // 152
        if (typeof(e.line) === "number")                                         // 153
          // subtract one from e.line because it is one-based but we             // 154
          // need it to be an offset from contentsStartIndex                     // 155
          throwParseError(e.message, contentsStartIndex, e.line - 1);            // 156
        else                                                                     // 157
          // No line number available from Handlebars parser, so                 // 158
          // generate the parse error at the <template> tag itself               // 159
          throwParseError("error in template: " + e.message, tagStartIndex);     // 160
      }                                                                          // 161
      else                                                                       // 162
        throw e;                                                                 // 163
    }                                                                            // 164
    var code = 'Package.handlebars.Handlebars.json_ast_to_func(' +               // 165
          JSON.stringify(ast) + ')';                                             // 166
                                                                                 // 167
    if (tag === "template") {                                                    // 168
      var name = attribs.name;                                                   // 169
      if (! name)                                                                // 170
        throwParseError("Template has no 'name' attribute");                     // 171
                                                                                 // 172
      results.js += "Template.__define__(" + JSON.stringify(name) + ","          // 173
        + code + ");\n";                                                         // 174
    } else {                                                                     // 175
      // <body>                                                                  // 176
      if (hasAttribs)                                                            // 177
        throwParseError("Attributes on <body> not supported");                   // 178
      results.js += "Meteor.startup(function(){" +                               // 179
        "document.body.appendChild(Spark.render(" +                              // 180
        "Template.__define__(null," + code + ")));});";                          // 181
    }                                                                            // 182
  }                                                                              // 183
};                                                                               // 184
                                                                                 // 185
///////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// plugin/compile-templates.js                                                   //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
var path = Npm.require('path');                                                  // 1
                                                                                 // 2
Plugin.registerSourceHandler("html", function (compileStep) {                    // 3
  // XXX use archinfo rather than rolling our own                                // 4
  if (! compileStep.arch.match(/^browser(\.|$)/))                                // 5
    // XXX might be nice to throw an error here, but then we'd have to           // 6
    // make it so that packages.js ignores html files that appear in             // 7
    // the server directories in an app tree.. or, it might be nice to           // 8
    // make html files actually work on the server (against jsdom or             // 9
    // something)                                                                // 10
    return;                                                                      // 11
                                                                                 // 12
  // XXX the way we deal with encodings here is sloppy .. should get             // 13
  // religion on that                                                            // 14
  var contents = compileStep.read().toString('utf8');                            // 15
  try {                                                                          // 16
    var results = html_scanner.scan(contents, compileStep.inputPath);            // 17
  } catch (e) {                                                                  // 18
    if (e instanceof html_scanner.ParseError) {                                  // 19
      compileStep.error({                                                        // 20
        message: e.message,                                                      // 21
        sourcePath: compileStep.inputPath,                                       // 22
        line: e.line                                                             // 23
      });                                                                        // 24
      return;                                                                    // 25
    } else                                                                       // 26
      throw e;                                                                   // 27
  }                                                                              // 28
                                                                                 // 29
  if (results.head)                                                              // 30
    compileStep.appendDocument({ section: "head", data: results.head });         // 31
                                                                                 // 32
  if (results.body)                                                              // 33
    compileStep.appendDocument({ section: "body", data: results.body });         // 34
                                                                                 // 35
  if (results.js) {                                                              // 36
    var path_part = path.dirname(compileStep.inputPath);                         // 37
    if (path_part === '.')                                                       // 38
      path_part = '';                                                            // 39
    if (path_part.length && path_part !== path.sep)                              // 40
      path_part = path_part + path.sep;                                          // 41
    var ext = path.extname(compileStep.inputPath);                               // 42
    var basename = path.basename(compileStep.inputPath, ext);                    // 43
                                                                                 // 44
    // XXX generate a source map                                                 // 45
                                                                                 // 46
    compileStep.addJavaScript({                                                  // 47
      path: path.join(path_part, "template." + basename + ".js"),                // 48
      sourcePath: compileStep.inputPath,                                         // 49
      data: results.js                                                           // 50
    });                                                                          // 51
  }                                                                              // 52
});                                                                              // 53
                                                                                 // 54
///////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
if (typeof Package === 'undefined') Package = {};
Package.compileTemplates = {};

})();
