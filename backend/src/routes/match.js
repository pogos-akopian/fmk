import express from 'express';
import db from '../models/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/list', authMiddleware, (req, res) => {
  try {
    const userId = req.telegramUser.id;
    
    const matches = db.prepare(`
      SELECT m.*, 
             u1.first_name as user1_name, u1.photos as user1_photos,
             u2.first_name as user2_name, u2.photos as user2_photos
      FROM matches m
      JOIN users u1 ON m.user1_id = u1.telegram_user_id
      JOIN users u2 ON m.user2_id = u2.telegram_user_id
      WHERE (m.user1_id = ? OR m.user2_id = ?)
      AND (
        m.type = 'instant' 
        OR (m.type = 'conditional' AND m.conditional_confirm_1 = 1 AND m.conditional_confirm_2 = 1)
      )
      ORDER BY m.created_at DESC
    `).all(userId, userId);
    
    const formatted = matches.map(m => {
      const isUser1 = m.user1_id === userId;
      return {
        id: m.id,
        partnerId: isUser1 ? m.user2_id : m.user1_id,
        partnerName: isUser1 ? m.user2_name : m.user1_name,
        partnerPhotos: JSON.parse(isUser1 ? m.user2_photos : m.user1_photos),
        type: m.type,
        created_at: m.created_at
      };
    });
    
    res.json({ matches: formatted });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to get matches' });
  }
});

router.get('/pending', authMiddleware, (req, res) => {
  try {
    const userId = req.telegramUser.id;
    
    const pending = db.prepare(`
      SELECT m.*, 
             u1.first_name as user1_name, u1.photos as user1_photos,
             u2.first_name as user2_name, u2.photos as user2_photos
      FROM matches m
      JOIN users u1 ON m.user1_id = u1.telegram_user_id
      JOIN users u2 ON m.user2_id = u2.telegram_user_id
      WHERE (m.user1_id = ? OR m.user2_id = ?)
      AND m.type = 'conditional'
      AND NOT (m.conditional_confirm_1 = 1 AND m.conditional_confirm_2 = 1)
      ORDER BY m.created_at DESC
    `).all(userId, userId);
    
    const formatted = pending.map(m => {
      const isUser1 = m.user1_id === userId;
      const myConfirm = isUser1 ? m.conditional_confirm_1 : m.conditional_confirm_2;
      const partnerConfirm = isUser1 ? m.conditional_confirm_2 : m.conditional_confirm_1;
      
      return {
        id: m.id,
        partnerId: isUser1 ? m.user2_id : m.user1_id,
        partnerName: isUser1 ? m.user2_name : m.user1_name,
        partnerPhotos: JSON.parse(isUser1 ? m.user2_photos : m.user1_photos),
        myConfirmed: myConfirm === 1,
        partnerConfirmed: partnerConfirm === 1,
        created_at: m.created_at
      };
    });
    
    res.json({ pending: formatted });
  } catch (error) {
    console.error('Get pending error:', error);
    res.status(500).json({ error: 'Failed to get pending matches' });
  }
});

router.post('/confirm', authMiddleware, (req, res) => {
  try {
    const userId = req.telegramUser.id;
    const { matchId } = req.body;
    
    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    if (match.user1_id !== userId && match.user2_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const isUser1 = match.user1_id === userId;
    const field = isUser1 ? 'conditional_confirm_1' : 'conditional_confirm_2';
    
    db.prepare(`UPDATE matches SET ${field} = 1 WHERE id = ?`).run(matchId);
    
    const updated = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
    const bothConfirmed = updated.conditional_confirm_1 === 1 && updated.conditional_confirm_2 === 1;
    
    res.json({ 
      success: true, 
      bothConfirmed,
      message: bothConfirmed ? 'Чат открыт!' : 'Ожидаем подтверждения партнера'
    });
  } catch (error) {
    console.error('Confirm match error:', error);
    res.status(500).json({ error: 'Failed to confirm match' });
  }
});

router.post('/decline', authMiddleware, (req, res) => {
  try {
    const userId = req.telegramUser.id;
    const { matchId } = req.body;
    
    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    if (match.user1_id !== userId && match.user2_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Удаляем мэтч
    db.prepare('DELETE FROM matches WHERE id = ?').run(matchId);
    
    res.json({ success: true, message: 'Match declined' });
  } catch (error) {
    console.error('Decline match error:', error);
    res.status(500).json({ error: 'Failed to decline match' });
  }
});

export default router;