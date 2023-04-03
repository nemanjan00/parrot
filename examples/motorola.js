const SerialPort = require("serialport").SerialPort;

const motorolaradio = require("../src/radio/motorola");

const serialport = new SerialPort({
	path: '/dev/ttyUSB0',
	baudRate: 9600
});

const motorola = motorolaradio(serialport);

motorola.on("rx", () => {
	console.log("rx");
});

motorola.on("rx_end", () => {
	console.log("rx_end");
});
