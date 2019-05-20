const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const BigNumber = require('bignumber.js');
require('dotenv').config();

// Database credentials
const user = encodeURIComponent(process.env.MONGO_USERNAME);
const password = encodeURIComponent(process.env.MONGO_PASSWORD);
const authMechanism = 'DEFAULT';
//The default poolSize is only 5, we need way more connections....
const url = `mongodb://${user}:${password}@188.166.90.230/MIVB?authMechanism=${authMechanism}&poolSize=300&minSize=200`;
const client = new MongoClient(url, {
    useNewUrlParser: true
});

module.exports = () => {
    client.connect((err) => {
        if (err) console.log(err);
        db = client.db("MIVB");
        // This array contains all the dates that will be anaylysed! Watch for the format. Make sure new Date() can read it

        let dates = [
            "May 16"
        ]
        new Date()

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
                    
                /*    let check_start_time = split_hour_if_necessary(trip.timetable[0].arrival_time);
                    let check_end_time = split_hour_if_necessary(trip.timetable[trip.timetable.length - 1].arrival_time);
                    let start_time_for_query = new Date(date + ", 2019 " + check_start_time.time + " UTC +01:00").getTime()
                    let end_time_for_query = new Date(date + ", 2019 " + check_end_time.time + " UTC +01:00").getTime();

                    if (check_start_time.bool) {
                        start_time_for_query += 86400000;
                    }
                    if (check_end_time.bool) {
                        end_time_for_query += 86400000;
                    }
                    if (trip.days.includes(day)) {
                        promises.push(new Promise(async (resolve, reject) => {
                            collection.find({
                                time: {
                                    $lt: end_time_for_query,
                                    $gt: (start_time_for_query - 80000)
                                }
                            }).toArray((err, docs) => {
                                if (err) console.log(err)
                                if (docs && docs.length > 0) {
                                    trip.timetable.forEach(timetable => {
                                        let _expected_arrival_time = split_hour_if_necessary(timetable.arrival_time)
                                        let _expected_arrival_time_checked = new Date(date + ", 2019 " + _expected_arrival_time.time + " UTC +01:00").getTime()
                                        if (_expected_arrival_time.bool) {
                                            _expected_arrival_time_checked += 86400000;
                                        }

                                        let _doc = docs.find(doc => doc.points.forEach(point => {
                                                if (point.length > 0 && point.pointId == timetable.stop_id &&
                                                    doc.time > (_expected_arrival_time_checked - 80000) &&
                                                    doc.time < (_expected_arrival_time_checked - 40000)
                                                ){    return true;}}
                                        ));   
                                                
                                        
                                        if(_doc){
                                            for (let i = 0; i < _doc.points[0].passingTimes.length; i++) {
                                                if (_doc.points[1].passingTimes[i].lineId === "39") {
                                                    EWT.push({
                                                        stop_id: timetable.stop_id,
                                                        planned_arrival_time: new Date(_expected_arrival_time_checked).toISOString(),
                                                        estimated_arrival: new Date(_doc.points[0].passingTimes[i].expectedArrivalTime).toISOString(),
                                                        analyze_time: new Date(_expected_arrival_time_checked - 80000).toISOString(),
                                                        ewt: new Date(_doc.points[0].passingTimes[0].expectedArrivalTime).getTime() - (new Date(_expected_arrival_time_checked).getTime())
                                                    });
                                                    break;
                                                }
                                            }
                                        }      
                                    })
                                }
                                resolve();
                            });
                        }));
                    }

                });
                */

                 trip.timetable.forEach((stop, index) => {
                          let start_time_checked = split_hour_if_necessary(stop.arrival_time);
                          let start_time = new Date(date + ", 2019 " + start_time_checked.time.toString() + " UTC +01:00").getTime() - 80000;
                          let end_time = new Date(date + ", 2019 " + start_time_checked.time.toString() + " UTC +01:00").getTime() - 40000;
                          // there are 86 400 000 milisconds in a day. As we first substracted a 24 hours we need to add a day.
                          if (start_time_checked.bool) {
                              start_time = +86400000,
                                  end_time = +86400000
                          }
                          if (trip.days.includes(day)) {
                              //The promise never rejects. That's not good coding practice but we can't risk it. Otherwise promise.all may fail
                              promises.push(new Promise(async (resolve, reject) => {
                                  //This contains the query
                                  await collection.find({
                                      "points.pointId": stop.stop_id,
                                      time: {
                                          $lt: end_time,
                                          $gt: start_time
                                      }
                                  }).toArray((err, docs) => {
                                      console.log(stop.stop_id)
                                      if(err)console.log(err)
                                      if (docs) {
                                          docs.forEach(doc => {
                                              doc.points.forEach(point => {
                                                  console.log(stop.stop_id)
                                                  for (let i = 0; i < point.passingTimes.length; i++) {
                                                    if(point.passingTimes[i].lineId == "39"){
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
                                                  
                                                  
                                              })
                                          });
                                          resolve();
                                      } else {
                                          resolve();
                                      }
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
                    //Once all promises are done we can close the database connections
                    client.close()
                    //Now the results have to be measured. The actual results are saved in delay.json
                    fs.writeFile(`./files/delay/39_${date.replace(' ', '_')}.json`, JSON.stringify(EWT), (err) => {
                        if (err) console.error(err);
                        console.log("Writing file complete");
                        let dailey_delay = EWT.reduce(a, b => a + b.delay);
                        //This contains the average delay
                        if (!fs.existsSync('./files/delay/delay.json')) {
                            let result = [];
                            result.push({
                                date: date,
                                ewt: new BigNumber(ewt).dividedBy(EWT.length).dividedBy(1000).dividedBy(60).toFixed(2),
                                delay: new BigNumber(dailey_delay).dividedBy(EWT.length).dividedBy(1000).dividedBy(60).toFixed(2)
                            });
                            fs.writeFile('./files/delay/delay.json', JSON.stringify(result), err => {
                                if (err) console.log(err)
                            })
                        } else {
                            fs.readFile('./files/delay/delay.json', 'UTF-8', (err, data) => {
                                if (err) console.log(error)
                                let result = JSON.parse(data);
                                result.push({
                                    date: date,
                                    ewt: new BigNumber(ewt).dividedBy(EWT.length).dividedBy(1000).dividedBy(60).toFixed(2),
                                    delay: new BigNumber(dailey_delay).dividedBy(EWT.length).dividedBy(1000).dividedBy(60).toFixed(2)
                                });
                                fs.writeFile('./files/delay/delay.json', JSON.stringify(result), err => {
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