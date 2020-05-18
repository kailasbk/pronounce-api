const express = require('express');
const client = require('../db');
const auth = require('../middleware/auth');

// mounted at /invite
const invite = express.Router();
invite.use(auth);

invite.get('/:id', async (req, res) => {
	try {
		const query1 = await client.query(`
			SELECT name, owner
			FROM Groups
			WHERE id IN (SELECT groupid FROM Invites WHERE id=$1 AND email=$2); `,
			[req.params.id, req.token.email]
		)

		const group = query1.rows[0].name;
		const username = query1.rows[0].owner;

		const query2 = await client.query(`
			SELECT firstname, lastname
			FROM Users
			WHERE username=$1;`,
			[username]
		);

		const name = query2.rows[0].firstname + ' ' + query2.rows[0].lastname;

		res.json({
			name,
			username,
			group
		});
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

invite.post('/:id/accept', async (req, res) => {
	try {
		await client.query(`
			UPDATE Groups
			SET members=array_remove(members, $2) || $2
			WHERE id IN (SELECT groupid FROM Invites WHERE id=$1);`,
			[req.params.id, req.token.client_id]
		);

		await client.query(`
			DELETE FROM Invites
			WHERE id=$1 AND email=$2;`,
			[req.params.id, req.token.email]
		);

		res.sendStatus(204);
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

invite.post('/:id/reject', async (req, res) => {
	try {
		await client.query(`
			DELETE FROM Invites
			WHERE id=$1 AND email=$2;`,
			[req.params.id, req.token.email]
		);

		res.sendStatus(204);
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

module.exports = invite;