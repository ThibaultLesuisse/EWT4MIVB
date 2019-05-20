const express = require("express");
const app = express();
const cors = require('cors')
const fs = require('fs');

app.use(cors())

app.get("/delay", (req, res) =>  {
    fs.readFile('./ewt/delay.json', (err, data) => {
        if(err)res.send({
            error: 1,
            error_text: "couldn't find the delay.json file"
        })
        res.send(JSON.parse(data));
 
    })
})

app.get("/ewt", (req, res) => {
    fs.readFile('./files/39_ewt.json', 'utf-8', (err, ewt_data) => {
        res.send(JSON.parse(ewt_data));
    })
})

app.listen(3001, () => {
 console.log("Server running on port 3001");
});