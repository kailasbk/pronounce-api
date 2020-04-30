const express = require('express');
const client = require('../db');
const auth = require('../middleware/auth');

// mounted at /user
const user = express.Router();
user.use(auth);

user.get('/:id', async (req, res) => {
	try {
		const data = await client.query(`
			SELECT username, firstname, lastname, pronouns, email
			FROM Users
			WHERE username=$1;`,
			[req.params.id]
		);
		if (data.rows.length === 1) {
			var user = data.rows[0];
			res.json(user);
		}
		else {
			res.sendStatus(404);
		}
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

user.get('/:id/audio', async (req, res) => {
	try {
		const data = await client.query(`
			SELECT Picture
			FROM Users
			WHERE Username=$1;`,
			[req.params.id]
		);
		if (data.rows.length > 0) {
			const image = data.rows[0].picture;
			res.type('image/jpeg');
			res.send(image);
		}
		else {
			res.sendStatus(404);
		}
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

user.get('/:id/picture', async (req, res) => {
	try {
		const data = await client.query(`
			SELECT Audio
			FROM Users
			WHERE Username=$1;`,
			[req.params.id]
		);
		if (data.rows.length > 0) {
			const image = data.rows[0].audio;
			res.type('audio/ogg');
			res.send(image);
		}
		else {
			res.sendStatus(404);
		}
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

module.exports = user;