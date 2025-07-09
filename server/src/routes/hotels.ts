import express from 'express';
import { searchNearbyHotels, getHotelDetails } from '../controllers/hotelController';
import { auth } from '../middleware/auth';
import { getAll, runQuery } from '../database/init';

const router = express.Router();

// Search for nearby hotels
router.get('/nearby', searchNearbyHotels);

// Get detailed information about a specific hotel
router.get('/:place_id', getHotelDetails);

// Add hotel to favorites
router.post('/:placeId/favorite', auth, async (req, res) => {
  try {
    const { placeId } = req.params;
    const { hotelName } = req.body;
    const userId = (req as any).user.id;

    await runQuery(
      'INSERT OR IGNORE INTO user_favorites (user_id, place_id, place_name, place_type) VALUES (?, ?, ?, ?)',
      [userId, placeId, hotelName, 'hotel']
    );

    res.json({ 
      success: true, 
      message: 'Hotel added to favorites' 
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
});

// Remove hotel from favorites
router.delete('/:placeId/favorite', auth, async (req, res) => {
  try {
    const { placeId } = req.params;
    const userId = (req as any).user.id;

    await runQuery(
      'DELETE FROM user_favorites WHERE user_id = ? AND place_id = ? AND place_type = ?',
      [userId, placeId, 'hotel']
    );

    res.json({ 
      success: true, 
      message: 'Hotel removed from favorites' 
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

// Get user's favorite hotels
router.get('/favorites/my', auth, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const favorites = await getAll(
      'SELECT * FROM user_favorites WHERE user_id = ? AND place_type = ? ORDER BY created_at DESC',
      [userId, 'hotel']
    );

    res.json({ success: true, favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

export default router; 