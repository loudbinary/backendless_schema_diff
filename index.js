require('dotenv').config();
const _application_id = process.env._application_id;
const _secret_key = process.env._secret_key;
const _application_type=process.env._application_type;
const _login= process.env._login;
const _password= process.env._password;
const _appName=process.env._appName;
const _reportingDirectory=__dirname.toString();
const chalk = require('chalk');
const getUsage = require('command-line-usage');
const commandLineArgs = require('command-line-args');
const header = require('./assets/ansi-header.js');
const ansi = require('ansi-escape-sequences');
const async = require('async');
const path = require('path')
const pathToModule = path.join(__dirname,'backendless_admin_api.js');
const backendless_admin_api = require(pathToModule);
const Backendless_admin_api = new backendless_admin_api;
let applications = [];
let _application1;
let _application2;
const jsonexport = require('jsonexport');
const fs = require('fs');
let report = [];

const http = require('http');

const httpAgents = []; //Holds open logged in Backendless sessions, default cached 1 hours, so we do not hit login limit

function createApiHttpAgent(username, password) {
    var agent = new keepAliveAgent({ maxSockets: 100 }); // Optionally define more parallel sockets
    var postData = { login: _login,
        password: _password }
    var options = {
        agent: agent,
        keepAliveMsecs: 36000,
        method: 'POST',
        host: 'develop.backendless.com',
        path: '/console/home/login',
        headers:
            {   'application-type': 'REST',
                'secret-key': _secret_key,
                'application-id': _application_id,
                'content-type': 'application/json' },
        json: true
    };
    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
            console.log('No more data in response.');
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    req.write(JSON.stringify(postData));
    req.end();

}

const headerOnlySection = [
    {
        content: ansi.format(header,'gold'),
        raw: true
    },
    {
        header: 'Backendless helper utility',
        group: ['header','_none'],
        content: 'By: Charles Russell (charles.russell@webteks.com)'
    }
]

/**
 * This is the help screen, default usage.
 * @type {*[]}
 */
const sections = [
    {
        content: ansi.format(header,'gold'),
        raw: true
    },
    {
        header: 'Backendless helper utility',
        group: ['header','_none'],
        content: 'By: Charles Russell (charles.russell@webteks.com)'
    },
    {
        header: 'Compare database schema of two Backendless Applications',
        group: ['compare','_none'],
        optionList: [
            {
                name: 'username',
                typeLabel: '[underline]{\[\'Backendless Developer Username\'\]}'
            },
            {
                name: 'password',
                typeLabel: '[underline]{\[\'Backendless Developer Password\'\]}'
            },
            {
                name: 'application-name1',
                typeLabel: '[underline]{\[\'Backendless Application Name 1 (Source) \'\]}'
            },
            {
                name: 'application-name2',
                typeLabel: '[underline]{\[\'Backendless Application Name 2 (Comparison)\'\]}'
            },
            {
                name: 'report-directory',
                typeLabel: '[underline]{\[\'Schema reporting directory\'\]}'
            }
        ]
    }
];

/*
 ,{
 name: 'help',
 description: 'Prints this usage guide'
 }
 */
const usage = getUsage(sections);

const optionDefinitions = [
    { name: 'compare', alias: 'c',type: Boolean ,group: 'compare' },
    { name: 'application-name1', alias: 'a', type: String, group: 'compare'},
    { name: 'application-name2', alias: 'b', type: String, group: 'compare'},
    { name: 'username', alias: 'u', type: String, group: 'compare'},
    { name: 'password', alias: 'p', type: String, group: 'compare'},
    { name: 'reporting-directory', alias: 'r', type: String, group: 'compare'}
];

const options = commandLineArgs(optionDefinitions);

// Determine if no arguments were passed to index.js, if not, display help.
if (JSON.stringify(options).length === 24) {
    console.log(usage);
    process.exit(0);
}

function cleanUp(callback) {
    async.series([
        function(callback){
            fs.unlink(path.join(__dirname,'application1_tables.csv'),function(err){
                console.log(chalk.yellow('Deleted application1_tables.csv'));
                callback(null);
            })
        },
        function(callback){
            fs.unlink(path.join(__dirname,'application2_tables.csv'),function(err){
                console.log(chalk.yellow('Deleted application2_tables.csv'));
                callback(null);
            })
        },
        function(callback){
            fs.unlink(path.join(__dirname,'issues_report.log'),function(err){
                console.log(chalk.yellow('Deleted issues_report.log'));
                callback(null);
            })
        }
    ],function(){
        callback(null);
    })
}
function ifExists(argument){
    if (options.compare[argument].toString().length > 0) {
        return true.toString();
    } else {
        return false.toString();
    }
}

