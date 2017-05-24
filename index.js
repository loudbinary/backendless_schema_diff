require('dotenv').config();

const _reportingDirectory=__dirname.toString(),
      chalk = require('chalk'),
      getUsage = require('command-line-usage'),
      commandLineArgs = require('command-line-args'),
      header = require('./assets/ansi-header.js'),
      ansi = require('ansi-escape-sequences'),
      async = require('async'),
      path = require('path'),
      pathToModule = path.join(__dirname,'backendless_admin_api.js'),
      backendless_admin_api = require(pathToModule),
      Backendless_admin_api = new backendless_admin_api,
      jsonexport = require('jsonexport'),
      fs = require('fs'),
      http = require('http'),
      headerOnlySection = [
        {
            content: ansi.format(header,'gold'),
            raw: true
        },
        {
            header: 'Backendless helper utility',
            group: ['header','_none'],
            content: 'By: Charles Russell (charles.russell@webteks.com)'
        }
      ], // Console Applications help header
      sections = [
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
      ]; // Console Applications help information

let applications = [],
    _application1,
     _application2,
     report = [];



/*
 ,{
 name: 'help',
 description: 'Prints this usage guide'
 }
 */
const usage = getUsage(sections);

/*
Definition for this applications arguments passed to command line.
 */
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

/*
Clean up any files that may have been saved from the last execution of application
 * application1_tables.csv
 * application2_tables.csv
 * issues_report.log
 */
function cleanUp(callback) {
    async.series([
        (callback)=>{
            fs.unlink(path.join(__dirname,'application1_tables.csv'),function(err){
                console.log(chalk.yellow('Deleted application1_tables.csv'));
                callback(null);
            })
        },
        (callback)=>{
            fs.unlink(path.join(__dirname,'application2_tables.csv'),function(err){
                console.log(chalk.yellow('Deleted application2_tables.csv'));
                callback(null);
            })
        },
        (callback)=>{
            fs.unlink(path.join(__dirname,'issues_report.log'),function(err){
                console.log(chalk.yellow('Deleted issues_report.log'));
                callback(null);
            })
        }
    ],function(){
        callback(null);
    })
}

/*
Helper to check for existence of an argument provided to application at execution.
 */
function ifExists(argument){
    if (options.compare[argument].toString().length > 0) {
        return true.toString();
    } else {
        return false.toString();
    }
}

/*
Check arguments provided to application, and take appropriate actions.
 */
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

/*
Given all applications from Backendless, locate the two requested applications given as arguments for comparisions
 */
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

/*
Applications' main processing loop.
 */
