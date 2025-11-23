import express from 'express';
import db from '../models/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/:matchId/messages', authMiddleware, (req, res) => {
  try {
    const userId = req.telegramUser.id;
    const { matchId } = req.params;
    
    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    if (match.user1_id !== userId && match.user2_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE chat_id = ? 
      ORDER BY timestamp ASC
    `).all(matchId);
    
    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

router.post('/:matchId/message', authMiddleware, (req, res) => {
  try {
    const userId = req.telegramUser.id;
    const { matchId } = req.params;
    const { type, content, blurred } = req.body;
    
    if (!['text', 'photo', 'audio', 'gift'].includes(type)) {
      return res.status(400).json({ error: 'Invalid message type' });
    }
    
    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    if (match.user1_id !== userId && match.user2_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Проверка для файлов
    if (type === 'file') {
      return res.status(400).json({ error: 'File upload is not allowed' });
    }
    
    const result = db.prepare(`
      INSERT INTO messages (chat_id, sender_id, type, content, blurred)
      VALUES (?, ?, ?, ?, ?)
    `).run(matchId, userId, type, content, blurred ? 1 : 0);
    
    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
    
    res.json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.post('/:matchId/toggle-blur/:messageId', authMiddleware, (req, res) => {
  try {
    const userId = req.telegramUser.id;
    const { matchId, messageId } = req.params;
    
    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
    
    if (!match || (match.user1_id !== userId && match.user2_id !== userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const message = db.prepare('SELECT * FROM messages WHERE id = ? AND chat_id = ?')
      .get(messageId, matchId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    const newBlurred = message.blurred === 1 ? 0 : 1;
    db.prepare('UPDATE messages SET blurred = ? WHERE id = ?').run(newBlurred, messageId);
    
    res.json({ success: true, blurred: newBlurred === 1 });
  } catch (error) {
    console.error('Toggle blur error:', error);
    res.status(500).json({ error: 'Failed to toggle blur' });
  }
});

export default router;