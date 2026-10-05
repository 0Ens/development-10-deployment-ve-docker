const { getDb } = require('./db');

const SELECT_MESSAGE = `
  SELECT m.id, m.text, m.created_at, u.email
  FROM messages m
  JOIN users u ON u.id = m.user_id
`;

// Guestbook herkese acik: tam e-posta yerine sadece @ oncesini gosteriyoruz.
function toApiShape(row) {
  return {
    id: row.id,
    author: row.email.split('@')[0],
    text: row.text,
    createdAt: row.created_at,
  };
}

async function listMessages() {
  const db = await getDb();
  const result = await db.execute(`${SELECT_MESSAGE} ORDER BY m.id DESC`);
  return result.rows.map(toApiShape);
}

async function createMessage(userId, text) {
  const db = await getDb();
  const result = await db.execute({
    sql: 'INSERT INTO messages (user_id, text) VALUES (?, ?)',
    args: [userId, text],
  });
  const created = await db.execute({
    sql: `${SELECT_MESSAGE} WHERE m.id = ?`,
    args: [Number(result.lastInsertRowid)],
  });
  return toApiShape(created.rows[0]);
}

module.exports = { listMessages, createMessage };
