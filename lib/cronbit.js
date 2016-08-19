//                            ___.   .__  __   
//    ___________  ____   ____\_ |__ |__|/  |_ 
//  _/ ___\_  __ \/  _ \ /    \| __ \|  \   __\
//  \  \___|  | \(  <_> )   |  \ \_\ \  ||  |  
//   \___  >__|   \____/|___|  /___  /__||__|  
//       \/                  \/    \/          

// @author Tommy Vercety

/* jshint -W097, -W083, esnext: true */
/* global module, require, console, setInterval, setTimeout, clearInterval */ "use strict";

var cronbit = {
	masterInterval: false
};

// ----------------------------------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------------------------------

/**
 * Convert parsed object to bit-mask array.
 * Use setRange for range CRON jobs syntax.
 * Use setList for list CRON jobs syntax.
 */
cronbit.main = {
	setRange: function(range, type, step, bits) {
		var start, stop, temp = [], fix = 0;

		step = (typeof step === "undefined") ? 1     : step;
		bits = (typeof bits === "undefined") ? [0,0] : bits;

		if (bits.constructor !== Array || bits.length !== 2) {
			bits = [0,0];
		}

		start = parseInt(range[0]);
		stop  = parseInt(range[1]) || parseInt(range[0]);

		if (step > 1) {
			stop += (step - 1);
		}

		if (step > 1 && start === 0) {
			fix = step;
		}

		for (let i = start + fix; i <= stop; i += step) {
			if (i > 61) { continue; }

			if (type === 1) {
				temp.push(i === 24 ? 0 : i);
			} else {
				temp.push(i === 60 ? 0 : i);
			}
		}
		return cronbit.main.setList(temp);
	},

	setList: function(list, bits) {
		bits = (typeof bits === "undefined") ? [0,0] : bits;

		if (bits.constructor !== Array || bits.length !== 2) {
			bits = [0,0];
		}

		for (let i = 0, len = list.length, index, bit; i < len; i ++) {
			if (list[i] > 29) {			
				index = 1;
				bit = (list[i] - 30);
			} else {
				index = 0;
				bit = list[i];
			}

			bits[index] = cronbit.helpers.setBit(bits[index], bit);
		}
		return bits;
	}
};

// ----------------------------------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------------------------------

cronbit.helpers = {
	setBit: function (num, bit){
	    return num | 1 << bit;
	},

	getBit: function(num, bit) {
   		return (num >> bit) & 1;
	},

	bitMatch: function(mask1, mask2) {
		var len1   = mask1.length,
			len2   = mask2.length,
			result = [];

		if (len1 !== len2) {
			return false;
		}

		for (let i = 0, len = len1; i < len; i++) {
			if ((mask1[i] & mask2[i]) !== 0) {
				return true;
			}
		}

		return false;
	},

	getTimeArray: function() {
		var	dt = new Date(),
			mt = dt.getMonth() + 1,
			dd = dt.getDate(),
			hh = dt.getHours(),
			mn = dt.getMinutes(),
			dw = dt.getDay();

		// mn - minute         0-59
		// hh - hour           0-23
		// dd - day of month   1-31
		// mt - month          1-12
		// dw - day of week    0-7  (0 or 7 is Sunday)
		return [mn, hh, dd, mt, dw];
	}
};

// ----------------------------------------------------------------------------------------------------
// Parser
// ----------------------------------------------------------------------------------------------------

/**
 * Parse CRON string to object,
 * ready to be converted to bit-mask array
 * @type {Object}
 */
cronbit.parse = {
	cronArray: function(str, pos) {
		var _list, _step, _range, errors = [], INVALID_DATA, ONLY_ONE_RANGE_PARAM;

		INVALID_DATA         = "invalid data provided";
		ONLY_ONE_RANGE_PARAM = "only one range parameter allowed";

		_step  = str.indexOf("/") !== -1;
		_range = str.indexOf("-") !== -1;
		_list  = str.indexOf(",") !== -1;	

		if (_step && !_list) {
			if (!_range) {
				return false;
			}

			let temp  = str.split("/"),
				step  = parseInt(temp[1]),
				range = [];

			temp = temp[0].split("-");
		
			range[0] = parseInt(temp[0]);
			range[1] = parseInt(temp[1]);

			if (pos === 4 && range[1] === 7) {
				range[1] = 6;
			}

			if (isNaN(step) || isNaN(range[0]) || isNaN(range[1])) {
				errors.push(INVALID_DATA);
			}

			return {
				step:step,
				range:range,
				action:"range",
				errors:errors
			};
		}

		if (_range && !_list) {
			let temp  = str.split("-"), range = [];

			range[0] = parseInt(temp[0]);
			range[1] = parseInt(temp[1]);

			if (pos === 4 && range[1] === 7) {
				range[1] = 6;
			}

			return {
				step:1,
				range:range,
				action:"range",
				errors:errors
			};
		}

		if (_list) {
			if (_range) {
				let list = [], range = [], temp = str.split(",");

				for (let i = 0, len = temp.length, curr; i < len; i++) {
					if (temp[i].indexOf("-") !== -1) {
						range.push(temp[i]);
						continue;
					}
					curr = parseInt(temp[i]);

					if (isNaN(curr)) {
						errors.push(INVALID_DATA);
					}
					list.push(curr);
				}

				if (range.length !== 0) {
					if (range.length > 1) {
						errors.push(ONLY_ONE_RANGE_PARAM);
					}

					temp  = range[0].split("-");
					range = [];

					range[0] = parseInt(temp[0]);
					range[1] = parseInt(temp[1]);

					if (pos === 4 && range[1] === 7) {
						range[1] = 6;
						list.push(0);
					}
				}

				return {
					range:range,
					list:list,
					action:"mix",
					errors:errors
				};

			} else {
				let list = [], temp = str.split(",");

				for (let i = 0, len = temp.length, curr; i < len; i++) {
					curr = parseInt(temp[i]);

					// for `dow` we make 7 = 0, in CRON they are both Sunday
					if (pos === 4 && curr === 7) {
						curr = 0;
					}

					if (isNaN(curr)) {
						errors.push(INVALID_DATA);
					}

					list.push(curr);
				}

				return {
					list:list,
					action:"list",
					errors:errors
				};
			}
		}

		// raw, one digit only cron type, using list as parser
		str = parseInt(str);

		if (isNaN(str)) {
			errors.push(INVALID_DATA);
		}

		return {
			list:[str],
			action:"list",
			errors:errors
		};
	},

	// field          allowed values
	// -----          --------------
	// 0. minute         0-59
	// 1. hour           0-23
	// 2. day of month   1-31
	// 3. month          1-12
	// 4. day of week    0-7  (0 or 7 is Sunday)
	cronString: function(str) {
		var data = str.split(" "), errors = [], len;

		len = data.length;

		if (len !== 5) {
			errors.push("not a valid cron");
		} else {
			data[0] = data[0].replace("*", "0-59");
			data[1] = data[1].replace("*", "0-23");
			data[2] = data[2].replace("*", "1-31");
			data[3] = data[3].replace("*", "1-12");
			data[4] = data[4].replace("*", "0-7");
		}

		return {
			data:data,
			errors:errors
		};
	}
};

