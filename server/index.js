const Influx = require('influx');
const bodyParser = require('body-parser');
const express = require('express');
const exphbs = require('express-handlebars');
const http = require('http')
// Server app
const app = express();
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');
app.use(bodyParser.json());

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
            console.log('Listening on port 3000...')
        })
    })
    .catch(err => {
        console.log(err)
        console.error('Error creating Influx database!');
    });

// Root
app.get('/', function (req, res, next) {
    res.render('home');
});

app.get('/current', (req, res, next) => {
    influx.query(`
        select * from soil_moisture
    `).then(result => {
        ``
        res.json(result[result.length-1])

    });

});

app.get('/range', () => {
    res.send({
        x: 10
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
