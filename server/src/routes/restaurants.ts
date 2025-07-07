import express from 'express';
import { getRestaurants, getRestaurantDetails, searchRestaurants, getAddressSuggestions, geocodeLocation } from '../controllers/restaurantController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Get address suggestions for autocomplete
router.get('/autocomplete', getAddressSuggestions);

// Geocode address or place_id to coordinates
router.get('/geocode', geocodeLocation);

// Proxy for Google Directions API
router.get('/directions', async (req, res) => {
  const { origin, destination } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  try {
    const axios = (await import('axios')).default;
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin,
        destination,
        mode: 'driving',
        key: apiKey,
      },
    });
    // Log the full response for debugging
    console.log('Directions API response:', JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching directions:', error);
    res.status(500).json({ error: 'Failed to fetch directions' });
  }
});

// Get restaurants near a location
router.get('/nearby', getRestaurants);

// Search restaurants with filters
router.get('/search', searchRestaurants);

// Get detailed information about a specific restaurant
router.get('/:placeId', getRestaurantDetails);

// Protected routes (require authentication)
router.use(auth);

// Add review to restaurant
router.post('/:placeId/reviews', async (req, res) => {
  try {
    const { placeId } = req.params;
    const { rating, reviewText } = req.body;
    const userId = (req as any).user.id;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get restaurant name from Google Places API
    const restaurantName = req.body.placeName || 'Unknown Restaurant';

    // Save review to database
    const { runQuery } = await import('../database/init');
    await runQuery(
      'INSERT INTO user_reviews (user_id, place_id, place_name, place_type, rating, review_text) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, placeId, restaurantName, 'restaurant', rating, reviewText]
    );

    return res.status(201).json({ 
      success: true, 
      message: 'Review added successfully' 
    });
  } catch (error) {
    console.error('Error adding review:', error);
    return res.status(500).json({ error: 'Failed to add review' });
  }
});

// Get user's reviews for restaurants
router.get('/reviews/my', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { getAll } = await import('../database/init');
    
    const reviews = await getAll(
      'SELECT * FROM user_reviews WHERE user_id = ? AND place_type = ? ORDER BY created_at DESC',
      [userId, 'restaurant']
    );

    res.json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Add restaurant to favorites
router.post('/:placeId/favorite', async (req, res) => {
  try {
    const { placeId } = req.params;
    const userId = (req as any).user.id;
    const restaurantName = req.body.placeName || 'Unknown Restaurant';

    const { runQuery } = await import('../database/init');
    await runQuery(
      'INSERT OR IGNORE INTO user_favorites (user_id, place_id, place_name, place_type) VALUES (?, ?, ?, ?)',
      [userId, placeId, restaurantName, 'restaurant']
    );

    res.json({ 
      success: true, 
      message: 'Restaurant added to favorites' 
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
});

// Remove restaurant from favorites
router.delete('/:placeId/favorite', async (req, res) => {
  try {
    const { placeId } = req.params;
    const userId = (req as any).user.id;

    const { runQuery } = await import('../database/init');
    await runQuery(
      'DELETE FROM user_favorites WHERE user_id = ? AND place_id = ? AND place_type = ?',
      [userId, placeId, 'restaurant']
    );

    res.json({ 
      success: true, 
      message: 'Restaurant removed from favorites' 
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

// Get user's favorite restaurants
router.get('/favorites/my', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { getAll } = await import('../database/init');
    
    const favorites = await getAll(
      'SELECT * FROM user_favorites WHERE user_id = ? AND place_type = ? ORDER BY created_at DESC',
      [userId, 'restaurant']
    );

    res.json({ success: true, favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

export default router; 