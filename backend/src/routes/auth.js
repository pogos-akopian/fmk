import express from 'express';
import db from '../models/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', authMiddleware, (req, res) => {
  try {
    const user = req.telegramUser;
    
    const existing = db.prepare('SELECT * FROM users WHERE telegram_user_id = ?').get(user.id);
    
    if (!existing) {
      db.prepare(`
        INSERT INTO users (telegram_user_id, first_name, username, photos, description, language)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        user.id, 
        user.first_name || '', 
        user.username || '', 
        '[]', 
        '', 
        user.language_code === 'ar' ? 'ar' : (user.language_code === 'en' ? 'en' : 'ru')
      );
    } else {
      // Обновляем timestamp последнего входа
      db.prepare('UPDATE users SET updated_at = strftime("%s", "now") WHERE telegram_user_id = ?')
        .run(user.id);
    }
    
    const userData = db.prepare('SELECT * FROM users WHERE telegram_user_id = ?').get(user.id);
    
    res.json({
      success: true,
      user: {
        ...userData,
        photos: JSON.parse(userData.photos || '[]')
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;