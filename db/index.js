const { Client } = require('pg');
const client = new Client({
	user: 'postgres',
	password: 'Awsome230!',
	database: 'pronounce'
});

client.connect()
	.then(console.log('Connected to PostgreSQL'))
	.catch(error => console.log('Connection to PostgreSQL Failed!\n' + error));

module.exports = client;