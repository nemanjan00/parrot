const events = require("events");

module.exports = (serialport) => {
	// TX START 1C 00 01
	// TX STOP 1C 00 00
	// RX CHECK 14 03

	const ic9700 = {
		preamble: Buffer.from("FEFE", "hex"),
		computerAddress: Buffer.from("E0", "hex"),
		radioAddress: Buffer.from("A2", "hex"),
		terminator: Buffer.from("FD", "hex"),

		inBuffer: Buffer.from("", "hex"),

		_rx: false,

		_events: new events(),

		_preparePromise: undefined,

		_task: undefined,

		_handlingQueue: false,

		_queue: [],

		_init: () => {
			return ic9700._preparePromise = new Promise((resolve) => {
				serialport.on("data", ic9700._dataHandler);

				if(serialport.opening === false) {
					return resolve();
				}

				serialport.on("open", () => {
					return resolve();
				});
			}).then(() => {
				console.log(123);
				setInterval(ic9700._waitForRx, 10);
			});
		},

		_waitForRx: () => {
			Promise.all([
				ic9700.run("1501"),
				ic9700.run("1505")
			]).then(result => {
				const rx = result[0][1] == 1 && result[1][1] == 1;

				if(rx && ic9700._rx === false) {
					ic9700._events.emit("rx");
				}

				if(!rx && ic9700._rx === true) {
					ic9700._events.emit("rx_end");
				}

				ic9700._rx = rx;
			});
		},

		_detectMessages: () => {
			const index = ic9700.inBuffer.indexOf(0xFD);

			if(index === -1) {
				return;
			}

			const response = ic9700.inBuffer.slice(0, index + 1)

			ic9700.inBuffer = ic9700.inBuffer.slice(index + 1);

			if(
				response[0] != 0xFE ||
				response[1] != 0xFE ||
				response[2] != ic9700.computerAddress[0] ||
				response[3] != ic9700.radioAddress[0]
			) {
				return ic9700._detectMessages();
			}

			const status = response[4];

			const callResult = response.slice(5, response.length - 1);

			if(status == 0xFB || status == ic9700._task.command[0]) {
				ic9700._task.resolve(callResult);
			} else {
				ic9700._task.reject(callResult);
			}

			ic9700._handlingQueue = false;
			ic9700._handleQueue();

			ic9700._detectMessages();
		},

		_dataHandler: (data) => {
			ic9700.inBuffer = Buffer.concat([ic9700.inBuffer, data]);

			ic9700._detectMessages();
		},

		_handleQueue: () => {
			if(ic9700._handlingQueue) {
				return;
			}

			ic9700._handlingQueue = true;

			if(ic9700._queue.length === 0) {
				ic9700._handlingQueue = false;

				return;
			}

			const task = ic9700._queue.shift();

			ic9700._task = task;

			return task.callback();
		},

		run: (command) => {
			return new Promise((resolve, reject) => {
				if(ic9700._preparePromise === undefined) {
					ic9700._init();
				}

				ic9700._preparePromise.then(() => {
					ic9700._queue.push({
						callback: () => {
							return serialport.write(Buffer.concat([
								ic9700.preamble,
								ic9700.radioAddress,
								ic9700.computerAddress,
								Buffer.from(command, "hex"),
								ic9700.terminator
							]));
						},
						reject,
						resolve,
						command: Buffer.from(command, "hex")
					});

					ic9700._handleQueue();
				}).catch(reject);
			});
		},

		on: (...args) => {
			return ic9700._events.on(...args);
		},

		transmit: () => {
			return ic9700.run("1C0001");
		},

		endTransmit: () => {
			return ic9700.run("1C0000");
		}
	};

	ic9700._init();

	return ic9700;
};
