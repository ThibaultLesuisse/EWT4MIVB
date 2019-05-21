const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

// Database credentials
const user = encodeURIComponent(process.env.MONGO_USERNAME);
const password = encodeURIComponent(process.env.MONGO_PASSWORD);
const authMechanism = 'DEFAULT';
const url = `mongodb://${user}:${password}@188.166.90.230/MIVB?authMechanism=${authMechanism}`;
const client = new MongoClient(url, {
    useNewUrlParser: true
});
let db;
client.connect((err) => {
    if (err) console.log(err);
    db = client.db("MIVB");
    // This array contains all the dates that will be anaylysed! Watch for the format. Make sure new Date() can read it
    let dates = [
        "May 2",
        "May 3",
        "May 4", 
        "May 5",
        "May 6",
        "May 7",
        "May 8",
        "May 9",
        "May 10",
        "May 11",
        "May 12",
        "May 13",
        "May 14",
        "May 15",
        "May 16"
    ]
    a(dates);
});

function split_hour_if_necessary(time) {
    let split = time.split(':');
    let value = {time: time, bool: false}
    if (parseInt(split[0]) >= 24) {
        console.log(time)
        split[0] = (parseInt(split[0]) - 24).toString();
        value.time = split[0].toString() + ":" + split[1].toString() + ":" + split[2].toString();
        value.bool = true
        console.log(value.time)
    }
    return value
}

async function a(dates) {
    dates.forEach(date => {
        try {
            let day = new Date(date + ", 2019" + " UTC +01:00").getUTCDay();

            fs.readFile('./files/39.json', async (err, data) => {
                if (err) console.log("Failed to read json file")
                let line_timetable = JSON.parse(data);
                let collection = db.collection("MIVB");
                let EWT = [];
                let promises = [];
                line_timetable.forEach(trip => {
                    trip.timetable.forEach(stop => {
                        let start_time_checked = split_hour_if_necessary(stop.arrival_time);
                        let start_time = new Date(date + ", 2019 " + start_time_checked.time + " UTC +01:00").getTime() - 60000;
                        let end_time = new Date(date + ", 2019 " + start_time_checked.time+ " UTC +01:00").getTime() - 30000;
                        // there are 86 400 000 milisconds in a day.
                        if (start_time_checked.bool) {
                            start_time = +86400000,
                                end_time = +86400000
                        }
                        if (trip.days.includes(day)) {
                            promises.push(new Promise(async (resolve, reject) => {
                                //This contains the query
                                await collection.find({
                                    "points.pointId": stop.stop_id,
                                    "points.passingTimes.lineId": "39",
                                    time: {
                                        $lt: end_time,
                                        $gt: start_time
                                    }
                                }).toArray((err, docs) => {
                                    if (err) reject(err)
                                    if (Array.isArray(docs) && docs.length > 0) {
                                        docs.forEach(element => {
                                            if (element.points[0].passingTimes.length > 0) {
                                                EWT.push({
                                                    stop_id: stop.stop_id,
                                                    arrival_time: new Date(date + ", 2019 " + stop.arrival_time + " UTC +01:00").toDateString(),
                                                    estimated_arrival: new Date(element.points[0].passingTimes[0].expectedArrivalTime).getTime(),
                                                    ewt: new Date(element.points[0].passingTimes[0].expectedArrivalTime).getTime() - new Date(date + ", 2019 " + stop.arrival_time + " UTC +01:00").getTime()
                                                });
                                            }
                                        })
                                    }
                                    resolve();
                                });
                            }))
                        }
                    })
                });
                /*
                Promises are made and an their reference put into an array. We need to wait for all of them to complete in order to be able 
                to create the file. They all fail or succeed
                */
                Promise.all(promises).then(() => {
                    fs.writeFile(`./ewt/39_${date.replace(' ', '_')}.json`, JSON.stringify(EWT), (err) => {
                        if (err) console.error(err);
                        console.log("Writing file complete");
                        fs.readFile(`./ewt/39_${date.replace(' ', '_')}.json`, 'UTF-8', (err, data) => {
                            let json = JSON.parse(data);
                            let EWT = 0;
                            json.forEach(element => {
                                EWT += element.ewt
                            });
                            //This contains the average delay
                            if (!fs.existsSync('./ewt/delay.json')) {
                                let result = [];
                                result.push({
                                    date: date,
                                    delay: ((EWT / json.length) / 1000) / 60
                                });
                                fs.writeFile('./ewt/delay.json', JSON.stringify(result), err => {
                                    if (err) console.log(err)
                                })
                            } else {
                                fs.readFile('./ewt/delay.json', 'UTF-8', (err, data) => {
                                    if (err) console.log(error)
                                    let result = JSON.parse(data);
                                    result.push({
                                        date: date,
                                        delay: ((EWT / json.length) / 1000) / 60
                                    });
                                    fs.writeFile('./ewt/delay.json', JSON.stringify(result), err => {
                                        if (err) console.log(err)
                                    });
                                })
                            }

                        })
                    });
                }).catch(error => {
                    console.error("one of the promises failed, Reason below: \n " + error.stack);
                })
            })
        } catch (error) {
            console.error(error);
        }
    })

}