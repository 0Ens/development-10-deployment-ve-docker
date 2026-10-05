const { getDb } = require('./db');

function createUser(email, passwordHash) {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)'
  ).run(email, passwordHash);
  return db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
}

function findUserByEmail(email) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) ?? null;
}

module.exports = { createUser, findUserByEmail };
