const express = require('express');
const app = express();
require('dotenv').config();
const port = 3001;

const cors = require('cors');
app.use(cors({
	origin: '*'
}));
app.disable('x-powered-by');

const account = require('./routes/account');
const user = require('./routes/user');
const group = require('./routes/group');
const invite = require('./routes/invite');
const admin = require('./routes/admin');
const learn = require('./routes/learn');

const logger = require('./middleware/logger');
const noCache = require('./middleware/no-cache');

app.use(logger.start);
app.use(noCache);

app.use('/account', account);
app.use('/user', user);
app.use('/group', group);
app.use('/invite', invite);
app.use('/admin', admin);
app.use('/learn', learn);

app.use(logger.end);

app.listen(port, () => console.log(`Starting API on port ${port}`));