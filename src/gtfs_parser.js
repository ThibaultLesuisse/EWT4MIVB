const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const StreamZip = require('node-stream-zip');
const https = require('https');


//This needs to happen as soon as possible. This could be redundant though.
require('dotenv').config({
    path: path.join(__dirname, '/../.env')
})


//Can be very slow! As the trips.txt file from the GTFS archive is read line by line. 
//This is done to make sure not too much memory is used. If memory is of no concern feel free to change
module.exports = {
    parse: async () => {
        try {
            //They need to wait for eachother to finish otherwise they are going to fail.
            await check_zip_or_fetch();
            await unzip();
            let lines = await read_lines();
            await parse_gtfs(lines);

        } catch (error) {
            console.error(error);
        }
    },
}
/*
 * Read the file which contains the lines 
 *
 */
function read_lines() {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, "/../lines.json"), (err, data) => {
            if (err) reject(err)
            resolve(JSON.parse(data));
        })
    })
}
/*
 *   Unzips the Zipfile containing the GTFS files and writes them to disk
 */
function unzip() {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(path.join(__dirname, '/../tmp/gtfs/trips.txt'))) {
            const zip = new StreamZip({
                file: path.join(__dirname, '/../tmp/gtfs.zip'),
                storeEntries: true
            });
            // Handle errors
            zip.on('error', err => {
                reject(err)
                console.log(err)
            });
            zip.on('ready', () => {
                zip.extract(null, path.join(__dirname, '/../tmp/gtfs/'), (err, count) => {
                    if (err) reject(err);
                    console.log("(2/6) Zipfile has been extracted")
                    zip.close();
                    resolve();
                });
            });
        } else {
            console.log("(2/6) The gtfs files already seems to be extracted, if not delete everything in the '/tmp/gtfs' directory");
            resolve();
        }
    })

}
// This checks if a date lies bewteen the start and end date
function check_date(calendar) {
    //-1 on the month because the month is the monthIndex!!!
    let start_date = new Date(calendar[8].substring(0, 4), calendar[8].substring(4, 6) - 1, calendar[8].substring(6, 8));
    let end_date = new Date(calendar[9].substring(0, 4), calendar[9].substring(4, 6) - 1, calendar[9].substring(6, 8));
    let yesterday = new Date(Date.now() - 86400000);
    if (yesterday.getTime() >= start_date.getTime() && yesterday.getTime() <= end_date.getTime()) {
        return true
    } else {
        return false
    }
}
async function get_line_id(lines) {
    let lines_file = await fsPromises.readFile(path.join(__dirname, "/../tmp/gtfs/routes.txt"), "utf-8");
    let parsed_lines_file = parse_gtfsfile(lines_file);
    let result = [];
    for (let i = 0; i < lines.length; i++) {
        for (let j = 0; j < parsed_lines_file.length; j++) {
            if (lines[i] == parsed_lines_file[j][1]) {
                result.push({
                    line_id: lines[i],
                    route_id: parsed_lines_file[j][0]
                })
                break;
            }
        }
    }
    return result;
}

/*
 * gets the lines and for each of them parses the necessary files from the GTFS files. Keep in mind that line number is NOT equal to line id!
 */
