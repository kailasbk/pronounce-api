const express = require('express');
const jwt = require('jsonwebtoken');
const client = require('../db');
const transport = require('../email');

// mounted at /account
const account = express.Router();

account.post('/register', express.json(), async (req, res) => {
	try {
		await client.query(`
			INSERT INTO Users (username, firstname, lastname, email, password)
			VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf')));`,
			[req.body.username, req.body.firstname, req.body.lastname, req.body.email, req.body.password]
		);

		const data = await client.query(`
			SELECT verified, email FROM Users WHERE username=$1`,
			[req.body.username]
		);

		await transport.sendMail({
			from: 'bot@pronouncit.app',
			to: data.rows[0].email,
			subject: 'Verify your Pronouncit Account',
			html: `	<p> Hey there! <p>
					<p> Thanks for creating an account at pronouncit.app! </p>
					<p> Before you can use your account, you need to verify it <a href="www.pronouncit.app/verify/${data.rows[0].verified}">here.</a></p>`
		})

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
			SELECT username, email, verified
			FROM Users
			WHERE username=$1 AND password=crypt($2, password);`,
			[req.body.username, req.body.password]
		);
		if (data.rows.length === 1) {
			const claims = data.rows[0];
			if (claims.verified === 'verified') {
				const token = jwt.sign({ client_id: claims.username, email: claims.email }, 'secret');
				res.send(token);
			}
			else {
				res.sendStatus(401);
			}
		}
		else {
			res.sendStatus(404);
		}
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

account.get('/resend/:id', async (req, res) => {
	try {
		const data = await client.query(`
			SELECT verified, email FROM Users WHERE username=$1`,
			[req.params.id]
		);

		await transport.sendMail({
			from: 'bot@pronouncit.app',
			to: data.rows[0].email,
			subject: 'Verify your Pronouncit Account',
			html: `	<p> Hey there! <p>
					<p> Thanks for creating an account at pronouncit.app! </p>
					<p> Before you can use your account, you need to verify it <a href="www.pronouncit.app/verify/${data.rows[0].verified}">here.</a></p>`
		})

		res.sendStatus(204);
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

account.post('/verify/:id', async (req, res) => {
	try {
		const data = await client.query(`
			UPDATE Users
			SET verified='verified'
			WHERE verified=$1`,
			[req.params.id]
		);

		if (data.rowCount === 1) {
			res.sendStatus(204);
		}
		else {
			throw 'Error updating table';
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