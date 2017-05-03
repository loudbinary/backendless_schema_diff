var request = require("request");

var _userToken;
var _application_id = process.env._application_id;
var _secret_key = process.env._secret_key;
var _application_type=process.env._application_type;
var _login= process.env._login;
var _password= process.env._password;
var _appName=process.env._appName;


// Admin variables
var _auth_key;
var _versions=[];
function loginUser(callback){
    var options = { method: 'POST',
        url: 'https://api.backendless.com/dev/users/login',
        headers:
            {   'cache-control': 'no-cache',
                'application-type': _application_type,
                'secret-key': _secret_key,
                'application-id': _application_id,
                'content-type': 'application/json' },
        body:
            { login: _login,
                password: _password },
        json: true };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        _userToken = body['user-token'];
        console.log('User logged in and user-token obtained')
        callback(null);
    });
}
function loginDeveloper(callback) {
    var options = { method: 'POST',
        url: 'http://develop.backendless.com/console/home/login',
        headers:
            {   'application-type': 'REST',
                'secret-key': _secret_key,
                'application-id': _application_id,
                'content-type': 'application/json' },
        body:
            { login: _login,
                password: _password },
        json: true };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        _auth_key = response.headers['auth-key'];
        console.log('Obtained api login auth-key')
        callback(null);
    });

}

function getApp(value){

}

loginUser(function(err){
  if (!err) {
    loginDeveloper(function(err){
        getCurrentVersionId(_appName,function(err){
          getAllTables(_versions.filter()
              .currentVersionId, function(err){
            console.log(test);
          });
        })
    })
  }
});


function getCurrentVersionId(appName,callback){
    var options = { method: 'GET',
        url: 'https://develop.backendless.com/3.x/console/applications',
        headers:
            {
                'application-type': 'REST',
                'secret-key': _secret_key,
                'application-id': _application_id,
                'content-ty': 'application/json',
                'auth-key': _auth_key } };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        _versions = JSON.parse(body);
        callback(null);
    });

}
function getAllTables(appVersion,callback){
    var options = { method: 'GET',
        url: 'https://develop.backendless.com/3.x/console/appversion/' + appVersion +'/export',
        headers:
            {   'application-type': 'REST',
                'secret-key': _secret_key,
                'application-id': _application_id,
                'content-ty': 'application/json',
                'auth-key': _auth_key } };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        console.log(body);
        callback(null);
    });

}