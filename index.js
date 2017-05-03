require('dotenv').config()
var async = require('async');
var request = require("request");
var finalResults = [];
var _userToken;
var _application_id = process.env._application_id;
var _secret_key = process.env._secret_key;
var _application_type=process.env._application_type;
var _login= process.env._login;
var _password= process.env._password;
var _appName=process.env._appName;

function Application(app) {
    this.appId = app.appId;
    this.appName = app.appName;
    this.currentVersionId = app.currentVersionId;
    this.tables = [];
}

var json2csv = function (json, listKeys) {
    var str    = "";
    var prefix = "";
    for (var i = 0; i < listKeys.length; i++) {
        str += prefix + json[listKeys[i]];
        prefix = ",";
    }
    return str;
};

var csvData =['appId','appName','currentVersionId','table_id','table_name', 'table_related','category_id','category_name','geofence_id', 'geofence_name'];
var csvData2 =['appId','appName','currentVersionId','table_id','table_name', 'table_related','category_id','category_name','geofence_id', 'geofence_name'];
var csvData3 =['appId','appName','currentVersionId','table_id','table_name', 'table_related','category_id','category_name','geofence_id', 'geofence_name'];


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
          for (var i=0; i<_versions.length; i++){
              var newAppInfo = new Application(_versions[i]);
              getAllTables(_versions[i],function(err,results){
                  if (!err) {
                      newAppInfo.tables = results;
                      finalResults.push(newAppInfo);
                      if (i == _versions.length) {

                         async.each(finalResults,function(app,callback){
                             if (app){
                                 var csvRow1={
                                     appId: app.appId,
                                     appName: app.appName,
                                     currentVersionId: app.currentVersionId
                                 }
                                 var csvRow2 = JSON.parse(JSON.stringify(csvRow1));

                                 async.each(app.tables.tables,function(table,callback){
                                     csvRow2.table_id = table.id;
                                     csvRow2.table_name = table.name;
                                     if (table.related) {
                                         csvRow2.table_related = table.related[0]
                                     } else {
                                         csvRow2.table_related = 'NO RELATED TABLE';
                                     }
                                     csvData.push(json2csv(csvRow2, ['appId','appName','currentVersionId','table_id','table_name', 'table_related','category_id','category_name','geofence_id', 'geofence_name']));

                                 })
                                 var csvRow3 = JSON.parse(JSON.stringify(csvRow2));
                                 async.each(app.tables.categories,function(category,callback){

                                     csvRow3.category_id = category.id;
                                     csvRow3.category_name = category.name;
                                     csvData2.push(json2csv(csvRow3,['appId','appName','currentVersionId','table_id','table_name', 'table_related','category_id','category_name','geofence_id', 'geofence_name']));
                                 })

                                 async.each(app.tables.geofences,function(fence,callback){
                                     var csvRow4 = JSON.parse(JSON.stringify(csvRow3));
                                     csvRow4.geofence_id = fence.id;
                                     csvRow4.genfence_name = fence.name;
                                     csvData3.push(json2csv(csvRow4,['appId','appName','currentVersionId','table_id','table_name', 'table_related','category_id','category_name','geofence_id','geofence_name']))
                                     callback(null);
                                 })
                             }

                         },function(err){
                             if (err){
                                 return err;
                             } else {
                                 console.log(csvData3);
                             }
                         })

                      }

                  }
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
        console.log('ALL TABLES FOR ', app.appName);
        callback(null,JSON.parse(body));
    });

}