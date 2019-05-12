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
        "March 1",
        "March 2",
        "March 3",
        "March 4",
        "March 5",
        "March 6",
        "March 7",
        "March 8",
        "March 9",
        "March 10",
        "March 11",
        "March 12",
        "March 13",
        "March 14",
        "March 15",
        "March 16",
        "March 17",
        "March 18",
        "March 19",
        "March 20",
        "March 21",
        "March 22",
        "March 24",
        "March 25",
        "March 26",
        "March 27",
        "March 28",
        "March 29",
        "March 30",  
    ]
    a(dates);
});

async function a(dates) {
    dates.forEach(date => {
        try {
            fs.readFile('./files/39.json', async (err, data) => {
                if(err)console.log("Failed to read json file")
                let line_timetable = JSON.parse(data);
                let collection = db.collection("MIVB");
                let EWT = [];
                let promises = [];        
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
                                        $lt: new Date( date + ", 2019 " + stop.arrival_time + " UTC +01:00").getTime() + 1000
                                    }
                                }, {
                                    time: {
                                        $gt: new Date(date + ", 2019 " + stop.arrival_time + " UTC +01:00").getTime() - 1000
                                    }
                                }]
                                }).toArray((err, docs) => {
                                if (err) reject(err)
                                if (Array.isArray(docs) && docs.length > 0) {
                                    docs.forEach(element => {
                                        if(element.points[0].passingTimes.length > 0){EWT.push({
                                            stop_id: stop.stop_id,
                                            arrival_time: new Date(date + ", 2019 " + stop.arrival_time + " UTC +01:00").toDateString(),
                                            estimated_arrival: new Date(element.points[0].passingTimes[0].expectedArrivalTime).getTime(),
                                            ewt: new Date(element.points[0].passingTimes[0].expectedArrivalTime).getTime() - new Date(date + ", 2019 " + stop.arrival_time + " UTC +01:00").getTime()
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
                            if(!fs.existsSync('./ewt/delay.json')){
                                let result = [];
                                result.push({date: ((EWT/json.length)/1000)/60});
                                fs.writeFile('./ewt/delay.json', JSON.stringify({
                                    date: ((EWT/json.length)/1000)/60
                                }))
                            }
                            else{
                                fs.readFile('./ewt/delay.json', 'UTF-8', (err, data) => {
                                    if(err)console.log(error)
                                    fs.writeFile('./ewt/delay.json', JSON.parse(data)[date] = ((EWT/json.length)/1000)/60);
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