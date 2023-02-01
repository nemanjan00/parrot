const audio = require("./audio");

const device = audio
	.listDevices()
	.filter(device => device.name == "default")[0];

const stream = audio.record(device);
const outStream = audio.play(device);

setTimeout(() => {
	outStream.start();
}, 1000);

setTimeout(() => {
	stream.quit();
}, 5000);

stream
	.pipe(audio.encoder())
	.pipe(audio.decoder())
	.pipe(outStream);

stream.start();
