const { getDb } = require('./db');

const SELECT_NOTE = `
  SELECT n.id, n.title, n.content, n.category_id, n.created_at,
         c.name AS category_name
  FROM notes n
  LEFT JOIN categories c ON c.id = n.category_id
`;

async function createNote(userId, title, content = '', categoryId = null) {
  const db = await getDb();
  const result = await db.execute({
    sql: 'INSERT INTO notes (user_id, title, content, category_id) VALUES (?, ?, ?, ?)',
    args: [userId, title, content, categoryId],
  });
  return getNote(userId, Number(result.lastInsertRowid));
}

async function listNotes(userId) {
  const db = await getDb();
  const result = await db.execute({
    sql: `${SELECT_NOTE} WHERE n.user_id = ? ORDER BY n.id`,
    args: [userId],
  });
  return result.rows;
}

async function getNote(userId, id) {
  const db = await getDb();
  const result = await db.execute({
    sql: `${SELECT_NOTE} WHERE n.id = ? AND n.user_id = ?`,
    args: [id, userId],
  });
  return result.rows[0] ?? null;
}

async function updateNote(userId, id, title, content, categoryId) {
  const db = await getDb();
  const result = await db.execute({
    sql: 'UPDATE notes SET title = ?, content = ?, category_id = ? WHERE id = ? AND user_id = ?',
    args: [title, content, categoryId ?? null, id, userId],
  });
  if (result.rowsAffected === 0) return null;
  return getNote(userId, id);
}

async function deleteNote(userId, id) {
  const db = await getDb();
  const result = await db.execute({
    sql: 'DELETE FROM notes WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });
  return result.rowsAffected > 0;
}

async function createCategory(name) {
  const db = await getDb();
  const result = await db.execute({ sql: 'INSERT INTO categories (name) VALUES (?)', args: [name] });
  const created = await db.execute({
    sql: 'SELECT * FROM categories WHERE id = ?',
    args: [Number(result.lastInsertRowid)],
  });
  return created.rows[0];
}

async function listCategories() {
  const db = await getDb();
  const result = await db.execute('SELECT * FROM categories ORDER BY id');
  return result.rows;
}

module.exports = {
  createNote,
  listNotes,
  getNote,
  updateNote,
  deleteNote,
  createCategory,
  listCategories,
};
