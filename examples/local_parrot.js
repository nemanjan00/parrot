const SerialPort = require("serialport").SerialPort;
const { Readable } = require('stream');
const uuid = require("uuid").v4;

const radioController = require("../src/radio/ic9700");

const audio = require("../src/audio");
const {read} = require("fs");

const device = audio
	.listDevices()
	.filter(device => device.name == 'default')[0];

const serialport = new SerialPort({
	path: '/dev/ttyUSB0',
	baudRate: 9600
});

const radio = radioController(serialport);

const debounce = (callback, timeout) => {
	let lastCall;

	return (...args) => {
		end = true;

		const id = uuid();
		lastCall = id;

		console.log("last call");

		setTimeout(() => {
			if(end == false) {
				return;
			}

			if(lastCall === id) {
				callback(...args);
			}
		}, timeout);
	};
};

let stream = undefined;

let buffer = [];

let listening = false;

let end = false

radio.on("rx", () => {
	end = false;

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

radio.on("rx_end", debounce(() => {
	listening = false;

	stream.quit();

	const outStream = audio.play(device);

	const readable = new Readable();

	let oldBuffer = buffer;

	readable._read = () => {
		if(oldBuffer.length < 6) {
			readable.push(null);
			return;
		}

		const data = oldBuffer.shift();

		readable.push(data);
	};

	readable.pipe(outStream);

	buffer = [];

	setTimeout(() => {
		radio.transmit().then(() => {
			if(outStream._writableState.finished) {
				radio.endTransmit();
				return;
			}

			outStream.start();

			outStream.on("finished", () => {
				radio.endTransmit();
			});
		});
	}, 100);

	console.log("rx_end");
}, 1000));

radio.setup().then(() => {
	radio.endTransmit();
});
