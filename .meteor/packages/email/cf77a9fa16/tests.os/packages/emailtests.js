(function () {

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/email/email_tests.js                                                 //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
var streamBuffers = Npm.require('stream-buffers');                               // 1
                                                                                 // 2
Tinytest.add("email - dev mode smoke test", function (test) {                    // 3
  // This only tests dev mode, so don't run the test if this is deployed.        // 4
  if (process.env.MAIL_URL) return;                                              // 5
                                                                                 // 6
  try {                                                                          // 7
    var stream = new streamBuffers.WritableStreamBuffer;                         // 8
    EmailTest.overrideOutputStream(stream);                                      // 9
    Email.send({                                                                 // 10
      from: "foo@example.com",                                                   // 11
      to: "bar@example.com",                                                     // 12
      cc: ["friends@example.com", "enemies@example.com"],                        // 13
      subject: "This is the subject",                                            // 14
      text: "This is the body\nof the message\nFrom us.",                        // 15
      headers: {'X-Meteor-Test': 'a custom header'}                              // 16
    });                                                                          // 17
    // Note that we use the local "stream" here rather than Email._output_stream // 18
    // in case a concurrent test run mutates Email._output_stream too.           // 19
    // XXX brittle if mailcomposer changes header order, etc                     // 20
    test.equal(stream.getContentsAsString("utf8"),                               // 21
               "====== BEGIN MAIL #0 ======\n" +                                 // 22
               "MIME-Version: 1.0\r\n" +                                         // 23
               "X-Meteor-Test: a custom header\r\n" +                            // 24
               "From: foo@example.com\r\n" +                                     // 25
               "To: bar@example.com\r\n" +                                       // 26
               "Cc: friends@example.com, enemies@example.com\r\n" +              // 27
               "Subject: This is the subject\r\n" +                              // 28
               "Content-Type: text/plain; charset=utf-8\r\n" +                   // 29
               "Content-Transfer-Encoding: quoted-printable\r\n" +               // 30
               "\r\n" +                                                          // 31
               "This is the body\r\n" +                                          // 32
               "of the message\r\n" +                                            // 33
               "From us.\r\n" +                                                  // 34
               "====== END MAIL #0 ======\n");                                   // 35
  } finally {                                                                    // 36
    EmailTest.restoreOutputStream();                                             // 37
  }                                                                              // 38
});                                                                              // 39
                                                                                 // 40
///////////////////////////////////////////////////////////////////////////////////

}).call(this);
