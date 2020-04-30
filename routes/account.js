const express = require('express');
const jwt = require('jsonwebtoken');
const client = require('../db');
const auth = require('../middleware/auth');

// mounted at /account
const account = express.Router();

account.post('/register', express.json(), async (req, res) => {
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
			res.status(400).send('Bad Username');
		}
		else if (err.constraint === 'users_email_key') {
			res.status(400).send('Bad Email');
		}
		else {
			res.sendStatus(500);
		}
	}
});

account.post('/login', express.json(), async (req, res) => {
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

account.post('/refresh', async (req, res) => {
	res.sendStatus(200);
});

// not live (move to admin?)
/*
account.delete('/', auth, async (req, res) => {
	try {
		const data = await client.query(`
			DELETE FROM Users
			WHERE username=$1;`,
			[req.token.client_id]
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
*/

module.exports = account;