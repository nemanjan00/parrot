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

const debounce = (callback, timeout) => {
	let lastCall;

	return (...args) => {
		lastCall = Date.now();

		setTimeout(() => {
			console.log(123);
			if(lastCall + timeout < Date.now()) {
				callback(...args);
			}
		}, timeout);
	};
};

let stream = undefined;

let buffer = [];

let listening = false;

ic9700.on("rx", () => {
	if(listening == true) {
		return;
	}

	listening = true;

	stream = audio.record(device);
	stream.on("data", (data) => {
		buffer.push(data);
	});

	stream.start();

	console.log("rx");
});

ic9700.on("rx_end", debounce(() => {
	listening = false;

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
			if(outStream._writableState.finished) {
				ic9700.endTransmit();
				return;
			}

			outStream.start();

			outStream.on("finished", () => {
				ic9700.endTransmit();
			});
		});
	}, 100);

	console.log("rx_end");
}, 1000));

ic9700.run("1A05011503").then(response => {
	console.log(response)
});

ic9700.run("1A050115").then(response => {
	console.log(response)
});

