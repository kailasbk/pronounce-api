const { Client } = require('pg');
const client = new Client({
	connectionString: process.env.DATABASE_URL
});

client.connect()
	.then(console.log('Connected to PostgreSQL'))
	.catch(error => console.log('Connection to PostgreSQL Failed!\n' + error));

module.exports = client;