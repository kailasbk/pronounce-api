const express = require('express');
const jwt = require('jsonwebtoken');
const client = require('../db');
const transport = require('../email');
const auth = require('../middleware/auth');

// mounted at /account
const account = express.Router();

account.post('/register', express.json(), async (req, res, next) => {
	try {
		await client.query(`
			INSERT INTO Users (username, firstname, lastname, email, password)
			VALUES ($1, $2, $3, lower($4), crypt($5, gen_salt('bf')));`,
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
		res.logger.add(`Verification email sent to ${data.rows[0].email}`);

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
	finally {
		next();
	}
});

account.post('/login', express.json(), async (req, res, next) => {
	try {
		const data = await client.query(`
			SELECT username, email, verified
			FROM Users
			WHERE username=$1 AND password=crypt($2, password);`,
			[req.body.username, req.body.password]
		);
		if (data.rows.length === 1) {
			const claims = data.rows[0];
			await client.query(`DELETE FROM Refreshes WHERE username=$1`, [claims.username]);
			await client.query(`INSERT INTO Refreshes (username) VALUES ($1)`, [claims.username]);
			const refresh = (await client.query(`SELECT id FROM Refreshes WHERE username=$1`, [claims.username])).rows[0].id;
			const secret = (await client.query(`SELECT id, key FROM Keys WHERE ID=$1`, [1])).rows[0];
			if (claims.verified === 'verified') {
				const token = jwt.sign({ username: claims.username, email: claims.email }, secret.key, { keyid: secret.id.toString() });
				res.send({
					token,
					refresh
				});
				res.logger.add(`Logged in user: ${claims.username}`);
			}
			else {
				res.sendStatus(401);
				res.logger.add(`Login failed: unverified account`);
			}
		}
		else {
			res.sendStatus(404);
			res.logger.add(`Login failed: invalid credentials`);
		}
	} catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

account.post('/resend/:id', async (req, res, next) => {
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
			res.logger.add(`Verification email sent to ${data.rows[0].email}`);
		}
		else {
			res.logger.add('Account already verified.')
		}

		res.sendStatus(204);
	}
	catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

account.post('/verify/:id', async (req, res, next) => {
	try {
		const data = await client.query(`
			UPDATE Users
			SET verified='verified'
			WHERE verified=$1`,
			[req.params.id]
		);

		if (data.rowCount === 1) {
			res.logger.add(`Succesfully verified user`);
			res.sendStatus(204);
		}
		else {
			throw 'Error updating table';
		}
	} catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

account.post('/reset/new/:type', auth, async (req, res, next) => {
	try {
		await client.query(`
			DELETE FROM Resets
			WHERE email=$1`,
			[req.token.email]
		);

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

		if (data.rows.length === 1) {
			await transport.sendMail({
				from: 'bot@pronouncit.app',
				to: data.rows[0].email,
				subject: `Reset you Pronouncit ${data.rows[0].type}`,
				html: `	<p> Hey there! <p>
					<p> It seems that you have requested a ${data.rows[0].type} reset! </p>
					<p> You can do so <a href="www.pronouncit.app/reset/${data.rows[0].type}/${data.rows[0].id}">here.</a></p>`
			});
			res.logger.add(`Reset email sent to ${data.rows[0].email}`);

			res.sendStatus(204);
		}
		else {
			res.logger.add(`No account associated with email: ${req.token.email}`);
			res.sendStatus(404);
		}
	} catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

account.post('/reset/new/:type/:username', async (req, res, next) => {
	try {
		await client.query(`
			DELETE FROM Resets
			WHERE email IN (SELECT email from Users WHERE username=$1)`,
			[req.params.username]
		);

		await client.query(`
			INSERT INTO Resets (email, type)
			VALUES ((SELECT email FROM Users WHERE username=$1), $2);`,
			[req.params.username, req.params.type]
		);

		const data = await client.query(`
			SELECT id, type, email
			FROM Resets
			WHERE email IN (SELECT email FROM Users WHERE username=$1)`,
			[req.params.username]
		);

		if (data.rows.length === 1) {
			await transport.sendMail({
				from: 'bot@pronouncit.app',
				to: data.rows[0].email,
				subject: `Reset you Pronouncit ${data.rows[0].type}`,
				html: `	<p> Hey there! <p>
					<p> It seems that you have requested a ${data.rows[0].type} reset! </p>
					<p> You can do so <a href="www.pronouncit.app/reset/${data.rows[0].type}/${data.rows[0].id}">here.</a></p>`
			});
			res.logger.add(`Reset email sent to ${data.rows[0].email}`);

			res.sendStatus(204);
		}
		else {
			res.logger.add(`No account associated with username: ${req.params.username}`);
			res.sendStatus(404);
		}
	} catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

// delete other resets for that user
account.post('/reset/password', express.json(), async (req, res, next) => {
	try {
		await client.query(`
			DELETE FROM Refreshes WHERE username IN
			(SELECT username from Users WHERE email IN 
			(SELECT email FROM Resets WHERE id=$1 AND type='password'));`,
			[req.body.id]);

		const data = await client.query(`
			UPDATE Users
			SET password=crypt($2, gen_salt('bf'))
			WHERE email IN (SELECT email FROM Resets WHERE id=$1 AND type='password');`,
			[req.body.id, req.body.value]
		);

		if (data.rowCount === 1) {
			await client.query(`
				DELETE FROM Resets
				WHERE id IN (SELECT id FROM Resets WHERE email IN (SELECT email from Resets WHERE id=$1));`,
				[req.body.id]
			);
			res.logger.add(`Successfully reset user password`);
			res.sendStatus(204);
		}
		else {
			throw 'Password not updated';
		}

	} catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

account.post('/reset/email', express.json(), async (req, res, next) => {
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
				WHERE id IN (SELECT id FROM Resets WHERE email IN (SELECT email from Resets WHERE id=$1));`,
				[req.body.id]
			);

			const data = await client.query(`
				SELECT verified, email FROM Users WHERE email=$1;`,
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

			res.logger.add(`Successfully reset user email`);
			res.sendStatus(204);
		}
		else {
			throw 'Email not updated';
		}
	} catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

account.post('/refresh', express.json(), async (req, res, next) => {
	try {
		const data = await client.query(`
			SELECT username, email, verified
			FROM Users
			WHERE username IN (SELECT username FROM Refreshes WHERE id=$1)`,
			[req.body.id]
		);
		if (data.rows.length === 1) {
			const claims = data.rows[0];
			await client.query(`DELETE FROM Refreshes WHERE username=$1`, [claims.username]);
			await client.query(`INSERT INTO Refreshes (username) VALUES ($1)`, [claims.username]);
			const refresh = (await client.query(`SELECT id FROM Refreshes WHERE username=$1`, [claims.username])).rows[0].id;
			const secret = (await client.query(`SELECT id, key FROM Keys WHERE ID=$1`, [1])).rows[0];
			if (claims.verified === 'verified') {
				const token = jwt.sign({ username: claims.username, email: claims.email }, secret.key, { keyid: secret.id.toString() });
				res.send({
					token,
					refresh
				});
				res.logger.add(`Refreshed user token: ${claims.username}`);
			}
			else {
				res.sendStatus(401);
				res.logger.add(`Refresh failed: unverified account`);
			}
		}
		else {
			res.sendStatus(404);
			res.logger.add(`Refresh failed: invalid refresh token`);
		}
	} catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

module.exports = account;