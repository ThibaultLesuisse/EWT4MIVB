var fs = require('fs');
let trips = [];
let stoptimes = [];

// REGEXS
const TRIPS_REGEX = /^(?:17),(?:\d{9}),(\d{18})/gm;
const STOP_TIMES_REGEX = /^(\d{18})/gm;

fs.readFile("./gtfs/trips.txt","utf8", (err, data) => {
    if(err)console.error(err);

   match = TRIPS_REGEX.exec(data);
    while(match != null){
        if(match[1] != null)trips.push(match[1]);
        match = TRIPS_REGEX.exec(data);
    }
    fs.readFile("./gtfs/stop_times.txt", "utf-8", (err, data_stoptimes) => {
        if(err)console.error(err);
        match = STOP_TIMES_REGEX.exec(data_stoptimes);
        while(match != null){
            if(match[1] != null && trips.indexOf(match[1])!= -1){
                stoptimes.push(match[1]);
            }
            match = STOP_TIMES_REGEX.exec(data_stoptimes)
        }
        console.log(stoptimes);
    })
})