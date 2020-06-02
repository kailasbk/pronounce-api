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
			res.logger.add('Authorized admin');
			next();
		}
		else {
			throw 'Unauthorized';
		}
	} catch (err) {
		res.logger.add(err);
		res.logger.add('Unauthorized user');
		res.sendStatus(401);
	}
}

admin.get('/', auth, async (req, res, next) => {
	res.send('Admin Page! (under development)');
});

admin.post('/login', express.json(), async (req, res, next) => {
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
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

admin.get('/users', auth, async (req, res, next) => {
	try {
		const data = await client.query(`
			SELECT username, email FROM Users;
		`);

		res.send(data.rows);
	}
	catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

admin.get('/groups', auth, async (req, res, next) => {
	try {
		const data = await client.query(`
			SELECT id, name, owner FROM Groups;
		`);

		res.send(data.rows);
	}
	catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

admin.post('/init', auth, async (req, res, next) => {
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
				time timestamptz DEFAULT now(),
				FOREIGN KEY (groupId) REFERENCES Groups(id)
			);

			CREATE TABLE Feedback (
				id text PRIMARY KEY DEFAULT encode(gen_random_bytes(8), 'hex'),
				asker text,
				giver text,
				attempt bytea,
				feedback bytea,
				sent timestamptz DEFAULT now(),
				given timestamptz,
				FOREIGN KEY (asker) REFERENCES Users(username),
				FOREIGN KEY (giver) REFERENCES Users(username)
			);

			CREATE TYPE reset_t AS ENUM('password', 'email');

			CREATE TABLE Resets (
				id text PRIMARY KEY DEFAULT encode(gen_random_bytes(8), 'hex'),
				type reset_t,
				email text NOT NULL,
				FOREIGN KEY (email) REFERENCES Users(email)
			);	
		`);

		res.logger.add(`Successfully initialized PostgreSQL database`);
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

admin.delete('/delete', auth, async (req, res, next) => {
	try {
		await client.query(`
			DROP TABLE IF EXISTS Resets;
			DROP TYPE IF EXISTS reset_t;
			DROP TABLE IF EXISTS Invites;
			DROP TABLE IF EXISTS Groups;
			DROP TABLE IF EXISTS Keys;
			DROP TABLE IF EXISTS Users;
			DROP EXTENSION IF EXISTS pgcrypto
		`);

		res.logger.add(`Successfully wiped PostgreSQL database`);
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

module.exports = admin;