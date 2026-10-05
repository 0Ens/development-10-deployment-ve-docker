const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../userRepository');

const BCRYPT_ROUNDS = 12;

function validateRegisterBody(body) {
  const fields = {};
  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    fields.email = 'Gecerli bir e-posta adresi giriniz';
  }
  if (!body.password || typeof body.password !== 'string' || body.password.length < 8) {
    fields.password = 'Parola en az 8 karakter olmalidir';
  }
  return fields;
}

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const errors = validateRegisterBody(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: true, message: 'Dogrulama hatasi', fields: errors });
    }

    const { email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    try {
      const user = createUser(email.toLowerCase().trim(), passwordHash);
      res.status(201).json({ id: user.id, email: user.email, created_at: user.created_at });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: true, message: 'Bu e-posta zaten kayitli', fields: {} });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: true, message: 'Dogrulama hatasi', fields: {} });
    }

    const user = findUserByEmail(email.toLowerCase().trim());
    const passwordMatch = user ? await bcrypt.compare(password, user.password_hash) : false;

    // Her iki basarisizlik durumunda ayni jenerik mesaj
    if (!user || !passwordMatch) {
      return res.status(401).json({ error: true, message: 'E-posta veya sifre hatali' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  // JWT stateless: client token'i dusuruyor.
  // Kisa omur (1h) sayesinde token kendiliğinden gecersiz olur.
  res.json({ message: 'Cikis yapildi. Token client tarafinda silinmeli.' });
});

module.exports = router;
