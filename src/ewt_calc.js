const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const mongo = require('./utils/mongo');
const BigNumber = require('bignumber.js');
require('dotenv').config({
    path: path.join(__dirname, '/../.env')
});

module.exports = () => {
    return new Promise(async (resolve, reject) => {
        // We need to get all the data processed from the day before! 
        let day = new Date(Date.now() - 86400000).getDate();
        // Also substract a day from the month. Otherwise june 1 will become june 30
        let month = new Date(Date.now() - 86400000).toLocaleString('en-us', {
            month: 'long'
        });
        try {
            let lines = JSON.parse(await fsPromises.readFile(path.join(__dirname, "/../lines.json")));
            let promises = [];
            lines.forEach((line) => {
                promises.push(new Promise(async (res, rej) => {
                    await run(month + " " + day, line);
                    res();
                }))
            });
            //Wait for all lines to finish!
            await Promise.all(promises);
            resolve();

        } catch (error) {
            reject(error)
        }

    })

}


async function run(date, line) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, `/../tmp/files/${line}.json`), async (err, data) => {
            try {
                if (err) reject(err)
                let day = new Date(Date.now() - 86400000).getDay();
                //If the file was not read it makes no sense to continue
                let line_timetable = JSON.parse(data);
                let EWT = [];
                let promises = [];
                line_timetable.forEach(trip => {
                    trip.timetable.forEach(stop => {

                        let start_time_checked = split_hour_if_necessary(stop.arrival_time);
                        let start_time = new Date(date + ", 2019 " + start_time_checked.time.toString() + " UTC +02:00").getTime() - 60000;
                        let end_time = new Date(date + ", 2019 " + start_time_checked.time.toString() + " UTC +02:00").getTime() - 30000;
                        // there are 86 400 000 milisconds in a day. As we first substracted a 24 hours we need to add a day.
                        if (start_time_checked.bool) {
                            start_time = +86400000,
                                end_time = +86400000
                        }
                        console.log('i ran', day, date)
                        //Make sure that the correct schedules are used. Only the schedule of sunday for sundays
                        if (trip.days.includes(day)) {
                            console.log('Passed days')
                            //The promise never rejects. That's not good coding practice but we can't risk it. Otherwise promise.all may fail
                            promises.push(new Promise(async (_resolve, _reject) => {
                                let db = mongo.use();
                                const cursor = await db.collection("MIVB").find({
                                    time: {
                                        $lt: end_time,
                                        $gt: start_time
                                    }
                                });
                                try {
                                    while (await cursor.hasNext()) {
                                       let doc = await cursor.next();
                                        if (doc.points) {
                                            doc.points.forEach(point => {
                                                if (point.pointId == stop.stop_id) {
                                                    for (let i = 0; i < point.passingTimes.length; i++) {
                                                    
                                                        if (point.passingTimes[i].lineId == line) {
                                                            //We need to check the destination!
                                                            console.log("found one")
                                                            if (trip.direction == point.passingTimes[i].destination.fr) {
                                                                EWT.push({
                                                                    stop_id: stop.stop_id,
                                                                    stop_name: stop.stop_name,
                                                                    trip_id: trip.trip_id,
                                                                    stop_sequence: stop.stop_sequence,
                                                                    arrival_time: new Date(date + ", 2019 " + stop.arrival_time + " UTC +02:00").toString(),
                                                                    estimated_arrival: new Date(point.passingTimes[i].expectedArrivalTime).toString(),
                                                                    analyze_time: new Date(doc.time).getTime(),
                                                                    direction: point.passingTimes[i].destination.fr,
                                                                    delay: new Date(point.passingTimes[i].expectedArrivalTime).getTime() - new Date(date + ", 2019 " + stop.arrival_time + " UTC +02:00").getTime(),
                                                                });
                                                                break;
                                                            }
                                                        }
                                                    }
                                                }
                                            })
                                        }
                                    }
                                } catch (error) {
                                    console.error("[ewt_calc.js:102]Database error\n" + error.stack)
                                    _reject(error)
                                } finally {
                                    _resolve();
                                }
                            }))
                        }
                    })
                });
                /*
                Promises are made and an their reference put into an array. We need to wait for all of them to complete in order to be able 
                to create the file. They all fail or succeed
                */
                Promise.all(promises).then(async () => {
                    EWT.sort((a, b) => {
                        if (a.analyze_time > b.analyze_time) {
                            return 1
                        } else {
                            return -1
                        }
                    });
                    let results_file = JSON.parse(await fsPromises.readFile(path.join(__dirname, `/../files/${line}_${new Date(Date.now() - 86400000).getMonth()}_${new Date(Date.now() - 86400000).getDate()}.json`), "utf-8"));
                    console.log(EWT.length);
                    //Add the date;
                    results_file.date = date;

                    for (let i = 0; i < EWT.length; i++) {
                        for (let j = i + 1; j < EWT.length; j++) {
                            if (EWT[i].stop_id == EWT[j].stop_id &&
                                (new Date(EWT[i].estimated_arrival).getTime() < new Date(EWT[j].estimated_arrival).getTime()) &&
                                EWT[i].trip_id != EWT[j].trip_id
                            ) {
                                let stop = results_file.stops.find(stop => stop.stop_id == EWT[j].stop_id)
                                if (stop) {
                                    if (!stop.sum) stop.sum = 0;
                                    if (!stop.pow) stop.pow = 0;
                                    stop.sum += (new Date(EWT[j].estimated_arrival).getTime() - new Date(EWT[i].estimated_arrival).getTime());
                                    stop.pow += (Math.pow((new Date(EWT[j].estimated_arrival).getTime() - new Date(EWT[i].estimated_arrival).getTime()), 2));
                                }
                                break;
                            }
                        }
                    }
                    let total_AWT = 0;
                    for (let i = 0; i < results_file.stops.length; i++) {
                        results_file.stops[i].AWT = ((results_file.stops[i].pow / (2 * results_file.stops[i].sum) / 60000));
                        results_file.stops[i].EWT = (results_file.stops[i].AWT - results_file.stops[i].SWT);
                        if(results_file.stops[i].AWT)total_AWT += ((results_file.stops[i].pow / (2 * results_file.stops[i].sum) / 60000));
                        if(!results_file.stops[i].AWT)delete results_file.stops[i]
                        if(results_file.stops[i]){
                            delete results_file.stops[i].pow;
                            delete results_file.stops[i].sum;
                        }
                        
                    }
                    results_file.AWT = (total_AWT / results_file.stops.length);
                    try {
                        await fsPromises.writeFile(path.join(__dirname, `/../files/${line}_${new Date(Date.now() - 86400000).getMonth()}_${new Date(Date.now() - 86400000).getDate()}.json`), JSON.stringify(results_file));
                    } catch (error) {
                        console.log(error);
                    }

                    //Now the results have to be measured. The actual results are saved in delay.json
                    fs.writeFile(path.join(__dirname, `/../files/${line}_${date.replace(' ', '_')}.json`), JSON.stringify(EWT), (err) => {
                        if (err) reject(err);
                        console.log("(4/6) Writing file complete");
                        let dailey_delay = EWT.reduce((a, b) => a + b.delay, 0);

                        //This contains the average delay
                        if (!fs.existsSync(path.join(__dirname, '/../files/result/delay.json'))) {
                            let result = [];
                            let delay = new BigNumber(dailey_delay);

                            result.push({
                                date: date,
                                delay: delay.dividedBy(EWT.length).dividedBy(1000).dividedBy(60).toFixed(2),
                                line: line
                            });
                            fs.writeFile(path.join(__dirname, '/../files/result/delay.json'), JSON.stringify(result), err => {
                                if (err) reject(err);
                                //Closing the connections isn't advised but otherwise the topology will break
                                //client.close()
                                resolve();

                            })
                        } else {
                            fs.readFile(path.join(__dirname, '/../files/result/delay.json'), 'UTF-8', (err, data) => {
                                if (err) reject(err);
                                let result = JSON.parse(data);
                                let delay = new BigNumber(dailey_delay);
                                result.push({
                                    date: date,
                                    delay: delay.dividedBy(EWT.length).dividedBy(1000).dividedBy(60).toFixed(2),
                                    line: line
                                });
                                fs.writeFile(path.join(__dirname, '/../files/result/delay.json'), JSON.stringify(result), err => {
                                    if (err) reject(err);
                                    //client.close()
                                    resolve();
                                });
                            })
                        }

                    });
                }).catch(error => {
                    console.error("one of the promises failed, Reason below: \n " + error.stack);
                })

            } catch (error) {
                reject(error);
                //client.close()
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