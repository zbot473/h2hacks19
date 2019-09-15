var SerialPort = require("serialport")
var port = new SerialPort("/dev/ttyUSB0", { baudRate: 9600 });
var uuid = require("uuid")
var fs = require("fs")
var id
try {
    if (fs.existsSync("id.txt")) {
        id = fs.readFileSync("id.txt").toString()
    }
    else {
        id = uuid()
        fs.writeFile("id.txt", id, function (err) {
            console.log(err)
        })
    }
} catch (err) {
    console.log(err)
}
var request = require("request")
port.on("open", function () {
    console.log('open');
    var buffer = ""
    x = 0
    port.on('data', function (data) {
        if (data != "\n") {
            buffer += data
        }
        else {
            console.log(buffer)
            sendData(buffer)
            buffer = ""
        }
    });

    port.write(new Buffer('4', 'ascii'), function (err, results) {
        console.log('err ' + err);
        console.log('results ' + results);
    });
});
var sendData = function (data) {

    var options = {
        method: 'POST',
        url: 'https://localhost:443/add',
        headers: { 'content-type': 'application/json' },
        body: {
            uuid: id,
            moisture: data, 
            x: 5, 
            y: 5
        },
        rejectUnauthorized: false,
        insecure: true,
        json: true
    };
    request(options, function (error, response, body) {
        if (error)
            console.log(error)

    });
}
