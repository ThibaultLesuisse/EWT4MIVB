const fs = require('fs');
const StreamZip = require('node-stream-zip');
const https = require('https');
const readline = require('readline');

require('dotenv').config();

module.exports = {
    parse: async () => {
        try {
            //They need to wait for eachother to finish otherwise they are going to fail.
            await check_zip_or_fetch();
            await unzip();
            await parse_gtfs();

        } catch (error) {
            console.error(error);
        }
    },
}

function unzip() {
    if (fs.readdir('./tmp/gtfs', (err, files) => files.length > 0 ? true : false)) {
        const zip = new StreamZip({
            file: './tmp/gtfs.zip',
            storeEntries: true
        });
        // Handle errors
        zip.on('error', err => {
            console.log(err)
        });
        zip.on('ready', () => {
            zip.extract(null, './tmp/gtfs/', (err, count) => {
                console.log(err ? 'Extract error' : `Extracted ${count} entries`);
                console.log("Zipfile has been extracted")
                zip.close();
            });
        });
    } else {
        console.log("The gtfs files already seem to be extracted, if not delete everything in the '/tmp/gtfs' directory");
    }
}
//GTFS-files are easy to parse, no need for difficult parser
function parse_gtfsfile(data) {
    let _data = data.split("\n");
    let _parsed_result = [];
    _data.forEach(element => {
        _parsed_result.push(element.split(","));
    });
    return _parsed_result;
}
//We need to know what day the service is running. Each day is different (for example weekends)
function days(slice) {
    let result = [];
    slice.forEach((day, index) => {
        if (index === 6 && day === "1") result.push(0);
        if (index === 0 && day === "1") result.push(1);
        if (index === 1 && day === "1") result.push(2);
        if (index === 2 && day === "1") result.push(3);
        if (index === 3 && day === "1") result.push(4);
        if (index === 4 && day === "1") result.push(5);
        if (index === 5 && day === "1") result.push(6);
    });
    return result;
}

function parse_gtfs() {
    let trips = [];
    let stoptimes = [];
    // REGEXS
    const TRIPS_REGEX = /^(?:17),(\d{9}),(\d{18})/gm;
    let data = fs.readFileSync("./tmp/gtfs/trips.txt", "utf8")
        let parsed_calendar = parse_gtfsfile(fs.readFileSync('./tmp/gtfs/calendar.txt', 'utf8'));

        match = TRIPS_REGEX.exec(data);
        while (match != null) {
            if (match[1] != null) {
                for (let index = 0; index < parsed_calendar.length; index++) {
                    if (parsed_calendar[index][0] === match[1]) {
                        let _days = days(parsed_calendar[index].slice(1, 8));
                        trips.push({
                            service_id: match[1],
                            trip_id: match[2],
                            days: _days
                        });
                    }
                }
            }
            match = TRIPS_REGEX.exec(data);
        }
        //To make sure the memory footprint is as small as possible we only take one file in memory. The other is read line by line.
        //Let's hope the GC does it's magic 
        const rl = readline.createInterface({
            input: fs.createReadStream('./tmp/gtfs/stop_times.txt'),
            crlfDelay: Infinity
        });
        //going line by line
        rl.on('line', (stop_time) => {
            let parsed_stop_times = stop_time.split(',');
            let trip = trips.find(_trip => {
                return _trip.trip_id == parsed_stop_times[0]
            });
            //We also should take into account the date, gtfs are only valid for a certain amount of time
            if (trip) {
               let existing_trip = stoptimes.find(element => {
                    return element.trip == trip.trip_id
                })
                if(existing_trip){
                    existing_trip.timetable.push({                       
                            "arrival_time": parsed_stop_times[1],
                            "departure_time": parsed_stop_times[2],
                            "day_after_flag": true,
                            "stop_id": parsed_stop_times[3],  
                    })
                }else {
                    stoptimes.push({
                        "trip": trip.trip_id,
                        days: trip.days,
                        service_id: trip.service_id,
                        timetable: [{
                            "arrival_time": parsed_stop_times[1],
                            "departure_time": parsed_stop_times[2],
                            "day_after_flag": true,
                            "stop_id": parsed_stop_times[3],
                        }]
                    });
                }
               
            }

        });
        rl.on('close', () => {
            fs.writeFile("./files/39.json", JSON.stringify(stoptimes), (err) => {
                if (err) console.log("Error while writing resulting json file.");
                console.log("Done, the EWT calculator can be started!")
            })
        })
    
}

function check_zip_or_fetch() {

    // Options for http request
    const options = {
        hostname: 'opendata-api.stib-mivb.be',
        port: 443,
        path: '/Files/2.0/Gtfs',
        method: 'GET',
        headers: {
            'Accept': 'application/zip',
            'Authorization': `Bearer ${process.env.MIVB_API_KEY}`
        }
    }
    return new Promise((resolve, reject) => {
        fs.exists('./tmp/gtfs.zip', (bool) => {
            process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
            if (!bool) {
                //create writestream to write zipfile on disk
                let file = fs.createWriteStream("./tmp/gtfs.zip");
                const req = https.get(options, res => {
                    console.log(`STATUS: ${res.statusCode}`);
                    res.on('data', (d) => {
                        file.write(d);
                    });
                    res.on('error', err => reject(err))
                    res.on('end', () => {
                        file.end();
                        console.log("GTFS file has been downloaded but needs to be extracted")
                        resolve();
                    })
                })
                req.on('error', (e) => {
                    console.error(`problem with request: ${e.message}`);
                    reject(e)
                });
            } else {
                console.log("Found GTFS zip file")
                resolve();
            }
        });
    });
}