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

console.log('Connected email bot: bot@pronouncit.app');

module.exports = transport;
