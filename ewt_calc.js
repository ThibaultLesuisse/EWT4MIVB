const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

// Database credentials
const user = encodeURIComponent(process.env.MONGO_USERNAME);
const password = encodeURIComponent(process.env.MONGO_PASSWORD);
const authMechanism = 'DEFAULT';
const url = `mongodb://${user}:${password}@localhost/MIVB?authMechanism=${authMechanism}`;
const client = new MongoClient(url, {
    useNewUrlParser: true
});
let db;
client.connect((err) => {
    if (err) console.log(err);
    db = client.db("MIVB");
    a();
});

async function a() {
    try {
        fs.readFile('./files/39.json', async (err, data) => {
            if(err)console.log("Failed to read json file")
            let line_timetable = JSON.parse(data);
            let collection = db.collection("MIVB");
            let EWT = [];
            let promises = [];
            let april = 29;
            line_timetable.forEach(trip => {
                trip.timetable.forEach(stop => {
                    promises.push(new Promise(async (resolve, reject) => {
                        //This contains the query
                        let stop_data = await collection.find(
                            {
                                "points.pointId": stop.stop_id,
                                "points.passingTimes.lineId": "39",
                                $and: [{
                                time: {
                                    $lt: new Date("May 11, 2019 " + stop.arrival_time + " GMT -00:00").getTime() + 1000
                                }
                            }, {
                                time: {
                                    $gt: new Date("May 11, 2019 " + stop.arrival_time + " GMT -00:00").getTime() - 1000
                                }
                            }]
                            }).toArray((err, docs) => {
                            if (err) reject(err)
                            console.log(docs)
                            if (Array.isArray(docs)) {
                                docs.forEach(element => {
                                    if(element.points[0].passingTimes.length > 0){EWT.push({
                                        stop_id: stop.stop_id,
                                        arrival_time: stop.arrival_time,
                                        estimated_arrival: new Date(element.points[0].passingTimes[0].expectedArrivalTime).getTime(),
                                        ewt: new Date(element.points[0].passingTimes[0].expectedArrivalTime).getTime() - new Date("May 11, 2019 " + stop.arrival_time + " GMT -00:00").getTime()
                                    });}
                                })
                            }
                            resolve();
                        });
                    }))
                })
            });
            /*
            Promises are made and an their reference put into an array. We need to wait for all of them to complete in order to be able 
            to create the file. They all fail or succeed
            */
            Promise.all(promises).then(() => {
                fs.writeFile('./ewt/39.json', JSON.stringify(EWT), (err) => {
                    if (err) console.error(err);
                    console.log("Writing file complete");
                    fs.readFile("./ewt/39.json", 'UTF-8', (err, data) => {
                        let json = JSON.parse(data);
                        let EWT = 0;
                        json.forEach(element => {
                            EWT += element.ewt
                        });
                        //This contains the average delay
                        console.log(((EWT/json.length)/1000)/60)
                    })
                });
            }).catch(error => {
                console.error("one of the promises failed, Reason below: \n " + error.stack);
            })
        })
    } catch (error) {
        console.error(error);
    }
}