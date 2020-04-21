function logger(req, res, next) {
	console.log('-------- request --------');
	console.log(req.method + ' request made to ' + req.originalUrl);
	next();
}

module.exports = logger;