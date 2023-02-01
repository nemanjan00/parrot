const SerialPort = require("serialport").SerialPort;

SerialPort.list().then(serialPorts => {
	console.log(serialPorts)
});
