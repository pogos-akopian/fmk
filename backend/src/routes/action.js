import express from 'express';
import db from '../models/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/submit', authMiddleware, (req, res) => {
  try {
    const fromUserId = req.telegramUser.id;
    const { toUserId, action } = req.body;
    
    if (!['fuck', 'marry', 'kill'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    if (fromUserId === toUserId) {
      return res.status(400).json({ error: 'Cannot action yourself' });
    }
    
    // Сохраняем действие
    db.prepare(`
      INSERT OR REPLACE INTO actions (from_user_id, to_user_id, action)
      VALUES (?, ?, ?)
    `).run(fromUserId, toUserId, action);
    
    // Kill = просто скрываем, никаких мэтчей
    if (action === 'kill') {
      return res.json({ success: true, matchType: 'none' });
    }
    
    // Проверяем обратное действие
    const reverseAction = db.prepare(`
      SELECT action FROM actions 
      WHERE from_user_id = ? AND to_user_id = ?
    `).get(toUserId, fromUserId);
    
    if (!reverseAction) {
      return res.json({ success: true, matchType: 'none' });
    }
    
    // Мгновенный мэтч: fuck-fuck или marry-marry
    const instantMatch = 
      (action === 'fuck' && reverseAction.action === 'fuck') ||
      (action === 'marry' && reverseAction.action === 'marry');
    
    // Условный мэтч: fuck-marry или marry-fuck
    const conditionalMatch = 
      (action === 'fuck' && reverseAction.action === 'marry') ||
      (action === 'marry' && reverseAction.action === 'fuck');
    
    if (instantMatch) {
      // Проверяем, нет ли уже мэтча
      const existing = db.prepare(`
        SELECT id FROM matches 
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
      `).get(fromUserId, toUserId, toUserId, fromUserId);
      
      if (!existing) {
        db.prepare(`
          INSERT INTO matches (user1_id, user2_id, type, conditional_confirm_1, conditional_confirm_2)
          VALUES (?, ?, 'instant', 1, 1)
        `).run(fromUserId, toUserId);
      }
      
      return res.json({ 
        success: true, 
        matchType: 'instant', 
        action: action,
        icon: action === 'fuck' ? '🔥' : '💍'
      });
    }
    
    if (conditionalMatch) {
      // Проверяем существующий мэтч
      const existing = db.prepare(`
        SELECT * FROM matches 
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
      `).get(fromUserId, toUserId, toUserId, fromUserId);
      
      if (!existing) {
        db.prepare(`
          INSERT INTO matches (user1_id, user2_id, type, conditional_confirm_1, conditional_confirm_2)
          VALUES (?, ?, 'conditional', 0, 0)
        `).run(fromUserId, toUserId);
      }
      
      return res.json({ 
        success: true, 
        matchType: 'conditional',
        icon: '💬'
      });
    }
    
    res.json({ success: true, matchType: 'none' });
  } catch (error) {
    console.error('Submit action error:', error);
    res.status(500).json({ error: 'Failed to submit action' });
  }
});

export default router;