const nodemailer = require('nodemailer');

const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

const transport = nodemailer.createTransport({
	host: "email-smtp.us-east-1.amazonaws.com",
	port: 465,
	secure: true,
	auth: {
		user: user,
		pass: pass
	},
	sendingRate: 5
});

console.log('Connected email bot: bot@pronouncit.app');

module.exports = transport;
