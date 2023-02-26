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

				serial.get((_error, status) => {
					if(status.dsr && !motorola._status.dsr) {
						motorola._events.emit("rx");
					}

					if(!status.dsr && motorola._status.dsr) {
						motorola._events.emit("rx_end");
					}
				});
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
				dtr: false
			});
		}
	};

	motorola._init();

	return motorola;
};
