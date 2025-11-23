import express from 'express';
import db from '../models/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', authMiddleware, (req, res) => {
  try {
    const userId = req.telegramUser.id;
    const user = db.prepare('SELECT * FROM users WHERE telegram_user_id = ?').get(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      ...user,
      photos: JSON.parse(user.photos || '[]')
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

router.put('/profile', authMiddleware, (req, res) => {
  try {
    const userId = req.telegramUser.id;
    const { photos, description, language, theme, film_grain } = req.body;
    
    const updates = [];
    const values = [];
    
    if (photos !== undefined) {
      // Ограничиваем до 5 фото
      const limitedPhotos = Array.isArray(photos) ? photos.slice(0, 5) : [];
      updates.push('photos = ?');
      values.push(JSON.stringify(limitedPhotos));
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description.slice(0, 300));
    }
    
    if (language !== undefined && ['ru', 'en', 'ar'].includes(language)) {
      updates.push('language = ?');
      values.push(language);
    }
    
    if (theme !== undefined && ['light', 'dark'].includes(theme)) {
      updates.push('theme = ?');
      values.push(theme);
    }
    
    if (film_grain !== undefined) {
      updates.push('film_grain = ?');
      values.push(film_grain ? 1 : 0);
    }
    
    if (updates.length > 0) {
      updates.push('updated_at = strftime("%s", "now")');
      values.push(userId);
      
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE telegram_user_id = ?`).run(...values);
    }
    
    const updated = db.prepare('SELECT * FROM users WHERE telegram_user_id = ?').get(userId);
    
    res.json({
      success: true,
      user: {
        ...updated,
        photos: JSON.parse(updated.photos || '[]')
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/add-photo', authMiddleware, (req, res) => {
  try {
    const userId = req.telegramUser.id;
    const { photo_url } = req.body;
    
    if (!photo_url) {
      return res.status(400).json({ error: 'Photo URL required' });
    }
    
    const user = db.prepare('SELECT photos FROM users WHERE telegram_user_id = ?').get(userId);
    const photos = JSON.parse(user.photos || '[]');
    
    if (photos.length >= 5) {
      return res.status(400).json({ error: 'Maximum 5 photos allowed' });
    }
    
    photos.push(photo_url);
    
    db.prepare('UPDATE users SET photos = ?, updated_at = strftime("%s", "now") WHERE telegram_user_id = ?')
      .run(JSON.stringify(photos), userId);
    
    res.json({ success: true, photos });
  } catch (error) {
    console.error('Add photo error:', error);
    res.status(500).json({ error: 'Failed to add photo' });
  }
});

router.get('/next', authMiddleware, (req, res) => {
  try {
    const userId = req.telegramUser.id;
    
    // Исключаем: себя, тех кого kill-нули, и тех с кем есть мэтч
    const excludedIds = db.prepare(`
      SELECT DISTINCT to_user_id as id FROM actions 
      WHERE from_user_id = ? AND action = 'kill'
      UNION
      SELECT DISTINCT user2_id as id FROM matches 
      WHERE user1_id = ?
      UNION
      SELECT DISTINCT user1_id as id FROM matches 
      WHERE user2_id = ?
    `).all(userId, userId, userId).map(row => row.id);
    
    excludedIds.push(userId);
    
    const placeholders = excludedIds.map(() => '?').join(',');
    
    // Получаем следующего пользователя с фото
    const nextUser = db.prepare(`
      SELECT * FROM users 
      WHERE telegram_user_id NOT IN (${placeholders})
      AND photos != '[]'
      AND json_array_length(photos) > 0
      ORDER BY RANDOM()
      LIMIT 1
    `).get(...excludedIds);
    
    if (!nextUser) {
      return res.json({ user: null });
    }
    
    res.json({
      user: {
        ...nextUser,
        photos: JSON.parse(nextUser.photos || '[]')
      }
    });
  } catch (error) {
    console.error('Get next user error:', error);
    res.status(500).json({ error: 'Failed to get next user' });
  }
});

export default router;