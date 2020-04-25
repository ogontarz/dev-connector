const express = require('express');
const connectDB = require('../config/db');

const app = express();

const PORT = process.env.PORT || 5000;

connectDB();

app.use(express.json({ extended: false }));

app.get('/', (req, res) => {
	res.send('Welcome to dev-connector app!');
});

app.use('/api/users', require('./routes/api/users'));
app.use('/api/profiles', require('./routes/api/profiles'));
app.use('/api/posts', require('./routes/api/posts'));

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
});
