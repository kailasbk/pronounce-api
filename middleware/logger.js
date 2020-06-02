function Logger() {
	let logs = [];
	let start = Date.now();
	let end = null;

	return {
		add: (log) => {
			logs.push(log);
		},
		close: () => {
			end = Date.now();
		},
		log: () => {
			console.log('----------');
			console.log(new Date(start).toString());
			logs.forEach(log => {
				console.log(log);
			})
			console.log('Elapsed time: ' + (end - start) + 'ms');
		}
	}
}

function start(req, res, next) {
	res.logger = new Logger();
	res.logger.add(req.method + ' ' + req.originalUrl);
	next();
}

function end(req, res) {
	res.logger.close();
	res.logger.log();
}

const logger = { start, end };

module.exports = logger;
