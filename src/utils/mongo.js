const MongoClient = require('mongodb').MongoClient;
// Database credentials
const user = encodeURIComponent(process.env.MONGO_USERNAME);
const password = encodeURIComponent(process.env.MONGO_PASSWORD);
const authMechanism = 'DEFAULT';
const url = `mongodb://${user}:${password}@174.138.107.45/MIVB?authMechanism=${authMechanism}`;

const client = new MongoClient(url, {
    useNewUrlParser: true
});

let _db;
module.exports = {
    connect: () => {
        return new Promise((resolve, reject) => {
            client.connect(async (err, client) => {
                let db = client.db('MIVB');
                if (err) reject(err);
                _db = db;
                resolve();
            });
        })
    },
    use: () => {
        return _db;
    }
}