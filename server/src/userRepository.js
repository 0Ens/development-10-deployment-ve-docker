const { getDb } = require('./db');

async function createUser(email, passwordHash) {
  const db = await getDb();
  const result = await db.execute({
    sql: 'INSERT INTO users (email, password_hash) VALUES (?, ?)',
    args: [email, passwordHash],
  });
  const created = await db.execute({
    sql: 'SELECT id, email, created_at FROM users WHERE id = ?',
    args: [Number(result.lastInsertRowid)],
  });
  return created.rows[0];
}

async function findUserByEmail(email) {
  const db = await getDb();
  const result = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
  return result.rows[0] ?? null;
}

module.exports = { createUser, findUserByEmail };
