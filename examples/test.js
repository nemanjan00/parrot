const SerialPort = require("serialport").SerialPort;

const serialport1 = new SerialPort({
	path: '/dev/ttyUSB0',
	baudRate: 9600,
	//xoff: true,
	//xon: true,
	rtscts: true
});

setTimeout(() => {
	let dtr = true;

	setInterval(() => {
		serialport1.set({
			dtr,
			cts: dtr
		});

		console.log(dtr);

		dtr = !dtr;
	}, 2000);
}, 2000);

setTimeout(() => {
	const serialport2 = new SerialPort({
		path: '/dev/ttyUSB1',
		baudRate: 9600,
		xoff: true,
		xon: true,
		rtscts: true
	});

	setInterval(() => {
		serialport2.get((_err, data) => {
			console.log(data);
		});
	}, 100);
}, 4100);
