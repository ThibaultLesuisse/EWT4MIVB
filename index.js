const express = require("express");
const path = require('path');
const app = express();
const cors = require('cors');
const fs = require('fs').promises;

app.use(cors())
app.options('*', cors());

app.use(express.static(path.join(__dirname, 'front/build')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'front/build', 'index.html'));
});


app.get("/delay", (req, res) => {
    fs.readFile('./files/result/delay.json', (err, data) => {
        if (err) res.send({
            error: 1,
            error_text: "couldn't find the delay.json file"
        })
        res.send(JSON.parse(data));

    })
})

app.get("/ewt/:line/:date", async (req, res) => {
        try {
            let ewt_data =await fs.readFile(`./files/${req.params.line}_${new Date(parseInt(req.params.date)).getMonth()}_${new Date(parseInt(req.params.date)).getDate()}.json`, 'utf-8');
            res.json(JSON.parse(ewt_data));
        } catch (error) {
            console.log(error);
            res.send('oeps');
        }
    
})

app.get("/ewt/:line/:start_date/:end_date", async (req, res) => {
    let start_date = new Date(parseInt(req.params.start_date))
    let end_date = new Date(parseInt(req.params.end_date));
    

    let results = {}
    let amount = 0
    let promises = [];
    while (start_date.getTime() <= end_date.getTime()) {
        try {
            promises.push(new Promise(async (resolve, reject) => {
                let file
                try {   
                file = await fs.readFile(`./files/${req.params.line}_${end_date.getMonth()}_${end_date.getDate()}.json`, 'utf-8');
                } catch (error) {
                    console.log(error);
                    throw(error)
                }
                if (amount == 0) {
                    results = JSON.parse(file);
                } else {
                    let parsed_file = JSON.parse(file);
                    
                    parsed_file.stops.forEach(stop => {
                        let _stop = results.stops.find(a => a.stop_id == stop.stop_id);
                            if( _stop &&_stop.SWT && _stop.EWT && _stop.AWT){
                                _stop.SWT += stop.SWT,
                                _stop.EWT += stop.EWT,
                                _stop.AWT += stop.AWT
                            }
                            else {
                                amount --
                            }
                            
                    });
                } 
                amount++
                resolve();
            }))
            end_date.setTime(end_date.getTime() - 86400000);

        } catch (error) {
            console.log(error);
        }
    }
    Promise.all(promises).then(() => {
        results.stops.forEach(stop => {
            stop.SWT = (stop.SWT / amount);
            stop.AWT = (stop.AWT / amount);
            stop.EWT = (stop.EWT / amount);
        })
        res.json(results);
    }).catch(err => {
        console.error(err);
    })
 
})

app.listen(8080, () => {
    console.log("Server running on port 8080");
});