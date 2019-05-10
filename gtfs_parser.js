var fs = require('fs');
let trips = [];
let stoptimes = [];

// REGEXS
const TRIPS_REGEX = /^(?:17),(?:\d{9}),(\d{18})/gm;
const STOP_TIMES_REGEX = /^(\d{18}),(\d{2}:\d{2}:\d{2}),(\d{2}:\d{2}:\d{2}),([^,]{2,})/gm;

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
        let old_match;
        while(match != null){
            if(match[1] != null && trips.indexOf(match[1])!= -1){
                //Here I need the second group from the regular expression which contains the times
		//Also check to see if they belong to the same group
                if(match[1] == old_match){
                    stoptimes[stoptimes.length - 1].timetable.push({ "arrival_time": match[2], "departure_time" : match[3], "stop_id" : match[4]});
                }
		else {
                    stoptimes.push({"trip": match[1], timetable: [{ "arrival_time": match[2], "departure_time" : match[3], "stop_id" : match[4]}]});
                }
                old_match = match[1];
            }   
            match = STOP_TIMES_REGEX.exec(data_stoptimes)
        }
        // Save everything in a file.
        fs.writeFile("./files/39.json", JSON.stringify(stoptimes), (err) => {
            if(err)console.log("Error while writing resulting json file.");
        })
    })
})
