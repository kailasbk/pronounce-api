const express = require('express');
const client = require('../db');
const auth = require('../middleware/auth');

const group = express.Router();

group.use('/all', auth, async (req, res) => {
	try {
		const data = await client.query(`
			SELECT username, firstname, lastname, email, picture, audio
			FROM Users;
		`);
		const members = data.rows;

		res.json({
			name: "John Doe's Group",
			members: members
		});
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

group.use('/new', auth, async (req, res) => {
	try {
		const data = await client.query(`
			SELECT username, firstname, lastname, email, picture, audio
			FROM Users;
		`);
		const members = data.rows;

		res.json({
			name: "John Doe's Group",
			members: members
		});
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

group.use('/:id', auth, async (req, res) => {
	try {
		const data = await client.query(`
			SELECT username, firstname, lastname, email, picture, audio
			FROM Users;
		`);
		const members = data.rows;

		res.json({
			name: "John Doe's Group",
			members: members
		});
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

group.use('/:id/add', auth, async (req, res) => {
	try {
		const data = await client.query(`
			SELECT username, firstname, lastname, email, picture, audio
			FROM Users;
		`);
		const members = data.rows;

		res.json({
			name: "John Doe's Group",
			members: members
		});
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

group.use('/:id/delete', auth, async (req, res) => {
	try {
		const data = await client.query(`
			SELECT username, firstname, lastname, email, picture, audio
			FROM Users;
		`);
		const members = data.rows;

		res.json({
			name: "John Doe's Group",
			members: members
		});
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

module.exports = group;