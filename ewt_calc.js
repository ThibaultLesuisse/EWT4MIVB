const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const BigNumber = require('bignumber.js');
const cron = require('node-cron');
require('dotenv').config();

// Database credentials
const user = encodeURIComponent(process.env.MONGO_USERNAME);
const password = encodeURIComponent(process.env.MONGO_PASSWORD);
const authMechanism = 'DEFAULT';
//The default poolSize is only 5, we need way more connections....
const url = `mongodb://${user}:${password}@174.138.107.45/MIVB?authMechanism=${authMechanism}&poolSize=300&minSize=200`;
const client = new MongoClient(url, {
    useNewUrlParser: true
});

//Collect data every 20 seconds
cron.schedule('0 0 12 * *', () => {
    let yesterday = new Date(Date.now()) - 86400000;

    run(_array_of_days);
});

module.exports = () => {
    client.connect((err) => {
        if (err) console.log(err);
        db = client.db("MIVB");
        // This array contains all the dates that will be anaylysed! Watch for the format. Make sure new Date() can read it

        let dates = [
            "May 21"
        ]
        let day = new Date(Date.now()).getDate() - 1;
        let month = new Date(Date.now()).toLocaleString('en-us', { month: 'long' });
        console.log(month + " " + day)
        run(dates);
    });
}

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

async function run(dates) {
    fs.readFile('./files/39.json', async (err, data) => {
        dates.forEach(date => {
            try {
                let day = new Date(date + ", 2019" + " UTC +01:00").getDay();
                if (err) console.log("Failed to read json file")
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
                                  while(await cursor.hasNext()) {
                                    const doc = await cursor.next();
                                    doc.points.forEach(point => {
                                        for (let i = 0; i < point.passingTimes.length; i++) {
                                          if(point.passingTimes[i].lineId == "39") {
                                        //We need to check the destination!
                                            if(trip.direction_id == 0 && point.passingTimes[i].destination.fr === "BAN-EIK"){
                                                EWT.push({
                                                    stop_id: stop.stop_id,
                                                    arrival_time: new Date(date + ", 2019 " + stop.arrival_time + " UTC +01:00").toString(),
                                                    estimated_arrival: new Date(point.passingTimes[i].expectedArrivalTime).toString(),
                                                    analyze_time: new Date(start_time).toString(),
                                                    delay: new Date(point.passingTimes[i].expectedArrivalTime).getTime() - new Date(date + ", 2019 " + stop.arrival_time + " UTC +01:00").getTime(),
                                                });
                                                break;
                                            }else if(trip.direction_id == 1 && point.passingTimes[i].destination.fr === "MONTGOMERY"){
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
                    fs.writeFile(`./files/delay/39_${date.replace(' ', '_')}.json`, JSON.stringify(EWT), (err) => {
                        if (err) console.error(err);
                        console.log(EWT.length);
                        console.log("Writing file complete");
                        let dailey_delay = EWT.reduce((a, b) => a + b.delay, 0);
                        console.log(dailey_delay);
                        //This contains the average delay
                        if (!fs.existsSync('./files/result/delay.json')) {
                            let result = [];
                            result.push({
                                date: date,
                                delay: new BigNumber(dailey_delay).dividedBy(EWT.length).dividedBy(1000).dividedBy(60).toFixed(2)
                            });
                            fs.writeFile('./files/result/delay.json', JSON.stringify(result), err => {
                                if (err) console.log(err)
                            })
                        } else {
                            fs.readFile('./files/result/delay.json', 'UTF-8', (err, data) => {
                                if (err) console.log(error)
                                let result = JSON.parse(data);
                                result.push({
                                    date: date,
                                    delay: new BigNumber(dailey_delay).dividedBy(EWT.length).dividedBy(1000).dividedBy(60).toFixed(2)
                                });
                                fs.writeFile('./files/result/delay.json', JSON.stringify(result), err => {
                                    if (err) console.log(err)
                                });
                            })
                        }

                    });
                }).catch(error => {
                    client.close()
                    console.error("one of the promises failed, Reason below: \n " + error.stack);
                })

            } catch (error) {
                client.close()
                console.error(error);
            } 
        })
    })

}