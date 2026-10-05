const express = require('express');
const router = express.Router();
const repo = require('../notesRepository');
const authenticateToken = require('../middleware/auth');

function validateNote(body) {
  const fields = {};
  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    fields.title = 'title zorunlu ve bos olamaz';
  }
  return fields;
}

router.use(authenticateToken);

router.get('/', (req, res) => {
  res.json(repo.listNotes(req.user.id));
});

router.get('/:id', (req, res) => {
  const note = repo.getNote(req.user.id, parseInt(req.params.id));
  if (!note) {
    return res.status(404).json({ error: true, message: 'Not bulunamadi', fields: {} });
  }
  res.json(note);
});

router.post('/', (req, res) => {
  const errors = validateNote(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: true, message: 'Dogrulama hatasi', fields: errors });
  }
  const note = repo.createNote(
    req.user.id,
    req.body.title.trim(),
    req.body.content || '',
    req.body.category_id ?? null
  );
  res.status(201).json(note);
});

router.put('/:id', (req, res) => {
  const errors = validateNote(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: true, message: 'Dogrulama hatasi', fields: errors });
  }
  const note = repo.updateNote(
    req.user.id,
    parseInt(req.params.id),
    req.body.title.trim(),
    req.body.content !== undefined ? req.body.content : '',
    req.body.category_id ?? null
  );
  if (!note) {
    return res.status(404).json({ error: true, message: 'Not bulunamadi', fields: {} });
  }
  res.json(note);
});

router.delete('/:id', (req, res) => {
  const deleted = repo.deleteNote(req.user.id, parseInt(req.params.id));
  if (!deleted) {
    return res.status(404).json({ error: true, message: 'Not bulunamadi', fields: {} });
  }
  res.status(204).send();
});

module.exports = router;
