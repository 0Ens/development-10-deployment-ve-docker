const { getDb } = require('./db');

function createNote(userId, title, content = '', categoryId = null) {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO notes (user_id, title, content, category_id) VALUES (?, ?, ?, ?)'
  ).run(userId, title, content, categoryId);
  return getNote(userId, result.lastInsertRowid);
}

function listNotes(userId) {
  const db = getDb();
  return db.prepare(`
    SELECT n.id, n.title, n.content, n.category_id, n.created_at,
           c.name AS category_name
    FROM notes n
    LEFT JOIN categories c ON c.id = n.category_id
    WHERE n.user_id = ?
    ORDER BY n.id
  `).all(userId);
}

function getNote(userId, id) {
  const db = getDb();
  return db.prepare(`
    SELECT n.id, n.title, n.content, n.category_id, n.created_at,
           c.name AS category_name
    FROM notes n
    LEFT JOIN categories c ON c.id = n.category_id
    WHERE n.id = ? AND n.user_id = ?
  `).get(id, userId) ?? null;
}

function updateNote(userId, id, title, content, categoryId) {
  const db = getDb();
  const result = db.prepare(
    'UPDATE notes SET title = ?, content = ?, category_id = ? WHERE id = ? AND user_id = ?'
  ).run(title, content, categoryId ?? null, id, userId);
  if (result.changes === 0) return null;
  return getNote(userId, id);
}

function deleteNote(userId, id) {
  const db = getDb();
  const result = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(id, userId);
  return result.changes > 0;
}

function createCategory(name) {
  const db = getDb();
  const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
}

function listCategories() {
  return getDb().prepare('SELECT * FROM categories ORDER BY id').all();
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
