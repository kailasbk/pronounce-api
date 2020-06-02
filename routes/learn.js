const express = require('express');
const client = require('../db');
const multer = require('multer');
const upload = multer();
const auth = require('../middleware/auth');

// mounted at /learn
const learn = express.Router();
learn.use(auth)

learn.post('/feedback/request', upload.single('audio'), async (req, res, next) => {
	try {
		await client.query(`
			INSERT INTO Feedback (asker, giver, attempt)
			VALUES ($1, $2, $3);`,
			[req.token.username, req.body.username, req.file.buffer]
		);

		res.sendStatus(204);
	} catch (err) {
		res.logger.add(err);
		res.sendStatus(500);
	}
	finally {
		next();
	}
});

learn.get('/feedback/:id', async (req, res, next) => {
	try {
		const data = await client.query(`
			SELECT 
			(SELECT firstname || ' ' || lastname AS askername FROM Users WHERE username=asker),
			(SELECT firstname || ' ' || lastname AS givername FROM Users WHERE username=giver),
			asker, giver, sent, given
			FROM Feedback
			WHERE id=$1 AND (asker=$2 OR giver=$2);`,
			[req.params.id, req.token.username]
		);

		if (data.rows.length === 1) {
			res.send(data.rows[0]);
		}
		else {
			res.logger.add(`Feedback entry ${req.params.id} not found`);
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

learn.delete('/feedback/:id', async (req, res, next) => {
	try {
		const data = await client.query(`
			DELETE FROM Feedback
			WHERE id=$1 AND (asker=$2 or giver=$2);`,
			[req.params.id, req.token.username]
		);

		if (data.rows.length === 1) {
			res.send(204);
		}
		else {
			res.logger.add(`Feedback entry ${req.params.id} not found`);
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

learn.post('/feedback/:id/give', upload.single('audio'), async (req, res, next) => {
	try {
		const data = await client.query(`
			UPDATE Feedback
			SET feedback=$3, given=now()
			WHERE id=$1 AND giver=$2;`,
			[req.params.id, req.token.username, req.file.buffer]
		);

		if (data.rowCount === 1) {
			res.sendStatus(204);
		}
		else {
			res.logger.add(`Feedback entry ${req.params.id} not found`);
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

learn.get('/feedback/:id/attempt', async (req, res, next) => {
	try {
		const data = await client.query(`
			SELECT attempt
			FROM Feedback
			WHERE id=$1 AND (asker=$2 OR giver=$2);`,
			[req.params.id, req.token.username]
		);

		if (data.rows.length === 1) {
			res.type('audio/ogg');
			res.send(data.rows[0].attempt);
		}
		else {
			res.logger.add(`Feedback entry ${req.params.id} not found`);
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

learn.get('/feedback/:id/feedback', async (req, res, next) => {
	try {
		const data = await client.query(`
			SELECT feedback
			FROM Feedback
			WHERE id=$1 AND (asker=$2 OR giver=$2);`,
			[req.params.id, req.token.username]
		);

		if (data.rows.length === 1) {
			res.type('audio/ogg');
			res.send(data.rows[0].feedback);
		}
		else {
			res.logger.add(`Feedback entry ${req.params.id} not found`);
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

module.exports = learn;