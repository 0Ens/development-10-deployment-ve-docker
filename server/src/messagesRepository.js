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

function listMessages() {
  return getDb()
    .prepare(`${SELECT_MESSAGE} ORDER BY m.id DESC`)
    .all()
    .map(toApiShape);
}

function createMessage(userId, text) {
  const db = getDb();
  const result = db.prepare('INSERT INTO messages (user_id, text) VALUES (?, ?)').run(userId, text);
  const row = db.prepare(`${SELECT_MESSAGE} WHERE m.id = ?`).get(result.lastInsertRowid);
  return toApiShape(row);
}

module.exports = { listMessages, createMessage };
