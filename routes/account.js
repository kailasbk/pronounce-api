const express = require('express');
const jwt = require('jsonwebtoken');
const client = require('../db');
const transport = require('../email');
const auth = require('../middleware/auth');

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
		});

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

account.post('/resend/:id', async (req, res) => {
	try {
		const data = await client.query(`
			SELECT verified, email FROM Users WHERE username=$1`,
			[req.params.id]
		);

		if (data.rows[0].verified !== 'verified') {
			await transport.sendMail({
				from: 'bot@pronouncit.app',
				to: data.rows[0].email,
				subject: 'Verify your Pronouncit Account',
				html: `	<p> Hey there! <p>
						<p> Thanks for creating an account at pronouncit.app! </p>
						<p> Before you can use your account, you need to verify it <a href="www.pronouncit.app/verify/${data.rows[0].verified}">here.</a></p>`
			});
		}
		else {
			console.log('Account already verified.')
		}

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

account.post('/reset/new/:type', auth, async (req, res) => {
	try {
		await client.query(`
			INSERT INTO Resets (email, type)
			VALUES ($1, $2);`,
			[req.token.email, req.params.type]
		);

		const data = await client.query(`
			SELECT id, type, email
			FROM Resets
			WHERE email=$1`,
			[req.token.email]
		);

		await transport.sendMail({
			from: 'bot@pronouncit.app',
			to: data.rows[0].email,
			subject: `Reset you Pronouncit ${data.rows[0].type}`,
			html: `	<p> Hey there! <p>
					<p> It seems that you have requested a ${data.rows[0].type} reset! </p>
					<p> You can do so <a href="www.pronouncit.app/reset/${data.rows[0].type}/${data.rows[0].id}">here.</a></p>`
		});

		res.sendStatus(204);
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

// need to void past credentials after updating password or email

account.post('/reset/password', express.json(), async (req, res) => {
	try {
		const data = await client.query(`
			UPDATE Users
			SET password=crypt($2, gen_salt('bf'))
			WHERE email IN (SELECT email FROM Resets WHERE id=$1 AND type='password');`,
			[req.body.id, req.body.value]
		);

		if (data.rowCount === 1) {
			await client.query(`
				DELETE FROM Resets
				WHERE id=$1;`,
				[req.body.id]
			);
			res.sendStatus(204);
		}
		else {
			throw 'Password not updated';
		}

	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

account.post('/reset/email', express.json(), async (req, res) => {
	try {
		await client.query(`ALTER TABLE Users DISABLE TRIGGER ALL;`);

		const data = await client.query(`
			UPDATE Users
			SET email=$2, verified=encode(gen_random_bytes(8), 'hex')
			WHERE email IN (SELECT email FROM Resets WHERE id=$1 AND type='email');`,
			[req.body.id, req.body.value]
		);

		await client.query(`ALTER TABLE Users ENABLE TRIGGER ALL;`);

		if (data.rowCount === 1) {
			await client.query(`
				DELETE FROM Resets
				WHERE id = $1;`,
				[req.body.id]
			);

			const data = await client.query(`
				SELECT verified, email FROM Users WHERE email=$1`,
				[req.body.value]
			);

			await transport.sendMail({
				from: 'bot@pronouncit.app',
				to: data.rows[0].email,
				subject: 'Verify your new email',
				html: `	<p> Hey there! <p>
						<p> You have changed your email address </p>
						<p> You must verify this new email before logging in: <a href="www.pronouncit.app/verify/${data.rows[0].verified}">click here.</a></p>`
			});

			res.sendStatus(204);
		}
		else {
			throw 'Email not updated';
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
		WHERE username = $1; `,
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