const gtfs = require('./src/gtfs_parser');
const ewt = require('./src/ewt_calc');
const cleaner = require('./src/cleaner')
const file_structure = require('./src/file_structure');
const mongo = require('./src/utils/mongo');

async function run_every_24_hours(){
    try {
     await mongo.connect();
     await file_structure();
     await gtfs.parse();
     await ewt();
     await cleaner();
     console.log(`(6/6) Done for the day. Here is an overview \nCurrent Date: ${new Date(Date.now()).toISOString()}\nDay processed: ${new Date(Date.now() - 86400000).toISOString()} \nNo errors found! `)
    } catch (error) {
     console.log(`(6/6) Done for the day. Here is an overview \nCurrent Date: ${new Date(Date.now()).toISOString()} \nErrors were found, Stacktrace below!`)
     console.error(error.stack);
    } 
 }
 run_every_24_hours();