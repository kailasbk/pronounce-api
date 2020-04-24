const express = require('express');
const multer = require('multer');
const upload = multer();
const sharp = require('sharp');
const client = require('../db');
const auth = require('../middleware/auth');

const picture = express.Router();

picture.get('/me', auth, async (req, res) => {
	try {
		const data = await client.query(
			"SELECT Picture FROM Users WHERE Username=$1;",
			[req.token.client_id]
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

picture.get('/:id', auth, async (req, res) => {
	try {
		const data = await client.query(
			"SELECT Picture FROM Users WHERE Username=$1;",
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

picture.put('/', auth, upload.single('image'), async (req, res) => {
	try {
		const buffer = await sharp(req.file.buffer)
			.resize(200, 200)
			.toBuffer();
		await client.query("UPDATE Users SET Picture=$1 WHERE Username=$2;", [buffer, req.token.client_id]);
		res.sendStatus(204);
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

module.exports = picture;