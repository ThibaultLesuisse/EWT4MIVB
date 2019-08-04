const gtfs = require('./gtfs_parser');
const ewt = require('./ewt_calc');
const cleaner = require('./cleaner')
const file_structure = require('./file_structure');
const cron = require('node-cron');
const mongo = require('./utils/mongo');

//Start every day at 12:00
cron.schedule("30 16 10 * * *", async () => {
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
});
