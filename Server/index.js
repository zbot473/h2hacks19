const Influx = require('influx/lib/src');
const bodyParser = require('body-parser');
const express = require('express');
var sassMiddleware = require('node-sass-middleware');
var path = require('path');
const https = require('https')
const http = require('http')
const fs = require('fs')

var options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
};

// Server app
const app = express();
console.log(path.join(__dirname, 'public'))
app.use(sassMiddleware({
    src: __dirname,
    dest: path.join(__dirname, 'public'),
    prefix: '/scss',
    includePaths: ['./node_modules'],
    force: true
}));
app.use(bodyParser. json());
app.use('/public', express.static(path.join(__dirname, 'public')))

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
            return influx.createDatabase('soil_measurements');
        }
    })
    .then(() => {
        https.createServer(options, app).listen(8040);
        http.createServer(function (req, res) {
            res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
            res.end();
        }).listen(8010, function () {
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
//get latest measurement
app.get('/current', (req, res, next) => {
    influx.query(`
        select * from soil_moisture
    `).then(result => {
        res.json(result[result.length - 1])

    });

});

// Send datapoint
app.post('/add', (req, res, next) => {
    console.log(req.body);
    let moisture = req.body.moisture / 670
    influx.writePoints([{
        measurement: 'soil_moisture',
        fields: {
            uuid: req.body.uuid,
            moisture: moisture
        }
    }]).then(
        () => {
            res.sendStatus(200)
        }
    );

});

module.exports = app;
