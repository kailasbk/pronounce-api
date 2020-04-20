const express = require('express');
const app = express();
const port = 3001;

const cors = require('cors');
app.use(cors({
	origin: '*'
}));
app.disable('x-powered-by');

const multer = require('multer');
const upload = multer();
const fs = require('fs');

const { Client } = require('pg');
const client = new Client({
	user: 'postgres',
	password: 'Awsome230!',
	database: 'pronounce'
});

function nocache(req, res, next) {
	res.set({
		'Cache-Control': 'no-cache'
	});
	next();
}

app.use(nocache);

client.connect()
	.then(console.log('Connected to PostgresSQL'))
	.catch(error => console.log('Connection to PostgresSQL Failed!\n' + error));

app.post('/register', express.json(), async (req, res) => {
	try {
		let data = await client.query(`INSERT INTO Users (username, password, firstname, lastname, email)
									   VALUES ($1, $2, $3, $4, $5);`,
			[req.body.username, req.body.password, req.body.firstname, req.body.lastname, req.body.email]);
		res.sendStatus(200);
	} catch (err) {
		console.error(err);
		if (err.constraint === 'users_pkey') {
			res.sendStatus(400);
		}
		else {
			res.sendStatus(500);
		}
	}
});

app.post('/login', async (req, res) => {
	// create a new user in the table
});

app.post('/profile', async (req, res) => {
	try {
		let data = await client.query("SELECT * FROM Users WHERE UserName=$1;", [req.query.u]);
		if (data.rowCount > 0) {
			var user = data.rows[0];
			res.json(user);
		}
		else {
			res.sendStatus(404);
		}
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

app.get('/image', async (req, res) => {
	try {
		let data = await client.query("SELECT Data FROM Images WHERE Id=$1;", [req.query.q]);
		if (data.rowCount > 0) {
			var image = data.rows[0].data;
			res.type('image/jpeg');
			res.send(image);
		}
		else {
			res.sendStatus(404);
		}
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

app.put('/image', upload.single('image'), async (req, res) => {
	// update image with query {q} and {u}
	try {
		await client.query("UPDATE Images SET Data=$3 WHERE Id=$1 AND Username=$2;", [req.query.q, req.query.u, req.file.buffer]);
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}

	res.sendStatus(200);
});

app.get('/audio', async (req, res) => {
	try {
		let data = await client.query("SELECT Data FROM Recordings WHERE Id=$1;", [req.query.q]);
		if (data.rowCount > 0) {
			var image = data.rows[0].data;
			res.type('audio/m4a');
			res.send(image);
		}
		else {
			res.sendStatus(404);
		}
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	};
});

app.put('/audio', upload.single('file'), async (req, res) => {
	// update audio with query {q} and {u}
	try {
		await client.query("UPDATE Recordings SET Data=$3 WHERE Id=$1 AND Username=$2;", [req.query.q, req.query.u, req.file.buffer]);
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}

	res.sendStatus(200);
});

app.listen(port, () => console.log(`Starting API at http://localhost:${port}`));