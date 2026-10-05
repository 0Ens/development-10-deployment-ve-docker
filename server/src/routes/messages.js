const express = require('express');
const router = express.Router();
const repo = require('../messagesRepository');
const authenticateToken = require('../middleware/auth');

const MAX_LENGTH = 500;

function validateMessage(body) {
  const fields = {};
  if (typeof body.text !== 'string' || body.text.trim() === '') {
    fields.text = 'Mesaj bos olamaz';
  } else if (body.text.trim().length > MAX_LENGTH) {
    fields.text = `Mesaj en fazla ${MAX_LENGTH} karakter olabilir`;
  }
  return fields;
}

router.get('/', (req, res) => {
  res.json(repo.listMessages());
});

router.post('/', authenticateToken, (req, res) => {
  const errors = validateMessage(req.body ?? {});
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: true, message: 'Dogrulama hatasi', fields: errors });
  }
  const message = repo.createMessage(req.user.id, req.body.text.trim());
  res.status(201).json(message);
});

module.exports = router;
