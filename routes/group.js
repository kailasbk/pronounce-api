const express = require('express');
const client = require('../db');
const auth = require('../middleware/auth');
const transport = require('../email');

// mounted at /group
const group = express.Router();
group.use(auth);

group.get('/all', async (req, res, next) => {
	try {
		const data = await client.query(`
			SELECT owner, members
			FROM Groups
			WHERE owner=$1 OR members@>ARRAY[$1];`,
			[req.token.username]
		);

		let members = [];
		data.rows.forEach(entry => {
			members = members.concat(([entry.owner].concat(entry.members)));
		});

		let sorted = [];
		members.forEach(value => {
			if (!sorted.includes(value) && value !== req.token.username) {
				sorted.push(value);
			}
		})
		members = sorted;

		res.json({
			name: 'All groups',
			owner: req.token.username,
			members: members,
			me: req.token.username
		});
	}
	catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next('router');
	}
});

group.post('/new', express.json(), async (req, res, next) => {
	try {
		const members = req.body.members ? req.body.members : [];
		await client.query(`
			INSERT INTO Groups (name, owner, members)
			VALUES ($1, $2, $3);`,
			[req.body.name, req.token.username, members]
		);

		res.sendStatus(204);
	}
	catch (err) {
		res.logger.add(err);
		if (err.constraint === 'groups_owner_fkey') {
			res.sendStatus(400);
		}
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

group.get('/:id', async (req, res, next) => {
	try {
		const data = await client.query(`
			SELECT name, owner, members
			FROM Groups
			WHERE id=$1;`,
			[req.params.id]
		);
		const name = data.rows[0].name;
		const owner = data.rows[0].owner;
		const members = data.rows[0].members;
		const sorted = members.sort();

		res.json({
			name: name,
			owner: owner,
			members: sorted,
			me: req.token.username
		});
	}
	catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

group.get('/:id/emails', async (req, res, next) => {
	try {
		const data = await client.query(`
			SELECT email
			FROM Users
			WHERE ((SELECT members FROM Groups WHERE id=$1)@>ARRAY[username]) OR username IN (SELECT owner FROM Groups WHERE id=$1);`,
			[req.params.id]
		);

		res.send(data.rows.map(row => row.email));
	} catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
})

group.post('/:id/invite', express.json(), async (req, res, next) => {
	try {
		const data = await client.query('SELECT owner FROM Groups WHERE id=$1;', [req.params.id]);
		const owner = data.rows[0].owner;

		if (owner === req.token.username) {
			const emails = req.body.emails;
			const promises = emails.map(email => new Promise(async (resolve, reject) => {
				try {
					const emailHTML =
						`
					<p> Hey there! <p>
					<p> You have been invited to join a pronouncit group! </p>
					<p> <u> Already a user? </u> </p>
					<p> Login here: <a href="www.pronouncit.app/login"> www.pronouncit.app/login </a> </p>
					<p> <u> Don't have an account? </u> </p>
					<p> Signup here: <a href="www.pronouncit.app/register?email=${email}"> www.pronouncit.app/register <a> </p>
						`;

					await transport.sendMail({
						from: "bot@pronouncit.app",
						to: email,
						subject: "New pronouncit invite",
						html: emailHTML
					});

					await client.query(`
						INSERT INTO Invites (groupId, email)
						VALUES ($1, $2);`,
						[req.params.id, email]
					);

					res.logger.add(`Sent invite to ${email}`)
					resolve();
				} catch (err) {
					res.logger.add(`Failed to invite: ${email} with ${err}`)
					resolve();
				}
			}))

			await Promise.all(promises);

			res.sendStatus(204);
		}
		else {
			res.sendStatus(401);
		}
	}
	catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

group.post('/:id/remove', express.json(), async (req, res, next) => {
	try {
		req.body.members.forEach(async (member) => {
			await client.query(`
		 		UPDATE Groups
				SET members=array_remove(members, $1)
				WHERE id=$2 AND owner=$3;`,
				[member, req.params.id, req.token.username]
			);

			await client.query(`
				DELETE FROM Invites
				WHERE email IN (SELECT email FROM Users WHERE username=$1)`,
				[member]
			);
		});

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

group.delete('/:id', async (req, res, next) => {
	try {
		const data = await client.query('SELECT owner FROM Groups WHERE id=$1;', [req.params.id]);
		const owner = data.rows[0].owner;

		if (owner === req.params.id) {
			await client.query(`
				DELETE FROM Groups
				WHERE id=$1 AND owner=$2`,
				[req.params.id, req.token.username]
			);

			await client.query(`
				DELETE FROM Invites
				WHERE groupid=$1;`,
				[req.params.id]
			);
			res.sendStatus(204);
		}
		else {
			res.sendStatus(401);
		}
	}
	catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

module.exports = group;