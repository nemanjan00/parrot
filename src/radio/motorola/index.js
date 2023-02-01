const events = require("events");

module.exports = (serial) => {
	const motorola = {
		_events: new events(),

		_status: {},

		_timer: undefined,

		_init: () => {
			motorola._timer = setInterval(() => {
				// DSR - SQL
				// DTR - TX

				const status = serial.get();

				if(status.dsr && !motorola._status.dsr) {
					motorola._events.emit("rx");
				}

				if(!status.dsr && motorola._status.dsr) {
					motorola._events.emit("rx_end");
				}
			}, 10);
		},

		on: (...args) => {
			return motorola._events.on(...args);
		},

		transmit: () => {
			return serial.set({
				dtr: true
			});
		},

		endTransmit: () => {
			return serial.set({
				dtr: true
			});
		}
	};

	motorola._init();

	return motorola;
};
