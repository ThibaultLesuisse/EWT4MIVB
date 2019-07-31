const express = require("express");
const path = require('path');
const app = express();
const cors = require('cors');
const fs = require('fs');

app.use(cors())
app.options('*', cors());

app.use(express.static(path.join(__dirname, 'front/build')));

app.get('/', (req, res)  => {
    res.sendFile(path.join(__dirname, 'front/build', 'index.html'));
  });


app.get("/delay", (req, res) =>  {
    fs.readFile('./files/result/delay.json', (err, data) => {
        if(err)res.send({
            error: 1,
            error_text: "couldn't find the delay.json file"
        })
        res.send(JSON.parse(data));
 
    })
})

app.get("/ewt/:line", (req, res) => {
    console.log(req.params.line);
    fs.readFile(`./files/${req.params.line}_${new Date(Date.now() - 86400000).getMonth()}_${new Date(Date.now() - 86400000).getDate()}.json`, 'utf-8', (err, ewt_data) => {
        res.json(JSON.parse(ewt_data));
    })
})

app.listen(8080, () => {
 console.log("Server running on port 8080");
});