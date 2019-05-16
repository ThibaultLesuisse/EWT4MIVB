const express = require("express");
const app = express();
const cors = require('cors')
const fs = require('fs');

app.use(cors())

app.get("/ewt", (req, res) =>  {
    fs.readFile('./ewt/delay.json', (err, data) => {
        if(err)res.send({
            error: 1,
            error_text: "couldn't find the delay.json file"
        })
        res.send(JSON.parse(data));
    })
})

app.listen(3001, () => {
 console.log("Server running on port 3001");
});