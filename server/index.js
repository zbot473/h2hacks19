const Influx = require('./node_modules/influx/lib/src');
const bodyParser = require('./node_modules/body-parser');
const express = require('./node_modules/express');
const exphbs = require('express-handlebars');
const http = require('http')
// Server app
const app = express();
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');
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
            return influx.createDatabase('soil_measurements');
        }
    })
    .then(() => {
        http.createServer(app).listen(8010, function () {
            console.log('Listening on port 8018...')
        })
    })
    .catch(err => {
        console.log(err)
        console.error('Error creating Influx database!');
    });

// Show home 
app.get('/', function (req, res, next) {
    res.render('home');
});
//get latest measurement
app.get('/current', (req, res, next) => {
    influx.query(`
        select * from soil_moisture
    `).then(result => {
        res.json(result[result.length-1])

    });

});

// Send datapoint
app.post('/add', (req, res, next) => {
    console.log(req.body);
    influx.writePoints([{
        measurement: 'soil_moisture',
        fields: {
            uuid: req.body.uuid,
            moisture: req.body.moisture
        }
    }]).then(
        () => {
            res.sendStatus(200)
        }
    );

});

module.exports = app;
