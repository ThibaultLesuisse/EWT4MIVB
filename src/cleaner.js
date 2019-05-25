var path = require("path");
const rimraf = require('rimraf');
const MongoClient = require('mongodb').MongoClient;

// Database credentials
const user = encodeURIComponent(process.env.MONGO_USERNAME);
const password = encodeURIComponent(process.env.MONGO_PASSWORD);
const authMechanism = 'DEFAULT';
//The default poolSize is only 5, we need way more connections.... Watch out though, too many connection and mongodb will suffer. If you have a big server try more, if not try less
const url = `mongodb://${user}:${password}@mongo/MIVB?authMechanism=${authMechanism}&poolSize=300&minSize=200`;
const client = new MongoClient(url, {
    useNewUrlParser: true
});

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
    return new Promise((resolve, reject) => {
        client.connect(async (err) => {
            if (err) reject(err);
            db = client.db("MIVB");
            let collection = db.collection("MIVB");
            let delete_date = new Date(Date.now() - 172800000).getTime();
            try {
                let r = await collection.deleteMany({
                    time: {
                        $lt: delete_date
                    }
                });
                console.log("(5/6) Cleaned database & removed files");
            } catch (error) {
                reject(error);
            }
            resolve();
        });
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