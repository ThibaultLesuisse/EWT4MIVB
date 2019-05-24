const fs = require('fs');
const path = require('path');


//Javascript can be so beautiful...
module.exports = () => {
    return new Promise((resolve, reject) => {
        fs.exists(path.join(__dirname, '/../tmp'), bool => {
            if (!bool) {
                fs.mkdir(path.join(__dirname, '/../tmp'), err => {
                    if (err) reject(err)
                    fs.mkdir(path.join(__dirname, '/../tmp/gtfs'), err => {
                        if (err) reject(err)
                        fs.mkdir(path.join(__dirname, '/../tmp/files'), err => {
                            if (err) reject(err)
                            resolve()
                        })
                    })
                })
            } else {
                resolve();
            }
        })
    })
}