// ----------------------------------------------------------------------------------------------------
// Make
// ----------------------------------------------------------------------------------------------------

/**
 * Make bit-mask array
 * @param  {string} str [cron syntax string]
 * @return {object}
 */
cronbit.make = function(str) {
	var cronArray, cronData = [], bitmask = [], errors = [], range, list;

	range     = this.main.setRange;
	list      = this.main.setList; 
	cronArray = this.parse.cronString(str);

	if (cronArray.errors.length > 0) {
		return {
			errs:cronArray.errors,
			bits:bitmask
		};
	}

	for (let i = 0, len = cronArray.data.length; i < len; i++) {
		cronData[i] = this.parse.cronArray(cronArray.data[i]);

		if (cronData[i].errors.length > 0) {
			return {
				errs:cronData[i].errors,
				bits:bitmask
			};
		}
	}

	for (let i = 0, len = cronData.length; i < len; i++) {
		switch(cronData[i].action) {
			case "mix":
				bitmask[i] = range(cronData[i].range, i);
				bitmask[i] = list(cronData[i].list, bitmask[i]);
				break;

			case "range":
				bitmask[i] = range(cronData[i].range, i, cronData[i].step);
				break;

			case "list":
				bitmask[i] = list(cronData[i].list);
				break;

			default:
				errors.push("unknown actions: " + cronData.action);
		}
	}

	// bitmask[0] minute         0-59
	// bitmask[1] hour           0-23
	// bitmask[2] day of month   1-31
	// bitmask[3] month          1-12
	// bitmask[4] day of week    0-7  (0 or 7 is Sunday)
	return {
		errs:cronArray.errors,
		bits:bitmask
	};
};

/**
 * Check bit-masks of cron condition to bit-mask of current/given time.
 * 
 * @param  {array} bitmask [array length 5 of integers]
 * @param  {array} time    [array length 5 of integers] optional
 * @return {boolean}
 */
cronbit.check = function(bitmask, time) {
	if (bitmask.constructor !== Array) {
		throw new CronError("Wrong CRON bitmask provided", bitmask);
	}

	var len = bitmask.length, isok = [];

	time = (typeof time === "undefined") ? this.helpers.getTimeArray() : time;

	for (let i = 0; i < len; i++) {
		if (this.helpers.bitMatch(bitmask[i], this.main.setList([time[i]]))) {
			isok.push(true);
		}
	}

	return (isok.length === 5);
};

// ----------------------------------------------------------------------------------------------------
// Default CronJob Constructor
// ----------------------------------------------------------------------------------------------------

cronbit.CronJob = (function() {
	var cronjobs = [];

	function CronJob() {
		prepare();
	}

	function start(timeoutTime) {

		setTimeout(function() {
			let time = cronbit.helpers.getTimeArray();
			for (let i = 0, len = cronjobs.length; i < len; i++) {
				if (cronbit.check(cronjobs[i].condition, time)) {
					cronjobs[i].cb();
				}
			}

			timeoutTime = 60 - (new Date().getSeconds()) + 0.05;
			start(timeoutTime);

			if (timeoutTime < 10) {
				console.warn("CRON Execution is taking more then 40 seconds!");
			}

		}, timeoutTime * 1000);
	}

	function prepare() {
		if (new Date().getSeconds() !== 0) {
			return setTimeout(function() {
				prepare();
			}, 500);
		}
		start(0);
	}


	CronJob.prototype.init = function(condition, cb) {
		var con = cronbit.make(condition);

		if (con.errs.length > 0) {
			throw new CronError("Wrong CRON string provided", con);
		}

		if (typeof cb !== "function") {
			throw new CronError("No CRON callback provided", con);
		}

		cronjobs.push({condition:con.bits, cb:cb});
	};

	return CronJob;
}());

// ----------------------------------------------------------------------------------------------------
// Export
// ----------------------------------------------------------------------------------------------------

module.exports = cronbit;

// ----------------------------------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------------------------------

function CronError(message, info) {
	/* jshint validthis:true */

	this.name = 'CronbitError';
	this.message = message || 'Cronbit Error';
	this.stack = (new Error()).stack;
	this.info = info;
}