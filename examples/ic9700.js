const SerialPort = require("serialport").SerialPort;

const ic9700radio = require("../src/radio/ic9700");

const serialport = new SerialPort({
	path: '/dev/ttyUSB0',
	baudRate: 9600
});

const ic9700 = ic9700radio(serialport);

ic9700.on("rx", () => {
	console.log("rx");
});

ic9700.on("rx_end", () => {
	console.log("rx_end");
});
