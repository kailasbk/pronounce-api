const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

const cors = require('cors');
app.use(cors({
	origin: '*'
}));
app.disable('x-powered-by');

const account = require('./routes/account');
const user = require('./routes/user');
const profile = require('./routes/profile');
const group = require('./routes/group');
const invite = require('./routes/invite');
const admin = require('./routes/admin');

const logger = require('./middleware/logger');
const noCache = require('./middleware/no-cache');

app.use(logger);
app.use(noCache);

app.use('/account', account);
app.use('/user/0', profile);
app.use('/user', user);
app.use('/group', group);
app.use('/invite', invite);
app.use('/admin', admin);

app.listen(port, () => console.log(`Starting API on port ${port}`));