var path = require("path");
const rimraf = require('rimraf');
const mongo = require("./utils/mongo");



module.exports = () => {
    return new Promise(async (resolve, reject) => {
        try {
            await remove_GTFS_files();
            await delete_old_database_objects();
            resolve();
        } catch (error) {
            reject(error);
        }

    })

}

function delete_old_database_objects() {
    return new Promise(async (resolve, reject) => {

            
            let delete_date = new Date(Date.now() - 172800000).getTime();
            try {
                let db =  mongo.use();
                let r = await db.collection("MIVB").deleteMany({
                    time: {
                        $lt: delete_date
                    }
                });
                console.log(`(5/6) Cleaned database & removed files `);
            } catch (error) {
                reject(error);
            }
            resolve();
       
    })
}

function remove_GTFS_files() {
    return new Promise((resolve, reject) => {
        rimraf(path.join(__dirname, "/../tmp"), (err) => {
            if (err) reject(err);
            resolve();
        })
    })
}