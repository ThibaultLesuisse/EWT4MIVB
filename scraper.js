// load environment variables
require('dotenv').config();
const https = require('https');
const cron = require('node-cron');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');


//Collect data every 20 seconds
cron.schedule('*/20 * * * * *', collectData);

// Database credentials
const user = encodeURIComponent(process.env.MONGO_USERNAME);
const password = encodeURIComponent(process.env.MONGO_PASSWORD);
const authMechanism = 'DEFAULT';
const url = `mongodb://${user}:${password}@mongo/MIVB?authMechanism=${authMechanism}`;
const client = new MongoClient(url);
let db;
client.connect((err) => {
    if(err)console.log(err)
    db = client.db("MIVB");
});

//Global arrays
let line_ids = []

async function collectData() {
    let options = {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${process.env.MIVB_API_KEY}`
        }
    }
    try {
        if (line_ids.length == 0) {
            let stops = await fetchData("https://opendata-api.stib-mivb.be/NetworkDescription/1.0/PointByLine/39", options, false);
		if(stops.lines){
            stops.lines.forEach(element => {
                element.points.forEach(stop => {
                    line_ids.push(stop.id)
                		})
            		});
		}
        }
        let lines_ids_request = "";
        let promises = [];
        for (let i = 0; i < line_ids.length; i++) {
            lines_ids_request = lines_ids_request.concat("," + line_ids[i]);
            if (i % 10 == 0) {
                //remove first ","
                lines_ids_request = lines_ids_request.slice(1);
                promises.push(fetchData(`https://opendata-api.stib-mivb.be/OperationMonitoring/4.0/PassingTimeByPoint/${encodeURIComponent(String(lines_ids_request))}`, options, true));
                lines_ids_request = ""
            }
        }
            // Wait for all the promises to resolve
            Promise.all(promises).then(data => {
                // For one reason the data from the MIVB contains _id properties which messes with the mongodb database. Therefore it is best the remove that property
                data.forEach((result) => {
                    delete result._id
                })
                let collection = db.collection("MIVB");
                collection.insertMany(data, (error, result) => {
                    if (error) console.error("Error while inserting into the database \n" + error)
			
                })
            }).catch((err) => {
                console.log("(Promise.all(): Failed to get results)");
                console.log(err.stack);
            })
        
    } catch (error) {
        console.error(error);
    }
}

function fetchData(url, options, timestamp) {
    return new Promise((resolve, reject) => {
        https.get(url, options, (res) => {
            let position = "";

            res.on('data', (d) => {
                position += d;
            });
            res.on('end', () => {
                try {
                    let parsed_position = JSON.parse(position);
                    if (timestamp) {
                        let date = new Date();
                        parsed_position["time"] = date.getTime();
                    }
                    resolve(parsed_position)
                } catch (error) {
                    reject(error);
                }
            })

        }).on('error', (e) => {
            console.error(e);
            reject(e);
        });
    })
}
