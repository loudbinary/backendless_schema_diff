require('dotenv').config();
const chalk = require('chalk');
const async = require('async');
const http = require('http');
let _http;
function application_api(username,password) {
    this.username = username;
    this.password = password;
    var agent = new http.Agent({keepAlive: true});
    this.options = {
        "hostname": "develop.backendless.com",
        "port": 80,
        "agent": agent,
        "headers": {
            "content-type": "application/json",
            "application-type": "REST"
        }
    };
    this.auth_key = '';
    this.initialized = false;
    this.authorized = false;
    _http = this;
}

application_api.prototype = {
    login: function(username,password,callback){
        var newHttp = _http;
        newHttp.options.path =  "/console/home/login";
        newHttp.options.method = 'POST';
        var req = http.request(newHttp.options, function (res) {
            var chunks = [];
            res.on("data", function (chunk) {
                chunks.push(chunk);
            });
            res.on("end", function () {
                var body = Buffer.concat(chunks);
                if (this.headers['auth-key']){
                    console.log(chalk.white('.....Successfully logged into developer api'));
                    _http.options.headers['auth-key'] = this.headers['auth-key'];
                    console.log(chalk.white('.....HTTP Agent updated for reuse'));
                    _http.initialized = true;
                    _http.authorized = true;
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
        var newHttp = _http;
        newHttp.options.path = '/3.x/console/applications';
        newHttp.options.method = 'GET';
        //newHttp.options.headers['application-id'] = applicationId;
        var req = http.request(newHttp.options, function (res) {
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
        var newHttp = _http;

        newHttp.options.path = '/3.x/console/application/' + applicationId + '/secretkey/REST';
        newHttp.options.method = 'GET';
        newHttp.options.headers['application-id'] = applicationId;
        var req = http.request(newHttp.options, function (res) {
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
    getVersionId: function(applicationId,callback) {
        var newHttp = _http;

        newHttp.options.path = '/3.x/console/application/' + applicationId;
        newHttp.options.method = 'GET';
        newHttp.options.headers['application-id'] = applicationId;
        var req = http.request(newHttp.options, function (res) {
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
    }
}


module.exports = application_api;