function parse_gtfs(lines) {
    return new Promise(async (resolve, reject) => {
        try {
            let parsed_calendar = parse_gtfsfile(await fsPromises.readFile(path.join(__dirname, '/../tmp/gtfs/calendar.txt'), 'utf8'));

            let trips_file = await fsPromises.readFile(path.join(__dirname, "/../tmp/gtfs/trips.txt"), "utf-8");
            let parsed_trips_file = parse_gtfsfile(trips_file);

            let stop_times_file = await fsPromises.readFile(path.join(__dirname, '/../tmp/gtfs/stop_times.txt'), 'utf8');
            let stop_names = parse_gtfsfile(await fsPromises.readFile(path.join(__dirname, "/../tmp/gtfs/stops.txt"), "utf-8"));

            let parsed_stop_times = parse_gtfsfile(stop_times_file);



            let line_ids = await get_line_id(lines);
            let trips = [];
            for (let j = 0; j < line_ids.length; j++) {
                for (let i = 0; i < parsed_trips_file.length; i++) {
                    if (line_ids[j].route_id == parsed_trips_file[i][0]) {
                        for (let index = 0; index < parsed_calendar.length; index++) {
                            if (parsed_calendar[index][0] === parsed_trips_file[i][1]) {
                                let _days = days(parsed_calendar[index].slice(1, 8));
                                if (check_date(parsed_calendar[index])) {
                                    let stoptimes = [];
                                    for (let k = 0; k < parsed_stop_times.length; k++) {
                                        if (parsed_stop_times[k][0] == parsed_trips_file[i][2] && parsed_stop_times[k][3] != "1042") {
                                            stoptimes.push({
                                                "arrival_time": parsed_stop_times[k][1],
                                                "departure_time": parsed_stop_times[k][2],
                                                "stop_id": parsed_stop_times[k][3],
                                                "stop_sequence": parsed_stop_times[k][4]
                                            })
                                        }
                                    }
                                    trips.push({
                                        line_id: line_ids[j].line_id,
                                        service_id: parsed_trips_file[i][1],
                                        trip_id: parsed_trips_file[i][2],
                                        days: _days,
                                        direction: parsed_trips_file[i][3].slice(1, parsed_trips_file[i][3].length - 1),
                                        direction_id: parsed_trips_file[i][4],
                                        timetable: stoptimes
                                    });
                                }
                            }
                        }
                    }
                }
                for (let i = 0; i < trips.length; i++) {
                    for (let j = 0; j < trips[i].timetable.length; j++) {
                        for (let k = 0; k < stop_names.length; k++) {
                            if (stop_names[k][0] == trips[i].timetable[j].stop_id) {
                                trips[i].timetable[j].stop_name = stop_names[k][2].slice(1, stop_names[k][2].length - 1);
                                
                                if (trips[i].timetable[j].stop_id == "0089") {
                                    trips[i].timetable[j].stop_id = "89"
                                }
                                //Cleaning up the mess made by MIVB. In the GTFS files they have stop ID that end with F and G but not in their real-time data. So we need to get
                                //rid of the F and the G which occur frequently...
                                if (trips[i].timetable[j].stop_id.length > 4) {
                                    trips[i].timetable[j].stop_id = trips[i].timetable[j].stop_id.slice(0, 4);
                                }
                                break;
                            }

                          

                        }
                    }
                }

                //We have to await for it to end otherwise trips will be changed!
                await estimate_ewt(trips, line_ids[j].line_id);
                await fsPromises.writeFile(path.join(__dirname, `/../tmp/files/${line_ids[j].line_id}.json`), JSON.stringify(trips));
                console.log(`(3/6) Line ${line_ids[j].line_id} done`);
                trips = [];
            }
            resolve();
        } catch (error) {
            reject(error);
        }
    })
}

/*
 * This function will try and measure the EWT on a line using the GTFS files. If you are reading this it is prone to errors... The gtfs files contain 
 *  Weirdness. If you want an example check the lasts trips on a line on a sunday. 
 */
