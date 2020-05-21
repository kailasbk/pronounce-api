const express = require('express');
const jwt = require('jsonwebtoken');
const client = require('../db');
const transport = require('../email');

const admin = express.Router();

// custom auth for admin account
function auth(req, res, next) {
	const bearer = req.header('Authorization');
	try {
		const token = bearer.split(' ')[1];
		const payload = jwt.verify(token, process.env.ADMIN_SECRET);
		if (payload.admin === true) {
			console.log('Authorized admin');
			next();
		}
		else {
			throw 'Unauthorized';
		}
	} catch (err) {
		console.log(err);
		console.log('Unauthorized user');
		res.sendStatus(401);
	}
}

admin.get('/', auth, async (req, res) => {
	res.send('Admin Page! (under development)');
});

admin.post('/login', express.json(), async (req, res) => {
	try {
		if (req.body.password === process.env.ADMIN_PASSWORD) {
			const token = jwt.sign({ admin: true }, process.env.ADMIN_SECRET);
			res.send(token);
		}
		else {
			res.sendStatus(401);
		}
	}
	catch (err) {
		res.sendStatus(500);
	}
});

admin.get('/users', auth, async (req, res) => {
	try {
		const data = await client.query(`
			SELECT username, email FROM Users;
		`);

		res.send(data.rows);
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

admin.get('/groups', auth, async (req, res) => {
	try {
		const data = await client.query(`
			SELECT id, name, owner FROM Groups;
		`);

		res.send(data.rows);
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

admin.post('/init', auth, async (req, res) => {
	try {
		await client.query(`
			CREATE EXTENSION IF NOT EXISTS pgcrypto;

			CREATE TABLE Keys (
				id SERIAL PRIMARY KEY,
				key text DEFAULT encode(gen_random_bytes(32), 'hex') 
			);

			INSERT INTO Keys DEFAULT VALUES;

			CREATE TABLE Users (
				username text PRIMARY KEY,
				password text NOT NULL,
				firstname text NOT NULL,
				nickname text NOT NULL DEFAULT '',
				lastname text NOT NULL,
				pronouns text NOT NULL DEFAULT '',
				email text UNIQUE NOT NULL,
				verified text DEFAULT encode(gen_random_bytes(8), 'hex'),
				picture bytea,
				audio bytea
			);
			
			CREATE TABLE Refreshes (
				id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
				username text,
				FOREIGN KEY (username) REFERENCES Users(username)
			);

			CREATE TABLE Groups (
				id text PRIMARY KEY DEFAULT encode(gen_random_bytes(8), 'hex'),
				name text NOT NULL,
				owner text NOT NULL,
				members text[],
				FOREIGN KEY (owner) REFERENCES Users(username)
			);

			CREATE TABLE Invites (
				id text PRIMARY KEY DEFAULT encode(gen_random_bytes(8), 'hex'),
				groupId text NOT NULL,
				email text NOT NULL,
				FOREIGN KEY (groupId) REFERENCES Groups(id)
			);

			CREATE TYPE reset_t AS ENUM('password', 'email');

			CREATE TABLE Resets (
				id text PRIMARY KEY DEFAULT encode(gen_random_bytes(8), 'hex'),
				type reset_t,
				email text NOT NULL,
				FOREIGN KEY (email) REFERENCES Users(email)
			);	
		`);

		res.sendStatus(204);
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

admin.delete('/delete', auth, async (req, res) => {
	try {
		await client.query(`
			DROP TABLE Resets;
			DROP TYPE reset_t;
			DROP TABLE Invites;
			DROP TABLE Groups;
			DROP TABLE Keys;
			DROP TABLE Users;
		`);

		res.sendStatus(204);
	}
	catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

admin.post('/email', auth, async (req, res) => {
	await transport.sendMail({
		from: "bot@pronouncit.app",
		to: "kailasbk230@gmail.com",
		subject: "Message title",
		html: `	<p> Hey there! <p>
				<p> You have been invited to join a pronouncit group! </p>
				<p> <u> Already a user? </u> </p>
				<p> Login here: <a href="www.pronouncit.app/login"> www.pronouncit.app/login </a> <p>
				<p> <u> Don't have an account? </u> <p>
				<p> Signup here: <a href="www.pronouncit.app/register?email=kailasbk230@gmail.com"> www.pronouncit.app/register </a> <p>`
	});
	res.sendStatus(200);
});

module.exports = admin;