const fs = require('fs');
const StreamZip = require('node-stream-zip');
const https = require('https');
const readline = require('readline');
const array = require("./src/utils/array");

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
    const TRIPS_REGEX = /^(?:17),(\d{9}),(\d{18}),(.+),(0|1)/gm;
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
                            days: _days,
                            direction_id: match[4]
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
                //On their server 0089 is 89 and as the values are saved as strings this can be a problem later on. Its ugly but it is the only
                //stop of the MIVB that is formatted this way. A seperate function for only 1 possible is value is too much overhead.
                if(parsed_stop_times[3] == "0089")parsed_stop_times[3] = "89"
                if(existing_trip){
                    existing_trip.timetable.push({                       
                            "arrival_time": parsed_stop_times[1],
                            "departure_time": parsed_stop_times[2],
                            "stop_id": parsed_stop_times[3],
                            "stop_sequence": parsed_stop_times[4]  
                    })
                }else {
                    stoptimes.push({
                        "trip": trip.trip_id,
                        direction_id: trip.direction_id,
                        days: trip.days,
                        service_id: trip.service_id,
                        timetable: [{
                            "arrival_time": parsed_stop_times[1],
                            "departure_time": parsed_stop_times[2],
                            "stop_id": parsed_stop_times[3],
                            "stop_sequence": parsed_stop_times[4]  
                        }]
                    });
                }  
            }
        });
        rl.on('close', () => {
            estimate_ewt(stoptimes).then( () => console.log("Done estimating EWT, written result to file"));
            fs.writeFile("./files/39.json", JSON.stringify(stoptimes), (err) => {
                if (err) console.log("Error while writing resulting json file.");
                console.log("Done, the EWT calculator can be started!")
            })
        })
    
}
/*
* This function will try and measure the EWT on a line using the GTFS files. If you are reading this it is prone to errors... The gtfs files contain 
*  Weirdness. If you want an example check the lasts trips on a line on a sunday. 
*/
function estimate_ewt(stoptimes){
    return new Promise((resolve, reject) => {
            //This needs to be sorted... otherwise it is useless
            stoptimes.sort((a,b) => {
                if(new Date(a.timetable[0].arrival_time + " May 2, 2019").getTime() > new Date(b.timetable[0].arrival_time + " May 2, 2019").getTime()){
                    return 1
                }else {
                    return -1
                }
            });
            // We need to calculate the time bewteen two trams. We need to be sure that are headed in the same direction and starting from the same point
            // and working on the same days. As the array is sorted this should be the closest match but it's dangerous to assume that....
            let _values = [];
            stoptimes.forEach(a => {
                let _value = stoptimes.map(b => {
                    if( array(a.days, b.days) &&
                        a.timetable[0].stop_id == b.timetable[0].stop_id &&
                        a.direction_id == b.direction_id && 
                        a != b &&
                        new Date(b.timetable[0].arrival_time + " May 2, 2019").getTime() > new Date(a.timetable[0].arrival_time + " May 2, 2019").getTime()
                        ){
                            let c = new Date(b.timetable[0].arrival_time + " May 2, 2019").getTime() - new Date(a.timetable[0].arrival_time + " May 2, 2019").getTime();
                            if(c && typeof c === "number") return c
                        }
                })
                _value.sort((a,b) => {
                    if(a < b){
                        return -1
                    }
                    else{
                        return 1
                    }
                })
                if(_value[0])_values.push(_value[0]);
            });
            let total = _values.reduce((accumulator, number) => accumulator + number, 0);
            fs.writeFile("./files/39_ewt.json", JSON.stringify({ewt: ((total/60000)/_values.length)}), (err) => {
                if(err)console.log("error writing file");
                resolve();
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
            // -k on their example curl call shows that they selfsigned their certificate. 
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