function estimate_ewt(stoptimes, line) {
    return new Promise(async (resolve, reject) => {
        //This needs to be sorted... otherwise it is useless
        stoptimes.sort((a, b) => {
            let checked_time_a = split_hour_if_necessary(a.timetable[0].arrival_time);
            let checked_time_b = split_hour_if_necessary(b.timetable[0].arrival_time);

            let time_a = new Date(checked_time_a.time + " May 2, 2019").getTime();
            let time_b = new Date(checked_time_b.time + " May 2, 2019").getTime();


            if (checked_time_a.bool) time_a = new Date(checked_time_a.time + " May 3, 2019").getTime();
            if (checked_time_b.bool) time_b = new Date(checked_time_b.time + " May 3, 2019").getTime();


            // using May 2 is not going to influence the results as it just need a full date in order to recognize it as a date. It sorts based on hour so the day doens't matter
            if (time_a > time_b) {
                return 1
            } else {
                return -1
            }
        });



        // We need to calculate the time bewteen two trams. We need to be sure that are headed in the same direction and starting from the same point
        // and working on the same days. As the array is sorted this should be the closest match but it's dangerous to assume that....
        let day = new Date(Date.now() - 86400000).getDay();
        let results = {
            line: line,
            date: null,
            SWT: 0,
            stops: []
        }
        let found = false;

        for (let i = 0; i < stoptimes.length; i++) {
            if (stoptimes[i].days.includes(day)) {
                for (let j = 0; j < stoptimes[i].timetable.length; j++) {
                    for (let k = i + 1; k < stoptimes.length; k++) {
                        if (!found && stoptimes[k].days.includes(day)) {
                            for (let l = 0; l < stoptimes[k].timetable.length; l++) {
                                if (stoptimes[i].timetable[j].arrival_time != stoptimes[k].timetable[l].arrival_time &&
                                    stoptimes[i].timetable[j].stop_name == stoptimes[k].timetable[l].stop_name &&
                                    stoptimes[i].direction_id == stoptimes[k].direction_id) {
                                    let stop = results.stops.find(stop => stop.stop_id == stoptimes[k].timetable[l].stop_id)
                                    if (stop) {
                                        let checked_time_b = split_hour_if_necessary(stoptimes[k].timetable[l].arrival_time);
                                        let checked_time_a = split_hour_if_necessary(stoptimes[i].timetable[j].arrival_time);
                                        let time_a = new Date(checked_time_a.time + " May 2, 2019").getTime();
                                        let time_b = new Date(checked_time_b.time + " May 2, 2019").getTime();

                                        if (checked_time_a.bool) time_a = new Date(checked_time_a.time + " May 3, 2019").getTime();
                                        if (checked_time_b.bool) time_b = new Date(checked_time_b.time + " May 3, 2019").getTime();

                                        stop.sum += time_b - time_a;
                                        stop.pow += Math.pow((time_b - time_a), 2);
                                    } else {
                                        results.stops.push({
                                            stop_id: stoptimes[k].timetable[l].stop_id,
                                            sum: 0,
                                            pow: 0,
                                        })
                                    }
                                    found = true;
                                    break;
                                }
                            }
                        } else {
                            found = false;
                            break;
                        }

                    }
                }
            }

        }
        let total_SWT = 0;
        for (let i = 0; i < results.stops.length; i++) {
            results.stops[i].SWT = ((results.stops[i].pow / (2 * results.stops[i].sum) / 60000));
            total_SWT += ((results.stops[i].pow / (2 * results.stops[i].sum) / 60000));
            delete results.stops[i].pow;
            delete results.stops[i].sum;
        }
        results.SWT = (total_SWT / results.stops.length);

        fs.writeFile(path.join(__dirname, `/../files/${line}_${new Date(Date.now() - 86400000).getMonth()}_${new Date(Date.now() - 86400000).getDate()}.json`), JSON.stringify(results), (err) => {
            if (err) console.log("[gtfs_parser.js:226] Error writing file\n" + err.stack);
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
            'Authorization': `Bearer ${process.env.MIVB_API_KEY_0}`
        }
    }
    return new Promise((resolve, reject) => {
        fs.exists(path.join(__dirname, '/../tmp/gtfs.zip'), (bool) => {
            // -k on their example curl call shows that they selfsigned their certificate. 
            process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
            if (!bool) {
                //create writestream to write zipfile on disk
                let file = fs.createWriteStream(path.join(__dirname, '/../tmp/gtfs.zip'));
                const req = https.get(options, res => {
                    res.on('data', (d) => {
                        file.write(d);
                    });
                    res.on('error', err => reject(err))
                    res.on('end', () => {
                        file.end();
                        console.log("(1/6) GTFS file has been downloaded but needs to be extracted")
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
//GTFS-files are easy to parse, no need for external parser
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
        // This looks weird but but day 6 in the GTFS files is not day 6 in Javascript terms. 
        // The weeks start at a different day. Check out the GTFS-files where monday = 0 and the Javascript Date class where 0 is sunday
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