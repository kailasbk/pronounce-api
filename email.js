const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
	host: "smtp.migadu.com",
	port: 465,
	secure: true,
	auth: {
		user: "bot@pronouncit.app",
		pass: "Awsome230!"
	}
});

module.exports = transport;
