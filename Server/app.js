const Influx = require('influx/lib/src');
const bodyParser = require('body-parser');
const express = require('express');
var path = require('path');
const https = require('https')
const http = require('http')
const fs = require('fs')
var options = {
    key: fs.readFileSync(__dirname+'/server.key'),
    cert: fs.readFileSync(__dirname+'/server.cert')
};

//Constants
//Evaporation speed in conductivity per minute
const 
HYDRAULIC_CONDUCTIVITY = 5.00e-9 * 60, EVAPORATION_SPEED = 1e-10 * 60, PLANTS = 2.4e-9 * 60,
MIN_VAL = 1e4

//Utility functions
function outOfBounds(row, col){
    return row < 0 || row >= 10 || col < 0 || col >= 10
}

function square(x){
    return x * x
}

function distPythag(x1, y1, x2, y2){
    return Math.sqrt(square(x1 - x2) + square(y1 - y1));
}

// Server app
const app = express();
app.use(express.static('public'))

app.use(bodyParser.json());
//Initialize Database
const influx = new Influx.InfluxDB({
    host: 'localhost',
    database: 'soil_measurements',
    schema: [{
        measurement: 'soil_moisture',
        fields: {
            uuid: Influx.FieldType.STRING,
            moisture: Influx.FieldType.INTEGER
        },
        tags: [
            "soil"
        ]
    }]
});

influx.getDatabaseNames()
    .then(names => {
        if (!names.includes('soil_measurements')) {
            influx.createDatabase('soil_measurements');
        }
    })
    .then(() => {
        https.createServer(options, app).listen(443);
        http.createServer(function (req, res) {
            res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
            res.end();
        }).listen(80, function () {
        });
    })
    .catch(err => {
        console.log(err)
        console.error('Error creating Influx database!');
    });

// Show home
app.get('/', function (req, res, next) {
    res.sendFile(__dirname + "/views/index.html");
});

//get display grid
app.get('/grid', (req, res, next) => {
    influx.query(`select * from grid GROUP BY * ORDER BY DESC LIMIT 1`).then(result => {
	if(result.length  == 0){
	    res.json("no data")
	    return;
	}

	res.json(result[0])
    });
});

//get latest measurement
app.get('/latest', (req, res, next) => {
    influx.query(`select * from /soil_moisture_.*/ GROUP BY * ORDER BY DESC LIMIT 1`).then(result =>{
        res.json(result)
    });
});

app.get('/all', (req, res, next) => {
    influx.query(`select * from /soil_moisture_.*/`).then(result => {
        res.json(result.groupRows)
    });
});

// Send datapoint
app.post('/add', (req, res, next) => {
    if (!req.body.moisture) {
        res.sendStatus(400)
        return
    }

    let moisture = parseInt(req.body.moisture)
    influx.writePoints([{
        measurement: 'soil_moisture_' + req.body.uuid,
        fields: {
            moisture: moisture,
	        x: req.body.x,
	        y: req.body.y
        }
    }]).then(
	() => {
	    influx.query(`select * from grid GROUP BY * ORDER BY DESC LIMIT 1`).then(result => {
            if(result.length == 0){
                var grid = new Array(10)
                for(var i = 0; i < 10; i++){
                    grid[i] = new Array(10)
                    for(var j = 0; j < 10; j++){
                        grid[i][j] = 200 +
                        (j == req.body.x && req.body.y == (10 - i - 1) ? 0 : 
                        (Math.random() * 200 - 50));
                    }
                }
                influx.writePoints([{
                measurement: 'grid',
                fields: {
                    data: JSON.stringify(grid)
                }
            }])
            }else{
                var prevGrid = JSON.parse(result[0].data)

                var newGrid = new Array(10)
                for(var i = 0; i < 10; i++){
                    newGrid[i] = new Array(10);
                    for(var j = 0; j < 10; j++){
                        if(prevGrid[i] != undefined)
                            newGrid[i][j] = prevGrid[i][j]
                    }
                }
                
                //Delta time in minutes
                var deltaT = new Date().getTime() - (result[0].time.getNanoTime() / 1e6);
                deltaT /= 6000.0
                deltaT *= 10000
                for(var i = 0; i < 10; i++){
                    for(var j = 0; j < 10; j++){
                        newGrid[i][j] -= (EVAPORATION_SPEED + PLANTS) * deltaT
                    }
                }
                
                var row = 10 - req.body.y - 1;
                var col = req.body.x;

                newGrid[row][col] = moisture;

                for(var centerR = 0; centerR < 10; centerR++){
                    for(var centerC = 0; centerC < 10; centerC++){
                        
                        for(var r = 0; r < 10; r++){
                            for(var c = 0; c < 10; c++){
                                if(newGrid[centerR][centerC] > newGrid[r][c]){
                                    var amountDiffused = newGrid[centerR][centerC] * deltaT * 
                                    HYDRAULIC_CONDUCTIVITY
                                    var dist = distPythag(centerR, centerC, r, c)
                                    if(dist > 0.1){
                                        amountDiffused *= 1 / dist
                                    }
                                     if(centerR == row && centerC == col)
                                         console.log(amountDiffused)
                                    newGrid[r][c] += amountDiffused
                                    newGrid[centerR][centerC] -= amountDiffused
                                }
                            }
                        }

                    }
                }

                influx.writePoints([{
                    measurement: 'grid',
                    fields: {
                        data: JSON.stringify(newGrid)
                    }}]).then(()=>{res.sendStatus(200)})

                //diff < 0, then added water

                //diff > 0, water lost
                // if()
            }
	    })
	}
    )

});

module.exports = app;
