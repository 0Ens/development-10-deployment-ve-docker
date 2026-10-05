const express = require('express');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const notesRouter = require('./routes/notes');
const categoriesRouter = require('./routes/categories');
const authRouter = require('./routes/auth');
const messagesRouter = require('./routes/messages');
const cors = require('cors');

const app = express();

// Izinli origin'ler CORS_ORIGIN'den okunur (virgulle birden fazla verilebilir).
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));

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
