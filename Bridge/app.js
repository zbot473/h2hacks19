var SerialPort = require("serialport").SerialPort;
var serialPort = new SerialPort("/dev/ttyACM0", {
  baudrate: 9600
});

serialPort.on("open", function () {
  console.log('open');
  
  serialPort.on('data', function(data) {
    console.log('data received: ' + data);
  });
  
  serialPort.write(new Buffer('4','ascii'), function(err, results) {
    console.log('err ' + err);
    console.log('results ' + results);
  });
});

var sendHandler = function(data){
    var postBody = {
        url: 'http://localhost:8010/add',
        body: {
            "uuid":id,
            "moisture":data
        },
        headers: {
          'Content-Type': 'application/json'
        }
      };
    if(x%1000==0){
        request.post(postBody)
    }

    x++;
}
