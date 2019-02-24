const https = require('https');
const APIKEY = "efff9a418c9b8ff16056850bd62e8caf";
let options = {
    headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${APIKEY}`
    }
}

https.get("https://opendata-api.stib-mivb.be/OperationMonitoring/3.0/PassingTimeByPoint/5528", options, (res) => { 
    let position;
    let date = new Date();

    res.on('data', (d) => {
               position += d;
            });
    res.on('end', () => {
        position["time"] = date.getHours();
        console.log(date.getHours())
        console.log(position)
    })
            
}).on('error', (e) => {
    console.error(e);
});
 