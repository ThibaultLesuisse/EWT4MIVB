const fs = require('fs');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const BigNumber = require('bignumber.js');
require('dotenv').config({ path: path.join(__dirname, '/../.env')})

// Database credentials
const user = encodeURIComponent(process.env.MONGO_USERNAME);
const password = encodeURIComponent(process.env.MONGO_PASSWORD);
const authMechanism = 'DEFAULT';
//The default poolSize is only 5, we need way more connections.... Watch out though, too many connection and mongodb will suffer. If you have a big server try more, if not try less
const url = `mongodb://${user}:${password}@mongo/MIVB?authMechanism=${authMechanism}&poolSize=300&minSize=200`;
console.log(url);

const client = new MongoClient(url, {
    useNewUrlParser: true
});


module.exports = () => {
    return new Promise((resolve, reject) => {
        client.connect(async (err) => {
            if (err) reject(err);
            db = client.db("MIVB");
            // We need to get all the data processed from the day before! 
            let day = new Date(Date.now()).getDate() - 1;
            let month = new Date(Date.now()).toLocaleString('en-us', {
                month: 'long'
            });
            await run(month + " " + day);
            resolve()
        });
    })

}


async function run(date) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, '/../tmp/files/39.json'), async (err, data) => {
            try {
                let day = new Date(date + ", 2019" + " UTC +01:00").getDay();
                //If the file was not read it makes no sense to continue
                if (err) reject(err)
                let line_timetable = JSON.parse(data);
                let collection = db.collection("MIVB");
                let EWT = [];
                let promises = [];
                line_timetable.forEach(trip => {
                    trip.timetable.forEach((stop, index) => {

                        let start_time_checked = split_hour_if_necessary(stop.arrival_time);
                        let start_time = new Date(date + ", 2019 " + start_time_checked.time.toString() + " UTC +01:00").getTime() - 70000;
                        let end_time = new Date(date + ", 2019 " + start_time_checked.time.toString() + " UTC +01:00").getTime() - 40000;
                        // there are 86 400 000 milisconds in a day. As we first substracted a 24 hours we need to add a day.
                        if (start_time_checked.bool) {
                            start_time = +86400000,
                                end_time = +86400000
                        }
                        if (trip.days.includes(day)) {
                            //The promise never rejects. That's not good coding practice but we can't risk it. Otherwise promise.all may fail
                            promises.push(new Promise(async (resolve, reject) => {
                                const cursor = await collection.find({
                                    "points.pointId": stop.stop_id,
                                    time: {
                                        $lt: end_time,
                                        $gt: start_time
                                    }
                                });
                                while (await cursor.hasNext()) {
                                    const doc = await cursor.next();
                                    doc.points.forEach(point => {
                                        for (let i = 0; i < point.passingTimes.length; i++) {
                                            if (point.passingTimes[i].lineId == "39") {
                                                //We need to check the destination!
                                                if (trip.direction == point.passingTimes[i].destination.fr ) {
                                                    EWT.push({
                                                        stop_id: stop.stop_id,
                                                        arrival_time: new Date(date + ", 2019 " + stop.arrival_time + " UTC +01:00").toString(),
                                                        estimated_arrival: new Date(point.passingTimes[i].expectedArrivalTime).toString(),
                                                        analyze_time: new Date(start_time).toString(),
                                                        delay: new Date(point.passingTimes[i].expectedArrivalTime).getTime() - new Date(date + ", 2019 " + stop.arrival_time + " UTC +01:00").getTime(),
                                                    });
                                                    break;
                                                } else if (trip.direction == point.passingTimes[i].destination.fr ) {
                                                    EWT.push({
                                                        stop_id: stop.stop_id,
                                                        arrival_time: new Date(date + ", 2019 " + stop.arrival_time + " UTC +01:00").toString(),
                                                        estimated_arrival: new Date(point.passingTimes[i].expectedArrivalTime).toString(),
                                                        analyze_time: new Date(start_time).toString(),
                                                        delay: new Date(point.passingTimes[i].expectedArrivalTime).getTime() - new Date(date + ", 2019 " + stop.arrival_time + " UTC +01:00").getTime(),
                                                    });
                                                    break;
                                                }
                                            }
                                        }

                                    })
                                }
                                resolve();
                            }))
                        }
                    })
                });
                /*
                Promises are made and an their reference put into an array. We need to wait for all of them to complete in order to be able 
                to create the file. They all fail or succeed
                */
                Promise.all(promises).then(() => {
                    //Now the results have to be measured. The actual results are saved in delay.json
                    fs.writeFile(path.join(__dirname,`/../tmp/files/39_${date.replace(' ', '_')}.json`), JSON.stringify(EWT), (err) => {
                        if (err) reject(err);
                        console.log("(4/6) Writing file complete");
                        let dailey_delay = EWT.reduce((a, b) => a + b.delay, 0);
                        //This contains the average delay
                        if (!fs.existsSync(path.join(__dirname, '/../files/result/delay.json'))) {
                            let result = [];
                            result.push({
                                date: date,
                                delay: new BigNumber(dailey_delay).dividedBy(EWT.length).dividedBy(1000).dividedBy(60).toFixed(2)
                            });
                            fs.writeFile(path.join(__dirname, '/../files/result/delay.json'), JSON.stringify(result), err => {
                                if (err) reject(err);
                                resolve();
                            })
                        } else {
                            fs.readFile(path.join(__dirname, '/../files/result/delay.json'), 'UTF-8', (err, data) => {
                                if (err) reject(err);
                                let result = JSON.parse(data);
                                result.push({
                                    date: date,
                                    delay: new BigNumber(dailey_delay).dividedBy(EWT.length).dividedBy(1000).dividedBy(60).toFixed(2)
                                });
                                fs.writeFile(path.join(__dirname, '/../files/result/delay.json'), JSON.stringify(result), err => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            })
                        }

                    });
                }).catch(error => {
                    client.close()
                    console.error("one of the promises failed, Reason below: \n " + error.stack);
                })

            } catch (error) {
                reject(error);
                client.close()
                console.error(error);
            }

        })
    })
}

//This function will try to solve the GTFS format problem. 26:00 -> 02:00 the next day
function split_hour_if_necessary(time) {
    let split = time.split(':');
    let value = {
        time: time,
        bool: false
    }
    if (parseInt(split[0]) >= 24) {
        split[0] = (parseInt(split[0]) - 24).toString();
        value.time = split[0].toString() + ":" + split[1].toString() + ":" + split[2].toString();
        value.bool = true
    }
    return value
}