function checkForArguments(allOptions) {
    console.log(chalk.bgYellow.red('Executing Backendless Database Schema comparison tool...'));

    if (!allOptions['username']) {
        console.log(chalk.red('Missing argument username of developers account for Backendless'));
        process.exit(-2)
    } else {
        console.log(chalk.white('.....Verifying argument username exists:',ifExists('username')));
    }

    if (!allOptions['password']){
        console.log(chalk.red('Missing argument password of developers account for Backendless'));
        process.exit(-2)
    } else {
        console.log(chalk.white('.....Verifying argument password exists:',ifExists('password')));
    }

    if (!allOptions['application-name1']){
        console.log(chalk.red('Missing argument application-name1'));
        process.exit(-2)
    } else {
        console.log(chalk.white('.....Verifying argument application-name1 exists:',ifExists('application-name1')));
    }

    if (!allOptions['application-name2']){
        console.log(chalk.red('Missing argument application-name2'));
        process.exit(-2)
    } else {
        console.log(chalk.white('.....Verifying argument application-name2 exists:',ifExists('application-name2')));
    }

    if (!allOptions['reporting-directory']){
        console.log(chalk.yellow('Using present directory to save reports: ',_reportingDirectory));
    } else {
        console.log(chalk.white('.....Using supplied directory to save reports:',options.compare['reporting-directory']));
    }
}

function findApplicationsInList(applications,callback) {
    for(var x = 0; x < applications.length; x++){
        if (applications[x].appName == options.compare['application-name1']){
            _application1 = applications[x];
            console.log(chalk.white('.....Found application-name1 ' + _application1.appName + ', the appId is: ', applications[x].appId));
        }
        if (applications[x].appName == options.compare['application-name2']){
            _application2 = applications[x];
            console.log(chalk.white('.....Found application-name2 ' + _application2.appName + ', the appId is: ', applications[x].appId));
        }
    }
    if (x == applications.length) {
        callback(null);
    }

}

