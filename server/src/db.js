const { createClient } = require('@libsql/client');

// Lokalde diskteki bir dosya, canlida Turso'daki uzak veritabani (libsql://...).
const DEFAULT_DB_URL = 'file:./guestbook.db';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS notes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    content     TEXT    NOT NULL DEFAULT '',
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`;

let _client = null;
let _ready = null;

// Veritabani artik ag uzerinden de olabildigi icin her islem asenkron.
// Ilk cagrida baglanir ve tablolari olusturur; sonraki cagrilar ayni baglantiyi kullanir.
function getDb() {
  if (!_ready) {
    _client = createClient({
      url: process.env.DATABASE_URL || DEFAULT_DB_URL,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
    _ready = _client.executeMultiple(SCHEMA).then(() => _client);
  }
  return _ready;
}

function closeDb() {
  if (_client) {
    _client.close();
    _client = null;
    _ready = null;
  }
}

module.exports = { getDb, closeDb };
