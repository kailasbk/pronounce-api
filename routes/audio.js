const express = require('express');
const multer = require('multer');
const upload = multer();
const client = require('../db');
const auth = require('../middleware/auth');

const audio = express.Router();

audio.get('/me', auth, async (req, res) => {
	try {
		const data = await client.query(
			"SELECT Audio FROM Users WHERE Username=$1;",
			[req.token.client_id]
		);
		if (data.rows.length > 0) {
			const image = data.rows[0].audio;
			res.type('audio/m4a');
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

audio.get('/:id', auth, async (req, res) => {
	try {
		const data = await client.query(
			"SELECT Audio FROM Users WHERE Username=$1;",
			[req.params.id]
		);
		if (data.rows.length > 0) {
			const image = data.rows[0].audio;
			res.type('audio/m4a');
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

audio.put('/', auth, upload.single('file'), async (req, res) => {
	try {
		console.log(req.file.buffer);
		await client.query("UPDATE Users SET Audio=$1 WHERE Username=$2;", [req.file.buffer, req.token.client_id]);
		res.sendStatus(204);
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

module.exports = audio;