function getVersionId(applicationId,callback) {

}
function processCli() {
    console.log(getUsage(headerOnlySection))
    cleanUp(function(){
        if (options.compare){
            checkForArguments(options.compare);
            console.log(chalk.white('.....Logging into Backendless developer api'))
            // Login to the developer api with supplied information.
            async.series([
                function(callback){
                    Backendless_admin_api.login(options.compare['username'],options.compare['password'],function(err){
                        if (!err){
                            console.log(chalk.white('.....Logged in, listing applications and verifying provided application ids'));
                        }
                        // Get all application from developer api, so as to verify supplied application-id's
                        Backendless_admin_api.listApplications(function(err,results){
                            if (!err) {
                                console.log(chalk.white('.....Returned',results.length, 'applications'));
                            }
                            if (err) {
                                console.log(err);
                            }
                            results.forEach(function(item){
                                applications.push(item);

                            })
                            findApplicationsInList(applications,function(err){
                                if (err) callback(err)
                                if (!_application1 || !_application2) {
                                    console.log(chalk.red('Unable to locate application names provided as arguments in list'));
                                    callback('Missing applications');
                                } else {
                                    callback(null);
                                }
                            })

                        });
                    })
                },
                function(callback){
                    Backendless_admin_api.getVersionId(_application1.appId,function(err,results){
                        if (err) callback(err);
                        if (!results) callback (err)
                        _application1.currentVersionId = results.currentVersionId;
                        callback(null);
                    })
                },
                function(callback){
                    Backendless_admin_api.getVersionId(_application2.appId,function(err,results){
                        if (err) callback(err);
                        if (!results) callback (err)
                        _application2.currentVersionId = results.currentVersionId;
                        callback(null);
                    })
                },
                function(callback){
                    console.log(chalk.yellow('Getting REST Secret for application', _application1.appName));
                    Backendless_admin_api.getRestSecret(_application1.appId,function(err,results){
                        if (err){
                            callback(err);
                        } else {
                            _application1.secretKey = results;
                            console.log(chalk.yellow('Found secret key for application1', _application1.appName));
                            callback(null);
                        }
                    })
                },
                function(callback){
                    console.log(chalk.yellow('Getting REST Secret for application2', _application2.appName));
                    Backendless_admin_api.getRestSecret(_application2.appId,function(err,results){
                        if (err){
                            callback(err);
                        } else {
                            _application2.secretKey = results;
                            console.log(chalk.yellow('Found secret key for application2', _application2.appName));
                            callback(null);
                        }
                    })
                },
                function(callback){
                    console.log(chalk.yellow('Getting all datatables for', _application1.appName));
                    Backendless_admin_api.getApplicationsTables(_application1.appId, _application1.currentVersionId, _application1.secretKey,function(err,results){
                        if (err){
                            callback(err)
                        } else {
                            _application1.tables = results;
                            callback(null);
                        }
                    })
                },
                function(callback){
                    console.log(chalk.yellow('Getting all datatables for', _application2.appName));
                    Backendless_admin_api.getApplicationsTables(_application2.appId, _application2.currentVersionId,_application2.secretKey,function(err,results){
                        if (err){
                            callback(err)
                        } else {
                            _application2.tables = results;
                            callback(null);
                        }
                    })
                },
                /*
                 function(callback){
                 //Need...to sort table names object, alphabetically before performing replace.
                 callback(null);
                 },
                 function (callback){
                 //Need...to replace all related table guids with table names.
                 },
                 */
                function(callback) {
                    console.log(chalk.yellow('Exporting table information to csv file for each application1'));
                    jsonexport(_application1.tables.tables,function(err,csv){
                        fs.writeFileSync(path.join(_reportingDirectory,'application1_tables.csv'),csv,'utf8');
                        console.log(chalk.blue('Successfully wrote application1_tables.csv'));
                        callback(null);
                    })
                },
                function(callback) {
                    console.log(chalk.yellow('Exporting table information to csv file for each application2'));
                    jsonexport(_application2.tables.tables,function(err,csv){
                        fs.writeFileSync(path.join(_reportingDirectory,'application2_tables.csv'),csv,'utf8');
                        console.log(chalk.blue('Successfully wrote application2_tables.csv'));
                        callback(null);
                    })
                },
                function(callback){
                    console.log(chalk.yellow('Comparing table names and their fields between applications.'));
                    _application1.tables.tables.forEach(function(item){
                        console.log(chalk.white('.....Comparing ' + item.name + ' table name between applications '));
                        let table2Name = _application2.tables.tables.filter(function(newItem){
                            if (item.name == newItem.name) {
                                return newItem;
                            }
                        })
                        if (table2Name.length > 0){
                            let results = compareTableNames(item,table2Name[0]);
                            if (results == null) {
                                console.log(chalk.green('.....Matching!'));
                            } else {
                                console.log(chalk.red(results));
                            }
                        } else {
                            let msg = 'MISSING: Table found in Application 1, named ' + item.name + ', is missing from Application 2'
                            report.push(msg);
                            console.log(chalk.red(msg));
                        }

                    })
                    callback(null);
                },
                function(callback){
                    console.log(chalk.yellow('Comparing ' + _application1.appName + ' to ' + _application2.appName));
                    _application1.tables.tables.forEach(function(currentTable){
                        console.log(chalk.white('.....Verifying column details for ' + currentTable.name));
                        let _table2 = _application2.tables.tables.filter(function(filtered){
                            if (currentTable.name == filtered.name) {
                                return filtered;
                            }
                        })
                        if (_table2.length > 0){
                            let table1 = currentTable;
                            let table2 = _table2[0];
                            async.series([
                                function(callback){
                                    table1.columns.forEach(function(currentColumn){
                                        console.log(chalk.blue('Verifying ' + currentTable['name'] + ' column: ' +currentColumn['name']));
                                        let _table2Column= table2.columns.filter(function(filtered){
                                            if (currentColumn.name == filtered.name) {
                                                return filtered;
                                            }
                                        })

                                        if (_table2Column.length != 0) {
                                            let table2Column = _table2Column[0];

                                            if (currentColumn['name'] == table2Column['name']) {
                                                console.log(chalk.green(currentTable.name + '.....Column names match'));
                                            }

                                            if (currentColumn['customRegex'] == table2Column['customRegex']) {
                                                console.log(chalk.green('.....customRegex matches with value: ' + currentColumn['customRegex']));
                                            } else {
                                                let msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field customRegex with value of: ' + currentColumn['customRegex'] + ' - The value found in '+ _application2.appName + ' for ' + currentColumn['name'] + ' is ' + table2Column['customRegex'];
                                                report.push(msg);
                                                console.log(chalk.red(msg));
                                            }

                                            if (currentColumn['dataSize'] == table2Column['dataSize']) {
                                                console.log(chalk.green('.....dataSize matches with value: ' + currentColumn['dataSize']));
                                            } else {
                                                var msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field dataSize with value of: ' + currentColumn['dataSize'] + ' - The value found in '+ _application2.appName + ' for ' + currentColumn['name'] + ' is ' + table2Column['dataSize'];
                                                report.push(msg);
                                                console.log(chalk.red(msg));
                                            }

                                            if (currentColumn['dataType'] == table2Column['dataType']) {
                                                console.log(chalk.green('.....Datatype matches with value: ' + currentColumn['dataType']));
                                            } else {
                                                let msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field Datatype with value of: ' + currentColumn['dataType'] + ' - The value found in ' + _application2.name + ' for ' + currentColumn['name'] + ' is ' + table2Column['dataType'];
                                                report.push(msg);
                                                console.log(chalk.red(msg));
                                            }
                                            if (currentColumn['defaultValue'] == table2Column['defaultValue']) {
                                                console.log(chalk.green('.....defaultValue matches with value: ' + currentColumn['defaultValue']));
                                            } else {
                                                let msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field defaultValue with value of: ' +  currentColumn['defaultValue'] + ' - The value found in '+ _application2.appName + ' for ' + currentColumn['name'] + ' is ' + table2Column['defaultValue'];
                                                report.push(msg);
                                                console.log(chalk.red(msg));
                                            }

                                            if (currentColumn['indexed'] == table2Column['indexed']) {
                                                console.log(chalk.green(currentColumn['name'] + '.....indexed matches with value: ' + currentColumn['indexed']));
                                            } else {
                                                let msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field indexed with value of: ' + currentColumn['indexed'] + ' - The value found in '+ _application2.appName + ' for ' + currentColumn['name'] + ' is ' + table2Column['indexed'];
                                                report.push(msg);
                                                console.log(chalk.red(msg));
                                            }

                                            if (currentColumn['primaryKey'] == table2Column['primaryKey']) {
                                                console.log(chalk.green('.....primaryKey matches with value: ' + currentColumn['primaryKey']));
                                            } else {
                                                let msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field primaryKey with value of: ' + currentColumn['primaryKey'] + ' - The value found in ' + _application2.appName + ' for ' + currentColumn['name'] + ' is ' + table2Column['primaryKey'];
                                                report.push(msg);
                                                console.log(chalk.red(msg));
                                            }
                                            if (currentColumn['readOnly'] == table2Column['readOnly']) {
                                                console.log(chalk.green('.....readOnly matches with value: ' + currentColumn['readOnly']));
                                            } else {
                                                let msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field readOnly with value of' + currentColumn['readOnly'] + ' - The value found in '+ _application2.appName + ' for ' + currentColumn['name'] + ' is ' + table2Column['readOnly'];
                                                report.push(msg);
                                                console.log(chalk.red(msg));
                                            }

                                            if (currentColumn['required'] == table2Column['required']) {
                                                console.log(chalk.green('.....required matches with value: ' + currentColumn['required']));
                                            } else {
                                                let msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field required does not match: '  +  currentColumn['required'] + ' - The value found in '+ _application2.appName + ' for ' + currentColumn['name'] + ' is ' + table2Column['required'];
                                                report.push(msg);
                                                console.log(chalk.red(msg));
                                            }

                                            if (currentColumn['unique'] == table2Column['unique']) {
                                                console.log(chalk.green('.....unique matches with value: ' + currentColumn['unique']));
                                            } else {
                                                let msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field unique does not match: '  + currentColumn['unique'] + ' - The value found in '+ _application2.appName + ' for ' + currentColumn['name'] + ' is ' + table2Column['unique'];
                                                report.push(msg)
                                                console.log(chalk.red(msg));
                                            }

                                        }
                                        else {
                                            let msg = 'FIELD_MISSING.....Column ' + currentColumn.name + ' is missing from ' + _application2.appName + ' for table ' + currentTable['name'];
                                            report.push(msg);
                                            console.log(chalk.red(msg));
                                        }
                                    })
                                    callback(null);
                                },
                                function(callback){
                                    console.log(chalk.blue('Verifying Relations of table ' + currentTable['name']));
                                    if (table1.relations) {
                                        let missingRelations = table2.relations.filter(function(missingRelation){
                                            table1.relations.filter(function(nested){
                                                if (nested.name != missingRelation.name){
                                                    return missingRelation;
                                                }
                                            })
                                        })
                                        table1.relations.forEach(function(relation){
                                            if (missingRelations.length == 0) {
                                                console.log(chalk.green('.....Relation tables names match between applications'))
                                            } else {
                                                missingRelations.forEach(function(missing){
                                                    var _relatedTable = _application1.tables.tables.filter(function(_item){
                                                        if(relation.relatedTable == _item.tableId) {
                                                            return _item;
                                                        }
                                                    })
                                                    let msg = 'MISMATCHING.....' + _application1.appName + ' Relations of ' + missing['name'] + ' to table ' + _relatedTable[0]['name'] + ' with a ' + missing['relationshipType'] + ' type';
                                                    report.push(msg);
                                                    console.log(chalk.red(msg));
                                                })

                                            }
                                        })
                                    }
                                    else {
                                        console.log(chalk.white('.....No Relations for table name ' + currentTable['name']))
                                    }
                                    callback(null);
                                },
                                function(callback){
                                    console.log(chalk.blue('Verifying Parent Relations of table ' + currentTable['name']));
                                    if (table1.parentRelations){
                                        let missingParentRelations;
                                        if (table2.parentRelations) {
                                            missingParentRelations = table2.parentRelations.filter(function(missingParentRelation){
                                                table1.parentRelations.filter(function(nested){
                                                    if (nested.name != missingParentRelation.name){
                                                        return missingParentRelation;
                                                    }
                                                })
                                            })
                                        } else {
                                            missingParentRelations = table1.parentRelations.filter(function(nested){
                                                [].filter(function(missingParentRelation){
                                                    return missingParentRelation;
                                                })
                                                if (nested.name != missingParentRelation.name){

                                                }
                                            })

                                        }

                                        table1.parentRelations.forEach(function(parentRelation){


                                            if (missingParentRelations.length == 0) {
                                                console.log(chalk.green('.....Parent Relation names match between applications'))
                                            } else {
                                                missingParentRelations.forEach(function(newItem2){
                                                    let msg = 'MISMATCHING.....' + _application1.appName + ' Parent Relations from ' + parentRelation['name'] + ' to table ' + parentRelation['relatedColumnName'] + ' for table named:' + currentTable['name'];
                                                    report.push(msg)
                                                    console.log(chalk.red(msg));
                                                })
                                            }
                                        })
                                    }
                                    else {
                                        console.log(chalk.white('.....No Parent Relations for table name ' + currentTable['name']))
                                    }
                                    callback(null);
                                },
                                function(callback){
                                    console.log(chalk.blue('Verifying Geo Relations of table ' + currentTable['name']));
                                    if (table1.geoRelations){
                                        table1.geoRelations.forEach(function(geoRelation){
                                            let missingGeoRelations = table2.geoRelations.filter(function(missingGeoRelation){
                                                if (geoRelation.name != missingGeoRelation.name){
                                                    return missingGeoRelation;
                                                }
                                            })

                                            if (missingGeoRelations.length == 0) {
                                                console.log(chalk.green('.....Relation names match between applications'))
                                            } else {
                                                missingGeoRelations.forEach(function(newItem2){
                                                    console.log(chalk.white('.....' + _application1.appName + ' Geo Relations for table ' + geoRelation['name'] + ' to table ' + geoRelation['relatedColumnName'] + ' with a ' + geoRelation['relationshipType'] + ' type'));
                                                })
                                            }
                                        })


                                    }
                                    else {
                                        console.log(chalk.yellow('.....Geo Relations are not defined for ' + currentTable['name']))
                                    }
                                    callback(null);
                                },

                            ])
                        } else {
                            let msg = '.....Skipping table/field validation for ' + currentTable['name'] + ' because it is missing in ' + _application2.appName;
                            report.push(msg);
                            console.log(chalk.red(msg));
                        }
                    })
                    callback(null);
                }
            ], function(err){
                if (err){
                    throw new Error(err);
                } else {
                    console.log(chalk.yellow('Completed processing and comparing'))
                    console.log(chalk.yellow('Saving issues report...', path.join(__dirname,'issues_report.log')));
                    writeReport(function(err){
                        if (err)callback(err);
                        console.log(chalk.yellow('Processing Completed, and report is saved'));
                        process.exit(0);
                    });

                }
            })
        }
    })

}

function writeReport(callback) {
    let file = fs.createWriteStream(path.join(__dirname,'issues_report.log'));
    file.on('error', function(err) {
        if (err) callback(err);
    });
    report.forEach(function(item) {
        file.write(item + '\n');
    })
    file.end();
}
function compareTableNames(table1, table2) {
    if (table1.name != table2.name) {
        return "TABLE Name Mismatch - Application 2 TableName: " + table2.name + " doesn't match Application 1 TableName: " + table1.name;
    } else {
        return null;
    }
}

processCli();