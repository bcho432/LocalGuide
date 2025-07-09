import express from 'express';
import { getEvents, getEventDetails, searchEvents } from '../controllers/eventController';
import { auth } from '../middleware/auth';
import { getTicketmasterEvents, getTicketmasterEventDetails } from '../controllers/ticketmasterController';

const router = express.Router();

// Public routes
router.get('/nearby', getEvents);
router.get('/search', searchEvents);
router.get('/ticketmaster/nearby', getTicketmasterEvents);
router.get('/ticketmaster/:eventId', getTicketmasterEventDetails);
router.get('/:eventId', getEventDetails);

// Protected routes (require authentication)
router.use(auth);

// Add event to favorites
router.post('/:eventId/favorite', async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = (req as any).user.id;
    const eventName = req.body.eventName || 'Unknown Event';

    const { runQuery } = await import('../database/init');
    await runQuery(
      'INSERT OR IGNORE INTO user_favorites (user_id, place_id, place_name, place_type) VALUES (?, ?, ?, ?)',
      [userId, eventId, eventName, 'event']
    );

    res.json({ 
      success: true, 
      message: 'Event added to favorites' 
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
});

// Remove event from favorites
router.delete('/:eventId/favorite', async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = (req as any).user.id;

    const { runQuery } = await import('../database/init');
    await runQuery(
      'DELETE FROM user_favorites WHERE user_id = ? AND place_id = ? AND place_type = ?',
      [userId, eventId, 'event']
    );

    res.json({ 
      success: true, 
      message: 'Event removed from favorites' 
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

// Get user's favorite events
router.get('/favorites/my', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { getAll } = await import('../database/init');
    
    const favorites = await getAll(
      'SELECT * FROM user_favorites WHERE user_id = ? AND place_type = ? ORDER BY created_at DESC',
      [userId, 'event']
    );

    res.json({ success: true, favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
  });

export default router; 