const lib = require('nrf24');
const radio = new lib.nRF24(22, 0);

radio.begin(true);
radio.config({
  PALevel: lib.RF24_PA_MAX,
  DataRate: lib.RF24_1MBPS,
  Channel: 76,
  CRCLength: lib.RF24_CRC_16,
}, true);

console.log("Radio connected:" + radio.present());

radio.useWritePipe("0x0F0F0F0F0F");

setInterval(() => {
  radio.write(
    Buffer.from('Hello'),
    (...args) => console.log(args)
  );
}, 5000);
