const client = require('../index');

const users = {};

users.getInfo = async (name) => {
	const data = await client.query(`
		SELECT username, firstname, lastname, pronouns, email
		FROM Users
		WHERE username=$1;`,
		[name]
	);
	if (data.rows.length === 1) {
		return data.rows[0];
	}
	else if (data.rows.length === 0) {
		throw 'Not Found';
	}
	else {
		throw 'Internal Error';
	}
}

users.getPicture = async (name) => {
	const data = await client.query(`
		SELECT picture
		FROM Users
		WHERE username=$1;`,
		[name]
	);
	if (data.rows.length === 1) {
		return data.rows[0].picture;
	}
	else if (data.rows.length === 0) {
		throw 'Not Found';
	}
	else {
		throw 'Internal Error';
	}
}

users.getAudio = async (name) => {
	const data = await client.query(`
		SELECT audio
		FROM Users
		WHERE username=$1;`,
		[name]
	);
	if (data.rows.length === 1) {
		return data.rows[0].audio;
	}
	else if (data.rows.length === 0) {
		throw 'Not Found';
	}
	else {
		throw 'Internal Error';
	}
}

module.exports = users;