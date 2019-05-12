const fs = require('fs');

fs.readFile("./ewt/39.json", 'UTF-8', (err, data) => {
    let json = JSON.parse(data);
    let EWT = 0;

    json.forEach(element => {
        EWT += element.ewt
    });
    console.log(json[0])
    console.log(EWT)
    console.log(((EWT/json.length)/1000)/60)
})