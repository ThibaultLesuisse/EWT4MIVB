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
            let line_timetable = JSON.parse(data);
            let start_date = new Date(2019, 3, 28);
            let end_date = new Date(2019, 3, 28, 23, 59);
            let collection = db.collection("MIVB");
            /* let data_raw = await collection.find({"time": {$lt: start_date.getTime()}});
        let data_parsed = [];
        data_raw.forEach(element => {
            data_parsed.push(element);
        });
		try {let stop_date = await collection.find({
		"points": {$elemMatch: { pointId: line_timetable[0].timetable[0].stop_id}}, 
		$and : [{time: {$gt: new Date("March 28,".concat(line_timetable[0].timetable[0].arrival_time)).getTime()- 10000}},
			{time: {$lt: new Date("March 28,".concat(line_timetable[0].timetable[0].arrival_time)).getTime()+ 10000}}]
	}).toArray(err, data => {
		console.log("i'm in the array block");
		console.log(data);
	
	}); 
		}catch(error) {
		console.log(error);
		}
		*/
            let EWT = [];
            let promises = line_timetable.forEach((trip, index) => {
                trip.timetable.forEach(async (stop) => {
                    return new Promise(async resolve => {
                        let stop_data = await collection.find({
                            "points": {
                                $elemMatch: {
                                    pointId: stop.stop_id
                                }
                            },
                            $and: [{
                                time: {
                                    $lt: new Date("March 28, 2019 " + stop.arrival_time + " GMT -01:00").getTime() + 3000
                                }
                            }, {
                                time: {
                                    $gt: new Date("March 28, 2019 " + stop.arrival_time + " GMT -01:00").getTime() - 3000
                                }
                            }]
                        }).toArray();
			
                        stop_data.forEach(element => {
                            EWT.push({
                                stop_id: stop.stop_id,
                                arrival_time: stop.arrival_time,
                                estimated_arrivals: stop_data
                            });
                            console.log(stop_data);
                        })
			resolve();
                    })

                })
                        });
		Promise.all(promises).then( ()=> {
			
                    fs.writeFile('./ewt/39.json', JSON.stringify(EWT), (err) => {
                        if (err) console.error(err);
                        console.log("Writing file complete");
                    });
		}); 
            })



    } catch (error) {
        console.error(error);
    }
}
