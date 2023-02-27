const SerialPort = require("serialport").SerialPort;
const { Readable } = require('stream');

const ic9700radio = require("../src/radio/ic9700");

const audio = require("../src/audio");
const {read} = require("fs");

const device = audio
	.listDevices()
	.filter(device => device.name == 'default')[0];

const serialport = new SerialPort({
	path: '/dev/ttyUSB0',
	baudRate: 9600
});

const ic9700 = ic9700radio(serialport);

let stream = undefined;

let buffer = [];

ic9700.on("rx", () => {
	stream = audio.record(device);
	stream.on("data", (data) => {
		buffer.push(data);
	});

	stream.start();

	console.log("rx");
});

ic9700.on("rx_end", () => {
	stream.quit();

	const outStream = audio.play(device);

	const readable = new Readable();

	let oldBuffer = buffer;

	readable._read = () => {
		if(oldBuffer.length == 0) {
			readable.push(null);
			return;
		}

		const data = oldBuffer.shift();

		readable.push(data);
	};

	readable.pipe(outStream);

	buffer = [];

	setTimeout(() => {
		ic9700.transmit().then(() => {
			outStream.start();

			outStream.on("finished", () => {
				ic9700.endTransmit();
			});
		});
	}, 100);

	console.log("rx_end");
});

ic9700.run("1A05011503").then(response => {
	console.log(response)
});

ic9700.run("1A050115").then(response => {
	console.log(response)
});

