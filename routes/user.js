const express = require('express');
const client = require('../db');
const auth = require('../middleware/auth');
const users = require('../db/tables/users');

// mounted at /user
const user = express.Router();
user.use(auth);

user.get('/:id', async (req, res) => {
	try {
		const info = await users.getInfo(req.params.id);
		res.json(info);
	} catch (err) {
		console.log(err);
		if (err === 'Not Found') {
			res.sendStatus(404);
		}
		else {
			res.sendStatus(500);
		}
	}
});

user.get('/:id/picture', async (req, res) => {
	try {
		const picture = await users.getPicture(req.params.id);
		res.type('image/jpeg');
		res.send(picture);
	} catch (err) {
		console.log(err);
		if (err === 'Not Found') {
			res.sendStatus(404);
		}
		else {
			res.sendStatus(500);
		}
	}
});

user.get('/:id/audio', async (req, res) => {
	try {
		const audio = await users.getAudio(req.params.id);
		res.type('audio/ogg');
		res.send(audio);
	} catch (err) {
		console.log(err);
		if (err === 'Not Found') {
			res.sendStatus(404);
		}
		else {
			res.sendStatus(500);
		}
	}
});

module.exports = user;