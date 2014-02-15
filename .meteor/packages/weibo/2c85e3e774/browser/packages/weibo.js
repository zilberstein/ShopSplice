(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                              //
// packages/weibo/template.weibo_configure.js                                                   //
//                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                //
Template.__define__("configureLoginServiceDialogForWeibo",Package.handlebars.Handlebars.json_ast_to_func(["<p>\n    First, you'll need to register your app on Weibo. Follow these steps:\n  </p>\n  <ol>\n    <li>\n      Visit <a href=\"http://open.weibo.com/development\" target=\"_blank\">http://open.weibo.com/development</a> (Google Chrome's automatic translation works well here)\n    </li>\n    <li>\n      Click the green \"创建应用\" button\n    </li>\n    <li>\n      Select 网页应用在第三方网页内访问使用 (Web Applications)\n    </li>\n    <li>\n      Complete the registration process\n    </li>\n    <li>\n      Open 应用信息 (Application) -> 高级信息 (Senior Information)\n    </li>\n    <li>\n      Set OAuth2.0 授权回调页 (authorized callback page) to: <span class=\"url\">",["{",[[0,"siteUrl"]]],"_oauth/weibo?close</span>\n    </li>\n  </ol>"]));
                                                                                                // 2
//////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                              //
// packages/weibo/weibo_configure.js                                                            //
//                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                //
Template.configureLoginServiceDialogForWeibo.siteUrl = function () {                            // 1
  // Weibo doesn't recognize localhost as a domain                                              // 2
  return Meteor.absoluteUrl({replaceLocalhost: true});                                          // 3
};                                                                                              // 4
                                                                                                // 5
Template.configureLoginServiceDialogForWeibo.fields = function () {                             // 6
  return [                                                                                      // 7
    {property: 'clientId', label: 'App Key'},                                                   // 8
    {property: 'secret', label: 'App Secret'}                                                   // 9
  ];                                                                                            // 10
};                                                                                              // 11
//////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                              //
// packages/weibo/weibo_client.js                                                               //
//                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                //
Weibo = {};                                                                                     // 1
                                                                                                // 2
// Request Weibo credentials for the user                                                       // 3
// @param options {optional}                                                                    // 4
// @param credentialRequestCompleteCallback {Function} Callback function to call on             // 5
//   completion. Takes one argument, credentialToken on success, or Error on                    // 6
//   error.                                                                                     // 7
Weibo.requestCredential = function (options, credentialRequestCompleteCallback) {               // 8
  // support both (options, callback) and (callback).                                           // 9
  if (!credentialRequestCompleteCallback && typeof options === 'function') {                    // 10
    credentialRequestCompleteCallback = options;                                                // 11
    options = {};                                                                               // 12
  }                                                                                             // 13
                                                                                                // 14
  var config = ServiceConfiguration.configurations.findOne({service: 'weibo'});                 // 15
  if (!config) {                                                                                // 16
    credentialRequestCompleteCallback && credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError("Service not configured"));
    return;                                                                                     // 18
  }                                                                                             // 19
                                                                                                // 20
  var credentialToken = Random.id();                                                            // 21
  // XXX need to support configuring access_type and scope                                      // 22
  var loginUrl =                                                                                // 23
        'https://api.weibo.com/oauth2/authorize' +                                              // 24
        '?response_type=code' +                                                                 // 25
        '&client_id=' + config.clientId +                                                       // 26
        '&redirect_uri=' + Meteor.absoluteUrl('_oauth/weibo?close', {replaceLocalhost: true}) + // 27
        '&state=' + credentialToken;                                                            // 28
                                                                                                // 29
  Oauth.initiateLogin(credentialToken, loginUrl, credentialRequestCompleteCallback);            // 30
};                                                                                              // 31
                                                                                                // 32
//////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
