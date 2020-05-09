const express = require('express');
const client = require('../db');
const auth = require('../middleware/auth');

// mounted at /group
const group = express.Router();
group.use(auth);

group.get('/all', async (req, res) => {
	try {
		const data = await client.query(`
			SELECT username
			FROM Users
			ORDER BY username ASC;`
		);
		const members = data.rows.map(entry => entry.username);

		res.json({
			name: "Users",
			members: members
		});
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

group.post('/new', express.json(), async (req, res) => {
	try {
		await client.query(`
			INSERT INTO Groups (name, owner, members)
			VALUES ($1, $2, $3);`,
			[req.body.name, req.token.client_id, req.body.members]
		);

		res.sendStatus(204);
	}
	catch (err) {
		console.log(err);
		if (err.constraint === 'groups_owner_fkey') {
			res.sendStatus(400);
		}
		res.sendStatus(500);
	}
});

group.get('/:id', async (req, res) => {
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
			me: req.token.client_id
		});
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

group.post('/:id/add', express.json(), async (req, res) => {
	try {
		await client.query(`
		 	UPDATE Groups
			SET members=members || $1
			WHERE id=$2 AND owner=$3;`,
			[req.body.members, req.params.id, req.token.client_id]
		);

		res.sendStatus(204);
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

group.post('/:id/remove', express.json(), async (req, res) => {
	try {
		req.body.members.forEach(async (member) => {
			await client.query(`
		 		UPDATE Groups
				SET members=array_remove(members, $1)
				WHERE id=$2 AND owner=$3;`,
				[member, req.params.id, req.token.client_id]
			);
		});

		res.sendStatus(204);
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

group.delete('/:id', async (req, res) => {
	try {
		await client.query(`
			DELETE FROM Groups
			WHERE id=$1 AND owner=$2`,
			[req.params.id, req.token.client_id]
		);

		res.sendStatus(204);
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

module.exports = group;