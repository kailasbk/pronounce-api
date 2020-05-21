const express = require('express');
const multer = require('multer');
const upload = multer();
const sharp = require('sharp');
const client = require('../db');
const auth = require('../middleware/auth');
const users = require('../db/tables/users');

// mounted at /user/0
const profile = express.Router();
profile.use(auth);

profile.get('/', async (req, res) => {
	try {
		const info = await users.getInfo(req.token.username);
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

profile.put('/update', express.json(), async (req, res) => {
	try {
		await client.query(`
			UPDATE Users
			SET firstname=$1, nickname=$2, lastname=$3, pronouns=$4
			WHERE username=$5;`,
			[req.body.firstname, req.body.nickname, req.body.lastname, req.body.pronouns, req.token.username]
		);

		res.sendStatus(204);
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

profile.route('/audio')
	.get(async (req, res) => {
		try {
			const audio = await users.getAudio(req.token.username);
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
	})
	.put(upload.single('file'), async (req, res) => {
		try {
			await client.query(`
				UPDATE Users
				SET audio=$1 
				WHERE username=$2;`,
				[req.file.buffer, req.token.username]
			);
			res.sendStatus(204);
		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});

profile.route('/picture')
	.get(async (req, res) => {
		try {
			const picture = await users.getPicture(req.token.username);
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
	})
	.put(upload.single('file'), async (req, res) => {
		try {
			const buffer = await sharp(req.file.buffer)
				.resize(200, 200)
				.toBuffer();
			await client.query(`
				UPDATE Users
				SET picture=$1
				WHERE username=$2;`,
				[buffer, req.token.username]
			);
			res.sendStatus(204);
		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});

profile.get('/groups', async (req, res) => {
	try {
		const data = await client.query(`
			SELECT id, name
			FROM Groups
			WHERE owner=$1 OR members@>ARRAY[$1];`,
			[req.token.username]
		);

		const groups = data.rows;

		res.json(groups);
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

profile.get('/invites', async (req, res) => {
	try {
		const data = await client.query(`
			SELECT id
			FROM Invites
			WHERE email=$1`,
			[req.token.email]
		);

		const invites = data.rows.map(invite => invite.id);
		res.json(invites);
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

module.exports = profile;