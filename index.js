require('dotenv').config()
var async = require('async');
var request = require("request");
var jsonexport = require('jsonexport');

var finalResults = [];
var _userToken;
var droneUpDev_userToken;
var droneUpBe_userToken;
var droneUpTest_userToken;

var _application_id = process.env._application_id;
var _secret_key = process.env._secret_key;
var _application_type=process.env._application_type;
var _login= process.env._login;
var _password= process.env._password;
var _appName=process.env._appName;

var _droneUp_sec = process.env._droneUp_be_secretKey
function TableInfo(app,table) {
    this.appId = app.appId;
    this.appName = app.appName;
    this.currentVersionId = app.currentVersionId;
    this.table_id = table.id;
    this.table_name = table.name;
    this.table_require = null;
    this.table_type = null;
    this.table_defaultValue = null;
    this.table_relatedTable = null;
    this.table_customRegex = null;
    this.table_autoLoad = null;
}

// Admin variables
var _auth_key;
var _versions=[];
function loginDroneUpBeUser(callback){
    var options = { method: 'POST',
        url: 'https://api.backendless.com/dev/users/login',
        headers:
            {   'cache-control': 'no-cache',
                'application-type': _application_type,
                'secret-key': _droneUp_be_secretKey,
                'application-id': _application_id,
                'content-type': 'application/json' },
        body:
            { login: _login,
                password: _password },
        json: true };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        droneUpBe_userToken = body['user-token'];
        console.log('User logged in and user-token obtained')
        callback(null);
    });
}
function loginDroneUpDevUser(callback){
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
function loginDroneUpTestUser(callback){
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

function fillCsvWithTables(appInfo,tableArray,callback) {
    var results = [];
    for(var x=0; x< tableArray.tables.length;x++){
        var newItem = new TableInfo(appInfo,tableArray.tables[x]);
        results.push(newItem);
        if (x == tableArray.tables.length -1) {
            callback(null,results);
        }
    }
}

function fillCsvTables(tableInfo,callback) {
    var results = [];
    for(var x=0; x< tableInfo.length; x++){

        var options = { method: 'GET',
            url: 'https://api.backendless.com/dev/data/' + tableInfo[x].table_name + '/properties',
            headers:
                {   'application-type': _application_type,
                    'secret-key': _secret_key,
                    'application-id': tableInfo[x].appId,
                    'content-type': 'application/json',
                    'user-token': _userToken } };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            results.push(body);
        });

        if (x == tableInfo.length -1) {
            callback(null,results)
        }
    }
}

loginUser(function(err){
  if (!err) {
    loginDeveloper(function(err){
        getCurrentVersionId(_appName,function(err) {
            for (var i = 0; i < _versions.length; i++) {
                var version = _versions[i];
                getAllTables(_versions[i], function (err, results) {
                    fillCsvWithTables(version,results,function(err,tableInfo){
                        fillCsvTables(tableInfo,function(err,results){
                            if(!err){
                                console.log(results);
                            }
                        })
                    })
                })
            }
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

function getAllTables(app,callback){
    var options = { method: 'GET',
        url: 'https://develop.backendless.com/3.x/console/appversion/' + app.currentVersionId +'/export',
        headers:
            {   'application-type': 'REST',
                'secret-key': _secret_key,
                'application-id': app.appId,
                'content-ty': 'application/json',
                'auth-key': _auth_key } };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        //console.log('ALL TABLES FOR ', app.appName);
        callback(null,JSON.parse(body));
    });

}