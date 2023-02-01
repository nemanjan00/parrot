const { Transform } = require("stream");

const portAudio = require("naudiodon");
const { OpusEncoder } = require("@discordjs/opus");

const samplerate = 48000;

const encoder = new OpusEncoder(48000, 1);
encoder.setBitrate(24000);

module.exports = {
	listDevices: () => {
		return portAudio.getDevices();
	},

	record: (device) => {
		return portAudio.AudioIO({
			inOptions: {
				channelCount: 1,
				channelCount: 1,
				sampleFormat: portAudio.SampleFormat16Bit,
				sampleRate: samplerate,
				deviceId: device.id,
			}
		});
	},

	play: (device) => {
		return portAudio.AudioIO({
			outOptions: {
				channelCount: 1,
				sampleFormat: portAudio.SampleFormat16Bit,
				sampleRate: samplerate,
				deviceId: device.id,
				closeOnError: false
			}
		});
	},

	encoder: () => {
		let remainder = new Buffer.alloc(0);

		return new Transform({
			transform(data, _encoding, callback) {
				data = Buffer.concat([remainder, data]);

				const len = Math.floor(data.length / 240);

				const parts = Array(len)
					.fill(true)
					.map((_, i) => data.slice(i * 240, (i + 1) * 240))
					.map(data => {
						const encodedData = encoder.encode(data)
						const len = new Buffer.alloc(1);

						len[0] = encodedData.length;

						return Buffer.concat([len, encodedData]);
					});

				callback(null, Buffer.concat(parts));
			},
		});
	},

	decoder: () => {
		let remainder = new Buffer.alloc(0);

		return new Transform({
			transform(data, _encoding, callback) {
				data = Buffer.concat([remainder, data]);

				const parts = [];

				const decode = (data) => {
					if(data.length === 0) {
						return;
					}

					const length = data[0]

					if(data.length < length + 1) {
						remainder = data;

						return;
					}

					const part = data.slice(1, 1 + length);

					parts.push(encoder.decode(part));

					decode(data.slice(length + 1));
				};

				decode(data);

				callback(null, Buffer.concat(parts));
			},
		});
	}
};
