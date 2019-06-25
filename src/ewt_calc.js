const fs = require('fs');
const path = require('path');
const mongo = require('./utils/mongo');
const BigNumber = require('bignumber.js');
require('dotenv').config({ path: path.join(__dirname, '/../.env')});

module.exports = () => {
    return new Promise(async (resolve, reject) => {

            // We need to get all the data processed from the day before! 
            let day = new Date(Date.now() - 172800000 ).getDate();
            // Also substract a day from the month. Otherwise june 1 will become june 30
            let month = new Date(Date.now()- 172800000).toLocaleString('en-us', {
                month: 'long'
            });
            try {
                await run(month + " " + day);

            } catch (error) {
                reject(error)
            }
            resolve()
        
    })

}


async function run(date) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, '/../tmp/files/39.json'), async (err, data) => {
            try {
                if (err) reject(err)
                let day = new Date(date + ", 2019" + " UTC +01:00").getDay();
                //If the file was not read it makes no sense to continue
                let line_timetable = JSON.parse(data);
                let EWT = [];
                let promises = [];
                line_timetable.forEach(trip => {
                    trip.timetable.forEach((stop, index) => {

                        let start_time_checked = split_hour_if_necessary(stop.arrival_time);
                        let start_time = new Date(date + ", 2019 " + start_time_checked.time.toString() + " UTC +02:00").getTime() - 70000;
                        let end_time = new Date(date + ", 2019 " + start_time_checked.time.toString() + " UTC +02:00").getTime() - 40000;
                        // there are 86 400 000 milisconds in a day. As we first substracted a 24 hours we need to add a day.
                        if (start_time_checked.bool) {
                            start_time = +172800000,
                                end_time = +172800000
                        }
                        //Make sure that the correct schedules are used. Only the schedule of sunday for sundays
                        if (trip.days.includes(day)) {
                            //The promise never rejects. That's not good coding practice but we can't risk it. Otherwise promise.all may fail
                            promises.push(new Promise(async (resolve, reject) => {
                                let db = mongo.use();
                                const cursor = await db.collection("MIVB").find({
                                    "points.pointId": stop.stop_id,
                                    time: {
                                        $lt: end_time,
                                        $gt: start_time
                                    }
                                });
                                try {
                                    while (await cursor.hasNext()) {
                                        const doc = await cursor.next();
                                            doc.points.forEach(point => {
                                                for (let i = 0; i < point.passingTimes.length; i++) {
                                                    if (point.passingTimes[i].lineId == "39" ) {
                                                        //We need to check the destination!
                                                        if (trip.direction == point.passingTimes[i].destination.fr ) {
                                                            EWT.push({
                                                                stop_id: stop.stop_id,
                                                                arrival_time: new Date(date + ", 2019 " + stop.arrival_time + " UTC +02:00").toString(),
                                                                estimated_arrival: new Date(point.passingTimes[i].expectedArrivalTime).toString(),
                                                                analyze_time: new Date(start_time).toString(),
                                                                delay: new Date(point.passingTimes[i].expectedArrivalTime).getTime() - new Date(date + ", 2019 " + stop.arrival_time + " UTC +02:00").getTime(),
                                                            });
                                                            break;
                                                        } 
                                                    }
                                                }
                                            })
                                        
                                      
                                    }
                                } catch (error) {
                                    console.error("[ewt_calc.js:102]Database error\n" + error.stack)
                                    reject(error)
                                } finally {
                                    //cursor.close();
                                    resolve();
                                }        
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
                            let delay = new BigNumber(dailey_delay);
                            
                            result.push({
                                date: date,
                                delay: delay.dividedBy(EWT.length).dividedBy(1000).dividedBy(60).toFixed(2)
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
                                    delay: delay.dividedBy(EWT.length).dividedBy(1000).dividedBy(60).toFixed(2)
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
                    client.close()
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
