const express = require('express');
const router = express.Router();
const repo = require('../notesRepository');

router.get('/', async (req, res) => {
  res.json(await repo.listCategories());
});

router.post('/', async (req, res) => {
  if (!req.body.name || req.body.name.trim() === '') {
    return res.status(400).json({ error: true, message: 'name zorunlu', fields: { name: 'bos olamaz' } });
  }
  try {
    const category = await repo.createCategory(req.body.name.trim());
    res.status(201).json(category);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: true, message: 'Bu kategori zaten mevcut', fields: {} });
    }
    throw err;
  }
});

module.exports = router;
