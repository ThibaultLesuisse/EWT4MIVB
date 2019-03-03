// load environment variables
require('dotenv').config();
const fs = require('fs');
const https = require('https');
const cron = require('node-cron');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://mongo';
const client = new MongoClient(url);

//Collect data every 20 seconds
cron.schedule('*/20 * * * * *', collectData); 



let date = new Date();



function collectData () {
    const APIKEY = process.env.MIVB_API_KEY;
    let options = {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${APIKEY}`
        }
    }

    fetchData("https://opendata-api.stib-mivb.be/NetworkDescription/1.0/PointByLine/39", options, false).then((stops) => {
    let line_ids = []
    stops.lines.forEach(element => {
        element.points.forEach(id => {
            line_ids.push(id.id)
        })
    });

    let lines_ids_request = "";
    let promises = [];
    for(let i = 0;i<line_ids.length;i++){
        lines_ids_request = lines_ids_request.concat("," + line_ids[i]);
        if( i%10 == 0){
            //remove first ,
            lines_ids_request = lines_ids_request.slice(1);            
            promises.push(fetchData(`https://opendata-api.stib-mivb.be/OperationMonitoring/3.0/PassingTimeByPoint/${encodeURIComponent(String(lines_ids_request))}`, options, true));
            lines_ids_request = ""
        }
    }
    // Wait for all the promises to resolve
    Promise.all(promises).then( data => {
        client.connect((err) => {
            const db = client.db("MIVB");
            let collection = db.collection("MIVB");
            collection.insert(data, (error, result) => {
                if(error)console.error("Error while inserting into the database")
                console.log(result)
            })
        })
    })

}).catch((e) => {
    console.error(e);
    //handle error
});
}


function fetchData(url, options, timestamp) {
    return new Promise((resolve, reject) => {
        https.get(url, options, (res) => {
            let position = "";

            res.on('data', (d) => {
                position += d;
            });
            res.on('end', () => {
                let parsed_position = JSON.parse(position);
                if (timestamp) parsed_position["time"] = date.getTime();
                resolve(parsed_position)
            })

        }).on('error', (e) => {
            console.error(e);
            reject(e);
        });
    })
}