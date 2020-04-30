const express = require('express');
const multer = require('multer');
const upload = multer();
const sharp = require('sharp');
const client = require('../db');
const auth = require('../middleware/auth');

// mounted at /user/0
const me = express.Router();
me.use(auth);

me.get('/', async (req, res) => {
	const path = `/user/${req.token.client_id}`
	console.log(`Request redirected to ${path}`);
	res.redirect(path);
});

me.put('/update', express.json(), async (req, res) => {
	try {
		await client.query(`
			UPDATE Users
			SET firstname=$1, lastname=$2, pronouns=$3
			WHERE username=$4;`,
			[req.body.firstname, req.body.lastname, req.body.pronouns, req.token.client_id]
		);

		res.sendStatus(204);
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

me.route('/audio')
	.get(async (req, res) => {
		const path = `/user/${req.token.client_id}/audio`
		console.log(`Request redirected to ${path}`);
		res.redirect(path);
	})
	.put(upload.single('file'), async (req, res) => {
		try {
			await client.query(`
				UPDATE Users
				SET Audio=$1 
				WHERE Username=$2;`,
				[req.file.buffer, req.token.client_id]
			);
			res.sendStatus(204);
		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});

me.route('/picture')
	.get(async (req, res) => {
		const path = `/user/${req.token.client_id}/picture`;
		console.log(`Request redirected to ${path}`);
		res.redirect(path);
	})
	.put(upload.single('file'), async (req, res) => {
		try {
			const buffer = await sharp(req.file.buffer)
				.resize(200, 200)
				.toBuffer();
			await client.query(`
				UPDATE Users
				SET Picture=$1
				WHERE Username=$2;`,
				[buffer, req.token.client_id]
			);
			res.sendStatus(204);
		} catch (err) {
			console.log(err);
			res.sendStatus(500);
		}
	});

me.get('/groups', async (req, res) => {
	try {
		const data = await client.query(`
			SELECT id, name
			FROM Groups
			WHERE owner=$1 OR members@>ARRAY[$1];`,
			[req.token.client_id]
		);

		const groups = data.rows;

		res.json(groups);
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

module.exports = me;