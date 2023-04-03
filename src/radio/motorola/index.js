const events = require("events");

module.exports = (serial) => {
	const motorola = {
		_events: new events(),

		_status: {},

		_timer: undefined,

		_init: () => {
			let open = false;

			motorola._timer = setInterval(() => {
				// DSR - SQL
				// DTR - TX

				if(serial.opening === false && open === false) {
					motorola.endTransmit();
					open = true;
				}

				serial.get((_error, status) => {
					if(!status.dsr && motorola._status.dsr) {
						motorola._events.emit("rx");
					}

					if(status.dsr && !motorola._status.dsr) {
						motorola._events.emit("rx_end");
					}

					motorola._status = status;
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
