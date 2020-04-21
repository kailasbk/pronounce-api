const express = require('express');
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
	const bearer = req.header('Authorization');
	try {
		const token = bearer.split(' ')[1];
		const payload = jwt.verify(token, 'secret');
		req.token = payload;
		console.log('Authorized user: ' + req.token.client_id);
		next();
	} catch (err) {
		console.log('Unauthorized user');
		res.sendStatus(401);
	}
}

module.exports = auth;
