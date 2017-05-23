require('dotenv').config();
const chalk = require('chalk');
const async = require('async');
const http = require('http');
const Agent = require('agentkeepalive');
let agent = new Agent({
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 60000,
    freeSocketKeepAliveTimeout: 30000
});
let options = {
    "hostname": "develop.backendless.com",
    "port": 80,
    "agent": agent,
    "headers": {
        "content-type": "application/json",
        "application-type": "REST"
    }
};
let _http;

function Backendless_admin_api(username,password) {
    this.username = username;
    this.password = password;
    this.options = options;
    _http = this;
}

Backendless_admin_api.prototype = {
    login: function(username,password,callback){

        options.username = username;
        options.password = password;
        options.path =  "/console/home/login";
        options.method = 'POST';
        let req = http.request(options, function (res) {
            var chunks = [];
            res.on("data", function (chunk) {
                chunks.push(chunk);
            });
            res.on("end", function () {
                var body = Buffer.concat(chunks);
                if (this.headers['auth-key']) {
                    console.log(chalk.white('.....Successfully logged into developer api'));
                    options.auth_key = this.headers['auth-key'];
                    options.headers['auth-key'] = this.headers['auth-key'];
                    options.initialized = true;
                    options.authorized = true;
                    callback(null);
                } else {
                    console.log(chalk.bgYellow.red('Unable to login to developer api with supplied credentials'));
                    callback('Unable to login');
                }
            });
            res.on("error", function(err){
                callback(err);
            })
        });
        req.write(JSON.stringify({ login: username,
            password: password}));
        req.end();
    },
    listApplications: function(callback){
        options.path = '/console/applications';
        options.method = 'GET';
        //options.headers['application-id'] = applicationId;
        let req = http.request(options, function (res) {
            var chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                var body = Buffer.concat(chunks);
                callback(null,JSON.parse(body.toString()));
            });

            res.on("error", function(err){
                callback(err);
            })
        });
        req.end();
    },
    getRestSecret: function(applicationId,callback){
        options.path = '/3.x/console/application/' + applicationId + '/secretkey/REST';
        options.method = 'GET';
        options.headers['application-id'] = applicationId;
        let req = http.request(options, function (res) {
            var chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                var body = Buffer.concat(chunks);
                callback(null,body.toString());
            });

            res.on("error", function(err){
                callback(err);
            })
        });
        req.end();
    },
    getVersionId: function(applicationId,callback){
        options.path = '/3.x/console/applications';
        options.method = 'GET';
        options.headers['application-id'] = applicationId;
        let req = http.request(options, function (res) {
            var chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                let body = Buffer.concat(chunks);
                let items = JSON.parse(body.toString());
                if (items.length > 0){
                    let newItem = items.filter(function(item){
                        if (item.appId == applicationId) {
                            return item;
                        }
                    })
                    callback(null,newItem[0]);
                } else {
                    callback(null);
                }

            });

            res.on("error", function(err){
                callback(err);
            })
        });
        req.end();
    },
    getApplicationsTables: function(applicationId,appVersionId,secretKey,callback){
        //var newHttp = _http;
        options.path = '/3.x/console/appversion/' + appVersionId + '/data/tables';
        options.method = 'GET';
        options.headers['application-id'] = applicationId;
        options.headers['secret-key'] = secretKey;
        let req = http.request(options, function (res) {
            let chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                var body = Buffer.concat(chunks);
                callback(null,JSON.parse(body.toString()));
            });

            res.on("error", function(err){
                callback(err);
            })
        });
        req.end();
    },
}

module.exports = Backendless_admin_api;
