require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/topics', require('./routes/topics'));
app.use('/api/test-results', require('./routes/test-results'));
app.use('/api/scenarios', require('./routes/scenarios'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Retain backend listening on :${port}`));
