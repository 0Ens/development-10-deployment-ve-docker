const express = require('express');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const notesRouter = require('./routes/notes');
const categoriesRouter = require('./routes/categories');
const authRouter = require('./routes/auth');
const messagesRouter = require('./routes/messages');

const app = express();

app.use(logger);
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/notes', notesRouter);
app.use('/categories', categoriesRouter);
app.use('/api/messages', messagesRouter);

app.use(errorHandler);

module.exports = app;
