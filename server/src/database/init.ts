import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../database/rest_recommender.db');

export const db = new sqlite3.Database(dbPath);

export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // User reviews table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          place_id TEXT NOT NULL,
          place_name TEXT NOT NULL,
          place_type TEXT NOT NULL,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          review_text TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // User favorites table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          place_id TEXT NOT NULL,
          place_name TEXT NOT NULL,
          place_type TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, place_id)
        )
      `);

      // Search history table
      db.run(`
        CREATE TABLE IF NOT EXISTS search_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          query TEXT NOT NULL,
          location TEXT,
          filters TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Create indexes for better performance
      db.run('CREATE INDEX IF NOT EXISTS idx_user_reviews_user_id ON user_reviews(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_user_reviews_place_id ON user_reviews(place_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id)');

      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('Error enabling foreign keys:', err);
          reject(err);
        } else {
          console.log('✅ Database tables created successfully');
          resolve();
        }
      });
    });
  });
};

// Helper function to run queries with promises
export const runQuery = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Helper function to get single row
export const getRow = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Helper function to get multiple rows
export const getAll = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}; 