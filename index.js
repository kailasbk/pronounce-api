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

const audio = require('./routes/audio');
const picture = require('./routes/picture');
const user = require('./routes/user');

const logger = require('./middleware/logger');
const noCache = require('./middleware/no-cache');

app.use(logger);
app.use(noCache);

app.use('/audio', audio);
app.use('/picture', picture);
app.use('/user', user);

app.listen(port, () => console.log(`Starting API at http://localhost:${port}`));