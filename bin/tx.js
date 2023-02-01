const net = require("net");
const audio = require("../src/audio");

const socket = net.createConnection(8080, "127.0.0.1");

const device = audio
	.listDevices()
	.filter(device => device.name == "default")[0];

const stream = audio.record(device);

stream
	.pipe(audio.encoder())
	.pipe(socket);


stream.start();
