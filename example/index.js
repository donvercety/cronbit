var cronbit = require("../lib/cronbit");

var cron = new cronbit.CronJob();

cron.init("* * * * *", function() {
	console.log(dt() + " * * * * *");
});

cron.init("*/2 * * * *", function() {
	console.log(dt() + " */2 * * * *");
});

cron.init("*/10 * * * *", function() {
	console.log(dt() + " */10 * * * *");
});

function dt() {
	var dt = new Date();

	var hh = dt.getHours(),
		mn = dt.getMinutes(),
		ss = dt.getSeconds();

	return (hh<10?'0'+hh:hh)+':'+(mn<10?'0'+mn:mn)+':'+(ss<10?'0'+ss:ss);
}
