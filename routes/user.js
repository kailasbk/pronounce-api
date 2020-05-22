const express = require('express');
const multer = require('multer');
const upload = multer();
const sharp = require('sharp');
const client = require('../db');
const auth = require('../middleware/auth');
const users = require('../db/tables/users');

// mounted at /user
const user = express.Router();
user.use(auth);

user.get('/:id', async (req, res, next) => {
	try {
		let info;
		if (req.params.id === '0') {
			info = await users.getInfo(req.token.username);
		}
		else {
			info = await users.getInfo(req.params.id);
		}
		res.json(info);
	} catch (err) {
		res.logger.add(err);
		if (err === 'Not Found') {
			res.sendStatus(404);
		}
		else {
			res.sendStatus(500);
		}
	}
	finally {
		next();
	}
});

user.put('/0/update', express.json(), async (req, res, next) => {
	try {
		await client.query(`
			UPDATE Users
			SET firstname=$1, nickname=$2, lastname=$3, pronouns=$4
			WHERE username=$5;`,
			[req.body.firstname, req.body.nickname, req.body.lastname, req.body.pronouns, req.token.username]
		);

		res.sendStatus(204);
	} catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

user.get('/:id/picture', async (req, res, next) => {
	try {
		let picture;
		if (req.params.id === '0') {
			picture = await users.getPicture(req.token.username);
		}
		else {
			picture = await users.getPicture(req.params.id);
		}
		res.type('image/jpeg');
		res.send(picture);
	} catch (err) {
		res.logger.add(err);
		if (err === 'Not Found') {
			res.sendStatus(404);
		}
		else {
			res.sendStatus(500);
		}
	}
	finally {
		next();
	}
});

user.put('/0/picture', upload.single('file'), async (req, res, next) => {
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
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

user.get('/:id/audio', async (req, res, next) => {
	try {
		let audio;
		if (req.params.id === '0') {
			audio = await users.getAudio(req.token.username);
		}
		else {
			audio = await users.getAudio(req.params.id);
		}
		res.type('audio/ogg');
		res.send(audio);
	} catch (err) {
		res.logger.add(err);
		if (err === 'Not Found') {
			res.sendStatus(404);
		}
		else {
			res.sendStatus(500);
		}
	}
	finally {
		next();
	}
});

user.put('/0/audio', upload.single('file'), async (req, res, next) => {
	try {
		await client.query(`
			UPDATE Users
			SET audio=$1 
			WHERE username=$2;`,
			[req.file.buffer, req.token.username]
		);
		res.sendStatus(204);
	} catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

user.get('/0/groups', async (req, res, next) => {
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
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

user.get('/0/invites', async (req, res, next) => {
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
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

module.exports = user;