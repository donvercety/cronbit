## cronbit
> Fastest javascript CRON implementation,  
> no external dependencies! Pure javascript.

The library is implemented with speed in mind. For  
condition checking - bitwise operations are used.  
Each `minute`, `hour`, `dom`, `month`, `dow` is represented  
by one **bit**, this makes condition checking really fast.

It can easily handle thousands of CRON Jobs at once.
  
For the speed boost the module is made to work with server time.

### Install
    npm install cronbit

### CRON

```text
           ┌───────────── min (0 - 59)
           │ ┌────────────── hour (0 - 23)
           │ │ ┌─────────────── day of month (1 - 31)
           │ │ │ ┌──────────────── month (1 - 12)
           │ │ │ │ ┌───────────────── day of week (0 - 6) (0 to 6 are Sunday to
           │ │ │ │ │                  Saturday, or use names; 7 is also Sunday)
           │ │ │ │ │
           │ │ │ │ │
cron.init("* * * * *", calllback)
```

Available Cron patterns:

    Asterisk. E.g. *
    Ranges. E.g. 1-3
    Steps. E.g. */2
    Lists, E.g. 1,2,3,6,7,9


### Simple Example

```js
var cronbit = require("cronbit");

var cron = new cronbit.CronJob();

cron.init("* * * * *", function() {
	console.log("execute each minute");
});

cron.init("*/5 * * * *", function() {
	console.log("execute each 5 minutes");
});
```

### Module methods that can be used for self made CRON logic

Generates bit-mask array from CRON string (`"*/5 * * * *"`).
```js
/**
 * Make bit-mask array
 * @param  {string} str [cron syntax string]
 * @return {object}
 */
cronbit.make(cronString);
```

Checks already generated bitMaskArr to timeArr.
```js
/**
 * Check bit-masks of cron condition to bit-mask of current/given time.
 *
 * @param  {array} bitmask [array length 5 of integers]
 * @param  {array} time    [array length 5 of integers] optional, defaults to current time
 * @return {boolean}
 */
cronbit.check(bitMaskArr, timeArr);
```

#### Helpers:

```js
// set bit at current position
cronbit.helpers.setBit(num, bit);

// get bit at current position
cronbit.helpers.getBit(num, bit);

// check two bit arrays for complete match
cronbit.helpers.bitMatch(bitArrMask1, bitArrMask2);

// generates bit-mask timeArr
cronbit.helpers.getTimeArray();
```