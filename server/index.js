const nrf24 = require("nRF24");
var rf24= new nrf24.RF24(24,22);
rf24.begin();
console.log("Radio connected:" + rf24.present()); // Prints true/false if radio is connected.
