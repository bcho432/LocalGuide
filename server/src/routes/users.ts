import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { auth } from '../middleware/auth';
import { runQuery, getRow, getAll } from '../database/init';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await getRow('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await runQuery(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: result.id, email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: result.id,
        name,
        email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await getRow(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user profile (protected route)
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const user = await getRow(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile (protected route)
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { name, email } = req.body;

    // Validate input
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if email is already taken by another user
    const existingUser = await getRow(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already taken' });
    }

    // Update user
    await runQuery(
      'UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, email, userId]
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: { id: userId, name, email }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user's activity (reviews, favorites, search history)
router.get('/activity', auth, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    // Get user's reviews
    const reviews = await getAll(
      'SELECT * FROM user_reviews WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    // Get user's favorites
    const favorites = await getAll(
      'SELECT * FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    // Get search history
    const searchHistory = await getAll(
      'SELECT * FROM search_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    return res.json({
      success: true,
      activity: {
        reviews,
        favorites,
        searchHistory
      }
    });
  } catch (error) {
    console.error('Activity fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Get all user favorites
router.get('/favorites', auth, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const favorites = await getAll(
      'SELECT * FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    return res.json({
      success: true,
      favorites
    });
  } catch (error) {
    console.error('Favorites fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Change password (protected route)
router.put('/change-password', auth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get current user
    const user = await getRow(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await runQuery(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, userId]
    );

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router; 