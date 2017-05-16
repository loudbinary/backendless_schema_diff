# backendless_schema_diff
Compare selected applications database schema, and provide details

Execute

node index.js --username (developer login) --password (developer password) --application-name1 (source app name) --application-name2 (to be compared against)

Will emit out 3 files
1) CSV for application1 of all information regarding tables, relationships, etc
2) CSV for application2 of all information regarding tables, relationships, etc
3) issues_report.log - Shows all problems found

Hope this helps someone else using Backendless to compare applications.

