const gtfs = require('./gtfs_parser');
const ewt = require('./ewt_calc');
const cleaner = require('./cleaner')
const file_structure = require('./file_structure');
const cron = require('node-cron');

async function run_every_24_hours(){
   try {
    await file_structure();
    await gtfs.parse();
    await ewt();
    await cleaner();
    console.log(`Done for the day. Here is an overview \nCurrent Date: ${new Date(Date.now()).toISOString()}\nDay processed: ${new Date(Date.now() - 86400000).toISOString()} \nNo errors found! `)
   } catch (error) {
    console.log(`(6/6) Done for the day. Here is an overview \nCurrent Date: ${new Date(Date.now()).toISOString()} \nErrors were found, Stacktrace below!`)
    console.error(error.stack);
   } 
}
//Start every day at 12:00
cron.schedule('30 12 * * *', async () => {
    await run_every_24_hours();
});
//Now we run it. We need to do this to have access to async/await!
