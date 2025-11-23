import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(process.env.DATABASE_PATH || join(__dirname, '../../database.db'));

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      telegram_user_id INTEGER PRIMARY KEY,
      first_name TEXT,
      username TEXT,
      photos TEXT DEFAULT '[]',
      description TEXT DEFAULT '',
      language TEXT DEFAULT 'ru',
      theme TEXT DEFAULT 'light',
      film_grain INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('fuck', 'marry', 'kill')),
      timestamp INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (from_user_id) REFERENCES users(telegram_user_id) ON DELETE CASCADE,
      FOREIGN KEY (to_user_id) REFERENCES users(telegram_user_id) ON DELETE CASCADE,
      UNIQUE(from_user_id, to_user_id)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER NOT NULL,
      user2_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('instant', 'conditional')),
      conditional_confirm_1 INTEGER DEFAULT 0,
      conditional_confirm_2 INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user1_id) REFERENCES users(telegram_user_id) ON DELETE CASCADE,
      FOREIGN KEY (user2_id) REFERENCES users(telegram_user_id) ON DELETE CASCADE,
      UNIQUE(user1_id, user2_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('text', 'photo', 'audio', 'gift')),
      content TEXT NOT NULL,
      blurred INTEGER DEFAULT 0,
      timestamp INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (chat_id) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(telegram_user_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_actions_from ON actions(from_user_id);
    CREATE INDEX IF NOT EXISTS idx_actions_to ON actions(to_user_id);
    CREATE INDEX IF NOT EXISTS idx_actions_composite ON actions(from_user_id, to_user_id);
    CREATE INDEX IF NOT EXISTS idx_matches_users ON matches(user1_id, user2_id);
    CREATE INDEX IF NOT EXISTS idx_matches_type ON matches(type);
    CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
  `);

  console.log('✅ Database initialized');
}

export default db;