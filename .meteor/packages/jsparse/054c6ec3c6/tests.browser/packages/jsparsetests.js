(function () {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/jsparse/parser_tests.js                                                                        //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
var parserTestOptions = { includeComments: true };                                                         // 1
                                                                                                           // 2
var allNodeNames = [                                                                                       // 3
  ";",                                                                                                     // 4
  "array",                                                                                                 // 5
  "assignment",                                                                                            // 6
  "binary",                                                                                                // 7
  "blockStmnt",                                                                                            // 8
  "boolean",                                                                                               // 9
  "bracket",                                                                                               // 10
  "breakStmnt",                                                                                            // 11
  "call",                                                                                                  // 12
  "case",                                                                                                  // 13
  "catch",                                                                                                 // 14
  "comma",                                                                                                 // 15
  "comment",                                                                                               // 16
  "continueStmnt",                                                                                         // 17
  "debuggerStmnt",                                                                                         // 18
  "default",                                                                                               // 19
  "doStmnt",                                                                                               // 20
  "dot",                                                                                                   // 21
  "emptyStmnt",                                                                                            // 22
  "expressionStmnt",                                                                                       // 23
  "finally",                                                                                               // 24
  "forInSpec",                                                                                             // 25
  "forSpec",                                                                                               // 26
  "forStmnt",                                                                                              // 27
  "forVarInSpec",                                                                                          // 28
  "forVarSpec",                                                                                            // 29
  "functionDecl",                                                                                          // 30
  "functionExpr",                                                                                          // 31
  "idPropName",                                                                                            // 32
  "identifier",                                                                                            // 33
  "ifStmnt",                                                                                               // 34
  "labelStmnt",                                                                                            // 35
  "new",                                                                                                   // 36
  "newcall",                                                                                               // 37
  "nil",                                                                                                   // 38
  "null",                                                                                                  // 39
  "numPropName",                                                                                           // 40
  "number",                                                                                                // 41
  "object",                                                                                                // 42
  "parens",                                                                                                // 43
  "postfix",                                                                                               // 44
  "program",                                                                                               // 45
  "prop",                                                                                                  // 46
  "regex",                                                                                                 // 47
  "returnStmnt",                                                                                           // 48
  "strPropName",                                                                                           // 49
  "string",                                                                                                // 50
  "switchStmnt",                                                                                           // 51
  "ternary",                                                                                               // 52
  "this",                                                                                                  // 53
  "throwStmnt",                                                                                            // 54
  "tryStmnt",                                                                                              // 55
  "unary",                                                                                                 // 56
  "varDecl",                                                                                               // 57
  "varStmnt",                                                                                              // 58
  "whileStmnt",                                                                                            // 59
  "withStmnt"                                                                                              // 60
];                                                                                                         // 61
                                                                                                           // 62
var allNodeNamesSet = {};                                                                                  // 63
_.each(allNodeNames, function (n) { allNodeNamesSet[n] = true; });                                         // 64
                                                                                                           // 65
                                                                                                           // 66
var makeTester = function (test) {                                                                         // 67
  return {                                                                                                 // 68
    // Parse code and make sure it matches expectedTreeString.                                             // 69
    goodParse: function (code, expectedTreeString, regexTokenHints) {                                      // 70
      var expectedTree = ParseNode.unstringify(expectedTreeString);                                        // 71
                                                                                                           // 72
      // first use lexer to collect all tokens                                                             // 73
      var lexer = new JSLexer(code);                                                                       // 74
      var allTokensInOrder = [];                                                                           // 75
      while (! lexer.next().isEOF()) {                                                                     // 76
        var lex = lexer.lastLexeme;                                                                        // 77
        if (lex.isError())                                                                                 // 78
          test.fail("Lexer error at " + lex.startPos());                                                   // 79
        if (lex.isToken())                                                                                 // 80
          allTokensInOrder.push(lex);                                                                      // 81
        if (regexTokenHints && regexTokenHints[allTokensInOrder.length])                                   // 82
          lexer.divisionPermitted = false;                                                                 // 83
      }                                                                                                    // 84
                                                                                                           // 85
      var parser = new JSParser(code, parserTestOptions);                                                  // 86
      var actualTree = parser.getSyntaxTree();                                                             // 87
                                                                                                           // 88
      var nextTokenIndex = 0;                                                                              // 89
      var check = function (tree) {                                                                        // 90
        if (tree instanceof ParseNode) {                                                                   // 91
          // This is a NODE (non-terminal).                                                                // 92
          var nodeName = tree.name;                                                                        // 93
          if (! (nodeName && typeof nodeName === "string" &&                                               // 94
                 allNodeNamesSet[nodeName] === true))                                                      // 95
            test.fail("Not a node name: " + nodeName);                                                     // 96
          _.each(tree.children, check);                                                                    // 97
        } else if (typeof tree === 'object' &&                                                             // 98
                   typeof tree.text === 'function') {                                                      // 99
          // This is a TOKEN (terminal).                                                                   // 100
          // Make sure we are visiting every token once, in order.                                         // 101
          // Make an exception for any comment lexemes present,                                            // 102
          // because we couldn't know whether to include them in                                           // 103
          // allTokensInOrder.                                                                             // 104
          if (tree.type() !== "COMMENT") {                                                                 // 105
            if (nextTokenIndex >= allTokensInOrder.length)                                                 // 106
              test.fail("Too many tokens: " + (nextTokenIndex + 1));                                       // 107
            var referenceToken = allTokensInOrder[nextTokenIndex++];                                       // 108
            if (tree.text() !== referenceToken.text())                                                     // 109
              test.fail(tree.text() + " !== " + referenceToken.text());                                    // 110
            if (tree.startPos() !== referenceToken.startPos())                                             // 111
              test.fail(tree.startPos() + " !== " + referenceToken.startPos());                            // 112
            if (code.substring(tree.startPos(), tree.endPos()) !== tree.text())                            // 113
              test.fail("Didn't see " + tree.text() + " at " + tree.startPos() +                           // 114
                        " in " + code);                                                                    // 115
          }                                                                                                // 116
        } else {                                                                                           // 117
          test.fail("Unknown tree part: " + tree);                                                         // 118
        }                                                                                                  // 119
      };                                                                                                   // 120
                                                                                                           // 121
      check(actualTree);                                                                                   // 122
      if (nextTokenIndex !== allTokensInOrder.length)                                                      // 123
        test.fail("Too few tokens: " + nextTokenIndex);                                                    // 124
                                                                                                           // 125
      test.equal(parser.pos, code.length);                                                                 // 126
                                                                                                           // 127
      test.equal(ParseNode.stringify(actualTree),                                                          // 128
                 ParseNode.stringify(expectedTree), code);                                                 // 129
    },                                                                                                     // 130
    // Takes code with part of it surrounding with backticks.                                              // 131
    // Removes the two backtick characters, tries to parse the code,                                       // 132
    // and then asserts that there was a tokenization-level error,                                         // 133
    // with the part that was between the backticks called out as                                          // 134
    // the bad token.                                                                                      // 135
    //                                                                                                     // 136
    // For example, the test "123`@`" will try to parse "123@" and                                         // 137
    // assert that a tokenization error occurred at '@'.                                                   // 138
    badToken: function (code) {                                                                            // 139
      var constructMessage = function (pos, text) {                                                        // 140
        var nicePos = JSLexer.prettyOffset(code, pos);                                                     // 141
        return "Bad token at " + nicePos + ", text `" + text + "`";                                        // 142
      };                                                                                                   // 143
      var pos = code.indexOf('`');                                                                         // 144
      var text = code.match(/`(.*?)`/)[1];                                                                 // 145
      code = code.replace(/`/g, '');                                                                       // 146
                                                                                                           // 147
      var parsed = false;                                                                                  // 148
      var error = null;                                                                                    // 149
      try {                                                                                                // 150
        var tree = new JSParser(code, parserTestOptions).getSyntaxTree();                                  // 151
        parsed = true;                                                                                     // 152
      } catch (e) {                                                                                        // 153
        error = e;                                                                                         // 154
      }                                                                                                    // 155
      test.isFalse(parsed);                                                                                // 156
      test.isTrue(error);                                                                                  // 157
      test.equal(error.message, constructMessage(pos, text));                                              // 158
    },                                                                                                     // 159
    // Takes code with a backtick-quoted string embedded in it.                                            // 160
    // Removes the backticks and their contents, tries to parse the code,                                  // 161
    // and then asserts that there was a parse error at the location                                       // 162
    // where the backtick-quoted string was embedded.  The embedded                                        // 163
    // string must match whatever the error message says was "expected".                                   // 164
    //                                                                                                     // 165
    // For example, the test "{`statement`" will try to parse the code                                     // 166
    // "{" and then assert that an error occured at the end of the string                                  // 167
    // saying "Expected statement".  The test "1 `semicolon`2" will try                                    // 168
    // to parse "1 2" and assert that the error "Expected semicolon"                                       // 169
    // appeared after the space and before the 2.                                                          // 170
    //                                                                                                     // 171
    // A second backtick-quoted string is used as the "found" token                                        // 172
    // in the error message.                                                                               // 173
    badParse: function (code) {                                                                            // 174
      var constructMessage = function (whatExpected, pos, found, after) {                                  // 175
        return "Expected " + whatExpected + (after ? " after " + after : "") +                             // 176
          " at " + JSLexer.prettyOffset(code, pos) + ", found " + found;                                   // 177
      };                                                                                                   // 178
      var pos = code.indexOf('`');                                                                         // 179
                                                                                                           // 180
      var backticked = code.match(/`.*?`/g);                                                               // 181
      var whatExpected = backticked[0] && backticked[0].slice(1,-1);                                       // 182
      var found = backticked[1] && backticked[1].slice(1, -1);                                             // 183
      code = code.replace(/`.*?`/g, '');                                                                   // 184
                                                                                                           // 185
      var parsed = false;                                                                                  // 186
      var error = null;                                                                                    // 187
      var parser = new JSParser(code, parserTestOptions);                                                  // 188
      try {                                                                                                // 189
        var tree = parser.getSyntaxTree();                                                                 // 190
        parsed = true;                                                                                     // 191
      } catch (e) {                                                                                        // 192
        error = e;                                                                                         // 193
      }                                                                                                    // 194
      test.isFalse(parsed);                                                                                // 195
      test.isTrue(error);                                                                                  // 196
      if (! parsed && error) {                                                                             // 197
        var after = parser.oldToken;                                                                       // 198
        found = (found || parser.newToken);                                                                // 199
        test.equal(error.message,                                                                          // 200
                   constructMessage(whatExpected, pos, found, after),                                      // 201
                   code);                                                                                  // 202
      }                                                                                                    // 203
    }                                                                                                      // 204
  };                                                                                                       // 205
};                                                                                                         // 206
                                                                                                           // 207
                                                                                                           // 208
Tinytest.add("jsparse - basics", function (test) {                                                         // 209
  var tester = makeTester(test);                                                                           // 210
  tester.goodParse('1', "program(expressionStmnt(number(1) ;()))");                                        // 211
  tester.goodParse('1 + 1', "program(expressionStmnt(binary(number(1) + number(1)) ;()))");                // 212
  tester.goodParse('1*2+3*4', "program(expressionStmnt(binary(binary(number(1) * number(2)) + " +          // 213
                "binary(number(3) * number(4))) ;()))");                                                   // 214
  tester.goodParse('1 + 1;', "program(expressionStmnt(binary(number(1) + number(1)) ;))");                 // 215
  tester.goodParse('1 + 1;;', "program(expressionStmnt(binary(number(1) + number(1)) ;) emptyStmnt(;))");  // 216
  tester.goodParse('', "program()");                                                                       // 217
  tester.goodParse('\n', "program()");                                                                     // 218
  tester.goodParse(';;;\n\n;\n', "program(emptyStmnt(;) emptyStmnt(;) emptyStmnt(;) emptyStmnt(;))");      // 219
  tester.goodParse('foo', "program(expressionStmnt(identifier(foo) ;()))");                                // 220
  tester.goodParse('foo();', "program(expressionStmnt(call(identifier(foo) `(` `)`) ;))");                 // 221
  tester.goodParse('var x = 3', "program(varStmnt(var varDecl(x = number(3)) ;()))");                      // 222
  tester.goodParse('++x;', "program(expressionStmnt(unary(++ identifier(x)) ;))");                         // 223
  tester.goodParse('x++;', "program(expressionStmnt(postfix(identifier(x) ++) ;))");                       // 224
  tester.goodParse(                                                                                        // 225
    'throw new Error',                                                                                     // 226
    "program(throwStmnt(throw new(new identifier(Error)) ;()))");                                          // 227
  tester.goodParse(                                                                                        // 228
    'var x = function () { return 123; };',                                                                // 229
    'program(varStmnt(var varDecl(x = functionExpr(function nil() `(` `)` ' +                              // 230
      '{ returnStmnt(return number(123) ;) })) ;))');                                                      // 231
                                                                                                           // 232
  tester.badParse("var x = `expression`");                                                                 // 233
  tester.badParse("1 `semicolon`1");                                                                       // 234
  tester.badParse("1+1`semicolon`:");                                                                      // 235
});                                                                                                        // 236
                                                                                                           // 237
Tinytest.add("jsparse - tokenization errors", function (test) {                                            // 238
  var tester = makeTester(test);                                                                           // 239
  tester.badToken("123`@`");                                                                               // 240
  tester.badToken("thisIsATestOf = `'unterminated `\n strings'");                                          // 241
  // make sure newlines aren't quietly included in regex literals                                          // 242
  tester.badToken("var x = `/`a\nb/;");                                                                    // 243
  tester.badToken("var x = `/`a\\\nb/;");                                                                  // 244
  tester.badToken("var x = `/`a[\n]b/;");                                                                  // 245
});                                                                                                        // 246
                                                                                                           // 247
Tinytest.add("jsparse - syntax forms", function (test) {                                                   // 248
  var tester = makeTester(test);                                                                           // 249
  var trials = [                                                                                           // 250
    // STATEMENTS                                                                                          // 251
    ['1',                                                                                                  // 252
     'program(expressionStmnt(number(1) ;()))'],                                                           // 253
    ['1;;;;2',                                                                                             // 254
     'program(expressionStmnt(number(1) ;) emptyStmnt(;) emptyStmnt(;) emptyStmnt(;) ' +                   // 255
     'expressionStmnt(number(2) ;()))'],                                                                   // 256
    ['{}',                                                                                                 // 257
     'program(blockStmnt({ }))'],                                                                          // 258
    ['{null}',                                                                                             // 259
     'program(blockStmnt({ expressionStmnt(null(null) ;()) }))'],                                          // 260
    ['{\nfoo()\nbar();\n}',                                                                                // 261
     'program(blockStmnt({ expressionStmnt(call(identifier(foo) `(` `)`) ;()) ' +                          // 262
     'expressionStmnt(call(identifier(bar) `(` `)`) ;) }))'],                                              // 263
    ['{{{}}}',                                                                                             // 264
     'program(blockStmnt({ blockStmnt({ blockStmnt({ }) }) }))'],                                          // 265
    ['var x = y, z,\n  a = b = c;',                                                                        // 266
     'program(varStmnt(var varDecl(x = identifier(y)) , varDecl(z) , varDecl(a = ' +                       // 267
     'assignment(identifier(b) = identifier(c))) ;))'],                                                    // 268
    ['if (x === y);',                                                                                      // 269
     'program(ifStmnt(if `(` binary(identifier(x) === identifier(y)) `)` emptyStmnt(;)))'],                // 270
    ['if (z) return',                                                                                      // 271
     'program(ifStmnt(if `(` identifier(z) `)` returnStmnt(return nil() ;())))'],                          // 272
    ['if (a) b; else c',                                                                                   // 273
     'program(ifStmnt(if `(` identifier(a) `)` expressionStmnt(identifier(b) ;) else ' +                   // 274
     'expressionStmnt(identifier(c) ;())))'],                                                              // 275
    ['if (n === 1) { foo(); } else if (n === 2) { bar(); } else { baz(); }',                               // 276
     'program(ifStmnt(if `(` binary(identifier(n) === number(1)) `)` blockStmnt(' +                        // 277
     '{ expressionStmnt(call(identifier(foo) `(` `)`) ;) }) else ifStmnt(' +                               // 278
     'if `(` binary(identifier(n) === number(2)) `)` blockStmnt(' +                                        // 279
     '{ expressionStmnt(call(identifier(bar) `(` `)`) ;) }) else blockStmnt(' +                            // 280
     '{ expressionStmnt(call(identifier(baz) `(` `)`) ;) }))))'],                                          // 281
    ['while (false);',                                                                                     // 282
     'program(whileStmnt(while `(` boolean(false) `)` emptyStmnt(;)))'],                                   // 283
    ['while (/foo/.test(bar.baz)) {\n  bar = bar.baz;\n}',                                                 // 284
     'program(whileStmnt(while `(` call(dot(regex(/foo/) . test) `(` ' +                                   // 285
     'dot(identifier(bar) . baz) `)`) `)` blockStmnt({ expressionStmnt(' +                                 // 286
     'assignment(identifier(bar) = dot(identifier(bar) . baz)) ;) })))'],                                  // 287
    ['while (false) while (false);',                                                                       // 288
     'program(whileStmnt(while `(` boolean(false) `)` ' +                                                  // 289
     'whileStmnt(while `(` boolean (false) `)` emptyStmnt(;))))'],                                         // 290
    ['do a; while (b);',                                                                                   // 291
     'program(doStmnt(do expressionStmnt(identifier(a) ;) while `(` identifier(b) `)` ;))'],               // 292
    ['do { x-- } while (x);',                                                                              // 293
     'program(doStmnt(do blockStmnt({ expressionStmnt(postfix(identifier(x) --) ;()) }) ' +                // 294
     'while `(` identifier(x) `)` ;))'],                                                                   // 295
    ['do a\n while (b)\n x++',                                                                             // 296
     'program(doStmnt(do expressionStmnt(identifier(a) ;()) while `(` identifier(b) `)` ;()) ' +           // 297
     'expressionStmnt(postfix(identifier(x) ++) ;()))'],                                                   // 298
    ["for(;;);",                                                                                           // 299
     "program(forStmnt(for `(` forSpec(nil() ; nil() ; nil()) `)` emptyStmnt(;)))"],                       // 300
    ["for(x in y);",                                                                                       // 301
     "program(forStmnt(for `(` forInSpec(identifier(x) in identifier(y)) `)` emptyStmnt(;)))"],            // 302
    ["for(var x in y);",                                                                                   // 303
     "program(forStmnt(for `(` forVarInSpec(var varDecl(x) in identifier(y)) `)` emptyStmnt(;)))"],        // 304
    ["for(var x;;);",                                                                                      // 305
     "program(forStmnt(for `(` forVarSpec(var varDecl(x) ; nil() ; nil()) `)` emptyStmnt(;)))"],           // 306
    ["for(var i=0;i<N;i++) {}",                                                                            // 307
     "program(forStmnt(for `(` forVarSpec(var varDecl(i = number(0)) ; " +                                 // 308
     "binary(identifier(i) < identifier(N)) ; postfix(identifier(i) ++)) `)` blockStmnt({ })))"],          // 309
    ["for (var x=3 in y);",                                                                                // 310
     "program(forStmnt(for `(` forVarInSpec(var varDecl(x = number(3)) in identifier(y)) `)` " +           // 311
     "emptyStmnt(;)))"],                                                                                   // 312
    ["for (x.foo in y);",                                                                                  // 313
     "program(forStmnt(for `(` forInSpec(dot(identifier(x) . foo) in identifier(y)) `)` emptyStmnt(;)))"], // 314
    ["return",                                                                                             // 315
     "program(returnStmnt(return nil() ;()))"],                                                            // 316
    ["return;",                                                                                            // 317
     "program(returnStmnt(return nil() ;))"],                                                              // 318
    ["return null",                                                                                        // 319
     "program(returnStmnt(return null(null) ;()))"],                                                       // 320
    ["return null;",                                                                                       // 321
     "program(returnStmnt(return null(null) ;))"],                                                         // 322
    ["return\n1+1",                                                                                        // 323
     "program(returnStmnt(return nil() ;()) expressionStmnt(binary(number(1) + number(1)) ;()))"],         // 324
    ["return 1\n  +1",                                                                                     // 325
     "program(returnStmnt(return binary(number(1) + number(1)) ;()))"],                                    // 326
    ["continue",                                                                                           // 327
     "program(continueStmnt(continue nil() ;()))"],                                                        // 328
    ["continue foo",                                                                                       // 329
     "program(continueStmnt(continue foo ;()))"],                                                          // 330
    ["continue foo;",                                                                                      // 331
     "program(continueStmnt(continue foo ;))"],                                                            // 332
    ["continue\n  foo;",                                                                                   // 333
     "program(continueStmnt(continue nil() ;()) expressionStmnt(identifier(foo) ;))"],                     // 334
    ["break",                                                                                              // 335
     "program(breakStmnt(break nil() ;()))"],                                                              // 336
    ["break foo",                                                                                          // 337
     "program(breakStmnt(break foo ;()))"],                                                                // 338
    ["break foo;",                                                                                         // 339
     "program(breakStmnt(break foo ;))"],                                                                  // 340
    ["break\n  foo;",                                                                                      // 341
     "program(breakStmnt(break nil() ;()) expressionStmnt(identifier(foo) ;))"],                           // 342
    ["throw e;",                                                                                           // 343
     "program(throwStmnt(throw identifier(e) ;))"],                                                        // 344
    ["throw e",                                                                                            // 345
     "program(throwStmnt(throw identifier(e) ;()))"],                                                      // 346
    ["throw new Error;",                                                                                   // 347
     "program(throwStmnt(throw new(new identifier(Error)) ;))"],                                           // 348
    ["with(x);",                                                                                           // 349
     "program(withStmnt(with `(` identifier(x) `)` emptyStmnt(;)))"],                                      // 350
    ["with(a=b) {}",                                                                                       // 351
     "program(withStmnt(with `(` assignment(identifier(a) = identifier(b)) `)` blockStmnt({ })))"],        // 352
    ["switch(x) {}",                                                                                       // 353
     "program(switchStmnt(switch `(` identifier(x) `)` { }))"],                                            // 354
    ["switch(x) {case 1:case 2:case 3:default:case 4:}",                                                   // 355
     "program(switchStmnt(switch `(` identifier(x) `)` { " +                                               // 356
     "case(case number(1) :) case(case number(2) :) case(case number(3) :) " +                             // 357
     "default(default :) case(case number(4) :) }))"],                                                     // 358
    ["switch(x) {\ncase 1:\n  return\ncase 2:\ncase 3:\n  throw e}",                                       // 359
     "program(switchStmnt(switch `(` identifier(x) `)` { " +                                               // 360
     "case(case number(1) : returnStmnt(return nil() ;())) " +                                             // 361
     "case(case number(2) :) case(case number(3) : " +                                                     // 362
     "throwStmnt(throw identifier(e) ;())) }))"],                                                          // 363
    ["switch(x) {default:;}",                                                                              // 364
     "program(switchStmnt(switch `(` identifier(x) `)` { default(default : emptyStmnt(;)) }))"],           // 365
    ["try {} catch (e) {} finally {}",                                                                     // 366
     "program(tryStmnt(try blockStmnt({ }) catch(catch `(` e `)` blockStmnt({ })) " +                      // 367
     "finally(finally blockStmnt({ }))))"],                                                                // 368
    ["try {} finally {}",                                                                                  // 369
     "program(tryStmnt(try blockStmnt({ }) nil() finally(finally blockStmnt({ }))))"],                     // 370
    ["try {} catch (e) {}",                                                                                // 371
     "program(tryStmnt(try blockStmnt({ }) catch(catch `(` e `)` blockStmnt({ })) nil()))"],               // 372
    ["a:;",                                                                                                // 373
     "program(labelStmnt(a : emptyStmnt(;)))"],                                                            // 374
    ["{x:1}",                                                                                              // 375
     "program(blockStmnt({ labelStmnt(x : expressionStmnt(number(1) ;())) }))"],                           // 376
    ["{x:y:z:1}",                                                                                          // 377
     "program(blockStmnt({ labelStmnt(x : labelStmnt(y : " +                                               // 378
     "labelStmnt(z : expressionStmnt(number(1) ;())))) }))"],                                              // 379
    [";;foo:\nfor(;;);",                                                                                   // 380
     "program(emptyStmnt(;) emptyStmnt(;) labelStmnt(foo : " +                                             // 381
     "forStmnt(for `(` forSpec(nil() ; nil() ; nil()) `)` emptyStmnt(;))))"],                              // 382
    ["debugger",                                                                                           // 383
     "program(debuggerStmnt(debugger ;()))"],                                                              // 384
    ["debugger;",                                                                                          // 385
     "program(debuggerStmnt(debugger ;))"],                                                                // 386
    ["function foo() {}",                                                                                  // 387
     "program(functionDecl(function foo `(` `)` { }))"],                                                   // 388
    ["function foo() {function bar() {}}",                                                                 // 389
     "program(functionDecl(function foo `(` `)` { functionDecl(function bar `(` `)` { }) }))"],            // 390
    [";;function f() {};;",                                                                                // 391
     "program(emptyStmnt(;) emptyStmnt(;) functionDecl(function f `(` `)` { }) " +                         // 392
     "emptyStmnt(;) emptyStmnt(;))"],                                                                      // 393
    ["function foo(a,b,c) {}",                                                                             // 394
     "program(functionDecl(function foo `(` a , b , c `)` { }))"],                                         // 395
                                                                                                           // 396
    // EXPRESSIONS                                                                                         // 397
    ["null + this - 3 + true",                                                                             // 398
     "program(expressionStmnt(binary(binary(binary(null(null) + this(this)) - " +                          // 399
     "number(3)) + boolean(true)) ;()))"],                                                                 // 400
    ["+.5",                                                                                                // 401
     "program(expressionStmnt(unary(+ number(.5)) ;()))"],                                                 // 402
    ["a1a1a",                                                                                              // 403
     "program(expressionStmnt(identifier(a1a1a) ;()))"],                                                   // 404
    ["/abc/mig",                                                                                           // 405
     "program(expressionStmnt(regex(/abc/mig) ;()))"],                                                     // 406
    ["/[]/",                                                                                               // 407
     "program(expressionStmnt(regex(/[]/) ;()))"],                                                         // 408
    ["/[/]/",                                                                                              // 409
     "program(expressionStmnt(regex(/[/]/) ;()))"],                                                        // 410
    ["/[[/]/",                                                                                             // 411
     "program(expressionStmnt(regex(/[[/]/) ;()))"],                                                       // 412
    ["/.\\/[a//b]\\[\\][[\\d/]/",                                                                          // 413
     "program(expressionStmnt(regex(/.\\/[a//b]\\[\\][[\\d/]/) ;()))"],                                    // 414
    ["a / /b/mgi / c",                                                                                     // 415
     "program(expressionStmnt(binary(binary(identifier(a) / " +                                            // 416
     "regex(/b/mgi)) / identifier(c)) ;()))"],                                                             // 417
    ["'a' + \"\" + \"b\" + '\\''",                                                                         // 418
     "program(expressionStmnt(binary(binary(binary(string('a') + string(\"\")) + " +                       // 419
     "string(\"b\")) + string('\\'')) ;()))"],                                                             // 420
    ["_ + x0123 + $",                                                                                      // 421
     "program(expressionStmnt(binary(binary(identifier(_) + " +                                            // 422
     "identifier(x0123)) + identifier($)) ;()))"],                                                         // 423
    ["if ((x = 1)) return ((1+2))*((1<<2));",                                                              // 424
     "program(ifStmnt(if `(` parens(`(` assignment(identifier(x) = number(1)) `)`) " +                     // 425
     "`)` returnStmnt(return binary(parens(`(` parens(`(` binary(number(1) + " +                           // 426
     "number(2)) `)`) `)`) * parens(`(` parens(`(` binary(number(1) << number(2)) " +                      // 427
     "`)`) `)`)) ;)))"],                                                                                   // 428
    ["[];",                                                                                                // 429
     "program(expressionStmnt(array([ ]) ;))"],                                                            // 430
    ["[,,,];",                                                                                             // 431
     "program(expressionStmnt(array([ , , , ]) ;))"],                                                      // 432
    ["[(1,2),,3];",                                                                                        // 433
     "program(expressionStmnt(array([ parens(`(` comma(number(1) , " +                                     // 434
     "number(2)) `)`) , , number(3) ]) ;))"],                                                              // 435
    ["({});",                                                                                              // 436
     "program(expressionStmnt(parens(`(` object({ }) `)`) ;))"],                                           // 437
    ["({1:1});",                                                                                           // 438
     "program(expressionStmnt(parens(`(` object({ prop(numPropName(1) : number(1)) }) `)`) ;))"],          // 439
    ["({x:true});",                                                                                        // 440
     "program(expressionStmnt(parens(`(` object({ prop(idPropName(x) : boolean(true)) }) `)`) ;))"],       // 441
    ["({'a':b, c:'d', 1:null});",                                                                          // 442
     "program(expressionStmnt(parens(`(` object({ prop(strPropName('a') : " +                              // 443
     "identifier(b)) , prop(idPropName(c) : string('d')) , prop(numPropName(1) " +                         // 444
     ": null(null)) }) `)`) ;))"],                                                                         // 445
    ["(function () {});",                                                                                  // 446
     "program(expressionStmnt(parens(`(` functionExpr(function nil() `(` `)` { }) `)`) ;))"],              // 447
    ["(function foo() {});",                                                                               // 448
     "program(expressionStmnt(parens(`(` functionExpr(function foo `(` `)` { }) `)`) ;))"],                // 449
    ["x = function () {}.y;",                                                                              // 450
     "program(expressionStmnt(assignment(identifier(x) = dot(functionExpr(" +                              // 451
     "function nil() `(` `)` { }) . y)) ;))"],                                                             // 452
    ["(function (a) {})",                                                                                  // 453
     "program(expressionStmnt(parens(`(` functionExpr(function nil() " +                                   // 454
     "`(` a `)` { }) `)`) ;()))"],                                                                         // 455
    ["(function (a,b,c) {})",                                                                              // 456
     "program(expressionStmnt(parens(`(` functionExpr(function nil() `(` " +                               // 457
     "a , b , c `)` { }) `)`) ;()))"],                                                                     // 458
    ["foo.bar.baz;",                                                                                       // 459
     "program(expressionStmnt(dot(dot(identifier(foo) . bar) . baz) ;))"],                                 // 460
    ["foo[bar,bar][baz].qux[1+1];",                                                                        // 461
     "program(expressionStmnt(bracket(dot(bracket(bracket(identifier(foo) " +                              // 462
     "[ comma(identifier(bar) , identifier(bar)) ]) [ identifier(baz) ]) . qux) " +                        // 463
     "[ binary(number(1) + number(1)) ]) ;))"],                                                            // 464
    ["new new a.b.c[d]",                                                                                   // 465
     "program(expressionStmnt(new(new new(new bracket(dot(dot(identifier(a) " +                            // 466
     ". b) . c) [ identifier(d) ]))) ;()))"],                                                              // 467
    ["new new a.b.c[d]()",                                                                                 // 468
     "program(expressionStmnt(new(new newcall(new " +                                                      // 469
     "bracket(dot(dot(identifier(a) . b) . c) [ identifier(d) ]) `(` `)`)) ;()))"],                        // 470
    ["new new a.b.c[d]()()",                                                                               // 471
     "program(expressionStmnt(newcall(new newcall(new " +                                                  // 472
     "bracket(dot(dot(identifier(a) . b) . c) [ identifier(d) ]) `(` `)`) `(` `)`) ;()))"],                // 473
    ["new foo(x).bar(y)",                                                                                  // 474
     "program(expressionStmnt(call(dot(newcall(new identifier(foo) `(` " +                                 // 475
     "identifier(x) `)`) . bar) `(` identifier(y) `)`) ;()))"],                                            // 476
    ["new new foo().bar",                                                                                  // 477
     "program(expressionStmnt(new(new dot(newcall(new identifier(foo) `(` `)`) . bar)) ;()))"],            // 478
    ["delete void typeof - + ~ ! -- ++ x;",                                                                // 479
     "program(expressionStmnt(unary(delete unary(void unary(typeof unary(- unary(+ " +                     // 480
     "unary(~ unary(! unary(-- unary(++ identifier(x)))))))))) ;))"],                                      // 481
    ["x++ + ++y",                                                                                          // 482
     "program(expressionStmnt(binary(postfix(identifier(x) ++) + " +                                       // 483
     "unary(++ identifier(y))) ;()))"],                                                                    // 484
    ["1*2+3*4",                                                                                            // 485
     "program(expressionStmnt(binary(binary(number(1) * number(2)) " +                                     // 486
     "+ binary(number(3) * number(4))) ;()))"],                                                            // 487
    ["a*b/c%d+e-f<<g>>h>>>i<j>k<=l>=m instanceof n in o==p!=q===r!==s&t^u|v&&w||x",                        // 488
     "program(expressionStmnt(binary(binary(binary(binary(binary(binary(binary(" +                         // 489
     "binary(binary(binary(binary(binary(binary(binary(binary(binary(binary(binary(" +                     // 490
     "binary(binary(binary(binary(binary(identifier(a) * identifier(b)) / " +                              // 491
     "identifier(c)) % identifier(d)) + identifier(e)) - identifier(f)) << identifier(g)) " +              // 492
     ">> identifier(h)) >>> identifier(i)) < identifier(j)) > identifier(k)) <= " +                        // 493
     "identifier(l)) >= identifier(m)) instanceof identifier(n)) in identifier(o)) == " +                  // 494
     "identifier(p)) != identifier(q)) === identifier(r)) !== identifier(s)) & " +                         // 495
     "identifier(t)) ^ identifier(u)) | identifier(v)) && identifier(w)) || " +                            // 496
     "identifier(x)) ;()))"],                                                                              // 497
    ["a||b&&c|d^e&f!==g===h!=i==j in k instanceof l>=m<=n<o<p>>>q>>r<<s-t+u%v/w*x",                        // 498
     "program(expressionStmnt(binary(identifier(a) || binary(identifier(b) && " +                          // 499
     "binary(identifier(c) | binary(identifier(d) ^ binary(identifier(e) & " +                             // 500
     "binary(binary(binary(binary(identifier(f) !== identifier(g)) === identifier(h)) " +                  // 501
     "!= identifier(i)) == binary(binary(binary(binary(binary(binary(identifier(j) in " +                  // 502
     "identifier(k)) instanceof identifier(l)) >= identifier(m)) <= identifier(n)) < " +                   // 503
     "identifier(o)) < binary(binary(binary(identifier(p) >>> identifier(q)) >> " +                        // 504
     "identifier(r)) << binary(binary(identifier(s) - identifier(t)) + " +                                 // 505
     "binary(binary(binary(identifier(u) % identifier(v)) / identifier(w)) * " +                           // 506
     "identifier(x))))))))))) ;()))"],                                                                     // 507
    ["a?b:c",                                                                                              // 508
     "program(expressionStmnt(ternary(identifier(a) ? identifier(b) : " +                                  // 509
     "identifier(c)) ;()))"],                                                                              // 510
    ["1==2?3=4:5=6",                                                                                       // 511
     "program(expressionStmnt(ternary(binary(number(1) == number(2)) ? " +                                 // 512
     "assignment(number(3) = number(4)) : assignment(number(5) = number(6))) ;()))"],                      // 513
    ["a=b,c=d",                                                                                            // 514
     "program(expressionStmnt(comma(assignment(identifier(a) = identifier(b)) , " +                        // 515
     "assignment(identifier(c) = identifier(d))) ;()))"],                                                  // 516
    ["a=b=c=d",                                                                                            // 517
     "program(expressionStmnt(assignment(identifier(a) = assignment(identifier(b) " +                      // 518
     "= assignment(identifier(c) = identifier(d)))) ;()))"],                                               // 519
    ["x[0]=x[1]=true",                                                                                     // 520
     "program(expressionStmnt(assignment(bracket(identifier(x) [ number(0) ]) = " +                        // 521
     "assignment(bracket(identifier(x) [ number(1) ]) = boolean(true))) ;()))"],                           // 522
    ["a*=b/=c%=d+=e-=f<<=g>>=h>>>=i&=j^=k|=l",                                                             // 523
     "program(expressionStmnt(assignment(identifier(a) *= assignment(identifier(b) " +                     // 524
     "/= assignment(identifier(c) %= assignment(identifier(d) += " +                                       // 525
     "assignment(identifier(e) -= assignment(identifier(f) <<= " +                                         // 526
     "assignment(identifier(g) >>= assignment(identifier(h) >>>= " +                                       // 527
     "assignment(identifier(i) &= assignment(identifier(j) ^= " +                                          // 528
     "assignment(identifier(k) |= identifier(l)))))))))))) ;()))"],                                        // 529
    ["1;\n\n\n\n/* foo */\n// bar\n", // trailing whitespace and comments                                  // 530
     "program(expressionStmnt(number(1) ;) comment(`/* foo */`) comment(`// bar`))"],                      // 531
    // includeComments option; comments in AST                                                             // 532
    ["//foo",                                                                                              // 533
     "program(comment(//foo))"],                                                                           // 534
    ["//foo\n",                                                                                            // 535
     "program(comment(//foo))"],                                                                           // 536
    ["/*foo*/",                                                                                            // 537
     "program(comment(/*foo*/))"],                                                                         // 538
    ["/*foo*/\n",                                                                                          // 539
     "program(comment(/*foo*/))"],                                                                         // 540
    [";\n//foo",                                                                                           // 541
     "program(emptyStmnt(;) comment(//foo))"],                                                             // 542
    [";\n/*foo*/",                                                                                         // 543
     "program(emptyStmnt(;) comment(/*foo*/))"],                                                           // 544
    [";\n//foo\n;",                                                                                        // 545
     "program(emptyStmnt(;) comment(//foo) emptyStmnt(;))"],                                               // 546
    [";\n/*foo*/\n;",                                                                                      // 547
     "program(emptyStmnt(;) comment(/*foo*/) emptyStmnt(;))"],                                             // 548
    [";\n//foo\n//bar\n;",                                                                                 // 549
     "program(emptyStmnt(;) comment(//foo) comment(//bar) emptyStmnt(;))"],                                // 550
    [";\n/*foo*/ /*bar*/\n;",                                                                              // 551
     "program(emptyStmnt(;) comment(/*foo*/) comment(/*bar*/) emptyStmnt(;))"],                            // 552
    [";//foo\n//bar\n;",                                                                                   // 553
     "program(emptyStmnt(;) comment(//bar) emptyStmnt(;))"],                                               // 554
    [";/*foo*/\n/*bar*/\n;",                                                                               // 555
     "program(emptyStmnt(;) comment(/*bar*/) emptyStmnt(;))"],                                             // 556
    [";/*foo*//*bar*///baz\n;",                                                                            // 557
     "program(emptyStmnt(;) emptyStmnt(;))"],                                                              // 558
    [";/*foo*//*bar*///baz",                                                                               // 559
     "program(emptyStmnt(;))"],                                                                            // 560
    ["/*foo*//*bar*///baz",                                                                                // 561
     "program(comment(/*foo*/) comment(/*bar*/) comment(//baz))"],                                         // 562
    ["//foo\n//bar\nfunction aaa() {}\nfunction bbb() {}",                                                 // 563
     "program(comment(//foo) comment(//bar) functionDecl(function aaa `(` `)` { }) " +                     // 564
     "functionDecl(function bbb `(` `)` { }))"],                                                           // 565
    // comments don't interfere with parse                                                                 // 566
    ["if (true)\n//comment\nfoo();",                                                                       // 567
     "program(ifStmnt(if `(` boolean(true) `)` " +                                                         // 568
     "expressionStmnt(call(identifier(foo) `(` `)`) ;)))"],                                                // 569
    // bare keywords allowed in property access and object literal                                         // 570
    ["foo.return();",                                                                                      // 571
     "program(expressionStmnt(call(dot(identifier(foo) . return) `(` `)`) ;))"],                           // 572
    ["foo.true();",                                                                                        // 573
     "program(expressionStmnt(call(dot(identifier(foo) . true) `(` `)`) ;))"],                             // 574
    ["foo.null();",                                                                                        // 575
     "program(expressionStmnt(call(dot(identifier(foo) . null) `(` `)`) ;))"],                             // 576
    ["({true:3})",                                                                                         // 577
     "program(expressionStmnt(parens(`(` object({ prop(idPropName(true) : number(3)) }) `)`) ;()))"],      // 578
    ["({null:3})",                                                                                         // 579
     "program(expressionStmnt(parens(`(` object({ prop(idPropName(null) : number(3)) }) `)`) ;()))"],      // 580
    ["({if:3})",                                                                                           // 581
     "program(expressionStmnt(parens(`(` object({ prop(idPropName(if) : number(3)) }) `)`) ;()))"],        // 582
    // ES5 line continuations in string literals                                                           // 583
    ["var x = 'a\\\nb\\\nc';",                                                                             // 584
     "program(varStmnt(var varDecl(x = string(`'a\\\nb\\\nc'`)) ;))"],                                     // 585
    // ES5 trailing comma in object literal                                                                // 586
    ["({});",                                                                                              // 587
     "program(expressionStmnt(parens(`(` object({ }) `)`) ;))"],                                           // 588
    ["({x:1});",                                                                                           // 589
     "program(expressionStmnt(parens(`(` object({ prop(idPropName(x) : number(1)) }) `)`) ;))"],           // 590
    ["({x:1,});",                                                                                          // 591
     "program(expressionStmnt(parens(`(` object({ prop(idPropName(x) : number(1)) , }) `)`) ;))"],         // 592
    ["({x:1,y:2});",                                                                                       // 593
     "program(expressionStmnt(parens(`(` object({ prop(idPropName(x) : number(1)) , " +                    // 594
     "prop(idPropName(y) : number(2)) }) `)`) ;))"],                                                       // 595
    ["({x:1,y:2,});",                                                                                      // 596
     "program(expressionStmnt(parens(`(` object({ prop(idPropName(x) : number(1)) , " +                    // 597
     "prop(idPropName(y) : number(2)) , }) `)`) ;))"]                                                      // 598
  ];                                                                                                       // 599
  _.each(trials, function (tr) {                                                                           // 600
    tester.goodParse(tr[0], tr[1]);                                                                        // 601
  });                                                                                                      // 602
});                                                                                                        // 603
                                                                                                           // 604
Tinytest.add("jsparse - bad parses", function (test) {                                                     // 605
  var tester = makeTester(test);                                                                           // 606
  // string between backticks is pulled out and becomes what's "expected"                                  // 607
  // at that location, according to the correct error message                                              // 608
  var trials = [                                                                                           // 609
    '{`statement`',                                                                                        // 610
    'if (`expression`)',                                                                                   // 611
    'if `(`else',                                                                                          // 612
    'var`varDecl`;',                                                                                       // 613
    'while (`expression`);',                                                                               // 614
    'while`(`;',                                                                                           // 615
    'do a `semicolon`while b;',                                                                            // 616
    'do a\n while `(`b;',                                                                                  // 617
    '1 `semicolon`2',                                                                                      // 618
    'for (`forSpec`);',                                                                                    // 619
    'for (1\n`semicolon`2\n3);',                                                                           // 620
    'continue `semicolon`1+1;',                                                                            // 621
    'break `semicolon`1+1;',                                                                               // 622
    'throw`expression`',                                                                                   // 623
    'throw`expression`;',                                                                                  // 624
    'throw\n`expression`',                                                                                 // 625
    'throw\n`expression``end of line`e',                                                                   // 626
    'throw `expression`=;',                                                                                // 627
    'with(`expression`);',                                                                                 // 628
    'switch(`expression`)',                                                                                // 629
    'switch(x)`{`;',                                                                                       // 630
    'try`block`',                                                                                          // 631
    'try {}`catch`',                                                                                       // 632
    'try {} catch`(`;',                                                                                    // 633
    'try {} catch(e)`block`;',                                                                             // 634
    '1+1`semicolon`:',                                                                                     // 635
    '{a:`statement`}',                                                                                     // 636
    'function `IDENTIFIER`() {}',                                                                          // 637
    'foo: `statement`function foo() {}',                                                                   // 638
    '[`expression`=',                                                                                      // 639
    '[,,`expression`=',                                                                                    // 640
    '({`propertyName`|:3})',                                                                               // 641
    '({1:2,3`:`})',                                                                                        // 642
    '({1:2,`propertyName`',                                                                                // 643
    'x.`IDENTIFIER`,',                                                                                     // 644
    'foo;`semicolon`:;',                                                                                   // 645
    '1;`statement`=',                                                                                      // 646
    'a+b`semicolon`=c;',                                                                                   // 647
    'for(1+1 `semicolon`in {});',                                                                          // 648
    '`statement`=',                                                                                        // 649
    'for(;`expression`var;) {}',                                                                           // 650
    '({`propertyName`',                                                                                    // 651
    '({`propertyName`,})',                                                                                 // 652
    '({`propertyName`:})',                                                                                 // 653
    '({x`:`})',                                                                                            // 654
    '({x:1,`propertyName`',                                                                                // 655
    '({x:1,`propertyName`,})',                                                                             // 656
    '({x:1`,`',                                                                                            // 657
    '({x:1,`propertyName`,y:2})',                                                                          // 658
    '({x:1,`propertyName`,})',                                                                             // 659
    '({x:1,y:2`,`:',                                                                                       // 660
    '({x:1,y:2,`propertyName`',                                                                            // 661
    '({x:1,y:2,`propertyName`:',                                                                           // 662
    '({x:1,y:2,`propertyName`,})'                                                                          // 663
  ];                                                                                                       // 664
  _.each(trials, function (tr) {                                                                           // 665
    tester.badParse(tr);                                                                                   // 666
  });                                                                                                      // 667
});                                                                                                        // 668
                                                                                                           // 669
Tinytest.add("jsparse - regex division ambiguity", function (test) {                                       // 670
  var tester = makeTester(test);                                                                           // 671
  tester.goodParse("if (e) /f/g;",                                                                         // 672
                   "program(ifStmnt(if `(` identifier(e) `)` expressionStmnt(regex(/f/g) ;)))",            // 673
                   {4: true});                                                                             // 674
  tester.goodParse("++/x/.y;",                                                                             // 675
                   "program(expressionStmnt(unary(++ dot(regex(/x/) . y)) ;))",                            // 676
                   {1: true});                                                                             // 677
  tester.goodParse("x++/2/g;",                                                                             // 678
                   "program(expressionStmnt(binary(binary(postfix(identifier(x) ++) / " +                  // 679
                   "number(2)) / identifier(g)) ;))");                                                     // 680
  tester.goodParse("(1+1)/2/g;",                                                                           // 681
                   "program(expressionStmnt(binary(binary(parens(`(` binary(number(1) + " +                // 682
                   "number(1)) `)`) / " +                                                                  // 683
                   "number(2)) / identifier(g)) ;))");                                                     // 684
  tester.goodParse("/x/",                                                                                  // 685
                   "program(expressionStmnt(regex(/x/) ;()))");                                            // 686
});                                                                                                        // 687
                                                                                                           // 688
Tinytest.add("jsparse - semicolon insertion", function (test) {                                            // 689
  var tester = makeTester(test);                                                                           // 690
  // Spec section 7.9.2                                                                                    // 691
  tester.badParse("{ 1 `semicolon`2 } 3");                                                                 // 692
  tester.goodParse("{ 1\n2 } 3", "program(blockStmnt({ expressionStmnt(number(1) " +                       // 693
                   ";()) expressionStmnt(number(2) ;()) }) expressionStmnt(number(3) ;()))");              // 694
  tester.badParse("for (a; b\n`semicolon`)");                                                              // 695
  tester.goodParse("return\na + b",                                                                        // 696
                   "program(returnStmnt(return nil() ;()) " +                                              // 697
                   "expressionStmnt(binary(identifier(a) + identifier(b)) ;()))");                         // 698
  tester.goodParse("a = b\n++c",                                                                           // 699
                   "program(expressionStmnt(assignment(identifier(a) = identifier(b)) ;())" +              // 700
                   "expressionStmnt(unary(++ identifier(c)) ;()))");                                       // 701
  tester.badParse("if (a > b)\n`statement`else c = d");                                                    // 702
  tester.goodParse("a = b + c\n(d + e).print()",                                                           // 703
                   "program(expressionStmnt(assignment(identifier(a) = " +                                 // 704
                   "binary(identifier(b) + call(dot(call(identifier(c) `(` " +                             // 705
                   "binary(identifier(d) + identifier(e)) `)`) . print) `(` `)`))) ;()))");                // 706
});                                                                                                        // 707
                                                                                                           // 708
Tinytest.add("jsparse - comments", function (test) {                                                       // 709
  var tester = makeTester(test);                                                                           // 710
  // newline in multi-line comment makes it into a line break for semicolon                                // 711
  // insertion purposes                                                                                    // 712
  tester.badParse("1/**/`semicolon`2");                                                                    // 713
  tester.goodParse("1/*\n*/2",                                                                             // 714
                   "program(expressionStmnt(number(1) ;()) expressionStmnt(number(2) ;()))");              // 715
});                                                                                                        // 716
                                                                                                           // 717
Tinytest.add("jsparse - initial lex error", function (test) {                                              // 718
  var doTest = function (code) {                                                                           // 719
    // this shouldn't throw                                                                                // 720
    var parser = new JSParser(code, parserTestOptions);                                                    // 721
    // this should throw                                                                                   // 722
    try {                                                                                                  // 723
      parser.getSyntaxTree();                                                                              // 724
      test.fail();                                                                                         // 725
    } catch (e) {                                                                                          // 726
      test.isTrue(/^Bad token/.test(e.message), e.message);                                                // 727
    }                                                                                                      // 728
  };                                                                                                       // 729
                                                                                                           // 730
  doTest('/');                                                                                             // 731
  doTest('@');                                                                                             // 732
});                                                                                                        // 733
                                                                                                           // 734
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