function processCli() {
    console.log(getUsage(headerOnlySection));

    cleanUp(function(){
        if (options.compare){
            checkForArguments(options.compare);
            console.log(chalk.white('.....Logging into Backendless developer api'))
            // Login to the developer api with supplied information.
            async.series([
                /*
                    1) Login to Backendless with provided develop login
                    2) Querying Backendless for all applications available to logged in developer
                    3) Find both application 1 and application 2, provided as arguments, in the returned Backendless list.
                    4) Assign critical variables for further processing.
                 */
                (callback)=>{
                    Backendless_admin_api.login(options.compare['username'],options.compare['password'],(err)=>{
                        if (!err){
                            console.log(chalk.white('.....Logged in, listing applications and verifying provided application ids'));
                        }
                        // Get all application from developer api, so as to verify supplied application-id's
                        Backendless_admin_api.listApplications((err,results)=>{
                            if (!err) {
                                console.log(chalk.white('.....Returned',results.length, 'applications'));
                            }
                            if (err) {
                                console.log(err);
                            }
                            results.forEach((item)=>{
                                applications.push(item);

                            })
                            findApplicationsInList(applications,(err)=>{
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
                /*
                    Obtain version Id of Application 1, necessary to complete remaining queries.
                 */
                (callback)=>{
                    Backendless_admin_api.getVersionId(_application1.appId,(err,results)=>{
                        if (err) callback(err);
                        if (!results) callback (err)
                        _application1.currentVersionId = results.currentVersionId;
                        callback(null);
                    })
                },
                /*
                    Obtain version Id of Application 2, necessary to complete remaining queries.
                 */
                (callback)=>{
                    Backendless_admin_api.getVersionId(_application2.appId,(err,results)=>{
                        if (err) callback(err);
                        if (!results) callback (err)
                        _application2.currentVersionId = results.currentVersionId;
                        callback(null);
                    })
                },
                /*
                    Obtain REST Secret Key for Application 1, necessary to complete remaining queries.
                 */
                (callback)=>{
                    console.log(chalk.yellow('Getting REST Secret for application', _application1.appName));
                    Backendless_admin_api.getRestSecret(_application1.appId,(err,results)=>{
                        if (err){
                            callback(err);
                        } else {
                            _application1.secretKey = results;
                            console.log(chalk.yellow('Found secret key for application1', _application1.appName));
                            callback(null);
                        }
                    })
                },
                /*
                    Obtain REST Secret Key for Application 2, necessary to complete remaining queries.
                 */
                (callback)=>{
                    console.log(chalk.yellow('Getting REST Secret for application2', _application2.appName));
                    Backendless_admin_api.getRestSecret(_application2.appId,(err,results)=>{
                        if (err){
                            callback(err);
                        } else {
                            _application2.secretKey = results;
                            console.log(chalk.yellow('Found secret key for application2', _application2.appName));
                            callback(null);
                        }
                    })
                },
                /*
                    Query Backendless for all database tables for Application 1
                 */
                (callback)=>{
                    console.log(chalk.yellow('Getting all datatables for', _application1.appName));
                    Backendless_admin_api.getApplicationsTables(_application1.appId, _application1.currentVersionId, _application1.secretKey,(err,results)=>{
                        if (err){
                            callback(err)
                        } else {
                            _application1.tables = results;
                            callback(null);
                        }
                    })
                },
                /*
                    Query Backendless for all database tables for Application 2
                 */
                (callback)=>{
                    console.log(chalk.yellow('Getting all datatables for', _application2.appName));
                    Backendless_admin_api.getApplicationsTables(_application2.appId, _application2.currentVersionId,_application2.secretKey,(err,results)=>{
                        if (err){
                            callback(err)
                        } else {
                            _application2.tables = results;
                            callback(null);
                        }
                    })
                },
                /*
                    Simple comparison of table names and each tables columns for differences between Application 1 and Application 2
                 */
                (callback)=>{
                    console.log(chalk.yellow('Verifying table names exist in both applications databases.'));
                    _application1.tables.tables.forEach((item)=>{
                        process.stdout.write(chalk.white('.....Verifying ' + item.name + ' table name exists in application2 ' + _application2.appName));
                        let table2Name = _application2.tables.tables.filter((newItem)=>{
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
                            console.log(chalk.red('.....', msg));
                        }

                    })
                    callback(null);
                },
                (callback) => {
                    _application1.tables.usersTables.forEach((appOneTable) =>{
                        process.stdout.write(chalk.white('.....Verifying table: [' + appOneTable.name + '] exists in application 2: [' + _application2.appName +']'));
                        let _foundTable2 = _application2.tables.usersTables.filter((appTwoTable) =>{
                            if (appOneTable.name == appTwoTable.name) {
                                return appTwoTable;
                            }
                        })

                        if (_foundTable2.length >0) {
                            let foundTable2 = _foundTable2[0];
                            console.log(chalk.green('.....Table: ' + appOneTable.name + ' exists in application 2: ' + _application2.appName + ', verifying columns match'));
                            appOneTable.columns.forEach((appOneColumn) => {
                                process.stdout.write(chalk.white('.....Verifying Application 1: [' + _application1.appName + '] Table: [' + appOneTable.name + '] Column: [' + appOneColumn.name + '] exists in Application 2: [' + _application2.appName+ ']'));
                                let foundColumnApp2 = foundTable2.columns.filter((appTwoColumn) => {
                                    if (appTwoColumn.name == appOneColumn.name) {
                                        return appTwoColumn;
                                    }
                                })

                                if (foundColumnApp2.length > 0) {
                                    console.log(chalk.green('.....Matching!'));
                                } else {
                                    console.log(chalk.red('.....Missing!'));
                                }
                            })
                            compareRealtions(appOneTable,foundTable2);
                        } else {
                            console.log(chalk.red('.....Missing!'));
                            let msg = 'MISSING_TABLE ['+ appOneTable.name + '] within Application 2 [' + _application2.appName + ']';
                            report.push(msg);
                            console.log(chalk.red('.....' + msg));
                            appOneTable.columns.forEach((missing) =>{
                                let msg = 'MISSING_COLUMN.....Table ['+ appOneTable.name + '] Column Name [' + missing.name + '] Data Type [' + missing.dataType + '] Read-Only [' + missing.readOnly + '] Auto-Created [' + missing.autoCreated + '] Validator [' + missing.validator + '] Required [' + missing.required + '] Unique [' + missing.unique + ']'
                                console.log(chalk.red('     ' + msg));
                                report.push(msg);
                            })
                            //compareRealtions(appOneTable,foundTable2);
                        }
                    });

                    callback(null);
                },

                /*
                    Details comparison of table names, tables columns, and tables relationships between Application 1 and Application 2
                 */
                /*
                (callback)=>    {
                    console.log(chalk.yellow('Comparing ' + _application1.appName + ' to ' + _application2.appName));
                    _application1.tables.tables.forEach((currentTable)=>{
                        console.log(chalk.white('.....Verifying column details for ' + currentTable.name));
                        let _table2 = _application2.tables.tables.filter((filtered)=>{
                            if (currentTable.name == filtered.name) {
                                return filtered;
                            }
                        })
                        if (_table2.length > 0){
                            let table1 = currentTable;
                            let table2 = _table2[0];
                            async.series([
                                function(callback){
                                    let processed = [];  // To be used to verify columns are missing in source, which are available in comparing application
                                    table1.columns.forEach((currentColumn)=>{

                                        processed.push(currentColumn);
                                        console.log(chalk.blue('Verifying ' + currentTable['name'] + ' column: ' +currentColumn['name']));
                                        let _table2Column= table2.columns.filter((filtered)=>{
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
                                    table2.columns.forEach((currentColumn)=>{

                                        processed.push(currentColumn);
                                        console.log(chalk.blue('Verifying ' + currentTable['name'] + ' column: ' +currentColumn['name']));
                                        let _table1Column= table1.columns.filter((filtered)=>{
                                            if (currentColumn.name == filtered.name) {
                                                return filtered;
                                            }
                                        })

                                        if (_table1Column.length != 0) {
                                            let table1Column = _table1Column[0];

                                            if (currentColumn['name'] == table1Column['name']) {
                                                console.log(chalk.green(currentTable.name + '.....Column names match'));
                                            }

                                            if (currentColumn['customRegex'] == table1Column['customRegex']) {
                                                console.log(chalk.green('.....customRegex matches with value: ' + currentColumn['customRegex']));
                                            } else {
                                                let msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field customRegex with value of: ' + currentColumn['customRegex'] + ' - The value found in '+ _application2.appName + ' for ' + currentColumn['name'] + ' is ' + table1Column['customRegex'];
                                                report.push(msg);
                                                console.log(chalk.red(msg));
                                            }

                                            if (currentColumn['dataSize'] == table1Column['dataSize']) {
                                                console.log(chalk.green('.....dataSize matches with value: ' + currentColumn['dataSize']));
                                            } else {
                                                var msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field dataSize with value of: ' + currentColumn['dataSize'] + ' - The value found in '+ _application2.appName + ' for ' + currentColumn['name'] + ' is ' + table1Column['dataSize'];
                                                report.push(msg);
                                                console.log(chalk.red(msg));
                                            }

                                            if (currentColumn['dataType'] == table1Column['dataType']) {
                                                console.log(chalk.green('.....Datatype matches with value: ' + currentColumn['dataType']));
                                            } else {
                                                let msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field Datatype with value of: ' + currentColumn['dataType'] + ' - The value found in ' + _application2.name + ' for ' + currentColumn['name'] + ' is ' + table1Column['dataType'];
                                                report.push(msg);
                                                console.log(chalk.red(msg));
                                            }
                                            if (currentColumn['defaultValue'] == table1Column['defaultValue']) {
                                                console.log(chalk.green('.....defaultValue matches with value: ' + currentColumn['defaultValue']));
                                            } else {
                                                let msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field defaultValue with value of: ' +  currentColumn['defaultValue'] + ' - The value found in '+ _application2.appName + ' for ' + currentColumn['name'] + ' is ' + table1Column['defaultValue'];
                                                report.push(msg);
                                                console.log(chalk.red(msg));
                                            }

                                            if (currentColumn['indexed'] == table1Column['indexed']) {
                                                console.log(chalk.green(currentColumn['name'] + '.....indexed matches with value: ' + currentColumn['indexed']));
                                            } else {
                                                let msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field indexed with value of: ' + currentColumn['indexed'] + ' - The value found in '+ _application2.appName + ' for ' + currentColumn['name'] + ' is ' + table1Column['indexed'];
                                                report.push(msg);
                                                console.log(chalk.red(msg));
                                            }

                                            if (currentColumn['primaryKey'] == table1Column['primaryKey']) {
                                                console.log(chalk.green('.....primaryKey matches with value: ' + currentColumn['primaryKey']));
                                            } else {
                                                let msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field primaryKey with value of: ' + currentColumn['primaryKey'] + ' - The value found in ' + _application2.appName + ' for ' + currentColumn['name'] + ' is ' + table1Column['primaryKey'];
                                                report.push(msg);
                                                console.log(chalk.red(msg));
                                            }
                                            if (currentColumn['readOnly'] == table1Column['readOnly']) {
                                                console.log(chalk.green('.....readOnly matches with value: ' + currentColumn['readOnly']));
                                            } else {
                                                let msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field readOnly with value of' + currentColumn['readOnly'] + ' - The value found in '+ _application2.appName + ' for ' + currentColumn['name'] + ' is ' + table1Column['readOnly'];
                                                report.push(msg);
                                                console.log(chalk.red(msg));
                                            }

                                            if (currentColumn['required'] == table1Column['required']) {
                                                console.log(chalk.green('.....required matches with value: ' + currentColumn['required']));
                                            } else {
                                                let msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field required does not match: '  +  currentColumn['required'] + ' - The value found in '+ _application2.appName + ' for ' + currentColumn['name'] + ' is ' + table1Column['required'];
                                                report.push(msg);
                                                console.log(chalk.red(msg));
                                            }

                                            if (currentColumn['unique'] == table1Column['unique']) {
                                                console.log(chalk.green('.....unique matches with value: ' + currentColumn['unique']));
                                            } else {
                                                let msg = 'MISMATCHING.....' + _application1.appName + ' table: ' + currentTable['name'] + ' field unique does not match: '  + currentColumn['unique'] + ' - The value found in '+ _application2.appName + ' for ' + currentColumn['name'] + ' is ' + table1Column['unique'];
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
                                        let missingRelations = table2.relations.filter((missingRelation)=>{
                                            table1.relations.filter((nested)=>{
                                                if (nested.name != missingRelation.name){
                                                    return missingRelation;
                                                }
                                            })
                                        })
                                        table1.relations.forEach((relation)=>{
                                            if (missingRelations.length == 0) {
                                                console.log(chalk.green('.....Relation tables names match between applications'))
                                            } else {
                                                missingRelations.forEach((missing)=>{
                                                    var _relatedTable = _application1.tables.tables.filter((_item)=>{
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
                                        if (!table2.parentRelations){
                                            table2.parentRelations = [];
                                        }
                                        if (table2.parentRelations) {
                                            missingParentRelations = table2.parentRelations.filter((missingParentRelation)=>{
                                                table1.parentRelations.filter((nested)=>{
                                                    if (nested.name != missingParentRelation.name){
                                                        return missingParentRelation;
                                                    }
                                                })
                                            })
                                        }
                                        table1.parentRelations.forEach((parentRelation)=>{
                                            if (missingParentRelations.length == 0) {
                                                console.log(chalk.green('.....Parent Relation names match between applications'))
                                            } else {
                                                missingParentRelations.forEach((newItem2)=>{
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
                                        table1.geoRelations.forEach((geoRelation)=>{
                                            let missingGeoRelations;
                                            if (table2.geoRelations) {
                                                missingGeoRelations = table2.geoRelations.filter((missingGeoRelation)=>{
                                                    if (geoRelation.name != missingGeoRelation.name){
                                                        return missingGeoRelation;
                                                    }
                                                })

                                            } else {
                                                missingGeoRelations = table1.geoRelations;
                                            }

                                            if (missingGeoRelations.length == 0) {
                                                console.log(chalk.green('.....Relation names match between applications'))
                                            } else {
                                                missingGeoRelations.forEach((newItem2)=>{
                                                    console.log(table1);
                                                    console.log(_application2.appName);
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
                },
                */

                /*
                    Export all tables and columns to csv for Application 1
                 */
                (callback)=>{
                    console.log(chalk.yellow('Exporting table information to csv file for each application1'));
                    jsonexport(_application1.tables.tables,(err,csv)=>{
                        fs.writeFileSync(path.join(_reportingDirectory,'application1_tables.csv'),csv,'utf8');
                        console.log(chalk.blue('Successfully wrote application1_tables.csv'));
                        callback(null);
                    })
                },
                /*
                    Export all tables and columns to csv for Application 2
                 */
                (callback)=>{
                    console.log(chalk.yellow('Exporting table information to csv file for each application2'));
                    jsonexport(_application2.tables.tables,(err,csv)=>{
                        fs.writeFileSync(path.join(_reportingDirectory,'application2_tables.csv'),csv,'utf8');
                        console.log(chalk.blue('Successfully wrote application2_tables.csv'));
                        callback(null);
                    })
                }
            ], (err)=>{
                if (err){
                    throw new Error(err);
                } else {
                    console.log(chalk.yellow('Completed processing and comparing'))
                    console.log(chalk.yellow('Saving issues report...', path.join(__dirname,'issues_report.log')));
                    writeReport((err)=>{
                        if (err)callback(err);
                        console.log(chalk.yellow('Processing Completed, and report is saved'));
                        process.exit(0);
                    });

                }
            })
        }
    })
}

/*
Perform relations check of table
 */

function checkRelations(appOneTable,appTwoTable) {
    if (appOneTable.relations) {
        console.log(chalk.yellow('Comparing all found relations for table [' + appOneTable.name + '] to relations of same table in Application 2 [' +_application2.appName + ']'));
        appOneTable.relations.forEach((relation)=>{
            process.stdout.write('.....Comparing Table [' + appOneTable.name + '] Relation [' + relation.name + '] to same in Application 2 [' + _application2.appName + ']');
            let tableTwoRelation = appTwoTable.relations.filter((appTwoRelation)=>{
                if (appTwoRelation.name == relation.name) {
                    return appTwoRelation;
                }
            });

            if (tableTwoRelation.length > 0) {
                // Found relation
                console.log(chalk.green('.....Matching'))
            } else {
                // Missing Relation
                console.log(chalk.red('.....Missing!'));
                let msg = 'MISSING_RELATION.....Table [' + appOneTable.name + '] Relation [' + relation.name + '] to same in Application 2 [' + _application2.appName + '] with the following details REQUIRED [' + relation.required + '] UNIQUE [' + relation.unique +'] RELATIONSHIP_TYPE [' + relation.relationshipType +']  AUTO_LOAD [' + relation.autoLoad + ']'
                report.push(msg);
            }
        })
    }
}



/*
Compare and report relations differences between two applications
 */
function compareRealtions(appOneTable,appTwoTable) {
    async.series([
        (callback) =>{
        if (!appOneTable.relations && !appTwoTable.relations) {
            console.log(chalk.white('......No Relations'))
        } else {
            try{
                if (appOneTable.relations.length === appOneTable.relations.length) {
                    //Assuming we didn't have a deletion, or something added on wrong side.
                    return checkRelations(appOneTable,appTwoTable);
                } else {
                    console.log('POSSIBLE_DELETION of relation in Application 1 ['+ _application1.appName + '], or addition of relation in Application 2 [' + _application2.appName);
                }
                callback(null);
            }
            catch (e){
            }
            console.log(chalk.red('Unable to check length of table relations'));
         }
        }
    ])


}
/*
Write details of error report to issues_report.log
 */
function writeReport(callback) {
    let file = fs.createWriteStream(path.join(__dirname,'issues_report.log'));
    file.on('error', (err) =>{
        if (err) callback(err);
    });
    report.forEach((item) => {
        file.write(item + '\n');
    })
    file.end();
}

/*
Helper function for Table Name mismatching
 */
function compareTableNames(table1, table2) {
    if (table1.name != table2.name) {
        return "TABLE Name Mismatch - Application 2 TableName: " + table2.name + " doesn't match Application 1 TableName: " + table1.name;
    } else {
        return null;
    }
}

// Start processing, entry point is here.
processCli();