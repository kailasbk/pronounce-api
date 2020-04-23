const express = require('express');
const jwt = require('jsonwebtoken');
const client = require('../db');
const auth = require('../middleware/auth');

const user = express.Router();

user.post('/register', express.json(), async (req, res) => {
	try {
		await client.query(`
			INSERT INTO Users (username, firstname, lastname, email, password)
			VALUES ($1, $2, $3, $4, $5);`,
			[req.body.username, req.body.firstname, req.body.lastname, req.body.email, req.body.password]
		);
		res.sendStatus(204);
	} catch (err) {
		console.error(err);
		if (err.constraint === 'users_pkey') {
			res.sendStatus(400);
		}
		else {
			res.sendStatus(500);
		}
	}
});

user.post('/login', express.json(), async (req, res) => {
	try {
		const data = await client.query(`
			SELECT username, email
			FROM Users
			WHERE username=$1 AND password=$2;`, // include hash later on
			[req.body.username, req.body.password]
		);
		if (data.rows.length === 1) {
			const claims = data.rows[0];
			const token = jwt.sign({ client_id: claims.username, email: claims.email }, 'secret');
			res.send(token);
		}
		else {
			res.sendStatus(400);
		}
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

user.get('/me', auth, async (req, res) => {
	try {
		const data = await client.query(`
			SELECT username, firstname, lastname, pronouns, email, picture, audio
			FROM Users
			WHERE UserName=$1;`,
			[req.token.client_id]
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

user.get('/:id', auth, async (req, res) => {
	try {
		const data = await client.query(`
			SELECT username, firstname, lastname, pronouns, email, picture, audio 
			FROM Users
			WHERE UserName=$1;`,
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

module.exports = user;