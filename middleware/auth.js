const express = require('express');
const jwt = require('jsonwebtoken');
const client = require('../db');

function getKey(header, callback) {
	client.query(`SELECT key FROM Keys WHERE id=$1`, [header.kid])
		.then(res => {
			callback(null, res.rows[0].key);
		});
}

function auth(req, res, next) {
	const bearer = req.header('Authorization');
	try {
		const token = bearer.split(' ')[1];
		jwt.verify(token, getKey, function (err, payload) {
			if (err) {
				throw 'Invalid JWT'
			}
			req.token = payload;
			res.logger.add('Authorized user: ' + req.token.username);
			next();
		});
	} catch (err) {
		res.logger.add('Unauthorized user');
		res.sendStatus(401);
	}
}

module.exports = auth;