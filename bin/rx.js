const net = require("net");
const audio = require("../src/audio");

const server = net.createServer((socket) => {
	const device = audio
		.listDevices()
		.filter(device => device.name == "default")[0];

	const outStream = audio.play(device);

	setTimeout(() => {
		outStream.start();
	}, 1000);

	socket
		.pipe(audio.decoder())
		.pipe(outStream);
});

server.listen(8080, () => {
	console.log("Listening on port 8080")
});

